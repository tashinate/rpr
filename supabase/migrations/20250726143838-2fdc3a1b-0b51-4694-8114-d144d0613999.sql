-- Fix RLS performance issues by optimizing auth function calls
-- Replace auth.<function>() with (select auth.<function>()) to prevent re-evaluation per row

-- 1. Fix visit_logs policy
DROP POLICY IF EXISTS "Users can view their own visit logs" ON public.visit_logs;

CREATE POLICY "Users can view their own visit logs" 
ON public.visit_logs 
FOR SELECT 
USING (
  license_key_id IN ( 
    SELECT us.license_key_id
    FROM user_sessions us
    WHERE us.session_token = ((select current_setting('request.headers', true))::json ->> 'session-token')
    AND us.expires_at > now() 
    AND us.is_active = true
  )
);

-- 2. Fix system_performance_logs policy
DROP POLICY IF EXISTS "Secure admin access for system_performance_logs" ON public.system_performance_logs;

CREATE POLICY "Secure admin access for system_performance_logs" 
ON public.system_performance_logs 
FOR ALL 
USING (
  ((select auth.role()) = 'service_role') OR 
  (
    (select auth.uid()) IS NOT NULL AND 
    (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  )
);

-- 3. Fix cache_operations policy
DROP POLICY IF EXISTS "Secure admin access for cache_operations" ON public.cache_operations;

CREATE POLICY "Secure admin access for cache_operations" 
ON public.cache_operations 
FOR ALL 
USING (
  ((select auth.role()) = 'service_role') OR 
  (
    (select auth.uid()) IS NOT NULL AND 
    (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  )
);

-- 4. Fix api_request_logs policy
DROP POLICY IF EXISTS "Secure admin access for api_request_logs" ON public.api_request_logs;

CREATE POLICY "Secure admin access for api_request_logs" 
ON public.api_request_logs 
FOR ALL 
USING (
  ((select auth.role()) = 'service_role') OR 
  (
    (select auth.uid()) IS NOT NULL AND 
    (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  )
);

-- 5. Fix pattern_usage_real policy
DROP POLICY IF EXISTS "Secure admin access for pattern_usage_real" ON public.pattern_usage_real;

CREATE POLICY "Secure admin access for pattern_usage_real" 
ON public.pattern_usage_real 
FOR ALL 
USING (
  ((select auth.role()) = 'service_role') OR 
  (
    (select auth.uid()) IS NOT NULL AND 
    (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  )
);

-- 6. Fix url_generation_logs policy
DROP POLICY IF EXISTS "Secure admin access for url_generation_logs" ON public.url_generation_logs;

CREATE POLICY "Secure admin access for url_generation_logs" 
ON public.url_generation_logs 
FOR ALL 
USING (
  ((select auth.role()) = 'service_role') OR 
  (
    (select auth.uid()) IS NOT NULL AND 
    (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  )
);

-- 7. Fix rate_limiting_events policy
DROP POLICY IF EXISTS "Secure admin access for rate_limiting_events" ON public.rate_limiting_events;

CREATE POLICY "Secure admin access for rate_limiting_events" 
ON public.rate_limiting_events 
FOR ALL 
USING (
  ((select auth.role()) = 'service_role') OR 
  (
    (select auth.uid()) IS NOT NULL AND 
    (((select auth.jwt()) -> 'app_metadata') ->> 'role') = 'admin'
  )
);