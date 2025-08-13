-- Comprehensive Database Pattern Updates and Optimization

-- Update existing patterns to include more diverse placeholders
UPDATE url_patterns 
SET pattern_template = '/documents/{facility}/report-{year}-{phase}.pdf?target={encrypted}&session_id={session}&ref={ref}'
WHERE pattern_name = 'Product Catalog PDF' AND category = 'ecommerce';

UPDATE url_patterns 
SET pattern_template = '/orders/{type}/receipt-{order}.pdf?tracking={encrypted}&facility={facility}&status={status}'
WHERE pattern_name = 'Order Confirmation' AND category = 'ecommerce';

UPDATE url_patterns 
SET pattern_template = '/permits/{agency}/application-{form_id}.pdf?permit={encrypted}&phase={phase}&zone={zone}'
WHERE pattern_name = 'Permit Application' AND category = 'government';

UPDATE url_patterns 
SET pattern_template = '/appointments/{facility}/reminder-{appt}.html?patient={encrypted}&specialty={specialty}&type={type}'
WHERE pattern_name = 'Appointment Reminder' AND category = 'medical';

UPDATE url_patterns 
SET pattern_template = '/loans/{bank}/application-{deal}.html?account={encrypted}&manager={manager}&status={status}'
WHERE pattern_name = 'Loan Application' AND category = 'banking';

-- Insert comprehensive new patterns with diverse placeholders
INSERT INTO url_patterns (
  pattern_name,
  category,
  pattern_template,
  base_success_rate,
  tier,
  content_type,
  usage_limits,
  metadata
) VALUES 
-- Business Category Patterns
('Business Dashboard', 'business', '/portal/{division}/dashboard-{year}.html?user={encrypted}&access_level={access_level}&token={token}', 88, 1, 'text/html', '{"maxUses": 1200, "currentUses": 0}', '{"placeholders": ["division", "year", "encrypted", "access_level", "token"]}'),

('Executive Report', 'business', '/reports/{dept}/executive-{quarter}.pdf?report={encrypted}&manager={manager}&clearance={clearance}', 91, 2, 'application/pdf', '{"maxUses": 800, "currentUses": 0}', '{"placeholders": ["dept", "quarter", "encrypted", "manager", "clearance"]}'),

('Compliance Document', 'business', '/compliance/{region}/audit-{fiscal}.pdf?doc={encrypted}&zone={zone}&response={response}', 85, 1, 'application/pdf', '{"maxUses": 1000, "currentUses": 0}', '{"placeholders": ["region", "fiscal", "encrypted", "zone", "response"]}'),

-- Healthcare Category Patterns  
('Patient Portal Access', 'medical', '/portal/{facility}/patient-{badge}.html?patient={encrypted}&specialty={specialty}&appt={appt}', 92, 1, 'text/html', '{"maxUses": 1500, "currentUses": 0}', '{"placeholders": ["facility", "badge", "encrypted", "specialty", "appt"]}'),

('Medical Record Request', 'medical', '/records/{zone}/request-{case_id}.pdf?patient={encrypted}&facility={facility}&access_level={access_level}', 89, 2, 'application/pdf', '{"maxUses": 900, "currentUses": 0}', '{"placeholders": ["zone", "case_id", "encrypted", "facility", "access_level"]}'),

-- Government Category Patterns
('Security Clearance', 'government', '/security/{agency}/clearance-{badge}.pdf?target={encrypted}&level={access_level}&response={response}', 87, 3, 'application/pdf', '{"maxUses": 600, "currentUses": 0}', '{"placeholders": ["agency", "badge", "encrypted", "access_level", "response"]}'),

('Tax Document Access', 'government', '/tax/{fiscal}/document-{form_id}.pdf?user={encrypted}&zone={zone}&type={type}', 93, 1, 'application/pdf', '{"maxUses": 2000, "currentUses": 0}', '{"placeholders": ["fiscal", "form_id", "encrypted", "zone", "type"]}'),

('Federal Notice', 'government', '/notices/{agency}/alert-{incident}.html?target={encrypted}&phase={phase}&response={response}', 86, 2, 'text/html', '{"maxUses": 1100, "currentUses": 0}', '{"placeholders": ["agency", "incident", "encrypted", "phase", "response"]}'),

