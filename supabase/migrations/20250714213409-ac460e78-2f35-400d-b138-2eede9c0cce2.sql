-- Fix gen_random_bytes function issue and update generate_license_with_preset
-- Use gen_random_uuid() instead of gen_random_bytes for better compatibility

CREATE OR REPLACE FUNCTION public.generate_license_with_preset(preset text, user_email_input text DEFAULT NULL::text, max_uses_input integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  new_license_key TEXT;
  expiry_date TIMESTAMP WITH TIME ZONE;
  license_id UUID;
BEGIN
  -- Check if user already has a license
  IF user_email_input IS NOT NULL AND EXISTS (SELECT 1 FROM public.user_licenses WHERE user_email = user_email_input) THEN
    RETURN jsonb_build_object('success', false, 'error', 'User already has a license key');
  END IF;
  
  -- Generate license key using gen_random_uuid() instead of gen_random_bytes
  new_license_key := upper(replace(gen_random_uuid()::text, '-', ''));
  -- Take only first 24 characters to match original format
  new_license_key := substring(new_license_key from 1 for 24);
  
  -- Calculate expiry based on preset
  CASE preset
    WHEN '1_day' THEN expiry_date := now() + interval '1 day';
    WHEN '2_days' THEN expiry_date := now() + interval '2 days';
    WHEN '5_days' THEN expiry_date := now() + interval '5 days';
    WHEN '1_month' THEN expiry_date := now() + interval '30 days';
    WHEN '1_year' THEN expiry_date := now() + interval '365 days';
    WHEN 'lifetime' THEN expiry_date := NULL;
    ELSE expiry_date := now() + interval '30 days'; -- default to 1 month
  END CASE;
  
  -- Insert license
  INSERT INTO public.license_keys (
    license_key, 
    expires_at, 
    max_uses, 
    expiry_preset, 
    assigned_user_email,
    status
  )
  VALUES (
    new_license_key, 
    expiry_date, 
    max_uses_input, 
    preset, 
    user_email_input,
    'active'
  )
  RETURNING id INTO license_id;
  
  -- If user email provided, create user_licenses entry
  IF user_email_input IS NOT NULL THEN
    INSERT INTO public.user_licenses (user_email, license_key_id)
    VALUES (user_email_input, license_id);
  END IF;
  
  RETURN jsonb_build_object(
    'success', true, 
    'license_key', new_license_key,
    'license_id', license_id,
    'expires_at', expiry_date,
    'preset', preset
  );
END;
$function$;