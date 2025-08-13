/**
 * Custom Base34 Encoder/Decoder for Stealth URLs
 * Uses a custom alphabet that avoids common encoding patterns
 * More stealthy than Base64 and harder to detect automatically
 */

// Custom stealth alphabet - avoids obvious patterns and common encoding chars
const STEALTH_ALPHABET = '23456789abcdefghijkmnpqrstuvwxyz';
const BASE = STEALTH_ALPHABET.length; // 34
const PADDING_CHAR = '9'; // Less obvious than '='

/**
 * Encodes a string to Base34 using our stealth alphabet
 */
export function encodeBase34(input: string): string {
  if (!input) return '';
  
  // Convert string to bytes
  const bytes = new TextEncoder().encode(input);
  
  // Convert bytes to big integer
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = num * 256n + BigInt(bytes[i]);
  }
  
  // Convert to base34
  if (num === 0n) return STEALTH_ALPHABET[0];
  
  let result = '';
  while (num > 0n) {
    result = STEALTH_ALPHABET[Number(num % BigInt(BASE))] + result;
    num = num / BigInt(BASE);
  }
  
  // Add padding to make length less predictable
  const targetLength = Math.ceil(result.length / 4) * 4;
  while (result.length < targetLength) {
    result += PADDING_CHAR;
  }
  
  return result;
}

/**
 * Decodes a Base34 string back to original text
 */
export function decodeBase34(encoded: string): string {
  if (!encoded) return '';
  
  // Remove padding
  const cleaned = encoded.replace(new RegExp(`${PADDING_CHAR}+$`), '');
  
  // Convert from base34 to big integer
  let num = 0n;
  for (let i = 0; i < cleaned.length; i++) {
    const charIndex = STEALTH_ALPHABET.indexOf(cleaned[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid Base34 character: ${cleaned[i]}`);
    }
    num = num * BigInt(BASE) + BigInt(charIndex);
  }
  
  // Convert big integer to bytes
  if (num === 0n) return '';
  
  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }
  
  // Convert bytes back to string
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/**
 * Check if a string appears to be Base34 encoded
 */
export function isBase34Encoded(input: string): boolean {
  if (!input || input.length < 4) return false;
  
  // Check if all characters are in our alphabet
  for (const char of input) {
    if (!STEALTH_ALPHABET.includes(char)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate a random Base34 string for testing
 */
export function generateRandomBase34(length: number = 16): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += STEALTH_ALPHABET[Math.floor(Math.random() * BASE)];
  }
  return result;
}