/**
 * LOCAL PATTERN ANALYZER
 * Replaces database-dependent pattern analysis with local ML-style scoring
 * No Supabase dependency - works completely offline
 */

import { getLocalPatterns, getPatternById, type LocalPattern } from '@/data/localPatterns';

export interface PatternAnalysisContext {
  industry?: string;
  targetCountry?: string;
  securityLevel?: 'low' | 'medium' | 'high';
  emailProvider?: 'microsoft' | 'google' | 'corporate' | 'generic';
  targetAudience?: 'business' | 'consumer' | 'mixed';
  contentType?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface PatternAnalysisResult {
  patternId: string;
  patternName: string;
  performanceScore: number;
  riskScore: number;
  reasoning: string[];
  confidence: number;
  metadata: {
    category: string;
    tier: number;
    successRate: number;
    antiDetectionScore: number;
    providerOptimization: string[];
  };
}

export interface PatternRecommendation {
  patternName: string;
  performanceScore: number;
  recommendationReason: string;
  riskScore: number;
  category: string;
  tier: number;
}

class LocalPatternAnalyzer {
  private static instance: LocalPatternAnalyzer;
  private analysisCache = new Map<string, PatternAnalysisResult[]>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): LocalPatternAnalyzer {
    if (!LocalPatternAnalyzer.instance) {
      LocalPatternAnalyzer.instance = new LocalPatternAnalyzer();
    }
    return LocalPatternAnalyzer.instance;
  }

  /**
   * Analyze patterns based on context - completely local
   */
  async analyzePatterns(context: PatternAnalysisContext): Promise<PatternAnalysisResult[]> {
    const cacheKey = this.generateCacheKey(context);
    
    // Check cache first
    const cached = this.analysisCache.get(cacheKey);
    if (cached) {
      console.log('🎯 [LocalPatternAnalyzer] Using cached analysis');
      return cached;
    }

    console.log('🧠 [LocalPatternAnalyzer] Performing local pattern analysis for context:', context);

    // Get all patterns and score them
    const allPatterns = getLocalPatterns();
    const scoredPatterns: PatternAnalysisResult[] = [];

    for (const pattern of allPatterns) {
      const analysis = this.analyzePattern(pattern, context);
      scoredPatterns.push(analysis);
    }

    // Sort by performance score (descending)
    const results = scoredPatterns
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .slice(0, 10); // Top 10 recommendations

    // Cache results
    this.analysisCache.set(cacheKey, results);
    setTimeout(() => this.analysisCache.delete(cacheKey), this.CACHE_TTL);

    console.log(`🎯 [LocalPatternAnalyzer] Analysis complete: ${results.length} patterns analyzed`);
    return results;
  }

  /**
   * Analyze a single pattern against context
   */
  private analyzePattern(pattern: LocalPattern, context: PatternAnalysisContext): PatternAnalysisResult {
    let performanceScore = pattern.success_rate; // Base score from pattern
    let riskScore = 100 - (pattern.anti_detection_score || 85); // Lower is better
    const reasoning: string[] = [];
    let confidence = 80; // Base confidence

    // Industry matching
    if (context.industry) {
      if (pattern.industry === context.industry) {
        performanceScore += 5;
        reasoning.push(`Optimized for ${context.industry} industry`);
        confidence += 10;
      } else if (pattern.industry === 'general') {
        performanceScore += 2;
        reasoning.push('General-purpose pattern suitable for all industries');
        confidence += 5;
      }
    }

    // Email provider optimization
    if (context.emailProvider) {
      if (pattern.provider_optimization?.includes(context.emailProvider)) {
        performanceScore += 8;
        riskScore -= 5;
        reasoning.push(`Specifically optimized for ${context.emailProvider}`);
        confidence += 15;
      } else if (pattern.provider_optimization?.includes('generic')) {
        performanceScore += 3;
        reasoning.push('Compatible with all email providers');
        confidence += 5;
      }
    }

    // Security level considerations
    if (context.securityLevel === 'high') {
      if (pattern.tier === 1) {
        performanceScore += 5;
        reasoning.push('Tier 1 pattern suitable for high-security requirements');
        confidence += 10;
      }
      if ((pattern.anti_detection_score || 85) >= 90) {
        performanceScore += 3;
        riskScore -= 3;
        reasoning.push('High anti-detection score for security-conscious environments');
      }
    }

    // Target audience matching
    if (context.targetAudience === 'business') {
      if (['document', 'business', 'microsoft', 'invoice', 'calendar'].includes(pattern.category)) {
        performanceScore += 4;
        reasoning.push('Business-oriented pattern type');
        confidence += 8;
      }
    } else if (context.targetAudience === 'consumer') {
      if (['google', 'mimicry', 'content', 'cloudStorage'].includes(pattern.category)) {
        performanceScore += 4;
        reasoning.push('Consumer-friendly pattern type');
        confidence += 8;
      }
    }

    // Content type matching
    if (context.contentType) {
      if (pattern.content_type === context.contentType) {
        performanceScore += 3;
        reasoning.push(`Content type matches: ${context.contentType}`);
        confidence += 5;
      }
    }

    // Urgency considerations
    if (context.urgency === 'high') {
      if (pattern.success_rate >= 95) {
        performanceScore += 3;
        reasoning.push('High success rate suitable for urgent campaigns');
      }
    }

    // Geographic routing bonus
    if (pattern.geographic_routing && context.targetCountry) {
      performanceScore += 2;
      reasoning.push('Geographic routing available for better performance');
    }

    // Tier-based adjustments
    if (pattern.tier === 1) {
      performanceScore += 2;
      reasoning.push('Premium Tier 1 pattern');
    }

    // Ensure scores are within bounds
    performanceScore = Math.min(100, Math.max(0, performanceScore));
    riskScore = Math.min(100, Math.max(0, riskScore));
    confidence = Math.min(100, Math.max(0, confidence));

    return {
      patternId: pattern.id,
      patternName: pattern.name,
      performanceScore: Math.round(performanceScore),
      riskScore: Math.round(riskScore),
      reasoning,
      confidence: Math.round(confidence),
      metadata: {
        category: pattern.category,
        tier: pattern.tier,
        successRate: pattern.success_rate,
        antiDetectionScore: pattern.anti_detection_score || 85,
        providerOptimization: pattern.provider_optimization || ['generic']
      }
    };
  }

