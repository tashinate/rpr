// Types for behavioral analysis
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

// Types for fingerprinting
export interface FingerprintData {
  canvas: string;
  webgl: string;
  timezone: string;
  language: string;
  platform: string;
  cookieEnabled: boolean;
  doNotTrack: string;
  hardwareConcurrency: number;
  maxTouchPoints: number;
}

// Types for visitor tracking
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

// Bot detection result interface
export interface BotDetectionResult {
  isBot: boolean;
  confidence: number;
  action: string;
  hasNoHumanActivity: boolean;
  isRepeatedVisitor: boolean;
  userAgentSuspicious: boolean;
  fingerprintSuspicious: boolean;
  behaviorScore: number;
  alienScore: number;
  localScore: number;
  locationData?: {
    ip: string;
    country_name: string;
    country_code: string;
    isp: string;
    hostname: string;
  };
  scannerType?: string;
  scannerContent?: string;
}