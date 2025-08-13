
-- Remove old usage tracking system and focus only on password generation limits
-- Step 1: Remove the old usage tracking columns from license_keys table
ALTER TABLE public.license_keys 
DROP COLUMN IF EXISTS max_uses,
DROP COLUMN IF EXISTS current_uses;

-- Step 2: Reset password generation count for the user's license to a valid number
-- This fixes the issue where generation count was 5 but max is 3
UPDATE public.license_keys 
SET password_generation_count = 3
WHERE password_generation_count > max_password_generations;

-- Step 3: Update create_user_session_enhanced to remove usage increment logic
CREATE OR REPLACE FUNCTION public.create_user_session_enhanced(key_input text, user_email_input text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
  
  -- Generate session token using gen_random_uuid()
  session_token := replace(gen_random_uuid()::text, '-', '');
  
  -- Create session WITHOUT incrementing any usage count
  INSERT INTO public.user_sessions (license_key_id, session_token, expires_at)
  VALUES (license_record.id, session_token, now() + interval '24 hours')
  RETURNING id INTO session_id;
  
  -- NO MORE USAGE INCREMENT - only password generation limits matter
  
  RETURN jsonb_build_object(
    'valid', true, 
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', (now() + interval '24 hours')::text,
    'user_email', COALESCE(license_record.user_email, user_email_input)
  );
END;
$$;

-- Step 4: Update validate_license_key_enhanced to remove usage checks
CREATE OR REPLACE FUNCTION public.validate_license_key_enhanced(key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
BEGIN
  -- Get license key record with user info
  SELECT lk.*, ul.user_email 
  INTO license_record 
  FROM public.license_keys lk
  LEFT JOIN public.user_licenses ul ON lk.id = ul.license_key_id
  WHERE lk.license_key = key_input;
  
  -- Check if key exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid license key');
  END IF;
  
  -- Check if key is paused
  IF license_record.status = 'paused' THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key is paused');
  END IF;
  
  -- Check if key is not active
  IF license_record.status != 'active' OR NOT license_record.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key is inactive');
  END IF;
  
  -- Check if key has expired and update status
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    UPDATE public.license_keys 
    SET status = 'expired' 
    WHERE id = license_record.id;
    RETURN jsonb_build_object('valid', false, 'error', 'License key has expired');
  END IF;
  
  -- NO MORE USAGE LIMIT CHECKS - only password generation limits matter
  
  -- Key is valid
  RETURN jsonb_build_object(
    'valid', true, 
    'key_id', license_record.id,
    'user_email', license_record.user_email,
    'status', license_record.status
  );
END;
$$;

-- Step 5: Update create_user_session to remove usage increment
CREATE OR REPLACE FUNCTION public.create_user_session(key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
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
  
  -- Generate session token using gen_random_uuid()
  session_token := replace(gen_random_uuid()::text, '-', '');
  
  -- Create session WITHOUT incrementing usage count
  INSERT INTO public.user_sessions (license_key_id, session_token, expires_at)
  VALUES (license_record.id, session_token, now() + interval '24 hours')
  RETURNING id INTO session_id;
  
  -- NO MORE USAGE INCREMENT
  
  RETURN jsonb_build_object(
    'valid', true, 
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', (now() + interval '24 hours')::text
  );
END;
$$;

-- Step 6: Update the old validate_license_key function to remove usage checks
CREATE OR REPLACE FUNCTION public.validate_license_key(key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
BEGIN
  -- Get license key record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = key_input;
  
  -- Check if key exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid license key');
  END IF;
  
  -- Check if key is active
  IF NOT license_record.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key is inactive');
  END IF;
  
  -- Check if key has expired
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key has expired');
  END IF;
  
  -- NO MORE USAGE LIMIT CHECKS
  
  -- Key is valid
  RETURN jsonb_build_object('valid', true, 'key_id', license_record.id);
END;
$$;
