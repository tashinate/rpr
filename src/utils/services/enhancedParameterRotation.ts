interface ParameterContext {
  timezone?: string;
  region?: 'US' | 'EU' | 'APAC';
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  industry?: string;
  timeOfDay?: number;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
}

interface ParameterPool {
  businessHours: string[];
  geographic: Record<string, string[]>;
  deviceSpecific: Record<string, string[]>;
  industryTerms: Record<string, string[]>;
  seasonal: Record<string, string[]>;
}

class EnhancedParameterRotation {
  private parameterPools: ParameterPool = {
    businessHours: [
      'morning-sync', 'midday-update', 'afternoon-check', 
      'evening-backup', 'weekly-report', 'monthly-summary',
      'quarterly-review', 'annual-audit'
    ],
    geographic: {
      US: ['east-coast', 'west-coast', 'central-time', 'pacific-zone', 'mountain-region'],
      EU: ['gmt-zone', 'central-europe', 'nordic-region', 'mediterranean', 'eastern-europe'],
      APAC: ['asia-pacific', 'oceania', 'southeast-asia', 'east-asia', 'south-asia']
    },
    deviceSpecific: {
      mobile: ['mobile-opt', 'touch-interface', 'responsive', 'app-version', 'portable'],
      desktop: ['desktop-app', 'full-version', 'workstation', 'enterprise', 'professional'],
      tablet: ['tablet-view', 'hybrid-mode', 'medium-screen', 'touch-desktop', 'portable-pro']
    },
    industryTerms: {
      government: ['public-sector', 'civic-service', 'municipal', 'federal', 'state-level'],
      banking: ['financial-services', 'secure-banking', 'monetary', 'fiscal', 'treasury'],
      medical: ['healthcare', 'clinical', 'patient-care', 'medical-records', 'health-system'],
      legal: ['legal-services', 'juridical', 'law-practice', 'court-system', 'legal-docs'],
      technology: ['tech-services', 'digital-platform', 'cloud-system', 'software-solution', 'tech-stack']
    },
    seasonal: {
      spring: ['renewal', 'fresh-start', 'new-quarter', 'spring-update', 'growth-phase'],
      summer: ['peak-season', 'summer-ops', 'high-activity', 'vacation-mode', 'summer-schedule'],
      fall: ['autumn-review', 'fall-planning', 'year-end-prep', 'harvest-data', 'q4-planning'],
      winter: ['winter-backup', 'year-end', 'holiday-schedule', 'annual-close', 'winter-maintenance']
    }
  };

  generateEnhancedParameters(context: ParameterContext = {}): Record<string, string> {
    const now = new Date();
    const currentHour = context.timeOfDay || now.getHours();
    const currentSeason = this.getCurrentSeason();
    
    const baseParams = {
      timestamp: now.getTime().toString(),
      session_id: this.generateSessionId(),
      version: this.generateVersion(),
      cache_key: this.generateCacheKey()
    };

    // Business hours simulation
    if (this.isBusinessHours(currentHour)) {
      baseParams['sync_type'] = this.randomFromArray(this.parameterPools.businessHours);
      baseParams['priority'] = 'business';
    } else {
      baseParams['sync_type'] = 'after-hours';
      baseParams['priority'] = 'maintenance';
    }

    // Geographic parameters
    if (context.region) {
      const geoParams = this.parameterPools.geographic[context.region] || [];
      baseParams['region'] = this.randomFromArray(geoParams);
      baseParams['locale'] = this.getLocaleForRegion(context.region);
    }

    // Device-specific parameters
    if (context.deviceType) {
      const deviceParams = this.parameterPools.deviceSpecific[context.deviceType] || [];
      baseParams['interface'] = this.randomFromArray(deviceParams);
      baseParams['viewport'] = this.getViewportForDevice(context.deviceType);
    }

    // Industry-specific terminology
    if (context.industry) {
      const industryParams = this.parameterPools.industryTerms[context.industry] || [];
      baseParams['service_type'] = this.randomFromArray(industryParams);
      baseParams['category'] = context.industry;
    }

    // Seasonal adjustments
    const seasonalParams = this.parameterPools.seasonal[currentSeason] || [];
    baseParams['seasonal_context'] = this.randomFromArray(seasonalParams);

    return baseParams;
  }

  private getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  private isBusinessHours(hour: number): boolean {
    return hour >= 9 && hour <= 17;
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  private generateVersion(): string {
    const major = Math.floor(Math.random() * 3) + 1;
    const minor = Math.floor(Math.random() * 10);
    const patch = Math.floor(Math.random() * 100);
    return `${major}.${minor}.${patch}`;
  }

  private generateCacheKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private randomFromArray<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private getLocaleForRegion(region: string): string {
    const locales = {
      US: 'en-US',
      EU: 'en-GB',
      APAC: 'en-AU'
    };
    return locales[region as keyof typeof locales] || 'en-US';
  }

  private getViewportForDevice(deviceType: string): string {
    const viewports = {
      mobile: '375x667',
      desktop: '1920x1080',
      tablet: '768x1024'
    };
    return viewports[deviceType as keyof typeof viewports] || '1920x1080';
  }

  // Public method for getting contextual parameters
  getParametersForPattern(patternCategory: string, userContext?: Partial<ParameterContext>): Record<string, string> {
    const context: ParameterContext = {
      industry: patternCategory.toLowerCase(),
      region: this.detectRegionFromTimezone(),
      deviceType: 'desktop', // Default fallback
      ...userContext
    };

    return this.generateEnhancedParameters(context);
  }

  private detectRegionFromTimezone(): 'US' | 'EU' | 'APAC' {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone.includes('America')) return 'US';
      if (timezone.includes('Europe') || timezone.includes('Africa')) return 'EU';
      return 'APAC';
    } catch {
      return 'US'; // Default fallback
    }
  }
}

export const enhancedParameterRotation = new EnhancedParameterRotation();