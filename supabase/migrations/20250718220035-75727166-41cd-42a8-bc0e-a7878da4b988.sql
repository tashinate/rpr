
-- Add foreign key constraint with cascading delete for url_registry
ALTER TABLE public.url_registry 
ADD CONSTRAINT fk_url_registry_license_key 
FOREIGN KEY (license_key_id) 
REFERENCES public.license_keys(id) 
ON DELETE CASCADE;

-- Create function to deactivate URLs for invalid licenses
CREATE OR REPLACE FUNCTION public.deactivate_urls_for_license(license_key_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deactivated_count INTEGER;
BEGIN
  UPDATE public.url_registry
  SET is_active = false
  WHERE license_key_id = license_key_id_input
  AND is_active = true;
  
  GET DIAGNOSTICS deactivated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deactivated_count', deactivated_count
  );
END;
$$;

-- Update toggle_license_status function to handle URL deactivation
CREATE OR REPLACE FUNCTION public.toggle_license_status(license_id uuid, new_status license_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  url_result JSONB;
BEGIN
  UPDATE public.license_keys 
  SET status = new_status
  WHERE id = license_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'License not found');
  END IF;
  
  -- Deactivate URLs if license is paused or expired
  IF new_status IN ('paused', 'expired') THEN
    SELECT public.deactivate_urls_for_license(license_id) INTO url_result;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', 'License status updated',
    'urls_deactivated', COALESCE((url_result->>'deactivated_count')::integer, 0)
  );
END;
$$;

-- Update cleanup_expired_licenses function to handle URL deactivation
CREATE OR REPLACE FUNCTION public.cleanup_expired_licenses()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  updated_count INTEGER;
  deleted_count INTEGER;
  expired_license RECORD;
BEGIN
  -- First, update expired licenses to 'expired' status and deactivate their URLs
  FOR expired_license IN 
    SELECT id FROM public.license_keys 
    WHERE expires_at IS NOT NULL 
    AND expires_at < now()
    AND status != 'expired'
  LOOP
    -- Update license status
    UPDATE public.license_keys 
    SET status = 'expired'
    WHERE id = expired_license.id;
    
    -- Deactivate associated URLs
    PERFORM public.deactivate_urls_for_license(expired_license.id);
    
    updated_count := updated_count + 1;
  END LOOP;
  
  -- Then delete old expired licenses (older than 30 days)
  -- The CASCADE constraint will automatically clean up URLs
  WITH deleted_licenses AS (
    DELETE FROM public.license_keys 
    WHERE expires_at IS NOT NULL 
    AND expires_at < (now() - interval '30 days')
    AND status = 'expired'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted_licenses;
  
  -- Clean up orphaned user_licenses and user_sessions
  DELETE FROM public.user_licenses 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  DELETE FROM public.user_sessions 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  RETURN COALESCE(updated_count, 0) + COALESCE(deleted_count, 0);
END;
$$;

-- Update bulk_toggle_license_status function to handle URL deactivation
CREATE OR REPLACE FUNCTION public.bulk_toggle_license_status(license_ids uuid[], new_status license_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  updated_count INTEGER := 0;
  total_urls_deactivated INTEGER := 0;
  license_id UUID;
  url_result JSONB;
BEGIN
  UPDATE public.license_keys 
  SET status = new_status
  WHERE id = ANY(license_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- If pausing or expiring licenses, deactivate their URLs
  IF new_status IN ('paused', 'expired') THEN
    FOREACH license_id IN ARRAY license_ids
    LOOP
      SELECT public.deactivate_urls_for_license(license_id) INTO url_result;
      total_urls_deactivated := total_urls_deactivated + COALESCE((url_result->>'deactivated_count')::integer, 0);
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'new_status', new_status,
    'total_requested', array_length(license_ids, 1),
    'urls_deactivated', total_urls_deactivated
  );
END;
$$;

-- Update get_license_from_url function to permanently deactivate invalid URLs
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
  -- Get URL registry record
  SELECT * INTO registry_record
  FROM public.url_registry
  WHERE url_hash = url_hash_input
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'URL not found in registry');
  END IF;
  
  -- Check if URL has expired
  IF registry_record.expires_at IS NOT NULL AND registry_record.expires_at < now() THEN
    -- Deactivate expired URL
    UPDATE public.url_registry SET is_active = false WHERE id = registry_record.id;
    RETURN jsonb_build_object('valid', false, 'error', 'URL has expired');
  END IF;
  
  -- Get license record
  SELECT * INTO license_record
  FROM public.license_keys
  WHERE id = registry_record.license_key_id
  AND status = 'active'
  AND is_active = true;
  
  IF NOT FOUND THEN
    -- Deactivate URL for deleted/inactive license
    UPDATE public.url_registry SET is_active = false WHERE id = registry_record.id;
    RETURN jsonb_build_object('valid', false, 'error', 'License deleted or inactive');
  END IF;
  
  -- Check if license has expired
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    -- Deactivate URL for expired license
    UPDATE public.url_registry SET is_active = false WHERE id = registry_record.id;
    RETURN jsonb_build_object('valid', false, 'error', 'License expired');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'license_id', license_record.id,
    'license_key', license_record.license_key,
    'original_url', registry_record.original_url
  );
END;
$$;

-- Create automated cleanup function for old deactivated URLs
CREATE OR REPLACE FUNCTION public.cleanup_deactivated_urls(days_old integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete deactivated URLs older than specified days
  DELETE FROM public.url_registry 
  WHERE is_active = false 
  AND created_at < (now() - (days_old || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_urls', deleted_count,
    'message', 'Old deactivated URLs cleaned successfully'
  );
END;
$$;

-- Update auto_cleanup_expired_data function to include URL cleanup
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Clean up expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() - interval '7 days';
  
  -- Clean up old visit stats
  DELETE FROM public.user_visit_stats 
  WHERE visit_date < CURRENT_DATE - interval '30 days';
  
  -- Clean up orphaned user_licenses
  DELETE FROM public.user_licenses 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  -- Clean up old deactivated URLs (30 days old)
  PERFORM public.cleanup_deactivated_urls(30);
END;
$$;
