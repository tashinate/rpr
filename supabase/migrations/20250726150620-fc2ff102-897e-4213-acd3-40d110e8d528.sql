-- Clean up dead_url entries from system_error_logs since we're using BlockedUrlStats for that purpose
-- This prevents duplication and streamlines error handling

-- Remove dead_url entries from system_error_logs table
DELETE FROM public.system_error_logs 
WHERE error_type = 'dead_url';

-- Update the system cleanup function to no longer log dead URLs to system_error_logs
-- since they are handled by the BlockedUrlStats component and cache
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
  
  -- Skip logging dead_url errors as they are handled by BlockedUrlStats
  IF error_type_input = 'dead_url' THEN
    should_log := false;
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
      'reason', 'Skipped - handled by dedicated system or unconfigured user'
    );
  END IF;
END;
$function$;