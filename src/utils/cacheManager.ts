/**
 * Advanced cache management for clearing all caches and ensuring fresh data
 */
export class CacheManager {
  private static instance: CacheManager;
  
  static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  /**
   * Clear all application caches to ensure fresh data
   */
  clearAllCaches(): void {
    try {
      // Clear localStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear pattern-related cache entries
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.includes('pattern') || 
            key.includes('url_') || 
            key.includes('phantom') ||
            key.includes('cache')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log(`[CacheManager] Cleared ${keysToRemove.length} localStorage entries`);
      }

      // Clear sessionStorage
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.clear();
        console.log('[CacheManager] Cleared sessionStorage');
      }

      // Force browser cache refresh
      if (typeof window !== 'undefined') {
        // Add cache-busting timestamp to force refresh
        const timestamp = Date.now();
        window.history.replaceState(
          null, 
          '', 
          `${window.location.pathname}?_cacheBust=${timestamp}`
        );
      }

      console.log('[CacheManager] ✅ All caches cleared successfully');
    } catch (error) {
      console.error('[CacheManager] Error clearing caches:', error);
    }
  }

  /**
   * Clear specific pattern-related caches
   */
  clearPatternCaches(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const patternKeys = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.includes('pattern')) {
            patternKeys.push(key);
          }
        }
        patternKeys.forEach(key => localStorage.removeItem(key));
        console.log(`[CacheManager] Cleared ${patternKeys.length} pattern cache entries`);
      }
    } catch (error) {
      console.error('[CacheManager] Error clearing pattern caches:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { localStorageEntries: number; sessionStorageEntries: number } {
    try {
      let localStorageEntries = 0;
      let sessionStorageEntries = 0;

      if (typeof window !== 'undefined') {
        localStorageEntries = window.localStorage ? window.localStorage.length : 0;
        sessionStorageEntries = window.sessionStorage ? window.sessionStorage.length : 0;
      }

      return { localStorageEntries, sessionStorageEntries };
    } catch (error) {
      console.error('[CacheManager] Error getting cache stats:', error);
      return { localStorageEntries: 0, sessionStorageEntries: 0 };
    }
  }
}

// Export singleton instance
export const cacheManager = CacheManager.getInstance();