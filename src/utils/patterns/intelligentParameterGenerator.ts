/**
 * INTELLIGENT PARAMETER GENERATOR
 * 
 * Generates realistic, context-aware parameters for URL patterns
 * Eliminates "undefined" values and ensures business-like parameters
 */

export interface ParameterContext {
  category: string;
  industry?: string;
  targetProvider?: string;
  userLocation?: string;
  campaignType?: string;
}

export class IntelligentParameterGenerator {
  private static instance: IntelligentParameterGenerator;
  
  // Realistic data pools for parameter generation
  private readonly departments = [
    'finance', 'hr', 'legal', 'marketing', 'operations', 'it', 'sales', 
    'compliance', 'procurement', 'facilities', 'security', 'audit'
  ];
  
  private readonly companies = [
    'acme-corp', 'global-solutions', 'tech-innovations', 'business-systems',
    'enterprise-group', 'professional-services', 'consulting-partners',
    'strategic-advisors', 'corporate-solutions', 'industry-leaders'
  ];
  
  private readonly documentTypes = [
    'annual-report', 'quarterly-review', 'policy-update', 'training-manual',
    'compliance-guide', 'employee-handbook', 'financial-statement',
    'project-proposal', 'contract-agreement', 'certification'
  ];
  
  private readonly fileFormats = [
    'pdf', 'docx', 'xlsx' // Only safe extensions
  ];
  
  private readonly governmentAgencies = [
    'IRS', 'SSA', 'DHS', 'DOE', 'EPA', 'FDA', 'OSHA', 'DOL', 'HUD', 'VA'
  ];
  
  private readonly states = [
    'CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH', 'GA', 'NC', 'MI',
    'NJ', 'VA', 'WA', 'AZ', 'MA', 'TN', 'IN', 'MO', 'MD', 'WI'
  ];
  
  private readonly courseCodes = [
    'BUS101', 'FIN201', 'MKT301', 'MGT401', 'ACC101', 'ECO201',
    'CS101', 'ENG101', 'MAT201', 'SCI101', 'HIS201', 'PSY101'
  ];

  public static getInstance(): IntelligentParameterGenerator {
    if (!IntelligentParameterGenerator.instance) {
      IntelligentParameterGenerator.instance = new IntelligentParameterGenerator();
    }
    return IntelligentParameterGenerator.instance;
  }

  /**
   * Generate parameter value based on key and context
   */
  public generateParameter(key: string, context: ParameterContext): string {
    const keyLower = key.toLowerCase();
    const now = new Date();
    
    // Time-based parameters
    if (keyLower.includes('year')) {
      return this.generateYear(context);
    }
    if (keyLower.includes('quarter')) {
      return this.generateQuarter();
    }
    if (keyLower.includes('month')) {
      return this.generateMonth();
    }
    if (keyLower.includes('date') || keyLower.includes('day')) {
      return this.generateDate();
    }
    if (keyLower.includes('semester')) {
      return this.generateSemester();
    }
    
    // Business context parameters
    if (keyLower.includes('department') || keyLower.includes('dept')) {
      return this.randomChoice(this.departments);
    }
    if (keyLower.includes('company') || keyLower.includes('organization')) {
      return this.randomChoice(this.companies);
    }
    if (keyLower.includes('filename') || keyLower.includes('document')) {
      return this.generateDocumentName(context);
    }
    if (keyLower.includes('folder')) {
      return this.generateFolderName(context);
    }
    
    // Government-specific parameters
    if (keyLower.includes('agency')) {
      return this.randomChoice(this.governmentAgencies);
    }
    if (keyLower.includes('state')) {
      return this.randomChoice(this.states);
    }
    if (keyLower.includes('form_number') || keyLower.includes('form_id')) {
      return this.generateFormNumber();
    }
    
    // Education-specific parameters
    if (keyLower.includes('course')) {
      return this.randomChoice(this.courseCodes);
    }
    if (keyLower.includes('student')) {
      return this.generateStudentId();
    }
    if (keyLower.includes('instructor')) {
      return this.generateInstructorName();
    }
    
    // ID and tracking parameters (business-like)
    if (keyLower.includes('id') && !keyLower.includes('student')) {
      return this.generateBusinessId(keyLower);
    }
    if (keyLower.includes('number') || keyLower.includes('num')) {
      return this.generateBusinessNumber(keyLower);
    }
    
    // Version and status parameters
    if (keyLower.includes('version')) {
      return this.generateVersion();
    }
    if (keyLower.includes('status')) {
      return this.generateStatus(context);
    }
    if (keyLower.includes('level')) {
      return this.generateLevel();
    }
    
    // Access and security parameters (business-like)
    if (keyLower.includes('token') || keyLower.includes('access')) {
      return this.generateAccessToken();
    }
    if (keyLower.includes('canary')) {
      return this.generateCanaryToken();
    }
    if (keyLower.includes('share')) {
      return this.generateShareId();
    }
    
    // Language and region
    if (keyLower.includes('lang') || keyLower.includes('language')) {
      return 'en';
    }
    if (keyLower.includes('region')) {
      return 'us';
    }
    
    // Default fallback - generate based on key characteristics
    return this.generateFallbackValue(key);
  }

