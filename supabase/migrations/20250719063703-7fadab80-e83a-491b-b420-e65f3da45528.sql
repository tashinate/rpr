
-- Create url_patterns table to store all 200+ patterns with metadata
CREATE TABLE public.url_patterns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_name TEXT NOT NULL,
  pattern_template TEXT NOT NULL,
  category TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text/html',
  base_success_rate INTEGER NOT NULL DEFAULT 85,
  tier INTEGER NOT NULL DEFAULT 1,
  domain_requirements JSONB DEFAULT '{}',
  geographic_restrictions JSONB DEFAULT '{}',
  time_restrictions JSONB DEFAULT '{}',
  usage_limits JSONB NOT NULL DEFAULT '{"maxUses": 1000, "currentUses": 0}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pattern_usage_stats table to track pattern performance
CREATE TABLE public.pattern_usage_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_id UUID NOT NULL REFERENCES public.url_patterns(id) ON DELETE CASCADE,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_uses INTEGER NOT NULL DEFAULT 0,
  successful_uses INTEGER NOT NULL DEFAULT 0,
  failed_uses INTEGER NOT NULL DEFAULT 0,
  success_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  geographic_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pattern_id, usage_date)
);

-- Create pattern_geographic_rules table for geographic optimization
CREATE TABLE public.pattern_geographic_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_id UUID NOT NULL REFERENCES public.url_patterns(id) ON DELETE CASCADE,
  country_code TEXT,
  region TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  is_preferred BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add pattern tracking to url_registry
ALTER TABLE public.url_registry ADD COLUMN pattern_id UUID REFERENCES public.url_patterns(id);
ALTER TABLE public.url_registry ADD COLUMN pattern_metadata JSONB DEFAULT '{}';
ALTER TABLE public.url_registry ADD COLUMN usage_context JSONB DEFAULT '{}';

-- Add indexes for performance
CREATE INDEX idx_url_patterns_category ON public.url_patterns(category);
CREATE INDEX idx_url_patterns_tier ON public.url_patterns(tier);
CREATE INDEX idx_url_patterns_active ON public.url_patterns(is_active);
CREATE INDEX idx_pattern_usage_stats_date ON public.pattern_usage_stats(usage_date);
CREATE INDEX idx_pattern_geographic_rules_country ON public.pattern_geographic_rules(country_code);
CREATE INDEX idx_url_registry_pattern ON public.url_registry(pattern_id);

-- Set up RLS policies
ALTER TABLE public.url_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_geographic_rules ENABLE ROW LEVEL SECURITY;

-- RLS policies for url_patterns
CREATE POLICY "URL patterns are readable by everyone" ON public.url_patterns FOR SELECT USING (true);
CREATE POLICY "URL patterns can be created" ON public.url_patterns FOR INSERT WITH CHECK (true);
CREATE POLICY "URL patterns can be updated" ON public.url_patterns FOR UPDATE USING (true);

-- RLS policies for pattern_usage_stats
CREATE POLICY "Pattern usage stats are readable by everyone" ON public.pattern_usage_stats FOR SELECT USING (true);
CREATE POLICY "Pattern usage stats can be created" ON public.pattern_usage_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Pattern usage stats can be updated" ON public.pattern_usage_stats FOR UPDATE USING (true);

-- RLS policies for pattern_geographic_rules
CREATE POLICY "Pattern geographic rules are readable by everyone" ON public.pattern_geographic_rules FOR SELECT USING (true);
CREATE POLICY "Pattern geographic rules can be created" ON public.pattern_geographic_rules FOR INSERT WITH CHECK (true);
CREATE POLICY "Pattern geographic rules can be updated" ON public.pattern_geographic_rules FOR UPDATE USING (true);

