
import { intelligentUrlGenerator, IntelligentUrlOptions, IntelligentUrlResult } from './intelligentUrlGenerator';
import { supabase } from '@/integrations/supabase/client';

export interface BatchGenerationRequest {
  originalUrl: string;
  licenseKeyId: string;
  count: number;
  options?: IntelligentUrlOptions;
  diversityLevel?: 'low' | 'medium' | 'high';
  exportFormat?: 'json' | 'csv' | 'txt';
}

export interface BatchGenerationResult {
  urls: IntelligentUrlResult[];
  metadata: {
    totalGenerated: number;
    uniquePatterns: number;
    avgSuccessRate: number;
    categories: string[];
    generationTime: number;
  };
  exportData?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  defaultOptions: IntelligentUrlOptions;
  targetAudience: string;
  expectedVolume: number;
  successRate: number;
}

export class BatchUrlGenerator {
  private readonly campaignTemplates: CampaignTemplate[] = [
    {
      id: 'finance-newsletter',
      name: 'Financial Newsletter Campaign',
      description: 'Optimized for financial services newsletters and statements',
      defaultOptions: {
        category: 'banking',
        campaignType: 'standard',
        tier: 1,
        stealthLevel: 'both'
      },
      targetAudience: 'Financial services subscribers',
      expectedVolume: 10000,
      successRate: 96
    },
    {
      id: 'ecommerce-promo',
      name: 'E-commerce Promotional Campaign',
      description: 'High-volume promotional campaigns for retail',
      defaultOptions: {
        category: 'ecommerce',
        campaignType: 'quick',
        tier: 2,
        stealthLevel: 'both'
      },
      targetAudience: 'Online shoppers',
      expectedVolume: 50000,
      successRate: 89
    },
    {
      id: 'government-notice',
      name: 'Government Notice Campaign',
      description: 'Official government communications and notices',
      defaultOptions: {
        category: 'government',
        campaignType: 'evergreen',
        tier: 1,
        stealthLevel: 'planA'
      },
      targetAudience: 'Citizens and residents',
      expectedVolume: 25000,
      successRate: 98
    },
    {
      id: 'healthcare-reminder',
      name: 'Healthcare Reminder Campaign',
      description: 'Medical appointment and health-related communications',
      defaultOptions: {
        category: 'medical',
        campaignType: 'standard',
        tier: 1,
        stealthLevel: 'both'
      },
      targetAudience: 'Patients and healthcare members',
      expectedVolume: 15000,
      successRate: 94
    }
  ];

