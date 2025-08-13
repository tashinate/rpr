-- Fix cipher creation functions to use pgcrypto properly
CREATE OR REPLACE FUNCTION public.create_auth_cipher(license_key_input text, password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- Hash the password using bcrypt
  hashed_password := public.crypt(password_hash_input, public.gen_salt('bf', 12));
  
  -- Create auth cipher
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password)
  RETURNING id INTO cipher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cipher_id', cipher_id,
    'license_key_id', license_record.id
  );
END;
$function$;

-- Fix enhanced cipher creation function
CREATE OR REPLACE FUNCTION public.create_auth_cipher_enhanced(license_key_input text, password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- Hash the password using bcrypt
  hashed_password := public.crypt(password_hash_input, public.gen_salt('bf', 12));
  
  -- Check if this exact password already exists for this license
  SELECT id INTO existing_cipher_id
  FROM public.auth_ciphers 
  WHERE license_key_id = license_record.id 
  AND password_hash = hashed_password;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password already exists for this license key');
  END IF;
  
  -- Create new auth cipher (multiple allowed per license)
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password)
  RETURNING id INTO cipher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cipher_id', cipher_id,
    'license_key_id', license_record.id
  );
END;
$function$;

-- Fix reset function
CREATE OR REPLACE FUNCTION public.reset_auth_cipher(license_key_input text, new_password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- Hash the password using bcrypt
  hashed_password := public.crypt(new_password_hash_input, public.gen_salt('bf', 12));
  
  -- Update existing cipher or create new one
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
$function$;