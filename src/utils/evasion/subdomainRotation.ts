/**
 * Dynamic Subdomain Rotation System
 * Rotates subdomains to improve deliverability and avoid pattern detection
 */

export interface SubdomainConfig {
  subdomain: string;
  category: string;
  contentTypes: string[];
  trustScore: number;
  usageCount: number;
  lastUsed: Date;
  maxDailyUse: number;
  description: string;
}

export interface RotationOptions {
  category?: string;
  contentType?: string;
  avoidRecent?: boolean;
  preferHighTrust?: boolean;
  balanceUsage?: boolean;
}

export class SubdomainRotationService {
  
  private subdomainConfigs: SubdomainConfig[] = [
    // High-trust subdomains (business/professional)
    {
      subdomain: 'docs',
      category: 'business',
      contentTypes: ['application/pdf', 'text/html', 'application/msword'],
      trustScore: 95,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 1000,
      description: 'Document sharing and collaboration'
    },
    {
      subdomain: 'files',
      category: 'business',
      contentTypes: ['application/pdf', 'application/zip', 'application/octet-stream'],
      trustScore: 93,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 800,
      description: 'File storage and sharing'
    },
    {
      subdomain: 'portal',
      category: 'business',
      contentTypes: ['text/html', 'application/json'],
      trustScore: 92,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 1200,
      description: 'Business portal and applications'
    },
    {
      subdomain: 'resources',
      category: 'business',
      contentTypes: ['application/pdf', 'text/html'],
      trustScore: 90,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 600,
      description: 'Resource center and documentation'
    },
    
    // Technical/CDN subdomains
    {
      subdomain: 'cdn',
      category: 'technical',
      contentTypes: ['application/javascript', 'text/css', 'image/png', 'image/jpeg'],
      trustScore: 88,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 2000,
      description: 'Content delivery network'
    },
    {
      subdomain: 'static',
      category: 'technical',
      contentTypes: ['application/javascript', 'text/css', 'image/png'],
      trustScore: 87,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 1500,
      description: 'Static asset hosting'
    },
    {
      subdomain: 'assets',
      category: 'technical',
      contentTypes: ['image/png', 'image/jpeg', 'application/javascript'],
      trustScore: 85,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 1800,
      description: 'Digital assets and media'
    },
    {
      subdomain: 'api',
      category: 'technical',
      contentTypes: ['application/json', 'text/xml'],
      trustScore: 83,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 1000,
      description: 'API endpoints and services'
    },
    
    // Media/Content subdomains
    {
      subdomain: 'media',
      category: 'content',
      contentTypes: ['image/jpeg', 'image/png', 'video/mp4', 'audio/mpeg'],
      trustScore: 82,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 1200,
      description: 'Media content hosting'
    },
    {
      subdomain: 'content',
      category: 'content',
      contentTypes: ['text/html', 'application/pdf'],
      trustScore: 80,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 900,
      description: 'Content management system'
    },
    {
      subdomain: 'blog',
      category: 'content',
      contentTypes: ['text/html'],
      trustScore: 78,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 500,
      description: 'Blog and articles'
    },
    
    // Service subdomains
    {
      subdomain: 'downloads',
      category: 'service',
      contentTypes: ['application/zip', 'application/pdf', 'application/octet-stream'],
      trustScore: 85,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 700,
      description: 'Download center'
    },
    {
      subdomain: 'support',
      category: 'service',
      contentTypes: ['text/html', 'application/pdf'],
      trustScore: 88,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 400,
      description: 'Customer support portal'
    },
    {
      subdomain: 'help',
      category: 'service',
      contentTypes: ['text/html'],
      trustScore: 86,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 300,
      description: 'Help documentation'
    },
    
    // Specialized subdomains
    {
      subdomain: 'secure',
      category: 'security',
      contentTypes: ['text/html', 'application/json'],
      trustScore: 91,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 200,
      description: 'Secure access portal'
    },
    {
      subdomain: 'admin',
      category: 'security',
      contentTypes: ['text/html', 'application/json'],
      trustScore: 89,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 150,
      description: 'Administrative interface'
    },
    {
      subdomain: 'app',
      category: 'application',
      contentTypes: ['text/html', 'application/json'],
      trustScore: 84,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 800,
      description: 'Web application'
    },
    {
      subdomain: 'dashboard',
      category: 'application',
      contentTypes: ['text/html', 'application/json'],
      trustScore: 82,
      usageCount: 0,
      lastUsed: new Date(0),
      maxDailyUse: 600,
      description: 'Analytics dashboard'
    }
  ];

  /**
   * Select optimal subdomain based on criteria
   */
  selectSubdomain(options: RotationOptions = {}): SubdomainConfig {
    const {
      category,
      contentType,
      avoidRecent = true,
      preferHighTrust = true,
      balanceUsage = true
    } = options;

    let candidates = [...this.subdomainConfigs];

    // Filter by category if specified
    if (category) {
      candidates = candidates.filter(config => config.category === category);
    }

    // Filter by content type if specified
    if (contentType) {
      candidates = candidates.filter(config => 
        config.contentTypes.includes(contentType) || 
        config.contentTypes.includes('application/octet-stream') // Generic fallback
      );
    }

    // Avoid recently used subdomains
    if (avoidRecent) {
      const recentThreshold = new Date(Date.now() - 3600000); // 1 hour ago
      candidates = candidates.filter(config => config.lastUsed < recentThreshold);
    }

    // Filter out overused subdomains
    if (balanceUsage) {
      candidates = candidates.filter(config => config.usageCount < config.maxDailyUse);
    }

    // If no candidates remain, reset and use all
    if (candidates.length === 0) {
      candidates = [...this.subdomainConfigs];
    }

    // Score and sort candidates
    const scoredCandidates = candidates.map(config => {
      let score = 0;

      // Trust score weight (40%)
      if (preferHighTrust) {
        score += config.trustScore * 0.4;
      }

      // Usage balance weight (30%)
      if (balanceUsage) {
        const usageRatio = config.usageCount / config.maxDailyUse;
        score += (1 - usageRatio) * 30;
      }

      // Recency weight (20%)
      if (avoidRecent) {
        const hoursSinceLastUse = (Date.now() - config.lastUsed.getTime()) / 3600000;
        score += Math.min(hoursSinceLastUse, 24) * 0.83; // Max 20 points for 24+ hours
      }

      // Category match bonus (10%)
      if (category && config.category === category) {
        score += 10;
      }

      return { config, score };
    });

    // Sort by score (highest first)
    scoredCandidates.sort((a, b) => b.score - a.score);

    // Add some randomness among top candidates to avoid predictability
    const topCandidates = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

    return selected.config;
  }

