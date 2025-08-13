-- Fix session token generation functions to use gen_random_uuid() instead of gen_random_bytes

-- Update create_user_session function
CREATE OR REPLACE FUNCTION public.create_user_session(key_input text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  license_record RECORD;
  session_token TEXT;
  session_id UUID;
  validation_result JSONB;
BEGIN
  -- Validate the license key first using enhanced validation
  validation_result := public.validate_license_key_enhanced(key_input);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RETURN validation_result;
  END IF;
  
  -- Get license key record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = key_input;
  
  -- Generate session token using gen_random_uuid() instead of gen_random_bytes
  session_token := replace(gen_random_uuid()::text, '-', '');
  
  -- Create session
  INSERT INTO public.user_sessions (license_key_id, session_token, expires_at)
  VALUES (license_record.id, session_token, now() + interval '24 hours')
  RETURNING id INTO session_id;
  
  -- Increment usage count
  UPDATE public.license_keys 
  SET current_uses = current_uses + 1 
  WHERE id = license_record.id;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', (now() + interval '24 hours')::text
  );
END;
$function$;

-- Update create_user_session_enhanced function
CREATE OR REPLACE FUNCTION public.create_user_session_enhanced(key_input text, user_email_input text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  license_record RECORD;
  session_token TEXT;
  session_id UUID;
  validation_result JSONB;
BEGIN
  -- Validate the license key first
  validation_result := public.validate_license_key_enhanced(key_input);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RETURN validation_result;
  END IF;
  
  -- Get license key record
  SELECT lk.*, ul.user_email 
  INTO license_record 
  FROM public.license_keys lk
  LEFT JOIN public.user_licenses ul ON lk.id = ul.license_key_id
  WHERE lk.license_key = key_input;
  
  -- If user_email is provided and license doesn't have a user, assign it
  IF user_email_input IS NOT NULL AND license_record.user_email IS NULL THEN
    -- Check if user already has a license
    IF EXISTS (SELECT 1 FROM public.user_licenses WHERE user_email = user_email_input) THEN
      RETURN jsonb_build_object('valid', false, 'error', 'User already has a license key');
    END IF;
    
    -- Assign license to user
    INSERT INTO public.user_licenses (user_email, license_key_id)
    VALUES (user_email_input, license_record.id);
    
    UPDATE public.license_keys 
    SET assigned_user_email = user_email_input
    WHERE id = license_record.id;
  END IF;
  
  -- Generate session token using gen_random_uuid() instead of gen_random_bytes
  session_token := replace(gen_random_uuid()::text, '-', '');
  
  -- Create session
  INSERT INTO public.user_sessions (license_key_id, session_token, expires_at)
  VALUES (license_record.id, session_token, now() + interval '24 hours')
  RETURNING id INTO session_id;
  
  -- Increment usage count
  UPDATE public.license_keys 
  SET current_uses = current_uses + 1 
  WHERE id = license_record.id;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', (now() + interval '24 hours')::text,
    'user_email', COALESCE(license_record.user_email, user_email_input)
  );
END;
$function$;