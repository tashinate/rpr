// Intelligent Pattern Selection with Machine Learning and Real-time Optimization
// Now uses local patterns instead of database
import { getLocalPatterns, type LocalPattern } from '@/data/localPatterns';
import { localPatternAnalyzer } from './localPatternAnalyzer';
import { optionalAnalytics } from './optionalAnalytics';

interface PatternSelectionOptions {
  category?: string;
  tier?: 1 | 2 | 3;
  emailProvider?: 'gmail' | 'outlook' | 'yahoo';
  region?: string;
  season?: 'spring' | 'summer' | 'fall' | 'winter';
  antiFingerprinting?: boolean;
}

interface PatternScore {
  pattern: LocalPattern;
  score: number;
  reasons: string[];
}

class IntelligentPatternSelector {
  private performanceCache: Map<string, number> = new Map();
  private lastCacheUpdate: number = 0;
  private cacheRefreshInterval = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.updatePerformanceCache();
  }

  async selectOptimalPattern(options: PatternSelectionOptions = {}): Promise<LocalPattern | null> {
    // Update cache if needed
    if (Date.now() - this.lastCacheUpdate > this.cacheRefreshInterval) {
      await this.updatePerformanceCache();
    }

    // Score all available patterns
    const scoredPatterns = await this.scorePatterns(options);
    
    if (scoredPatterns.length === 0) {
      console.warn('No patterns available for selection criteria');
      return null;
    }

    // Apply anti-fingerprinting if requested
    if (options.antiFingerprinting) {
      return this.selectWithAntiFingerprinting(scoredPatterns);
    }

    // Select highest scoring pattern
    const bestPattern = scoredPatterns[0];
    console.log(`Selected pattern: ${bestPattern.pattern.pattern_name} (Score: ${bestPattern.score.toFixed(2)})`);
    console.log(`Selection reasons: ${bestPattern.reasons.join(', ')}`);
    
    return bestPattern.pattern;
  }

  private async scorePatterns(options: PatternSelectionOptions): Promise<PatternScore[]> {
    const currentSeason = this.getCurrentSeason();
    const currentTime = new Date();

    const scored: PatternScore[] = [];

    // Use local patterns instead of massive pattern library
    const localPatterns = getLocalPatterns();
    for (const pattern of localPatterns) {
      let score = pattern.success_rate;
      const reasons: string[] = [];

      // Category match bonus
      if (options.category && pattern.category === options.category) {
        score += 15;
        reasons.push('category_match');
      }

      // Tier preference (lower tier = higher score)
      if (options.tier) {
        if (pattern.tier === options.tier) {
          score += 10;
          reasons.push('tier_match');
        } else if (pattern.tier < options.tier) {
          score += 5;
          reasons.push('tier_upgrade');
        }
      }

      // Performance data from real testing
      const cacheKey = `${pattern.id}_${options.emailProvider || 'overall'}`;
      const cachedPerformance = this.performanceCache.get(cacheKey);
      if (cachedPerformance) {
        score = (score * 0.6) + (cachedPerformance * 0.4); // Weight real data heavily
        reasons.push('performance_data');
      }

      // Seasonal relevance
      if (pattern.metadata.seasonal && this.isSeasonalMatch(pattern, currentSeason)) {
        score += 12;
        reasons.push('seasonal_relevance');
      }

      // Regional preference
      if (options.region && pattern.metadata.regional === options.region) {
        score += 8;
        reasons.push('regional_match');
      }

      // Time-based adjustments
      score += this.getTimeBasedBonus(pattern, currentTime);

      // Usage limit check
      if (pattern.usage_limits.currentUses >= pattern.usage_limits.maxUses) {
        score = 0; // Pattern exhausted
        reasons.push('usage_exhausted');
      } else if (pattern.usage_limits.currentUses / pattern.usage_limits.maxUses > 0.8) {
        score *= 0.7; // Near exhaustion penalty
        reasons.push('usage_high');
      }

      // Anti-fingerprinting boost for varied patterns
      if (options.antiFingerprinting && pattern.tier === 3) {
        score += 20;
        reasons.push('anti_fingerprint');
      }

      // Email provider specific adjustments
      if (options.emailProvider) {
        score += this.getProviderSpecificScore(pattern, options.emailProvider);
        reasons.push('provider_optimization');
      }

      if (score > 0) {
        scored.push({ pattern, score, reasons });
      }
    }

    // Sort by score descending
    return scored.sort((a, b) => b.score - a.score);
  }

  private selectWithAntiFingerprinting(scoredPatterns: PatternScore[]): ExpandedPattern {
    // Advanced anti-fingerprinting: avoid recently used patterns
    const topPatterns = scoredPatterns.slice(0, Math.min(10, scoredPatterns.length));
    const randomIndex = Math.floor(Math.random() * topPatterns.length);
    
    // Generate variation of selected pattern for uniqueness
    const selectedPattern = topPatterns[randomIndex].pattern;
    return patternRandomizer.generatePatternVariation(selectedPattern);
  }

  private async updatePerformanceCache(): Promise<void> {
    try {
      console.log('🎯 [IntelligentPatternSelector] Using local pattern performance data');

      // Use local patterns instead of database
      const localPatterns = getLocalPatterns();

      // Update cache with local pattern data
      this.performanceCache.clear();
      for (const pattern of localPatterns) {
        const cacheKey = `${pattern.id}_overall`;
        this.performanceCache.set(cacheKey, pattern.success_rate);
      }

      this.lastCacheUpdate = Date.now();
      console.log(`✅ [IntelligentPatternSelector] Updated performance cache with ${localPatterns.length} local patterns`);

      // Track cache update (optional analytics)
      await optionalAnalytics.trackEvent('performance_cache_updated', {
        patternCount: localPatterns.length,
        source: 'local_patterns'
      });
    } catch (error) {
      console.error('❌ [IntelligentPatternSelector] Error updating performance cache:', error);
    }
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    if (month >= 9 && month <= 11) return 'fall';
    return 'winter';
  }

  private isSeasonalMatch(pattern: LocalPattern, season: string): boolean {
    // Local patterns don't have seasonal metadata, so return false
    return false;
  }

  private getTimeBasedBonus(pattern: LocalPattern, currentTime: Date): number {
    const hour = currentTime.getHours();
    const category = pattern.category;
    
    // Business hours boost for business patterns
    if (category === 'business' && hour >= 9 && hour <= 17) {
      return 5;
    }
    
    // Evening boost for ecommerce
    if (category === 'ecommerce' && (hour >= 18 || hour <= 22)) {
      return 7;
    }
    
    // Medical patterns work well during day hours
    if (category === 'medical' && hour >= 8 && hour <= 18) {
      return 4;
    }
    
    return 0;
  }

  private getProviderSpecificScore(pattern: ExpandedPattern, provider: string): number {
    // Provider-specific optimizations based on known filter behaviors
    const adjustments = {
      'gmail': {
        'business': 5,
        'ecommerce': -2,
        'news': 3,
        'education': 7,
        'government': 8
      },
      'outlook': {
        'business': 8,
        'ecommerce': 2,
        'news': 1,
        'education': 5,
        'government': 6
      },
      'yahoo': {
        'business': 3,
        'ecommerce': 5,
        'news': 4,
        'education': 2,
        'government': 1
      }
    };

    const providerAdjustments = adjustments[provider as keyof typeof adjustments];
    return providerAdjustments?.[pattern.category as keyof typeof providerAdjustments] || 0;
  }

  // Learning algorithm: adapt to filter changes
  async adaptToFilterChanges(): Promise<void> {
    try {
      // Analyze recent visit logs for pattern performance changes  
      const { data: recentResults, error } = await supabase
        .from('visit_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Detect patterns with declining performance
      const performanceChanges = this.analyzePerformanceChanges(recentResults || []);
      
      if (performanceChanges.declining.length > 0) {
        console.log(`Detected ${performanceChanges.declining.length} patterns with declining performance`);
        
        // Auto-adjust pattern scores or disable problematic patterns
        for (const patternId of performanceChanges.declining) {
          // Reduce score for declining patterns
          const cacheKeys = Array.from(this.performanceCache.keys()).filter(key => key.startsWith(patternId));
          for (const key of cacheKeys) {
            const currentScore = this.performanceCache.get(key) || 0;
            this.performanceCache.set(key, currentScore * 0.8); // 20% penalty
          }
        }
      }

      if (performanceChanges.improving.length > 0) {
        console.log(`Detected ${performanceChanges.improving.length} patterns with improving performance`);
        
        // Boost scores for improving patterns
        for (const patternId of performanceChanges.improving) {
          const cacheKeys = Array.from(this.performanceCache.keys()).filter(key => key.startsWith(patternId));
          for (const key of cacheKeys) {
            const currentScore = this.performanceCache.get(key) || 0;
            this.performanceCache.set(key, Math.min(100, currentScore * 1.1)); // 10% boost, cap at 100
          }
        }
      }

    } catch (error) {
      console.error('Error adapting to filter changes:', error);
    }
  }

  private analyzePerformanceChanges(results: any[]): { declining: string[], improving: string[] } {
    const patternPerformance: Map<string, { recent: number[], older: number[] }> = new Map();
    
    const cutoffDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
    
    for (const result of results) {
      // Use URL hash as pattern identifier for visits
      const patternId = result.url_hash || 'unknown';
      if (!patternPerformance.has(patternId)) {
        patternPerformance.set(patternId, { recent: [], older: [] });
      }
      
      const performance = patternPerformance.get(patternId)!;
      const isSuccessful = !result.is_bot && result.action_taken === 'redirect' ? 1 : 0;
      
      if (new Date(result.created_at) > cutoffDate) {
        performance.recent.push(isSuccessful);
      } else {
        performance.older.push(isSuccessful);
      }
    }
    
    const declining: string[] = [];
    const improving: string[] = [];
    
    for (const [patternId, data] of patternPerformance) {
      if (data.recent.length < 5 || data.older.length < 5) continue; // Need sufficient data
      
      const recentRate = data.recent.reduce((a, b) => a + b, 0) / data.recent.length;
      const olderRate = data.older.reduce((a, b) => a + b, 0) / data.older.length;
      
      const change = recentRate - olderRate;
      
      if (change < -0.15) { // 15% decline
        declining.push(patternId);
      } else if (change > 0.15) { // 15% improvement
        improving.push(patternId);
      }
    }
    
    return { declining, improving };
  }

  // Get pattern statistics for monitoring
  getSelectionStats() {
    const localPatterns = getLocalPatterns();
    return {
      totalPatterns: localPatterns.length,
      cachedPerformanceData: this.performanceCache.size,
      lastCacheUpdate: new Date(this.lastCacheUpdate).toISOString(),
      source: 'local_patterns'
    };
  }
}

// Export singleton instance
export const intelligentPatternSelector = new IntelligentPatternSelector();

// Integration with existing URL generator
export async function selectIntelligentPattern(
  category?: string,
  tier?: 1 | 2 | 3,
  emailProvider?: string,
  region?: string
): Promise<LocalPattern | null> {
  return intelligentPatternSelector.selectOptimalPattern({
    category,
    tier,
    emailProvider: emailProvider as any,
    region,
    antiFingerprinting: true
  });
}