  /**
   * Use a subdomain (updates usage statistics)
   */
  useSubdomain(subdomain: string): void {
    const config = this.subdomainConfigs.find(c => c.subdomain === subdomain);
    if (config) {
      config.usageCount++;
      config.lastUsed = new Date();
    }
  }

  /**
   * Reset daily usage counters (should be called daily)
   */
  resetDailyUsage(): void {
    this.subdomainConfigs.forEach(config => {
      config.usageCount = 0;
    });
  }

  /**
   * Get subdomain statistics
   */
  getSubdomainStats(): {
    subdomain: string;
    category: string;
    trustScore: number;
    usageCount: number;
    usagePercentage: number;
    lastUsed: string;
  }[] {
    return this.subdomainConfigs.map(config => ({
      subdomain: config.subdomain,
      category: config.category,
      trustScore: config.trustScore,
      usageCount: config.usageCount,
      usagePercentage: Math.round((config.usageCount / config.maxDailyUse) * 100),
      lastUsed: config.lastUsed.toISOString()
    }));
  }

  /**
   * Get recommended subdomains for different use cases
   */
  getRecommendations(): {
    business: string[];
    technical: string[];
    content: string[];
    security: string[];
  } {
    return {
      business: this.subdomainConfigs
        .filter(c => c.category === 'business')
        .sort((a, b) => b.trustScore - a.trustScore)
        .map(c => c.subdomain),
      technical: this.subdomainConfigs
        .filter(c => c.category === 'technical')
        .sort((a, b) => b.trustScore - a.trustScore)
        .map(c => c.subdomain),
      content: this.subdomainConfigs
        .filter(c => c.category === 'content')
        .sort((a, b) => b.trustScore - a.trustScore)
        .map(c => c.subdomain),
      security: this.subdomainConfigs
        .filter(c => c.category === 'security')
        .sort((a, b) => b.trustScore - a.trustScore)
        .map(c => c.subdomain)
    };
  }

  /**
   * Build full URL with selected subdomain
   */
  buildSubdomainUrl(baseDomain: string, path: string, options: RotationOptions = {}): {
    url: string;
    subdomain: string;
    trustScore: number;
  } {
    const selectedConfig = this.selectSubdomain(options);
    this.useSubdomain(selectedConfig.subdomain);

    // Handle different domain formats
    let fullDomain: string;
    if (baseDomain.startsWith('http://') || baseDomain.startsWith('https://')) {
      const urlObj = new URL(baseDomain);
      fullDomain = `${urlObj.protocol}//${selectedConfig.subdomain}.${urlObj.hostname}`;
    } else {
      fullDomain = `https://${selectedConfig.subdomain}.${baseDomain}`;
    }

    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    return {
      url: `${fullDomain}${normalizedPath}`,
      subdomain: selectedConfig.subdomain,
      trustScore: selectedConfig.trustScore
    };
  }

  /**
   * Get subdomain by name
   */
  getSubdomainConfig(subdomain: string): SubdomainConfig | undefined {
    return this.subdomainConfigs.find(c => c.subdomain === subdomain);
  }

  /**
   * Add custom subdomain configuration
   */
  addCustomSubdomain(config: Omit<SubdomainConfig, 'usageCount' | 'lastUsed'>): void {
    this.subdomainConfigs.push({
      ...config,
      usageCount: 0,
      lastUsed: new Date(0)
    });
  }

  /**
   * Update subdomain trust score based on performance
   */
  updateTrustScore(subdomain: string, newScore: number): void {
    const config = this.subdomainConfigs.find(c => c.subdomain === subdomain);
    if (config) {
      config.trustScore = Math.max(0, Math.min(100, newScore));
    }
  }

  /**
   * Get optimal subdomain for Microsoft evasion
   */
  getMicrosoftOptimalSubdomain(): SubdomainConfig {
    // Prefer business and technical subdomains for Microsoft environments
    return this.selectSubdomain({
      category: Math.random() > 0.5 ? 'business' : 'technical',
      preferHighTrust: true,
      balanceUsage: true,
      avoidRecent: true
    });
  }

  /**
   * Get optimal subdomain for Gmail
   */
  getGmailOptimalSubdomain(): SubdomainConfig {
    // Gmail is less strict, can use content and service subdomains
    const categories = ['business', 'content', 'service'];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return this.selectSubdomain({
      category: randomCategory,
      preferHighTrust: true,
      balanceUsage: true
    });
  }

  /**
   * Get optimal subdomain for corporate email systems
   */
  getCorporateOptimalSubdomain(): SubdomainConfig {
    // Corporate systems prefer business and security subdomains
    return this.selectSubdomain({
      category: Math.random() > 0.7 ? 'security' : 'business',
      preferHighTrust: true,
      balanceUsage: true,
      avoidRecent: true
    });
  }
}

export const subdomainRotation = new SubdomainRotationService();
