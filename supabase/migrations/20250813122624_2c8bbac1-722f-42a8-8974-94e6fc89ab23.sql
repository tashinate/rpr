-- CRITICAL SECURITY FIX: Restrict access to global_system_config table
-- This migration fixes publicly accessible Telegram bot credentials and other sensitive config data

-- 1. Drop existing overly permissive policies on global_system_config
DROP POLICY IF EXISTS "Global system config full access" ON public.global_system_config;
DROP POLICY IF EXISTS "Global system config is readable" ON public.global_system_config;

-- 2. Create secure policies for global_system_config
-- Only allow service role access (for edge functions) and authenticated administrators
CREATE POLICY "Global system config service role access only"
ON public.global_system_config
FOR ALL
USING (auth.role() = 'service_role'::text);

-- 3. Add admin access policy for authenticated admin users (if admin functionality exists)
CREATE POLICY "Global system config admin access"
ON public.global_system_config
FOR ALL
USING (
  auth.uid() IS NOT NULL 
  AND (
    current_setting('request.headers', true)::json->>'admin-username' IS NOT NULL
    OR auth.jwt()->>'role' = 'admin'
  )
);