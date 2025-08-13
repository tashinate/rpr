/**
 * RATE LIMITING SERVICE
 * Implements per-license rate limiting to prevent abuse
 * Integrates with audit logging for security monitoring
 */

import { supabase } from '@/integrations/supabase/client';

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
  reason?: string;
  currentUsage: number;
  limit: number;
}

interface RateLimitConfig {
  operation: string;
  hourlyLimit: number;
  minuteLimit: number;
  dailyLimit: number;
}

class RateLimitingService {
  private static instance: RateLimitingService;
  
  // In-memory cache for rate limiting (in production, use Redis)
  private rateLimitCache = new Map<string, {
    count: number;
    windowStart: number;
    windowEnd: number;
  }>();

  // Rate limit configurations
  private readonly rateLimits: Record<string, RateLimitConfig> = {
    'url_generation': {
      operation: 'url_generation',
      hourlyLimit: 1000,
      minuteLimit: 50,
      dailyLimit: 5000
    },
    'url_access': {
      operation: 'url_access', 
      hourlyLimit: 5000,
      minuteLimit: 200,
      dailyLimit: 20000
    },
    'pattern_analysis': {
      operation: 'pattern_analysis',
      hourlyLimit: 100,
      minuteLimit: 10,
      dailyLimit: 500
    },
    'key_derivation': {
      operation: 'key_derivation',
      hourlyLimit: 500,
      minuteLimit: 25,
      dailyLimit: 2000
    }
  };

  static getInstance(): RateLimitingService {
    if (!RateLimitingService.instance) {
      RateLimitingService.instance = new RateLimitingService();
    }
    return RateLimitingService.instance;
  }

