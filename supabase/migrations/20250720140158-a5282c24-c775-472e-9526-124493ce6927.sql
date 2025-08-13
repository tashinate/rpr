
-- Create inbox testing infrastructure tables

-- Table for storing inbox test results
CREATE TABLE public.inbox_test_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_id UUID REFERENCES public.url_patterns(id),
  test_email TEXT NOT NULL,
  email_provider TEXT NOT NULL, -- 'gmail', 'outlook', 'yahoo'
  delivery_status TEXT NOT NULL, -- 'delivered', 'spam', 'blocked', 'bounced'
  delivery_time INTERVAL,
  spam_score NUMERIC(5,2),
  filter_reason TEXT,
  test_batch_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for pattern performance metrics
CREATE TABLE public.pattern_performance_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_id UUID REFERENCES public.url_patterns(id),
  email_provider TEXT NOT NULL,
  delivery_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  spam_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  block_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  avg_delivery_time INTERVAL,
  total_tests INTEGER NOT NULL DEFAULT 0,
  last_test_date DATE NOT NULL DEFAULT CURRENT_DATE,
  performance_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  trend_direction TEXT DEFAULT 'stable', -- 'improving', 'declining', 'stable'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for seed email accounts management
CREATE TABLE public.seed_email_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_address TEXT NOT NULL UNIQUE,
  email_provider TEXT NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'suspended', 'compromised'
  api_credentials JSONB,
  last_check_date TIMESTAMP WITH TIME ZONE,
  check_frequency_hours INTEGER NOT NULL DEFAULT 24,
  inbox_access_method TEXT NOT NULL, -- 'imap', 'api', 'web'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for test batches
CREATE TABLE public.inbox_test_batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_name TEXT NOT NULL,
  test_type TEXT NOT NULL, -- 'pattern_validation', 'performance_check', 'competitive_analysis'
  patterns_tested INTEGER NOT NULL DEFAULT 0,
  total_emails_sent INTEGER NOT NULL DEFAULT 0,
  avg_delivery_rate NUMERIC(5,2),
  test_status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_inbox_test_results_pattern_id ON public.inbox_test_results(pattern_id);
CREATE INDEX idx_inbox_test_results_email_provider ON public.inbox_test_results(email_provider);
CREATE INDEX idx_inbox_test_results_delivery_status ON public.inbox_test_results(delivery_status);
CREATE INDEX idx_inbox_test_results_test_batch_id ON public.inbox_test_results(test_batch_id);

CREATE INDEX idx_pattern_performance_pattern_id ON public.pattern_performance_metrics(pattern_id);
CREATE INDEX idx_pattern_performance_email_provider ON public.pattern_performance_metrics(email_provider);
CREATE INDEX idx_pattern_performance_score ON public.pattern_performance_metrics(performance_score DESC);

CREATE INDEX idx_seed_accounts_provider ON public.seed_email_accounts(email_provider);
CREATE INDEX idx_seed_accounts_status ON public.seed_email_accounts(account_status);

-- Enable RLS
ALTER TABLE public.inbox_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seed_email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbox_test_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Inbox test results are readable by everyone" 
  ON public.inbox_test_results FOR SELECT USING (true);

CREATE POLICY "Inbox test results can be created" 
  ON public.inbox_test_results FOR INSERT WITH CHECK (true);

CREATE POLICY "Inbox test results can be updated" 
  ON public.inbox_test_results FOR UPDATE USING (true);

CREATE POLICY "Pattern performance metrics are readable by everyone" 
  ON public.pattern_performance_metrics FOR SELECT USING (true);

CREATE POLICY "Pattern performance metrics can be created" 
  ON public.pattern_performance_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Pattern performance metrics can be updated" 
  ON public.pattern_performance_metrics FOR UPDATE USING (true);

CREATE POLICY "Seed email accounts are readable by everyone" 
  ON public.seed_email_accounts FOR SELECT USING (true);

CREATE POLICY "Seed email accounts can be created" 
  ON public.seed_email_accounts FOR INSERT WITH CHECK (true);

CREATE POLICY "Seed email accounts can be updated" 
  ON public.seed_email_accounts FOR UPDATE USING (true);

CREATE POLICY "Inbox test batches are readable by everyone" 
  ON public.inbox_test_batches FOR SELECT USING (true);

CREATE POLICY "Inbox test batches can be created" 
  ON public.inbox_test_batches FOR INSERT WITH CHECK (true);

CREATE POLICY "Inbox test batches can be updated" 
  ON public.inbox_test_batches FOR UPDATE USING (true);

-- Create functions for inbox testing

