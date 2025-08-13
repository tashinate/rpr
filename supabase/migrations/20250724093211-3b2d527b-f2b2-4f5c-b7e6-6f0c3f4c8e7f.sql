-- Check if register_generated_url function exists and create if missing
CREATE OR REPLACE FUNCTION public.register_generated_url(
  url_hash_input text,
  license_key_id_input uuid,
  original_url_input text,
  expires_at_input timestamp with time zone DEFAULT NULL,
  pattern_id_input uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Insert URL into registry
  INSERT INTO public.url_registry (
    url_hash,
    license_key_id,
    original_url,
    expires_at,
    pattern_id
  )
  VALUES (
    url_hash_input,
    license_key_id_input,
    original_url_input,
    expires_at_input,
    pattern_id_input
  );
  
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN unique_violation THEN
    -- If URL hash already exists, update it
    UPDATE public.url_registry 
    SET 
      original_url = original_url_input,
      expires_at = expires_at_input,
      pattern_id = pattern_id_input,
      is_active = true
    WHERE url_hash = url_hash_input;
    
    RETURN jsonb_build_object('success', true, 'updated', true);
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;