-- Fix authentication function to use proper schema access for pgcrypto
CREATE OR REPLACE FUNCTION public.authenticate_user_session(password_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  cipher_record RECORD;
  license_record RECORD;
  session_token TEXT;
  session_id UUID;
  is_valid_password BOOLEAN := FALSE;
BEGIN
  -- Loop through all active ciphers to find a matching password
  FOR cipher_record IN 
    SELECT ac.*, lk.license_key 
    FROM auth_ciphers ac
    JOIN license_keys lk ON ac.license_key_id = lk.id
    WHERE lk.status = 'active'
    AND lk.is_active = true
    ORDER BY ac.created_at DESC
  LOOP
    -- Use crypt() function to verify password against stored hash
    IF crypt(password_input, cipher_record.password_hash) = cipher_record.password_hash THEN
      is_valid_password := TRUE;
      EXIT; -- Exit loop when password match is found
    END IF;
  END LOOP;
  
  IF NOT is_valid_password THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid password or inactive license');
  END IF;
  
  -- Reset attempt count on successful validation
  UPDATE auth_ciphers 
  SET attempt_count = 0, last_attempt_at = now()
  WHERE id = cipher_record.id;
  
  -- Generate session token using gen_random_uuid()
  session_token := replace(gen_random_uuid()::text, '-', '');
  
  -- Create session WITHOUT incrementing usage count
  INSERT INTO user_sessions (license_key_id, session_token, expires_at)
  VALUES (cipher_record.license_key_id, session_token, now() + interval '24 hours')
  RETURNING id INTO session_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'license_key', cipher_record.license_key,
    'license_key_id', cipher_record.license_key_id,
    'cipher_id', cipher_record.id,
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', (now() + interval '24 hours')::text
  );
END;
$function$;