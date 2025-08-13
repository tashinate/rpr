
-- Fix the register_generated_url function to handle duplicates gracefully
CREATE OR REPLACE FUNCTION public.register_generated_url(url_hash_input text, license_key_id_input uuid, original_url_input text, expires_at_input timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Use INSERT ... ON CONFLICT DO UPDATE for graceful duplicate handling
  INSERT INTO public.url_registry (url_hash, license_key_id, original_url, expires_at)
  VALUES (url_hash_input, license_key_id_input, original_url_input, expires_at_input)
  ON CONFLICT (url_hash) 
  DO UPDATE SET
    license_key_id = EXCLUDED.license_key_id,
    original_url = EXCLUDED.original_url,
    expires_at = EXCLUDED.expires_at,
    is_active = true,
    updated_at = now()
  WHERE url_registry.url_hash = url_hash_input;
  
  RETURN jsonb_build_object('success', true, 'action', 
    CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END);
END;
$function$
