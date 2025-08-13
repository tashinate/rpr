
-- Create script_downloads table for file metadata management
CREATE TABLE public.script_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  version TEXT DEFAULT '1.0.0',
  category TEXT DEFAULT 'general',
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  download_count INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create user_script_downloads table for download tracking
CREATE TABLE public.user_script_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  license_key_id UUID NOT NULL,
  script_id UUID NOT NULL,
  download_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  download_success BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.script_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_script_downloads ENABLE ROW LEVEL SECURITY;

-- Create policies for script_downloads
CREATE POLICY "Scripts are readable by everyone" 
ON public.script_downloads 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Scripts can be created by admins" 
ON public.script_downloads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Scripts can be updated by admins" 
ON public.script_downloads 
FOR UPDATE 
USING (true);

CREATE POLICY "Scripts can be deleted by admins" 
ON public.script_downloads 
FOR DELETE 
USING (true);

-- Create policies for user_script_downloads
CREATE POLICY "Download logs are readable by everyone" 
ON public.user_script_downloads 
FOR SELECT 
USING (true);

CREATE POLICY "Download logs can be created during downloads" 
ON public.user_script_downloads 
FOR INSERT 
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_script_downloads_active ON public.script_downloads(is_active);
CREATE INDEX idx_script_downloads_category ON public.script_downloads(category);
CREATE INDEX idx_user_script_downloads_license ON public.user_script_downloads(license_key_id);
CREATE INDEX idx_user_script_downloads_script ON public.user_script_downloads(script_id);
CREATE INDEX idx_user_script_downloads_date ON public.user_script_downloads(download_date);

-- Create storage bucket for script files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('script-files', 'script-files', false);

-- Create storage policies
CREATE POLICY "Script files are readable by authenticated users" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'script-files');

CREATE POLICY "Script files can be uploaded by admins" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'script-files');

CREATE POLICY "Script files can be updated by admins" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'script-files');

CREATE POLICY "Script files can be deleted by admins" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'script-files');

-- Function to log script downloads
CREATE OR REPLACE FUNCTION public.log_script_download(
  script_id_input uuid,
  license_key_id_input uuid,
  ip_address_input text DEFAULT NULL,
  user_agent_input text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Insert download log
  INSERT INTO public.user_script_downloads (
    script_id,
    license_key_id,
    ip_address,
    user_agent
  ) VALUES (
    script_id_input,
    license_key_id_input,
    ip_address_input,
    user_agent_input
  );
  
  -- Increment download count
  UPDATE public.script_downloads 
  SET download_count = download_count + 1,
      updated_at = now()
  WHERE id = script_id_input;
  
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Function to get script download stats
CREATE OR REPLACE FUNCTION public.get_script_download_stats(days_back integer DEFAULT 30)
RETURNS TABLE(
  script_id uuid,
  script_name text,
  total_downloads bigint,
  recent_downloads bigint,
  unique_users bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sd.id,
    sd.display_name,
    sd.download_count,
    COUNT(usd.id) FILTER (WHERE usd.download_date >= (now() - (days_back || ' days')::interval)),
    COUNT(DISTINCT usd.license_key_id) FILTER (WHERE usd.download_date >= (now() - (days_back || ' days')::interval))
  FROM public.script_downloads sd
  LEFT JOIN public.user_script_downloads usd ON sd.id = usd.script_id
  WHERE sd.is_active = true
  GROUP BY sd.id, sd.display_name, sd.download_count
  ORDER BY sd.download_count DESC;
END;
$$;
