/**
 * Comprehensive Placeholder Validation System
 * Tests all placeholders to ensure 100% replacement success
 */

export interface PlaceholderTest {
  template: string;
  expectedPlaceholders: string[];
  category: string;
  tier: number;
}

export interface ValidationResult {
  template: string;
  success: boolean;
  unreplacedPlaceholders: string[];
  generatedUrl: string;
  errors: string[];
}

export class PlaceholderValidator {
  
  /**
   * Comprehensive test templates covering all known placeholders
   */
  private testTemplates: PlaceholderTest[] = [
    // Microsoft-specific patterns
    {
      template: '/sharepoint/sites/{site}/documents/{year}/{month}/{document}.pdf?id={encrypted}&session={session}',
      expectedPlaceholders: ['site', 'year', 'month', 'document', 'encrypted', 'session'],
      category: 'microsoft',
      tier: 1
    },
    {
      template: '/teams/channels/{channel}/files/{filename}?version={version}&data={encrypted}',
      expectedPlaceholders: ['channel', 'filename', 'version', 'encrypted'],
      category: 'microsoft',
      tier: 1
    },
    {
      template: '/onedrive/personal/{user}/Documents/{folder}/{file}?download=1&token={encrypted}',
      expectedPlaceholders: ['user', 'folder', 'file', 'encrypted'],
      category: 'microsoft',
      tier: 1
    },
    
    // Business patterns
    {
      template: '/api/v{version}/users/{userid}/profile?token={encrypted}&app={appid}',
      expectedPlaceholders: ['version', 'userid', 'encrypted', 'appid'],
      category: 'business',
      tier: 1
    },
    {
      template: '/corporate/reports/{year}-{quarter}.pdf?dept={department}&doc={encrypted}',
      expectedPlaceholders: ['year', 'quarter', 'department', 'encrypted'],
      category: 'business',
      tier: 1
    },
    
    // E-commerce patterns
    {
      template: '/orders/{orderid}/invoice.pdf?customer={customerid}&data={encrypted}',
      expectedPlaceholders: ['orderid', 'customerid', 'encrypted'],
      category: 'ecommerce',
      tier: 1
    },
    {
      template: '/products/{productid}/details?variant={variant}&tracking={encrypted}',
      expectedPlaceholders: ['productid', 'variant', 'encrypted'],
      category: 'ecommerce',
      tier: 1
    },
    
    // Government patterns
    {
      template: '/gov/services/{agency}/forms/{formid}?permit={permitid}&data={encrypted}',
      expectedPlaceholders: ['agency', 'formid', 'permitid', 'encrypted'],
      category: 'government',
      tier: 1
    },
    {
      template: '/public/notices/{noticeid}?type={type}&code={code}&content={encrypted}',
      expectedPlaceholders: ['noticeid', 'type', 'code', 'encrypted'],
      category: 'government',
      tier: 1
    },
    
    // Healthcare patterns
    {
      template: '/patient/portal/{patientid}/records?visit={visitid}&doc={encrypted}',
      expectedPlaceholders: ['patientid', 'visitid', 'encrypted'],
      category: 'medical',
      tier: 1
    },
    {
      template: '/medical/reports/{facility}/{year}/{month}?case={caseid}&data={encrypted}',
      expectedPlaceholders: ['facility', 'year', 'month', 'caseid', 'encrypted'],
      category: 'medical',
      tier: 1
    },
    
    // Education patterns
    {
      template: '/student/portal/{studentid}/courses/{courseid}?semester={semester}&content={encrypted}',
      expectedPlaceholders: ['studentid', 'courseid', 'semester', 'encrypted'],
      category: 'education',
      tier: 1
    },
    {
      template: '/academic/resources/{year}/{quarter}/syllabus.pdf?course={course}&data={encrypted}',
      expectedPlaceholders: ['year', 'quarter', 'course', 'encrypted'],
      category: 'education',
      tier: 1
    },
    
    // Technology patterns
    {
      template: '/api/v{apiversion}/docs/{endpoint}?key={apikey}&format={format}&data={encrypted}',
      expectedPlaceholders: ['apiversion', 'endpoint', 'apikey', 'format', 'encrypted'],
      category: 'technology',
      tier: 1
    },
    {
      template: '/downloads/software/{appid}/{version}?platform={platform}&license={encrypted}',
      expectedPlaceholders: ['appid', 'version', 'platform', 'encrypted'],
      category: 'technology',
      tier: 1
    },
    
    // Financial patterns
    {
      template: '/banking/statements/{accountid}/{year}/{month}.pdf?type={type}&secure={encrypted}',
      expectedPlaceholders: ['accountid', 'year', 'month', 'type', 'encrypted'],
      category: 'finance',
      tier: 1
    },
    {
      template: '/investment/portfolio/{portfolioid}/report?period={period}&data={encrypted}',
      expectedPlaceholders: ['portfolioid', 'period', 'encrypted'],
      category: 'finance',
      tier: 1
    },
    
    // Complex multi-placeholder patterns
    {
      template: '/complex/{category}/{subcategory}/{id}?param1={value1}&param2={value2}&param3={value3}&data={encrypted}&session={session}&timestamp={timestamp}',
      expectedPlaceholders: ['category', 'subcategory', 'id', 'value1', 'value2', 'value3', 'encrypted', 'session', 'timestamp'],
      category: 'complex',
      tier: 2
    }
  ];

