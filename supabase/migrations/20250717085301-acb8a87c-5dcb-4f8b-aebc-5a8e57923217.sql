-- Phase 1: Data Integrity Fix

-- First, let's create a function to manually aggregate existing visit_logs into user_visit_stats
CREATE OR REPLACE FUNCTION public.backfill_user_visit_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  processed_count INTEGER := 0;
  license_record RECORD;
  date_record RECORD;
  stats_result RECORD;
BEGIN
  -- For each license that has visit logs but no user_visit_stats
  FOR license_record IN 
    SELECT DISTINCT vl.license_key_id
    FROM public.visit_logs vl
    WHERE vl.license_key_id NOT IN (
      SELECT DISTINCT uvs.license_key_id 
      FROM public.user_visit_stats uvs
    )
  LOOP
    -- For each date that has visits for this license
    FOR date_record IN
      SELECT DATE(vl.created_at) as visit_date
      FROM public.visit_logs vl
      WHERE vl.license_key_id = license_record.license_key_id
      GROUP BY DATE(vl.created_at)
    LOOP
      -- Calculate stats for this license + date combination
      SELECT 
        COUNT(*) as total_visits,
        COUNT(*) FILTER (WHERE NOT is_bot) as human_visits,
        COUNT(*) FILTER (WHERE is_bot) as bot_visits
      INTO stats_result
      FROM public.visit_logs
      WHERE license_key_id = license_record.license_key_id
        AND DATE(created_at) = date_record.visit_date;
      
      -- Insert the aggregated stats
      INSERT INTO public.user_visit_stats (
        license_key_id, 
        visit_date, 
        total_visits, 
        human_visits, 
        bot_visits
      )
      VALUES (
        license_record.license_key_id,
        date_record.visit_date,
        stats_result.total_visits,
        stats_result.human_visits,
        stats_result.bot_visits
      )
      ON CONFLICT (license_key_id, visit_date) 
      DO UPDATE SET
        total_visits = EXCLUDED.total_visits,
        human_visits = EXCLUDED.human_visits,
        bot_visits = EXCLUDED.bot_visits,
        updated_at = now();
      
      processed_count := processed_count + 1;
    END LOOP;
  END LOOP;
  
  RETURN jsonb_build_object(
    'success', true,
    'processed_records', processed_count,
    'message', 'Visit stats backfilled successfully'
  );
END;
$$;

-- Execute the backfill function
SELECT public.backfill_user_visit_stats();

-- Now let's fix the increment_user_visit_stats function to handle cases where session_token is null
CREATE OR REPLACE FUNCTION public.increment_user_visit_stats_enhanced(
  license_key_id_input uuid, 
  is_bot boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  result RECORD;
BEGIN
  INSERT INTO public.user_visit_stats (license_key_id, visit_date, total_visits, human_visits, bot_visits)
  VALUES (
    license_key_id_input, 
    today_date, 
    1, 
    CASE WHEN is_bot THEN 0 ELSE 1 END,
    CASE WHEN is_bot THEN 1 ELSE 0 END
  )
  ON CONFLICT (license_key_id, visit_date) 
  DO UPDATE SET
    total_visits = user_visit_stats.total_visits + 1,
    human_visits = user_visit_stats.human_visits + CASE WHEN is_bot THEN 0 ELSE 1 END,
    bot_visits = user_visit_stats.bot_visits + CASE WHEN is_bot THEN 1 ELSE 0 END,
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
$$;

-- Update the log_visit function to use both the original and enhanced increment functions
CREATE OR REPLACE FUNCTION public.log_visit(
  license_key_id_input uuid, 
  ip_address_input text, 
  session_token_input text DEFAULT NULL, 
  url_hash_input text DEFAULT NULL, 
  country_code_input text DEFAULT NULL, 
  country_name_input text DEFAULT NULL, 
  city_input text DEFAULT NULL, 
  region_input text DEFAULT NULL, 
  timezone_input text DEFAULT NULL, 
  isp_input text DEFAULT NULL, 
  user_agent_input text DEFAULT NULL, 
  browser_input text DEFAULT NULL, 
  device_type_input text DEFAULT NULL, 
  os_input text DEFAULT NULL, 
  referrer_input text DEFAULT NULL, 
  is_bot_input boolean DEFAULT false, 
  bot_confidence_input integer DEFAULT 0, 
  action_taken_input text DEFAULT 'redirect', 
  redirect_url_input text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  visit_id UUID;
BEGIN
  -- Insert visit log
  INSERT INTO public.visit_logs (
    license_key_id,
    session_token,
    url_hash,
    ip_address,
    country_code,
    country_name,
    city,
    region,
    timezone,
    isp,
    user_agent,
    browser,
    device_type,
    os,
    referrer,
    is_bot,
    bot_confidence,
    action_taken,
    redirect_url
  )
  VALUES (
    license_key_id_input,
    session_token_input,
    url_hash_input,
    ip_address_input,
    country_code_input,
    country_name_input,
    city_input,
    region_input,
    timezone_input,
    isp_input,
    user_agent_input,
    browser_input,
    device_type_input,
    os_input,
    referrer_input,
    is_bot_input,
    bot_confidence_input,
    action_taken_input,
    redirect_url_input
  )
  RETURNING id INTO visit_id;
  
  -- Update user visit stats using enhanced function (works with or without session token)
  PERFORM public.increment_user_visit_stats_enhanced(license_key_id_input, is_bot_input);
  
  -- Also try to update via session token if available (for backward compatibility)
  IF session_token_input IS NOT NULL THEN
    PERFORM public.increment_user_visit_stats(session_token_input, is_bot_input);
  END IF;
  
  -- Update global visit stats
  PERFORM public.increment_global_visit_stats(is_bot_input);
  
  RETURN jsonb_build_object(
    'success', true,
    'visit_id', visit_id
  );
END;
$$;