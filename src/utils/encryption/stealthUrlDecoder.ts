import { enhancedEncryption } from './hybridEncryptionService';
import { xorDecrypt } from './xorEncryption';
import { decodeBase34, isBase34Encoded } from './base34Encoder';

export interface DecodingResult {
  originalUrl: string;
  decryptionMode: 'aes' | 'xor';
  isValid: boolean;
  metadata?: any;
}

export class StealthUrlDecoder {
  
  async decodeStealthUrl(
    encodedData: string,
    licenseKeyId: string,
    pattern?: string
  ): Promise<DecodingResult> {
    console.log('🔓 Starting decoding for data:', encodedData);
    
    // Try Base34 custom decryption first (only if actually Base34 encoded)
    if (isBase34Encoded(encodedData)) {
      console.log('🎯 Detected Base34 format, trying custom decryption');
      try {
        const customDecrypted = await this.tryCustomDecryption(encodedData);
        if (customDecrypted) {
          console.log('✅ Base34 custom decryption successful:', customDecrypted);
          return {
            originalUrl: customDecrypted,
            decryptionMode: 'xor',
            isValid: true,
            metadata: { base34Decryption: true }
          };
        }
      } catch (customError) {
        console.log('❌ Base34 custom decryption failed:', customError);
      }
    } else {
      console.log('📝 Not Base34 format, skipping custom decryption');
    }

    // Try standard decryption methods
    try {
      const detectedMode = enhancedEncryption.detectEncryptionMode(encodedData);
      console.log('🔍 Detected encryption mode:', detectedMode);
      
      try {
        const decrypted = await enhancedEncryption.decryptUrl(encodedData, licenseKeyId, detectedMode);
        console.log('✅ Standard decryption successful:', decrypted);
        return {
          originalUrl: decrypted,
          decryptionMode: detectedMode,
          isValid: true,
          metadata: { detectedMode: true }
        };
      } catch (error) {
        console.log('❌ Standard decryption failed, trying alternative mode');
        const alternativeMode = detectedMode === 'aes' ? 'xor' : 'aes';
        try {
          const decrypted = await enhancedEncryption.decryptUrl(encodedData, licenseKeyId, alternativeMode);
          console.log('✅ Alternative decryption successful:', decrypted);
          return {
            originalUrl: decrypted,
            decryptionMode: alternativeMode,
            isValid: true,
            metadata: { fallbackMode: true }
          };
        } catch {
          console.log('❌ Alternative decryption failed, trying XOR');
          const xorDecrypted = await xorDecrypt(encodedData, licenseKeyId);
          console.log('✅ XOR decryption result:', xorDecrypted);
          return {
            originalUrl: xorDecrypted,
            decryptionMode: 'xor',
            isValid: true,
            metadata: { directXOR: true }
          };
        }
      }
    } catch (error) {
      console.log('❌ All standard decryption methods failed');
      
      return {
        originalUrl: '',
        decryptionMode: 'xor',
        isValid: false,
        metadata: { error: error.message }
      };
    }
  }

  private async tryCustomDecryption(encodedData: string): Promise<string | null> {
    try {
      console.log(`🔍 [StealthDecoder] Trying custom decryption on: ${encodedData.substring(0, 50)}...`);
      
      // Method 1: Try Base34 decoding first (current stealth format)
      try {
        if (isBase34Encoded(encodedData)) {
          const decoded = decodeBase34(encodedData);
          console.log(`🔍 [StealthDecoder] Base34 decoded: ${decoded.substring(0, 100)}...`);
          
          // Check if it's a direct URL
          if (this.isValidUrl(decoded)) {
            console.log(`✅ [StealthDecoder] Direct URL found via Base34: ${decoded}`);
            return decoded;
          }
          
          // Check if it's structured data
          if (decoded.includes('.') && decoded.split('.').length >= 3) {
            console.log(`🔍 [StealthDecoder] Detected Base34 structured data`);
            const parts = decoded.split('.');
            for (let i = 0; i < parts.length; i++) {
              const part = parts[i];
              if (this.isValidUrl(part)) {
                console.log(`✅ [StealthDecoder] Found valid URL in Base34 part ${i}: ${part}`);
                return part;
              }
            }
          }
        }
      } catch (base34Error) {
        console.log(`❌ [StealthDecoder] Base34 decode failed: ${base34Error}`);
      }
      
      // REMOVED: Base64 decode method - not secure enough and easily reversible
      console.log(`🚫 [StealthDecoder] Base64 methods removed for security`);
      
      // Method 2: Try URL decoding only (no Base64)
      try {
        const urlDecoded = decodeURIComponent(encodedData);
        if (this.isValidUrl(urlDecoded)) {
          console.log(`✅ [StealthDecoder] Valid URL from URL decode: ${urlDecoded}`);
          return urlDecoded;
        }
      } catch (error) {
        console.log(`❌ [StealthDecoder] URL decoding failed: ${error}`);
      }
      
      console.log(`❌ [StealthDecoder] Custom decryption failed for: ${encodedData.substring(0, 30)}...`);
      return null;
    } catch (error) {
      console.log('❌ Custom decryption error:', error);
      return null;
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return url.includes('://') && (url.startsWith('http://') || url.startsWith('https://'));
    } catch {
      return false;
    }
  }

  extractEncryptedData(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const paramNames = ['doc', 'file', 'ref', 'id', 'token', 'data', 'content'];
      
      for (const param of paramNames) {
        const value = urlObj.searchParams.get(param);
        if (value && value.length > 10) return value;
      }
      
      const pathSegments = urlObj.pathname.split('/').filter(segment => segment.length > 10);
      if (pathSegments.length > 0) return pathSegments[pathSegments.length - 1];
      
      if (urlObj.hash && urlObj.hash.length > 10) return urlObj.hash.substring(1);
      
      return null;
    } catch {
      return null;
    }
  }

  isStealthUrl(url: string): boolean {
    return this.extractEncryptedData(url) !== null;
  }
}

export const stealthUrlDecoder = new StealthUrlDecoder();
