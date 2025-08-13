-- Fix the register_generated_url function - there's a critical bug in the ON CONFLICT clause
CREATE OR REPLACE FUNCTION public.register_generated_url(url_hash_input text, license_key_id_input uuid, original_url_input text, expires_at_input timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.url_registry (url_hash, license_key_id, original_url, expires_at)
  VALUES (url_hash_input, license_key_id_input, original_url_input, expires_at_input)
  ON CONFLICT (url_hash) 
  DO UPDATE SET
    license_key_id = license_key_id_input,  -- FIXED: was url_hash_input before
    original_url = original_url_input,
    expires_at = expires_at_input,
    is_active = true;
  
  RETURN jsonb_build_object('success', true);
END;
$function$