  /**
   * Get pattern recommendations in the format expected by existing code
   */
  async getPatternRecommendations(context: PatternAnalysisContext): Promise<PatternRecommendation[]> {
    const analysis = await this.analyzePatterns(context);
    
    return analysis.slice(0, 5).map(result => ({
      patternName: result.patternName,
      performanceScore: result.performanceScore,
      recommendationReason: result.reasoning[0] || 'AI-optimized pattern selection',
      riskScore: result.riskScore,
      category: result.metadata.category,
      tier: result.metadata.tier
    }));
  }

  /**
   * Predict performance for a specific pattern (replaces database function)
   */
  async predictPerformance(patternId: string, context: PatternAnalysisContext): Promise<{
    predictedSuccessRate: number;
    confidenceLevel: 'low' | 'medium' | 'high';
    factors: string[];
  }> {
    const pattern = getPatternById(patternId);
    if (!pattern) {
      return {
        predictedSuccessRate: 85,
        confidenceLevel: 'low',
        factors: ['Pattern not found, using default prediction']
      };
    }

    const analysis = this.analyzePattern(pattern, context);
    
    let confidenceLevel: 'low' | 'medium' | 'high' = 'medium';
    if (analysis.confidence >= 90) confidenceLevel = 'high';
    else if (analysis.confidence < 70) confidenceLevel = 'low';

    return {
      predictedSuccessRate: analysis.performanceScore,
      confidenceLevel,
      factors: analysis.reasoning
    };
  }

  /**
   * Get intelligent pattern selection (replaces database queries)
   */
  async selectOptimalPattern(context: PatternAnalysisContext): Promise<LocalPattern | null> {
    const analysis = await this.analyzePatterns(context);
    if (analysis.length === 0) return null;

    const topPattern = analysis[0];
    return getPatternById(topPattern.patternId) || null;
  }

  /**
   * Generate cache key for analysis results
   */
  private generateCacheKey(context: PatternAnalysisContext): string {
    return JSON.stringify(context);
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Get analyzer statistics
   */
  getStats() {
    return {
      cacheSize: this.analysisCache.size,
      totalPatterns: getLocalPatterns().length,
      lastAnalysis: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const localPatternAnalyzer = LocalPatternAnalyzer.getInstance();

// Compatibility functions for existing code
export const analyzePatterns = (context: PatternAnalysisContext) => 
  localPatternAnalyzer.analyzePatterns(context);

export const predictPerformance = (patternId: string, context: PatternAnalysisContext) =>
  localPatternAnalyzer.predictPerformance(patternId, context);

export const selectOptimalPattern = (context: PatternAnalysisContext) =>
  localPatternAnalyzer.selectOptimalPattern(context);
