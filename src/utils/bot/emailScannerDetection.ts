
import { BotDetectionResult } from './types';

export interface EmailScannerResult {
  isEmailScanner: boolean;
  scannerType: string | null;
  confidence: number;
  scannerDetails: {
    provider: string;
    service: string;
    characteristics: string[];
  } | null;
}

export class EmailScannerDetection {
  private emailScannerPatterns = {
    microsoft365: {
      userAgents: [
        /Microsoft-URLAnalyzer/i,
        /SafeLinks/i,
        /Microsoft Office/i,
        /Microsoft Outlook/i,
        /Microsoft-CryptoAPI/i,
        /Microsoft-WNS/i
      ],
      characteristics: [
        'rapid_sequential_requests',
        'no_javascript',
        'missing_browser_headers',
        'microsoft_specific_headers'
      ]
    },
    gmail: {
      userAgents: [
        /Gmail-ImageProxy/i,
        /GoogleImageProxy/i,
        /Google-Read-Aloud/i,
        /Google-Safety/i,
        /GoogleBot/i
      ],
      characteristics: [
        'image_proxy_requests',
        'google_specific_headers',
        'no_javascript',
        'rapid_link_scanning'
      ]
    },
    mimecast: {
      userAgents: [
        /Mimecast/i,
        /Mimecast-Security/i,
        /MC-Security/i
      ],
      characteristics: [
        'security_scanning_headers',
        'enterprise_proxy_behavior',
        'rapid_url_validation'
      ]
    },
    proofpoint: {
      userAgents: [
        /Proofpoint/i,
        /PPSecure/i,
        /ProofpointEssentials/i
      ],
      characteristics: [
        'security_validation',
        'threat_analysis_headers',
        'enterprise_security_scanner'
      ]
    },
    barracuda: {
      userAgents: [
        /Barracuda/i,
        /BarracudaNetworks/i,
        /Barracuda-Security/i
      ],
      characteristics: [
        'email_security_scanning',
        'threat_protection',
        'link_validation'
      ]
    },
    symantec: {
      userAgents: [
        /Symantec/i,
        /Norton/i,
        /SEP/i,
        /Symantec-Email-Security/i
      ],
      characteristics: [
        'antivirus_scanning',
        'email_protection',
        'url_reputation_check'
      ]
    },
    trendmicro: {
      userAgents: [
        /Trend Micro/i,
        /TrendMicro/i,
        /TMASE/i,
        /InterScan/i
      ],
      characteristics: [
        'threat_intelligence',
        'email_security',
        'web_reputation'
      ]
    },
    generic: {
      userAgents: [
        /Email.*Security/i,
        /Mail.*Scanner/i,
        /URL.*Analyzer/i,
        /Link.*Checker/i,
        /Security.*Scanner/i,
        /Threat.*Scanner/i,
        /Email.*Filter/i,
        /Anti.*Spam/i,
        /Mail.*Guard/i,
        /Email.*Gateway/i
      ],
      characteristics: [
        'generic_email_security',
        'automated_scanning',
        'security_validation'
      ]
    }
  };

  detectEmailScanner(userAgent: string, requestHeaders?: Record<string, string>): EmailScannerResult {
    if (!userAgent) {
      return {
        isEmailScanner: false,
        scannerType: null,
        confidence: 0,
        scannerDetails: null
      };
    }

    // Check each scanner type
    for (const [scannerType, config] of Object.entries(this.emailScannerPatterns)) {
      const matchResult = this.checkScannerMatch(userAgent, config, requestHeaders);
      
      if (matchResult.isMatch) {
        return {
          isEmailScanner: true,
          scannerType,
          confidence: matchResult.confidence,
          scannerDetails: {
            provider: this.getScannerProvider(scannerType),
            service: this.getScannerService(scannerType),
            characteristics: matchResult.characteristics
          }
        };
      }
    }

    // Check for behavioral patterns that suggest email scanner
    const behavioralScore = this.analyzeBehavioralPatterns(userAgent, requestHeaders);
    
    if (behavioralScore > 70) {
      return {
        isEmailScanner: true,
        scannerType: 'unknown_email_scanner',
        confidence: behavioralScore,
        scannerDetails: {
          provider: 'Unknown',
          service: 'Email Security Scanner',
          characteristics: ['behavioral_analysis_match']
        }
      };
    }

    return {
      isEmailScanner: false,
      scannerType: null,
      confidence: 0,
      scannerDetails: null
    };
  }

  private checkScannerMatch(
    userAgent: string, 
    config: any, 
    headers?: Record<string, string>
  ): { isMatch: boolean; confidence: number; characteristics: string[] } {
    let confidence = 0;
    const characteristics: string[] = [];

    // Check user agent patterns
    for (const pattern of config.userAgents) {
      if (pattern.test(userAgent)) {
        confidence += 40;
        characteristics.push('user_agent_match');
        break;
      }
    }

    // Check for missing common browser headers
    if (headers) {
      const commonBrowserHeaders = [
        'accept-language',
        'accept-encoding',
        'sec-fetch-dest',
        'sec-fetch-mode',
        'sec-fetch-site'
      ];

      const missingHeaders = commonBrowserHeaders.filter(header => !headers[header.toLowerCase()]);
      if (missingHeaders.length > 3) {
        confidence += 20;
        characteristics.push('missing_browser_headers');
      }
    }

    // Check for scanner-specific characteristics in user agent
    const scannerKeywords = [
      'crawler', 'bot', 'spider', 'scraper', 'scanner', 'analyzer',
      'security', 'protection', 'filter', 'gateway', 'proxy', 'guard'
    ];

    const userAgentLower = userAgent.toLowerCase();
    const keywordMatches = scannerKeywords.filter(keyword => userAgentLower.includes(keyword));
    
    if (keywordMatches.length > 0) {
      confidence += keywordMatches.length * 10;
      characteristics.push('scanner_keywords');
    }

    // Check for very generic or minimal user agents
    if (userAgent.length < 20 || userAgent.split(' ').length < 3) {
      confidence += 15;
      characteristics.push('minimal_user_agent');
    }

    return {
      isMatch: confidence > 30,
      confidence: Math.min(confidence, 95),
      characteristics
    };
  }

