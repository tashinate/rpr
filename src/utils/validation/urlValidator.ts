
import { centralizedUrlProcessor } from '../services/centralizedUrlProcessor';

export const validateRedirectUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return false;
    }
    
    const blockedDomains = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1'
    ];
    
    if (blockedDomains.some(domain => urlObj.hostname.includes(domain))) {
      return false;
    }
    
    if (urlObj.hostname.length === 0) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Number to URL mapping for legacy support
const numberToUrlMap: { [key: string]: string } = {
  '1': 'https://google.com',
  '2': 'https://github.com',
  '3': 'https://stackoverflow.com',
  '4': 'https://developer.mozilla.org',
  '5': 'https://tailwindcss.com'
};

export const decodeUrlByFormat = async (input: string): Promise<string> => {
  // Try numerical format first
  if (/^\d+$/.test(input)) {
    const result = numberToUrlMap[input] || 'https://en.wikipedia.org/wiki/Special:Random';
    console.log('📊 Numerical format decoded to:', result);
    return result;
  }
  
  // Try plain URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    console.log('🌐 Plain URL detected:', input);
    return input;
  }
  
  // Use centralized processor for all other formats
  try {
    const result = await centralizedUrlProcessor.processUrl(input);
    if (result.success) {
      console.log(`✅ Centralized processor SUCCESS (${result.method}):`, result.originalUrl);
      return result.originalUrl;
    }
  } catch (error) {
    console.log('❌ Centralized processor failed:', error);
  }
  
  // Default fallback
  console.log('⚠️ Using fallback URL');
  return 'https://en.wikipedia.org/wiki/Special:Random';
};

// IP-based URL rotation - disabled to prevent modification
export const getRotatedUrlByIP = (baseUrl: string, ip: string): string => {
  return baseUrl;
};

export const isValidHttpUrl = (string: string): boolean => {
  try {
    const url = new URL(string);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};
