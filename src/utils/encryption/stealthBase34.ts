/**
 * Advanced Stealth Base34 Encoder with Dynamic Alphabet Rotation
 * Provides undetectable encoding with time-based rotation and noise injection
 */

// Static Base34 alphabet - no time rotation
const STATIC_ALPHABET = '23456789abcdefghijkmnpqrstuvwxyz';

/**
 * Advanced stealth encoding with rotation and noise
 */
export function stealthEncodeBase34(input: string): string {
  if (!input) return '';
  
  const alphabet = STATIC_ALPHABET;
  const base = alphabet.length;
  
  // Convert string to bytes
  const bytes = new TextEncoder().encode(input);
  
  // Convert bytes to big integer
  let num = 0n;
  for (let i = 0; i < bytes.length; i++) {
    num = num * 256n + BigInt(bytes[i]);
  }
  
  // Convert to base34 with static alphabet
  if (num === 0n) return alphabet[0];
  
  let result = '';
  while (num > 0n) {
    result = alphabet[Number(num % BigInt(base))] + result;
    num = num / BigInt(base);
  }
  
  // Add random padding for variety (but deterministic for same input)
  const inputHash = input.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const noiseLength = 2 + (inputHash % 3); // 2-4 characters
  const noiseChars = '999'; // Simple padding pattern
  
  // Add padding at the end
  result = result + noiseChars.slice(0, noiseLength);
  
  return result;
}

/**
 * Advanced stealth decoding with rotation and noise removal
 */
export function stealthDecodeBase34(encoded: string): string {
  if (!encoded) return '';
  
  const alphabet = STATIC_ALPHABET;
  const base = alphabet.length;
  
  // Remove padding (try removing 2-4 characters from end)
  let cleaned = encoded;
  for (let noiseLength = 2; noiseLength <= 4; noiseLength++) {
    const testCleaned = encoded.slice(0, -noiseLength);
    
    // Test if this works
    try {
      let num = 0n;
      for (let i = 0; i < testCleaned.length; i++) {
        const charIndex = alphabet.indexOf(testCleaned[i]);
        if (charIndex === -1) {
          throw new Error(`Invalid character: ${testCleaned[i]}`);
        }
        num = num * BigInt(base) + BigInt(charIndex);
      }
      
      // If we got here, this padding length works
      cleaned = testCleaned;
      break;
    } catch {
      // Try next padding length
      continue;
    }
  }
  
  // Convert from base34 to big integer
  let num = 0n;
  for (let i = 0; i < cleaned.length; i++) {
    const charIndex = alphabet.indexOf(cleaned[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid character: ${cleaned[i]}`);
    }
    num = num * BigInt(base) + BigInt(charIndex);
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
 * Generate contextual noise that looks like valid data
 */
export function generateContextualNoise(context: 'search' | 'tracking' | 'analytics' = 'search'): string {
  const alphabet = STATIC_ALPHABET;
  
  const patterns = {
    search: [8, 12, 16], // Search-like lengths
    tracking: [6, 10, 14], // Tracking-like lengths
    analytics: [4, 8, 12] // Analytics-like lengths
  };
  
  const lengths = patterns[context];
  const length = lengths[Math.floor(Math.random() * lengths.length)];
  
  let noise = '';
  for (let i = 0; i < length; i++) {
    noise += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  
  return noise;
}

/**
 * Check if encoded string is valid Base34
 */
export function isValidBase34(encoded: string): boolean {
  try {
    stealthDecodeBase34(encoded);
    return true;
  } catch {
    return false;
  }
}