export interface EnhancedError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'validation' | 'encryption' | 'network' | 'database' | 'auth' | 'pattern' | 'generation';
  context?: any;
  timestamp: Date;
  retryable: boolean;
  userMessage: string;
}

export class EnhancedErrorHandler {
  private errorHistory: EnhancedError[] = [];
  private readonly maxHistorySize = 100;

  // Create standardized error with proper categorization
  createError(
    code: string,
    message: string,
    category: EnhancedError['category'],
    severity: EnhancedError['severity'] = 'medium',
    context?: any,
    retryable = false
  ): EnhancedError {
    const error: EnhancedError = {
      code,
      message,
      severity,
      category,
      context,
      timestamp: new Date(),
      retryable,
      userMessage: this.generateUserMessage(code, category, severity)
    };

    this.logError(error);
    return error;
  }

  // Generate user-friendly error messages
  private generateUserMessage(code: string, category: string, severity: string): string {
    const messageMap: Record<string, string> = {
      'INVALID_URL': 'Please check that your URL is valid and properly formatted',
      'ENCRYPTION_FAILED': 'Unable to secure your URL. Please try again',
      'PATTERN_NOT_FOUND': 'Selected pattern is unavailable. Try choosing a different one',
      'RATE_LIMIT_EXCEEDED': 'Too many requests. Please wait a moment before trying again',
      'SESSION_EXPIRED': 'Your session has expired. Please log in again',
      'DATABASE_ERROR': 'Service temporarily unavailable. Please try again',
      'NETWORK_ERROR': 'Connection issue. Please check your internet and retry',
      'VALIDATION_ERROR': 'Please check your input and try again',
      'HASH_COLLISION': 'URL generation conflict detected. Retrying automatically',
      'INSUFFICIENT_PERMISSIONS': 'Your license doesn\'t allow this operation',
      'PATTERN_LIMIT_EXCEEDED': 'Pattern usage limit reached. Try a different pattern'
    };

    return messageMap[code] || 'An unexpected error occurred. Please try again';
  }

  // Handle URL generation errors with automatic retry logic
  async handleUrlGenerationError(
    error: any,
    context: {
      targetUrl: string;
      licenseKeyId: string;
      pattern?: string;
      attempt?: number;
    }
  ): Promise<{ shouldRetry: boolean; retryDelay: number; fallbackAction?: string }> {
    const enhancedError = this.categorizeError(error, context);
    
    switch (enhancedError.category) {
      case 'network':
        return {
          shouldRetry: context.attempt ? context.attempt < 3 : true,
          retryDelay: Math.min(1000 * Math.pow(2, context.attempt || 0), 5000),
          fallbackAction: 'use_cache'
        };
        
      case 'database':
        return {
          shouldRetry: true,
          retryDelay: 2000,
          fallbackAction: 'local_generation'
        };
        
      case 'encryption':
        return {
          shouldRetry: true,
          retryDelay: 500,
          fallbackAction: 'fallback_encryption'
        };
        
      case 'pattern':
        return {
          shouldRetry: false,
          retryDelay: 0,
          fallbackAction: 'default_pattern'
        };
        
      case 'validation':
        return {
          shouldRetry: false,
          retryDelay: 0,
          fallbackAction: 'user_correction'
        };
        
      case 'auth':
        return {
          shouldRetry: false,
          retryDelay: 0,
          fallbackAction: 'reauth_required'
        };
        
      default:
        return {
          shouldRetry: context.attempt ? context.attempt < 2 : true,
          retryDelay: 1000,
          fallbackAction: 'simple_generation'
        };
    }
  }

  // Categorize errors for better handling
  private categorizeError(error: any, context: any): EnhancedError {
    const errorString = error.message || error.toString();
    
    // Network errors
    if (errorString.includes('fetch') || errorString.includes('network') || errorString.includes('connection')) {
      return this.createError('NETWORK_ERROR', errorString, 'network', 'medium', context, true);
    }
    
    // Database errors
    if (errorString.includes('database') || errorString.includes('supabase') || errorString.includes('rpc')) {
      return this.createError('DATABASE_ERROR', errorString, 'database', 'high', context, true);
    }
    
    // Encryption errors
    if (errorString.includes('encrypt') || errorString.includes('decrypt') || errorString.includes('aes') || errorString.includes('xor')) {
      return this.createError('ENCRYPTION_FAILED', errorString, 'encryption', 'high', context, true);
    }
    
    // Pattern errors
    if (errorString.includes('pattern') || errorString.includes('template')) {
      return this.createError('PATTERN_NOT_FOUND', errorString, 'pattern', 'medium', context, false);
    }
    
    // Validation errors
    if (errorString.includes('invalid') || errorString.includes('validation') || errorString.includes('format')) {
      return this.createError('VALIDATION_ERROR', errorString, 'validation', 'low', context, false);
    }
    
    // Auth errors
    if (errorString.includes('session') || errorString.includes('auth') || errorString.includes('license')) {
      return this.createError('SESSION_EXPIRED', errorString, 'auth', 'high', context, false);
    }
    
    // Rate limiting
    if (errorString.includes('rate limit') || errorString.includes('too many')) {
      return this.createError('RATE_LIMIT_EXCEEDED', errorString, 'network', 'medium', context, true);
    }
    
    // Generic error
    return this.createError('UNKNOWN_ERROR', errorString, 'generation', 'medium', context, true);
  }

  // Log error for analytics and debugging
  private logError(error: EnhancedError): void {
    console.error(`[ErrorHandler] ${error.category.toUpperCase()}: ${error.code}`, {
      message: error.message,
      severity: error.severity,
      context: error.context,
      timestamp: error.timestamp,
      retryable: error.retryable
    });
    
    // Add to history (with size limit)
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  // Get error statistics for monitoring
  getErrorStats() {
    const now = Date.now();
    const last24Hours = this.errorHistory.filter(e => 
      now - e.timestamp.getTime() < 24 * 60 * 60 * 1000
    );
    
    const categories = last24Hours.reduce((acc, error) => {
      acc[error.category] = (acc[error.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const severities = last24Hours.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors24h: last24Hours.length,
      errorsByCategory: categories,
      errorsBySeverity: severities,
      mostCommonError: this.getMostCommonError(last24Hours),
      retryablePercentage: last24Hours.length > 0 ? 
        (last24Hours.filter(e => e.retryable).length / last24Hours.length * 100).toFixed(1) : '0.0'
    };
  }

  // Get most common error for monitoring
  private getMostCommonError(errors: EnhancedError[]): { code: string; count: number } | null {
    if (errors.length === 0) return null;
    
    const codeCounts = errors.reduce((acc, error) => {
      acc[error.code] = (acc[error.code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommon = Object.entries(codeCounts).reduce((max, [code, count]) => 
      count > max.count ? { code, count } : max, { code: '', count: 0 }
    );
    
    return mostCommon.count > 0 ? mostCommon : null;
  }

  // Clear error history (useful for testing)
  clearHistory(): void {
    this.errorHistory = [];
  }
}

export const enhancedErrorHandler = new EnhancedErrorHandler();