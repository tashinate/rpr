-- Remove A/B Testing and Advanced Analytics Infrastructure

-- Drop A/B testing tables
DROP TABLE IF EXISTS public.ab_test_campaigns CASCADE;
DROP TABLE IF EXISTS public.ab_test_results CASCADE;

-- Drop pattern intelligence metrics table
DROP TABLE IF EXISTS public.pattern_intelligence_metrics CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS public.get_real_time_analytics(integer);
DROP FUNCTION IF EXISTS public.get_pattern_heatmap_data(integer);
DROP FUNCTION IF EXISTS public.create_ab_test(text, uuid, uuid, numeric);
DROP FUNCTION IF EXISTS public.update_ab_test_results(uuid, uuid, integer, integer, integer);