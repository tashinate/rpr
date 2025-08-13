
/**
 * Simple in-memory cache to track dead URLs and reduce log spam
 * Only logs the first attempt per URL hash per session
 */
class DeadUrlCache {
  private loggedUrls: Set<string> = new Set();
  private attemptCounts: Map<string, number> = new Map();

  /**
   * Check if a URL has already been logged in this session
   */
  hasBeenLogged(urlHash: string): boolean {
    return this.loggedUrls.has(urlHash);
  }

  /**
   * Mark a URL as logged and increment attempt count
   */
  markAsLogged(urlHash: string): void {
    this.loggedUrls.add(urlHash);
    const currentCount = this.attemptCounts.get(urlHash) || 0;
    this.attemptCounts.set(urlHash, currentCount + 1);
  }

  /**
   * Get attempt count for a URL
   */
  getAttemptCount(urlHash: string): number {
    return this.attemptCounts.get(urlHash) || 0;
  }

  /**
   * Increment attempt count without logging
   */
  incrementAttempt(urlHash: string): number {
    const currentCount = this.attemptCounts.get(urlHash) || 0;
    const newCount = currentCount + 1;
    this.attemptCounts.set(urlHash, newCount);
    return newCount;
  }

  /**
   * Clear cache (optional cleanup)
   */
  clear(): void {
    this.loggedUrls.clear();
    this.attemptCounts.clear();
  }

  /**
   * Get statistics for admin purposes
   */
  getStats(): { totalUniqueDeadUrls: number; totalAttempts: number; topDeadUrls: Array<{ hash: string; attempts: number }> } {
    const totalUniqueDeadUrls = this.loggedUrls.size;
    const totalAttempts = Array.from(this.attemptCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const topDeadUrls = Array.from(this.attemptCounts.entries())
      .map(([hash, attempts]) => ({ hash: hash.substring(0, 8) + '...', attempts }))
      .sort((a, b) => b.attempts - a.attempts)
      .slice(0, 10);

    return { totalUniqueDeadUrls, totalAttempts, topDeadUrls };
  }
}

// Export singleton instance
export const deadUrlCache = new DeadUrlCache();