  private generateYear(context: ParameterContext): string {
    const currentYear = new Date().getFullYear();
    // Prefer current year, but sometimes use previous year for historical documents
    return Math.random() < 0.8 ? currentYear.toString() : (currentYear - 1).toString();
  }

  private generateQuarter(): string {
    return `Q${Math.ceil(Math.random() * 4)}`;
  }

  private generateMonth(): string {
    return (Math.floor(Math.random() * 12) + 1).toString().padStart(2, '0');
  }

  private generateDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  private generateSemester(): string {
    const semesters = ['spring', 'summer', 'fall', 'winter'];
    const year = new Date().getFullYear();
    return `${this.randomChoice(semesters)}-${year}`;
  }

  private generateDocumentName(context: ParameterContext): string {
    const docType = this.randomChoice(this.documentTypes);
    const year = new Date().getFullYear();
    return `${docType}-${year}`;
  }

  private generateFolderName(context: ParameterContext): string {
    if (context.category === 'government') {
      return this.randomChoice(['forms', 'applications', 'notices', 'documents']);
    }
    if (context.category === 'education') {
      return this.randomChoice(['materials', 'assignments', 'resources', 'handouts']);
    }
    return this.randomChoice(['documents', 'reports', 'files', 'resources']);
  }

  private generateFormNumber(): string {
    // Generate realistic government form numbers
    const prefixes = ['1040', '941', 'W-2', 'W-4', '1099', 'SS-4', 'I-9'];
    return this.randomChoice(prefixes);
  }

  private generateStudentId(): string {
    return 'STU' + Math.floor(Math.random() * 900000 + 100000).toString();
  }

  private generateInstructorName(): string {
    const names = ['smith', 'johnson', 'williams', 'brown', 'jones', 'garcia', 'miller', 'davis'];
    return this.randomChoice(names);
  }

  private generateBusinessId(keyType: string): string {
    if (keyType.includes('employee')) {
      return 'EMP' + Math.floor(Math.random() * 90000 + 10000).toString();
    }
    if (keyType.includes('customer')) {
      return 'CUST' + Math.floor(Math.random() * 900000 + 100000).toString();
    }
    if (keyType.includes('invoice')) {
      return 'INV' + Math.floor(Math.random() * 90000 + 10000).toString();
    }
    if (keyType.includes('contract')) {
      return 'CTR' + Math.floor(Math.random() * 90000 + 10000).toString();
    }
    // Generic business ID
    return 'BIZ' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  private generateBusinessNumber(keyType: string): string {
    if (keyType.includes('invoice')) {
      return Math.floor(Math.random() * 900000 + 100000).toString();
    }
    if (keyType.includes('order')) {
      return 'ORD' + Math.floor(Math.random() * 90000 + 10000).toString();
    }
    if (keyType.includes('case')) {
      return Math.floor(Math.random() * 9000000 + 1000000).toString();
    }
    return Math.floor(Math.random() * 90000 + 10000).toString();
  }

  private generateVersion(): string {
    const major = Math.floor(Math.random() * 5) + 1;
    const minor = Math.floor(Math.random() * 10);
    return `${major}.${minor}`;
  }

  private generateStatus(context: ParameterContext): string {
    if (context.category === 'government') {
      return this.randomChoice(['pending', 'approved', 'processing', 'completed']);
    }
    if (context.category === 'business') {
      return this.randomChoice(['active', 'pending', 'approved', 'final']);
    }
    return this.randomChoice(['active', 'pending', 'completed']);
  }

  private generateLevel(): string {
    return this.randomChoice(['basic', 'standard', 'premium', 'enterprise']);
  }

  private generateAccessToken(): string {
    // Generate business-like access token (not suspicious)
    return 'AT' + Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  private generateCanaryToken(): string {
    // Microsoft-style canary token
    return Math.random().toString(36).substring(2, 16).toUpperCase();
  }

  private generateShareId(): string {
    // OneDrive-style share ID
    return 'w' + Math.random().toString(36).substring(2, 12).toUpperCase();
  }

  private generateFallbackValue(key: string): string {
    // Generate safe fallback based on key characteristics
    if (key.length <= 3) {
      return Math.random().toString(36).substring(2, 5);
    }
    return 'VAL' + Math.random().toString(36).substring(2, 6).toUpperCase();
  }

  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generate all parameters for a pattern template
   */
  public generateAllParameters(template: string, context: ParameterContext): Record<string, string> {
    const params: Record<string, string> = {};
    
    // Extract all placeholders from template
    const placeholders = template.match(/\{([^}]+)\}/g) || [];
    
    placeholders.forEach(placeholder => {
      const key = placeholder.slice(1, -1); // Remove { and }
      
      // Skip 'encrypted' as it's handled separately
      if (key === 'encrypted') {
        return;
      }
      
      params[key] = this.generateParameter(key, context);
    });
    
    return params;
  }
}
