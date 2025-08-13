
-- Fix security warnings by adding search_path to functions
-- This prevents potential security issues with function search paths

-- Fix get_ai_optimized_patterns function
CREATE OR REPLACE FUNCTION public.get_ai_optimized_patterns(context_input jsonb DEFAULT '{}'::jsonb, limit_input integer DEFAULT 5)
 RETURNS TABLE(pattern_id uuid, pattern_name text, predicted_success_rate numeric, intelligence_score numeric, recommendation_reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  category_filter TEXT := context_input->>'category';
  industry_filter TEXT := context_input->>'industry';
  geo_filter TEXT := context_input->>'countryCode';
  current_hour INTEGER := EXTRACT(hour FROM now());
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.pattern_name,
    COALESCE(pim.success_prediction_score, up.base_success_rate::numeric) as predicted_success_rate,
    COALESCE(
      (pim.freshness_score * 0.3 + 
       pim.anti_detection_score * 0.4 + 
       pim.success_prediction_score * 0.3), 
      up.base_success_rate::numeric
    ) as intelligence_score,
    CASE 
      WHEN pim.freshness_score > 90 THEN 'High freshness - excellent stealth'
      WHEN pim.success_prediction_score > 95 THEN 'Exceptional performance prediction'
      WHEN up.tier = 1 THEN 'Premium tier pattern - maximum security'
      ELSE 'Standard optimization'
    END as recommendation_reason
  FROM public.url_patterns up
  LEFT JOIN public.pattern_intelligence_metrics pim ON up.id = pim.pattern_id
  LEFT JOIN public.pattern_usage_stats pus ON up.id = pus.pattern_id AND pus.usage_date = CURRENT_DATE
  WHERE 
    up.is_active = true
    AND (category_filter IS NULL OR up.category = category_filter)
    AND (up.usage_limits->>'currentUses')::integer < (up.usage_limits->>'maxUses')::integer
  ORDER BY 
    intelligence_score DESC,
    predicted_success_rate DESC,
    up.tier ASC
  LIMIT limit_input;
END;
$function$;

-- Fix predict_pattern_performance function
CREATE OR REPLACE FUNCTION public.predict_pattern_performance(pattern_id_input uuid, context_input jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  base_rate NUMERIC;
  intelligence_metrics RECORD;
  prediction_result JSONB;
BEGIN
  -- Get base success rate
  SELECT base_success_rate INTO base_rate
  FROM public.url_patterns WHERE id = pattern_id_input;
  
  -- Get intelligence metrics
  SELECT * INTO intelligence_metrics
  FROM public.pattern_intelligence_metrics WHERE pattern_id = pattern_id_input;
  
  -- Calculate prediction with various factors
  prediction_result := jsonb_build_object(
    'predicted_success_rate', COALESCE(intelligence_metrics.success_prediction_score, base_rate),
    'confidence_level', CASE 
      WHEN intelligence_metrics.freshness_score > 90 THEN 'high'
      WHEN intelligence_metrics.freshness_score > 70 THEN 'medium'
      ELSE 'low'
    END,
    'risk_factors', jsonb_build_array(
      CASE WHEN intelligence_metrics.freshness_score < 70 THEN 'pattern_aging' END,
      CASE WHEN intelligence_metrics.anti_detection_score < 80 THEN 'detection_risk' END
    ),
    'optimization_suggestions', jsonb_build_array(
      CASE WHEN intelligence_metrics.freshness_score < 80 THEN 'consider_pattern_rotation' END,
      CASE WHEN intelligence_metrics.success_prediction_score < base_rate THEN 'pattern_underperforming' END
    )
  );
  
  RETURN prediction_result;
END;
$function$;

-- Fix update_domain_health_scores function
CREATE OR REPLACE FUNCTION public.update_domain_health_scores()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  domain_record RECORD;
  new_score NUMERIC;
BEGIN
  FOR domain_record IN 
    SELECT * FROM public.domain_rotation_pool WHERE is_active = true
  LOOP
    -- Calculate health score based on usage patterns and success rates
    new_score := GREATEST(50.0, 
      domain_record.success_rate * 0.7 + 
      CASE WHEN domain_record.usage_count < 1000 THEN 30.0 ELSE 20.0 END
    );
    
    -- Update or insert health monitoring record
    INSERT INTO public.domain_health_monitoring (
      domain_name, 
      reputation_score, 
      last_health_check,
      is_healthy
    )
    VALUES (
      domain_record.domain_name,
      new_score,
      now(),
      new_score > 75.0
    )
    ON CONFLICT (domain_name) 
    DO UPDATE SET
      reputation_score = new_score,
      last_health_check = now(),
      is_healthy = new_score > 75.0,
      updated_at = now();
  END LOOP;
END;
$function$;
