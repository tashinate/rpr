import { validateRedirectUrl, getRotatedUrlByIP } from '../validation/urlValidator';
import { centralizedUrlProcessor } from './centralizedUrlProcessor';
// Circuit breaker removed - ZeroBot API is stable
import { RetryManager } from '../retryManager';

export interface ProcessedUrl {
  originalUrl: string;
  decodedUrl: string;
  finalUrl: string;
  isValid: boolean;
  encryptionMode: 'aes' | 'xor' | 'unknown';
  securityLevel: number;
  processingSteps: string[];
}

export interface UrlProcessorError {
  code: string;
  message: string;
  originalUrl?: string;
  step?: string;
}

export class EnhancedUrlProcessor {
  private retryManager: RetryManager;

  constructor() {
    this.retryManager = new RetryManager({
      maxRetries: 2,
      baseDelay: 500
    });
  }

  async processUrl(encodedUrl: string, clientIp?: string, licenseKey?: string): Promise<ProcessedUrl> {
    const steps: string[] = [];

    try {
      steps.push('Using centralized URL processor');
      
      // Use centralized processor
      const result = await this.retryManager.execute(
        () => centralizedUrlProcessor.processUrl(encodedUrl, licenseKey),
        (error) => !error.message.includes('INVALID_FORMAT')
      );
      
      if (!result.success) {
        throw this.createError('PROCESSING_FAILED', result.error || 'Processing failed', encodedUrl, 'centralized-processor');
      }

      steps.push(`Decoded with ${result.method}: ${result.originalUrl}`);

      // Validate URL
      steps.push('URL security validation');
      const isValid = validateRedirectUrl(result.originalUrl);
      if (!isValid) {
        throw this.createError('INVALID_URL', 'URL failed security validation', result.originalUrl, 'validation');
      }
      steps.push('URL validation passed');

      // Apply IP rotation if available
      let finalUrl = result.originalUrl;
      if (clientIp) {
        steps.push('Applying IP-based rotation');
        finalUrl = getRotatedUrlByIP(result.originalUrl, clientIp);
        steps.push(`Final URL: ${finalUrl}`);
      }

      return {
        originalUrl: encodedUrl,
        decodedUrl: result.originalUrl,
        finalUrl,
        isValid: true,
        encryptionMode: result.method === 'aes' ? 'aes' : 'xor',
        securityLevel: result.method === 'aes' ? 8 : result.method === 'registry' ? 9 : 5,
        processingSteps: steps
      };

    } catch (error) {
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      throw this.createError(
        'PROCESSING_FAILED', 
        `URL processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        encodedUrl,
        steps[steps.length - 1]
      );
    }
  }

  private createError(code: string, message: string, url?: string, step?: string): UrlProcessorError {
    const error = Object.assign(new Error(message), {
      code,
      originalUrl: url,
      step
    }) as UrlProcessorError;
    return error;
  }

  // Get processor statistics (circuit breaker removed)
  getProcessorStats(): {
    encryptionModeStats: { aes: number; xor: number; unknown: number };
    securityLevelDistribution: Record<string, number>;
  } {
    return {
      encryptionModeStats: { aes: 0, xor: 0, unknown: 0 }, // Would be tracked in real implementation
      securityLevelDistribution: {} // Would be tracked in real implementation
    };
  }

  // Cleanup resources
  cleanup() {
    // Cleanup handled by enhanced encryption service
  }
}
