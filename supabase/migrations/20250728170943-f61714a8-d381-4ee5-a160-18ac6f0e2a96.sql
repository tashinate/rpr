-- Fix RLS performance issues on manual_decisions table
-- Wrap current_setting() calls with SELECT to prevent re-evaluation per row

DROP POLICY IF EXISTS "Users can view their own manual decisions" ON public.manual_decisions;
DROP POLICY IF EXISTS "Users can update their own manual decisions" ON public.manual_decisions;

-- Recreate policies with optimized auth function calls
CREATE POLICY "Users can view their own manual decisions" 
ON public.manual_decisions 
FOR SELECT 
USING (license_key_id IN ( 
  SELECT us.license_key_id
  FROM user_sessions us
  WHERE us.session_token = ((select current_setting('request.headers'::text, true))::json ->> 'session-token'::text)
    AND us.expires_at > now() 
    AND us.is_active = true
));

CREATE POLICY "Users can update their own manual decisions" 
ON public.manual_decisions 
FOR UPDATE 
USING (license_key_id IN ( 
  SELECT us.license_key_id
  FROM user_sessions us
  WHERE us.session_token = ((select current_setting('request.headers'::text, true))::json ->> 'session-token'::text)
    AND us.expires_at > now() 
    AND us.is_active = true
));