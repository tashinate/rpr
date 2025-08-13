/**
 * Fake Scanning Interface Component
 * Professional-looking security scanner for stealth bot protection
 */
import React, { useEffect, useState } from 'react';

interface FakeScanningInterfaceProps {
  onResult: (allowed: boolean) => void;
  timeout?: number;
  decisionKey?: string;
}

const FakeScanningInterface: React.FC<FakeScanningInterfaceProps> = ({ 
  onResult, 
  timeout = 60000,
  decisionKey 
}) => {
  const [loadingText, setLoadingText] = useState('Loading...');

  useEffect(() => {
    // Alternate between Loading... and Verifying...
    const textInterval = setInterval(() => {
      setLoadingText(prev => prev === 'Loading...' ? 'Verifying...' : 'Loading...');
    }, 2000);

    // Auto-timeout after specified time
    const timeoutTimer = setTimeout(() => {
      // Default to deny on timeout
      onResult(false);
    }, timeout);

    // If we have a decision key, poll for user decision
    let pollInterval: NodeJS.Timeout;
    if (decisionKey) {
      pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`https://vohjarhfvaphzwjzjcnz.supabase.co/functions/v1/stealth-7g9m`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvaGphcmhmdmFwaHp3anpqY256Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzQ2NzksImV4cCI6MjA2NzkxMDY3OX0.fTMJcBvsRKH_hge7Q1zvh8GSRLt-egCG6W9Mz6JavMQ`
            },
            body: JSON.stringify({ 
              action: 'check_decision',
              decisionKey 
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.decision && result.decision !== 'pending') {
              clearInterval(textInterval);
              clearTimeout(timeoutTimer);
              clearInterval(pollInterval);
              onResult(result.decision === 'allow');
            }
          }
        } catch (error) {
          console.error('Error checking decision:', error);
        }
      }, 2000);
    }

    return () => {
      clearInterval(textInterval);
      clearTimeout(timeoutTimer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [timeout, onResult, decisionKey]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center" style={{ backgroundColor: '#ffffff' }}>
      <div className="text-gray-600 text-sm">
        {loadingText}
      </div>
    </div>
  );
};

export default FakeScanningInterface;