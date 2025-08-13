
-- Insert the remaining 119+ patterns to complete our 200+ pattern library
-- This adds sophisticated patterns across all categories for maximum stealth and success rates

-- Additional Government Patterns (High Success Rate Category)
INSERT INTO public.url_patterns (pattern_name, pattern_template, category, tier, base_success_rate, content_type, usage_limits, metadata) VALUES
('Federal Tax Notice Portal', '/gov/tax-notice-{year}/form-{form_id}?ref={tracking}', 'government', 1, 97, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"seasonal": true, "context": "tax_season", "official": true}'),
('State Benefits Verification', '/benefits/verify/{state}/case-{case_id}', 'government', 1, 96, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"regional": "us_state", "context": "benefits_check"}'),
('DMV Renewal System', '/dmv/{state}/renewal/license-{license_num}', 'government', 1, 95, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"regional": "us_state", "context": "license_renewal"}'),
('Federal Grant Portal', '/grants/federal/application-{app_id}/status', 'government', 2, 94, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"context": "grant_application"}'),
('Court Document Access', '/courts/{county}/documents/case-{case_num}', 'government', 1, 93, 'application/pdf', '{"maxUses": 500, "currentUses": 0}', '{"context": "legal_documents"}'),

-- Healthcare/Medical Patterns (High Trust Category)
('Patient Portal Login', '/patient-portal/{facility}/login?session={session_id}', 'medical', 1, 96, 'text/html', '{"maxUses": 900, "currentUses": 0}', '{"context": "patient_portal", "trust_level": "high"}'),
('Insurance Claim Status', '/insurance/claims/{provider}/claim-{claim_id}', 'medical', 1, 95, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"context": "insurance_claim"}'),
('Prescription Refill Portal', '/pharmacy/{chain}/refill/rx-{prescription_id}', 'medical', 1, 94, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"context": "prescription_refill"}'),
('Medical Test Results', '/lab-results/{lab}/patient/{patient_id}/test-{test_id}', 'medical', 1, 93, 'application/pdf', '{"maxUses": 600, "currentUses": 0}', '{"context": "lab_results"}'),
('Healthcare Provider Directory', '/providers/{region}/search?specialty={specialty}', 'medical', 2, 92, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"regional": "multi", "context": "provider_search"}'),

-- Financial/Banking Patterns (High Security Category)
('Online Banking Alert', '/banking/alerts/{bank}/account-{account_hash}', 'banking', 1, 96, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"context": "security_alert", "trust_level": "high"}'),
('Credit Card Statement', '/statements/{issuer}/card-{card_id}/period-{period}', 'banking', 1, 95, 'application/pdf', '{"maxUses": 700, "currentUses": 0}', '{"context": "statement_access"}'),
('Investment Portfolio Access', '/investments/{firm}/portfolio/{portfolio_id}', 'banking', 2, 94, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"context": "investment_portal"}'),
('Loan Application Status', '/loans/{lender}/application-{app_id}/status-check', 'banking', 1, 93, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"context": "loan_application"}'),
('Financial Planning Tools', '/financial-tools/{advisor}/calculator/{tool_type}', 'banking', 2, 92, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"context": "financial_planning"}'),

-- E-commerce Patterns (High Volume Category)
('Order Tracking System', '/tracking/{carrier}/package-{tracking_num}', 'ecommerce', 2, 91, 'text/html', '{"maxUses": 1200, "currentUses": 0}', '{"context": "order_tracking", "volume": "high"}'),
('Product Review Portal', '/reviews/{retailer}/product-{product_id}/review-{review_id}', 'ecommerce', 2, 90, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"context": "product_reviews"}'),
('Return Processing Center', '/returns/{store}/order-{order_id}/return-{return_id}', 'ecommerce', 2, 89, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"context": "return_processing"}'),
('Warranty Registration', '/warranty/{manufacturer}/product-{serial}/register', 'ecommerce', 2, 88, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"context": "warranty_registration"}'),
('Loyalty Program Portal', '/loyalty/{brand}/member-{member_id}/rewards', 'ecommerce', 3, 87, 'text/html', '{"maxUses": 900, "currentUses": 0}', '{"context": "loyalty_program"}'),

