/**
 * OPTIONAL ANALYTICS SERVICE
 * Makes all analytics and metrics optional with graceful degradation
 * System works perfectly without Supabase analytics
 */

import { supabase } from '@/integrations/supabase/client';

interface AnalyticsEvent {
  event: string;
  data: any;
  timestamp: Date;
  category: 'pattern_usage' | 'url_generation' | 'performance' | 'security' | 'user_action';
}

interface LocalMetrics {
  totalGenerations: number;
  successfulGenerations: number;
  patternUsage: Record<string, number>;
  errorCounts: Record<string, number>;
  lastReset: Date;
}

class OptionalAnalytics {
  private static instance: OptionalAnalytics;
  private enabled = false;
  private localMetrics: LocalMetrics = {
    totalGenerations: 0,
    successfulGenerations: 0,
    patternUsage: {},
    errorCounts: {},
    lastReset: new Date()
  };
  private eventQueue: AnalyticsEvent[] = [];
  private readonly MAX_QUEUE_SIZE = 100;

  private constructor() {
    // Check if analytics should be enabled (optional)
    this.checkAnalyticsAvailability();
  }

  static getInstance(): OptionalAnalytics {
    if (!OptionalAnalytics.instance) {
      OptionalAnalytics.instance = new OptionalAnalytics();
    }
    return OptionalAnalytics.instance;
  }

  /**
   * Check if analytics is available and enable if possible
   */
  private async checkAnalyticsAvailability(): Promise<void> {
    try {
      // Quick test to see if Supabase is available for analytics
      const { error } = await supabase.from('url_patterns').select('id').limit(1);
      this.enabled = !error;
      
      if (this.enabled) {
        console.log('📊 [OptionalAnalytics] Analytics enabled - Supabase available');
      } else {
        console.log('📊 [OptionalAnalytics] Analytics disabled - Supabase unavailable, using local metrics only');
      }
    } catch (error) {
      this.enabled = false;
      console.log('📊 [OptionalAnalytics] Analytics disabled - operating in offline mode');
    }
  }

  /**
   * Track event - works with or without database
   */
  async trackEvent(event: string, data: any, category: AnalyticsEvent['category'] = 'user_action'): Promise<void> {
    // Always update local metrics
    this.updateLocalMetrics(event, data);

    const analyticsEvent: AnalyticsEvent = {
      event,
      data,
      timestamp: new Date(),
      category
    };

    // Add to queue for potential batch processing
    this.eventQueue.push(analyticsEvent);
    if (this.eventQueue.length > this.MAX_QUEUE_SIZE) {
      this.eventQueue.shift(); // Remove oldest event
    }

    // Try to send to database if enabled
    if (this.enabled) {
      try {
        await this.sendToDatabase(analyticsEvent);
      } catch (error) {
        console.warn('📊 [OptionalAnalytics] Failed to send to database, continuing with local metrics:', error);
        // Don't disable analytics completely, just log the failure
      }
    }
  }

  /**
   * Track pattern usage
   */
  async trackPatternUsage(patternId: string, patternName: string, success: boolean): Promise<void> {
    await this.trackEvent('pattern_used', {
      patternId,
      patternName,
      success,
      timestamp: new Date().toISOString()
    }, 'pattern_usage');
  }

