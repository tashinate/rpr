-- Fix the system_health_check function to remove reference to non-existent table
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  active_licenses INTEGER;
  active_sessions INTEGER;
  total_visits_count INTEGER;
  telegram_configs INTEGER;
  old_sessions INTEGER;
  old_stats INTEGER;
BEGIN
  -- Count active licenses
  SELECT COUNT(*) INTO active_licenses
  FROM public.license_keys
  WHERE status = 'active' AND is_active = true;
  
  -- Count active sessions
  SELECT COUNT(*) INTO active_sessions
  FROM public.user_sessions
  WHERE expires_at > now() AND is_active = true;
  
  -- Count total visits today
  SELECT COALESCE(SUM(uvs.total_visits), 0) INTO total_visits_count
  FROM public.user_visit_stats uvs
  WHERE uvs.visit_date = CURRENT_DATE;
  
  -- Count telegram configs
  SELECT COUNT(*) INTO telegram_configs
  FROM public.user_telegram_configs;
  
  -- Count old sessions (over 7 days)
  SELECT COUNT(*) INTO old_sessions
  FROM public.user_sessions
  WHERE created_at < (now() - interval '7 days');
  
  -- Count old stats (over 30 days)
  SELECT COUNT(*) INTO old_stats
  FROM public.user_visit_stats
  WHERE visit_date < (CURRENT_DATE - interval '30 days');
  
  RETURN jsonb_build_object(
    'active_licenses', active_licenses,
    'active_sessions', active_sessions,
    'today_visits', total_visits_count,
    'telegram_configs', telegram_configs,
    'old_sessions', old_sessions,
    'old_visit_stats', old_stats,
    'last_updated', now()
  );
END;
$function$;