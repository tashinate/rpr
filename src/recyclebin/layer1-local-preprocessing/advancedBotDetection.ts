// Note: EmailScannerDetection was moved to different location - update path if restoring
import { BotDetectionResult } from './types';

interface BehaviorAnalysis {
  requestTiming: number;
  headerConsistency: number;
  interactionPattern: number;
  fingerprintVariation: number;
}

interface HttpHeaderAnalysis {
  userAgent: string;
  acceptHeaders: string[];
  acceptLanguage: string;
  acceptEncoding: string;
  hasRealBrowserHeaders: boolean;
  connectionType: string;
}

export class AdvancedBotDetection {
  // private emailScanner = new EmailScannerDetection(); // Commented out - update import if restoring
  private requestHistory: Map<string, any[]> = new Map();

  constructor() {
    // Clean up old data every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  async performAdvancedDetection(
    ip: string, 
    userAgent: string, 
    headers?: Record<string, string>
  ): Promise<BotDetectionResult> {
    
    // Phase 1: Email Scanner Detection (highest priority) - DISABLED IN RECYCLEBIN
    const scannerResult = { isScanner: false }; // this.emailScanner.detectEmailScanner(userAgent);
    if (scannerResult.isScanner) {
      return {
        isBot: false, // Email scanners are legitimate
        confidence: 100,
        action: 'scanner_response',
        hasNoHumanActivity: false,
        isRepeatedVisitor: false,
        userAgentSuspicious: false,
        fingerprintSuspicious: false,
        behaviorScore: 0,
        alienScore: 0,
        localScore: 0,
        scannerType: 'disabled',
        scannerContent: 'Email scanner detection disabled in recyclebin'
      };
    }

    // Phase 2: Behavioral Analysis
    const behaviorAnalysis = this.analyzeBehavior(ip, headers || {});
    
    // Phase 3: HTTP Header Analysis  
    const headerAnalysis = this.analyzeHttpHeaders(headers || {});
    
    // Phase 4: Pattern-based Scoring
    const patternScore = this.calculatePatternScore(
      userAgent, 
      behaviorAnalysis, 
      headerAnalysis
    );
    
    // Phase 5: Overall Confidence Calculation
    const confidence = this.calculateOverallConfidence(
      patternScore,
      behaviorAnalysis,
      headerAnalysis,
      scannerResult
    );
    
    // Phase 6: Action Determination
    const action = this.determineAction(confidence, scannerResult);
    
    return {
      isBot: confidence > 70,
      confidence,
      action,
      hasNoHumanActivity: behaviorAnalysis.interactionPattern > 60,
      isRepeatedVisitor: behaviorAnalysis.requestTiming > 50,
      userAgentSuspicious: patternScore > 40,
      fingerprintSuspicious: behaviorAnalysis.fingerprintVariation > 70,
      behaviorScore: Math.round((behaviorAnalysis.requestTiming + behaviorAnalysis.interactionPattern) / 2),
      alienScore: 0, // Will be set by external API
      localScore: patternScore
    };
  }

  private analyzeBehavior(ip: string, headers: Record<string, string>): BehaviorAnalysis {
    const now = Date.now();
    const history = this.requestHistory.get(ip) || [];
    
    // Add current request
    history.push({
      timestamp: now,
      headers,
      userAgent: headers['user-agent'] || ''
    });
    
    // Keep only last 10 requests
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.requestHistory.set(ip, history);
    
    // Analyze request timing
    let requestTiming = 0;
    if (history.length > 1) {
      const intervals = [];
      for (let i = 1; i < history.length; i++) {
        intervals.push(history[i].timestamp - history[i-1].timestamp);
      }
      
      // Check for too regular intervals (bot-like)
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((sum, interval) => {
        return sum + Math.pow(interval - avgInterval, 2);
      }, 0) / intervals.length;
      
      if (variance < 1000 && avgInterval < 5000) {
        requestTiming = 80; // Very regular, fast requests
      } else if (variance < 5000) {
        requestTiming = 40; // Somewhat regular
      }
    }
    
    // Analyze header consistency
    let headerConsistency = 0;
    if (history.length > 2) {
      const headerSets = history.map(req => JSON.stringify(req.headers));
      const uniqueHeaders = new Set(headerSets);
      if (uniqueHeaders.size === 1) {
        headerConsistency = 70; // Identical headers across requests
      } else if (uniqueHeaders.size < history.length / 2) {
        headerConsistency = 40; // Some variation but still suspicious
      }
    }
    
    return {
      requestTiming,
      headerConsistency,
      interactionPattern: requestTiming > 50 ? 60 : 20,
      fingerprintVariation: headerConsistency > 50 ? 80 : 30
    };
  }

