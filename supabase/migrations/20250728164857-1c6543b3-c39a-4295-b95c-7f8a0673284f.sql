-- Create the missing deactivate_urls_for_license function
CREATE OR REPLACE FUNCTION public.deactivate_urls_for_license(license_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update URL registry entries to deactivate them for this license
  UPDATE public.url_registry 
  SET 
    is_active = false,
    updated_at = now()
  WHERE license_key_id = license_id
    AND is_active = true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_urls', updated_count,
    'message', 'URLs deactivated successfully for license'
  );
END;
$function$;

-- Create the missing reactivate_urls_for_license function
CREATE OR REPLACE FUNCTION public.reactivate_urls_for_license(license_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  -- Update URL registry entries to reactivate them for this license
  UPDATE public.url_registry 
  SET 
    is_active = true,
    updated_at = now()
  WHERE license_key_id = license_id
    AND is_active = false;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_urls', updated_count,
    'message', 'URLs reactivated successfully for license'
  );
END;
$function$;

-- Create the toggle_license_status function that depends on the above functions
CREATE OR REPLACE FUNCTION public.toggle_license_status(license_id UUID, new_status text)
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
  
  -- Update the license status
  UPDATE public.license_keys
  SET 
    status = new_status::license_status,
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
$function$;