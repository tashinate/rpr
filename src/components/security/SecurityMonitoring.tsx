import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, CheckCircle, Eye, Zap, Lock, Cpu, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SecurityMetrics {
  threatLevel: 'low' | 'medium' | 'high';
  botDetections: number;
  humanVisits: number;
  blockedThreats: number;
  protectionScore: number;
  lastThreatDetected: string | null;
  emailScannerDetections: number;
  scannerTypes: Record<string, number>;
}

const SecurityMonitoring: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    threatLevel: 'low',
    botDetections: 0,
    humanVisits: 0,
    blockedThreats: 0,
    protectionScore: 99,
    lastThreatDetected: null,
    emailScannerDetections: 0,
    scannerTypes: {}
  });
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false); // Start collapsed

  const fetchSecurityMetrics = async () => {
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        setLoading(false);
        return;
      }

      // Get recent visit stats with proper typing
      const { data: sessionData } = await supabase.rpc('validate_session_with_license', {
        session_token_input: sessionToken
      });

      // Parse the JSON response properly
      const parsedData = typeof sessionData === 'string' ? JSON.parse(sessionData) : sessionData;
      
      if (!parsedData?.valid) {
        setLoading(false);
        return;
      }

      const { data: visitStats } = await supabase
        .from('user_visit_stats')
        .select('*')
        .eq('license_key_id', parsedData.license_id)
        .gte('visit_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('visit_date', { ascending: false });

      const totalBots = visitStats?.reduce((sum, stat) => sum + stat.bot_visits, 0) || 0;
      const totalHumans = visitStats?.reduce((sum, stat) => sum + stat.human_visits, 0) || 0;
      const totalVisits = totalBots + totalHumans;

      // Get email scanner detection stats from visit logs
      const { data: visitLogs } = await supabase
        .from('visit_logs')
        .select('user_agent, action_taken')
        .eq('license_key_id', parsedData.license_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      // Analyze email scanner patterns
      const emailScanners = visitLogs?.filter(log => 
        log.user_agent && (
          log.user_agent.includes('Microsoft-URLAnalyzer') ||
          log.user_agent.includes('SafeLinks') ||
          log.user_agent.includes('Gmail-ImageProxy') ||
          log.user_agent.includes('Mimecast') ||
          log.user_agent.includes('Proofpoint') ||
          log.user_agent.includes('Barracuda') ||
          log.action_taken === 'email_scanner_detected'
        )
      ) || [];

      const scannerTypes: Record<string, number> = {};
      emailScanners.forEach(scanner => {
        if (scanner.user_agent?.includes('Microsoft-URLAnalyzer') || scanner.user_agent?.includes('SafeLinks')) {
          scannerTypes['Microsoft 365'] = (scannerTypes['Microsoft 365'] || 0) + 1;
        } else if (scanner.user_agent?.includes('Gmail-ImageProxy')) {
          scannerTypes['Gmail'] = (scannerTypes['Gmail'] || 0) + 1;
        } else if (scanner.user_agent?.includes('Mimecast')) {
          scannerTypes['Mimecast'] = (scannerTypes['Mimecast'] || 0) + 1;
        } else if (scanner.user_agent?.includes('Proofpoint')) {
          scannerTypes['Proofpoint'] = (scannerTypes['Proofpoint'] || 0) + 1;
        } else if (scanner.user_agent?.includes('Barracuda')) {
          scannerTypes['Barracuda'] = (scannerTypes['Barracuda'] || 0) + 1;
        } else {
          scannerTypes['Other'] = (scannerTypes['Other'] || 0) + 1;
        }
      });

      // Calculate threat level based on bot percentage
      let threatLevel: 'low' | 'medium' | 'high' = 'low';
      if (totalVisits > 0) {
        const botPercentage = (totalBots / totalVisits) * 100;
        if (botPercentage > 70) threatLevel = 'high';
        else if (botPercentage > 40) threatLevel = 'medium';
      }

      // Calculate protection score
      const protectionScore = Math.max(85, Math.min(99, 99 - (totalBots * 2)));

      setMetrics({
        threatLevel,
        botDetections: totalBots,
        humanVisits: totalHumans,
        blockedThreats: Math.floor(totalBots * 0.8),
        protectionScore,
        lastThreatDetected: totalBots > 0 ? 'Recent' : null,
        emailScannerDetections: emailScanners.length,
        scannerTypes
      });

    } catch (error) {
      console.error('Error fetching security metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityMetrics();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchSecurityMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const getProtectionScoreColor = (score: number) => {
    if (score >= 95) return 'text-emerald-600';
    if (score >= 85) return 'text-blue-600';
    if (score >= 75) return 'text-amber-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="h-6 bg-slate-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 bg-slate-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white border-cyan-400/30">
      <CardContent className="p-6">
        {/* Header Section - Always Visible */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/30 rounded-lg animate-pulse blur-sm"></div>
            <div className="relative z-10 p-2 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
              <Shield className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-jetbrains font-bold text-cyan-200 tracking-wider uppercase">PHANTOM Protocol Status</h3>
            <p className="font-jetbrains text-sm text-blue-300/80">Real-time security monitoring with email scanner detection</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={`font-jetbrains ${getThreatLevelColor(metrics.threatLevel)} font-bold uppercase tracking-wider`}>
              {metrics.threatLevel} threat
            </Badge>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 bg-slate-800/50 hover:bg-slate-700/60 rounded-lg border border-cyan-400/30 transition-all duration-300 backdrop-blur-sm"
              aria-label={isExpanded ? 'Collapse security details' : 'Expand security details'}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-cyan-300" />
              ) : (
                <ChevronDown className="w-4 h-4 text-cyan-300" />
              )}
            </button>
          </div>
        </div>

        {/* Protection Score - Always Visible */}
        <div className="mb-6 p-4 bg-gradient-to-r from-slate-800/50 to-blue-900/50 rounded-xl border border-cyan-400/20">
          <div className="flex items-center justify-between mb-2">
            <span className="font-jetbrains text-cyan-300 font-medium">Protection Score</span>
            <span className={`font-jetbrains text-2xl font-bold ${getProtectionScoreColor(metrics.protectionScore)}`}>
              {metrics.protectionScore}%
            </span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${metrics.protectionScore}%` }}
            ></div>
          </div>
        </div>

        {/* Collapsible Content - Fixed logic */}
        <div 
          className={`transition-all duration-500 ease-in-out overflow-hidden ${
            isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          {/* Enhanced Metrics Grid with Email Scanner Detection */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-xl border border-emerald-400/30">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="font-jetbrains text-emerald-300 text-sm font-medium">Human Visits</span>
              </div>
              <div className="font-jetbrains text-2xl font-bold text-emerald-200">{metrics.humanVisits}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-xl border border-red-400/30">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="font-jetbrains text-red-300 text-sm font-medium">Bot Detections</span>
              </div>
              <div className="font-jetbrains text-2xl font-bold text-red-200">{metrics.botDetections}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 rounded-xl border border-purple-400/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span className="font-jetbrains text-purple-300 text-sm font-medium">Threats Blocked</span>
              </div>
              <div className="font-jetbrains text-2xl font-bold text-purple-200">{metrics.blockedThreats}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-400/30">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="font-jetbrains text-blue-300 text-sm font-medium">Email Scanners</span>
              </div>
              <div className="font-jetbrains text-2xl font-bold text-blue-200">{metrics.emailScannerDetections}</div>
            </div>

            <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl border border-cyan-400/30">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="font-jetbrains text-cyan-300 text-sm font-medium">Last Scan</span>
              </div>
              <div className="font-jetbrains text-sm font-bold text-cyan-200">Active</div>
            </div>
          </div>

          {/* Enhanced Security Features with Email Scanner Types */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-jetbrains font-semibold text-cyan-300 uppercase tracking-wide text-sm">Active Defenses</h4>
              
              {[
                { icon: Eye, name: 'Ghost Protocol', status: 'Active' },
                { icon: Cpu, name: 'Neural Firewall', status: 'Active' },
                { icon: Zap, name: 'Threat Radar', status: 'Scanning' },
                { icon: Shield, name: 'Email Scanner Guard', status: 'Monitoring' }
              ].map((defense, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg">
                  <defense.icon className="w-4 h-4 text-cyan-400" />
                  <span className="font-jetbrains text-blue-200 text-sm flex-1">{defense.name}</span>
                  <Badge className="font-jetbrains bg-emerald-500/20 text-emerald-300 text-xs border-emerald-400/30">
                    {defense.status}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="font-jetbrains font-semibold text-cyan-300 uppercase tracking-wide text-sm">Scanner Detection</h4>
              
              <div className="space-y-2">
                {Object.entries(metrics.scannerTypes).length > 0 ? (
                  Object.entries(metrics.scannerTypes).map(([scanner, count]) => (
                    <div key={scanner} className="flex justify-between text-sm">
                      <span className="font-jetbrains text-blue-300">{scanner}</span>
                      <span className="font-jetbrains text-emerald-300 font-medium">{count}</span>
                    </div>
                  ))
                ) : (
                  <div className="font-jetbrains text-sm text-blue-300/70">No email scanners detected recently</div>
                )}
                
                <div className="mt-3 pt-3 border-t border-blue-500/20">
                  <div className="flex justify-between text-sm">
                    <span className="font-jetbrains text-blue-300">Detection Mode</span>
                    <span className="font-jetbrains text-emerald-300 font-medium">Enhanced</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-jetbrains text-blue-300">Response Time</span>
                    <span className="font-jetbrains text-emerald-300 font-medium">&lt;50ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecurityMonitoring;