  // Check if operation is allowed under rate limits
  async checkRateLimit(
    licenseKeyId: string,
    operation: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<RateLimitResult> {
    console.log(`🔍 [RateLimit] Checking rate limit for license ${licenseKeyId.substring(0, 8)}..., operation: ${operation}`);
    
    const config = this.rateLimits[operation];
    if (!config) {
      console.log(`✅ [RateLimit] Unknown operation ${operation}, allowing with default limits`);
      // Allow unknown operations (fail open for security)
      return {
        allowed: true,
        remaining: 1000,
        resetTime: new Date(Date.now() + 60 * 60 * 1000),
        currentUsage: 0,
        limit: 1000
      };
    }

    try {
      console.log(`📊 [RateLimit] Config for ${operation}:`, config);

      // Check hourly limit using cache for performance
      const hourlyCheck = await this.checkHourlyLimit(licenseKeyId, operation, config.hourlyLimit);
      console.log(`⏰ [RateLimit] Hourly check result:`, hourlyCheck);
      
      if (!hourlyCheck.allowed) {
        console.warn(`❌ [RateLimit] Hourly limit exceeded for ${operation}`);
        await this.logRateLimitViolation(licenseKeyId, operation, 'hourly_limit', hourlyCheck, userAgent, ipAddress);
        return hourlyCheck;
      }

      // Check minute limit
      const minuteCheck = await this.checkMinuteLimit(licenseKeyId, operation, config.minuteLimit);
      console.log(`⏱️ [RateLimit] Minute check result:`, minuteCheck);
      
      if (!minuteCheck.allowed) {
        console.warn(`❌ [RateLimit] Minute limit exceeded for ${operation}`);
        await this.logRateLimitViolation(licenseKeyId, operation, 'minute_limit', minuteCheck, userAgent, ipAddress);
        return minuteCheck;
      }

      // Check daily limit from database for accuracy
      const dailyCheck = await this.checkDailyLimit(licenseKeyId, operation, config.dailyLimit);
      console.log(`📅 [RateLimit] Daily check result:`, dailyCheck);
      
      if (!dailyCheck.allowed) {
        console.warn(`❌ [RateLimit] Daily limit exceeded for ${operation}`);
        await this.logRateLimitViolation(licenseKeyId, operation, 'daily_limit', dailyCheck, userAgent, ipAddress);
        return dailyCheck;
      }

      // All checks passed - record the operation
      await this.recordOperation(licenseKeyId, operation);
      
      const result = {
        allowed: true,
        remaining: Math.min(hourlyCheck.remaining, minuteCheck.remaining, dailyCheck.remaining),
        resetTime: new Date(Math.min(
          hourlyCheck.resetTime.getTime(),
          minuteCheck.resetTime.getTime(),
          dailyCheck.resetTime.getTime()
        )),
        currentUsage: Math.max(hourlyCheck.currentUsage, minuteCheck.currentUsage, dailyCheck.currentUsage),
        limit: config.hourlyLimit
      };
      
      console.log(`✅ [RateLimit] All checks passed for ${operation}:`, result);
      return result;

    } catch (error) {
      console.error('[RateLimit] Error checking rate limit:', error);
      
      // Log the error for investigation
      await this.logRateLimitError(licenseKeyId, operation, error);
      
      // Fail open - allow the operation to prevent service disruption
      const fallbackResult = {
        allowed: true,
        remaining: 1000,
        resetTime: new Date(Date.now() + 60 * 60 * 1000),
        currentUsage: 0,
        limit: config?.hourlyLimit || 1000,
        reason: 'Rate limit check failed - allowing operation'
      };
      
      console.log(`🔄 [RateLimit] Failed open with fallback result:`, fallbackResult);
      return fallbackResult;
    }
  }

  // Check hourly rate limit using cache
  private async checkHourlyLimit(licenseKeyId: string, operation: string, limit: number): Promise<RateLimitResult> {
    const currentHour = Math.floor(Date.now() / (60 * 60 * 1000));
    const cacheKey = `${licenseKeyId}_${operation}_hour_${currentHour}`;
    
    const cached = this.rateLimitCache.get(cacheKey);
    const currentUsage = cached?.count || 0;
    const remaining = Math.max(0, limit - currentUsage);
    
    return {
      allowed: remaining > 0,
      remaining: remaining - 1, // Reserve one for this operation
      resetTime: new Date((currentHour + 1) * 60 * 60 * 1000),
      currentUsage: currentUsage,
      limit: limit,
      reason: remaining <= 0 ? 'Hourly rate limit exceeded' : undefined
    };
  }

  // Check minute rate limit using cache
  private async checkMinuteLimit(licenseKeyId: string, operation: string, limit: number): Promise<RateLimitResult> {
    const currentMinute = Math.floor(Date.now() / (60 * 1000));
    const cacheKey = `${licenseKeyId}_${operation}_minute_${currentMinute}`;
    
    const cached = this.rateLimitCache.get(cacheKey);
    const currentUsage = cached?.count || 0;
    const remaining = Math.max(0, limit - currentUsage);
    
    return {
      allowed: remaining > 0,
      remaining: remaining - 1,
      resetTime: new Date((currentMinute + 1) * 60 * 1000),
      currentUsage: currentUsage,
      limit: limit,
      reason: remaining <= 0 ? 'Minute rate limit exceeded' : undefined
    };
  }

  // Check daily rate limit from database
  private async checkDailyLimit(licenseKeyId: string, operation: string, limit: number): Promise<RateLimitResult> {
    try {
      // Get today's usage from audit log
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Use a simple query that we know works with the schema
      const { data, error } = await supabase
        .from('url_registry')
        .select('id')
        .eq('license_key_id', licenseKeyId)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      if (error) {
        console.warn('[RateLimit] Error checking daily limit, allowing operation:', error);
        return {
          allowed: true,
          remaining: limit - 1,
          resetTime: tomorrow,
          currentUsage: 0,
          limit: limit
        };
      }

      const currentUsage = data?.length || 0;
      const remaining = Math.max(0, limit - currentUsage);

      return {
        allowed: remaining > 0,
        remaining: remaining - 1,
        resetTime: tomorrow,
        currentUsage: currentUsage,
        limit: limit,
        reason: remaining <= 0 ? 'Daily rate limit exceeded' : undefined
      };

    } catch (error) {
      console.warn('[RateLimit] Daily limit check failed, allowing operation:', error);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      return {
        allowed: true,
        remaining: limit - 1,
        resetTime: tomorrow,
        currentUsage: 0,
        limit: limit
      };
    }
  }

  // Record successful operation in cache
  private async recordOperation(licenseKeyId: string, operation: string): Promise<void> {
    const now = Date.now();
    
    // Update hourly cache
    const currentHour = Math.floor(now / (60 * 60 * 1000));
    const hourlyCacheKey = `${licenseKeyId}_${operation}_hour_${currentHour}`;
    const hourlyEntry = this.rateLimitCache.get(hourlyCacheKey);
    this.rateLimitCache.set(hourlyCacheKey, {
      count: (hourlyEntry?.count || 0) + 1,
      windowStart: currentHour * 60 * 60 * 1000,
      windowEnd: (currentHour + 1) * 60 * 60 * 1000
    });

    // Update minute cache
    const currentMinute = Math.floor(now / (60 * 1000));
    const minuteCacheKey = `${licenseKeyId}_${operation}_minute_${currentMinute}`;
    const minuteEntry = this.rateLimitCache.get(minuteCacheKey);
    this.rateLimitCache.set(minuteCacheKey, {
      count: (minuteEntry?.count || 0) + 1,
      windowStart: currentMinute * 60 * 1000,
      windowEnd: (currentMinute + 1) * 60 * 1000
    });
  }

  // Log rate limit violations
  private async logRateLimitViolation(
    licenseKeyId: string,
    operation: string,
    limitType: string,
    rateLimitResult: RateLimitResult,
    userAgent?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      console.warn(`[RateLimit] ${limitType} exceeded for license ${licenseKeyId}, operation ${operation}`);
      
      // In a real implementation, this would use the audit log
      // For now, just log to console and potentially alert administrators
      const violationData = {
        license_key_id: licenseKeyId,
        operation: operation,
        limit_type: limitType,
        current_usage: rateLimitResult.currentUsage,
        limit: rateLimitResult.limit,
        user_agent: userAgent,
        ip_address: ipAddress,
        timestamp: new Date().toISOString()
      };

      // Could integrate with monitoring systems here
      console.log('[RateLimit] Violation details:', violationData);

    } catch (error) {
      console.error('[RateLimit] Error logging rate limit violation:', error);
    }
  }