-- Financial Category Patterns
('Investment Portal', 'banking', '/investments/{bank}/portfolio-{client}.html?account={encrypted}&manager={relationship}&type={type}', 90, 2, 'text/html', '{"maxUses": 800, "currentUses": 0}', '{"placeholders": ["bank", "client", "encrypted", "relationship", "type"]}'),

('Banking Security', 'banking', '/secure/{zone}/verification-{token}.html?account={encrypted}&access_level={access_level}&facility={facility}', 94, 3, 'text/html', '{"maxUses": 500, "currentUses": 0}', '{"placeholders": ["zone", "token", "encrypted", "access_level", "facility"]}'),

-- Education Category Patterns
('Student Records', 'education', '/students/{division}/transcript-{student}.pdf?course={encrypted}&semester={semester}&grade={grade}', 88, 1, 'application/pdf', '{"maxUses": 1300, "currentUses": 0}', '{"placeholders": ["division", "student", "encrypted", "semester", "grade"]}'),

('Course Materials', 'education', '/courses/{dept}/materials-{course}.html?student={encrypted}&access_level={access_level}&semester={semester}', 91, 1, 'text/html', '{"maxUses": 1400, "currentUses": 0}', '{"placeholders": ["dept", "course", "encrypted", "access_level", "semester"]}'),

-- Technology Category Patterns
('API Documentation', 'technology', '/api/{version}/docs-{app_id}.html?token={encrypted}&access_level={access_level}&service={service}', 89, 2, 'text/html', '{"maxUses": 1000, "currentUses": 0}', '{"placeholders": ["version", "app_id", "encrypted", "access_level", "service"]}'),

('System Dashboard', 'technology', '/system/{zone}/monitor-{session_id}.html?target={encrypted}&facility={facility}&status={status}', 87, 1, 'text/html', '{"maxUses": 1200, "currentUses": 0}', '{"placeholders": ["zone", "session_id", "encrypted", "facility", "status"]}'),

-- Legal Category Patterns
('Legal Document', 'legal', '/legal/{region}/contract-{case_id}.pdf?client={encrypted}&type={type}&phase={phase}', 86, 2, 'application/pdf', '{"maxUses": 700, "currentUses": 0}', '{"placeholders": ["region", "case_id", "encrypted", "type", "phase"]}'),

('Court Filing', 'legal', '/court/{zone}/filing-{incident}.pdf?case={encrypted}&status={status}&response={response}', 84, 3, 'application/pdf', '{"maxUses": 600, "currentUses": 0}', '{"placeholders": ["zone", "incident", "encrypted", "status", "response"]}'),

-- Real Estate Category Patterns
('Property Listing', 'realestate', '/properties/{region}/listing-{deal}.html?property={encrypted}&agent={manager}&type={type}', 90, 1, 'text/html', '{"maxUses": 1100, "currentUses": 0}', '{"placeholders": ["region", "deal", "encrypted", "manager", "type"]}'),

('Mortgage Application', 'realestate', '/mortgage/{bank}/application-{client}.pdf?loan={encrypted}&facility={facility}&status={status}', 88, 2, 'application/pdf', '{"maxUses": 800, "currentUses": 0}', '{"placeholders": ["bank", "client", "encrypted", "facility", "status"]}'),

-- Social Media Category Patterns  
('User Profile', 'social', '/users/{zone}/profile-{user}.html?account={encrypted}&access_level={access_level}&status={status}', 92, 1, 'text/html', '{"maxUses": 1600, "currentUses": 0}', '{"placeholders": ["zone", "user", "encrypted", "access_level", "status"]}'),

('Privacy Settings', 'social', '/privacy/{facility}/settings-{session_id}.html?user={encrypted}&token={token}&type={type}', 89, 2, 'text/html', '{"maxUses": 1200, "currentUses": 0}', '{"placeholders": ["facility", "session_id", "encrypted", "token", "type"]}');

-- Update global system config to mark placeholder system as updated
INSERT INTO global_system_config (config_key, config_value)
VALUES ('placeholder_system_version', '{"version": "2.0", "updated_at": "' || now() || '", "comprehensive_coverage": true}')
ON CONFLICT (config_key) 
DO UPDATE SET 
  config_value = '{"version": "2.0", "updated_at": "' || now() || '", "comprehensive_coverage": true}',
  updated_at = now();