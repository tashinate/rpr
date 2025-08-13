/**
 * PATTERN TESTING SYSTEM
 * 
 * Comprehensive testing for URL patterns to ensure:
 * 1. No undefined/null values in generated URLs
 * 2. All placeholders properly replaced
 * 3. URLs look legitimate and inbox-safe
 * 4. Pattern diversity and rotation works correctly
 */

import { InboxSafePatternManager } from './inboxSafePatternManager';
import { allInboxSafePatterns, InboxSafePattern } from './inboxSafePatterns';
import { IntelligentParameterGenerator } from './intelligentParameterGenerator';

export interface TestResult {
  patternId: string;
  patternName: string;
  success: boolean;
  generatedUrl: string;
  issues: string[];
  trustScore: number;
  inboxRate: number;
  parameters: Record<string, string>;
}

export interface TestSummary {
  totalPatterns: number;
  successfulPatterns: number;
  failedPatterns: number;
  successRate: number;
  commonIssues: string[];
  averageTrustScore: number;
  averageInboxRate: number;
  results: TestResult[];
}

export class PatternTester {
  private patternManager: InboxSafePatternManager;
  private parameterGenerator: IntelligentParameterGenerator;

  constructor() {
    this.patternManager = InboxSafePatternManager.getInstance();
    this.parameterGenerator = IntelligentParameterGenerator.getInstance();
  }

  /**
   * Test all inbox-safe patterns
   */
  public async testAllPatterns(): Promise<TestSummary> {
    console.log('[PatternTester] Starting comprehensive pattern testing...');
    
    const results: TestResult[] = [];
    
    for (const pattern of allInboxSafePatterns) {
      const result = await this.testSinglePattern(pattern);
      results.push(result);
    }
    
    return this.generateSummary(results);
  }

  /**
   * Test patterns by category
   */
  public async testPatternsByCategory(category: string): Promise<TestSummary> {
    console.log(`[PatternTester] Testing patterns for category: ${category}`);
    
    const categoryPatterns = allInboxSafePatterns.filter(p => p.category === category);
    const results: TestResult[] = [];
    
    for (const pattern of categoryPatterns) {
      const result = await this.testSinglePattern(pattern);
      results.push(result);
    }
    
    return this.generateSummary(results);
  }

  /**
   * Test pattern diversity (ensure no duplicate URLs)
   */
  public async testPatternDiversity(iterations: number = 50): Promise<{
    uniqueUrls: number;
    totalGenerated: number;
    diversityScore: number;
    duplicates: string[];
  }> {
    console.log(`[PatternTester] Testing pattern diversity with ${iterations} iterations...`);
    
    const generatedUrls = new Set<string>();
    const duplicates: string[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const pattern = this.patternManager.selectOptimalPattern({
        minTrustScore: 90,
        avoidSuspiciousPatterns: true
      });
      
      if (pattern) {
        const testEncrypted = 'TEST' + Math.random().toString(36).substring(2, 20).toUpperCase();
        const result = this.patternManager.generateCompleteUrl(pattern, testEncrypted, {
          category: pattern.category,
          industry: 'technology'
        });
        
        if (generatedUrls.has(result.finalUrl)) {
          duplicates.push(result.finalUrl);
        } else {
          generatedUrls.add(result.finalUrl);
        }
      }
    }
    
    const diversityScore = (generatedUrls.size / iterations) * 100;
    
    return {
      uniqueUrls: generatedUrls.size,
      totalGenerated: iterations,
      diversityScore,
      duplicates
    };
  }