-- Function to record test result and update metrics
CREATE OR REPLACE FUNCTION public.record_inbox_test_result(
  pattern_id_input UUID,
  test_email_input TEXT,
  email_provider_input TEXT,
  delivery_status_input TEXT,
  delivery_time_input INTERVAL DEFAULT NULL,
  spam_score_input NUMERIC DEFAULT NULL,
  filter_reason_input TEXT DEFAULT NULL,
  test_batch_id_input UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  test_result_id UUID;
  current_metrics RECORD;
BEGIN
  -- Insert test result
  INSERT INTO public.inbox_test_results (
    pattern_id, test_email, email_provider, delivery_status,
    delivery_time, spam_score, filter_reason, test_batch_id
  )
  VALUES (
    pattern_id_input, test_email_input, email_provider_input, delivery_status_input,
    delivery_time_input, spam_score_input, filter_reason_input, test_batch_id_input
  )
  RETURNING id INTO test_result_id;
  
  -- Update or insert performance metrics
  INSERT INTO public.pattern_performance_metrics (
    pattern_id, email_provider, total_tests, last_test_date
  )
  VALUES (
    pattern_id_input, email_provider_input, 1, CURRENT_DATE
  )
  ON CONFLICT (pattern_id, email_provider)
  DO UPDATE SET
    total_tests = pattern_performance_metrics.total_tests + 1,
    last_test_date = CURRENT_DATE,
    updated_at = now();
  
  -- Recalculate metrics for this pattern and provider
  PERFORM public.recalculate_pattern_metrics(pattern_id_input, email_provider_input);
  
  RETURN jsonb_build_object(
    'success', true,
    'test_result_id', test_result_id
  );
END;
$$;

-- Function to recalculate pattern performance metrics
CREATE OR REPLACE FUNCTION public.recalculate_pattern_metrics(
  pattern_id_input UUID,
  email_provider_input TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  metrics_data RECORD;
  performance_score NUMERIC;
BEGIN
  -- Calculate metrics from recent test results (last 30 days)
  SELECT 
    COUNT(*) as total_tests,
    COUNT(*) FILTER (WHERE delivery_status = 'delivered') as delivered_count,
    COUNT(*) FILTER (WHERE delivery_status = 'spam') as spam_count,
    COUNT(*) FILTER (WHERE delivery_status IN ('blocked', 'bounced')) as blocked_count,
    AVG(delivery_time) as avg_delivery_time
  INTO metrics_data
  FROM public.inbox_test_results
  WHERE pattern_id = pattern_id_input 
    AND email_provider = email_provider_input
    AND created_at >= (now() - interval '30 days');
  
  IF metrics_data.total_tests > 0 THEN
    -- Calculate rates
    DECLARE
      delivery_rate NUMERIC := (metrics_data.delivered_count::NUMERIC / metrics_data.total_tests) * 100;
      spam_rate NUMERIC := (metrics_data.spam_count::NUMERIC / metrics_data.total_tests) * 100;
      block_rate NUMERIC := (metrics_data.blocked_count::NUMERIC / metrics_data.total_tests) * 100;
    BEGIN
      -- Calculate performance score (weighted: 70% delivery, 20% spam avoidance, 10% block avoidance)
      performance_score := (delivery_rate * 0.7) + ((100 - spam_rate) * 0.2) + ((100 - block_rate) * 0.1);
      
      -- Update metrics
      UPDATE public.pattern_performance_metrics
      SET 
        delivery_rate = delivery_rate,
        spam_rate = spam_rate,
        block_rate = block_rate,
        avg_delivery_time = metrics_data.avg_delivery_time,
        performance_score = performance_score,
        updated_at = now()
      WHERE pattern_id = pattern_id_input AND email_provider = email_provider_input;
    END;
  END IF;
  
  RETURN jsonb_build_object('success', true, 'performance_score', performance_score);
END;
$$;

-- Function to get top performing patterns
CREATE OR REPLACE FUNCTION public.get_top_performing_patterns(
  email_provider_input TEXT DEFAULT NULL,
  limit_input INTEGER DEFAULT 10
) RETURNS TABLE(
  pattern_id UUID,
  pattern_name TEXT,
  email_provider TEXT,
  delivery_rate NUMERIC,
  performance_score NUMERIC,
  total_tests INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ppm.pattern_id,
    up.pattern_name,
    ppm.email_provider,
    ppm.delivery_rate,
    ppm.performance_score,
    ppm.total_tests
  FROM public.pattern_performance_metrics ppm
  JOIN public.url_patterns up ON ppm.pattern_id = up.id
  WHERE (email_provider_input IS NULL OR ppm.email_provider = email_provider_input)
    AND ppm.total_tests >= 5 -- Minimum tests for reliability
  ORDER BY ppm.performance_score DESC, ppm.delivery_rate DESC
  LIMIT limit_input;
END;
$$;

-- Add trigger to update updated_at columns
CREATE TRIGGER update_inbox_test_results_updated_at
  BEFORE UPDATE ON public.inbox_test_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pattern_performance_metrics_updated_at
  BEFORE UPDATE ON public.pattern_performance_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seed_email_accounts_updated_at
  BEFORE UPDATE ON public.seed_email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
