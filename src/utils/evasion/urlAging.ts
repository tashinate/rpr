/**
 * URL Aging and Reputation System
 * Pre-generates URLs and builds reputation before use in email campaigns
 */

import { supabase } from '@/integrations/supabase/client';

export interface AgedUrl {
  id: string;
  url: string;
  originalUrl: string;
  licenseKeyId: string;
  pattern: string;
  createdAt: Date;
  firstUsedAt?: Date;
  lastUsedAt?: Date;
  usageCount: number;
  reputationScore: number;
  status: 'aging' | 'ready' | 'active' | 'burned' | 'expired';
  agingPeriod: number; // hours
  maxUsage: number;
  metadata: Record<string, any>;
}

export interface ReputationMetrics {
  deliveryRate: number;
  clickRate: number;
  spamReports: number;
  bounceRate: number;
  trustScore: number;
  lastUpdated: Date;
}

export interface AgingOptions {
  agingPeriod?: number; // hours to age before use
  maxUsage?: number; // maximum times URL can be used
  reputationBuilding?: boolean; // whether to build reputation
  preWarmTraffic?: boolean; // send legitimate traffic first
  batchSize?: number; // number of URLs to pre-generate
}

export class UrlAgingService {
  
  private agedUrls: Map<string, AgedUrl> = new Map();
  private reputationMetrics: Map<string, ReputationMetrics> = new Map();
  
  /**
   * Pre-generate and age URLs for future use
   */
  async preGenerateUrls(
    originalUrl: string,
    licenseKeyId: string,
    pattern: string,
    options: AgingOptions = {}
  ): Promise<AgedUrl[]> {
    const {
      agingPeriod = 168, // 7 days default
      maxUsage = 100,
      batchSize = 10,
      reputationBuilding = true,
      preWarmTraffic = true
    } = options;

    const agedUrls: AgedUrl[] = [];

    for (let i = 0; i < batchSize; i++) {
      // Generate unique URL for this batch
      const { centralizedUrlProcessor } = await import('../services/centralizedUrlProcessor');
      const result = await centralizedUrlProcessor.generateUnifiedUrl(originalUrl, licenseKeyId, {
        pattern: pattern as any,
        varietySeed: i // Ensure variety in generation
      });

      const agedUrl: AgedUrl = {
        id: this.generateUrlId(),
        url: result.url,
        originalUrl,
        licenseKeyId,
        pattern,
        createdAt: new Date(),
        usageCount: 0,
        reputationScore: 50, // Start with neutral score
        status: 'aging',
        agingPeriod,
        maxUsage,
        metadata: {
          ...result.metadata,
          batchIndex: i,
          preWarmTraffic,
          reputationBuilding
        }
      };

      // Store in memory and database
      this.agedUrls.set(agedUrl.id, agedUrl);
      await this.storeAgedUrl(agedUrl);
      
      // Initialize reputation metrics
      this.reputationMetrics.set(agedUrl.id, {
        deliveryRate: 0,
        clickRate: 0,
        spamReports: 0,
        bounceRate: 0,
        trustScore: 50,
        lastUpdated: new Date()
      });

      agedUrls.push(agedUrl);

      // Start reputation building process if enabled
      if (reputationBuilding) {
        this.startReputationBuilding(agedUrl);
      }
    }

    console.log(`✅ Pre-generated ${batchSize} URLs for aging`);
    return agedUrls;
  }

