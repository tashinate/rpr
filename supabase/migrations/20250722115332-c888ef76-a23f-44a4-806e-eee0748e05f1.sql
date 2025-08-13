
-- Phase 1: Database & Backend Foundation

-- Create A/B Testing Infrastructure
CREATE TABLE IF NOT EXISTS public.ab_test_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_name TEXT NOT NULL,
  pattern_a_id UUID REFERENCES public.url_patterns(id),
  pattern_b_id UUID REFERENCES public.url_patterns(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  traffic_split NUMERIC NOT NULL DEFAULT 0.50 CHECK (traffic_split BETWEEN 0.1 AND 0.9),
  start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  winner_pattern_id UUID,
  statistical_significance BOOLEAN DEFAULT false,
  confidence_level NUMERIC DEFAULT 0.00,
  test_results JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ab_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.ab_test_campaigns(id) ON DELETE CASCADE,
  pattern_id UUID REFERENCES public.url_patterns(id),
  test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC NOT NULL DEFAULT 0.00,
  geographic_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, pattern_id, test_date)
);

-- Enable RLS on new tables
ALTER TABLE public.ab_test_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "AB test campaigns are readable by everyone" 
  ON public.ab_test_campaigns FOR SELECT USING (true);

CREATE POLICY "AB test campaigns can be created" 
  ON public.ab_test_campaigns FOR INSERT WITH CHECK (true);

CREATE POLICY "AB test campaigns can be updated" 
  ON public.ab_test_campaigns FOR UPDATE USING (true);

CREATE POLICY "AB test results are readable by everyone" 
  ON public.ab_test_results FOR SELECT USING (true);

CREATE POLICY "AB test results can be created" 
  ON public.ab_test_results FOR INSERT WITH CHECK (true);

CREATE POLICY "AB test results can be updated" 
  ON public.ab_test_results FOR UPDATE USING (true);

-- Seed Pattern Intelligence Metrics with realistic data
INSERT INTO public.pattern_intelligence_metrics (
  pattern_id, 
  success_prediction_score, 
  freshness_score, 
  anti_detection_score,
  geographic_performance,
  temporal_performance,
  industry_performance
)
SELECT 
  up.id,
  CASE 
    WHEN up.tier = 1 THEN 92.0 + (RANDOM() * 6)
    WHEN up.tier = 2 THEN 87.0 + (RANDOM() * 8)
    ELSE 82.0 + (RANDOM() * 10)
  END as success_prediction_score,
  CASE 
    WHEN up.created_at > (now() - interval '7 days') THEN 95.0 + (RANDOM() * 5)
    WHEN up.created_at > (now() - interval '30 days') THEN 85.0 + (RANDOM() * 10)
    ELSE 70.0 + (RANDOM() * 15)
  END as freshness_score,
  CASE 
    WHEN up.tier = 1 THEN 88.0 + (RANDOM() * 10)
    WHEN up.tier = 2 THEN 80.0 + (RANDOM() * 12)
    ELSE 75.0 + (RANDOM() * 15)
  END as anti_detection_score,
  jsonb_build_object(
    'US', 90 + (RANDOM() * 8),
    'CA', 88 + (RANDOM() * 10),
    'GB', 86 + (RANDOM() * 12),
    'AU', 84 + (RANDOM() * 14),
    'DE', 82 + (RANDOM() * 16)
  ) as geographic_performance,
  jsonb_build_object(
    '0', 75 + (RANDOM() * 10),
    '6', 80 + (RANDOM() * 8),
    '9', 88 + (RANDOM() * 6),
    '12', 92 + (RANDOM() * 4),
    '15', 90 + (RANDOM() * 6),
    '18', 85 + (RANDOM() * 8),
    '21', 78 + (RANDOM() * 10)
  ) as temporal_performance,
  jsonb_build_object(
    'finance', CASE WHEN up.category = 'banking' THEN 95 + (RANDOM() * 4) ELSE 80 + (RANDOM() * 10) END,
    'healthcare', CASE WHEN up.category = 'medical' THEN 93 + (RANDOM() * 5) ELSE 82 + (RANDOM() * 8) END,
    'ecommerce', CASE WHEN up.category = 'ecommerce' THEN 91 + (RANDOM() * 6) ELSE 78 + (RANDOM() * 12) END,
    'education', CASE WHEN up.category = 'education' THEN 89 + (RANDOM() * 7) ELSE 75 + (RANDOM() * 15) END
  ) as industry_performance
FROM public.url_patterns up
WHERE NOT EXISTS (
  SELECT 1 FROM public.pattern_intelligence_metrics pim 
  WHERE pim.pattern_id = up.id
);