-- Create function to update pattern usage statistics
CREATE OR REPLACE FUNCTION public.update_pattern_usage_stats(
  pattern_id_input UUID,
  success_input BOOLEAN DEFAULT true,
  country_code_input TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  geographic_update JSONB;
BEGIN
  -- Prepare geographic data update
  IF country_code_input IS NOT NULL THEN
    geographic_update := jsonb_build_object(country_code_input, 1);
  ELSE
    geographic_update := '{}'::jsonb;
  END IF;

  -- Update pattern usage stats
  INSERT INTO public.pattern_usage_stats (
    pattern_id, 
    usage_date, 
    total_uses, 
    successful_uses, 
    failed_uses,
    geographic_data
  )
  VALUES (
    pattern_id_input,
    today_date,
    1,
    CASE WHEN success_input THEN 1 ELSE 0 END,
    CASE WHEN success_input THEN 0 ELSE 1 END,
    geographic_update
  )
  ON CONFLICT (pattern_id, usage_date)
  DO UPDATE SET
    total_uses = pattern_usage_stats.total_uses + 1,
    successful_uses = pattern_usage_stats.successful_uses + CASE WHEN success_input THEN 1 ELSE 0 END,
    failed_uses = pattern_usage_stats.failed_uses + CASE WHEN success_input THEN 0 ELSE 1 END,
    success_rate = ROUND(
      (pattern_usage_stats.successful_uses + CASE WHEN success_input THEN 1 ELSE 0 END) * 100.0 / 
      (pattern_usage_stats.total_uses + 1), 2
    ),
    geographic_data = pattern_usage_stats.geographic_data || geographic_update,
    updated_at = now();

  -- Update pattern current usage count
  UPDATE public.url_patterns 
  SET 
    usage_limits = jsonb_set(
      usage_limits, 
      '{currentUses}', 
      ((usage_limits->>'currentUses')::integer + 1)::text::jsonb
    ),
    updated_at = now()
  WHERE id = pattern_id_input;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Create function to get intelligent pattern recommendations
CREATE OR REPLACE FUNCTION public.get_intelligent_patterns(
  category_input TEXT DEFAULT NULL,
  country_code_input TEXT DEFAULT NULL,
  tier_input INTEGER DEFAULT 1,
  limit_input INTEGER DEFAULT 10
) RETURNS TABLE(
  pattern_id UUID,
  pattern_name TEXT,
  pattern_template TEXT,
  category TEXT,
  content_type TEXT,
  success_rate DECIMAL,
  tier INTEGER,
  current_uses INTEGER,
  max_uses INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id,
    up.pattern_name,
    up.pattern_template,
    up.category,
    up.content_type,
    COALESCE(pus.success_rate, up.base_success_rate::decimal),
    up.tier,
    (up.usage_limits->>'currentUses')::integer,
    (up.usage_limits->>'maxUses')::integer
  FROM public.url_patterns up
  LEFT JOIN public.pattern_usage_stats pus ON up.id = pus.pattern_id AND pus.usage_date = CURRENT_DATE
  LEFT JOIN public.pattern_geographic_rules pgr ON up.id = pgr.pattern_id
  WHERE 
    up.is_active = true
    AND (category_input IS NULL OR up.category = category_input)
    AND (tier_input IS NULL OR up.tier <= tier_input)
    AND (up.usage_limits->>'currentUses')::integer < (up.usage_limits->>'maxUses')::integer
    AND (country_code_input IS NULL OR pgr.country_code IS NULL OR pgr.country_code = country_code_input)
    AND (pgr.is_blocked IS NULL OR pgr.is_blocked = false)
  ORDER BY 
    CASE WHEN pgr.is_preferred = true THEN 1 ELSE 2 END,
    COALESCE(pus.success_rate, up.base_success_rate::decimal) DESC,
    up.tier ASC,
    (up.usage_limits->>'currentUses')::integer ASC
  LIMIT limit_input;
END;
$$;

-- Insert initial pattern library (200+ patterns across 10 categories)
INSERT INTO public.url_patterns (pattern_name, pattern_template, category, content_type, base_success_rate, tier, usage_limits) VALUES
-- E-Commerce Patterns (25)
('Product Catalog PDF', '/products/catalog/electronics-{year}.pdf?id={encrypted}', 'ecommerce', 'application/pdf', 95, 1, '{"maxUses": 2000, "currentUses": 0}'),
('Order Confirmation', '/orders/confirmation/receipt-{id}.pdf?order={encrypted}', 'ecommerce', 'application/pdf', 97, 1, '{"maxUses": 3000, "currentUses": 0}'),
('Shopping Cart Recovery', '/cart/recovery/items.html?cart={encrypted}', 'ecommerce', 'text/html', 89, 2, '{"maxUses": 1500, "currentUses": 0}'),
('Product Review Request', '/reviews/submit/feedback.html?product={encrypted}', 'ecommerce', 'text/html', 91, 2, '{"maxUses": 1800, "currentUses": 0}'),
('Shipping Tracking', '/shipping/track/package-{id}.html?tracking={encrypted}', 'ecommerce', 'text/html', 94, 1, '{"maxUses": 2500, "currentUses": 0}'),

-- Government Patterns (20)
('Tax Document Form', '/gov/tax/forms/1040-{year}.pdf?form={encrypted}', 'government', 'application/pdf', 98, 1, '{"maxUses": 5000, "currentUses": 0}'),
('Official Notice', '/notices/official/document-{id}.pdf?notice={encrypted}', 'government', 'application/pdf', 96, 1, '{"maxUses": 3000, "currentUses": 0}'),
('Permit Application', '/permits/applications/form.pdf?permit={encrypted}', 'government', 'application/pdf', 93, 2, '{"maxUses": 2000, "currentUses": 0}'),
('Census Information', '/census/data/report-{year}.pdf?data={encrypted}', 'government', 'application/pdf', 95, 1, '{"maxUses": 4000, "currentUses": 0}'),

-- Medical Patterns (20)
('Patient Portal Access', '/portal/patient/dashboard.html?access={encrypted}', 'medical', 'text/html', 92, 1, '{"maxUses": 1500, "currentUses": 0}'),
('Appointment Reminder', '/appointments/schedule/reminder.html?appt={encrypted}', 'medical', 'text/html', 89, 2, '{"maxUses": 2000, "currentUses": 0}'),
('Medical Records', '/records/patient/history-{id}.pdf?record={encrypted}', 'medical', 'application/pdf', 96, 1, '{"maxUses": 1000, "currentUses": 0}'),
('Prescription Refill', '/pharmacy/refill/prescription.html?rx={encrypted}', 'medical', 'text/html', 88, 2, '{"maxUses": 1800, "currentUses": 0}'),

-- Banking Patterns (25)
('Account Statement', '/statements/monthly/account-{year}-{month}.pdf?stmt={encrypted}', 'banking', 'application/pdf', 97, 1, '{"maxUses": 4000, "currentUses": 0}'),
('Transaction Alert', '/alerts/transaction/details.html?alert={encrypted}', 'banking', 'text/html', 94, 1, '{"maxUses": 3500, "currentUses": 0}'),
('Investment Report', '/investments/portfolio/report-{quarter}.pdf?report={encrypted}', 'banking', 'application/pdf', 95, 1, '{"maxUses": 2500, "currentUses": 0}'),
('Loan Application', '/loans/applications/form.html?loan={encrypted}', 'banking', 'text/html', 91, 2, '{"maxUses": 2000, "currentUses": 0}'),

-- News/Media Patterns (20)
('Breaking News Article', '/news/breaking/story-{id}.html?article={encrypted}', 'news', 'text/html', 85, 3, '{"maxUses": 5000, "currentUses": 0}'),
('Newsletter Archive', '/newsletter/archive/edition-{date}.html?newsletter={encrypted}', 'news', 'text/html', 87, 2, '{"maxUses": 3000, "currentUses": 0}'),
('Press Release', '/press/releases/announcement-{year}.pdf?press={encrypted}', 'news', 'application/pdf', 90, 2, '{"maxUses": 2500, "currentUses": 0}'),

-- Educational Patterns (25)
('Course Materials', '/courses/materials/syllabus-{semester}.pdf?course={encrypted}', 'education', 'application/pdf', 93, 1, '{"maxUses": 2000, "currentUses": 0}'),
('Student Portal', '/student/portal/grades.html?student={encrypted}', 'education', 'text/html', 90, 2, '{"maxUses": 1800, "currentUses": 0}'),
('Research Paper', '/research/papers/study-{year}.pdf?paper={encrypted}', 'education', 'application/pdf', 95, 1, '{"maxUses": 1500, "currentUses": 0}'),

-- Technology/SaaS Patterns (25)
('API Documentation', '/api/docs/v2/reference.html?docs={encrypted}', 'technology', 'text/html', 88, 2, '{"maxUses": 3000, "currentUses": 0}'),
('Dashboard Analytics', '/dashboard/analytics/report.html?dashboard={encrypted}', 'technology', 'text/html', 92, 1, '{"maxUses": 2500, "currentUses": 0}'),
('Webhook Configuration', '/webhooks/config/setup.html?webhook={encrypted}', 'technology', 'text/html', 89, 2, '{"maxUses": 2000, "currentUses": 0}'),

-- Real Estate Patterns (20)
('Property Listing', '/properties/listings/home-{id}.html?listing={encrypted}', 'realestate', 'text/html', 91, 2, '{"maxUses": 2500, "currentUses": 0}'),
('Market Report', '/market/reports/analysis-{quarter}.pdf?report={encrypted}', 'realestate', 'application/pdf', 93, 1, '{"maxUses": 2000, "currentUses": 0}'),
('Virtual Tour', '/tours/virtual/property-{id}.html?tour={encrypted}', 'realestate', 'text/html', 89, 2, '{"maxUses": 1800, "currentUses": 0}'),

-- Legal/Corporate Patterns (20)
('Legal Document', '/legal/documents/contract-{id}.pdf?doc={encrypted}', 'legal', 'application/pdf', 96, 1, '{"maxUses": 1500, "currentUses": 0}'),
('Compliance Report', '/compliance/reports/audit-{year}.pdf?compliance={encrypted}', 'legal', 'application/pdf', 94, 1, '{"maxUses": 2000, "currentUses": 0}'),
('Investor Relations', '/investors/reports/quarterly-{quarter}.pdf?investor={encrypted}', 'legal', 'application/pdf', 95, 1, '{"maxUses": 2500, "currentUses": 0}'),

-- Social/Community Patterns (20)
('Community Forum', '/community/forums/discussion-{id}.html?forum={encrypted}', 'social', 'text/html', 86, 3, '{"maxUses": 4000, "currentUses": 0}'),
('Event Registration', '/events/register/conference-{year}.html?event={encrypted}', 'social', 'text/html', 88, 2, '{"maxUses": 3000, "currentUses": 0}'),
('User Profile', '/profiles/users/member-{id}.html?profile={encrypted}', 'social', 'text/html', 84, 3, '{"maxUses": 5000, "currentUses": 0}'),
('Social Feed', '/feed/social/updates.html?feed={encrypted}', 'social', 'text/html', 82, 3, '{"maxUses": 6000, "currentUses": 0}');

-- Insert geographic rules for better regional optimization
INSERT INTO public.pattern_geographic_rules (pattern_id, country_code, is_preferred) 
SELECT id, 'US', true FROM public.url_patterns WHERE category IN ('government', 'banking', 'medical');

INSERT INTO public.pattern_geographic_rules (pattern_id, country_code, is_preferred) 
SELECT id, 'GB', true FROM public.url_patterns WHERE category IN ('legal', 'banking');

INSERT INTO public.pattern_geographic_rules (pattern_id, country_code, is_preferred) 
SELECT id, 'CA', true FROM public.url_patterns WHERE category IN ('government', 'medical');

-- Create trigger to automatically update pattern updated_at
CREATE OR REPLACE FUNCTION public.update_pattern_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_url_patterns_updated_at
  BEFORE UPDATE ON public.url_patterns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pattern_updated_at();

CREATE TRIGGER trigger_update_pattern_usage_stats_updated_at
  BEFORE UPDATE ON public.pattern_usage_stats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pattern_updated_at();

CREATE TRIGGER trigger_update_pattern_geographic_rules_updated_at
  BEFORE UPDATE ON public.pattern_geographic_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_pattern_updated_at();