  /**
   * Get ready-to-use aged URL
   */
  async getAgedUrl(
    originalUrl: string,
    licenseKeyId: string,
    pattern?: string
  ): Promise<AgedUrl | null> {
    // First, check for ready URLs in memory
    const readyUrls = Array.from(this.agedUrls.values()).filter(url => 
      url.originalUrl === originalUrl &&
      url.licenseKeyId === licenseKeyId &&
      url.status === 'ready' &&
      url.usageCount < url.maxUsage &&
      (!pattern || url.pattern === pattern)
    );

    if (readyUrls.length > 0) {
      // Sort by reputation score and age
      readyUrls.sort((a, b) => {
        const scoreA = b.reputationScore - a.reputationScore;
        if (scoreA !== 0) return scoreA;
        return b.createdAt.getTime() - a.createdAt.getTime(); // Prefer older URLs
      });

      const selectedUrl = readyUrls[0];
      await this.markUrlAsUsed(selectedUrl.id);
      return selectedUrl;
    }

    // If no ready URLs, check database
    const { data: dbUrls, error } = await supabase
      .from('aged_urls')
      .select('*')
      .eq('original_url', originalUrl)
      .eq('license_key_id', licenseKeyId)
      .eq('status', 'ready')
      .lt('usage_count', 'max_usage')
      .order('reputation_score', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1);

    if (error || !dbUrls || dbUrls.length === 0) {
      return null;
    }

    const dbUrl = dbUrls[0];
    const agedUrl: AgedUrl = {
      id: dbUrl.id,
      url: dbUrl.url,
      originalUrl: dbUrl.original_url,
      licenseKeyId: dbUrl.license_key_id,
      pattern: dbUrl.pattern,
      createdAt: new Date(dbUrl.created_at),
      firstUsedAt: dbUrl.first_used_at ? new Date(dbUrl.first_used_at) : undefined,
      lastUsedAt: dbUrl.last_used_at ? new Date(dbUrl.last_used_at) : undefined,
      usageCount: dbUrl.usage_count,
      reputationScore: dbUrl.reputation_score,
      status: dbUrl.status,
      agingPeriod: dbUrl.aging_period,
      maxUsage: dbUrl.max_usage,
      metadata: dbUrl.metadata || {}
    };

    this.agedUrls.set(agedUrl.id, agedUrl);
    await this.markUrlAsUsed(agedUrl.id);
    return agedUrl;
  }

  /**
   * Mark URL as used and update statistics
   */
  async markUrlAsUsed(urlId: string): Promise<void> {
    const agedUrl = this.agedUrls.get(urlId);
    if (!agedUrl) return;

    agedUrl.usageCount++;
    agedUrl.lastUsedAt = new Date();
    
    if (!agedUrl.firstUsedAt) {
      agedUrl.firstUsedAt = new Date();
      agedUrl.status = 'active';
    }

    // Update in database
    await supabase
      .from('aged_urls')
      .update({
        usage_count: agedUrl.usageCount,
        last_used_at: agedUrl.lastUsedAt.toISOString(),
        first_used_at: agedUrl.firstUsedAt?.toISOString(),
        status: agedUrl.status
      })
      .eq('id', urlId);

    // Check if URL should be burned (overused)
    if (agedUrl.usageCount >= agedUrl.maxUsage) {
      await this.burnUrl(urlId);
    }
  }

  /**
   * Update reputation metrics for a URL
   */
  async updateReputationMetrics(
    urlId: string,
    metrics: Partial<ReputationMetrics>
  ): Promise<void> {
    const currentMetrics = this.reputationMetrics.get(urlId);
    if (!currentMetrics) return;

    const updatedMetrics = {
      ...currentMetrics,
      ...metrics,
      lastUpdated: new Date()
    };

    // Calculate trust score based on metrics
    updatedMetrics.trustScore = this.calculateTrustScore(updatedMetrics);

    this.reputationMetrics.set(urlId, updatedMetrics);

    // Update aged URL reputation score
    const agedUrl = this.agedUrls.get(urlId);
    if (agedUrl) {
      agedUrl.reputationScore = updatedMetrics.trustScore;
      
      await supabase
        .from('aged_urls')
        .update({
          reputation_score: agedUrl.reputationScore
        })
        .eq('id', urlId);
    }

    // Store metrics in database
    await supabase
      .from('url_reputation_metrics')
      .upsert({
        url_id: urlId,
        delivery_rate: updatedMetrics.deliveryRate,
        click_rate: updatedMetrics.clickRate,
        spam_reports: updatedMetrics.spamReports,
        bounce_rate: updatedMetrics.bounceRate,
        trust_score: updatedMetrics.trustScore,
        last_updated: updatedMetrics.lastUpdated.toISOString()
      });
  }

