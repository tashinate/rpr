-- Clean up all system error logs
DELETE FROM public.system_error_logs;

-- Run comprehensive database cleanup
SELECT public.cleanup_expired_licenses();
SELECT public.cleanup_user_sessions(1); -- Clean sessions older than 1 day
SELECT public.cleanup_visit_stats(7); -- Clean visit stats older than 7 days
SELECT public.cleanup_orphaned_sessions();

-- Reset global visit stats to start fresh
DELETE FROM public.global_visit_stats;

-- Clean up any inactive or expired URL registry entries
DELETE FROM public.url_registry WHERE is_active = false OR (expires_at IS NOT NULL AND expires_at < now());

-- Reset any test telegram configs if needed
-- (Keeping this commented as user may have real configs)
-- SELECT public.reset_telegram_configs();