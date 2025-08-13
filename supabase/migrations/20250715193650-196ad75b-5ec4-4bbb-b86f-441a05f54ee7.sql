-- Phase 1: Clean up bot_detection_reviews table and related functions
-- Remove all existing review data
TRUNCATE TABLE public.bot_detection_reviews;

-- Drop the bot_detection_reviews table (no admin interface exists)
DROP TABLE public.bot_detection_reviews;

-- Remove unused bot review functions
DROP FUNCTION IF EXISTS public.cleanup_bot_reviews(integer);

-- Remove auto cleanup function that references bot_detection_reviews
DROP FUNCTION IF EXISTS public.auto_cleanup_expired_data();

-- Create simplified auto cleanup function without bot review references
CREATE OR REPLACE FUNCTION public.auto_cleanup_expired_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Clean up expired sessions
  DELETE FROM public.user_sessions 
  WHERE expires_at < now() - interval '7 days';
  
  -- Clean up old visit stats
  DELETE FROM public.user_visit_stats 
  WHERE visit_date < CURRENT_DATE - interval '30 days';
  
  -- Clean up orphaned user_licenses
  DELETE FROM public.user_licenses 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
END;
$function$;