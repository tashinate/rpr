interface TelegramConfig {
  botToken: string;
  chatId: string;
}

interface VisitData {
  ip: string;
  location?: string;
  country?: string;
  countryCode?: string;
  isp?: string;
  userAgent: string;
  browserInfo?: string;
  isBot: boolean;
  timestamp: Date;
  visitCount?: number;
  todayVisits?: number;
  confidence?: number;
  action?: string;
  behaviorScore?: number;
  localScore?: number;
  alienScore?: number;
}

class TelegramNotifierService {
  private config: TelegramConfig | null = null;
  private visitCount = 0;
  private todayVisits = 0;

  setConfig(botToken: string, chatId: string) {
    this.config = { botToken, chatId };
    // No localStorage backup - database is the source of truth
  }

  constructor() {
    // No localStorage loading - database is the source of truth
  }

  loadConfig() {
    // No localStorage loading - database is the source of truth
  }

  private async getLocationData(ip: string, alienData?: any) {
    // Use AlienAPI data if available, otherwise fallback to ip-api
    if (alienData) {
      console.log('🌍 Using AlienAPI location data:', alienData);
      return {
        location: `${alienData.country_name}`,
        country: alienData.country_name,
        countryCode: alienData.country_code,
        isp: alienData.isp
      };
    }

    try {
      console.log('🌍 Fetching location data from fallback API for IP:', ip);
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      console.log('🌍 Fallback API response:', data);
      return {
        location: `${data.city || 'Unknown'}, ${data.country_name || 'Unknown'}`,
        country: data.country_name,
        countryCode: data.country,
        isp: data.org
      };
    } catch (error) {
      console.error('🌍 Location API failed:', error);
      return {
        location: 'Unknown',
        country: 'Unknown',
        countryCode: 'XX',
        isp: 'Unknown'
      };
    }
  }

