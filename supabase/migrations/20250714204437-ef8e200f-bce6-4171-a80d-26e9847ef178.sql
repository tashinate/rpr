-- Fix function search_path security warnings by setting search_path to empty
-- This prevents potential security issues with function search paths

-- Update the update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Update the validate_license_key function
CREATE OR REPLACE FUNCTION public.validate_license_key(key_input TEXT)
RETURNS JSONB AS $$
DECLARE
  license_record RECORD;
  result JSONB;
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
  
  -- Check if key has reached max uses
  IF license_record.max_uses IS NOT NULL AND license_record.current_uses >= license_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key usage limit reached');
  END IF;
  
  -- Key is valid
  RETURN jsonb_build_object('valid', true, 'key_id', license_record.id);
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Update the create_user_session function
CREATE OR REPLACE FUNCTION public.create_user_session(key_input TEXT)
RETURNS JSONB AS $$
DECLARE
  license_record RECORD;
  session_token TEXT;
  session_id UUID;
  validation_result JSONB;
BEGIN
  -- Validate the license key first
  validation_result := public.validate_license_key(key_input);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RETURN validation_result;
  END IF;
  
  -- Get license key record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = key_input;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'hex');
  
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
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';