  /**
   * Process aging queue - check which URLs are ready
   */
  async processAgingQueue(): Promise<void> {
    const now = new Date();
    
    // Check memory first
    for (const [urlId, agedUrl] of this.agedUrls.entries()) {
      if (agedUrl.status === 'aging') {
        const ageInHours = (now.getTime() - agedUrl.createdAt.getTime()) / (1000 * 60 * 60);
        
        if (ageInHours >= agedUrl.agingPeriod) {
          agedUrl.status = 'ready';
          
          await supabase
            .from('aged_urls')
            .update({ status: 'ready' })
            .eq('id', urlId);
            
          console.log(`✅ URL ${urlId} is now ready for use after ${ageInHours.toFixed(1)} hours of aging`);
        }
      }
    }

    // Check database for aging URLs
    const { data: agingUrls, error } = await supabase
      .from('aged_urls')
      .select('*')
      .eq('status', 'aging')
      .lt('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()); // At least 24 hours old

    if (!error && agingUrls) {
      for (const dbUrl of agingUrls) {
        const createdAt = new Date(dbUrl.created_at);
        const ageInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        
        if (ageInHours >= dbUrl.aging_period) {
          await supabase
            .from('aged_urls')
            .update({ status: 'ready' })
            .eq('id', dbUrl.id);
        }
      }
    }
  }

  /**
   * Burn a URL (mark as overused/compromised)
   */
  async burnUrl(urlId: string): Promise<void> {
    const agedUrl = this.agedUrls.get(urlId);
    if (!agedUrl) return;

    agedUrl.status = 'burned';
    
    await supabase
      .from('aged_urls')
      .update({ status: 'burned' })
      .eq('id', urlId);

    console.log(`🔥 URL ${urlId} has been burned due to overuse`);
  }

  /**
   * Clean up expired URLs
   */
  async cleanupExpiredUrls(): Promise<void> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - 30); // 30 days old

    // Remove from memory
    for (const [urlId, agedUrl] of this.agedUrls.entries()) {
      if (agedUrl.createdAt < expiryDate) {
        this.agedUrls.delete(urlId);
        this.reputationMetrics.delete(urlId);
      }
    }

    // Mark as expired in database
    await supabase
      .from('aged_urls')
      .update({ status: 'expired' })
      .lt('created_at', expiryDate.toISOString())
      .neq('status', 'expired');

