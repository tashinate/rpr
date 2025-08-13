
-- Add final 44 patterns to complete 200+ pattern library
-- Strategic distribution: Business (15), Government (8), Technology (8), Banking (5), Medical (4), Ecommerce (4)

-- Business Category Expansion (15 patterns)
INSERT INTO public.url_patterns (pattern_name, pattern_template, category, tier, base_success_rate, content_type, usage_limits, metadata) VALUES
('Corporate Annual Report', '/corporate/annual-report-{year}.pdf?company={id}&quarter={quarter}', 'business', 1, 94, 'application/pdf', '{"maxUses": 800, "currentUses": 0}', '{"industry": "corporate", "seasonal": true, "context": "annual_reporting"}'),
('HR Employee Portal', '/hr/employee-portal/{dept}?emp={id}&access={token}', 'business', 2, 91, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "hr", "context": "employee_management"}'),
('Consulting Services Agreement', '/consulting/services-agreement-{version}.pdf?client={id}&contract={hash}', 'business', 1, 93, 'application/pdf', '{"maxUses": 500, "currentUses": 0}', '{"industry": "consulting", "context": "contract_management"}'),
('Financial Audit Results', '/audit/financial-results-{year}/{quarter}?audit={id}&firm={code}', 'business', 1, 95, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "audit", "seasonal": true, "context": "financial_audit"}'),
('Business Compliance Report', '/compliance/business-report/{type}?reg={id}&status={code}', 'business', 2, 89, 'application/pdf', '{"maxUses": 700, "currentUses": 0}', '{"industry": "compliance", "context": "regulatory_compliance"}'),
('Corporate Training Module', '/training/corporate-module/{course}?emp={id}&progress={percent}', 'business', 2, 88, 'video/mp4', '{"maxUses": 900, "currentUses": 0}', '{"industry": "training", "context": "employee_development"}'),
('Vendor Management System', '/vendor/management-system/{category}?vendor={id}&contract={status}', 'business', 3, 85, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "procurement", "context": "vendor_management"}'),
('Executive Dashboard', '/executive/dashboard/{metric}?exec={id}&period={timeframe}', 'business', 1, 92, 'application/json', '{"maxUses": 300, "currentUses": 0}', '{"industry": "executive", "context": "business_intelligence"}'),
('Project Management Hub', '/project/management-hub/{project}?pm={id}&phase={stage}', 'business', 2, 87, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"industry": "project_management", "context": "project_tracking"}'),
('Supply Chain Analytics', '/supply-chain/analytics/{region}?supplier={id}&metric={kpi}', 'business', 3, 84, 'application/json', '{"maxUses": 500, "currentUses": 0}', '{"industry": "supply_chain", "context": "logistics_analytics"}'),
('Quality Assurance Report', '/qa/quality-report-{batch}?product={id}&inspector={code}', 'business', 2, 90, 'application/pdf', '{"maxUses": 600, "currentUses": 0}', '{"industry": "manufacturing", "context": "quality_control"}'),
('Strategic Planning Document', '/strategy/planning-document-{year}?dept={id}&version={num}', 'business', 1, 93, 'application/pdf', '{"maxUses": 400, "currentUses": 0}', '{"industry": "strategy", "seasonal": true, "context": "strategic_planning"}'),
('Risk Assessment Matrix', '/risk/assessment-matrix/{category}?risk={id}&mitigation={plan}', 'business', 2, 91, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "risk_management", "context": "risk_assessment"}'),
('Merger Acquisition Report', '/ma/acquisition-report/{target}?deal={id}&status={phase}', 'business', 1, 96, 'application/pdf', '{"maxUses": 200, "currentUses": 0}', '{"industry": "ma", "context": "corporate_development"}'),
('Sustainability Report', '/sustainability/report-{year}/{quarter}?esg={score}&initiative={id}', 'business', 2, 89, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "sustainability", "seasonal": true, "context": "esg_reporting"}'),

-- Specialized Government Patterns (8 patterns)
('Federal Agency Portal', '/federal/agency-portal/{dept}?clearance={level}&access={token}', 'government', 1, 98, 'text/html', '{"maxUses": 300, "currentUses": 0}', '{"regional": "federal", "context": "agency_access"}'),
('Immigration Services', '/immigration/services/{type}?case={id}&status={code}', 'government', 1, 97, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"regional": "federal", "context": "immigration_services"}'),
('Customs Declaration', '/customs/declaration/{port}?shipment={id}&inspector={badge}', 'government', 1, 96, 'application/pdf', '{"maxUses": 600, "currentUses": 0}', '{"regional": "international", "context": "customs_processing"}'),
('Regulatory Compliance Check', '/regulatory/compliance-check/{industry}?reg={id}&audit={date}', 'government', 2, 95, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"context": "regulatory_oversight"}'),
('Border Security Alert', '/border/security-alert/{zone}?alert={level}&incident={id}', 'government', 1, 97, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"regional": "border", "context": "security_alerts"}'),
('International Trade Portal', '/trade/international-portal/{country}?agreement={id}&tariff={code}', 'government', 2, 94, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"regional": "international", "context": "trade_agreements"}'),
('Emergency Management System', '/emergency/management-system/{type}?incident={id}&response={level}', 'government', 1, 96, 'text/html', '{"maxUses": 300, "currentUses": 0}', '{"context": "emergency_response"}'),
('Public Records Request', '/records/public-request/{dept}?request={id}&foia={status}', 'government', 2, 93, 'application/pdf', '{"maxUses": 900, "currentUses": 0}', '{"context": "public_records"}'),

