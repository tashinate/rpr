-- Phase 1: Clean up obsolete and misclassified errors
DELETE FROM public.system_error_logs 
WHERE error_message LIKE '%URL decryption failed%' 
   OR error_message LIKE '%Invalid Base34%'
   OR error_message LIKE '%Failed to parse JSON%'
   OR error_type = 'manual_decision'
   OR error_message LIKE '%Manual decision%'
   OR error_message LIKE '%URL generation info%';

-- Create operational_logs table for non-error events
CREATE TABLE public.operational_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operation_type TEXT NOT NULL,
  operation_message TEXT NOT NULL,
  operation_details JSONB DEFAULT '{}'::jsonb,
  user_session_token TEXT,
  license_key_id UUID,
  severity TEXT NOT NULL DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on operational_logs
ALTER TABLE public.operational_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for operational_logs
CREATE POLICY "Operational logs are readable by everyone for admin purposes" 
ON public.operational_logs 
FOR SELECT 
USING (true);

CREATE POLICY "Operational logs can be created by anyone" 
ON public.operational_logs 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for operational_logs updated_at
CREATE TRIGGER update_operational_logs_updated_at
BEFORE UPDATE ON public.operational_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create bulk error management functions
CREATE OR REPLACE FUNCTION public.bulk_resolve_errors(error_ids UUID[], resolved_by_input TEXT)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  resolved_count INTEGER;
BEGIN
  UPDATE public.system_error_logs
  SET 
    resolved_status = true,
    resolved_by = resolved_by_input,
    resolved_at = now(),
    updated_at = now()
  WHERE id = ANY(error_ids)
  AND resolved_status = false;
  
  GET DIAGNOSTICS resolved_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'resolved_count', resolved_count
  );
END;
$function$;

-- Create bulk delete errors function
CREATE OR REPLACE FUNCTION public.bulk_delete_errors(error_ids UUID[])
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.system_error_logs
  WHERE id = ANY(error_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'success', true,
    'deleted_count', deleted_count
  );
END;
$function$;

-- Create cleanup obsolete errors function
CREATE OR REPLACE FUNCTION public.cleanup_obsolete_errors()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete known obsolete error patterns
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

-- Enhanced error logging function with better classification
CREATE OR REPLACE FUNCTION public.log_operational_event(
  operation_type_input TEXT,
  operation_message_input TEXT,
  operation_details_input JSONB DEFAULT '{}'::jsonb,
  user_session_token_input TEXT DEFAULT NULL,
  severity_input TEXT DEFAULT 'info'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  target_license_key_id UUID;
  log_id UUID;
BEGIN
  -- Get license key ID from session token if provided
  IF user_session_token_input IS NOT NULL THEN
    SELECT us.license_key_id INTO target_license_key_id
    FROM public.user_sessions us
    WHERE us.session_token = user_session_token_input
    AND us.expires_at > now()
    AND us.is_active = true;
  END IF;
  
  -- Insert operational log
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

-- Create error analytics function
CREATE OR REPLACE FUNCTION public.get_error_analytics(days_back INTEGER DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  total_errors INTEGER;
  critical_errors INTEGER;
  resolved_errors INTEGER;
  error_trends JSONB;
  common_errors JSONB;
BEGIN
  -- Get total errors in timeframe
  SELECT COUNT(*) INTO total_errors
  FROM public.system_error_logs
  WHERE created_at >= (now() - (days_back || ' days')::interval);
  
  -- Get critical errors
  SELECT COUNT(*) INTO critical_errors
  FROM public.system_error_logs
  WHERE created_at >= (now() - (days_back || ' days')::interval)
  AND severity = 'critical';
  
  -- Get resolved errors
  SELECT COUNT(*) INTO resolved_errors
  FROM public.system_error_logs
  WHERE created_at >= (now() - (days_back || ' days')::interval)
  AND resolved_status = true;
  
  -- Get error trends by day
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
  
  -- Get most common error types
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