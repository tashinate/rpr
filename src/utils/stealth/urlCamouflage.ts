/**
 * Advanced URL Camouflage System
 * Creates completely undetectable URLs that blend with normal traffic
 */

import { stealthEncodeBase34 } from '../encryption/stealthBase34';

interface StealthUrlOptions {
  pattern: 'search' | 'cdn' | 'analytics' | 'social' | 'news';
  region?: string;
  splitData?: boolean;
  noiseLevel?: 'low' | 'medium' | 'high';
}

interface CamouflageResult {
  url: string;
  pattern: string;
  dataMapping: Record<string, string>;
  recoveryInfo: string;
}

/**
 * Time-based parameter rotation
 */
function getTimeBasedParameters(): Record<string, string[]> {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  return {
    search: {
      morning: ['q', 'query', 'search'],
      afternoon: ['s', 'term', 'keyword'],
      evening: ['find', 'lookup', 'seek']
    }[hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening'],
    
    tracking: {
      weekday: ['tid', 'cid', 'gid'],
      weekend: ['uid', 'sid', 'pid']
    }[day >= 1 && day <= 5 ? 'weekday' : 'weekend'],
    
    session: {
      early: ['ssn', 'ses', 'ctx'],
      late: ['ref', 'src', 'org']
    }[hour < 12 ? 'early' : 'late']
  };
}

/**
 * Generate realistic contextual search queries
 */
function generateContextualQuery(region: string = 'US'): string {
  const trends = {
    US: [
      'artificial intelligence trends 2025',
      'sustainable energy solutions',
      'remote work productivity tools',
      'cybersecurity best practices',
      'digital marketing strategies',
      'cloud computing services',
      'data analytics platforms',
      'mobile app development'
    ],
    EU: [
      'gdpr compliance guidelines',
      'renewable energy investments',
      'digital transformation europe',
      'fintech innovations 2025',
      'healthcare technology trends',
      'smart city initiatives',
      'blockchain applications',
      'privacy protection tools'
    ],
    ASIA: [
      'e-commerce growth asia',
      'mobile payment systems',
      'smart manufacturing iot',
      'digital health solutions',
      'education technology platforms',
      'green technology investments',
      'supply chain optimization',
      'social media marketing'
    ]
  };
  
  const regionQueries = trends[region as keyof typeof trends] || trends.US;
  const timeBonus = Date.now() % regionQueries.length;
  
  return regionQueries[timeBonus];
}

/**
 * Split encrypted data across multiple parameters
 */
function splitEncryptedData(encryptedData: string, paramNames: string[]): Record<string, string> {
  const chunkSize = Math.ceil(encryptedData.length / paramNames.length);
  const chunks: Record<string, string> = {};
  
  for (let i = 0; i < paramNames.length; i++) {
    const start = i * chunkSize;
    const end = start + chunkSize;
    const chunk = encryptedData.slice(start, end);
    
    if (chunk) {
      chunks[paramNames[i]] = chunk;
    }
  }
  
  return chunks;
}

/**
 * Generate innocent-looking parameter values
 */
function generateInnocentValues(): Record<string, string> {
  const timestamp = Date.now();
  const random = Math.floor(timestamp / 100000) % 1000;
  
  return {
    // Browser-like
    dpr: (1 + (random % 3)).toString(),
    vp: `${800 + (random % 400)}x${600 + (random % 300)}`,
    hl: ['en', 'en-US', 'en-GB'][random % 3],
    
    // Analytics-like
    utmz: `${timestamp}.1.1.1.utmcsr=google|utmccn=(organic)|utmcmd=organic|utmctr=(not provided)`,
    utma: `${random}.${timestamp}.${timestamp}.${timestamp}.1.1`,
    
    // CDN-like
    cb: (timestamp % 100000).toString(),
    v: `1.${random % 100}.0`,
    fmt: ['json', 'jsonp', 'xml'][random % 3],
    
    // Social-like
    ref: ['fb', 'tw', 'li', 'yt'][random % 4],
    src: ['organic', 'social', 'direct', 'email'][random % 4],
    
    // News-like
    cat: ['tech', 'business', 'science', 'world'][random % 4],
    sect: ['news', 'opinion', 'analysis', 'breaking'][random % 4]
  };
}

/**
 * Create camouflaged URL that's indistinguishable from normal traffic
 */
export function createCamouflageUrl(
  encryptedData: string,
  options: StealthUrlOptions = { pattern: 'search' }
): CamouflageResult {
  const baseUrl = window.location.origin;
  const timeParams = getTimeBasedParameters();
  const innocentValues = generateInnocentValues();
  const region = options.region || 'US';
  
  let url: string;
  let dataMapping: Record<string, string> = {};
  let recoveryInfo: string;
  
  switch (options.pattern) {
    case 'search': {
      const searchParam = timeParams.search[0];
      const trackingParam = timeParams.tracking[0];
      
      if (options.splitData) {
        // Split across multiple search-related parameters
        const splitParams = ['pq', 'oq', 'aqs'];
        dataMapping = splitEncryptedData(encryptedData, splitParams);
        
        const params = new URLSearchParams({
          q: generateContextualQuery(region),
          [searchParam]: generateContextualQuery(region),
          ...dataMapping,
          hl: innocentValues.hl,
          source: 'hp',
          ei: innocentValues.cb,
          iflsig: `A${innocentValues.v.replace('.', '')}`
        });
        
        recoveryInfo = `split:${splitParams.join(',')}`;
      } else {
        // Single parameter with innocent name
        const dataParam = ['aqs', 'ved', 'ei'][Date.now() % 3];
        dataMapping[dataParam] = encryptedData;
        
        const params = new URLSearchParams({
          q: generateContextualQuery(region),
          [searchParam]: generateContextualQuery(region),
          [dataParam]: encryptedData,
          [trackingParam]: innocentValues.utma,
          source: 'hp',
          hl: innocentValues.hl
        });
        
        recoveryInfo = `single:${dataParam}`;
      }
      
      url = `${baseUrl}/search?${new URLSearchParams(dataMapping).toString()}`;
      break;
    }
    
    case 'cdn': {
      const splitParams = ['cb', 'v', 'fmt'];
      dataMapping = splitEncryptedData(encryptedData, splitParams);
      
      const params = new URLSearchParams({
        ...dataMapping,
        t: Date.now().toString(),
        dpr: innocentValues.dpr,
        vp: innocentValues.vp
      });
      
      url = `${baseUrl}/api/v1/data?${params.toString()}`;
      recoveryInfo = `cdn:${splitParams.join(',')}`;
      break;
    }
    
    case 'analytics': {
      const splitParams = ['utmz', 'utma', 'utmb'];
      dataMapping = splitEncryptedData(encryptedData, splitParams);
      
      const params = new URLSearchParams({
        ...dataMapping,
        tid: innocentValues.cb,
        cid: innocentValues.utma,
        t: 'pageview'
      });
      
      url = `${baseUrl}/analytics/collect?${params.toString()}`;
      recoveryInfo = `analytics:${splitParams.join(',')}`;
      break;
    }
    
    case 'social': {
      const splitParams = ['ref', 'src', 'utm'];
      dataMapping = splitEncryptedData(encryptedData, splitParams);
      
      const params = new URLSearchParams({
        ...dataMapping,
        fb: innocentValues.ref,
        tw: innocentValues.src,
        share: 'true'
      });
      
      url = `${baseUrl}/share?${params.toString()}`;
      recoveryInfo = `social:${splitParams.join(',')}`;
      break;
    }
    
    case 'news': {
      const splitParams = ['cat', 'sect', 'art'];
      dataMapping = splitEncryptedData(encryptedData, splitParams);
      
      const params = new URLSearchParams({
        ...dataMapping,
        category: innocentValues.cat,
        section: innocentValues.sect,
        view: 'full'
      });
      
      url = `${baseUrl}/news?${params.toString()}`;
      recoveryInfo = `news:${splitParams.join(',')}`;
      break;
    }
    
    default:
      throw new Error(`Unknown camouflage pattern: ${options.pattern}`);
  }
  
  return {
    url,
    pattern: options.pattern,
    dataMapping,
    recoveryInfo
  };
}

/**
 * Extract encrypted data from camouflaged URL
 */
export function extractFromCamouflage(url: string, recoveryInfo: string): string {
  try {
    const urlObj = new URL(url);
    const [type, paramInfo] = recoveryInfo.split(':');
    
    if (type === 'split') {
      const paramNames = paramInfo.split(',');
      let reconstructed = '';
      
      for (const param of paramNames) {
        const chunk = urlObj.searchParams.get(param);
        if (chunk) {
          reconstructed += chunk;
        }
      }
      
      return reconstructed;
    } else if (type === 'single') {
      return urlObj.searchParams.get(paramInfo) || '';
    } else {
      // For other types, try to extract from known parameters
      const paramNames = paramInfo.split(',');
      let reconstructed = '';
      
      for (const param of paramNames) {
        const chunk = urlObj.searchParams.get(param);
        if (chunk) {
          reconstructed += chunk;
        }
      }
      
      return reconstructed;
    }
  } catch (error) {
    console.error('Failed to extract data from camouflaged URL:', error);
    throw new Error('Invalid camouflaged URL format');
  }
}

/**
 * Detect if URL appears to be camouflaged
 */
export function isCamouflaged(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    const params = urlObj.searchParams;
    
    // Check for common camouflage patterns
    const patterns = [
      '/search', '/api/', '/analytics/', '/share', '/news'
    ];
    
    const hasPattern = patterns.some(pattern => path.startsWith(pattern));
    const hasMultipleParams = params.toString().split('&').length > 3;
    
    return hasPattern && hasMultipleParams;
  } catch {
    return false;
  }
}