
-- Function for bulk deleting licenses with proper cleanup
CREATE OR REPLACE FUNCTION public.bulk_delete_licenses(license_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER := 0;
  license_id UUID;
BEGIN
  -- Delete each license and count successful deletions
  FOREACH license_id IN ARRAY license_ids
  LOOP
    -- Delete the license (cascading deletes will handle related records)
    DELETE FROM public.license_keys WHERE id = license_id;
    
    IF FOUND THEN
      deleted_count := deleted_count + 1;
    END IF;
  END LOOP;
  
  -- Clean up any orphaned records
  DELETE FROM public.user_sessions 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  DELETE FROM public.user_licenses 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  DELETE FROM public.auth_ciphers 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'total_requested', array_length(license_ids, 1)
  );
END;
$function$;

-- Function for bulk toggling license status
CREATE OR REPLACE FUNCTION public.bulk_toggle_license_status(license_ids uuid[], new_status license_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE public.license_keys 
  SET status = new_status
  WHERE id = ANY(license_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'new_status', new_status,
    'total_requested', array_length(license_ids, 1)
  );
END;
$function$;

-- Function for bulk resolving errors
CREATE OR REPLACE FUNCTION public.bulk_resolve_errors(error_ids uuid[], resolved_by_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  UPDATE public.system_error_logs
  SET 
    resolved_status = true,
    resolved_by = resolved_by_input,
    resolved_at = now(),
    updated_at = now()
  WHERE id = ANY(error_ids)
  AND resolved_status = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'resolved_count', updated_count,
    'total_requested', array_length(error_ids, 1)
  );
END;
$function$;

-- Function for bulk deleting resolved errors
CREATE OR REPLACE FUNCTION public.bulk_delete_errors(error_ids uuid[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  DELETE FROM public.system_error_logs
  WHERE id = ANY(error_ids)
  AND resolved_status = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'total_requested', array_length(error_ids, 1)
  );
END;
$function$;
