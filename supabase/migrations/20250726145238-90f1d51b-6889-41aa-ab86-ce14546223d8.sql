-- Create immediate cleanup function for existing spam logs
CREATE OR REPLACE FUNCTION public.cleanup_existing_spam_logs()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  telegram_deleted INTEGER := 0;
  dead_url_deleted INTEGER := 0;
  total_deleted INTEGER := 0;
BEGIN
  -- Delete ALL telegram-related errors (they're mostly spam)
  DELETE FROM public.system_error_logs 
  WHERE error_type IN ('telegram_send', 'telegram_config', 'telegram_notification');
  GET DIAGNOSTICS telegram_deleted = ROW_COUNT;
  
  -- Delete old dead_url warnings (keep only last 3 days)
  DELETE FROM public.system_error_logs 
  WHERE error_type = 'dead_url' 
  AND created_at < (now() - interval '3 days');
  GET DIAGNOSTICS dead_url_deleted = ROW_COUNT;
  
  total_deleted := telegram_deleted + dead_url_deleted;
  
  RETURN jsonb_build_object(
    'success', true,
    'total_deleted', total_deleted,
    'telegram_spam_deleted', telegram_deleted,
    'old_dead_url_deleted', dead_url_deleted,
    'message', 'Existing spam logs cleaned successfully'
  );
END;
$function$;