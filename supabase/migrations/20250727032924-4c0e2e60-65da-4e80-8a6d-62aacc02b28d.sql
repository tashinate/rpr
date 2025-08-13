-- Add function to reactivate URLs for a license
CREATE OR REPLACE FUNCTION public.reactivate_urls_for_license(license_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Reactivate all URLs associated with the license
  UPDATE public.url_registry 
  SET is_active = true
  WHERE license_key_id = license_id_input
  AND is_active = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'reactivated_urls', updated_count,
    'license_id', license_id_input
  );
END;
$$;

-- Update toggle_license_status to handle URL reactivation
CREATE OR REPLACE FUNCTION public.toggle_license_status(license_id uuid, new_status license_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  UPDATE public.license_keys 
  SET status = new_status
  WHERE id = license_id;
  
  IF FOUND THEN
    -- If license is paused or expired, deactivate all associated URLs
    IF new_status IN ('paused', 'expired') THEN
      PERFORM public.deactivate_urls_for_license(license_id);
    -- If license is activated, reactivate all associated URLs
    ELSIF new_status = 'active' THEN
      PERFORM public.reactivate_urls_for_license(license_id);
    END IF;
    
    RETURN jsonb_build_object('success', true, 'message', 'License status updated and URLs managed');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'License not found');
  END IF;
END;
$$;

-- Enhanced get_license_from_url to handle reactivation
CREATE OR REPLACE FUNCTION public.get_license_from_url(url_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  registry_record RECORD;
  license_record RECORD;
BEGIN
  -- Get URL registry record (including inactive ones)
  SELECT * INTO registry_record
  FROM public.url_registry
  WHERE url_hash = url_hash_input;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'URL not found in registry');
  END IF;
  
  -- Check if URL has expired
  IF registry_record.expires_at IS NOT NULL AND registry_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'URL has expired');
  END IF;
  
  -- Get license record
  SELECT * INTO license_record
  FROM public.license_keys
  WHERE id = registry_record.license_key_id
  AND status = 'active'
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License deleted or inactive');
  END IF;
  
  -- Check if license has expired
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License expired');
  END IF;
  
  -- If URL is inactive but license is active, reactivate the URL
  IF NOT registry_record.is_active THEN
    UPDATE public.url_registry 
    SET is_active = true 
    WHERE url_hash = url_hash_input;
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'license_id', license_record.id,
    'license_key', license_record.license_key,
    'original_url', registry_record.original_url,
    'was_reactivated', NOT registry_record.is_active
  );
END;
$$;

-- Comprehensive cleanup function
CREATE OR REPLACE FUNCTION public.comprehensive_cleanup()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  sessions_deleted INTEGER := 0;
  errors_deleted INTEGER := 0;
  orphaned_deleted INTEGER := 0;
  total_cleaned INTEGER := 0;
BEGIN
  -- Clean up expired sessions older than 1 day
  DELETE FROM public.user_sessions 
  WHERE expires_at < (now() - interval '1 day');
  GET DIAGNOSTICS sessions_deleted = ROW_COUNT;
  
  -- Clean up spam error logs
  DELETE FROM public.system_error_logs 
  WHERE error_type IN ('telegram_send', 'telegram_config', 'telegram_notification')
  OR (error_type = 'dead_url' AND created_at < (now() - interval '1 day'));
  GET DIAGNOSTICS errors_deleted = ROW_COUNT;
  
  -- Clean up orphaned sessions
  DELETE FROM public.user_sessions 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  GET DIAGNOSTICS orphaned_deleted = ROW_COUNT;
  
  total_cleaned := sessions_deleted + errors_deleted + orphaned_deleted;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_cleaned', total_cleaned,
    'expired_sessions_deleted', sessions_deleted,
    'spam_errors_deleted', errors_deleted,
    'orphaned_sessions_deleted', orphaned_deleted,
    'message', 'Comprehensive cleanup completed successfully'
  );
END;
$$;