-- Create RPC function to get manual decisions for a specific session
CREATE OR REPLACE FUNCTION public.get_manual_decisions_for_session(session_token_input text)
 RETURNS TABLE(
   id uuid,
   decision_key text,
   decision text,
   visitor_data jsonb,
   created_at timestamp with time zone,
   expires_at timestamp with time zone,
   license_key_id uuid,
   session_token text,
   updated_at timestamp with time zone
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    md.id,
    md.decision_key,
    md.decision,
    md.visitor_data,
    md.created_at,
    md.expires_at,
    md.license_key_id,
    md.session_token,
    md.updated_at
  FROM public.manual_decisions md
  WHERE md.session_token = session_token_input
  ORDER BY md.created_at DESC;
END;
$function$