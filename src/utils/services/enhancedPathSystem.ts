import { supabase } from '@/integrations/supabase/client';

export interface PathTier {
  id: number;
  name: string;
  maxLength: number;
  complexity: 'simple' | 'medium' | 'complex';
  expectedSuccessRate: number;
  description: string;
}

export interface PathTemplate {
  id: string;
  name: string;
  template: string;
  category: string;
  tier: number;
  estimatedLength: number;
  parameters: PathParameter[];
  successRate: number;
}

export interface PathParameter {
  name: string;
  type: 'static' | 'dynamic' | 'encrypted';
  maxLength: number;
  realistic: boolean;
  examples: string[];
}

export interface PathGenerationOptions {
  category?: string;
  tier?: number;
  maxLength?: number;
  encryptedDataLength?: number;
  contextualData?: Record<string, any>;
}

export interface PathGenerationResult {
  url: string;
  template: PathTemplate;
  actualLength: number;
  parameters: Record<string, string>;
  tier: PathTier;
  lengthOptimized: boolean;
  estimatedSuccessRate: number;
}

/**
 * Enhanced Path-Based System with Smart Length Control
 * Implements tiered complexity levels with intelligent length management
 */
export class EnhancedPathSystem {
  private static instance: EnhancedPathSystem;
  private pathTiers: PathTier[];
  private pathTemplates: PathTemplate[];
  private initialized = false;

  constructor() {
    this.pathTiers = this.initializePathTiers();
    this.pathTemplates = this.initializePathTemplates();
  }

  static getInstance(): EnhancedPathSystem {
    if (!EnhancedPathSystem.instance) {
      EnhancedPathSystem.instance = new EnhancedPathSystem();
    }
    return EnhancedPathSystem.instance;
  }

  /**
   * Generate optimized path with smart length control
   */
  async generateOptimizedPath(
    encryptedData: string,
    options: PathGenerationOptions = {}
  ): Promise<PathGenerationResult> {
    const {
      category = 'business',
      tier = 1,
      maxLength = 120,
      encryptedDataLength = encryptedData.length,
      contextualData = {}
    } = options;

    // Select appropriate tier based on constraints
    const selectedTier = this.selectOptimalTier(maxLength, encryptedDataLength);
    
    // Get templates for the selected tier and category
    const candidateTemplates = this.getTemplatesForTierAndCategory(selectedTier.id, category);
    
    // Select best template based on estimated length
    const selectedTemplate = this.selectOptimalTemplate(candidateTemplates, maxLength, encryptedDataLength);
    
    // Generate parameters with length optimization
    const parameters = this.generateOptimizedParameters(selectedTemplate, encryptedData, contextualData, maxLength);
    
    // Build final URL
    const finalUrl = this.buildUrl(selectedTemplate.template, parameters);
    
    // Verify length constraints
    const lengthOptimized = finalUrl.length <= maxLength;
    
    // Calculate success rate based on realism and length
    const estimatedSuccessRate = this.calculateSuccessRate(selectedTemplate, finalUrl.length, lengthOptimized);

    return {
      url: finalUrl,
      template: selectedTemplate,
      actualLength: finalUrl.length,
      parameters,
      tier: selectedTier,
      lengthOptimized,
      estimatedSuccessRate
    };
  }

  /**
   * Initialize path tiers with different complexity levels
   */
  private initializePathTiers(): PathTier[] {
    return [
      {
        id: 1,
        name: 'High Success',
        maxLength: 100,
        complexity: 'medium',
        expectedSuccessRate: 92,
        description: 'Medium complexity, optimal deliverability'
      },
      {
        id: 2,
        name: 'Standard',
        maxLength: 80,
        complexity: 'simple',
        expectedSuccessRate: 88,
        description: 'Basic complexity, good balance'
      },
      {
        id: 3,
        name: 'Simple',
        maxLength: 60,
        complexity: 'simple',
        expectedSuccessRate: 85,
        description: 'Minimal complexity, maximum compatibility'
      }
    ];
  }

