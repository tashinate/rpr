-- Fix license management issues

-- 1. Add DELETE policy for license_keys
CREATE POLICY "License keys can be deleted by anyone" 
ON public.license_keys 
FOR DELETE 
USING (true);

-- 2. Fix toggle_license_status function (remove non-existent updated_at column)
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
    RETURN jsonb_build_object('success', true, 'message', 'License status updated');
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'License not found');
  END IF;
END;
$function$;

-- 3. Fix cleanup_expired_licenses function to handle status properly
CREATE OR REPLACE FUNCTION public.cleanup_expired_licenses()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  updated_count INTEGER;
  deleted_count INTEGER;
BEGIN
  -- First, update expired licenses to 'expired' status
  UPDATE public.license_keys 
  SET status = 'expired'
  WHERE expires_at IS NOT NULL 
  AND expires_at < now()
  AND status != 'expired';
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  -- Then delete old expired licenses (older than 30 days)
  WITH deleted_licenses AS (
    DELETE FROM public.license_keys 
    WHERE expires_at IS NOT NULL 
    AND expires_at < (now() - interval '30 days')
    AND status = 'expired'
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted_licenses;
  
  -- Clean up orphaned user_licenses
  DELETE FROM public.user_licenses 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  -- Clean up orphaned user_sessions
  DELETE FROM public.user_sessions 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  RETURN updated_count + deleted_count;
END;
$function$;