import { localPatternAnalyzer } from './localPatternAnalyzer';
import { optionalAnalytics } from './optionalAnalytics';

interface PatternAnalysis {
  patternId: string;
  patternName: string;
  riskScore: number;
  performanceScore: number;
  freshness: number;
  antiDetectionScore: number;
  recommendation: 'optimal' | 'good' | 'warning' | 'critical';
  reasoning: string[];
  geographicPerformance: Record<string, number>;
  temporalTrends: Record<string, number>;
}

interface PatternContext {
  industry?: string;
  targetCountry?: string;
  timeOfDay?: number;
  campaignType?: string;
  securityLevel?: 'standard' | 'high' | 'maximum';
  [key: string]: string | number | undefined;
}

export class AdvancedPatternAnalyzer {
  private static instance: AdvancedPatternAnalyzer;
  private analysisCache = new Map<string, PatternAnalysis>();
  private cacheExpiry = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AdvancedPatternAnalyzer {
    if (!AdvancedPatternAnalyzer.instance) {
      AdvancedPatternAnalyzer.instance = new AdvancedPatternAnalyzer();
    }
    return AdvancedPatternAnalyzer.instance;
  }

  /**
   * Analyzes all available patterns and returns advanced recommendations
   * Now uses local pattern analyzer instead of database
   */
  async analyzePatterns(context: PatternContext = {}): Promise<PatternAnalysis[]> {
    try {
      console.log('🧠 [AdvancedPatternAnalyzer] Delegating to local pattern analyzer');

      // Use local pattern analyzer instead of database
      const localAnalysis = await localPatternAnalyzer.analyzePatterns(context);

      // Convert to expected format
      const analyses: PatternAnalysis[] = localAnalysis.map(result => ({
        patternId: result.patternId,
        patternName: result.patternName,
        riskScore: result.riskScore,
        performanceScore: result.performanceScore,
        freshness: 100, // Local patterns are always fresh
        antiDetectionScore: result.metadata.antiDetectionScore,
        recommendation: this.getRecommendationLevel(result.performanceScore, result.riskScore),
        reasoning: result.reasoning,
        confidence: result.confidence,
        metadata: {
          category: result.metadata.category,
          tier: result.metadata.tier,
          successRate: result.metadata.successRate
        }
      }));

      // Track analysis (optional analytics)
      await optionalAnalytics.trackEvent('pattern_analysis', {
        context,
        resultCount: analyses.length,
        source: 'local_analyzer'
      });

      return analyses;

    } catch (error) {
      console.error('❌ [AdvancedPatternAnalyzer] Analysis error:', error);
      throw error;
    }
  }

  /**
   * Get recommendation level based on scores
   */
  private getRecommendationLevel(performanceScore: number, riskScore: number): 'optimal' | 'good' | 'warning' | 'critical' {
    if (performanceScore >= 95 && riskScore <= 15) return 'optimal';
    if (performanceScore >= 85 && riskScore <= 25) return 'good';
    if (performanceScore >= 70 && riskScore <= 40) return 'warning';
    return 'critical';
  }

  /**
   * Analyzes a single pattern with contextual factors
   */
  private async analyzePattern(pattern: any, context: PatternContext): Promise<PatternAnalysis> {
    const cacheKey = `${pattern.pattern_id}-${JSON.stringify(context)}`;
    const cached = this.analysisCache.get(cacheKey);
    
    if (cached && Date.now() - cached.freshness < this.cacheExpiry) {
      return cached;
    }

    try {
      // Calculate base scores
      const performanceScore = this.calculatePerformanceScore(pattern, context);
      const antiDetectionScore = this.calculateAntiDetectionScore(pattern, context);
      const freshness = this.calculateFreshnessScore(pattern);
      const riskScore = this.calculateRiskScore(pattern, context);

      // Generate recommendations
      const { recommendation, reasoning } = this.generateRecommendations(
        performanceScore,
        antiDetectionScore,
        freshness,
        riskScore,
        pattern,
        context
      );

      const analysis: PatternAnalysis = {
        patternId: pattern.pattern_id,
        patternName: pattern.pattern_name,
        riskScore,
        performanceScore,
        freshness,
        antiDetectionScore,
        recommendation,
        reasoning,
        geographicPerformance: this.analyzeGeographicPerformance(pattern),
        temporalTrends: this.analyzeTemporalTrends(pattern)
      };

      // Cache the analysis
      this.analysisCache.set(cacheKey, { ...analysis, freshness: Date.now() });

      return analysis;

    } catch (error) {
      console.error('Error analyzing individual pattern:', error);
      throw error;
    }
  }