  /**
   * Initialize optimized path templates
   */
  private initializePathTemplates(): PathTemplate[] {
    return [
      // Tier 1 - High Success (Medium Complexity, ~80-100 chars)
      {
        id: 'corp_report_t1',
        name: 'Corporate Reports Tier 1',
        template: '/corporate/reports/{year}-{quarter}.pdf?token={encrypted}&session={session}',
        category: 'business',
        tier: 1,
        estimatedLength: 95,
        parameters: [
          { name: 'year', type: 'static', maxLength: 4, realistic: true, examples: ['2024', '2025'] },
          { name: 'quarter', type: 'static', maxLength: 2, realistic: true, examples: ['Q1', 'Q2', 'Q3', 'Q4'] },
          { name: 'encrypted', type: 'encrypted', maxLength: 40, realistic: true, examples: [] },
          { name: 'session', type: 'dynamic', maxLength: 8, realistic: true, examples: ['abc123ef'] }
        ],
        successRate: 92
      },
      {
        id: 'medical_portal_t1',
        name: 'Medical Portal Tier 1',
        template: '/patient/portal/{year}/records.pdf?access={encrypted}&ref={ref}',
        category: 'medical',
        tier: 1,
        estimatedLength: 88,
        parameters: [
          { name: 'year', type: 'static', maxLength: 4, realistic: true, examples: ['2024'] },
          { name: 'encrypted', type: 'encrypted', maxLength: 40, realistic: true, examples: [] },
          { name: 'ref', type: 'dynamic', maxLength: 6, realistic: true, examples: ['PAT123'] }
        ],
        successRate: 91
      },
      {
        id: 'banking_stmt_t1',
        name: 'Banking Statement Tier 1',
        template: '/banking/statements/{year}-{month}.pdf?doc={encrypted}&id={account}',
        category: 'banking',
        tier: 1,
        estimatedLength: 92,
        parameters: [
          { name: 'year', type: 'static', maxLength: 4, realistic: true, examples: ['2024'] },
          { name: 'month', type: 'static', maxLength: 2, realistic: true, examples: ['01', '02', '12'] },
          { name: 'encrypted', type: 'encrypted', maxLength: 40, realistic: true, examples: [] },
          { name: 'account', type: 'dynamic', maxLength: 8, realistic: true, examples: ['ACC12345'] }
        ],
        successRate: 93
      },

      // Tier 2 - Standard (Basic Complexity, ~60-80 chars)
      {
        id: 'document_std_t2',
        name: 'Document Standard Tier 2',
        template: '/documents/report-{year}.pdf?doc={encrypted}&ref={ref}',
        category: 'business',
        tier: 2,
        estimatedLength: 75,
        parameters: [
          { name: 'year', type: 'static', maxLength: 4, realistic: true, examples: ['2024'] },
          { name: 'encrypted', type: 'encrypted', maxLength: 35, realistic: true, examples: [] },
          { name: 'ref', type: 'dynamic', maxLength: 6, realistic: true, examples: ['REF123'] }
        ],
        successRate: 88
      },
      {
        id: 'gov_form_t2',
        name: 'Government Form Tier 2',
        template: '/forms/{form}-{year}.pdf?token={encrypted}&id={id}',
        category: 'government',
        tier: 2,
        estimatedLength: 72,
        parameters: [
          { name: 'form', type: 'static', maxLength: 4, realistic: true, examples: ['1040', 'W2', '1099'] },
          { name: 'year', type: 'static', maxLength: 4, realistic: true, examples: ['2024'] },
          { name: 'encrypted', type: 'encrypted', maxLength: 35, realistic: true, examples: [] },
          { name: 'id', type: 'dynamic', maxLength: 6, realistic: true, examples: ['DOC123'] }
        ],
        successRate: 89
      },

      // Tier 3 - Simple (Minimal Complexity, ~40-60 chars)
      {
        id: 'file_simple_t3',
        name: 'File Simple Tier 3',
        template: '/docs/file-{id}.pdf?d={encrypted}',
        category: 'business',
        tier: 3,
        estimatedLength: 55,
        parameters: [
          { name: 'id', type: 'dynamic', maxLength: 6, realistic: true, examples: ['123456'] },
          { name: 'encrypted', type: 'encrypted', maxLength: 30, realistic: true, examples: [] }
        ],
        successRate: 85
      },
      {
        id: 'content_simple_t3',
        name: 'Content Simple Tier 3',
        template: '/content/{year}.pdf?c={encrypted}',
        category: 'news',
        tier: 3,
        estimatedLength: 48,
        parameters: [
          { name: 'year', type: 'static', maxLength: 4, realistic: true, examples: ['2024'] },
          { name: 'encrypted', type: 'encrypted', maxLength: 25, realistic: true, examples: [] }
        ],
        successRate: 84
      }
    ];
  }