  /**
   * Generate multiple URLs with intelligent diversification
   */
  async generateBatch(request: BatchGenerationRequest): Promise<BatchGenerationResult> {
    const startTime = Date.now();
    const {
      originalUrl,
      licenseKeyId,
      count,
      options = {},
      diversityLevel = 'medium',
      exportFormat = 'json'
    } = request;

    const urls: IntelligentUrlResult[] = [];
    const categoriesUsed = new Set<string>();
    const patternsUsed = new Set<string>();

    // Determine diversity strategy
    const diversityConfig = this.getDiversityConfig(diversityLevel, count);

    for (let i = 0; i < count; i++) {
      try {
        // Apply diversity strategy
        const generationOptions = this.applyDiversityStrategy(
          options,
          diversityConfig,
          i,
          categoriesUsed,
          patternsUsed
        );

        const result = await intelligentUrlGenerator.generate(
          originalUrl,
          licenseKeyId,
          generationOptions
        );

        urls.push(result);
        categoriesUsed.add(result.category);
        patternsUsed.add(result.pattern);

        // Add small delay to prevent overwhelming the system
        if (i > 0 && i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Failed to generate URL ${i + 1}:`, error);
        // Continue with next URL instead of failing entire batch
      }
    }

    const generationTime = Date.now() - startTime;
    const avgSuccessRate = urls.reduce((sum, url) => sum + url.expectedSuccessRate, 0) / urls.length;

    const metadata = {
      totalGenerated: urls.length,
      uniquePatterns: patternsUsed.size,
      avgSuccessRate: Math.round(avgSuccessRate * 100) / 100,
      categories: Array.from(categoriesUsed),
      generationTime
    };

    // Generate export data if requested
    let exportData: string | undefined;
    if (exportFormat !== 'json') {
      exportData = this.generateExportData(urls, exportFormat);
    }

    return {
      urls,
      metadata,
      exportData
    };
  }

  /**
   * Generate URLs using campaign template
   */
  async generateFromTemplate(
    templateId: string,
    originalUrl: string,
    licenseKeyId: string,
    count: number,
    overrides?: Partial<IntelligentUrlOptions>
  ): Promise<BatchGenerationResult> {
    const template = this.campaignTemplates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Campaign template not found: ${templateId}`);
    }

    const options = {
      ...template.defaultOptions,
      ...overrides
    };

    return this.generateBatch({
      originalUrl,
      licenseKeyId,
      count,
      options,
      diversityLevel: count > 1000 ? 'high' : count > 100 ? 'medium' : 'low'
    });
  }

  /**
   * Get available campaign templates
   */
  getCampaignTemplates(): CampaignTemplate[] {
    return [...this.campaignTemplates];
  }

  /**
   * Generate A/B testing URL sets
   */
  async generateABTestingSets(
    originalUrl: string,
    licenseKeyId: string,
    setCount: number = 3,
    urlsPerSet: number = 100
  ): Promise<{
    sets: Array<{
      name: string;
      urls: IntelligentUrlResult[];
      config: IntelligentUrlOptions;
    }>;
    comparison: {
      avgSuccessRates: number[];
      diversityScores: number[];
      recommendations: string[];
    };
  }> {
    const testConfigs: Array<{ name: string; config: IntelligentUrlOptions }> = [
      {
        name: 'Conservative (Tier 1)',
        config: { tier: 1, stealthLevel: 'planA', campaignType: 'standard' }
      },
      {
        name: 'Balanced (Tier 2)',
        config: { tier: 2, stealthLevel: 'both', campaignType: 'standard' }
      },
      {
        name: 'Aggressive (Tier 3)',
        config: { tier: 3, stealthLevel: 'both', campaignType: 'quick' }
      }
    ];

    const sets = [];
    const avgSuccessRates = [];
    const diversityScores = [];

    for (let i = 0; i < Math.min(setCount, testConfigs.length); i++) {
      const { name, config } = testConfigs[i];
      
      const batch = await this.generateBatch({
        originalUrl,
        licenseKeyId,
        count: urlsPerSet,
        options: config,
        diversityLevel: 'high'
      });

      sets.push({
        name,
        urls: batch.urls,
        config
      });

      avgSuccessRates.push(batch.metadata.avgSuccessRate);
      diversityScores.push(batch.metadata.uniquePatterns / batch.metadata.totalGenerated);
    }

    // Generate comparison recommendations
    const recommendations = [];
    const bestSuccessIndex = avgSuccessRates.indexOf(Math.max(...avgSuccessRates));
    const bestDiversityIndex = diversityScores.indexOf(Math.max(...diversityScores));

    recommendations.push(`Best success rate: ${sets[bestSuccessIndex].name} (${avgSuccessRates[bestSuccessIndex]}%)`);
    recommendations.push(`Best diversity: ${sets[bestDiversityIndex].name} (${Math.round(diversityScores[bestDiversityIndex] * 100)}% unique patterns)`);

    if (bestSuccessIndex === bestDiversityIndex) {
      recommendations.push(`${sets[bestSuccessIndex].name} offers the best balance of success rate and diversity`);
    } else {
      recommendations.push('Consider mixed approach: use high-success config for critical campaigns, high-diversity for large volumes');
    }

    return {
      sets,
      comparison: {
        avgSuccessRates,
        diversityScores,
        recommendations
      }
    };
  }

  /**
   * Save batch generation results to database
   */
  async saveBatchResults(
    licenseKeyId: string,
    batchResult: BatchGenerationResult,
    campaignName?: string
  ): Promise<{ success: boolean; batchId?: string }> {
    try {
      // Store batch metadata in system config
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      const batchData = {
        id: batchId,
        licenseKeyId,
        campaignName: campaignName || `Batch ${new Date().toISOString()}`,
        totalUrls: batchResult.metadata.totalGenerated,
        avgSuccessRate: batchResult.metadata.avgSuccessRate,
        categories: batchResult.metadata.categories,
        generationTime: batchResult.metadata.generationTime,
        createdAt: new Date().toISOString(),
        urls: batchResult.urls.map(url => ({
          url: url.url,
          pattern: url.pattern,
          category: url.category,
          successRate: url.expectedSuccessRate
        }))
      };

      await supabase.rpc('set_global_system_config', {
        key_input: `batch_generation_${batchId}`,
        value_input: batchData
      });

      return { success: true, batchId };
    } catch (error) {
      console.error('Failed to save batch results:', error);
      return { success: false };
    }
  }

  /**
   * Get diversity configuration based on level and count
   */
  private getDiversityConfig(level: string, count: number) {
    const configs = {
      low: {
        categoryRotation: Math.max(1, Math.floor(count / 20)),
        tierRotation: Math.max(1, Math.floor(count / 10)),
        stealthLevelRotation: Math.max(1, Math.floor(count / 5))
      },
      medium: {
        categoryRotation: Math.max(1, Math.floor(count / 10)),
        tierRotation: Math.max(1, Math.floor(count / 5)),
        stealthLevelRotation: Math.max(1, Math.floor(count / 3))
      },
      high: {
        categoryRotation: Math.max(1, Math.floor(count / 5)),
        tierRotation: Math.max(1, Math.floor(count / 3)),
        stealthLevelRotation: Math.max(1, Math.floor(count / 2))
      }
    };

    return configs[level as keyof typeof configs] || configs.medium;
  }

  /**
   * Apply diversity strategy to generation options
   */
  private applyDiversityStrategy(
    baseOptions: IntelligentUrlOptions,
    diversityConfig: any,
    index: number,
    categoriesUsed: Set<string>,
    patternsUsed: Set<string>
  ): IntelligentUrlOptions {
    const options = { ...baseOptions };

    // Rotate categories
    if (index % diversityConfig.categoryRotation === 0) {
      const categories = ['ecommerce', 'government', 'medical', 'banking', 'news', 'education', 'technology', 'realestate', 'legal', 'business'] as const;
      options.category = categories[index % categories.length];
    }

    // Rotate tiers
    if (index % diversityConfig.tierRotation === 0) {
      const tiers = [1, 2, 3] as const;
      options.tier = tiers[index % tiers.length];
    }

    // Rotate stealth levels
    if (index % diversityConfig.stealthLevelRotation === 0) {
      const stealthLevels = ['planA', 'planB', 'both'] as const;
      options.stealthLevel = stealthLevels[index % stealthLevels.length];
    }

    return options;
  }

  /**
   * Generate export data in different formats
   */
  private generateExportData(urls: IntelligentUrlResult[], format: 'csv' | 'txt'): string {
    if (format === 'csv') {
      const headers = ['URL', 'Pattern', 'Category', 'Success Rate', 'Security Level', 'Encryption'];
      const rows = urls.map(url => [
        url.url,
        url.pattern,
        url.category,
        url.expectedSuccessRate.toString(),
        url.securityLevel.toString(),
        url.encryptionMode
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    } else if (format === 'txt') {
      return urls.map((url, index) => 
        `${index + 1}. ${url.url} (${url.category}, ${url.expectedSuccessRate}%)`
      ).join('\n');
    }
    
    return '';
  }
}

// Export singleton instance
export const batchUrlGenerator = new BatchUrlGenerator();