  /**
   * Track URL generation
   */
  async trackUrlGeneration(success: boolean, pattern: string, method: string, metadata?: any): Promise<void> {
    await this.trackEvent('url_generated', {
      success,
      pattern,
      method,
      metadata,
      timestamp: new Date().toISOString()
    }, 'url_generation');
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(operation: string, duration: number, success: boolean): Promise<void> {
    await this.trackEvent('performance_metric', {
      operation,
      duration,
      success,
      timestamp: new Date().toISOString()
    }, 'performance');
  }

  /**
   * Track security events
   */
  async trackSecurityEvent(eventType: string, details: any): Promise<void> {
    await this.trackEvent('security_event', {
      eventType,
      details,
      timestamp: new Date().toISOString()
    }, 'security');
  }

  /**
   * Update local metrics (always works)
   */
  private updateLocalMetrics(event: string, data: any): void {
    switch (event) {
      case 'url_generated':
        this.localMetrics.totalGenerations++;
        if (data.success) {
          this.localMetrics.successfulGenerations++;
        }
        if (data.pattern) {
          this.localMetrics.patternUsage[data.pattern] = (this.localMetrics.patternUsage[data.pattern] || 0) + 1;
        }
        break;
      
      case 'pattern_used':
        if (data.patternName) {
          this.localMetrics.patternUsage[data.patternName] = (this.localMetrics.patternUsage[data.patternName] || 0) + 1;
        }
        break;
      
      case 'error_occurred':
        if (data.errorType) {
          this.localMetrics.errorCounts[data.errorType] = (this.localMetrics.errorCounts[data.errorType] || 0) + 1;
        }
        break;
    }
  }

  /**
   * Send event to database (optional)
   */
  private async sendToDatabase(event: AnalyticsEvent): Promise<void> {
    if (!this.enabled) return;

    try {
      // Try to insert into a generic analytics table
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_name: event.event,
          event_data: event.data,
          event_category: event.category,
          created_at: event.timestamp.toISOString()
        });

      if (error) {
        // If analytics table doesn't exist, try pattern usage stats
        if (event.category === 'pattern_usage') {
          await this.fallbackPatternTracking(event);
        }
        // For other events, just log locally
      }
    } catch (error) {
      // Silently fail - analytics should never break the main functionality
      console.debug('📊 [OptionalAnalytics] Database insert failed:', error);
    }
  }

  /**
   * Fallback pattern tracking if main analytics fails
   */
  private async fallbackPatternTracking(event: AnalyticsEvent): Promise<void> {
    try {
      if (event.data.patternId) {
        // Try to update pattern usage in the patterns table
        await supabase.rpc('increment_pattern_usage', {
          pattern_id_input: event.data.patternId
        });
      }
    } catch (error) {
      // Even fallback failed, just use local metrics
      console.debug('📊 [OptionalAnalytics] Fallback tracking failed:', error);
    }
  }

  /**
   * Get local metrics (always available)
   */
  getLocalMetrics(): LocalMetrics & { successRate: number; topPatterns: Array<{ pattern: string; count: number }> } {
    const successRate = this.localMetrics.totalGenerations > 0 
      ? (this.localMetrics.successfulGenerations / this.localMetrics.totalGenerations) * 100 
      : 0;

    const topPatterns = Object.entries(this.localMetrics.patternUsage)
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      ...this.localMetrics,
      successRate: Math.round(successRate),
      topPatterns
    };
  }

  /**
   * Get comprehensive metrics (database + local)
   */
  async getComprehensiveMetrics(): Promise<any> {
    const localMetrics = this.getLocalMetrics();

    if (!this.enabled) {
      return {
        source: 'local_only',
        ...localMetrics,
        databaseMetrics: null
      };
    }

    try {
      // Try to get database metrics
      const { data: dbMetrics, error } = await supabase.rpc('get_analytics_summary');
      
      if (error || !dbMetrics) {
        return {
          source: 'local_with_db_error',
          ...localMetrics,
          databaseMetrics: null,
          dbError: error?.message
        };
      }

      return {
        source: 'local_and_database',
        localMetrics,
        databaseMetrics: dbMetrics
      };
    } catch (error) {
      return {
        source: 'local_with_exception',
        ...localMetrics,
        databaseMetrics: null,
        exception: error
      };
    }
  }

  /**
   * Reset local metrics
   */
  resetLocalMetrics(): void {
    this.localMetrics = {
      totalGenerations: 0,
      successfulGenerations: 0,
      patternUsage: {},
      errorCounts: {},
      lastReset: new Date()
    };
    this.eventQueue = [];
  }

  /**
   * Get analytics status
   */
  getStatus(): {
    enabled: boolean;
    queueSize: number;
    localMetrics: boolean;
    lastCheck: Date;
  } {
    return {
      enabled: this.enabled,
      queueSize: this.eventQueue.length,
      localMetrics: true,
      lastCheck: new Date()
    };
  }

  /**
   * Force enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    console.log(`📊 [OptionalAnalytics] Analytics ${enabled ? 'enabled' : 'disabled'} manually`);
  }

  /**
   * Batch process queued events (for performance)
   */
  async flushEventQueue(): Promise<void> {
    if (!this.enabled || this.eventQueue.length === 0) return;

    const eventsToProcess = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Process events in batches
      const batchSize = 10;
      for (let i = 0; i < eventsToProcess.length; i += batchSize) {
        const batch = eventsToProcess.slice(i, i + batchSize);
        await Promise.all(batch.map(event => this.sendToDatabase(event)));
      }
    } catch (error) {
      console.warn('📊 [OptionalAnalytics] Batch processing failed:', error);
    }
  }
}

// Export singleton instance
export const optionalAnalytics = OptionalAnalytics.getInstance();

// Convenience functions for common tracking
export const trackPatternUsage = (patternId: string, patternName: string, success: boolean) =>
  optionalAnalytics.trackPatternUsage(patternId, patternName, success);

export const trackUrlGeneration = (success: boolean, pattern: string, method: string, metadata?: any) =>
  optionalAnalytics.trackUrlGeneration(success, pattern, method, metadata);

export const trackPerformance = (operation: string, duration: number, success: boolean) =>
  optionalAnalytics.trackPerformance(operation, duration, success);

export const trackSecurityEvent = (eventType: string, details: any) =>
  optionalAnalytics.trackSecurityEvent(eventType, details);

export const getLocalMetrics = () => optionalAnalytics.getLocalMetrics();

export const getAnalyticsStatus = () => optionalAnalytics.getStatus();
