
-- Phase 1: Database Cleanup - Remove inbox testing remnants

-- Drop inbox testing tables (these are causing the errors)
DROP TABLE IF EXISTS public.inbox_test_results CASCADE;
DROP TABLE IF EXISTS public.inbox_test_batches CASCADE;
DROP TABLE IF EXISTS public.seed_email_accounts CASCADE;
DROP TABLE IF EXISTS public.pattern_performance_metrics CASCADE;

-- Drop inbox testing functions that don't exist in current schema
DROP FUNCTION IF EXISTS public.record_inbox_test_result CASCADE;
DROP FUNCTION IF EXISTS public.recalculate_pattern_metrics CASCADE;
DROP FUNCTION IF EXISTS public.get_top_performing_patterns CASCADE;

-- Ensure we have the core pattern performance function that works with existing tables
CREATE OR REPLACE FUNCTION public.get_current_pattern_metrics(limit_input integer DEFAULT 15)
RETURNS TABLE(
  pattern_id uuid, 
  pattern_name text, 
  category text, 
  success_rate numeric, 
  total_usage integer, 
  tier integer,
  current_uses integer,
  max_uses integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as pattern_id,
    up.pattern_name,
    up.category,
    COALESCE(AVG(pus.success_rate), up.base_success_rate::numeric) as success_rate,
    COALESCE(SUM(pus.total_uses), 0)::integer as total_usage,
    up.tier,
    (up.usage_limits->>'currentUses')::integer as current_uses,
    (up.usage_limits->>'maxUses')::integer as max_uses
  FROM public.url_patterns up
  LEFT JOIN public.pattern_usage_stats pus ON up.id = pus.pattern_id
  WHERE up.is_active = true
  GROUP BY up.id, up.pattern_name, up.category, up.base_success_rate, up.tier, up.usage_limits
  ORDER BY success_rate DESC, total_usage DESC
  LIMIT limit_input;
END;
$function$;
