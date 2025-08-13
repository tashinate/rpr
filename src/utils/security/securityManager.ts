/**
 * SECURITY MANAGER - Comprehensive client-side security management
 * Handles session security, key clearing, and secure data handling
 */

export interface SecurityConfig {
  sessionTimeout: number; // milliseconds
  keyRotationInterval: number; // milliseconds
  enableAutoKeyClearing: boolean;
  enableSecureStorage: boolean;
}

export interface SecurityState {
  isSecureSession: boolean;
  lastActivityTime: number;
  encryptionKeysInMemory: boolean;
  sessionValidUntil: number;
}

class SecurityManager {
  private config: SecurityConfig;
  private state: SecurityState;
  private secureKeys: Map<string, string> = new Map();
  private sessionTimer: NodeJS.Timeout | null = null;
  private keyRotationTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<SecurityConfig>) {
    this.config = {
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      keyRotationInterval: 60 * 60 * 1000, // 1 hour
      enableAutoKeyClearing: true,
      enableSecureStorage: true,
      ...config
    };

    this.state = {
      isSecureSession: false,
      lastActivityTime: Date.now(),
      encryptionKeysInMemory: false,
      sessionValidUntil: 0
    };

    this.initializeSecurityMonitoring();
  }

  /**
   * Initialize a secure session with automatic cleanup
   */
  startSecureSession(sessionToken: string, expiresAt: string): void {
    const expiration = new Date(expiresAt).getTime();
    
    this.state = {
      isSecureSession: true,
      lastActivityTime: Date.now(),
      encryptionKeysInMemory: false,
      sessionValidUntil: expiration
    };

    // Store session token securely
    if (this.config.enableSecureStorage) {
      this.setSecureItem('session_token', sessionToken);
    }

    // Start session monitoring
    this.startSessionMonitoring();
    
    console.log('[SecurityManager] Secure session started, expires:', new Date(expiration));
  }

  /**
   * End secure session and clear all sensitive data
   */
  endSecureSession(): void {
    console.log('[SecurityManager] Ending secure session and clearing sensitive data');
    
    // Clear all encryption keys from memory
    this.clearAllEncryptionKeys();
    
    // Clear secure storage
    this.clearSecureStorage();
    
    // Stop timers
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
    
    if (this.keyRotationTimer) {
      clearTimeout(this.keyRotationTimer);
      this.keyRotationTimer = null;
    }

    // Reset state
    this.state = {
      isSecureSession: false,
      lastActivityTime: 0,
      encryptionKeysInMemory: false,
      sessionValidUntil: 0
    };

    // Force garbage collection hint (browser-safe)
    if (typeof window !== 'undefined' && (window as any).gc) {
      (window as any).gc();
    }
  }

  /**
   * Store encryption key securely in memory
   */
  storeEncryptionKey(keyId: string, key: string): void {
    this.secureKeys.set(keyId, key);
    this.state.encryptionKeysInMemory = true;
    
    // Auto-clear key after rotation interval if enabled
    if (this.config.enableAutoKeyClearing) {
      setTimeout(() => {
        this.clearEncryptionKey(keyId);
      }, this.config.keyRotationInterval);
    }
  }

  /**
   * Retrieve encryption key from secure memory
   */
  getEncryptionKey(keyId: string): string | null {
    this.updateActivity();
    return this.secureKeys.get(keyId) || null;
  }

  /**
   * Clear specific encryption key from memory
   */
  clearEncryptionKey(keyId: string): void {
    if (this.secureKeys.has(keyId)) {
      // Overwrite key with random data before deletion
      const randomKey = this.generateRandomKey(this.secureKeys.get(keyId)?.length || 32);
      this.secureKeys.set(keyId, randomKey);
      this.secureKeys.delete(keyId);
    }
    
    if (this.secureKeys.size === 0) {
      this.state.encryptionKeysInMemory = false;
    }
  }

  /**
   * Clear all encryption keys from memory
   */
  clearAllEncryptionKeys(): void {
    console.log('[SecurityManager] Clearing all encryption keys from memory');
    
    // Overwrite all keys with random data before deletion
    for (const [keyId, key] of this.secureKeys.entries()) {
      const randomKey = this.generateRandomKey(key.length);
      this.secureKeys.set(keyId, randomKey);
    }
    
    this.secureKeys.clear();
    this.state.encryptionKeysInMemory = false;
  }

  /**
   * Check if session is still valid
   */
  isSessionValid(): boolean {
    const now = Date.now();
    return this.state.isSecureSession && 
           now < this.state.sessionValidUntil && 
           (now - this.state.lastActivityTime) < this.config.sessionTimeout;
  }

  /**
   * Update last activity time
   */
  updateActivity(): void {
    this.state.lastActivityTime = Date.now();
  }

  /**
   * Get current security state
   */
  getSecurityState(): SecurityState {
    return { ...this.state };
  }

  /**
   * Secure storage operations
   */
  setSecureItem(key: string, value: string): void {
    if (this.config.enableSecureStorage) {
      try {
        // Use sessionStorage for automatic cleanup on browser close
        sessionStorage.setItem(`secure_${key}`, this.encodeSecureValue(value));
      } catch (error) {
        console.warn('[SecurityManager] Failed to store secure item:', error);
      }
    }
  }

  getSecureItem(key: string): string | null {
    if (!this.config.enableSecureStorage) return null;
    
    try {
      const encoded = sessionStorage.getItem(`secure_${key}`);
      return encoded ? this.decodeSecureValue(encoded) : null;
    } catch (error) {
      console.warn('[SecurityManager] Failed to retrieve secure item:', error);
      return null;
    }
  }

  clearSecureStorage(): void {
    console.log('[SecurityManager] Clearing secure storage');
    
    try {
      // Clear all secure items
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const key = sessionStorage.key(i);
        if (key?.startsWith('secure_')) {
          sessionStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('[SecurityManager] Failed to clear secure storage:', error);
    }
  }

  /**
   * Initialize security monitoring
   */
  private initializeSecurityMonitoring(): void {
    // Monitor for tab/window close
    window.addEventListener('beforeunload', () => {
      this.endSecureSession();
    });

    // Monitor for tab visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Clear keys when tab becomes hidden for security
        if (this.config.enableAutoKeyClearing) {
          setTimeout(() => {
            if (document.hidden) {
              this.clearAllEncryptionKeys();
            }
          }, 5 * 60 * 1000); // 5 minutes
        }
      }
    });
  }

  /**
   * Start session monitoring
   */
  private startSessionMonitoring(): void {
    // Check session validity periodically
    this.sessionTimer = setInterval(() => {
      if (!this.isSessionValid()) {
        console.log('[SecurityManager] Session expired, ending secure session');
        this.endSecureSession();
      }
    }, 60 * 1000); // Check every minute

    // Start key rotation if enabled
    if (this.config.enableAutoKeyClearing) {
      this.keyRotationTimer = setInterval(() => {
        console.log('[SecurityManager] Rotating encryption keys');
        this.clearAllEncryptionKeys();
      }, this.config.keyRotationInterval);
    }
  }

  /**
   * Generate random key for overwriting sensitive data
   */
  private generateRandomKey(length: number): string {
    let result = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Encode value for secure storage
   */
  private encodeSecureValue(value: string): string {
    // Simple encoding to prevent casual inspection
    return btoa(encodeURIComponent(value));
  }

  /**
   * Decode value from secure storage
   */
  private decodeSecureValue(encoded: string): string {
    try {
      return decodeURIComponent(atob(encoded));
    } catch (error) {
      console.warn('[SecurityManager] Failed to decode secure value');
      return '';
    }
  }
}

// Export singleton instance
export const securityManager = new SecurityManager();

// Export enhanced error handler integration
export const logSecurityEvent = (
  eventType: string,
  message: string,
  severity: 'info' | 'warning' | 'error' | 'critical' = 'info',
  details?: any
) => {
  console.log(`[Security] ${severity.toUpperCase()}: ${eventType} - ${message}`, details);
  
  // In a real implementation, this would send to the security audit log
  // via the database function we created in the migration
};