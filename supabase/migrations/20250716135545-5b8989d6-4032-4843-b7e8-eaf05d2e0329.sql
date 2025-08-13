-- Fix multiple permissive policies issue
-- Drop existing policies and recreate with consolidated permissions

-- Fix global_system_config policies
DROP POLICY IF EXISTS "Global system config is readable by everyone" ON public.global_system_config;
DROP POLICY IF EXISTS "Global system config can be updated by everyone" ON public.global_system_config;

CREATE POLICY "Global system config full access" 
ON public.global_system_config 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Fix global_visit_stats policies  
DROP POLICY IF EXISTS "Global visit stats are readable by everyone" ON public.global_visit_stats;
DROP POLICY IF EXISTS "Global visit stats can be updated by everyone" ON public.global_visit_stats;

CREATE POLICY "Global visit stats full access" 
ON public.global_visit_stats 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Fix duplicate indexes on user_visit_stats
-- Drop the duplicate index, keeping the unique constraint
DROP INDEX IF EXISTS user_visit_stats_license_key_id_visit_date_key;