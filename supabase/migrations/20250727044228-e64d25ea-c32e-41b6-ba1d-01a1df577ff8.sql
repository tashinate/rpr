-- Update the function to properly handle session validation
CREATE OR REPLACE FUNCTION public.get_manual_decisions_for_session(session_token_input text)
RETURNS TABLE(
  id uuid,
  decision_key text,
  decision text,
  visitor_data jsonb,
  created_at timestamp with time zone,
  expires_at timestamp with time zone,
  license_key_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  target_license_key_id UUID;
BEGIN
  -- Get license key ID from session token
  SELECT us.license_key_id INTO target_license_key_id
  FROM public.user_sessions us
  WHERE us.session_token = session_token_input
  AND us.expires_at > now()
  AND us.is_active = true;
  
  -- If no valid session found, return empty result
  IF target_license_key_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Return manual decisions for this license, including those that match the session token
  RETURN QUERY
  SELECT 
    md.id,
    md.decision_key,
    md.decision,
    md.visitor_data,
    md.created_at,
    md.expires_at,
    md.license_key_id
  FROM public.manual_decisions md
  WHERE (md.license_key_id = target_license_key_id OR md.session_token = session_token_input)
  ORDER BY md.created_at DESC
  LIMIT 10;
END;
$function$;