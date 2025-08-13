
/**
 * AES-256-GCM Encryption Service
 * Replaces weak XOR encryption with military-grade cryptography
 * Features: Time-based key rotation, secure salt generation, authentication
 */

interface EncryptionResult {
  ciphertext: string;
  nonce: string;
  salt: string;
  timestamp: number;
  authTag: string;
}

interface DecryptionResult {
  plaintext: string;
  success: boolean;
  error?: string;
}

class SecureKeyManager {
  private static instance: SecureKeyManager;
  private keyCache = new Map<string, CryptoKey>();
  private masterKeyCache: CryptoKey | null = null;

  static getInstance(): SecureKeyManager {
    if (!SecureKeyManager.instance) {
      SecureKeyManager.instance = new SecureKeyManager();
    }
    return SecureKeyManager.instance;
  }

  // Generate cryptographically secure salt
  private generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16)); // 128-bit salt
  }

  // Generate secure nonce for AES-GCM
  private generateNonce(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(12)); // 96-bit nonce for GCM
  }

  // Get current day key for time-based rotation
  private getDayKey(): string {
    const now = new Date();
    const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    return dayKey;
  }

  // Derive master key using PBKDF2
  private async deriveMasterKey(baseKey: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(baseKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000, // 100k iterations for security
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true, // Make extractable to allow exportKey in deriveTimeBasedKey
      ['encrypt', 'decrypt']
    );
  }

  // Derive time-based key using HKDF
  private async deriveTimeBasedKey(masterKey: CryptoKey, context: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const dayKey = this.getDayKey();
    const info = encoder.encode(`${context}-${dayKey}`);
    
    // Export master key for HKDF
    const masterKeyBuffer = await crypto.subtle.exportKey('raw', masterKey);
    
    // Import for HKDF
    const hkdfKey = await crypto.subtle.importKey(
      'raw',
      masterKeyBuffer,
      { name: 'HKDF' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32), // 256-bit salt
        info: info
      },
      hkdfKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Get or create encryption key for a specific context
  async getEncryptionKey(baseKey: string, context: string = 'default'): Promise<CryptoKey> {
    const cacheKey = `${baseKey}-${context}-${this.getDayKey()}`;
    
    if (this.keyCache.has(cacheKey)) {
      return this.keyCache.get(cacheKey)!;
    }

    // Generate salt for master key derivation
    const salt = this.generateSalt();
    
    // Derive master key
    const masterKey = await this.deriveMasterKey(baseKey, salt);
    
    // Derive time-based context key
    const contextKey = await this.deriveTimeBasedKey(masterKey, context);
    
    // Cache the key (with automatic expiration)
    this.keyCache.set(cacheKey, contextKey);
    
    // Auto-cleanup after 48 hours (overlap for graceful rotation)
    setTimeout(() => {
      this.keyCache.delete(cacheKey);
    }, 48 * 60 * 60 * 1000);

    return contextKey;
  }

  // Clean up old keys
  clearOldKeys(): void {
    this.keyCache.clear();
    this.masterKeyCache = null;
  }
}

import { encodeBase34, decodeBase34 } from './base34Encoder';

class AESEncryptionService {
  private keyManager = SecureKeyManager.getInstance();

  // Convert ArrayBuffer to Base34 (stealth)
  private toBase34(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    const binaryString = String.fromCharCode(...bytes);
    return encodeBase34(binaryString);
  }