  private analyzeHttpHeaders(headers: Record<string, string>): HttpHeaderAnalysis {
    const userAgent = headers['user-agent'] || '';
    const acceptHeaders = (headers['accept'] || '').split(',').map(h => h.trim());
    const acceptLanguage = headers['accept-language'] || '';
    const acceptEncoding = headers['accept-encoding'] || '';
    const connectionType = headers['connection'] || '';
    
    // Check for real browser headers
    const hasRealBrowserHeaders = !!(
      acceptHeaders.length > 0 &&
      acceptLanguage &&
      acceptEncoding &&
      userAgent.length > 50
    );
    
    return {
      userAgent,
      acceptHeaders,
      acceptLanguage,
      acceptEncoding,
      hasRealBrowserHeaders,
      connectionType
    };
  }

  private calculatePatternScore(
    userAgent: string,
    behavior: BehaviorAnalysis,
    headers: HttpHeaderAnalysis
  ): number {
    let score = 0;
    
    // User agent analysis
    if (!userAgent || userAgent.length < 20) {
      score += 40;
    } else if (userAgent.includes('bot') || userAgent.includes('crawler')) {
      score += 60;
    } else if (userAgent.includes('curl') || userAgent.includes('wget')) {
      score += 80;
    }
    
    // Header analysis
    if (!headers.hasRealBrowserHeaders) {
      score += 30;
    }
    
    if (headers.acceptHeaders.length === 0) {
      score += 25;
    }
    
    // Behavioral patterns
    score += behavior.requestTiming * 0.3;
    score += behavior.headerConsistency * 0.2;
    score += behavior.interactionPattern * 0.1;
    
    return Math.min(score, 100);
  }

  private calculateOverallConfidence(
    patternScore: number,
    behavior: BehaviorAnalysis,
    headers: HttpHeaderAnalysis,
    scannerResult: any
  ): number {
    let confidence = patternScore;
    
    // Adjust based on behavioral analysis
    if (behavior.requestTiming > 70) confidence += 15;
    if (behavior.headerConsistency > 60) confidence += 10;
    if (behavior.fingerprintVariation > 80) confidence += 5;
    
    // Adjust based on headers
    if (!headers.hasRealBrowserHeaders) confidence += 20;
    if (headers.userAgent.length < 30) confidence += 15;
    
    return Math.min(confidence, 100);
  }

  private determineAction(confidence: number, scannerResult: any): string {
    if (scannerResult.isScanner) {
      return 'scanner_response';
    }
    
    if (confidence > 90) {
      return 'redirect';
    } else if (confidence > 70) {
      return 'trap';
    } else if (confidence > 40) {
      return 'decoy';
    } else {
      return 'allow';
    }
  }

  cleanup(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    
    for (const [ip, history] of this.requestHistory.entries()) {
      const recentHistory = history.filter(req => 
        now - req.timestamp < oneHour
      );
      
      if (recentHistory.length === 0) {
        this.requestHistory.delete(ip);
      } else {
        this.requestHistory.set(ip, recentHistory);
      }
    }
  }
}

export const advancedBotDetection = new AdvancedBotDetection();