  /**
   * Select optimal tier based on length constraints
   */
  private selectOptimalTier(maxLength: number, encryptedDataLength: number): PathTier {
    // Calculate minimum required length for encrypted data plus basic structure
    const minimumRequired = encryptedDataLength + 30; // Base path + parameters

    // Find the highest tier that can accommodate the requirements
    const suitableTiers = this.pathTiers.filter(tier => tier.maxLength >= minimumRequired);
    
    if (suitableTiers.length === 0) {
      // If no tier can accommodate, use the largest tier and truncate encrypted data
      return this.pathTiers[0];
    }

    // Among suitable tiers, find the one closest to but not exceeding maxLength
    const optimalTier = suitableTiers.find(tier => tier.maxLength <= maxLength) 
      || suitableTiers[suitableTiers.length - 1];

    return optimalTier;
  }

  /**
   * Get templates for specific tier and category
   */
  private getTemplatesForTierAndCategory(tierId: number, category: string): PathTemplate[] {
    return this.pathTemplates.filter(template => 
      template.tier === tierId && 
      (template.category === category || template.category === 'business')
    ).sort((a, b) => b.successRate - a.successRate);
  }

  /**
   * Select optimal template based on estimated length
   */
  private selectOptimalTemplate(
    templates: PathTemplate[], 
    maxLength: number, 
    encryptedDataLength: number
  ): PathTemplate {
    if (templates.length === 0) {
      // Fallback to simplest template
      return this.pathTemplates.find(t => t.tier === 3) || this.pathTemplates[0];
    }

    // Estimate final length for each template
    const templatesWithEstimates = templates.map(template => {
      const estimatedFinalLength = this.estimateTemplateLength(template, encryptedDataLength);
      return { template, estimatedFinalLength };
    });

    // Filter templates that fit within length constraint
    const fittingTemplates = templatesWithEstimates.filter(
      ({ estimatedFinalLength }) => estimatedFinalLength <= maxLength
    );

    if (fittingTemplates.length === 0) {
      // If none fit, select the shortest one
      templatesWithEstimates.sort((a, b) => a.estimatedFinalLength - b.estimatedFinalLength);
      return templatesWithEstimates[0].template;
    }

    // Among fitting templates, select the one with highest success rate
    fittingTemplates.sort((a, b) => b.template.successRate - a.template.successRate);
    return fittingTemplates[0].template;
  }

  /**
   * Estimate final length of a template with encrypted data
   */
  private estimateTemplateLength(template: PathTemplate, encryptedDataLength: number): number {
    let estimatedLength = template.template.length;

    // Replace placeholders with estimated parameter lengths
    template.parameters.forEach(param => {
      const placeholder = `{${param.name}}`;
      const placeholderLength = placeholder.length;
      
      let paramLength = param.maxLength;
      if (param.type === 'encrypted') {
        paramLength = encryptedDataLength;
      }
      
      estimatedLength += paramLength - placeholderLength;
    });

    return estimatedLength;
  }

  /**
   * Generate optimized parameters with length constraints
   */
  private generateOptimizedParameters(
    template: PathTemplate,
    encryptedData: string,
    contextualData: Record<string, any>,
    maxLength: number
  ): Record<string, string> {
    const parameters: Record<string, string> = {};
    let remainingLength = maxLength - template.template.length;

    // Calculate total placeholder length to subtract
    template.parameters.forEach(param => {
      remainingLength += `{${param.name}}`.length;
    });

    template.parameters.forEach(param => {
      let value: string;

      switch (param.type) {
        case 'static':
          value = this.generateStaticValue(param, contextualData);
          break;
        case 'encrypted':
          // Optimize encrypted data length if necessary
          value = this.optimizeEncryptedData(encryptedData, param.maxLength, remainingLength);
          break;
        case 'dynamic':
          value = this.generateDynamicValue(param, contextualData);
          break;
        default:
          value = 'default';
      }

      parameters[param.name] = value;
      remainingLength -= value.length;
    });

    return parameters;
  }

