-- COMPLETE THE SEARCH PATH FIXES FOR ALL REMAINING FUNCTIONS
-- This should resolve all remaining function search path security warnings

-- Fix all remaining functions that still need search_path = ''
CREATE OR REPLACE FUNCTION public.get_error_analytics(days_back integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  total_errors INTEGER;
  critical_errors INTEGER;
  resolved_errors INTEGER;
  error_trends JSONB;
  common_errors JSONB;
BEGIN
  SELECT COUNT(*) INTO total_errors
  FROM public.system_error_logs
  WHERE created_at >= (now() - (days_back || ' days')::interval);
  
  SELECT COUNT(*) INTO critical_errors
  FROM public.system_error_logs
  WHERE created_at >= (now() - (days_back || ' days')::interval)
  AND severity = 'critical';
  
  SELECT COUNT(*) INTO resolved_errors
  FROM public.system_error_logs
  WHERE created_at >= (now() - (days_back || ' days')::interval)
  AND resolved_status = true;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', error_date,
      'count', error_count
    ) ORDER BY error_date
  ) INTO error_trends
  FROM (
    SELECT 
      DATE(created_at) as error_date,
      COUNT(*) as error_count
    FROM public.system_error_logs
    WHERE created_at >= (now() - (days_back || ' days')::interval)
    GROUP BY DATE(created_at)
    ORDER BY error_date
  ) daily_errors;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'error_type', error_type,
      'count', error_count
    ) ORDER BY error_count DESC
  ) INTO common_errors
  FROM (
    SELECT 
      error_type,
      COUNT(*) as error_count
    FROM public.system_error_logs
    WHERE created_at >= (now() - (days_back || ' days')::interval)
    GROUP BY error_type
    ORDER BY error_count DESC
    LIMIT 10
  ) type_counts;
  
  RETURN jsonb_build_object(
    'total_errors', total_errors,
    'critical_errors', critical_errors,
    'resolved_errors', resolved_errors,
    'resolution_rate', CASE WHEN total_errors > 0 THEN (resolved_errors::DECIMAL / total_errors * 100)::INTEGER ELSE 0 END,
    'error_trends', COALESCE(error_trends, '[]'::jsonb),
    'common_errors', COALESCE(common_errors, '[]'::jsonb),
    'timeframe_days', days_back
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_user_session(key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  license_record RECORD;
  session_token TEXT;
  session_id UUID;
  validation_result JSONB;
BEGIN
  validation_result := public.validate_license_key_enhanced(key_input);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RETURN validation_result;
  END IF;
  
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = key_input;
  
  session_token := replace(gen_random_uuid()::text, '-', '');
  
  INSERT INTO public.user_sessions (license_key_id, session_token, expires_at)
  VALUES (license_record.id, session_token, now() + interval '24 hours')
  RETURNING id INTO session_id;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', (now() + interval '24 hours')::text
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_ai_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
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

CREATE OR REPLACE FUNCTION public.increment_global_visit_stats(is_bot boolean DEFAULT false)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  today_date DATE := CURRENT_DATE;
  result RECORD;
BEGIN
  INSERT INTO public.global_visit_stats (visit_date, total_visits, human_visits, bot_visits)
  VALUES (
    today_date, 
    1, 
    CASE WHEN is_bot THEN 0 ELSE 1 END,
    CASE WHEN is_bot THEN 1 ELSE 0 END
  )
  ON CONFLICT (visit_date) 
  DO UPDATE SET
    total_visits = global_visit_stats.total_visits + 1,
    human_visits = global_visit_stats.human_visits + CASE WHEN is_bot THEN 0 ELSE 1 END,
    bot_visits = global_visit_stats.bot_visits + CASE WHEN is_bot THEN 1 ELSE 0 END,
    updated_at = now()
  RETURNING total_visits, human_visits, bot_visits INTO result;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_visits', result.total_visits,
    'human_visits', result.human_visits,
    'bot_visits', result.bot_visits,
    'today_date', today_date
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.deactivate_urls_for_license(license_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE public.url_registry 
  SET 
    is_active = false,
    updated_at = now()
  WHERE license_key_id = license_id
    AND is_active = true;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'updated_urls', updated_count,
    'message', 'URLs deactivated successfully for license'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_system_error_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  telegram_deleted INTEGER := 0;
  critical_deleted INTEGER := 0;
  error_deleted INTEGER := 0;
  warning_deleted INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  DELETE FROM public.system_error_logs 
  WHERE error_type IN ('telegram', 'notification') 
  AND created_at < (now() - interval '7 days');
  GET DIAGNOSTICS telegram_deleted = ROW_COUNT;
  
  DELETE FROM public.system_error_logs 
  WHERE severity = 'critical' 
  AND created_at < (now() - interval '90 days');
  GET DIAGNOSTICS critical_deleted = ROW_COUNT;
  
  DELETE FROM public.system_error_logs 
  WHERE severity = 'error' 
  AND error_type NOT IN ('telegram', 'notification')
  AND created_at < (now() - interval '30 days');
  GET DIAGNOSTICS error_deleted = ROW_COUNT;
  
  DELETE FROM public.system_error_logs 
  WHERE severity IN ('warning', 'info') 
  AND created_at < (now() - interval '14 days');
  GET DIAGNOSTICS warning_deleted = ROW_COUNT;
  
  total_deleted := telegram_deleted + critical_deleted + error_deleted + warning_deleted;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_deleted', total_deleted,
    'telegram_errors_deleted', telegram_deleted,
    'critical_errors_deleted', critical_deleted,
    'regular_errors_deleted', error_deleted,
    'warnings_deleted', warning_deleted,
    'message', 'System error logs cleaned successfully'
  );
END;
$function$;