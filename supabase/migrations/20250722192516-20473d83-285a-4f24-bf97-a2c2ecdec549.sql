
-- Fix the RLS policy for script_downloads table to include WITH CHECK clause for UPDATE operations
DROP POLICY IF EXISTS "Scripts can be updated by admins" ON public.script_downloads;

CREATE POLICY "Scripts can be updated by admins" 
ON public.script_downloads 
FOR UPDATE 
USING (true)
WITH CHECK (true);