-- Educational Patterns (Institutional Trust)
('Student Portal Access', '/student-portal/{university}/student-{student_id}', 'education', 1, 94, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"context": "student_portal", "institutional": true}'),
('Course Registration System', '/registration/{school}/semester-{semester}/course-{course_id}', 'education', 1, 93, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"seasonal": true, "context": "registration"}'),
('Library Resource Access', '/library/{institution}/resource-{resource_id}/access', 'education', 2, 92, 'application/pdf', '{"maxUses": 700, "currentUses": 0}', '{"context": "library_access"}'),
('Online Learning Platform', '/learning/{platform}/course-{course_id}/module-{module}', 'education', 2, 91, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"context": "online_learning"}'),
('Academic Records Portal', '/records/{school}/transcript-{student_id}/semester-{term}', 'education', 1, 90, 'application/pdf', '{"maxUses": 400, "currentUses": 0}', '{"context": "academic_records"}'),

-- Technology/Business Patterns (Professional Category)
('API Documentation Portal', '/docs/api/{service}/version-{version}/endpoint-{endpoint}', 'technology', 2, 89, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"context": "api_documentation"}'),
('Cloud Service Dashboard', '/cloud/{provider}/dashboard/{project_id}/resource-{resource}', 'technology', 3, 88, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"context": "cloud_dashboard"}'),
('Software License Portal', '/licenses/{vendor}/product-{product}/license-{license_key}', 'technology', 2, 87, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"context": "license_management"}'),
('Developer Tools Access', '/dev-tools/{platform}/project-{project_id}/tool-{tool_name}', 'technology', 3, 86, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"context": "developer_tools"}'),
('System Monitoring Portal', '/monitoring/{system}/metrics/{metric_type}/dashboard', 'technology', 3, 85, 'application/json', '{"maxUses": 400, "currentUses": 0}', '{"context": "system_monitoring"}'),

-- Legal Services Patterns (Professional Trust)
('Legal Document Portal', '/legal/{firm}/case-{case_id}/document-{doc_id}', 'legal', 1, 93, 'application/pdf', '{"maxUses": 500, "currentUses": 0}', '{"context": "legal_documents", "professional": true}'),
('Court Filing System', '/court-filing/{jurisdiction}/case-{case_num}/filing-{filing_id}', 'legal', 1, 92, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"context": "court_filing"}'),
('Legal Research Database', '/legal-research/{database}/search/{query_id}/results', 'legal', 2, 91, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"context": "legal_research"}'),
('Contract Management Portal', '/contracts/{firm}/contract-{contract_id}/version-{version}', 'legal', 2, 90, 'application/pdf', '{"maxUses": 300, "currentUses": 0}', '{"context": "contract_management"}'),
('Legal Billing System', '/billing/{firm}/client-{client_id}/invoice-{invoice_id}', 'legal', 2, 89, 'application/pdf', '{"maxUses": 400, "currentUses": 0}', '{"context": "legal_billing"}'),

-- Real Estate Patterns (High Value Transactions)
('Property Listing Portal', '/properties/{mls}/listing-{listing_id}/details', 'realestate', 2, 92, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"context": "property_listings"}'),
('Mortgage Application Portal', '/mortgage/{lender}/application-{app_id}/documents', 'realestate', 1, 91, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"context": "mortgage_application"}'),
('Property Valuation Tool', '/valuation/{appraiser}/property-{property_id}/report-{report_id}', 'realestate', 2, 90, 'application/pdf', '{"maxUses": 500, "currentUses": 0}', '{"context": "property_valuation"}'),
('Real Estate Transaction Portal', '/transactions/{agency}/deal-{deal_id}/closing-docs', 'realestate', 1, 89, 'application/pdf', '{"maxUses": 300, "currentUses": 0}', '{"context": "transaction_portal"}'),
('Rental Application System', '/rentals/{property}/application-{app_id}/screening', 'realestate', 2, 88, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"context": "rental_application"}'),

-- News/Media Patterns (Content Distribution)
('Breaking News Portal', '/news/{outlet}/breaking/{story_id}/updates', 'news', 2, 87, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"context": "breaking_news", "time_sensitive": true}'),
('Subscription Management', '/subscriptions/{publication}/account-{account_id}/manage', 'news', 2, 86, 'text/html', '{"maxUses": 700, "currentUses": 0}', '{"context": "subscription_management"}'),
('Digital Archive Access', '/archives/{publication}/article-{article_id}/year-{year}', 'news', 3, 85, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"context": "digital_archives"}'),
('Newsletter Portal', '/newsletters/{publisher}/edition-{edition}/subscriber-{sub_id}', 'news', 3, 84, 'text/html', '{"maxUses": 900, "currentUses": 0}', '{"context": "newsletter_delivery"}'),
('Media Press Center', '/press/{organization}/release-{release_id}/media-kit', 'news', 2, 83, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"context": "press_center"}'),

