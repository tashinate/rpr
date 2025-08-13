import { xorEncrypt, xorDecrypt } from './xorEncryption';
import { aesEncryption } from './aesEncryption';
import { securityManager, logSecurityEvent } from '../security/securityManager';

export interface EncryptionResult {
  encrypted: string;
  mode: 'aes' | 'xor';
  context?: string;
}

export class EnhancedEncryption {
  private encryptionStats = {
    aesSuccessRate: 0.97,
    xorSuccessRate: 0.95,
    totalOperations: 0,
    aesOperations: 0,
    xorOperations: 0
  };

  async encryptUrl(
    originalUrl: string,
    licenseKey: string,
    template: string,
    mode: 'aes' | 'xor' | 'auto' = 'auto'
  ): Promise<EncryptionResult> {
    try {
      // Security validation
      if (!securityManager.isSessionValid()) {
        logSecurityEvent('encryption_attempt', 'Encryption attempted with invalid session', 'warning');
        throw new Error('Invalid session for encryption operation');
      }

      this.encryptionStats.totalOperations++;
      securityManager.updateActivity();
      
      // Store license key securely for this operation
      const keyId = `temp_encrypt_${Date.now()}`;
      securityManager.storeEncryptionKey(keyId, licenseKey);
      
      try {
        // Simplified mode selection - prefer XOR for security and consistency
        const finalMode = mode === 'auto' ? 'xor' : mode;

        if (finalMode === 'aes' && licenseKey && licenseKey.length >= 12) {
          try {
            const encrypted = await aesEncryption.encrypt(originalUrl, licenseKey);
            this.encryptionStats.aesOperations++;
            
            if (encrypted && encrypted.length > 10) {
              logSecurityEvent('encryption_success', 'AES encryption completed', 'info');
              return { encrypted, mode: 'aes', context: 'aes-primary' };
            }
          } catch (error) {
            logSecurityEvent('encryption_fallback', 'AES failed, using XOR', 'info', { error: error.message });
          }
        }

        // XOR encryption (primary secure method)
        const encrypted = await xorEncrypt(originalUrl, licenseKey);
        this.encryptionStats.xorOperations++;
        
        if (!encrypted || encrypted.length < 5) {
          throw new Error('XOR encryption failed - no result');
        }
        
        logSecurityEvent('encryption_success', 'XOR encryption completed', 'info');
        return { encrypted, mode: 'xor', context: 'xor-secure' };
        
      } finally {
        // Always clear the temporary key
        securityManager.clearEncryptionKey(keyId);
      }
      
    } catch (error) {
      logSecurityEvent('encryption_failure', 'All encryption methods failed', 'error', { error: error.message });
      throw new Error(`Encryption failure: ${error.message}`);
    }
  }

  // Intelligent encryption mode selection
  private selectOptimalEncryptionMode(url: string, licenseKey: string): 'aes' | 'xor' {
    // Prefer AES for high-value URLs and strong license keys
    if (licenseKey && licenseKey.length >= 16) {
      // Check URL characteristics
      const isHighValue = url.includes('bank') || url.includes('gov') || url.includes('secure');
      const isLongUrl = url.length > 100;
      
      // Use AES for high-value or complex URLs with strong keys
      if (isHighValue || isLongUrl || this.encryptionStats.aesSuccessRate > 0.9) {
        return 'aes';
      }
    }
    
    // Default to XOR for simpler cases or when AES isn't optimal
    return 'xor';
  }

  // Get encryption performance statistics
  getEncryptionStats() {
    return {
      ...this.encryptionStats,
      aesPercentage: this.encryptionStats.totalOperations > 0 ? 
        (this.encryptionStats.aesOperations / this.encryptionStats.totalOperations * 100).toFixed(1) : '0.0',
      xorPercentage: this.encryptionStats.totalOperations > 0 ? 
        (this.encryptionStats.xorOperations / this.encryptionStats.totalOperations * 100).toFixed(1) : '0.0'
    };
  }

  async decryptUrl(
    encryptedUrl: string,
    licenseKey: string,
    mode: 'aes' | 'xor'
  ): Promise<string> {
    if (mode === 'aes') {
      try {
        const result = await aesEncryption.decrypt(encryptedUrl, licenseKey);
        if (result.success) return result.plaintext;
        throw new Error('AES decryption failed');
      } catch {
        return xorDecrypt(encryptedUrl);
      }
    }
    return xorDecrypt(encryptedUrl);
  }

  detectEncryptionMode(encrypted: string): 'aes' | 'xor' {
    // Improved Base34 detection for AES vs XOR
    const { isBase34Encoded } = require('./base34Encoder');
    
    // Base34 encoded strings indicate current format
    if (isBase34Encoded(encrypted)) {
      // AES typically produces longer, more complex structures
      return encrypted.length > 80 && encrypted.includes('9') ? 'aes' : 'xor';
    }
    
    // Legacy detection for older formats
    return encrypted.length > 100 && encrypted.includes('.') ? 'aes' : 'xor';
  }
}

export const enhancedEncryption = new EnhancedEncryption();
export const hybridEncryption = enhancedEncryption; // Alias for backward compatibility
