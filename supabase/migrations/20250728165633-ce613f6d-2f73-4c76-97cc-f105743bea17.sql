-- Fix the toggle_license_status function to use fully qualified enum name
CREATE OR REPLACE FUNCTION public.toggle_license_status(license_id uuid, new_status text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  license_record RECORD;
  url_result jsonb;
BEGIN
  -- Get the current license record
  SELECT * INTO license_record
  FROM public.license_keys
  WHERE id = license_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'License not found');
  END IF;
  
  -- Update the license status using fully qualified enum name
  UPDATE public.license_keys
  SET 
    status = new_status::public.license_status,
    updated_at = now()
  WHERE id = license_id;
  
  -- Handle URL registry updates based on status
  IF new_status = 'active' THEN
    -- Reactivate URLs for this license
    SELECT public.reactivate_urls_for_license(license_id) INTO url_result;
  ELSE
    -- Deactivate URLs for this license (paused, expired, etc.)
    SELECT public.deactivate_urls_for_license(license_id) INTO url_result;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'license_id', license_id,
    'new_status', new_status,
    'url_updates', url_result
  );
END;
$function$