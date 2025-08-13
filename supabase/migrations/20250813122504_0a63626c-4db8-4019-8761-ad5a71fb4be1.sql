-- Fix search path security warning for validate_admin_session function
CREATE OR REPLACE FUNCTION public.validate_admin_session(username_input text, session_token_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE username = username_input 
    AND session_token = session_token_input
    AND session_expires_at > now()
  );
END;
$$;