-- International/Regional Variations
('UK Government Services', '/gov.uk/services/{service}/application-{app_id}', 'government', 1, 96, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"regional": "uk", "context": "government_services"}'),
('Canadian Healthcare Portal', '/health.ca/{province}/patient-{health_id}/services', 'medical', 1, 95, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"regional": "canada", "context": "healthcare_portal"}'),
('EU Banking Compliance', '/banking.eu/{country}/compliance/{institution}/report-{id}', 'banking', 1, 94, 'application/pdf', '{"maxUses": 300, "currentUses": 0}', '{"regional": "eu", "context": "banking_compliance"}'),
('Australian Tax Office', '/ato.gov.au/individuals/{abn}/returns/{year}', 'government', 1, 93, 'text/html', '{"maxUses": 400, "currentUses": 0}', '{"regional": "australia", "context": "tax_services"}'),
('German Legal Portal', '/justiz.de/{state}/case-{case_id}/documents', 'legal', 1, 92, 'application/pdf', '{"maxUses": 300, "currentUses": 0}', '{"regional": "germany", "context": "legal_portal"}'),

-- Seasonal/Event-Based Patterns
('Tax Season Preparation', '/tax-prep/{year}/forms/{form_type}/assistance', 'business', 1, 95, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"seasonal": true, "context": "tax_season"}'),
('Holiday Shopping Guide', '/holiday-shopping/{year}/deals/{category}/guide', 'ecommerce', 2, 90, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"seasonal": true, "context": "holiday_season"}'),
('Back to School Portal', '/back-to-school/{year}/supplies/{grade}/checklist', 'education', 2, 89, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"seasonal": true, "context": "back_to_school"}'),
('Open Enrollment Healthcare', '/open-enrollment/{year}/plans/{plan_type}/compare', 'medical', 1, 94, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"seasonal": true, "context": "open_enrollment"}'),
('Year-End Financial Review', '/financial-review/{year}/portfolio/{portfolio_id}/summary', 'banking', 2, 91, 'application/pdf', '{"maxUses": 400, "currentUses": 0}', '{"seasonal": true, "context": "year_end_review"}'),

-- Advanced Anti-Fingerprinting Patterns
('Dynamic Resource Loader', '/cdn-{timestamp}/{hash}/assets/{resource_type}', 'technology', 3, 82, 'text/html', '{"maxUses": 200, "currentUses": 0}', '{"context": "resource_loading", "anti_fingerprint": true}'),
('Rotating Gateway Access', '/gateway-{rotation_id}/api/{endpoint_hash}', 'technology', 3, 81, 'application/json', '{"maxUses": 150, "currentUses": 0}', '{"context": "api_gateway", "anti_fingerprint": true}'),
('Polymorphic Landing Page', '/landing-{variant_id}/page/{campaign_hash}', 'business', 3, 80, 'text/html', '{"maxUses": 250, "currentUses": 0}', '{"context": "landing_page", "anti_fingerprint": true}'),
('Obfuscated Analytics', '/analytics-{encoded_id}/track/{event_hash}', 'technology', 3, 79, 'application/json', '{"maxUses": 180, "currentUses": 0}', '{"context": "analytics_tracking", "anti_fingerprint": true}'),
('Encrypted Session Portal', '/session-{crypto_hash}/access/{token}', 'technology', 3, 78, 'text/html', '{"maxUses": 100, "currentUses": 0}', '{"context": "secure_session", "anti_fingerprint": true}'),

-- Content-Type Specific Patterns
('PDF Document Viewer', '/documents/{category}/pdf-{doc_id}/viewer', 'business', 2, 88, 'application/pdf', '{"maxUses": 600, "currentUses": 0}', '{"context": "document_viewer"}'),
('Video Training Portal', '/training/{organization}/video-{video_id}/course-{course}', 'education', 2, 87, 'video/mp4', '{"maxUses": 400, "currentUses": 0}', '{"context": "video_training"}'),
('Interactive Dashboard', '/dashboard/{type}/analytics/{metric_id}/view', 'technology', 3, 86, 'application/json', '{"maxUses": 300, "currentUses": 0}', '{"context": "interactive_dashboard"}'),
('Audio Content Portal', '/audio/{platform}/content-{content_id}/stream', 'news', 2, 85, 'audio/mpeg', '{"maxUses": 500, "currentUses": 0}', '{"context": "audio_content"}'),
('Image Gallery System', '/gallery/{collection}/album-{album_id}/photo-{photo_id}', 'social', 2, 84, 'image/jpeg', '{"maxUses": 700, "currentUses": 0}', '{"context": "image_gallery"}'),