  /**
   * Generate static parameter values
   */
  private generateStaticValue(param: PathParameter, contextualData: Record<string, any>): string {
    // Use contextual data if available
    if (contextualData[param.name]) {
      return String(contextualData[param.name]).substring(0, param.maxLength);
    }

    // Use realistic examples
    if (param.examples.length > 0) {
      return param.examples[Math.floor(Math.random() * param.examples.length)];
    }

    // Generate based on parameter name
    switch (param.name) {
      case 'year':
        return new Date().getFullYear().toString();
      case 'quarter':
        return `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`;
      case 'month':
        return (new Date().getMonth() + 1).toString().padStart(2, '0');
      case 'form':
        return ['1040', 'W2', '1099'][Math.floor(Math.random() * 3)];
      default:
        return param.examples[0] || 'default';
    }
  }

  /**
   * Optimize encrypted data for length constraints
   */
  private optimizeEncryptedData(encryptedData: string, maxLength: number, remainingLength: number): string {
    const targetLength = Math.min(maxLength, Math.max(20, remainingLength - 10)); // Keep some buffer
    
    if (encryptedData.length <= targetLength) {
      return encryptedData;
    }

    // Compress by removing padding characters and using more efficient encoding
    let optimized = encryptedData.replace(/[=]+$/, ''); // Remove padding characters
    
    if (optimized.length > targetLength) {
      // Truncate but ensure it's still usable (minimum 20 chars for security)
      optimized = optimized.substring(0, Math.max(20, targetLength));
    }

    return optimized;
  }

  /**
   * Generate dynamic parameter values
   */
  private generateDynamicValue(param: PathParameter, contextualData: Record<string, any>): string {
    // Use contextual data if available
    if (contextualData[param.name]) {
      return String(contextualData[param.name]).substring(0, param.maxLength);
    }

    // Generate realistic values based on parameter name
    switch (param.name) {
      case 'session':
        return this.generateAlphanumeric(8);
      case 'ref':
        return `REF${this.generateAlphanumeric(3)}`;
      case 'account':
        return `ACC${this.generateNumeric(5)}`;
      case 'id':
        return this.generateAlphanumeric(param.maxLength);
      default:
        return this.generateAlphanumeric(Math.min(6, param.maxLength));
    }
  }

  /**
   * Build final URL from template and parameters
   */
  private buildUrl(template: string, parameters: Record<string, string>): string {
    let url = template;
    
    Object.entries(parameters).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, value);
    });

    return url;
  }

  /**
   * Calculate success rate based on template and final length
   */
  private calculateSuccessRate(template: PathTemplate, finalLength: number, lengthOptimized: boolean): number {
    let successRate = template.successRate;

    // Length penalty/bonus
    if (finalLength <= 80) {
      successRate += 3; // Bonus for short URLs
    } else if (finalLength > 120) {
      successRate -= 5; // Penalty for long URLs
    }

    // Optimization bonus
    if (lengthOptimized) {
      successRate += 2;
    }

    return Math.min(99, Math.max(70, successRate));
  }

  /**
   * Utility: Generate alphanumeric string
   */
  private generateAlphanumeric(length: number): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  /**
   * Utility: Generate numeric string
   */
  private generateNumeric(length: number): string {
    const chars = '0123456789';
    return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  /**
   * Get available tiers for external access
   */
  getTiers(): PathTier[] {
    return [...this.pathTiers];
  }

  /**
   * Get available templates for external access
   */
  getTemplates(): PathTemplate[] {
    return [...this.pathTemplates];
  }
}

// Export singleton instance
export const enhancedPathSystem = EnhancedPathSystem.getInstance();
