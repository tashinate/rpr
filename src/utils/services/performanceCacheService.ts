// Stub implementation of performance cache service
// This provides the interface needed by other components without database dependencies

export interface CacheStats {
  total_requests: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  total_entries?: number;
}

export interface CacheEntry {
  key: string;
  value: any;
  timestamp: number;
  ttl: number;
  hit_count: number;
}

export class PerformanceCacheService {
  private cache = new Map<string, CacheEntry>();

  async getCacheStats(): Promise<CacheStats> {
    // Return current cache statistics
    const total_entries = this.cache.size;
    const total_requests = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.hit_count, 0);
    const cache_hits = Math.floor(total_requests * 0.75); // Simulate 75% hit rate
    const cache_misses = total_requests - cache_hits;
    const hit_rate = total_requests > 0 ? (cache_hits / total_requests) * 100 : 0;

    return {
      total_requests,
      cache_hits,
      cache_misses,
      hit_rate,
      total_entries
    };
  }

  async get(key: string): Promise<any> {
    const entry = this.cache.get(key);
    if (entry && Date.now() < entry.timestamp + entry.ttl) {
      entry.hit_count++;
      return entry.value;
    }
    return null;
  }

  async set(key: string, value: any, ttl: number = 3600000): Promise<void> {
    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      ttl,
      hit_count: 0
    });
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async cleanup(): Promise<number> {
    const now = Date.now();
    let deletedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  async getTopCachedUrls(limit: number = 10): Promise<Array<{ url: string; hits: number; last_access: string }>> {
    const entries = Array.from(this.cache.values())
      .sort((a, b) => b.hit_count - a.hit_count)
      .slice(0, limit);

    return entries.map(entry => ({
      url: entry.key,
      hits: entry.hit_count,
      last_access: new Date(entry.timestamp).toISOString()
    }));
  }
}

export const performanceCacheService = new PerformanceCacheService();