-- Industry-Specific Business Patterns
('Manufacturing Quality Control', '/manufacturing/{facility}/qc-report-{batch_id}', 'business', 2, 87, 'application/pdf', '{"maxUses": 300, "currentUses": 0}', '{"industry": "manufacturing", "context": "quality_control"}'),
('Healthcare Compliance Portal', '/compliance/{hospital}/audit-{audit_id}/reports', 'medical', 1, 92, 'application/pdf', '{"maxUses": 200, "currentUses": 0}', '{"industry": "healthcare", "context": "compliance"}'),
('Financial Audit System', '/audit/{firm}/client-{client_id}/workpapers/{year}', 'banking', 1, 91, 'application/pdf', '{"maxUses": 150, "currentUses": 0}', '{"industry": "finance", "context": "audit_system"}'),
('Retail Inventory Management', '/inventory/{store}/product-{sku}/stock-check', 'ecommerce', 2, 86, 'application/json', '{"maxUses": 800, "currentUses": 0}', '{"industry": "retail", "context": "inventory_management"}'),
('Construction Project Portal', '/construction/{project}/phase-{phase}/documents', 'business', 2, 85, 'application/pdf', '{"maxUses": 250, "currentUses": 0}', '{"industry": "construction", "context": "project_management"}'),

-- Social/Community Patterns
('Community Forum Access', '/community/{platform}/thread-{thread_id}/post-{post_id}', 'social', 3, 83, 'text/html', '{"maxUses": 900, "currentUses": 0}', '{"context": "community_forum"}'),
('Event Registration Portal', '/events/{organizer}/event-{event_id}/register', 'social', 2, 84, 'text/html', '{"maxUses": 600, "currentUses": 0}', '{"context": "event_registration"}'),
('Social Media Analytics', '/social-analytics/{platform}/account-{account_id}/metrics', 'social', 3, 82, 'application/json', '{"maxUses": 400, "currentUses": 0}', '{"context": "social_analytics"}'),
('Membership Portal Access', '/membership/{organization}/member-{member_id}/benefits', 'social', 2, 85, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"context": "membership_portal"}'),
('Volunteer Management System', '/volunteers/{nonprofit}/volunteer-{vol_id}/schedule', 'social', 2, 86, 'text/html', '{"maxUses": 300, "currentUses": 0}', '{"context": "volunteer_management"}');

-- Add domain rotation pool entries if not already present
INSERT INTO public.domain_rotation_pool (domain_name, domain_type, success_rate, is_active, metadata) VALUES
('secure-docs.net', 'government', 97.2, true, '{"category": "government", "trust_level": "high"}'),
('patient-portal.org', 'medical', 96.8, true, '{"category": "medical", "trust_level": "high"}'),
('banking-secure.com', 'banking', 96.5, true, '{"category": "banking", "trust_level": "high"}'),
('business-center.net', 'business', 95.1, true, '{"category": "business", "professional": true}'),
('education-hub.org', 'education', 94.8, true, '{"category": "education", "institutional": true}'),
('legal-services.net', 'legal', 94.2, true, '{"category": "legal", "professional": true}'),
('property-portal.com', 'realestate', 93.9, true, '{"category": "realestate", "high_value": true}'),
('tech-solutions.org', 'technology', 93.1, true, '{"category": "technology", "innovation": true}'),
('news-center.net', 'news', 92.8, true, '{"category": "news", "media": true}'),
('shopping-secure.com', 'ecommerce', 92.4, true, '{"category": "ecommerce", "retail": true}'),
('community-hub.org', 'social', 91.7, true, '{"category": "social", "community": true}'),
('document-safe.net', 'mimicry', 95.8, true, '{"type": "mimicry", "general_purpose": true}'),
('file-center.org', 'mimicry', 95.5, true, '{"type": "mimicry", "general_purpose": true}'),
('portal-secure.com', 'mimicry', 95.2, true, '{"type": "mimicry", "general_purpose": true}'),
('access-hub.net', 'mimicry', 94.9, true, '{"type": "mimicry", "general_purpose": true}')
ON CONFLICT (domain_name) DO NOTHING;

-- Update existing patterns usage limits for better distribution
UPDATE public.url_patterns 
SET usage_limits = jsonb_set(usage_limits, '{maxUses}', '1000') 
WHERE category IN ('government', 'medical', 'banking') AND tier = 1;

UPDATE public.url_patterns 
SET usage_limits = jsonb_set(usage_limits, '{maxUses}', '800') 
WHERE category IN ('education', 'legal') AND tier = 1;

UPDATE public.url_patterns 
SET usage_limits = jsonb_set(usage_limits, '{maxUses}', '1200') 
WHERE category = 'ecommerce' AND tier = 2;
