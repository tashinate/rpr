-- Create system error logs table for tracking Telegram and other system failures
CREATE TABLE public.system_error_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  error_type TEXT NOT NULL, -- 'telegram_config', 'telegram_send', 'encryption', 'decryption', etc.
  error_message TEXT NOT NULL,
  error_details JSONB DEFAULT '{}'::jsonb,
  user_session_token TEXT,
  license_key_id UUID,
  severity TEXT NOT NULL DEFAULT 'error', -- 'info', 'warning', 'error', 'critical'
  resolved_status BOOLEAN NOT NULL DEFAULT false,
  resolved_by TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_error_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for system error logs
CREATE POLICY "System error logs are readable by everyone for admin purposes"
ON public.system_error_logs
FOR SELECT
USING (true);

CREATE POLICY "System error logs can be created by anyone"
ON public.system_error_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "System error logs can be updated for resolution"
ON public.system_error_logs
FOR UPDATE
USING (true);

-- Create function to log system errors
CREATE OR REPLACE FUNCTION public.log_system_error(
  error_type_input TEXT,
  error_message_input TEXT,
  error_details_input JSONB DEFAULT '{}'::jsonb,
  user_session_token_input TEXT DEFAULT NULL,
  severity_input TEXT DEFAULT 'error'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  target_license_key_id UUID;
  error_id UUID;
BEGIN
  -- Get license key ID from session token if provided
  IF user_session_token_input IS NOT NULL THEN
    SELECT us.license_key_id INTO target_license_key_id
    FROM public.user_sessions us
    WHERE us.session_token = user_session_token_input
    AND us.expires_at > now()
    AND us.is_active = true;
  END IF;
  
  -- Insert error log
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
    'error_id', error_id
  );
END;
$function$;

-- Create function to mark errors as resolved
CREATE OR REPLACE FUNCTION public.resolve_system_error(
  error_id_input UUID,
  resolved_by_input TEXT
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  UPDATE public.system_error_logs
  SET 
    resolved_status = true,
    resolved_by = resolved_by_input,
    resolved_at = now(),
    updated_at = now()
  WHERE id = error_id_input;
  
  IF FOUND THEN
    RETURN jsonb_build_object('success', true);
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Error log not found');
  END IF;
END;
$function$;

-- Remove fallback exception handling from decrypt_bot_token
CREATE OR REPLACE FUNCTION public.decrypt_bot_token(encrypted_token text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  decryption_key text := 'bot_token_encryption_key_2025'; -- Same static key
  result text;
BEGIN
  IF encrypted_token IS NULL OR encrypted_token = '' THEN
    RETURN encrypted_token;
  END IF;
  
  -- Use AES decryption with the static key - with proper schema prefix
  result := convert_from(extensions.decrypt(decode(encrypted_token, 'base64'), decryption_key::bytea, 'aes'), 'UTF8');
  
  -- Log decryption success for debugging
  PERFORM public.log_system_error(
    'decryption',
    'Bot token decryption successful',
    jsonb_build_object('token_length', length(result)),
    NULL,
    'info'
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Log decryption failure instead of returning fallback
    PERFORM public.log_system_error(
      'decryption',
      'Bot token decryption failed: ' || SQLERRM,
      jsonb_build_object('encrypted_token_length', length(encrypted_token), 'error_detail', SQLERRM),
      NULL,
      'error'
    );
    -- Re-raise the exception instead of returning fallback
    RAISE;
END;
$function$;

-- Create trigger for updated_at
CREATE TRIGGER update_system_error_logs_updated_at
BEFORE UPDATE ON public.system_error_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();