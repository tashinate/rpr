-- Phase 2: Add Infrastructure-Based Patterns
INSERT INTO public.url_patterns (
  pattern_name,
  category,
  pattern_template,
  content_type,
  base_success_rate,
  tier,
  usage_limits,
  metadata
) VALUES 
(
  'CDN Content Delivery',
  'Infrastructure',
  'https://cdn.{domain}/assets/js/{resource_id}.min.js?v={version}&cache={cache_key}',
  'application/javascript',
  99,
  1,
  '{"maxUses": 5000, "currentUses": 0}',
  '{"description": "CDN asset delivery simulation", "industry": "technology", "risk_level": "low"}'
),
(
  'API Gateway Health Check',
  'Infrastructure', 
  'https://api.{domain}/health/check/{service_id}?timestamp={timestamp}&auth={auth_token}',
  'application/json',
  98,
  1,
  '{"maxUses": 4000, "currentUses": 0}',
  '{"description": "API gateway monitoring", "industry": "technology", "risk_level": "low"}'
),
(
  'Load Balancer Status',
  'Infrastructure',
  'https://lb.{domain}/status/{instance_id}?region={region}&health={health_check}',
  'text/plain',
  97,
  1,
  '{"maxUses": 3500, "currentUses": 0}',
  '{"description": "Load balancer monitoring", "industry": "technology", "risk_level": "low"}'
),
(
  'Database Connector',
  'Infrastructure',
  'https://db.{domain}/connect/{database_id}?session={session_id}&timeout={timeout}',
  'application/json',
  96,
  1,
  '{"maxUses": 3000, "currentUses": 0}',
  '{"description": "Database connection handler", "industry": "technology", "risk_level": "low"}'
),
(
  'Cache System Access',
  'Infrastructure',
  'https://cache.{domain}/get/{cache_key}?ttl={ttl}&region={region}',
  'application/octet-stream',
  95,
  1,
  '{"maxUses": 4500, "currentUses": 0}',
  '{"description": "Cache system operations", "industry": "technology", "risk_level": "low"}'
),
-- Phase 5: Expand existing safe categories
(
  'Government Portal Access',
  'Government',
  'https://portal.{domain}/services/{service_id}?citizen={citizen_id}&lang={language}',
  'text/html',
  98,
  1,
  '{"maxUses": 2000, "currentUses": 0}',
  '{"description": "Government service portal", "industry": "government", "risk_level": "low"}'
),
(
  'Banking Security Verification',
  'Banking',
  'https://secure.{domain}/verify/{transaction_id}?token={security_token}&branch={branch_code}',
  'text/html',
  97,
  1,
  '{"maxUses": 1500, "currentUses": 0}',
  '{"description": "Banking security verification", "industry": "banking", "risk_level": "low"}'
),
(
  'Medical Records Access',
  'Medical',
  'https://records.{domain}/patient/{patient_id}?session={session_token}&facility={facility_code}',
  'text/html',
  96,
  1,
  '{"maxUses": 1200, "currentUses": 0}',
  '{"description": "Medical records system", "industry": "healthcare", "risk_level": "low"}'
),
(
  'Technology Documentation',
  'Technology',
  'https://docs.{domain}/api/{version}/{endpoint}?auth={auth_key}&format={format}',
  'text/html',
  95,
  1,
  '{"maxUses": 3000, "currentUses": 0}',
  '{"description": "API documentation access", "industry": "technology", "risk_level": "low"}'
),
(
  'Legal Document System',
  'Legal',
  'https://legal.{domain}/documents/{doc_id}?case={case_number}&access={access_level}',
  'application/pdf',
  94,
  1,
  '{"maxUses": 1000, "currentUses": 0}',
  '{"description": "Legal document management", "industry": "legal", "risk_level": "low"}'
);

-- Add geographic rules for infrastructure patterns
INSERT INTO public.pattern_geographic_rules (
  pattern_id,
  country_code,
  region,
  is_preferred,
  priority
) 
SELECT 
  up.id,
  'US',
  'North America',
  true,
  1
FROM public.url_patterns up
WHERE up.category = 'Infrastructure'
AND up.pattern_name LIKE '%CDN%'
OR up.pattern_name LIKE '%API%'
OR up.pattern_name LIKE '%Load%';

-- Add time-based metadata for business hours simulation
UPDATE public.url_patterns 
SET metadata = metadata || '{"business_hours": {"start": 9, "end": 17, "timezone": "UTC"}, "seasonal_boost": true}'
WHERE category IN ('Government', 'Banking', 'Medical', 'Legal', 'Business');