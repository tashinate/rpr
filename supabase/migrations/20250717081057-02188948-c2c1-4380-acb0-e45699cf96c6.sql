-- Create a comprehensive visit tracking table
CREATE TABLE IF NOT EXISTS public.visit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key_id UUID NOT NULL,
  session_token TEXT,
  url_hash TEXT,
  ip_address TEXT NOT NULL,
  country_code TEXT,
  country_name TEXT,
  city TEXT,
  region TEXT,
  timezone TEXT,
  isp TEXT,
  user_agent TEXT,
  browser TEXT,
  device_type TEXT,
  os TEXT,
  referrer TEXT,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  bot_confidence INTEGER DEFAULT 0,
  action_taken TEXT DEFAULT 'unknown',
  redirect_url TEXT,
  visit_duration INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.visit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for visit logs
CREATE POLICY "Users can view their own visit logs" 
ON public.visit_logs 
FOR SELECT 
USING (
  license_key_id IN (
    SELECT us.license_key_id 
    FROM public.user_sessions us 
    WHERE us.session_token = current_setting('request.headers', true)::json->>'session-token'
    AND us.expires_at > now()
    AND us.is_active = true
  )
);

CREATE POLICY "Visit logs can be created during tracking" 
ON public.visit_logs 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Visit logs can be updated during tracking" 
ON public.visit_logs 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visit_logs_license_key_id ON public.visit_logs(license_key_id);
CREATE INDEX IF NOT EXISTS idx_visit_logs_created_at ON public.visit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visit_logs_ip_address ON public.visit_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_visit_logs_is_bot ON public.visit_logs(is_bot);
CREATE INDEX IF NOT EXISTS idx_visit_logs_url_hash ON public.visit_logs(url_hash);

-- Create trigger for updated_at
CREATE TRIGGER update_visit_logs_updated_at
BEFORE UPDATE ON public.visit_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log visits (fixed parameter defaults)
CREATE OR REPLACE FUNCTION public.log_visit(
  license_key_id_input UUID,
  ip_address_input TEXT,
  session_token_input TEXT DEFAULT NULL,
  url_hash_input TEXT DEFAULT NULL,
  country_code_input TEXT DEFAULT NULL,
  country_name_input TEXT DEFAULT NULL,
  city_input TEXT DEFAULT NULL,
  region_input TEXT DEFAULT NULL,
  timezone_input TEXT DEFAULT NULL,
  isp_input TEXT DEFAULT NULL,
  user_agent_input TEXT DEFAULT NULL,
  browser_input TEXT DEFAULT NULL,
  device_type_input TEXT DEFAULT NULL,
  os_input TEXT DEFAULT NULL,
  referrer_input TEXT DEFAULT NULL,
  is_bot_input BOOLEAN DEFAULT false,
  bot_confidence_input INTEGER DEFAULT 0,
  action_taken_input TEXT DEFAULT 'redirect',
  redirect_url_input TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
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
  
  -- Update user visit stats if session token provided
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
$function$;