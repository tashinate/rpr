/**
 * Pending Decisions Component
 * Allows users to manage manual bot detection decisions
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Monitor, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PendingDecision {
  id: string;
  decision_key: string;
  decision: string;
  visitor_data: any;
  created_at: string;
  expires_at: string;
  license_key_id: string;
  session_token: string;
  updated_at: string;
}

const PendingDecisions: React.FC = () => {
  const [decisions, setDecisions] = useState<PendingDecision[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingDecisions, setProcessingDecisions] = useState<Set<string>>(new Set());

  const fetchDecisions = async () => {
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      console.log('Session token:', sessionToken);
      
      if (!sessionToken) {
        console.error('No session token found');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .rpc('get_manual_decisions_for_session', { 
          session_token_input: sessionToken 
        });

      console.log('Manual decisions data:', data);
      console.log('Manual decisions error:', error);

      if (error) {
        console.error('Error fetching manual decisions:', error);
        return;
      }

      setDecisions((data as PendingDecision[]) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decisionKey: string, decision: 'allow' | 'deny') => {
    const processKey = `${decisionKey}_${decision}`;
    
    // Prevent multiple clicks and race conditions
    if (processingDecisions.has(processKey)) {
      console.log('Decision already being processed:', processKey);
      return;
    }
    
    console.log('Starting decision process:', { decisionKey, decision, processKey });
    
    // Start processing this specific action
    setProcessingDecisions(prev => new Set([...prev, processKey]));

    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        console.error('No session token found');
        toast.error('No session token found');
        return;
      }

      console.log('Calling API with:', { sessionToken, decision, decisionKey });

      const response = await supabase.functions.invoke('req-p7v4n1', {
        body: {
          sessionToken,
          decision,
          decisionKey,
          visitorData: { ip: 'user_dashboard' }
        }
      });

      console.log('API Response:', response);

      if (response.error) {
        console.error('Decision update error:', response.error);
        toast.error('Failed to update decision');
        return;
      }

      if (!response.data) {
        console.error('No response data');
        toast.error('Failed to update decision');
        return;
      }

      if (!response.data.success) {
        console.error('Decision update failed:', response.data);
        toast.error(response.data?.error || 'Failed to update decision');
        return;
      }

      console.log('Decision updated successfully');

      // Update the UI immediately for better UX
      setDecisions(prev => 
        prev.map(d => 
          d.decision_key === decisionKey 
            ? { ...d, decision } 
            : d
        )
      );

      toast.success(`Visitor ${decision === 'allow' ? 'allowed' : 'denied'}`, {
        duration: 2000
      });
      
      // Refresh decisions to get the latest state
      setTimeout(() => {
        fetchDecisions();
      }, 1000);
      
    } catch (error) {
      console.error('Error updating decision:', error);
      toast.error('Failed to update decision');
    } finally {
      console.log('Clearing processing state for:', processKey);
      // Stop processing this specific action
      setProcessingDecisions(prev => {
        const newSet = new Set(prev);
        newSet.delete(processKey);
        console.log('New processing decisions:', newSet);
        return newSet;
      });
    }
  };

  const getCountryFlag = (countryCode?: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    return String.fromCodePoint(
      ...countryCode.toUpperCase().split('').map(char => 0x1F1E6 + char.charCodeAt(0) - 65)
    );
  };

  const getBrowserInfo = (userAgent: string): string => {
    if (!userAgent) return 'Unknown Browser';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edg')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    
    return 'Unknown Browser';
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now.getTime() - time.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  useEffect(() => {
    fetchDecisions();
    
    // Smart polling - only fetch if no decisions are being processed
    const interval = setInterval(() => {
      if (processingDecisions.size === 0) {
        fetchDecisions();
      }
    }, 5000); // Reduced to 5 seconds for faster updates
    
    return () => clearInterval(interval);
  }, [processingDecisions]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Pending Decisions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading pending decisions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingDecisions = decisions.filter(d => d.decision === 'pending');
  const recentDecisions = decisions.filter(d => d.decision !== 'pending').slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Pending Decisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Pending Manual Decisions
            {pendingDecisions.length > 0 && (
              <Badge variant="destructive">{pendingDecisions.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingDecisions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-muted-foreground">No pending decisions</p>
            </div>
          ) : (
            <div className="space-y-4">
               {pendingDecisions.map((decision, index) => (
                 <div 
                   key={decision.id}
                   className={`
                     border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 
                     rounded-lg p-4 transition-all duration-300 hover:shadow-md
                     animate-fade-in opacity-0
                   `}
                   style={{ 
                     animationDelay: `${index * 100}ms`,
                     animationFillMode: 'forwards'
                   }}
                 >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span className="font-mono text-sm">{decision.visitor_data?.ip || 'Unknown IP'}</span>
                      <span className="text-lg">
                        {getCountryFlag(decision.visitor_data?.locationData?.country_code)}
                      </span>
                      <span className="text-sm text-gray-600">
                        {decision.visitor_data?.locationData?.country_name || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatTimeAgo(decision.created_at)}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <Monitor className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      {getBrowserInfo(decision.visitor_data?.userAgent || '')}
                    </span>
                    <span className="text-sm text-gray-500">
                      • {decision.visitor_data?.locationData?.isp || 'Unknown ISP'}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                     <Button
                       size="sm"
                       className="bg-green-600 hover:bg-green-700 transition-all duration-200"
                       onClick={() => handleDecision(decision.decision_key, 'allow')}
                       disabled={processingDecisions.has(`${decision.decision_key}_allow`)}
                     >
                       {processingDecisions.has(`${decision.decision_key}_allow`) ? (
                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                       ) : (
                         <CheckCircle className="w-4 h-4 mr-1" />
                       )}
                       {processingDecisions.has(`${decision.decision_key}_allow`) ? 'Processing...' : 'Allow'}
                     </Button>
                     <Button
                       size="sm"
                       variant="destructive"
                       className="transition-all duration-200"
                       onClick={() => handleDecision(decision.decision_key, 'deny')}
                       disabled={processingDecisions.has(`${decision.decision_key}_deny`)}
                     >
                       {processingDecisions.has(`${decision.decision_key}_deny`) ? (
                         <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-1" />
                       ) : (
                         <XCircle className="w-4 h-4 mr-1" />
                       )}
                       {processingDecisions.has(`${decision.decision_key}_deny`) ? 'Processing...' : 'Deny'}
                     </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Decisions */}
      {recentDecisions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Decisions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentDecisions.map((decision) => (
                <div 
                  key={decision.id}
                  className="flex justify-between items-center p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm">{decision.visitor_data?.ip || 'Unknown IP'}</span>
                    <span>{getCountryFlag(decision.visitor_data?.locationData?.country_code)}</span>
                    <Badge 
                      variant={decision.decision === 'allow' ? 'default' : 'destructive'}
                      className={decision.decision === 'allow' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {decision.decision}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatTimeAgo(decision.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PendingDecisions;