/**
 * SECURE ENCRYPTION SERVICE - FIXED CLIENT-SIDE KEY VULNERABILITY
 * Moves key derivation to server-side while maintaining client usability
 * Security Level: MAXIMUM (Server-side key derivation + AES-256-GCM)
 */

import { supabase } from '@/integrations/supabase/client';

interface ServerKeyResponse {
  success: boolean;
  derived_key?: string;
  encrypted_data?: string;
  decrypted_data?: string;
  error?: string;
}

interface EncryptionResult {
  ciphertext: string;
  success: boolean;
  error?: string;
}

interface DecryptionResult {
  plaintext: string;
  success: boolean;
  error?: string;
}

class SecureEncryptionService {
  private keyCache = new Map<string, { key: string; expires: number }>();
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  // Get license key from current session
  private async getLicenseKey(): Promise<string> {
    const sessionToken = localStorage.getItem('license_session_token');
    if (!sessionToken) {
      throw new Error('Authentication required - please log in with your license key');
    }

    const { data: sessionData, error } = await supabase.rpc('validate_session_with_license', {
      session_token_input: sessionToken
    });

    if (error || !(sessionData as any)?.valid || !(sessionData as any)?.license_key) {
      throw new Error('Session invalid - please log in again');
    }

    return (sessionData as any).license_key;
  }

  // Get secure key from server-side derivation service
  private async getSecureKey(context: string): Promise<string> {
    const cacheKey = `${context}-${Math.floor(Date.now() / this.CACHE_DURATION)}`;
    
    // Check cache first
    const cached = this.keyCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return cached.key;
    }

