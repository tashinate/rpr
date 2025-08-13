-- CRITICAL SECURITY FIX: Restrict access to license_keys and admin_users tables
-- This migration fixes publicly accessible sensitive data

-- 1. Drop existing overly permissive policies on license_keys
DROP POLICY IF EXISTS "License keys are readable for validation" ON public.license_keys;
DROP POLICY IF EXISTS "License keys can be updated for usage tracking" ON public.license_keys;

-- 2. Create restrictive policies for license_keys
-- Only allow access through database functions (which are SECURITY DEFINER)
CREATE POLICY "License keys are only accessible via functions"
ON public.license_keys
FOR ALL
USING (false)  -- No direct access
WITH CHECK (false);  -- No direct inserts/updates

-- 3. Drop existing overly permissive policies on admin_users  
DROP POLICY IF EXISTS "Admin users can view their own data" ON public.admin_users;
DROP POLICY IF EXISTS "Admin users can update their own data" ON public.admin_users;

-- 4. Create secure policies for admin_users
-- Only allow authenticated admin users to access their own data
CREATE POLICY "Admin users can only view their own authenticated data"
ON public.admin_users
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND username = current_setting('request.headers', true)::json->>'admin-username'
);

CREATE POLICY "Admin users can only update their own authenticated data"
ON public.admin_users
FOR UPDATE
USING (
  auth.uid() IS NOT NULL 
  AND username = current_setting('request.headers', true)::json->>'admin-username'
);

-- 5. Ensure no one can directly insert into admin_users (admin creation should be controlled)
CREATE POLICY "Prevent direct admin user creation"
ON public.admin_users
FOR INSERT
WITH CHECK (false);

-- 6. Ensure no one can directly delete admin users (should be controlled process)
CREATE POLICY "Prevent direct admin user deletion"
ON public.admin_users
FOR DELETE
USING (false);

-- 7. Add a secure function to validate admin sessions (if needed)
CREATE OR REPLACE FUNCTION public.validate_admin_session(username_input text, session_token_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
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