-- Fix create_auth_cipher_enhanced function with correct schema reference for extensions
CREATE OR REPLACE FUNCTION public.create_auth_cipher_enhanced(license_key_input text, password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- Hash the password using bcrypt with correct extensions schema prefix
  hashed_password := extensions.crypt(password_hash_input, extensions.gen_salt('bf', 12));
  
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
$function$;

-- Also fix reset_auth_cipher_with_limits function
CREATE OR REPLACE FUNCTION public.reset_auth_cipher_with_limits(license_key_input text, new_password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- Hash the new password using bcrypt with correct extensions schema prefix
  hashed_password := extensions.crypt(new_password_hash_input, extensions.gen_salt('bf', 12));
  
  -- Update existing cipher or create new one
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, hashed_password)
  ON CONFLICT (license_key_id)
  DO UPDATE SET
    password_hash = hashed_password,
    attempt_count = 0,
    last_attempt_at = null,
    updated_at = now();
  
  -- Increment generation count
  UPDATE public.license_keys 
  SET password_generation_count = password_generation_count + 1
  WHERE id = license_record.id;
  
  -- Calculate remaining generations
  remaining_generations := license_record.max_password_generations - (license_record.password_generation_count + 1);
  
  RETURN jsonb_build_object(
    'success', true,
    'license_key_id', license_record.id,
    'generations_used', license_record.password_generation_count + 1,
    'max_generations', license_record.max_password_generations,
    'remaining_generations', remaining_generations,
    'message', 'Password reset successfully. ' || remaining_generations || ' generations remaining.'
  );
END;
$function$;