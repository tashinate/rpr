-- Clear all URLs from registry
DELETE FROM public.url_registry;

-- Clear all system error logs
DELETE FROM public.system_error_logs;

-- Clear all user visit stats
DELETE FROM public.user_visit_stats;

-- Clear all global visit stats
DELETE FROM public.global_visit_stats;