    try {
      const licenseKey = await this.getLicenseKey();
      
      // Call server-side key derivation
      const { data, error } = await supabase.functions.invoke('secure-key-derivation', {
        body: {
          license_key: licenseKey,
          context: context,
          operation: 'derive'
        }
      });

      if (error || !data?.success || !data?.derived_key) {
        throw new Error(data?.error || 'Server-side key derivation failed');
      }

      // Cache the derived key with expiration
      this.keyCache.set(cacheKey, {
        key: data.derived_key,
        expires: Date.now() + this.CACHE_DURATION
      });

      return data.derived_key;
      
    } catch (error) {
      throw new Error(`Secure key retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Convert string to base64url (URL-safe)
  private toBase64Url(buffer: ArrayBuffer): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  // Convert base64url back to ArrayBuffer
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

  // Client-side encryption using server-derived key
  async encrypt(plaintext: string, context: string = 'url'): Promise<EncryptionResult> {
    try {
      // For maximum security, use server-side encryption
      const licenseKey = await this.getLicenseKey();
      
      const { data, error } = await supabase.functions.invoke('secure-key-derivation', {
        body: {
          license_key: licenseKey,
          context: context,
          operation: 'encrypt',
          data: plaintext
        }
      });

      if (error || !data?.success || !data?.encrypted_data) {
        throw new Error(data?.error || 'Server-side encryption failed');
      }

      return {
        ciphertext: data.encrypted_data,
        success: true
      };
      
    } catch (error) {
      return {
        ciphertext: '',
        success: false,
        error: `Secure encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Client-side decryption using server-derived key
  async decrypt(encryptedData: string, context: string = 'url'): Promise<DecryptionResult> {
    try {
      // For maximum security, use server-side decryption
      const licenseKey = await this.getLicenseKey();
      
      const { data, error } = await supabase.functions.invoke('secure-key-derivation', {
        body: {
          license_key: licenseKey,
          context: context,
          operation: 'decrypt',
          data: encryptedData
        }
      });

      if (error || !data?.success || !data?.decrypted_data) {
        throw new Error(data?.error || 'Server-side decryption failed');
      }

      return {
        plaintext: data.decrypted_data,
        success: true
      };
      
    } catch (error) {
      return {
        plaintext: '',
        success: false,
        error: `Secure decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  // Hybrid encryption for backward compatibility (uses server-derived key)
  async hybridEncrypt(plaintext: string, context: string = 'url'): Promise<string> {
    try {
      const keyBase64 = await this.getSecureKey(context);
      const encoder = new TextEncoder();
      const data = encoder.encode(plaintext);
      
      // Convert base64 key to ArrayBuffer
      const keyBuffer = this.fromBase64Url(keyBase64);
      
      // Import key for AES-GCM
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['encrypt']
      );
      
      // Generate nonce and salt
      const nonce = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));
      
      // Encrypt with AES-GCM
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: nonce,
          additionalData: salt
        },
        key,
        data
      );

      // Create result object
      const result = {
        ciphertext: this.toBase64Url(encrypted.slice(0, -16)),
        nonce: this.toBase64Url(nonce),
        salt: this.toBase64Url(salt),
        timestamp: Date.now(),
        authTag: this.toBase64Url(encrypted.slice(-16))
      };

      return `${result.ciphertext}.${result.nonce}.${result.salt}.${result.timestamp}.${result.authTag}`;
      
    } catch (error) {
      throw new Error(`Hybrid encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Hybrid decryption for backward compatibility (uses server-derived key)
  async hybridDecrypt(encryptedData: string, context: string = 'url'): Promise<string> {
    try {
      const parts = encryptedData.split('.');
      if (parts.length !== 5) {
        throw new Error('Invalid encrypted data format');
      }

      const [ciphertext, nonceStr, saltStr, timestampStr, authTagStr] = parts;
      
      // Parse components
      const ciphertextBuffer = this.fromBase64Url(ciphertext);
      const nonce = new Uint8Array(this.fromBase64Url(nonceStr));
      const salt = new Uint8Array(this.fromBase64Url(saltStr));
      const timestamp = parseInt(timestampStr);
      const authTag = new Uint8Array(this.fromBase64Url(authTagStr));

      // Check timestamp (7 days max age)
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp > maxAge) {
        throw new Error('Encrypted data has expired');
      }

      // Get server-derived key
      const keyBase64 = await this.getSecureKey(context);
      const keyBuffer = this.fromBase64Url(keyBase64);
      
      const key = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );

      // Reconstruct full encrypted data
      const fullEncrypted = new Uint8Array(ciphertextBuffer.byteLength + authTag.length);
      fullEncrypted.set(new Uint8Array(ciphertextBuffer));
      fullEncrypted.set(authTag, ciphertextBuffer.byteLength);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: nonce,
          additionalData: salt
        },
        key,
        fullEncrypted
      );

      return new TextDecoder().decode(decrypted);
      
    } catch (error) {
      throw new Error(`Hybrid decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Clean up cached keys
  clearCache(): void {
    this.keyCache.clear();
  }

  // Clean up old cached keys
  cleanupExpiredKeys(): void {
    const now = Date.now();
    for (const [key, value] of this.keyCache.entries()) {
      if (value.expires <= now) {
        this.keyCache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const secureEncryption = new SecureEncryptionService();

// Convenience functions for backward compatibility with enhanced security
export const secureEncrypt = (text: string, context: string = 'url'): Promise<string> => {
  return secureEncryption.encrypt(text, context).then(result => {
    if (!result.success) {
      throw new Error(result.error || 'Encryption failed');
    }
    return result.ciphertext;
  });
};

export const secureDecrypt = (encryptedText: string, context: string = 'url'): Promise<string> => {
  return secureEncryption.decrypt(encryptedText, context).then(result => {
    if (!result.success) {
      throw new Error(result.error || 'Decryption failed');
    }
    return result.plaintext;
  });
};

// Hybrid functions for gradual migration
export const hybridEncrypt = secureEncryption.hybridEncrypt.bind(secureEncryption);
export const hybridDecrypt = secureEncryption.hybridDecrypt.bind(secureEncryption);
