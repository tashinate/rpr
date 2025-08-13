-- Enhanced License Management System
-- Phase 1: Database Schema Enhancements

-- Add license status enum
CREATE TYPE public.license_status AS ENUM ('active', 'paused', 'expired');

-- Create user_licenses table for one license per user enforcement
CREATE TABLE public.user_licenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL UNIQUE,
  license_key_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (license_key_id) REFERENCES public.license_keys(id) ON DELETE CASCADE
);

-- Add status column and expiry preset to license_keys
ALTER TABLE public.license_keys 
ADD COLUMN status public.license_status NOT NULL DEFAULT 'active',
ADD COLUMN expiry_preset TEXT,
ADD COLUMN assigned_user_email TEXT;

-- Create automatic cleanup function for expired licenses
CREATE OR REPLACE FUNCTION public.cleanup_expired_licenses()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired licenses and their associated sessions
  WITH deleted_licenses AS (
    DELETE FROM public.license_keys 
    WHERE expires_at IS NOT NULL 
    AND expires_at < now()
    AND status = 'expired'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted_licenses;
  
  -- Clean up orphaned user_licenses
  DELETE FROM public.user_licenses 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Enhanced license validation function
CREATE OR REPLACE FUNCTION public.validate_license_key_enhanced(key_input TEXT)
RETURNS JSONB AS $$
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
  
  -- Check if key has reached max uses
  IF license_record.max_uses IS NOT NULL AND license_record.current_uses >= license_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key usage limit reached');
  END IF;
  
  -- Key is valid
  RETURN jsonb_build_object(
    'valid', true, 
    'key_id', license_record.id,
    'user_email', license_record.user_email,
    'status', license_record.status
  );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Enhanced session creation function
CREATE OR REPLACE FUNCTION public.create_user_session_enhanced(key_input TEXT, user_email_input TEXT DEFAULT NULL)
RETURNS JSONB AS $$
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

-- Function to pause/resume license
CREATE OR REPLACE FUNCTION public.toggle_license_status(license_id UUID, new_status public.license_status)
RETURNS JSONB AS $$
BEGIN
  UPDATE public.license_keys 
  SET status = new_status, updated_at = now()
  WHERE id = license_id;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', true, 'message', 'License status updated');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'License not found');
  END IF;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Function to generate license with preset expiry
CREATE OR REPLACE FUNCTION public.generate_license_with_preset(
  preset TEXT,
  user_email_input TEXT DEFAULT NULL,
  max_uses_input INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  new_license_key TEXT;
  expiry_date TIMESTAMP WITH TIME ZONE;
  license_id UUID;
BEGIN
  -- Check if user already has a license
  IF user_email_input IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_licenses WHERE user_email = user_email_input) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a license key');
  END IF;
  
  -- Generate license key
  new_license_key := upper(substring(encode(gen_random_bytes(16), 'hex') from 1 for 24));
  
  -- Calculate expiry based on preset
  CASE preset
    WHEN '1_day' THEN expiry_date := now() + interval '1 day';
    WHEN '2_days' THEN expiry_date := now() + interval '2 days';
    WHEN '1_week' THEN expiry_date := now() + interval '7 days';
    WHEN '1_month' THEN expiry_date := now() + interval '30 days';
    WHEN '1_year' THEN expiry_date := now() + interval '365 days';
    WHEN 'lifetime' THEN expiry_date := NULL;
    ELSE expiry_date := now() + interval '30 days'; -- default to 1 month
  END CASE;
  
  -- Insert license
  INSERT INTO public.license_keys (
    license_key, 
    expires_at, 
    max_uses, 
    expiry_preset, 
    assigned_user_email,
    status
  )
  VALUES (
    new_license_key, 
    expiry_date, 
    max_uses_input, 
    preset, 
    user_email_input,
    'active'
  )
  RETURNING id INTO license_id;
  
  -- If user email provided, create user_licenses entry
  IF user_email_input IS NOT NULL THEN
    INSERT INTO public.user_licenses (user_email, license_key_id)
    VALUES (user_email_input, license_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'license_key', new_license_key,
    'license_id', license_id,
    'expires_at', expiry_date,
    'preset', preset
  );
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = '';

-- Enable pg_cron extension for automatic cleanup (requires superuser privileges)
-- This will be handled separately in Supabase dashboard

-- Update triggers for automatic timestamp updates
CREATE TRIGGER update_user_licenses_updated_at
  BEFORE UPDATE ON public.user_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_license_keys_status ON public.license_keys(status);
CREATE INDEX idx_license_keys_expires_at ON public.license_keys(expires_at);
CREATE INDEX idx_user_licenses_email ON public.user_licenses(user_email);

-- Enable RLS on user_licenses table
ALTER TABLE public.user_licenses ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_licenses
CREATE POLICY "User licenses are readable by everyone for validation"
ON public.user_licenses FOR SELECT USING (true);

CREATE POLICY "User licenses can be created during license assignment"
ON public.user_licenses FOR INSERT WITH CHECK (true);

CREATE POLICY "User licenses can be updated"
ON public.user_licenses FOR UPDATE USING (true);