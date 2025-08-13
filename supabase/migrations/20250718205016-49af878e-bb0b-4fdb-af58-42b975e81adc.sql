
-- Add password generation tracking columns to license_keys table
ALTER TABLE public.license_keys 
ADD COLUMN password_generation_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN max_password_generations INTEGER NOT NULL DEFAULT 3;

-- Update existing licenses to reflect current state
-- Set generation count based on existing ciphers
UPDATE public.license_keys 
SET password_generation_count = (
    SELECT COALESCE(COUNT(*), 0) 
    FROM public.auth_ciphers 
    WHERE license_key_id = license_keys.id
);

-- Create enhanced reset function with generation limits and cleanup
CREATE OR REPLACE FUNCTION public.reset_auth_cipher_with_limits(license_key_input text, new_password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
  hashed_password TEXT;
  remaining_generations INTEGER;
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
  
  -- Check if generation limit reached
  IF license_record.password_generation_count >= license_record.max_password_generations THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Password generation limit reached. Maximum ' || license_record.max_password_generations || ' generations allowed.',
      'generations_used', license_record.password_generation_count,
      'max_generations', license_record.max_password_generations
    );
  END IF;
  
  -- Hash the new password using bcrypt
  hashed_password := crypt(new_password_hash_input, gen_salt('bf', 12));
  
  -- DELETE all existing ciphers for this license (cleanup old passwords)
  DELETE FROM public.auth_ciphers 
  WHERE license_key_id = license_record.id;
  
  -- DELETE all existing sessions for this license (force re-authentication)
  DELETE FROM public.user_sessions 
  WHERE license_key_id = license_record.id;
  
  -- Create new cipher with hashed password
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password);
  
  -- Increment generation count
  UPDATE public.license_keys 
  SET password_generation_count = password_generation_count + 1
  WHERE id = license_record.id;
  
  -- Calculate remaining generations
  remaining_generations := license_record.max_password_generations - (license_record.password_generation_count + 1);
  
  RETURN jsonb_build_object(
    'success', true,
    'generations_used', license_record.password_generation_count + 1,
    'max_generations', license_record.max_password_generations,
    'remaining_generations', remaining_generations,
    'message', 'Password reset successfully. ' || remaining_generations || ' generations remaining.'
  );
END;
$$;

-- Update create_auth_cipher_enhanced to use the new limits system
CREATE OR REPLACE FUNCTION public.create_auth_cipher_enhanced(license_key_input text, password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
  cipher_id UUID;
  existing_cipher_count INTEGER;
  hashed_password TEXT;
  remaining_generations INTEGER;
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
  
  -- Check if generation limit reached
  IF license_record.password_generation_count >= license_record.max_password_generations THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Password generation limit reached. Maximum ' || license_record.max_password_generations || ' generations allowed.',
      'generations_used', license_record.password_generation_count,
      'max_generations', license_record.max_password_generations
    );
  END IF;
  
  -- Count existing ciphers
  SELECT COUNT(*) INTO existing_cipher_count
  FROM public.auth_ciphers 
  WHERE license_key_id = license_record.id;
  
  -- If ciphers exist, redirect to reset function instead
  IF existing_cipher_count > 0 THEN
    RETURN public.reset_auth_cipher_with_limits(license_key_input, password_hash_input);
  END IF;
  
  -- Hash the password using bcrypt
  hashed_password := crypt(password_hash_input, gen_salt('bf', 12));
  
  -- Create new auth cipher
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password)
  RETURNING id INTO cipher_id;
  
  -- Increment generation count
  UPDATE public.license_keys 
  SET password_generation_count = password_generation_count + 1
  WHERE id = license_record.id;
  
  -- Calculate remaining generations
  remaining_generations := license_record.max_password_generations - (license_record.password_generation_count + 1);
  
  RETURN jsonb_build_object(
    'success', true,
    'cipher_id', cipher_id,
    'license_key_id', license_record.id,
    'generations_used', license_record.password_generation_count + 1,
    'max_generations', license_record.max_password_generations,
    'remaining_generations', remaining_generations,
    'message', 'Password created successfully. ' || remaining_generations || ' generations remaining.'
  );
END;
$$;

-- Function to check generation status for a license
CREATE OR REPLACE FUNCTION public.check_generation_status(license_key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  license_record RECORD;
  remaining_generations INTEGER;
BEGIN
  -- Get license record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'License key not found');
  END IF;
  
  remaining_generations := license_record.max_password_generations - license_record.password_generation_count;
  
  RETURN jsonb_build_object(
    'success', true,
    'generations_used', license_record.password_generation_count,
    'max_generations', license_record.max_password_generations,
    'remaining_generations', remaining_generations,
    'can_generate', remaining_generations > 0
  );
END;
$$;
