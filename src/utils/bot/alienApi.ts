import { supabase } from '@/integrations/supabase/client';
import { BotDetectionResult } from './types';

export class AlienApi {
  async checkWithAlienBot(ip: string, userAgent: string, detectionPayload?: any): Promise<BotDetectionResult> {
    try {
      const currentUrl = window.location.href;
      
      // Call the Edge Function with comprehensive data
      const { data, error } = await supabase.functions.invoke('bot-detection', {
        body: detectionPayload || {
          ip,
          userAgent,
          currentUrl
        }
      });
      
      if (error) {
        console.error('Bot detection Edge Function error:', error);
        return { 
          isBot: false, 
          confidence: 0, 
          action: 'allow',
          hasNoHumanActivity: false,
          isRepeatedVisitor: false,
          userAgentSuspicious: false,
          fingerprintSuspicious: false,
          behaviorScore: 0,
          alienScore: 0,
          localScore: 0
        };
      }
      
      return data;
      
    } catch (error) {
      console.error('Bot detection request failed:', error);
      return { 
        isBot: false, 
        confidence: 0, 
        action: 'allow',
        hasNoHumanActivity: false,
        isRepeatedVisitor: false,
        userAgentSuspicious: false,
        fingerprintSuspicious: false,
        behaviorScore: 0,
        alienScore: 0,
        localScore: 0
      };
    }
  }
}