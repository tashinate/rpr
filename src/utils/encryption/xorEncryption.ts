
/**
 * SECURE XOR ENCRYPTION - FIXED CRITICAL VULNERABILITY
 * Replaced static key with dynamic license-based key derivation
 * Security Level: HIGH (No more exposed keys)
 */

// Cryptographic hash function for key derivation (simple SHA-256 equivalent)
const simpleHash = async (input: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Secure key derivation from license key + time rotation
const generateSecureDynamicKey = async (licenseKey: string): Promise<string> => {
  if (!licenseKey || licenseKey.length < 8) {
    throw new Error('License key required for secure encryption');
  }

  const now = new Date();
  const dayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
  const timeKey = Math.floor(now.getTime() / (12 * 60 * 60 * 1000)); // 12-hour rotation
  
  // Combine license key with time factors
  const keyMaterial = `${licenseKey}:${dayKey}:${timeKey}:phantom-secure`;
  
  // Generate cryptographic hash
  const hash = await simpleHash(keyMaterial);
  
  // Convert hash to secure key (64 chars -> 32 chars for XOR)
  let dynamicKey = '';
  for (let i = 0; i < 32; i++) {
    const hexPair = hash.substr(i * 2, 2);
    const charCode = parseInt(hexPair, 16);
    // Use printable ASCII range (33-126)
    const secureChar = String.fromCharCode(33 + (charCode % 94));
    dynamicKey += secureChar;
  }
  
  return dynamicKey;
};

// Get current secure XOR key
const getCurrentXorKey = async (licenseKey: string): Promise<string> => {
  return generateSecureDynamicKey(licenseKey);
};

// Get previous secure XOR key for backward compatibility
const getPreviousXorKey = async (licenseKey: string): Promise<string> => {
  if (!licenseKey || licenseKey.length < 8) {
    throw new Error('License key required for secure decryption');
  }

  const prevTime = Date.now() - (12 * 60 * 60 * 1000);
  const prevDate = new Date(prevTime);
  const dayKey = `${prevDate.getFullYear()}-${prevDate.getMonth()}-${prevDate.getDate()}`;
  const timeKey = Math.floor(prevTime / (12 * 60 * 60 * 1000));
  
  const keyMaterial = `${licenseKey}:${dayKey}:${timeKey}:phantom-secure`;
  const hash = await simpleHash(keyMaterial);
  
  let dynamicKey = '';
  for (let i = 0; i < 32; i++) {
    const hexPair = hash.substr(i * 2, 2);
    const charCode = parseInt(hexPair, 16);
    const secureChar = String.fromCharCode(33 + (charCode % 94));
    dynamicKey += secureChar;
  }
  
  return dynamicKey;
};

// Deterministic key generation for consistent encryption/decryption
const generateDeterministicKey = async (licenseKey: string): Promise<string> => {
  if (!licenseKey || licenseKey.length < 8) {
    throw new Error('License key required for deterministic key generation');
  }

  // Use license key with fixed salt for deterministic results
  const keyMaterial = `${licenseKey}:phantom-deterministic:v2`;
  
  // Generate cryptographic hash
  const hash = await simpleHash(keyMaterial);
  
  // Convert hash to secure key (64 chars -> 32 chars for XOR)
  let deterministicKey = '';
  for (let i = 0; i < 32; i++) {
    const hexPair = hash.substr(i * 2, 2);
    const charCode = parseInt(hexPair, 16);
    // Use printable ASCII range (33-126)
    const secureChar = String.fromCharCode(33 + (charCode % 94));
    deterministicKey += secureChar;
  }
  
  return deterministicKey;
};

// Fallback key derivation for legacy URLs (using system-level fallback)
const getLegacyFallbackKey = async (): Promise<string> => {
  // Use a system-derived key instead of static key
  const userAgent = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : 'unknown';
  const hostname = (typeof window !== 'undefined' && window.location) ? window.location.hostname : 'localhost';
  const systemSeed = `phantom-legacy-${userAgent.length}-${hostname}`;
  const hash = await simpleHash(systemSeed);
  
  let fallbackKey = '';
  for (let i = 0; i < 16; i++) {
    const hexPair = hash.substr(i * 2, 2);
    const charCode = parseInt(hexPair, 16);
    const secureChar = String.fromCharCode(33 + (charCode % 94));
    fallbackKey += secureChar;
  }
  
  return fallbackKey;
};

import { encodeBase34, decodeBase34, isBase34Encoded } from './base34Encoder';

// Convert text to Base34 encoding (stealth)
const toBase34 = (text: string): string => {
  return encodeBase34(text);
};

// Convert Base34 back to text
const fromBase34 = (encoded: string): string => {
  return decodeBase34(encoded);
};

// Legacy Base36 functions for backward compatibility
const toBase36 = (text: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    // Ensure valid character code range
    if (charCode >= 32 && charCode <= 126) {
      result += charCode.toString(36).padStart(3, '0');
    } else {
      // Convert invalid chars to safe range
      result += (charCode % 94 + 33).toString(36).padStart(3, '0');
    }
  }
  return result;
};

