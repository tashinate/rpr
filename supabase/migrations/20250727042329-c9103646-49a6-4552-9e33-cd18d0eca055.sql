-- Create manual_decisions table for user-controlled Allow/Deny decisions
CREATE TABLE public.manual_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_token TEXT NOT NULL,
  decision_key TEXT NOT NULL UNIQUE,
  decision TEXT CHECK (decision IN ('allow', 'deny', 'pending')) NOT NULL DEFAULT 'pending',
  visitor_data JSONB NOT NULL DEFAULT '{}',
  license_key_id UUID NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.manual_decisions ENABLE ROW LEVEL SECURITY;

-- Create policies for manual decisions
CREATE POLICY "Users can view their own manual decisions" 
ON public.manual_decisions 
FOR SELECT 
USING (license_key_id IN (
  SELECT us.license_key_id 
  FROM public.user_sessions us 
  WHERE us.session_token = current_setting('request.headers', true)::json->>'session-token'
  AND us.expires_at > now() 
  AND us.is_active = true
));

CREATE POLICY "Manual decisions can be created for visitors" 
ON public.manual_decisions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own manual decisions" 
ON public.manual_decisions 
FOR UPDATE 
USING (license_key_id IN (
  SELECT us.license_key_id 
  FROM public.user_sessions us 
  WHERE us.session_token = current_setting('request.headers', true)::json->>'session-token'
  AND us.expires_at > now() 
  AND us.is_active = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_manual_decisions_updated_at
BEFORE UPDATE ON public.manual_decisions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create cleanup function for expired decisions
CREATE OR REPLACE FUNCTION public.cleanup_expired_manual_decisions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete expired manual decisions
  DELETE FROM public.manual_decisions 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$;