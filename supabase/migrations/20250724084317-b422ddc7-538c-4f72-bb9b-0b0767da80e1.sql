-- Create missing system functions for AI integration

-- Function to get system settings for AI features
CREATE OR REPLACE FUNCTION public.get_system_setting(setting_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  setting_value boolean;
BEGIN
  SELECT (config_value->>'enabled')::boolean INTO setting_value
  FROM public.global_system_config
  WHERE config_key = setting_name;
  
  -- Default to true if setting doesn't exist
  RETURN COALESCE(setting_value, true);
END;
$function$;

-- Function to increment AI usage statistics
CREATE OR REPLACE FUNCTION public.increment_ai_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  INSERT INTO public.global_system_config (config_key, config_value)
  VALUES ('ai_usage_count', jsonb_build_object('count', 1, 'last_updated', now()))
  ON CONFLICT (config_key)
  DO UPDATE SET
    config_value = jsonb_build_object(
      'count', 
      (global_system_config.config_value->>'count')::integer + 1,
      'last_updated', now()
    ),
    updated_at = now();
END;
$function$;

-- Create AI system settings with default values
INSERT INTO public.global_system_config (config_key, config_value)
VALUES 
  ('ai_pattern_optimization_enabled', '{"enabled": true}'::jsonb),
  ('ai_url_analysis_enabled', '{"enabled": true}'::jsonb),
  ('ai_content_generation_enabled', '{"enabled": true}'::jsonb),
  ('ai_threat_detection_enabled', '{"enabled": true}'::jsonb)
ON CONFLICT (config_key) DO NOTHING;