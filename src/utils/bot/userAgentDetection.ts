export class UserAgentDetection {
  private readonly botPatterns = [
    /bot/i, /crawl/i, /spider/i, /slurp/i,
    /googlebot/i, /bingbot/i, /yandexbot/i,
    /facebookexternalhit/i, /twitterbot/i,
    /linkedinbot/i, /whatsapp/i, /telegram/i,
    /curl/i, /wget/i, /python/i, /java/i,
    /php/i, /go-http/i, /okhttp/i, /http/i,
    /headless/i, /phantom/i, /selenium/i,
    /webdriver/i, /playwright/i, /puppeteer/i
  ];

  private readonly suspiciousPatterns = [
    /^Mozilla\/5\.0$/i,                    // Too generic
    /^Mozilla\/4\.0$/i,                    // Outdated
    /^$/,                                  // Empty user agent
    /^.{0,10}$/,                          // Too short
    /^.{500,}$/,                          // Too long
    /python|requests|urllib/i,             // Programming libraries
    /postman|insomnia|httpie/i,           // API testing tools
    /scanner|probe|test/i,                // Security tools
    /^[a-zA-Z0-9\-_]{1,20}$/              // Simple alphanumeric only
  ];

  detectBotByUserAgent(userAgent: string): boolean {
    return this.botPatterns.some(pattern => pattern.test(userAgent));
  }

  isSuspiciousUserAgent(userAgent: string): boolean {
    if (!userAgent || userAgent.trim().length === 0) {
      return true;
    }

    // Check against suspicious patterns
    if (this.suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return true;
    }

    // Check for missing common browser indicators
    const hasCommonBrowserIndicators = /Chrome|Firefox|Safari|Edge|Opera/i.test(userAgent);
    const hasPlatformInfo = /Windows|Mac|Linux|Android|iOS/i.test(userAgent);
    
    // If it looks like a browser but missing key info, it's suspicious
    if (userAgent.includes('Mozilla') && (!hasCommonBrowserIndicators || !hasPlatformInfo)) {
      return true;
    }

    return false;
  }
}
