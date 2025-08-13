-- Create license_keys table
CREATE TABLE public.license_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  current_uses INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user_sessions table
CREATE TABLE public.user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key_id UUID NOT NULL REFERENCES public.license_keys(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.license_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for license_keys
CREATE POLICY "License keys are readable by everyone for validation" 
ON public.license_keys 
FOR SELECT 
USING (true);

CREATE POLICY "License keys can be updated for usage tracking" 
ON public.license_keys 
FOR UPDATE 
USING (true);

-- Create policies for user_sessions
CREATE POLICY "User sessions are readable by everyone for validation" 
ON public.user_sessions 
FOR SELECT 
USING (true);

CREATE POLICY "User sessions can be created during license validation" 
ON public.user_sessions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "User sessions can be updated for status changes" 
ON public.user_sessions 
FOR UPDATE 
USING (true);

-- Create indexes for performance
CREATE INDEX idx_license_keys_license_key ON public.license_keys(license_key);
CREATE INDEX idx_license_keys_active ON public.license_keys(is_active);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to validate license key
CREATE OR REPLACE FUNCTION public.validate_license_key(key_input TEXT)
RETURNS JSONB AS $$
DECLARE
  license_record RECORD;
  result JSONB;
BEGIN
  -- Get license key record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = key_input;
  
  -- Check if key exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid license key');
  END IF;
  
  -- Check if key is active
  IF NOT license_record.is_active THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key is inactive');
  END IF;
  
  -- Check if key has expired
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key has expired');
  END IF;
  
  -- Check if key has reached max uses
  IF license_record.max_uses IS NOT NULL AND license_record.current_uses >= license_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License key usage limit reached');
  END IF;
  
  -- Key is valid
  RETURN jsonb_build_object('valid', true, 'key_id', license_record.id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to create user session
CREATE OR REPLACE FUNCTION public.create_user_session(key_input TEXT)
RETURNS JSONB AS $$
DECLARE
  license_record RECORD;
  session_token TEXT;
  session_id UUID;
  validation_result JSONB;
BEGIN
  -- Validate the license key first
  validation_result := public.validate_license_key(key_input);
  
  IF NOT (validation_result->>'valid')::boolean THEN
    RETURN validation_result;
  END IF;
  
  -- Get license key record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = key_input;
  
  -- Generate session token
  session_token := encode(gen_random_bytes(32), 'hex');
  
  -- Create session
  INSERT INTO public.user_sessions (license_key_id, session_token, expires_at)
  VALUES (license_record.id, session_token, now() + interval '24 hours')
  RETURNING id INTO session_id;
  
  -- Increment usage count
  UPDATE public.license_keys 
  SET current_uses = current_uses + 1 
  WHERE id = license_record.id;
  
  RETURN jsonb_build_object(
    'valid', true, 
    'session_token', session_token,
    'session_id', session_id,
    'expires_at', (now() + interval '24 hours')::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;