-- Create URL registry table to map generated URLs to their source licenses
CREATE TABLE public.url_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url_hash TEXT NOT NULL UNIQUE,
  license_key_id UUID NOT NULL,
  original_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable Row Level Security
ALTER TABLE public.url_registry ENABLE ROW LEVEL SECURITY;

-- Create policies for URL registry access
CREATE POLICY "URL registry is readable by everyone for validation" 
ON public.url_registry 
FOR SELECT 
USING (true);

CREATE POLICY "URL registry can be created during URL generation" 
ON public.url_registry 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "URL registry can be updated for status changes" 
ON public.url_registry 
FOR UPDATE 
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_url_registry_hash ON public.url_registry(url_hash);
CREATE INDEX idx_url_registry_license ON public.url_registry(license_key_id);

-- Create function to register URLs
CREATE OR REPLACE FUNCTION public.register_generated_url(
  url_hash_input text,
  license_key_id_input uuid,
  original_url_input text,
  expires_at_input timestamp with time zone DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.url_registry (url_hash, license_key_id, original_url, expires_at)
  VALUES (url_hash_input, license_key_id_input, original_url_input, expires_at_input)
  ON CONFLICT (url_hash) 
  DO UPDATE SET
    license_key_id = url_hash_input,
    original_url = original_url_input,
    expires_at = expires_at_input,
    is_active = true;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create function to lookup license from URL
CREATE OR REPLACE FUNCTION public.get_license_from_url(url_hash_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  registry_record RECORD;
  license_record RECORD;
BEGIN
  -- Get URL registry record
  SELECT * INTO registry_record
  FROM public.url_registry
  WHERE url_hash = url_hash_input
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'URL not found in registry');
  END IF;
  
  -- Check if URL has expired
  IF registry_record.expires_at IS NOT NULL AND registry_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'URL has expired');
  END IF;
  
  -- Get license record
  SELECT * INTO license_record
  FROM public.license_keys
  WHERE id = registry_record.license_key_id
  AND status = 'active'
  AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License deleted or inactive');
  END IF;
  
  -- Check if license has expired
  IF license_record.expires_at IS NOT NULL AND license_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'License expired');
  END IF;
  
  RETURN jsonb_build_object(
    'valid', true,
    'license_id', license_record.id,
    'license_key', license_record.license_key,
    'original_url', registry_record.original_url
  );
END;
$$;