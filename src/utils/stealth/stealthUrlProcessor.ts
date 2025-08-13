/**
 * Enhanced Stealth URL Processor
 * Creates completely undetectable URLs using single-parameter embedding
 */
import { enhancedEncryption } from '../encryption/hybridEncryptionService';
import { generateSimpleParameters, extractFromParameters } from './parameterRotation';

export type EncryptionMode = 'aes' | 'xor' | 'auto';

/**
 * Generate a completely stealth Bing-style URL using single parameter embedding
 */
export async function generateStealthBingUrl(
  targetUrl: string, 
  mode: EncryptionMode = 'aes',
  baseUrl: string = window.location.origin
): Promise<string> {
  try {
    // Validate target URL
    if (!targetUrl || !isValidUrl(targetUrl)) {
      throw new Error('Invalid target URL provided');
    }

    // Encrypt the target URL with specified mode using enhanced encryption
    const encryptionResult = await enhancedEncryption.encryptUrl(targetUrl, 'temp-license', '', mode);
    const encryptedData = encryptionResult.encrypted;

    // Generate simple parameters with innocent names
    const dataParams = generateSimpleParameters(encryptedData);
    const dataParam = Object.keys(dataParams)[0];
    const encryptedValue = dataParams[dataParam];

    // Generate realistic search context
    const searchQuery = generateContextualQuery();
    
    // Build completely innocent Bing search parameters
    const stealthParams = {
      q: searchQuery,
      [dataParam]: encryptedValue, // Single parameter contains all data
      qs: 'n',
      form: 'QBRE',
      sp: '-1',
      pq: generateSearchQuery(),
      sc: '8-7',
      sk: '',
      cvid: generateCvid(),
      PC: 'U316',
      FORM: 'CHROMN'
    };

    const params = new URLSearchParams(stealthParams);
    
    // Construct the stealth URL
    const stealthUrl = `${baseUrl}/search?${params.toString()}`;

    return stealthUrl;
  } catch (error) {
    console.error('Failed to generate stealth URL:', error);
    throw error;
  }
}

/**
 * Extract encrypted data from stealth URL using intelligent detection
 */
export function extractStealthData(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Use simplified parameter extraction
    return extractFromParameters(urlObj.searchParams);
  } catch (error) {
    console.error('Failed to extract data from stealth URL:', error);
    return null;
  }
}

/**
 * Auto-decrypt URL without knowing the encryption mode
 */
export async function autoDecryptStealthUrl(url: string): Promise<string | null> {
  try {
    const encryptedData = extractStealthData(url);
    if (!encryptedData) {
      console.warn('No encrypted data found in URL');
      return null;
    }
    
    // Use enhanced encryption to decrypt - try AES first, then XOR
    try {
      const decryptedUrl = await enhancedEncryption.decryptUrl(encryptedData, 'temp-license', 'aes');
      return decryptedUrl;
    } catch (aesError) {
      try {
        const decryptedUrl = await enhancedEncryption.decryptUrl(encryptedData, 'temp-license', 'xor');
        return decryptedUrl;
      } catch (xorError) {
        console.warn('Both AES and XOR decryption failed');
        return null;
      }
    }
  } catch (error) {
    console.error('Failed to auto-decrypt from URL:', error);
    return null;
  }
}

/**
 * Generate a realistic search query
 */
function generateSearchQuery(): string {
  const queries = [
    'business intelligence dashboard',
    'market research analytics', 
    'financial planning tools',
    'customer service portal',
    'project management system',
    'data visualization charts',
    'sales performance metrics',
    'inventory management software'
  ];
  
  return queries[Math.floor(Math.random() * queries.length)];
}

/**
 * Generate contextual search query based on current trends
 */
function generateContextualQuery(): string {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  const businessHours = hour >= 9 && hour <= 17 && day >= 1 && day <= 5;
  
  const trendingQueries = businessHours ? [
    'quarterly business reports',
    'team productivity metrics',
    'client management system',
    'financial dashboard analytics',
    'project milestone tracking',
    'sales conversion rates'
  ] : [
    'weekend planning tools',
    'personal finance tracker',
    'online learning platforms',
    'entertainment streaming',
    'social media trends',
    'technology news updates'
  ];
  
  const timeBonus = Date.now() % trendingQueries.length;
  return trendingQueries[timeBonus];
}

/**
 * Generate a realistic CVID (correlation vector ID)
 */
function generateCvid(): string {
  const chars = 'ABCDEF0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate if a string is a proper URL
 */
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Generate example URLs for demonstration
 */
export function generateExampleUrls(): Array<{ name: string; url: string }> {
  return [
    { name: 'Google', url: 'https://google.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Stack Overflow', url: 'https://stackoverflow.com' },
    { name: 'Wikipedia', url: 'https://wikipedia.org' },
    { name: 'YouTube', url: 'https://youtube.com' }
  ];
}