    console.log(`🧹 Cleaned up URLs older than 30 days`);
  }

  /**
   * Get aging statistics
   */
  async getAgingStatistics(): Promise<{
    total: number;
    aging: number;
    ready: number;
    active: number;
    burned: number;
    expired: number;
    averageReputationScore: number;
  }> {
    const { data: stats, error } = await supabase
      .from('aged_urls')
      .select('status, reputation_score');

    if (error || !stats) {
      return {
        total: 0,
        aging: 0,
        ready: 0,
        active: 0,
        burned: 0,
        expired: 0,
        averageReputationScore: 0
      };
    }

    const statusCounts = stats.reduce((acc, url) => {
      acc[url.status] = (acc[url.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const averageReputationScore = stats.length > 0 
      ? stats.reduce((sum, url) => sum + url.reputation_score, 0) / stats.length 
      : 0;

    return {
      total: stats.length,
      aging: statusCounts.aging || 0,
      ready: statusCounts.ready || 0,
      active: statusCounts.active || 0,
      burned: statusCounts.burned || 0,
      expired: statusCounts.expired || 0,
      averageReputationScore: Math.round(averageReputationScore)
    };
  }

  /**
   * Start reputation building process
   */
  private async startReputationBuilding(agedUrl: AgedUrl): Promise<void> {
    // This would integrate with external services to send legitimate traffic
    // For now, we'll simulate reputation building
    
    setTimeout(async () => {
      // Simulate gradual reputation building
      const currentMetrics = this.reputationMetrics.get(agedUrl.id);
      if (currentMetrics) {
        await this.updateReputationMetrics(agedUrl.id, {
          deliveryRate: Math.min(95, currentMetrics.deliveryRate + Math.random() * 10),
          trustScore: Math.min(90, currentMetrics.trustScore + Math.random() * 5)
        });
      }
    }, Math.random() * 3600000); // Random delay up to 1 hour
  }

  /**
   * Calculate trust score based on metrics
   */
  private calculateTrustScore(metrics: ReputationMetrics): number {
    let score = 50; // Base score

    // Delivery rate impact (40% weight)
    score += (metrics.deliveryRate - 50) * 0.4;

    // Click rate impact (20% weight)
    score += (metrics.clickRate - 5) * 4; // Normalize to similar scale

    // Spam reports impact (30% weight, negative)
    score -= metrics.spamReports * 10;

    // Bounce rate impact (10% weight, negative)
    score -= metrics.bounceRate * 0.5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Store aged URL in database
   */
  private async storeAgedUrl(agedUrl: AgedUrl): Promise<void> {
    await supabase
      .from('aged_urls')
      .insert({
        id: agedUrl.id,
        url: agedUrl.url,
        original_url: agedUrl.originalUrl,
        license_key_id: agedUrl.licenseKeyId,
        pattern: agedUrl.pattern,
        created_at: agedUrl.createdAt.toISOString(),
        usage_count: agedUrl.usageCount,
        reputation_score: agedUrl.reputationScore,
        status: agedUrl.status,
        aging_period: agedUrl.agingPeriod,
        max_usage: agedUrl.maxUsage,
        metadata: agedUrl.metadata
      });
  }

  /**
   * Generate unique URL ID
   */
  private generateUrlId(): string {
    return `aged_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Initialize aging service (load from database)
   */
  async initialize(): Promise<void> {
    const { data: agedUrls, error } = await supabase
      .from('aged_urls')
      .select('*')
      .in('status', ['aging', 'ready', 'active'])
      .order('created_at', { ascending: false })
      .limit(1000);

    if (!error && agedUrls) {
      for (const dbUrl of agedUrls) {
        const agedUrl: AgedUrl = {
          id: dbUrl.id,
          url: dbUrl.url,
          originalUrl: dbUrl.original_url,
          licenseKeyId: dbUrl.license_key_id,
          pattern: dbUrl.pattern,
          createdAt: new Date(dbUrl.created_at),
          firstUsedAt: dbUrl.first_used_at ? new Date(dbUrl.first_used_at) : undefined,
          lastUsedAt: dbUrl.last_used_at ? new Date(dbUrl.last_used_at) : undefined,
          usageCount: dbUrl.usage_count,
          reputationScore: dbUrl.reputation_score,
          status: dbUrl.status,
          agingPeriod: dbUrl.aging_period,
          maxUsage: dbUrl.max_usage,
          metadata: dbUrl.metadata || {}
        };

        this.agedUrls.set(agedUrl.id, agedUrl);
      }
    }

    console.log(`📊 Loaded ${this.agedUrls.size} aged URLs from database`);
  }

  /**
   * Start background processes
   */
  startBackgroundProcesses(): void {
    // Process aging queue every hour
    setInterval(() => {
      this.processAgingQueue().catch(console.error);
    }, 3600000);

    // Cleanup expired URLs daily
    setInterval(() => {
      this.cleanupExpiredUrls().catch(console.error);
    }, 86400000);

    console.log('🔄 Started URL aging background processes');
  }
}

export const urlAging = new UrlAgingService();
