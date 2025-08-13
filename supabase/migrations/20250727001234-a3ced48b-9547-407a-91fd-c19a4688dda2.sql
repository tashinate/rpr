-- Clean up all existing data for fresh start
DELETE FROM public.url_registry;
DELETE FROM public.user_visit_stats;
DELETE FROM public.visit_logs;
DELETE FROM public.pattern_usage_stats;
DELETE FROM public.global_visit_stats;

-- Reset pattern usage counters
UPDATE public.url_patterns 
SET usage_limits = jsonb_set(usage_limits, '{currentUses}', '0');

-- Clean system error logs related to URL processing
DELETE FROM public.system_error_logs 
WHERE error_type IN ('url_processing', 'decryption', 'registry_lookup', 'dead_url');