  private analyzeBehavioralPatterns(userAgent: string, headers?: Record<string, string>): number {
    let score = 0;

    // Very short or suspicious user agent
    if (userAgent.length < 15) {
      score += 30;
    }

    // Missing common browser capabilities
    if (!userAgent.includes('Mozilla') && !userAgent.includes('WebKit') && !userAgent.includes('Gecko')) {
      score += 25;
    }

    // No version numbers (common in automated tools)
    if (!/\d+\.\d+/.test(userAgent)) {
      score += 20;
    }

    // Headers analysis if available
    if (headers) {
      // Missing Accept header or very basic one
      const accept = headers['accept'] || headers['Accept'];
      if (!accept || accept === '*/*' || accept.split(',').length < 2) {
        score += 15;
      }

      // Missing or suspicious Accept-Language
      const acceptLang = headers['accept-language'] || headers['Accept-Language'];
      if (!acceptLang || acceptLang.length < 5) {
        score += 10;
      }
    }

    return Math.min(score, 95);
  }

  private getScannerProvider(scannerType: string): string {
    const providers: Record<string, string> = {
      microsoft365: 'Microsoft',
      gmail: 'Google',
      mimecast: 'Mimecast',
      proofpoint: 'Proofpoint',
      barracuda: 'Barracuda Networks',
      symantec: 'Broadcom (Symantec)',
      trendmicro: 'Trend Micro',
      generic: 'Unknown'
    };
    
    return providers[scannerType] || 'Unknown';
  }

  private getScannerService(scannerType: string): string {
    const services: Record<string, string> = {
      microsoft365: 'Microsoft 365 Defender',
      gmail: 'Gmail Advanced Protection',
      mimecast: 'Mimecast Email Security',
      proofpoint: 'Proofpoint Email Protection',
      barracuda: 'Barracuda Email Security',
      symantec: 'Symantec Email Security',
      trendmicro: 'Trend Micro Email Security',
      generic: 'Email Security Scanner'
    };
    
    return services[scannerType] || 'Email Security Scanner';
  }

  generateScannerResponse(scannerResult: EmailScannerResult): {
    action: 'allow' | 'scanner_response';
    responseType: string;
    content?: string;
  } {
    if (!scannerResult.isEmailScanner) {
      return { action: 'allow', responseType: 'normal' };
    }

    // Generate scanner-specific safe responses
    switch (scannerResult.scannerType) {
      case 'microsoft365':
        return {
          action: 'scanner_response',
          responseType: 'microsoft_safe',
          content: this.generateMicrosoftSafeResponse()
        };
      
      case 'gmail':
        return {
          action: 'scanner_response',
          responseType: 'gmail_safe',
          content: this.generateGmailSafeResponse()
        };
      
      case 'mimecast':
      case 'proofpoint':
      case 'barracuda':
        return {
          action: 'scanner_response',
          responseType: 'enterprise_safe',
          content: this.generateEnterpriseSafeResponse()
        };
      
      default:
        return {
          action: 'scanner_response',
          responseType: 'generic_safe',
          content: this.generateGenericSafeResponse()
        };
    }
  }

  private generateMicrosoftSafeResponse(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Content Verification</title>
    <meta name="robots" content="noindex,nofollow">
</head>
<body>
    <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
        <h2>Content Verification Complete</h2>
        <p>This link has been verified as safe by Microsoft 365 security systems.</p>
        <p>Status: <strong style="color: green;">SAFE</strong></p>
    </div>
</body>
</html>`;
  }

  private generateGmailSafeResponse(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Safe Content</title>
    <meta name="robots" content="noindex,nofollow">
</head>
<body style="margin: 0; padding: 20px; font-family: 'Google Sans', Arial, sans-serif;">
    <div style="max-width: 400px; margin: 0 auto; text-align: center;">
        <h3 style="color: #1a73e8;">Content Verified</h3>
        <p style="color: #5f6368;">This content has been scanned and verified as safe.</p>
    </div>
</body>
</html>`;
  }

  private generateEnterpriseSafeResponse(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Security Scan Complete</title>
    <meta name="robots" content="noindex,nofollow">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background: #f5f5f5;">
    <div style="max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px;">
        <h2 style="color: #2e7d32; margin-bottom: 20px;">Security Verification</h2>
        <p style="color: #424242; line-height: 1.5;">
            This URL has been processed by enterprise email security systems and determined to be safe.
        </p>
        <div style="margin-top: 20px; padding: 15px; background: #e8f5e8; border-radius: 4px;">
            <strong style="color: #2e7d32;">✓ VERIFIED SAFE</strong>
        </div>
    </div>
</body>
</html>`;
  }

  private generateGenericSafeResponse(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Verified Content</title>
    <meta name="robots" content="noindex,nofollow">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif;">
    <div style="text-align: center; margin-top: 50px;">
        <h2 style="color: #333;">Content Verified</h2>
        <p style="color: #666;">This content has been verified by email security systems.</p>
        <div style="margin-top: 20px; color: #28a745; font-weight: bold;">
            ✓ SAFE CONTENT
        </div>
    </div>
</body>
</html>`;
  }
}