  private getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    // Convert country code to flag emoji using Unicode regional indicator symbols
    const upperCode = countryCode.toUpperCase();
    const codePoints = upperCode.split('').map(char => 
      127397 + char.charCodeAt(0)
    );
    return String.fromCodePoint(...codePoints);
  }

  private updateVisitCounts() {
    // Get current total visits
    const totalVisits = parseInt(localStorage.getItem('total_visits') || '0') + 1;
    localStorage.setItem('total_visits', totalVisits.toString());
    this.visitCount = totalVisits;
    
    const today = new Date().toDateString();
    const lastVisitDate = localStorage.getItem('last_visit_date');
    
    if (lastVisitDate === today) {
      this.todayVisits = parseInt(localStorage.getItem('today_visits') || '0') + 1;
    } else {
      this.todayVisits = 1;
      localStorage.setItem('last_visit_date', today);
    }
    
    localStorage.setItem('today_visits', this.todayVisits.toString());
  }

  private getBrowserInfo(userAgent: string): string {
    console.log('🔍 Detecting browser for User-Agent:', userAgent);
    
    // Enhanced browser detection with more robust patterns
    // Order matters! Most specific patterns first
    const browsers = [
      { 
        name: 'Edge', 
        // Comprehensive Edge detection - all variants including new Chromium Edge
        pattern: /\b(?:Edg|Edge|EdgA|EdgiOS|EdgeHTML)\b/i,
        versionPattern: /\b(?:Edg|Edge|EdgA|EdgiOS|EdgeHTML)\/([\d.]+)/i,
        icon: '🔷' 
      },
      { 
        name: 'Opera', 
        // Opera detection including Opera GX and mobile variants
        pattern: /\b(?:OPR|Opera|OPiOS)\b/i,
        versionPattern: /\b(?:OPR|Opera|OPiOS)\/([\d.]+)/i,
        icon: '🎭' 
      },
      { 
        name: 'Firefox', 
        // Firefox detection including mobile variants
        pattern: /\b(?:Firefox|FxiOS)\b/i,
        versionPattern: /\b(?:Firefox|FxiOS)\/([\d.]+)/i,
        icon: '🦊' 
      },
      { 
        name: 'Safari', 
        // Safari detection - must NOT contain Chrome or Edge indicators
        pattern: /\bSafari\b/i,
        versionPattern: /\bVersion\/([\d.]+)/i,
        icon: '🍃',
        exclude: /\b(?:Chrome|Chromium|Edg|Edge|OPR|Opera)\b/i
      },
      { 
        name: 'Chrome', 
        // Chrome detection - must NOT contain Edge or Opera indicators
        pattern: /\b(?:Chrome|Chromium)\b/i,
        versionPattern: /\b(?:Chrome|Chromium)\/([\d.]+)/i,
        icon: '🌐',
        exclude: /\b(?:Edg|Edge|EdgA|EdgiOS|EdgeHTML|OPR|Opera|OPiOS)\b/i
      },
      { 
        name: 'Internet Explorer', 
        pattern: /\b(?:MSIE|Trident)\b/i,
        versionPattern: /\b(?:MSIE ([\d.]+)|rv:([\d.]+))\b/i,
        icon: '🔗' 
      }
    ];

    for (const browser of browsers) {
      // Check if pattern matches
      if (browser.pattern.test(userAgent)) {
        // Check if excluded patterns are present (for Safari and Chrome)
        if (browser.exclude && browser.exclude.test(userAgent)) {
          console.log(`❌ ${browser.name} pattern matched but excluded due to: ${browser.exclude}`);
          continue;
        }
        
        const versionMatch = userAgent.match(browser.versionPattern);
        const version = versionMatch ? (versionMatch[1] || versionMatch[2] || 'Unknown') : 'Unknown';
        const result = `${browser.icon} ${browser.name} ${version}`;
        console.log(`✅ Browser detected: ${result}`);
        return result;
      }
    }
    
    console.log('❓ Unknown browser detected');
    return '❓ Unknown Browser';
  }

  private formatHumanMessage(data: VisitData): string {
    const flag = this.getCountryFlag(data.countryCode || '');
    const time = data.timestamp.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    
    return `✅ REAL HUMAN VISIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 Status: Successfully processed
🌐 IP: ${data.ip}
${flag} Location: ${data.location || 'Unknown'}
🏢 ISP: ${data.isp || 'Unknown'}
${data.browserInfo || '❓ Unknown Browser'}
📊 Visit #${data.visitCount} | Today: ${data.todayVisits} visits
🕐 Time: ${time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  private formatBotMessage(data: VisitData): string {
    const flag = this.getCountryFlag(data.countryCode || '');
    const time = data.timestamp.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const confidence = data.confidence ?? 0;
    const action = data.action || 'unknown';
    
    // Get action emoji
    const actionEmoji = {
      'redirect': '↗️',
      'trap': '🕳️',
      'monitor': '👀',
      'allow': '✅'
    }[action] || '❓';
    
    // Get confidence color
    const confidenceColor = confidence >= 80 ? '🔴' : confidence >= 60 ? '🟡' : '🟢';
    
    return `🤖 BOT DETECTED & PROCESSED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${actionEmoji} Action: ${action.toUpperCase()}
${confidenceColor} Confidence: ${confidence}% (Local: ${data.localScore || 0}% | AlienAPI: ${data.alienScore || 0}%)
🧠 Behavior Score: ${data.behaviorScore || 0}%
🌐 IP: ${data.ip}
${flag} Location: ${data.location || 'Unknown'}
🏢 ISP: ${data.isp || 'Unknown'}
${data.browserInfo || '❓ Unknown Browser'}
🖥️ User-Agent: ${data.userAgent.slice(0, 80)}${data.userAgent.length > 80 ? '...' : ''}
🕐 Time: ${time}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  private getNotificationSettings() {
    // Settings are managed by the database, not localStorage
    return {
      humanVisits: true,
      botDetections: true
    };
  }

  setNotificationSettings(settings: { humanVisits: boolean; botDetections: boolean }) {
    // Settings are managed by the database, not localStorage
  }

  async sendNotification(visitData: Partial<VisitData & { locationData?: any; confidence?: number; action?: string; behaviorScore?: number; localScore?: number; alienScore?: number }>) {
    // Import supabase at the top and update the implementation
    const { supabase } = await import('@/integrations/supabase/client');

    // Check notification settings to see if this type should be sent
    const settings = this.getNotificationSettings();
    const isBot = visitData.isBot || false;
    
    if (isBot && !settings.botDetections) {
      console.log('Bot detection notification disabled, skipping');
      return;
    }
    
    if (!isBot && !settings.humanVisits) {
      console.log('Human visit notification disabled, skipping');
      return;
    }

    // Get session token from localStorage
    const sessionToken = localStorage.getItem('license_session_token');
    if (!sessionToken) {
      console.error('❌ CRITICAL: No session token found, cannot send Telegram notification');
      // Only log this if it's actually a system error, not user configuration issue
      throw new Error('No session token found for Telegram notification');
    }

    try {
      console.log('🚀 Sending Telegram notification for:', visitData);
      this.updateVisitCounts();
      
      const locationData = await this.getLocationData(visitData.ip || '', visitData.locationData);
      console.log('Location data retrieved:', locationData);
      
      // Call the Edge Function for secure Telegram notification
      const { data, error } = await supabase.functions.invoke('telegram-notify', {
        body: {
          ip: visitData.ip || 'Unknown',
          userAgent: visitData.userAgent || 'Unknown',
          isBot: visitData.isBot || false,
          confidence: visitData.confidence,
          action: visitData.action,
          behaviorScore: visitData.behaviorScore,
          localScore: visitData.localScore,
          alienScore: visitData.alienScore,
          sessionToken: sessionToken,
          locationData: {
            country_name: locationData.country,
            country_code: locationData.countryCode,
            isp: locationData.isp,
            hostname: locationData.isp,
            ip: visitData.ip
          }
        }
      });

      if (error) {
        console.error('❌ Telegram notification Edge Function error:', error);
        // Use enhanced logging that checks if user has valid Telegram config
        await supabase.rpc('log_system_error_enhanced', {
          error_type_input: 'telegram',
          error_message_input: `Telegram notification failed: ${error.message}`,
          error_details_input: { 
            error: error.message, 
            visitData: JSON.stringify(visitData) 
          },
          user_session_token_input: sessionToken,
          severity_input: 'error',
          skip_if_configuration: true
        });
        // Re-throw error instead of silent failure
        throw new Error(`Telegram notification failed: ${error.message}`);
      } else {
        console.log('✅ Telegram notification sent successfully via Edge Function!');
      }
    } catch (error) {
      console.error('Failed to send Telegram notification:', error);
      // Use enhanced logging that checks if user has valid Telegram config
      await supabase.rpc('log_system_error_enhanced', {
        error_type_input: 'telegram',
        error_message_input: `Telegram notification failed: ${error.message}`,
        error_details_input: { 
          error: error.message, 
          visitData: JSON.stringify(visitData) 
        },
        user_session_token_input: sessionToken,
        severity_input: 'error',
        skip_if_configuration: true
      });
      // Re-throw error instead of silent failure
      throw error;
    }
  }

  clearConfig() {
    this.config = null;
    // No localStorage cleanup needed - database is the source of truth
  }

  isConfigured(): boolean {
    // Configuration is managed by the database, not localStorage
    return !!(this.config?.botToken && this.config?.chatId);
  }
}

export const telegramNotifier = new TelegramNotifierService();