  // Convert Base34 back to ArrayBuffer
  private fromBase34(encoded: string): ArrayBuffer {
    try {
      const decoded = decodeBase34(encoded);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }
      return bytes.buffer;
    } catch (error) {
      throw new Error(`Failed to decode Base34: ${error.message}`);
    }
  }

  // Legacy Base64URL functions for backward compatibility
  private toBase64Url(buffer: ArrayBuffer): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private fromBase64Url(base64url: string): ArrayBuffer {
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padding = '='.repeat((4 - base64.length % 4) % 4);
    const binaryString = atob(base64 + padding);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Encrypt plaintext using AES-256-GCM
  async encrypt(plaintext: string, baseKey: string, context: string = 'url'): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Get encryption key
      const key = await this.keyManager.getEncryptionKey(baseKey, context);
      
      // Generate nonce and salt
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Encrypt with AES-GCM
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: nonce,
          additionalData: salt // Use salt as additional authenticated data
        },
        key,
        data
      );

      // Create result object using Base34 encoding
      const result: EncryptionResult = {
        ciphertext: this.toBase34(encrypted.slice(0, -16)), // Remove auth tag
        nonce: this.toBase34(nonce),
        salt: this.toBase34(salt),
        timestamp: Date.now(),
        authTag: this.toBase34(encrypted.slice(-16)) // Last 16 bytes are auth tag
      };

      // Combine all parts and encode the entire string with Base34
      const combined = JSON.stringify(result);
      return encodeBase34(combined);
      
    } catch (error) {
      throw new Error(`AES encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Decrypt ciphertext using AES-256-GCM
  async decrypt(encryptedData: string, baseKey: string, context: string = 'url'): Promise<DecryptionResult> {
    try {
      // Try Base34 decoding first (current format)
      try {
        const decodedJson = decodeBase34(encryptedData);
        const result = JSON.parse(decodedJson);
        
        const { ciphertext, nonce, salt, timestamp, authTag } = result;
        
        // Convert from Base34
        const ciphertextBuffer = this.fromBase34(ciphertext);
        const nonceArray = new Uint8Array(this.fromBase34(nonce));
        const saltArray = new Uint8Array(this.fromBase34(salt));
        const authTagArray = new Uint8Array(this.fromBase34(authTag));

        // Check timestamp (optional expiration - 7 days default)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (Date.now() - timestamp > maxAge) {
          return { plaintext: '', success: false, error: 'Encrypted data has expired' };
        }

        // Reconstruct full encrypted data (ciphertext + auth tag)
        const fullEncrypted = new Uint8Array(ciphertextBuffer.byteLength + authTagArray.length);
        fullEncrypted.set(new Uint8Array(ciphertextBuffer));
        fullEncrypted.set(authTagArray, ciphertextBuffer.byteLength);

        // Try current day key first
        let key = await this.keyManager.getEncryptionKey(baseKey, context);
        
        try {
          const decrypted = await crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: nonceArray,
              additionalData: saltArray
            },
            key,
            fullEncrypted
          );

          const plaintext = new TextDecoder().decode(decrypted);
          return { plaintext, success: true };
          
        } catch (currentKeyError) {
          // Try previous day key for graceful rotation
          const prevContext = `${context}-prev`;
          try {
            const prevKey = await this.keyManager.getEncryptionKey(baseKey, prevContext);
            const decrypted = await crypto.subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: nonceArray,
                additionalData: saltArray
              },
              prevKey,
              fullEncrypted
            );

            const plaintext = new TextDecoder().decode(decrypted);
            return { plaintext, success: true };
            
          } catch (prevKeyError) {
            return { 
              plaintext: '', 
              success: false, 
              error: `Base34 decryption failed: ${currentKeyError instanceof Error ? currentKeyError.message : 'Authentication failed'}` 
            };
          }
        }
        
      } catch (base34Error) {
        // Fallback to legacy formats for backward compatibility
        console.warn('Base34 decryption failed, trying legacy formats:', base34Error);
        
        // Try legacy dot-separated format
        let parts = encryptedData.split('.');
        
        // If not 5 parts, try base64url decoding (handle legacy double-encoded format)
        if (parts.length !== 5) {
          try {
            const combinedBuffer = this.fromBase64Url(encryptedData);
            const combined = new TextDecoder().decode(combinedBuffer);
            parts = combined.split('.');
          } catch (decodeError) {
            return { plaintext: '', success: false, error: 'Invalid encrypted data format - cannot decode' };
          }
        }
        
        if (parts.length !== 5) {
          return { plaintext: '', success: false, error: 'Invalid encrypted data format' };
        }

        const [ciphertext, nonceStr, saltStr, timestampStr, authTagStr] = parts;
        
        // Parse components using legacy Base64URL
        const ciphertextBuffer = this.fromBase64Url(ciphertext);
        const nonce = new Uint8Array(this.fromBase64Url(nonceStr));
        const salt = new Uint8Array(this.fromBase64Url(saltStr));
        const timestamp = parseInt(timestampStr);
        const authTag = new Uint8Array(this.fromBase64Url(authTagStr));

        // Check timestamp (optional expiration - 7 days default)
        const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        if (Date.now() - timestamp > maxAge) {
          return { plaintext: '', success: false, error: 'Encrypted data has expired' };
        }

        // Reconstruct full encrypted data (ciphertext + auth tag)
        const fullEncrypted = new Uint8Array(ciphertextBuffer.byteLength + authTag.length);
        fullEncrypted.set(new Uint8Array(ciphertextBuffer));
        fullEncrypted.set(authTag, ciphertextBuffer.byteLength);

        // Try current day key first
        let key = await this.keyManager.getEncryptionKey(baseKey, context);
        
        try {
          const decrypted = await crypto.subtle.decrypt(
            {
              name: 'AES-GCM',
              iv: nonce,
              additionalData: salt
            },
            key,
            fullEncrypted
          );

          const plaintext = new TextDecoder().decode(decrypted);
          return { plaintext, success: true };
          
        } catch (currentKeyError) {
          // Try previous day key for graceful rotation
          const prevContext = `${context}-prev`;
          try {
            const prevKey = await this.keyManager.getEncryptionKey(baseKey, prevContext);
            const decrypted = await crypto.subtle.decrypt(
              {
                name: 'AES-GCM',
                iv: nonce,
                additionalData: salt
              },
              prevKey,
              fullEncrypted
            );

            const plaintext = new TextDecoder().decode(decrypted);
            return { plaintext, success: true };
            
          } catch (prevKeyError) {
            return { 
              plaintext: '', 
              success: false, 
              error: `Legacy decryption failed: ${currentKeyError instanceof Error ? currentKeyError.message : 'Authentication failed'}` 
            };
          }
        }
      }
      
    } catch (error) {
      return { 
        plaintext: '', 
        success: false, 
        error: `AES decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Generate a secure random key for testing
  generateSecureKey(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomValues = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(randomValues, byte => chars[byte % chars.length]).join('');
  }

  // Clean up resources
  cleanup(): void {
    this.keyManager.clearOldKeys();
  }
}

// Export singleton instance
export const aesEncryption = new AESEncryptionService();

// Convenience functions for backward compatibility
export const aesEncrypt = (text: string, key: string = 'default-key'): Promise<string> => {
  return aesEncryption.encrypt(text, key);
};

export const aesDecrypt = (encryptedText: string, key: string = 'default-key'): Promise<string> => {
  return aesEncryption.decrypt(encryptedText, key).then(result => {
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    return result.plaintext;
  });
};