-- Advanced Technology Patterns (8 patterns)
('AI Model Dashboard', '/ai/model-dashboard/{model}?version={num}&performance={metric}', 'technology', 2, 87, 'application/json', '{"maxUses": 400, "currentUses": 0}', '{"industry": "ai_ml", "context": "model_management"}'),
('Blockchain Transaction', '/blockchain/transaction/{network}?tx={hash}&block={number}', 'technology', 3, 82, 'application/json', '{"maxUses": 600, "currentUses": 0}', '{"industry": "blockchain", "context": "transaction_processing"}'),
('Cybersecurity Threat Intel', '/security/threat-intel/{category}?threat={id}&severity={level}', 'technology', 1, 91, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "cybersecurity", "context": "threat_intelligence"}'),
('DevOps Pipeline Status', '/devops/pipeline-status/{project}?build={id}&stage={phase}', 'technology', 2, 85, 'application/json', '{"maxUses": 800, "currentUses": 0}', '{"industry": "devops", "context": "ci_cd_pipeline"}'),
('Cloud Infrastructure Monitor', '/cloud/infrastructure-monitor/{service}?instance={id}&health={status}', 'technology', 2, 88, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"industry": "cloud", "context": "infrastructure_monitoring"}'),
('SaaS Application Analytics', '/saas/app-analytics/{tenant}?user={id}&usage={metric}', 'technology', 3, 84, 'application/json', '{"maxUses": 900, "currentUses": 0}', '{"industry": "saas", "context": "application_analytics"}'),
('API Gateway Management', '/api/gateway-management/{endpoint}?key={token}&rate={limit}', 'technology', 2, 86, 'application/json', '{"maxUses": 600, "currentUses": 0}', '{"industry": "api", "context": "gateway_management"}'),
('Quantum Computing Lab', '/quantum/computing-lab/{experiment}?qubit={count}&fidelity={score}', 'technology', 3, 79, 'text/html', '{"maxUses": 200, "currentUses": 0}', '{"industry": "quantum", "context": "research_lab"}'),

-- Premium Financial Services (5 patterns)
('Wealth Management Portal', '/wealth/management-portal/{client}?portfolio={id}&advisor={code}', 'banking', 1, 95, 'text/html', '{"maxUses": 300, "currentUses": 0}', '{"industry": "wealth_management", "context": "private_banking"}'),
('Cryptocurrency Exchange', '/crypto/exchange/{pair}?order={id}&wallet={address}', 'banking', 2, 89, 'application/json', '{"maxUses": 800, "currentUses": 0}', '{"industry": "cryptocurrency", "context": "digital_assets"}'),
('Investment Advisory Report', '/investment/advisory-report/{fund}?client={id}&performance={ytd}', 'banking', 1, 94, 'application/pdf', '{"maxUses": 400, "currentUses": 0}', '{"industry": "investment", "context": "advisory_services"}'),
('Private Banking Services', '/private/banking-services/{tier}?client={id}&relationship={manager}', 'banking', 1, 96, 'text/html', '{"maxUses": 200, "currentUses": 0}', '{"industry": "private_banking", "context": "premium_services"}'),
('Risk Management Analytics', '/risk/management-analytics/{portfolio}?var={value}&stress={test}', 'banking', 2, 92, 'application/json', '{"maxUses": 500, "currentUses": 0}', '{"industry": "risk_management", "context": "portfolio_analytics"}'),

-- Specialized Healthcare (4 patterns)
('Telemedicine Platform', '/telemedicine/platform/{specialty}?patient={id}&session={token}', 'medical', 1, 96, 'video/webrtc', '{"maxUses": 600, "currentUses": 0}', '{"industry": "telemedicine", "context": "remote_consultation"}'),
('Mental Health Assessment', '/mental-health/assessment/{type}?patient={id}&therapist={license}', 'medical', 1, 94, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "mental_health", "context": "psychological_assessment"}'),
('Medical Research Portal', '/research/medical-portal/{study}?participant={id}&protocol={version}', 'medical', 2, 93, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"industry": "research", "context": "clinical_trials"}'),
('Pharmaceutical Tracking', '/pharma/tracking/{batch}?drug={ndc}&facility={id}', 'medical', 1, 95, 'application/json', '{"maxUses": 700, "currentUses": 0}', '{"industry": "pharmaceutical", "context": "drug_tracking"}'),

-- Advanced E-commerce (4 patterns)
('Subscription Management', '/subscription/management/{service}?user={id}&plan={tier}', 'ecommerce', 2, 90, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"industry": "subscription", "context": "recurring_billing"}'),
('B2B Marketplace', '/b2b/marketplace/{category}?vendor={id}&buyer={company}', 'ecommerce', 2, 88, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"industry": "b2b", "context": "business_marketplace"}'),
('Digital Asset Store', '/digital/asset-store/{type}?asset={id}&license={terms}', 'ecommerce', 3, 85, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"industry": "digital_assets", "context": "content_marketplace"}'),
('Supply Chain Integration', '/supply-chain/integration/{partner}?order={id}&logistics={provider}', 'ecommerce', 2, 87, 'application/json', '{"maxUses": 700, "currentUses": 0}', '{"industry": "supply_chain", "context": "partner_integration"}');

-- Update pattern usage statistics to reflect the new total capacity
-- This will trigger recalculation of system metrics
UPDATE public.url_patterns SET updated_at = now() WHERE id IN (
  SELECT id FROM public.url_patterns ORDER BY created_at DESC LIMIT 44
);