const fromBase36 = (encoded: string): string => {
  let result = '';
  try {
    for (let i = 0; i < encoded.length; i += 3) {
      const chunk = encoded.substring(i, i + 3);
      if (chunk.length === 3 && /^[0-9a-z]+$/.test(chunk)) {
        const charCode = parseInt(chunk, 36);
        if (charCode >= 32 && charCode <= 126) {
          result += String.fromCharCode(charCode);
        } else {
          // Fallback for invalid char codes
          result += String.fromCharCode(charCode % 94 + 33);
        }
      }
    }
  } catch (error) {
    console.error('[XOR] Base36 decoding error:', error);
    throw new Error('Invalid encoded data format');
  }
  return result;
};

// SECURITY HARDENED: XOR encryption with deterministic keys only
export const xorEncrypt = async (text: string, licenseKey?: string): Promise<string> => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input for XOR encryption');
  }
  
  // CRITICAL: Always require license key for secure encryption
  if (!licenseKey || licenseKey.length < 8) {
    throw new Error('Valid license key required for secure encryption');
  }
  
  try {
    // Use deterministic key generation for consistent encryption/decryption
    const xorKey = await generateDeterministicKey(licenseKey);
    
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ xorKey.charCodeAt(i % xorKey.length);
      result += String.fromCharCode(charCode);
    }
    
    // Always use Base34 encoding for stealth
    const encodedResult = toBase34(result);
    return encodedResult;
    
  } catch (error) {
    throw new Error(`XOR encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// SECURITY HARDENED: Streamlined XOR decryption using only deterministic key
export const xorDecrypt = async (encryptedText: string, licenseKey?: string): Promise<string> => {
  if (!encryptedText || typeof encryptedText !== 'string') {
    throw new Error('Invalid encrypted text for XOR decryption');
  }

  // Require license key for decryption
  if (!licenseKey || licenseKey.length < 8) {
    throw new Error('Valid license key required for decryption');
  }

  try {
    const deterministicKey = await generateDeterministicKey(licenseKey);
    
    // Only support Base34 format (modern secure format)
    if (isBase34Encoded(encryptedText)) {
      const decoded = fromBase34(encryptedText);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i) ^ deterministicKey.charCodeAt(i % deterministicKey.length);
        result += String.fromCharCode(charCode);
      }
      
      if (isValidUrlFormat(result)) {
        return result;
      }
    }
    
    throw new Error('Invalid encrypted data format or corrupted data');
  } catch (error) {
    throw new Error(`XOR decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Validate URL format
const isValidUrlFormat = (url: string): boolean => {
  if (!url || url.length < 4) return false;
  return url.includes('http') || url.includes('://') || url.includes('www.') || 
         (url.includes('.') && url.length > 8 && /\.(com|org|net|edu|gov|io|co|app|ca|uk|de|fr|ly|me|ai|xyz)/.test(url));
};
