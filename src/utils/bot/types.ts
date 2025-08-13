
export interface VisitorData {
  ip: string;
  userAgent: string;
  timestamp: number;
  requestCount: number;
  lastRequest: number;
  hasHumanActivity: boolean;
  interactionCount?: number;
  firstVisit?: number;
}

export interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  hasNoHumanActivity: boolean;
  isRepeatedVisitor: boolean;
  userAgentSuspicious: boolean;
  fingerprintSuspicious: boolean;
  behaviorScore: number;
  alienScore: number;
  localScore: number;
  action: 'allow' | 'decoy' | 'trap' | 'redirect' | 'scanner_response' | 'undecided';
  locationData?: {
    ip: string;
    country_name?: string;
    country_code?: string;
    isp?: string;
    hostname?: string;
    city?: string;
    region?: string;
    timezone?: string;
  };
  // Enhanced email scanner detection
  emailScannerResult?: {
    isEmailScanner: boolean;
    scannerType: string | null;
    confidence: number;
    scannerDetails: {
      provider: string;
      service: string;
      characteristics: string[];
    } | null;
  };
  // Enhanced error handling and fallback tracking
  fallbackUsed?: boolean;
  errorType?: 'timeout' | 'error';
  zerobotApiUsage?: {
    total: number;
    left: number;
    plan: string;
  };
}

export interface LocationData {
  ip: string;
  country_name?: string;
  country_code?: string;
  isp?: string;
  hostname?: string;
  city?: string;
  region?: string;
  timezone?: string;
}

export interface BehaviorMetrics {
  mouseMovements: number;
  clicks: number;
  scrolls: number;
  keystrokes: number;
  focusEvents: number;
  timeOnPage: number;
  mouseEntropy: number;
  scrollEntropy: number;
}

export interface FingerprintData {
  canvas: string;
  webgl: string | null;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  hardwareConcurrency: number;
  maxTouchPoints: number;
}
