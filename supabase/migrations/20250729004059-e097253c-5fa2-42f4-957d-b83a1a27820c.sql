CREATE OR REPLACE FUNCTION public.authenticate_user_session(password_hash_input text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  cipher_record RECORD;
  license_record RECORD;
BEGIN
  -- Find matching cipher by password hash from any license (regardless of status)
  SELECT ac.*, lk.license_key, lk.status, lk.is_active, lk.expires_at
  INTO cipher_record
  FROM public.auth_ciphers ac
  JOIN public.license_keys lk ON ac.license_key_id = lk.id
  WHERE ac.password_hash = password_hash_input
  ORDER BY ac.created_at DESC -- Get the most recent cipher if multiple exist
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid password');
  END IF;
  
  -- Check license status before allowing authentication
  IF cipher_record.status = 'paused' THEN
    RETURN jsonb_build_object('success', false, 'error', 'License is paused');
  END IF;
  
  IF NOT cipher_record.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'License is inactive');
  END IF;
  
  IF cipher_record.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'License is inactive');
  END IF;
  
  -- Check if license has expired
  IF cipher_record.expires_at IS NOT NULL AND cipher_record.expires_at < now() THEN
    -- Update status to expired
    UPDATE public.license_keys 
    SET status = 'expired' 
    WHERE id = cipher_record.license_key_id;
    
    RETURN jsonb_build_object('success', false, 'error', 'License has expired');
  END IF;
  
  -- If we get here, license is active and valid - reset attempt count
  UPDATE public.auth_ciphers 
  SET attempt_count = 0, last_attempt_at = now()
  WHERE id = cipher_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'license_key', cipher_record.license_key,
    'license_key_id', cipher_record.license_key_id,
    'cipher_id', cipher_record.id
  );
END;
$function$