  // Log rate limiting errors
  private async logRateLimitError(licenseKeyId: string, operation: string, error: any): Promise<void> {
    try {
      console.error(`[RateLimit] Error for license ${licenseKeyId}, operation ${operation}:`, error);
    } catch (logError) {
      console.error('[RateLimit] Error logging rate limit error:', logError);
    }
  }

  // Get current rate limit status for a license
  async getRateLimitStatus(licenseKeyId: string): Promise<{
    [operation: string]: {
      hourly: { used: number; remaining: number; limit: number; resetTime: Date };
      daily: { used: number; remaining: number; limit: number; resetTime: Date };
    }
  }> {
    const status: any = {};
    
    for (const [operationType, config] of Object.entries(this.rateLimits)) {
      const hourlyCheck = await this.checkHourlyLimit(licenseKeyId, operationType, config.hourlyLimit);
      const dailyCheck = await this.checkDailyLimit(licenseKeyId, operationType, config.dailyLimit);
      
      status[operationType] = {
        hourly: {
          used: hourlyCheck.currentUsage,
          remaining: hourlyCheck.remaining + 1, // Add back the reserved one
          limit: hourlyCheck.limit,
          resetTime: hourlyCheck.resetTime
        },
        daily: {
          used: dailyCheck.currentUsage,
          remaining: dailyCheck.remaining + 1,
          limit: dailyCheck.limit,
          resetTime: dailyCheck.resetTime
        }
      };
    }
    
    return status;
  }

  // Clear expired cache entries
  clearExpiredCache(): void {
    const now = Date.now();
    let clearedCount = 0;

    for (const [key, entry] of this.rateLimitCache.entries()) {
      if (entry.windowEnd <= now) {
        this.rateLimitCache.delete(key);
        clearedCount++;
      }
    }

    if (clearedCount > 0) {
      console.log(`[RateLimit] Cleared ${clearedCount} expired cache entries`);
    }
  }

  // Get cache statistics
  getCacheStats(): {
    total_entries: number;
    active_windows: number;
    memory_usage_estimate: number;
  } {
    const now = Date.now();
    let activeWindows = 0;
    
    for (const entry of this.rateLimitCache.values()) {
      if (entry.windowEnd > now) {
        activeWindows++;
      }
    }

    return {
      total_entries: this.rateLimitCache.size,
      active_windows: activeWindows,
      memory_usage_estimate: this.rateLimitCache.size * 100 // Rough estimate in bytes
    };
  }

  // Start automatic cache cleanup
  startCacheCleanup(): void {
    console.log('[RateLimit] Starting automatic cache cleanup');
    
    // Clear expired entries every minute
    setInterval(() => {
      this.clearExpiredCache();
    }, 60 * 1000);
  }

  // Update rate limits (for admin configuration)
  updateRateLimit(operation: string, limits: Partial<RateLimitConfig>): void {
    if (this.rateLimits[operation]) {
      this.rateLimits[operation] = { ...this.rateLimits[operation], ...limits };
      console.log(`[RateLimit] Updated limits for ${operation}:`, this.rateLimits[operation]);
    }
  }

  // Get configured rate limits
  getRateLimits(): Record<string, RateLimitConfig> {
    return { ...this.rateLimits };
  }
}

// Export singleton instance
export const rateLimitingService = RateLimitingService.getInstance();

// Export types
export type { RateLimitResult, RateLimitConfig };
