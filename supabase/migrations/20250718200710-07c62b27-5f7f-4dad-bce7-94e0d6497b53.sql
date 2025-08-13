
-- Phase 1: Security Fix - Password Hashing
-- First, let's safely hash all existing plain text passwords in auth_ciphers table

-- Update existing plain text passwords to bcrypt hashes
UPDATE public.auth_ciphers 
SET password_hash = crypt(password_hash, gen_salt('bf', 12))
WHERE length(password_hash) < 60; -- bcrypt hashes are 60 characters, plain text will be shorter

-- Phase 2: Update create_auth_cipher_enhanced to use proper bcrypt hashing
CREATE OR REPLACE FUNCTION public.create_auth_cipher_enhanced(license_key_input text, password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
  cipher_id UUID;
  existing_cipher_id UUID;
  hashed_password TEXT;
BEGIN
  -- Validate license key exists and is active
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input 
  AND status = 'active' 
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive license key');
  END IF;
  
  -- Hash the password using bcrypt with salt rounds 12
  hashed_password := crypt(password_hash_input, gen_salt('bf', 12));
  
  -- Check if this exact password already exists for this license
  SELECT id INTO existing_cipher_id
  FROM public.auth_ciphers 
  WHERE license_key_id = license_record.id 
  AND password_hash = hashed_password;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password already exists for this license key');
  END IF;
  
  -- Create new auth cipher with hashed password
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password)
  RETURNING id INTO cipher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cipher_id', cipher_id,
    'license_key_id', license_record.id
  );
END;
$$;

-- Update create_auth_cipher to use proper bcrypt hashing
CREATE OR REPLACE FUNCTION public.create_auth_cipher(license_key_input text, password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
  cipher_id UUID;
  hashed_password TEXT;
BEGIN
  -- Validate license key exists and is active
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input 
  AND status = 'active' 
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive license key');
  END IF;
  
  -- Check if cipher already exists for this license
  IF EXISTS (SELECT 1 FROM public.auth_ciphers WHERE license_key_id = license_record.id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cipher already exists for this license key');
  END IF;
  
  -- Hash the password using bcrypt with salt rounds 12
  hashed_password := crypt(password_hash_input, gen_salt('bf', 12));
  
  -- Create auth cipher with hashed password
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password)
  RETURNING id INTO cipher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cipher_id', cipher_id,
    'license_key_id', license_record.id
  );
END;
$$;

-- Update reset_auth_cipher to use proper bcrypt hashing
CREATE OR REPLACE FUNCTION public.reset_auth_cipher(license_key_input text, new_password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
  hashed_password TEXT;
BEGIN
  -- Validate license key exists and is active
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input 
  AND status = 'active' 
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive license key');
  END IF;
  
  -- Hash the new password using bcrypt with salt rounds 12
  hashed_password := crypt(new_password_hash_input, gen_salt('bf', 12));
  
  -- Update existing cipher or create new one with hashed password
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password)
  ON CONFLICT (license_key_id)
  DO UPDATE SET
    password_hash = hashed_password,
    attempt_count = 0,
    last_attempt_at = null,
    updated_at = now();
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Update authenticate_user_session to properly verify bcrypt passwords
CREATE OR REPLACE FUNCTION public.authenticate_user_session(password_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  cipher_record RECORD;
  session_token TEXT;
  session_id UUID;
  is_valid_password BOOLEAN := FALSE;
BEGIN
  -- Loop through all active ciphers to find a matching password
  FOR cipher_record IN 
    SELECT ac.*, lk.license_key 
    FROM public.auth_ciphers ac
    JOIN public.license_keys lk ON ac.license_key_id = lk.id
    WHERE lk.status = 'active'
    AND lk.is_active = true
    ORDER BY ac.created_at DESC
  LOOP
    -- Use crypt() function to verify password against stored bcrypt hash
    IF crypt(password_input, cipher_record.password_hash) = cipher_record.password_hash THEN
      is_valid_password := TRUE;
      EXIT; -- Exit loop when password match is found
    END IF;
  END LOOP;
  
  IF NOT is_valid_password THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid password or inactive license');
  END IF;
  
  -- Reset attempt count on successful validation
  UPDATE public.auth_ciphers 
  SET attempt_count = 0, last_attempt_at = now()
  WHERE id = cipher_record.id;
  
  -- Generate session token using gen_random_uuid()
  session_token := replace(gen_random_uuid()::text, '-', '');
  
  -- Create session WITHOUT incrementing usage count
  INSERT INTO public.user_sessions (license_key_id, session_token, expires_at)
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
$$;

-- Phase 3: Add proper database constraints and indexes
-- Add unique constraint to ensure one cipher per license (adjust based on requirements)
ALTER TABLE public.auth_ciphers 
DROP CONSTRAINT IF EXISTS auth_ciphers_license_key_id_key;

-- Add it back if single password per license is desired
ALTER TABLE public.auth_ciphers 
ADD CONSTRAINT auth_ciphers_license_key_id_key UNIQUE (license_key_id);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_auth_ciphers_license_key_id ON public.auth_ciphers(license_key_id);
CREATE INDEX IF NOT EXISTS idx_auth_ciphers_created_at ON public.auth_ciphers(created_at);
CREATE INDEX IF NOT EXISTS idx_license_keys_status_active ON public.license_keys(status, is_active) WHERE status = 'active' AND is_active = true;
