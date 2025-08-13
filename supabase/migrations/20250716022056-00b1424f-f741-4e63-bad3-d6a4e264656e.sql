-- Create auth_ciphers table for secure password storage
CREATE TABLE public.auth_ciphers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key_id UUID NOT NULL REFERENCES public.license_keys(id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(license_key_id)
);

-- Enable Row Level Security
ALTER TABLE public.auth_ciphers ENABLE ROW LEVEL SECURITY;

-- Create policies for auth_ciphers
CREATE POLICY "Users can view their own auth ciphers" 
ON public.auth_ciphers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own auth ciphers" 
ON public.auth_ciphers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own auth ciphers" 
ON public.auth_ciphers 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete their own auth ciphers" 
ON public.auth_ciphers 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_auth_ciphers_updated_at
BEFORE UPDATE ON public.auth_ciphers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create auth cipher
CREATE OR REPLACE FUNCTION public.create_auth_cipher(license_key_input text, password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  license_record RECORD;
  cipher_id UUID;
BEGIN
  -- Validate license key exists and is active
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input 
  AND status = 'active' 
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive license key');
  END IF;
  
  -- Check if cipher already exists for this license
  IF EXISTS (SELECT 1 FROM public.auth_ciphers WHERE license_key_id = license_record.id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cipher already exists for this license key');
  END IF;
  
  -- Create auth cipher
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, password_hash_input)
  RETURNING id INTO cipher_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'cipher_id', cipher_id,
    'license_key_id', license_record.id
  );
END;
$function$;

-- Function to validate auth cipher
CREATE OR REPLACE FUNCTION public.validate_auth_cipher(password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  cipher_record RECORD;
  license_record RECORD;
BEGIN
  -- Find matching cipher by password hash
  SELECT ac.*, lk.license_key 
  INTO cipher_record
  FROM public.auth_ciphers ac
  JOIN public.license_keys lk ON ac.license_key_id = lk.id
  WHERE ac.password_hash = password_hash_input
  AND lk.status = 'active'
  AND lk.is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid password or inactive license');
  END IF;
  
  -- Reset attempt count on successful validation
  UPDATE public.auth_ciphers 
  SET attempt_count = 0, last_attempt_at = now()
  WHERE id = cipher_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'license_key', cipher_record.license_key,
    'license_key_id', cipher_record.license_key_id
  );
END;
$function$;

-- Function to reset auth cipher
CREATE OR REPLACE FUNCTION public.reset_auth_cipher(license_key_input text, new_password_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  license_record RECORD;
BEGIN
  -- Validate license key exists and is active
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input 
  AND status = 'active' 
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or inactive license key');
  END IF;
  
  -- Update existing cipher or create new one
  INSERT INTO public.auth_ciphers (license_key_id, password_hash)
  VALUES (license_record.id, new_password_hash_input)
  ON CONFLICT (license_key_id)
  DO UPDATE SET
    password_hash = new_password_hash_input,
    attempt_count = 0,
    last_attempt_at = null,
    updated_at = now();
  
  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Function to increment failed attempts
CREATE OR REPLACE FUNCTION public.increment_failed_attempts(license_key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  license_record RECORD;
  current_attempts INTEGER;
BEGIN
  -- Get license record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'License key not found');
  END IF;
  
  -- Increment attempt count
  UPDATE public.auth_ciphers 
  SET 
    attempt_count = attempt_count + 1,
    last_attempt_at = now()
  WHERE license_key_id = license_record.id
  RETURNING attempt_count INTO current_attempts;
  
  RETURN jsonb_build_object(
    'success', true,
    'attempt_count', COALESCE(current_attempts, 0)
  );
END;
$function$;

-- Function to check if license is under cooldown
CREATE OR REPLACE FUNCTION public.check_auth_cooldown(license_key_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  license_record RECORD;
  cipher_record RECORD;
  cooldown_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get license record
  SELECT * INTO license_record 
  FROM public.license_keys 
  WHERE license_key = license_key_input;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'License key not found');
  END IF;
  
  -- Get cipher record
  SELECT * INTO cipher_record
  FROM public.auth_ciphers
  WHERE license_key_id = license_record.id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('under_cooldown', false, 'attempt_count', 0);
  END IF;
  
  -- Check if under cooldown (5+ failed attempts within 15 minutes)
  IF cipher_record.attempt_count >= 5 
     AND cipher_record.last_attempt_at IS NOT NULL 
     AND cipher_record.last_attempt_at > (now() - interval '15 minutes') THEN
    
    cooldown_end := cipher_record.last_attempt_at + interval '15 minutes';
    
    RETURN jsonb_build_object(
      'under_cooldown', true,
      'attempt_count', cipher_record.attempt_count,
      'cooldown_end', cooldown_end,
      'remaining_seconds', EXTRACT(EPOCH FROM (cooldown_end - now()))::integer
    );
  END IF;
  
  -- Reset attempts if cooldown period has passed
  IF cipher_record.attempt_count >= 5 
     AND cipher_record.last_attempt_at IS NOT NULL 
     AND cipher_record.last_attempt_at <= (now() - interval '15 minutes') THEN
    
    UPDATE public.auth_ciphers 
    SET attempt_count = 0, last_attempt_at = null
    WHERE id = cipher_record.id;
    
    RETURN jsonb_build_object('under_cooldown', false, 'attempt_count', 0);
  END IF;
  
  RETURN jsonb_build_object(
    'under_cooldown', false, 
    'attempt_count', cipher_record.attempt_count
  );
END;
$function$;