-- Fix CASCADE DELETE constraints for proper session cleanup
-- This ensures that when a license is deleted, all related sessions are automatically deleted

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE public.user_sessions 
DROP CONSTRAINT IF EXISTS user_sessions_license_key_id_fkey;

-- Add the proper CASCADE DELETE constraint
ALTER TABLE public.user_sessions 
ADD CONSTRAINT user_sessions_license_key_id_fkey 
FOREIGN KEY (license_key_id) 
REFERENCES public.license_keys(id) 
ON DELETE CASCADE;

-- Same for user_licenses table
ALTER TABLE public.user_licenses 
DROP CONSTRAINT IF EXISTS user_licenses_license_key_id_fkey;

ALTER TABLE public.user_licenses 
ADD CONSTRAINT user_licenses_license_key_id_fkey 
FOREIGN KEY (license_key_id) 
REFERENCES public.license_keys(id) 
ON DELETE CASCADE;

-- Same for user_telegram_configs table
ALTER TABLE public.user_telegram_configs 
DROP CONSTRAINT IF EXISTS user_telegram_configs_license_key_id_fkey;

ALTER TABLE public.user_telegram_configs 
ADD CONSTRAINT user_telegram_configs_license_key_id_fkey 
FOREIGN KEY (license_key_id) 
REFERENCES public.license_keys(id) 
ON DELETE CASCADE;

-- Same for user_visit_stats table
ALTER TABLE public.user_visit_stats 
DROP CONSTRAINT IF EXISTS user_visit_stats_license_key_id_fkey;

ALTER TABLE public.user_visit_stats 
ADD CONSTRAINT user_visit_stats_license_key_id_fkey 
FOREIGN KEY (license_key_id) 
REFERENCES public.license_keys(id) 
ON DELETE CASCADE;

-- Same for auth_ciphers table
ALTER TABLE public.auth_ciphers 
DROP CONSTRAINT IF EXISTS auth_ciphers_license_key_id_fkey;

ALTER TABLE public.auth_ciphers 
ADD CONSTRAINT auth_ciphers_license_key_id_fkey 
FOREIGN KEY (license_key_id) 
REFERENCES public.license_keys(id) 
ON DELETE CASCADE;

-- Create function to validate session with license existence check
CREATE OR REPLACE FUNCTION public.validate_session_with_license(session_token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  session_record RECORD;
  license_record RECORD;
BEGIN
  -- Get session record
  SELECT * INTO session_record
  FROM public.user_sessions
  WHERE session_token = session_token_input
  AND is_active = true
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Session not found or expired');
  END IF;
  
  -- Check if the license still exists and is active
  SELECT * INTO license_record
  FROM public.license_keys
  WHERE id = session_record.license_key_id
  AND status = 'active'
  AND is_active = true;
  
  IF NOT FOUND THEN
    -- License deleted or inactive - invalidate session
    DELETE FROM public.user_sessions 
    WHERE session_token = session_token_input;
    
    RETURN jsonb_build_object('valid', false, 'error', 'License deleted or inactive');
  END IF;
  
  -- Check if license expired
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    -- License expired - invalidate session
    DELETE FROM public.user_sessions 
    WHERE session_token = session_token_input;
    
    RETURN jsonb_build_object('valid', false, 'error', 'License expired');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'license_id', license_record.id,
    'license_status', license_record.status
  );
END;
$$;

-- Create function to cleanup orphaned sessions
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_sessions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete sessions where license no longer exists
  DELETE FROM public.user_sessions 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_sessions', deleted_count
  );
END;
$$;