  /**
   * Calculates performance score based on success rate and usage patterns
   */
  private calculatePerformanceScore(pattern: any, context: PatternContext): number {
    let score = pattern.success_rate || 85;

    // Adjust for usage patterns
    const usageRatio = pattern.current_uses / pattern.max_uses;
    if (usageRatio > 0.8) {
      score -= 10; // Heavy usage penalty
    } else if (usageRatio < 0.2) {
      score += 5; // Fresh pattern bonus
    }

    // Tier adjustment
    if (pattern.tier === 1) {
      score += 10; // Premium tier bonus
    }

    // Context-based adjustments
    if (context.securityLevel === 'maximum' && pattern.tier === 1) {
      score += 5;
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculates anti-detection score based on pattern characteristics
   */
  private calculateAntiDetectionScore(pattern: any, context: PatternContext): number {
    let score = 85; // Base score

    // Pattern age factor
    const createdDate = new Date(pattern.created_at || Date.now());
    const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (ageInDays < 7) {
      score += 10; // Very fresh pattern
    } else if (ageInDays < 30) {
      score += 5; // Fresh pattern
    } else if (ageInDays > 90) {
      score -= 15; // Aging pattern
    }

    // Usage-based detection risk
    const totalUsage = pattern.total_usage || 0;
    if (totalUsage > 10000) {
      score -= 20; // High exposure risk
    } else if (totalUsage > 5000) {
      score -= 10; // Medium exposure risk
    }

    // Category-based adjustments
    if (pattern.category === 'government' || pattern.category === 'finance') {
      score += 5; // Higher trust categories
    }

    return Math.min(Math.max(score, 0), 100);
  }

  /**
   * Calculates freshness score based on recent usage and updates
   */
  private calculateFreshnessScore(pattern: any): number {
    const now = Date.now();
    const updatedDate = new Date(pattern.updated_at || now);
    const hoursSinceUpdate = (now - updatedDate.getTime()) / (1000 * 60 * 60);

    if (hoursSinceUpdate < 1) return 100;
    if (hoursSinceUpdate < 24) return 95;
    if (hoursSinceUpdate < 168) return 85; // 1 week
    if (hoursSinceUpdate < 720) return 70; // 1 month
    
    return 50; // Older than 1 month
  }

  /**
   * Calculates overall risk score
   */
  private calculateRiskScore(pattern: any, context: PatternContext): number {
    let riskScore = 0;

    // Usage-based risk
    const usageRatio = pattern.current_uses / pattern.max_uses;
    riskScore += usageRatio * 30;

    // Age-based risk
    const createdDate = new Date(pattern.created_at || Date.now());
    const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 60) riskScore += 20;

    // Success rate risk (inverse relationship)
    const successRate = pattern.success_rate || 85;
    if (successRate < 80) riskScore += 25;
    if (successRate < 70) riskScore += 35;

    // Total usage exposure risk
    const totalUsage = pattern.total_usage || 0;
    if (totalUsage > 5000) riskScore += 15;

    return Math.min(riskScore, 100);
  }

  /**
   * Generates recommendations based on analysis scores
   */
  private generateRecommendations(
    performanceScore: number,
    antiDetectionScore: number,
    freshness: number,
    riskScore: number,
    pattern: any,
    context: PatternContext
  ) {
    const reasoning: string[] = [];
    let recommendation: 'optimal' | 'good' | 'warning' | 'critical';

    // Overall assessment
    const overallScore = (performanceScore * 0.4 + antiDetectionScore * 0.3 + freshness * 0.3);

    if (overallScore >= 90 && riskScore < 20) {
      recommendation = 'optimal';
      reasoning.push('Excellent performance and security profile');
    } else if (overallScore >= 75 && riskScore < 40) {
      recommendation = 'good';
      reasoning.push('Good balance of performance and security');
    } else if (overallScore >= 60 || riskScore < 60) {
      recommendation = 'warning';
      reasoning.push('Acceptable but monitor closely');
    } else {
      recommendation = 'critical';
      reasoning.push('High risk - consider alternatives');
    }

    // Specific recommendations
    if (freshness < 70) {
      reasoning.push('Pattern aging - consider rotation');
    }

    if (pattern.current_uses / pattern.max_uses > 0.8) {
      reasoning.push('Approaching usage limit - plan replacement');
    }

    if (antiDetectionScore < 70) {
      reasoning.push('Elevated detection risk - use with caution');
    }

    if (performanceScore > 95) {
      reasoning.push('Exceptional performance - premium choice');
    }

    if (pattern.tier === 1) {
      reasoning.push('Premium tier - enhanced security features');
    }

    return { recommendation, reasoning };
  }

  /**
   * Analyzes geographic performance patterns
   */
  private analyzeGeographicPerformance(pattern: any): Record<string, number> {
    // This would be enhanced with real geographic data from pattern_usage_stats
    // For now, return simulated data based on category
    const basePerformance = pattern.success_rate || 85;
    
    return {
      'US': basePerformance + (Math.random() * 10 - 5),
      'CA': basePerformance + (Math.random() * 10 - 5),
      'GB': basePerformance + (Math.random() * 10 - 5),
      'AU': basePerformance + (Math.random() * 10 - 5),
      'DE': basePerformance + (Math.random() * 10 - 5)
    };
  }

  /**
   * Analyzes temporal performance trends
   */
  private analyzeTemporalTrends(pattern: any): Record<string, number> {
    // This would be enhanced with real temporal data
    // For now, return simulated hourly performance data
    const basePerformance = pattern.success_rate || 85;
    const trends: Record<string, number> = {};
    
    for (let hour = 0; hour < 24; hour++) {
      // Simulate business hours having slightly better performance
      const isBusinessHours = hour >= 9 && hour <= 17;
      const variance = isBusinessHours ? 5 : -3;
      trends[hour.toString()] = Math.max(0, Math.min(100, basePerformance + variance + (Math.random() * 6 - 3)));
    }
    
    return trends;
  }

  /**
   * Predicts pattern performance for given context
   */
  async predictPerformance(patternId: string, context: PatternContext): Promise<{
    predictedSuccessRate: number;
    confidenceLevel: 'high' | 'medium' | 'low';
    factors: string[];
  }> {
    try {
      // This would use the predict_pattern_performance function when types are updated
      const patterns = await this.analyzePatterns(context);
      const pattern = patterns.find(p => p.patternId === patternId);
      
      if (!pattern) {
        throw new Error('Pattern not found');
      }

      const factors: string[] = [];
      let predictedSuccessRate = pattern.performanceScore;
      let confidenceLevel: 'high' | 'medium' | 'low' = 'medium';

      // Adjust based on context
      if (context.industry && pattern.geographicPerformance) {
        factors.push(`Industry-specific optimization for ${context.industry}`);
      }

      if (context.targetCountry && pattern.geographicPerformance[context.targetCountry]) {
        const geoScore = pattern.geographicPerformance[context.targetCountry];
        predictedSuccessRate = (predictedSuccessRate + geoScore) / 2;
        factors.push(`Geographic optimization for ${context.targetCountry}`);
      }

      if (context.timeOfDay && pattern.temporalTrends) {
        const timeScore = pattern.temporalTrends[context.timeOfDay.toString()];
        if (timeScore) {
          predictedSuccessRate = (predictedSuccessRate + timeScore) / 2;
          factors.push(`Temporal optimization for hour ${context.timeOfDay}`);
        }
      }

      // Determine confidence based on available data and pattern maturity
      if (pattern.freshness > 80 && factors.length >= 2) {
        confidenceLevel = 'high';
      } else if (pattern.freshness < 60 || factors.length === 0) {
        confidenceLevel = 'low';
      }

      return {
        predictedSuccessRate: Math.round(predictedSuccessRate),
        confidenceLevel,
        factors
      };

    } catch (error) {
      console.error('Error predicting pattern performance:', error);
      throw error;
    }
  }

  /**
   * Clears analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }
}

// Export singleton instance
export const patternAnalyzer = AdvancedPatternAnalyzer.getInstance();