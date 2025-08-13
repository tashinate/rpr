-- Create enhanced system error log cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_system_error_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  telegram_deleted INTEGER := 0;
  critical_deleted INTEGER := 0;
  error_deleted INTEGER := 0;
  warning_deleted INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  -- Delete telegram-related errors older than 7 days (these are mostly configuration spam)
  DELETE FROM public.system_error_logs 
  WHERE error_type IN ('telegram', 'notification') 
  AND created_at < (now() - interval '7 days');
  GET DIAGNOSTICS telegram_deleted = ROW_COUNT;
  
  -- Delete critical errors older than 90 days
  DELETE FROM public.system_error_logs 
  WHERE severity = 'critical' 
  AND created_at < (now() - interval '90 days');
  GET DIAGNOSTICS critical_deleted = ROW_COUNT;
  
  -- Delete regular errors older than 30 days
  DELETE FROM public.system_error_logs 
  WHERE severity = 'error' 
  AND error_type NOT IN ('telegram', 'notification')
  AND created_at < (now() - interval '30 days');
  GET DIAGNOSTICS error_deleted = ROW_COUNT;
  
  -- Delete warnings older than 14 days
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

-- Create function to check if user has valid Telegram configuration
CREATE OR REPLACE FUNCTION public.has_valid_telegram_config(license_key_id_input uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  config_exists boolean := false;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.user_telegram_configs 
    WHERE license_key_id = license_key_id_input
    AND bot_token IS NOT NULL 
    AND bot_token != ''
    AND chat_id IS NOT NULL 
    AND chat_id != ''
  ) INTO config_exists;
  
  RETURN config_exists;
END;
$function$;

-- Create improved error logging function with better categorization
CREATE OR REPLACE FUNCTION public.log_system_error_enhanced(
  error_type_input text, 
  error_message_input text, 
  error_details_input jsonb DEFAULT '{}'::jsonb, 
  user_session_token_input text DEFAULT NULL::text, 
  severity_input text DEFAULT 'error'::text,
  skip_if_configuration boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  target_license_key_id UUID;
  error_id UUID;
  should_log boolean := true;
BEGIN
  -- Get license key ID from session token if provided
  IF user_session_token_input IS NOT NULL THEN
    SELECT us.license_key_id INTO target_license_key_id
    FROM public.user_sessions us
    WHERE us.session_token = user_session_token_input
    AND us.expires_at > now()
    AND us.is_active = true;
  END IF;
  
  -- Skip logging if it's a configuration error and user hasn't configured it
  IF skip_if_configuration AND target_license_key_id IS NOT NULL THEN
    IF error_type_input IN ('telegram', 'notification') THEN
      IF NOT public.has_valid_telegram_config(target_license_key_id) THEN
        should_log := false;
      END IF;
    END IF;
  END IF;
  
  -- Only log if we should
  IF should_log THEN
    INSERT INTO public.system_error_logs (
      error_type,
      error_message,
      error_details,
      user_session_token,
      license_key_id,
      severity
    ) VALUES (
      error_type_input,
      error_message_input,
      error_details_input,
      user_session_token_input,
      target_license_key_id,
      severity_input
    ) RETURNING id INTO error_id;
    
    RETURN jsonb_build_object(
      'success', true,
      'error_id', error_id,
      'logged', true
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'logged', false,
      'reason', 'Skipped configuration error for unconfigured user'
    );
  END IF;
END;
$function$;