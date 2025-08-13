import { UserAgentDetection } from './userAgentDetection';
import { supabase } from '@/integrations/supabase/client';
import { BotDetectionResult } from './types';

export class BotDetectionService {
  private userAgentDetection = new UserAgentDetection();

  async isBot(): Promise<BotDetectionResult> {
    try {
      const userAgent = navigator.userAgent;
      
      // Basic user agent checks
      const userAgentSuspicious = this.userAgentDetection.isSuspiciousUserAgent(userAgent);
      const isObviousBot = this.userAgentDetection.detectBotByUserAgent(userAgent);
      
      let localScore = 0;
      if (isObviousBot) {
        localScore = 80;
      } else if (userAgentSuspicious) {
        localScore = 30;
      }
      
      // Call backend with 25 second timeout (to accommodate 20s backend timeout + buffer)
      const result = await supabase.functions.invoke('chk-m3r8s6', {
        body: {
          userAgent,
          currentUrl: window.location.href,
          localScore
        }
      });
      
      // Handle backend response with enhanced error handling
      if (result.error) {
        console.error('Bot detection backend error:', result.error);
        return { 
          isBot: false,
          confidence: 0,
          hasNoHumanActivity: false,
          isRepeatedVisitor: false,
          userAgentSuspicious,
          fingerprintSuspicious: false,
          behaviorScore: 0,
          alienScore: 0,
          localScore,
          action: 'undecided', // This will trigger manual decision interface
          locationData: {
            ip: 'unknown',
            country_name: 'Unknown',
            country_code: 'XX',
            isp: 'Unknown',
            hostname: 'Unknown'
          },
          fallbackUsed: true
        };
      }
      
      if (!result.data) {
        console.warn('Bot detection: No data returned from backend');
        return { 
          isBot: false,
          confidence: 0,
          hasNoHumanActivity: false,
          isRepeatedVisitor: false,
          userAgentSuspicious,
          fingerprintSuspicious: false,
          behaviorScore: 0,
          alienScore: 0,
          localScore,
          action: 'undecided', // This will trigger manual decision interface
          locationData: {
            ip: 'unknown',
            country_name: 'Unknown',
            country_code: 'XX',
            isp: 'Unknown',
            hostname: 'Unknown'
          },
          fallbackUsed: true
        };
      }
      
      return {
        ...result.data,
        userAgentSuspicious,
        localScore
      };
      
    } catch (error) {
      console.error('Bot detection service error:', error);
      
      // Return undecided to trigger manual decision interface
      const userAgent = navigator.userAgent;
      const userAgentSuspicious = this.userAgentDetection.isSuspiciousUserAgent(userAgent);
      
      return { 
        isBot: false,
        confidence: 0,
        hasNoHumanActivity: false,
        isRepeatedVisitor: false,
        userAgentSuspicious,
        fingerprintSuspicious: false,
        behaviorScore: 0,
        alienScore: 0,
        localScore: 0,
        action: 'undecided', // This will trigger manual decision interface
        locationData: {
          ip: 'unknown',
          country_name: 'Unknown',
          country_code: 'XX',
          isp: 'Unknown',
          hostname: 'Unknown'
        },
        fallbackUsed: true,
        errorType: error.name === 'TimeoutError' ? 'timeout' : 'error'
      };
    }
  }


  // Legacy method for backward compatibility
  async detectBot(): Promise<BotDetectionResult> {
    return this.isBot();
  }
}