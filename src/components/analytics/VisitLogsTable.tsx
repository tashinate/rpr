import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, User, Bot, Clock, Globe, Shield, AlertTriangle } from 'lucide-react';

interface VisitLog {
  id: string;
  ip_address: string;
  country_code: string;
  country_name: string;
  city: string;
  region: string;
  isp: string;
  user_agent: string;
  browser: string;
  device_type: string;
  os: string;
  referrer: string;
  is_bot: boolean;
  bot_confidence: number;
  action_taken: string;
  redirect_url: string;
  created_at: string;
}

interface AnalyticsData {
  totalVisits: number;
  humanVisits: number;
  botVisits: number;
  todayVisits: number;
  todayHuman: number;
  todayBot: number;
}

interface VisitLogsTableProps {
  analyticsData: AnalyticsData;
}

export const VisitLogsTable: React.FC<VisitLogsTableProps> = ({ analyticsData }) => {
  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVisitLogs = async () => {
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        console.log('No session token found for visit logs');
        setVisitLogs([]);
        setLoading(false);
        return;
      }

      // Get license key ID from session
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select('license_key_id')
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .maybeSingle();

      if (sessionError || !sessionData) {
        console.error('Session error:', sessionError);
        setVisitLogs([]);
        setLoading(false);
        return;
      }

      // Fetch visit logs for the user
      const { data: logs, error: logsError } = await supabase
        .from('visit_logs')
        .select('*')
        .eq('license_key_id', sessionData.license_key_id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) {
        console.error('Logs error:', logsError);
        setVisitLogs([]);
      } else {
        setVisitLogs(logs || []);
      }
    } catch (error) {
      console.error('Error fetching visit logs:', error);
      setVisitLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisitLogs();

    // Set up real-time subscription for visit logs
    const channel = supabase
      .channel('visit-logs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visit_logs'
        },
        (payload) => {
          console.log('Visit logs changed:', payload);
          fetchVisitLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getActionBadge = (action: string, isBot: boolean) => {
    const actionConfig = {
      redirect: { 
        color: 'bg-blue-500/20 text-blue-300 border-blue-400/40', 
        text: 'REDIRECT' 
      },
      blocked: { 
        color: 'bg-red-500/20 text-red-300 border-red-400/40', 
        text: 'BLOCKED' 
      },
      monitored: { 
        color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40', 
        text: 'MONITORED' 
      },
      allowed: { 
        color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40', 
        text: 'ALLOWED' 
      },
      unknown: { 
        color: 'bg-slate-500/20 text-slate-300 border-slate-400/40', 
        text: 'UNKNOWN' 
      }
    };

    const config = actionConfig[action as keyof typeof actionConfig] || actionConfig.unknown;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getConfidenceBadge = (confidence: number, isBot: boolean) => {
    if (!isBot || confidence === 0) return null;

    let colorClass = 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
    if (confidence >= 80) {
      colorClass = 'bg-red-500/20 text-red-300 border-red-400/40';
    } else if (confidence >= 60) {
      colorClass = 'bg-yellow-500/20 text-yellow-300 border-yellow-400/40';
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold border ${colorClass}`}>
        {confidence}% BOT
      </span>
    );
  };

  const getCountryFlag = (countryCode: string): string => {
    if (!countryCode || countryCode.length !== 2) return '🌍';
    
    const upperCode = countryCode.toUpperCase();
    const codePoints = upperCode.split('').map(char => 
      127397 + char.charCodeAt(0)
    );
    return String.fromCodePoint(...codePoints);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="relative bg-glass-tier-2 border border-slate-400/30 backdrop-blur-sm rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-gradient-to-br from-slate-400/20 to-gray-500/20 rounded-lg border border-slate-400/30">
              <Activity className="w-5 h-5 text-slate-300" />
            </div>
            <span className="font-jetbrains text-slate-300 text-sm font-bold uppercase tracking-wider">REAL-TIME VISIT LOGS</span>
          </div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-12 bg-slate-700/30 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-glass-tier-2 border border-slate-400/30 backdrop-blur-sm rounded-lg overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-400/5 via-gray-500/5 to-slate-400/5 animate-gradient-flow"></div>
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-slate-400/20 to-gray-500/20 rounded-lg border border-slate-400/30">
              <Activity className="w-5 h-5 text-slate-300" />
            </div>
            <div>
              <span className="font-jetbrains text-slate-300 text-sm font-bold uppercase tracking-wider">REAL-TIME VISIT LOGS</span>
              <div className="text-slate-400 text-xs">
                {visitLogs.length} records | Live tracking active
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-slate-400/40 hover:border-slate-300/60 bg-slate-800/50 hover:bg-slate-700/60 text-slate-200"
            onClick={() => {
              setLoading(true);
              fetchVisitLogs();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {visitLogs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-slate-400 text-sm">No visit logs found. Visits will appear here in real-time.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600/30">
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">Time</th>
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">IP Address</th>
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">Location</th>
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">ISP</th>
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">Device</th>
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">Browser</th>
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">Status</th>
                  <th className="text-left py-3 px-4 font-jetbrains text-slate-300 uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {visitLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors ${
                      log.is_bot ? 'bg-red-900/10' : 'bg-emerald-900/5'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span className="text-slate-300 text-xs font-mono">
                          {formatTimestamp(log.created_at)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {log.is_bot ? (
                          <Bot className="w-4 h-4 text-red-400" />
                        ) : (
                          <User className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className="font-mono text-slate-200 text-xs">
                          {log.ip_address}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getCountryFlag(log.country_code)}</span>
                        <div className="text-xs">
                          <div className="text-slate-200">
                            {log.city || log.region || log.country_name || 'Unknown'}
                          </div>
                          <div className="text-slate-500">
                            {log.country_code}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 text-xs">
                        {log.isp || 'Unknown ISP'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 text-xs">
                        {log.device_type || log.os || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-300 text-xs">
                        {log.browser || 'Unknown'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {log.is_bot ? (
                          <span className="text-red-300 text-xs font-bold">BOT</span>
                        ) : (
                          <span className="text-emerald-300 text-xs font-bold">HUMAN</span>
                        )}
                        {getConfidenceBadge(log.bot_confidence, log.is_bot)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getActionBadge(log.action_taken, log.is_bot)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};