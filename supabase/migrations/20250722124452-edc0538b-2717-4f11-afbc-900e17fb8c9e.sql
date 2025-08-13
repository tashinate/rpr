
-- Fix the get_intelligent_patterns function to use correct column names
CREATE OR REPLACE FUNCTION public.get_intelligent_patterns(
  category_input text DEFAULT NULL::text, 
  country_code_input text DEFAULT NULL::text, 
  tier_input integer DEFAULT 1, 
  limit_input integer DEFAULT 10
)
RETURNS TABLE(
  pattern_id uuid, 
  pattern_name text, 
  pattern_template text, 
  category text, 
  content_type text, 
  success_rate numeric, 
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
    up.id as pattern_id,  -- Fixed: was up.id, now explicitly aliased as pattern_id
    up.pattern_name,
    up.pattern_template,
    up.category,
    up.content_type,
    COALESCE(pus.success_rate, up.base_success_rate::decimal) as success_rate,
    up.tier,
    (up.usage_limits->>'currentUses')::integer as current_uses,
    (up.usage_limits->>'maxUses')::integer as max_uses
  FROM public.url_patterns up
  LEFT JOIN public.pattern_usage_stats pus ON up.id = pus.pattern_id AND pus.usage_date = CURRENT_DATE
  LEFT JOIN public.pattern_geographic_rules pgr ON up.id = pgr.pattern_id
  WHERE 
    up.is_active = true
    AND (category_input IS NULL OR up.category = category_input)
    AND (tier_input IS NULL OR up.tier <= tier_input)
    AND (up.usage_limits->>'currentUses')::integer < (up.usage_limits->>'maxUses')::integer
    AND (country_code_input IS NULL OR pgr.country_code IS NULL OR pgr.country_code = country_code_input)
    AND (pgr.is_blocked IS NULL OR pgr.is_blocked = false)
  ORDER BY 
    CASE WHEN pgr.is_preferred = true THEN 1 ELSE 2 END,
    COALESCE(pus.success_rate, up.base_success_rate::decimal) DESC,
    up.tier ASC,
    (up.usage_limits->>'currentUses')::integer ASC
  LIMIT limit_input;
END;
$function$

-- Also add some sample patterns if the table is empty to prevent the "no patterns" issue
INSERT INTO public.url_patterns (
  pattern_name, 
  category, 
  pattern_template, 
  content_type, 
  tier, 
  base_success_rate,
  usage_limits
) VALUES 
('Business Document Portal', 'business', '/documents/report-{year}.pdf?doc={encrypted}&id={id}', 'application/pdf', 1, 92, '{"maxUses": 1000, "currentUses": 0}'),
('E-commerce Invoice', 'ecommerce', '/orders/{order}/invoice.pdf?tracking={tracking}&doc={encrypted}', 'application/pdf', 1, 89, '{"maxUses": 1000, "currentUses": 0}'),
('Government Notice', 'government', '/notices/{form}-{year}.pdf?notice={notice}&doc={encrypted}', 'application/pdf', 1, 95, '{"maxUses": 1000, "currentUses": 0}'),
('Medical Appointment', 'medical', '/appointments/{appt}/details?rx={rx}&doc={encrypted}', 'text/html', 1, 88, '{"maxUses": 1000, "currentUses": 0}'),
('Educational Resource', 'education', '/courses/{course}/resources?student={student}&doc={encrypted}', 'text/html', 2, 85, '{"maxUses": 1000, "currentUses": 0}'),
('News Article', 'news', '/articles/{year}/{month}/{id}?utm_source={utm_source}&doc={encrypted}', 'text/html', 2, 83, '{"maxUses": 1000, "currentUses": 0}'),
('Banking Statement', 'banking', '/statements/{stmt}?account={account}&doc={encrypted}', 'application/pdf', 1, 94, '{"maxUses": 1000, "currentUses": 0}'),
('Technology API', 'technology', '/api/{version}/docs?id={id}&doc={encrypted}', 'application/json', 2, 87, '{"maxUses": 1000, "currentUses": 0}')
ON CONFLICT (pattern_name) DO NOTHING;