  /**
   * Test single pattern for issues
   */
  private async testSinglePattern(pattern: InboxSafePattern): Promise<TestResult> {
    const issues: string[] = [];
    let generatedUrl = '';
    let parameters: Record<string, string> = {};
    
    try {
      // Generate test encrypted data
      const testEncrypted = 'TEST' + Math.random().toString(36).substring(2, 20).toUpperCase();
      
      // Generate URL using the pattern
      const result = this.patternManager.generateCompleteUrl(pattern, testEncrypted, {
        category: pattern.category,
        industry: 'technology',
        targetProvider: 'microsoft'
      });
      
      generatedUrl = result.finalUrl;
      parameters = result.parameters;
      
      // Test for common issues
      this.checkForUndefinedValues(generatedUrl, issues);
      this.checkForUnreplacedPlaceholders(generatedUrl, issues);
      this.checkForSuspiciousPatterns(generatedUrl, issues);
      this.checkUrlStructure(generatedUrl, issues);
      this.checkParameterQuality(parameters, issues);
      this.checkFileExtensionSafety(generatedUrl, issues);
      
    } catch (error) {
      issues.push(`Generation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return {
      patternId: pattern.id,
      patternName: pattern.name,
      success: issues.length === 0,
      generatedUrl,
      issues,
      trustScore: pattern.trustScore,
      inboxRate: pattern.inboxRate,
      parameters
    };
  }

  /**
   * Check for undefined/null values in URL
   */
  private checkForUndefinedValues(url: string, issues: string[]): void {
    if (url.includes('undefined')) {
      issues.push('URL contains "undefined" string');
    }
    if (url.includes('null')) {
      issues.push('URL contains "null" string');
    }
    if (url.includes('NaN')) {
      issues.push('URL contains "NaN" string');
    }
  }

  /**
   * Check for unreplaced placeholders
   */
  private checkForUnreplacedPlaceholders(url: string, issues: string[]): void {
    const placeholders = url.match(/\{[^}]+\}/g);
    if (placeholders && placeholders.length > 0) {
      issues.push(`Unreplaced placeholders found: ${placeholders.join(', ')}`);
    }
  }

  /**
   * Check for suspicious patterns that might trigger email filters
   */
  private checkForSuspiciousPatterns(url: string, issues: string[]): void {
    const suspiciousKeywords = [
      'track', 'click', 'redirect', 'proxy', 'gateway', 'api/v',
      'service', 'portal', 'encrypted', 'decode', 'base64'
    ];
    
    const urlLower = url.toLowerCase();
    suspiciousKeywords.forEach(keyword => {
      if (urlLower.includes(keyword)) {
        issues.push(`Suspicious keyword found: "${keyword}"`);
      }
    });
  }

  /**
   * Check URL structure for legitimacy
   */
  private checkUrlStructure(url: string, issues: string[]): void {
    // Check if URL starts with /
    if (!url.startsWith('/')) {
      issues.push('URL should start with /');
    }
    
    // Check URL length (too long might be suspicious)
    if (url.length > 200) {
      issues.push(`URL too long: ${url.length} characters`);
    }
    
    // Check for proper parameter structure
    if (url.includes('?') && !url.match(/\?[\w=&%]+$/)) {
      issues.push('Invalid parameter structure');
    }
  }

  /**
   * Check parameter quality
   */
  private checkParameterQuality(parameters: Record<string, string>, issues: string[]): void {
    Object.entries(parameters).forEach(([key, value]) => {
      if (!value || value === 'undefined' || value === 'null') {
        issues.push(`Invalid parameter value for ${key}: ${value}`);
      }
      
      if (value.length < 2) {
        issues.push(`Parameter value too short for ${key}: ${value}`);
      }
      
      // Check for realistic parameter names
      if (key.toLowerCase().includes('encrypted') || key.toLowerCase().includes('data')) {
        issues.push(`Suspicious parameter name: ${key}`);
      }
    });
  }

  /**
   * Check file extension safety
   */
  private checkFileExtensionSafety(url: string, issues: string[]): void {
    const unsafeExtensions = ['.exe', '.zip', '.rar', '.bat', '.cmd', '.scr', '.pif'];
    const suspiciousExtensions = ['.pptx']; // PowerPoint is risky for email
    
    unsafeExtensions.forEach(ext => {
      if (url.toLowerCase().includes(ext)) {
        issues.push(`Unsafe file extension: ${ext}`);
      }
    });
    
    suspiciousExtensions.forEach(ext => {
      if (url.toLowerCase().includes(ext)) {
        issues.push(`Suspicious file extension for email: ${ext}`);
      }
    });
  }

  /**
   * Generate test summary
   */
  private generateSummary(results: TestResult[]): TestSummary {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    // Collect common issues
    const allIssues = failed.flatMap(r => r.issues);
    const issueCount = allIssues.reduce((acc, issue) => {
      acc[issue] = (acc[issue] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const commonIssues = Object.entries(issueCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([issue]) => issue);
    
    const averageTrustScore = results.reduce((sum, r) => sum + r.trustScore, 0) / results.length;
    const averageInboxRate = results.reduce((sum, r) => sum + r.inboxRate, 0) / results.length;
    
    return {
      totalPatterns: results.length,
      successfulPatterns: successful.length,
      failedPatterns: failed.length,
      successRate: (successful.length / results.length) * 100,
      commonIssues,
      averageTrustScore,
      averageInboxRate,
      results
    };
  }

  /**
   * Generate test report
   */
  public generateTestReport(summary: TestSummary): string {
    const report = [
      '=== PATTERN TESTING REPORT ===',
      '',
      `Total Patterns Tested: ${summary.totalPatterns}`,
      `Successful: ${summary.successfulPatterns}`,
      `Failed: ${summary.failedPatterns}`,
      `Success Rate: ${summary.successRate.toFixed(1)}%`,
      `Average Trust Score: ${summary.averageTrustScore.toFixed(1)}`,
      `Average Inbox Rate: ${summary.averageInboxRate.toFixed(1)}%`,
      '',
      'Common Issues:',
      ...summary.commonIssues.map(issue => `  - ${issue}`),
      '',
      'Failed Patterns:',
      ...summary.results
        .filter(r => !r.success)
        .map(r => `  - ${r.patternName}: ${r.issues.join(', ')}`),
      ''
    ];
    
    return report.join('\n');
  }
}