-- Advanced Analytics Functions
CREATE OR REPLACE FUNCTION public.get_real_time_analytics(hours_back INTEGER DEFAULT 24)
RETURNS TABLE(
  hour_bucket TIMESTAMP WITH TIME ZONE,
  total_patterns_used INTEGER,
  avg_success_rate NUMERIC,
  top_performing_category TEXT,
  geographic_leader TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  WITH hourly_stats AS (
    SELECT 
      date_trunc('hour', pus.updated_at) as hour_bucket,
      COUNT(DISTINCT pus.pattern_id) as patterns_used,
      AVG(pus.success_rate) as avg_success_rate,
      up.category
    FROM public.pattern_usage_stats pus
    JOIN public.url_patterns up ON pus.pattern_id = up.id
    WHERE pus.updated_at >= (now() - (hours_back || ' hours')::interval)
    GROUP BY date_trunc('hour', pus.updated_at), up.category
  ),
  category_performance AS (
    SELECT 
      hour_bucket,
      category,
      AVG(avg_success_rate) as category_rate,
      ROW_NUMBER() OVER (PARTITION BY hour_bucket ORDER BY AVG(avg_success_rate) DESC) as rn
    FROM hourly_stats
    GROUP BY hour_bucket, category
  )
  SELECT 
    hs.hour_bucket,
    SUM(hs.patterns_used)::INTEGER as total_patterns_used,
    AVG(hs.avg_success_rate) as avg_success_rate,
    cp.category as top_performing_category,
    'US' as geographic_leader -- Simplified for demo
  FROM hourly_stats hs
  LEFT JOIN category_performance cp ON hs.hour_bucket = cp.hour_bucket AND cp.rn = 1
  GROUP BY hs.hour_bucket, cp.category
  ORDER BY hs.hour_bucket DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_pattern_heatmap_data(days_back INTEGER DEFAULT 30)
RETURNS TABLE(
  pattern_name TEXT,
  category TEXT,
  geographic_scores JSONB,
  temporal_scores JSONB,
  overall_health_score NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    up.pattern_name,
    up.category,
    pim.geographic_performance as geographic_scores,
    pim.temporal_performance as temporal_scores,
    ROUND((pim.success_prediction_score * 0.4 + 
           pim.freshness_score * 0.3 + 
           pim.anti_detection_score * 0.3), 2) as overall_health_score
  FROM public.url_patterns up
  JOIN public.pattern_intelligence_metrics pim ON up.id = pim.pattern_id
  WHERE up.is_active = true
  ORDER BY overall_health_score DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_ab_test(
  test_name_input TEXT,
  pattern_a_id_input UUID,
  pattern_b_id_input UUID,
  traffic_split_input NUMERIC DEFAULT 0.50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  campaign_id UUID;
BEGIN
  INSERT INTO public.ab_test_campaigns (
    test_name, 
    pattern_a_id, 
    pattern_b_id, 
    traffic_split
  )
  VALUES (
    test_name_input, 
    pattern_a_id_input, 
    pattern_b_id_input, 
    traffic_split_input
  )
  RETURNING id INTO campaign_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'campaign_id', campaign_id,
    'message', 'A/B test campaign created successfully'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_ab_test_results(
  campaign_id_input UUID,
  pattern_id_input UUID,
  impressions_input INTEGER,
  clicks_input INTEGER,
  conversions_input INTEGER
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  success_rate_calc NUMERIC;
BEGIN
  success_rate_calc := CASE 
    WHEN impressions_input > 0 THEN ROUND((conversions_input::NUMERIC / impressions_input::NUMERIC) * 100, 2)
    ELSE 0.00
  END;
  
  INSERT INTO public.ab_test_results (
    campaign_id,
    pattern_id,
    impressions,
    clicks,
    conversions,
    success_rate
  )
  VALUES (
    campaign_id_input,
    pattern_id_input,
    impressions_input,
    clicks_input,
    conversions_input,
    success_rate_calc
  )
  ON CONFLICT (campaign_id, pattern_id, test_date)
  DO UPDATE SET
    impressions = impressions_input,
    clicks = clicks_input,
    conversions = conversions_input,
    success_rate = success_rate_calc,
    updated_at = now();
  
  RETURN jsonb_build_object(
    'success', true,
    'success_rate', success_rate_calc
  );
END;
$function$;

-- Add some sample A/B test data
INSERT INTO public.ab_test_campaigns (test_name, pattern_a_id, pattern_b_id, traffic_split)
SELECT 
  CONCAT('Test ', ROW_NUMBER() OVER(), ': ', pa.pattern_name, ' vs ', pb.pattern_name),
  pa.id,
  pb.id,
  0.5
FROM (
  SELECT id, pattern_name, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.url_patterns 
  WHERE is_active = true 
  LIMIT 10
) pa
JOIN (
  SELECT id, pattern_name, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM public.url_patterns 
  WHERE is_active = true 
  LIMIT 10
) pb ON pa.rn = pb.rn
WHERE pa.id != pb.id
LIMIT 3;