  /**
   * Extract all placeholders from a template
   */
  private extractPlaceholders(template: string): string[] {
    const matches = template.match(/\{([^}]+)\}/g);
    return matches ? matches.map(match => match.slice(1, -1)) : [];
  }

  /**
   * Test a single template for placeholder replacement
   */
  async testTemplate(test: PlaceholderTest): Promise<ValidationResult> {
    const { template, expectedPlaceholders, category, tier } = test;
    
    try {
      // Import the pattern manager to test actual placeholder generation
      const { hybridPatternManager } = await import('../hybridPatternManager');
      
      // Create a mock pattern object
      const mockPattern = {
        id: 'test-pattern',
        pattern_name: `Test Pattern - ${category}`,
        category,
        tier,
        template,
        success_rate: 95,
        usage_limits: { maxUses: 1000, currentUses: 0 }
      };
      
      // Generate dynamic parameters (simplified for testing)
      const dynamicParams = {
        encrypted: 'test_encrypted_value',
        session: 'test_session_123',
        ref: 'test_ref_456',
        facility: 'test_facility',
        year: '2024',
        phase: 'test_phase'
      };
      
      // Test placeholder replacement
      let processedUrl = template;
      const unreplacedPlaceholders: string[] = [];
      
      // Apply parameter replacements
      Object.entries(dynamicParams).forEach(([key, value]) => {
        const placeholder = `{${key}}`;
        if (processedUrl.includes(placeholder)) {
          processedUrl = processedUrl.replace(new RegExp(`\\${placeholder}`, 'g'), value as string);
        }
      });
      
      // Check for any remaining placeholders
      const remainingPlaceholders = this.extractPlaceholders(processedUrl);
      
      return {
        template,
        success: remainingPlaceholders.length === 0,
        unreplacedPlaceholders: remainingPlaceholders,
        generatedUrl: processedUrl,
        errors: remainingPlaceholders.length > 0 ? [`Unreplaced placeholders: ${remainingPlaceholders.join(', ')}`] : []
      };
      
    } catch (error) {
      return {
        template,
        success: false,
        unreplacedPlaceholders: expectedPlaceholders,
        generatedUrl: template,
        errors: [`Error during testing: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Run comprehensive validation of all test templates
   */
  async validateAllPlaceholders(): Promise<{
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: ValidationResult[];
    summary: string;
  }> {
    console.log('🧪 Starting comprehensive placeholder validation...');
    
    const results: ValidationResult[] = [];
    
    for (const test of this.testTemplates) {
      console.log(`Testing template: ${test.template}`);
      const result = await this.testTemplate(test);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ PASS: ${test.template}`);
      } else {
        console.log(`❌ FAIL: ${test.template}`);
        console.log(`   Unreplaced: ${result.unreplacedPlaceholders.join(', ')}`);
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    }
    
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    const summary = `
📊 PLACEHOLDER VALIDATION SUMMARY:
- Total Tests: ${this.testTemplates.length}
- Passed: ${passedTests} (${Math.round(passedTests / this.testTemplates.length * 100)}%)
- Failed: ${failedTests} (${Math.round(failedTests / this.testTemplates.length * 100)}%)
- Success Rate: ${passedTests === this.testTemplates.length ? '100% ✅' : `${Math.round(passedTests / this.testTemplates.length * 100)}% ⚠️`}
    `;
    
    console.log(summary);
    
    return {
      totalTests: this.testTemplates.length,
      passedTests,
      failedTests,
      results,
      summary
    };
  }

  /**
   * Test specific placeholder types
   */
  async testPlaceholderType(type: 'microsoft' | 'business' | 'ecommerce' | 'government' | 'medical' | 'education' | 'technology' | 'finance' | 'complex'): Promise<ValidationResult[]> {
    const filteredTests = this.testTemplates.filter(test => test.category === type);
    const results: ValidationResult[] = [];
    
    for (const test of filteredTests) {
      const result = await this.testTemplate(test);
      results.push(result);
    }
    
    return results;
  }
}

export const placeholderValidator = new PlaceholderValidator();
