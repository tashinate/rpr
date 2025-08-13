-- FIX REMAINING DATABASE FUNCTION SEARCH PATH VULNERABILITIES
-- This addresses the security linter warning about function search paths

-- Update all remaining functions to use SET search_path = ''

CREATE OR REPLACE FUNCTION public.cleanup_user_sessions(days_old integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions 
  WHERE created_at < (now() - (days_old || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_sessions', deleted_count,
    'message', 'User sessions cleaned successfully'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_visit_stats(days_old integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_visit_stats 
  WHERE visit_date < (CURRENT_DATE - (days_old || ' days')::interval);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_stats', deleted_count,
    'message', 'Visit statistics cleaned successfully'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_system_setting(setting_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  setting_value boolean;
BEGIN
  SELECT (config_value->>'enabled')::boolean INTO setting_value
  FROM public.global_system_config
  WHERE config_key = setting_name;
  
  RETURN COALESCE(setting_value, true);
END;
$function$;

CREATE OR REPLACE FUNCTION public.reset_telegram_configs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_telegram_configs;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_configs', deleted_count,
    'message', 'All Telegram configurations reset successfully'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_obsolete_errors()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_error_logs 
  WHERE error_message LIKE '%URL decryption failed%' 
     OR error_message LIKE '%Invalid Base34%'
     OR error_message LIKE '%Failed to parse JSON%'
     OR error_message LIKE '%simple test%'
     OR error_type = 'manual_decision'
     OR error_message LIKE '%Manual decision%'
     OR error_message LIKE '%URL generation info%';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count,
    'message', 'Obsolete errors cleaned successfully'
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_session_with_license(session_token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  session_record RECORD;
  license_record RECORD;
BEGIN
  SELECT * INTO session_record
  FROM public.user_sessions
  WHERE session_token = session_token_input
  AND is_active = true
  AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Session not found or expired');
  END IF;
  
  SELECT * INTO license_record
  FROM public.license_keys
  WHERE id = session_record.license_key_id
  AND status = 'active'
  AND is_active = true;
  
  IF NOT FOUND THEN
    DELETE FROM public.user_sessions 
    WHERE session_token = session_token_input;
    
    RETURN jsonb_build_object('valid', false, 'error', 'License deleted or inactive');
  END IF;
  
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    DELETE FROM public.user_sessions 
    WHERE session_token = session_token_input;
    
    RETURN jsonb_build_object('valid', false, 'error', 'License expired');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'license_id', license_record.id,
    'license_status', license_record.status
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_operational_event(operation_type_input text, operation_message_input text, operation_details_input jsonb DEFAULT '{}'::jsonb, user_session_token_input text DEFAULT NULL::text, severity_input text DEFAULT 'info'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  target_license_key_id UUID;
  log_id UUID;
BEGIN
  IF user_session_token_input IS NOT NULL THEN
    SELECT us.license_key_id INTO target_license_key_id
    FROM public.user_sessions us
    WHERE us.session_token = user_session_token_input
    AND us.expires_at > now()
    AND us.is_active = true;
  END IF;
  
  INSERT INTO public.operational_logs (
    operation_type,
    operation_message,
    operation_details,
    user_session_token,
    license_key_id,
    severity
  ) VALUES (
    operation_type_input,
    operation_message_input,
    operation_details_input,
    user_session_token_input,
    target_license_key_id,
    severity_input
  ) RETURNING id INTO log_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'log_id', log_id
  );
END;
$function$;

-- Continue with all other functions that need search_path fixes
CREATE OR REPLACE FUNCTION public.cleanup_orphaned_sessions()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.user_sessions 
  WHERE license_key_id NOT IN (SELECT id FROM public.license_keys);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_sessions', deleted_count
  );
END;
$function$;