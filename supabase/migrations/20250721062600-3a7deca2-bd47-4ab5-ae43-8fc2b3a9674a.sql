-- Create the missing deactivate_urls_for_license function
CREATE OR REPLACE FUNCTION public.deactivate_urls_for_license(license_id_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Deactivate all URLs associated with the license
  UPDATE public.url_registry 
  SET is_active = false
  WHERE license_key_id = license_id_input;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deactivated_urls', updated_count,
    'license_id', license_id_input
  );
END;
$function$;