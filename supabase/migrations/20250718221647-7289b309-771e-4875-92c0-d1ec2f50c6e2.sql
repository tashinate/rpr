-- Fix toggle_license_status to deactivate URLs when license is paused/expired
CREATE OR REPLACE FUNCTION public.toggle_license_status(license_id uuid, new_status license_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.license_keys 
  SET status = new_status
  WHERE id = license_id;
  
  IF FOUND THEN
    -- If license is paused or expired, deactivate all associated URLs
    IF new_status IN ('paused', 'expired') THEN
      PERFORM public.deactivate_urls_for_license(license_id);
    END IF;
    
    RETURN jsonb_build_object('success', true, 'message', 'License status updated');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'License not found');
  END IF;
END;
$function$;

-- Also fix bulk_toggle_license_status
CREATE OR REPLACE FUNCTION public.bulk_toggle_license_status(license_ids uuid[], new_status license_status)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER := 0;
  license_id UUID;
BEGIN
  UPDATE public.license_keys 
  SET status = new_status
  WHERE id = ANY(license_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- If licenses are paused or expired, deactivate all associated URLs
  IF new_status IN ('paused', 'expired') THEN
    FOREACH license_id IN ARRAY license_ids
    LOOP
      PERFORM public.deactivate_urls_for_license(license_id);
    END LOOP;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_count', updated_count,
    'new_status', new_status,
    'total_requested', array_length(license_ids, 1)
  );
END;
$function$;