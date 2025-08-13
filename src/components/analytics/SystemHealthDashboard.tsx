
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Activity, Cpu, Database, Shield, Zap, RefreshCw, AlertTriangle, Clock } from 'lucide-react';

interface SystemHealth {
  active_licenses: number;
  active_sessions: number;
  pending_reviews: number;
  today_visits: number;
  telegram_configs: number;
  old_sessions: number;
  old_visit_stats: number;
  last_updated: string;
}

export const SystemHealthDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchHealthData();
    // Set up real-time refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealthData = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase.rpc('system_health_check');
      
      if (error) throw error;
      
      setHealthData(data as unknown as SystemHealth);
    } catch (error) {
      console.error('Error fetching health data:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getHealthScore = () => {
    if (!healthData) return 0;
    
    let score = 100;
    
    // Penalize for old data that needs cleanup
    if (healthData.old_sessions > 100) score -= 20;
    if (healthData.old_visit_stats > 1000) score -= 15;
    if (healthData.pending_reviews > 10) score -= 10;
    
    // Bonus for active system
    if (healthData.active_sessions > 0) score += 5;
    if (healthData.today_visits > 0) score += 5;
    
    return Math.max(0, Math.min(100, score));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/20 border-emerald-400/40';
    if (score >= 70) return 'bg-amber-500/20 border-amber-400/40';
    return 'bg-red-500/20 border-red-400/40';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 90) return 'shadow-[0_0_15px_rgba(52,211,153,0.5)]';
    if (score >= 70) return 'shadow-[0_0_15px_rgba(251,191,36,0.5)]';
    return 'shadow-[0_0_15px_rgba(248,113,113,0.5)]';
  };

  if (isLoading) {
    return (
      <Card className="relative bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-indigo-950/80 border border-cyan-500/20 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
        <CardContent className="p-8 text-center">
          <div className="animate-pulse flex flex-col items-center justify-center gap-3">
            <div className="h-14 w-14 rounded-full bg-cyan-400/20 flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-cyan-400/50 animate-spin" />
            </div>
            <div className="text-cyan-200 font-jetbrains text-lg tracking-wider animate-pulse">
              ANALYZING SYSTEM HEALTH...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthScore = getHealthScore();

  return (
    <div className="space-y-6">
      {/* System Health Score */}
      <Card className="relative bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-indigo-950/80 border border-cyan-500/20 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-blue-500/5 to-purple-500/5 animate-gradient-flow pointer-events-none"></div>
        
        <CardHeader className="relative z-10 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
                SYSTEM HEALTH STATUS
              </CardTitle>
              <CardDescription className="text-cyan-300/80 font-jetbrains tracking-wide">
                REAL-TIME MONITORING • AUTOMATED DIAGNOSTICS
              </CardDescription>
            </div>
            <Button
              onClick={fetchHealthData}
              disabled={isRefreshing}
              variant="outline"
              className="bg-slate-800/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-700/80 hover:border-cyan-300/60 font-jetbrains uppercase tracking-wider backdrop-blur-sm group"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : 'group-hover:animate-spin'}`} />
              REFRESH
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 pt-0">
          <div className="flex items-center justify-center my-6">
            <div className={`relative w-36 h-36 rounded-full border-4 ${getScoreBg(healthScore)} flex items-center justify-center ${getScoreGlow(healthScore)} transition-all duration-500 backdrop-blur-sm`}>
              <div className="absolute inset-0 rounded-full animate-pulse opacity-50" style={{
                background: `radial-gradient(circle, ${healthScore >= 90 ? 'rgba(52,211,153,0.3)' : healthScore >= 70 ? 'rgba(251,191,36,0.3)' : 'rgba(248,113,113,0.3)'} 0%, transparent 70%)`
              }}></div>
              <div className="text-center">
                <div className={`text-4xl font-bold font-jetbrains ${getScoreColor(healthScore)} animate-pulse-subtle`}>
                  {healthScore}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mt-1">
                  HEALTH SCORE
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-4">
            <p className="text-cyan-300/80 font-jetbrains text-sm flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              Last Updated: {healthData ? new Date(healthData.last_updated).toLocaleString() : 'N/A'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-indigo-950/80 border border-cyan-500/20 backdrop-blur-sm group hover:border-cyan-400/40 transition-all duration-300">
          <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300/80 font-jetbrains text-xs uppercase tracking-wider">ACTIVE LICENSES</p>
                <p className="text-3xl font-bold text-cyan-200 font-jetbrains mt-1 group-hover:text-cyan-100 transition-colors">
                  {healthData?.active_licenses || 0}
                </p>
              </div>
              <div className="bg-emerald-500/10 p-3 rounded-full border border-emerald-500/30 group-hover:border-emerald-400/50 transition-all duration-300">
                <Shield className="w-6 h-6 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-indigo-950/80 border border-cyan-500/20 backdrop-blur-sm group hover:border-cyan-400/40 transition-all duration-300">
          <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300/80 font-jetbrains text-xs uppercase tracking-wider">ACTIVE SESSIONS</p>
                <p className="text-3xl font-bold text-cyan-200 font-jetbrains mt-1 group-hover:text-cyan-100 transition-colors">
                  {healthData?.active_sessions || 0}
                </p>
              </div>
              <div className="bg-blue-500/10 p-3 rounded-full border border-blue-500/30 group-hover:border-blue-400/50 transition-all duration-300">
                <Activity className="w-6 h-6 text-blue-400 group-hover:text-blue-300 transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-indigo-950/80 border border-cyan-500/20 backdrop-blur-sm group hover:border-cyan-400/40 transition-all duration-300">
          <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300/80 font-jetbrains text-xs uppercase tracking-wider">TODAY VISITS</p>
                <p className="text-3xl font-bold text-cyan-200 font-jetbrains mt-1 group-hover:text-cyan-100 transition-colors">
                  {healthData?.today_visits || 0}
                </p>
              </div>
              <div className="bg-yellow-500/10 p-3 rounded-full border border-yellow-500/30 group-hover:border-yellow-400/50 transition-all duration-300">
                <Zap className="w-6 h-6 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-indigo-950/80 border border-cyan-500/20 backdrop-blur-sm group hover:border-cyan-400/40 transition-all duration-300">
          <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-300/80 font-jetbrains text-xs uppercase tracking-wider">TELEGRAM CONFIGS</p>
                <p className="text-3xl font-bold text-cyan-200 font-jetbrains mt-1 group-hover:text-cyan-100 transition-colors">
                  {healthData?.telegram_configs || 0}
                </p>
              </div>
              <div className="bg-purple-500/10 p-3 rounded-full border border-purple-500/30 group-hover:border-purple-400/50 transition-all duration-300">
                <Cpu className="w-6 h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cleanup Recommendations */}
      {healthData && (healthData.old_sessions > 0 || healthData.old_visit_stats > 0) && (
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-amber-950/20 to-amber-900/20 border border-amber-500/30 backdrop-blur-sm">
          <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
          <CardHeader className="pb-2">
            <CardTitle className="text-amber-300 font-jetbrains font-bold uppercase tracking-wider flex items-center text-lg">
              <AlertTriangle className="w-5 h-5 mr-2" />
              CLEANUP RECOMMENDATIONS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {healthData.old_sessions > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-400/20 rounded-lg">
                  <span className="text-amber-300 font-jetbrains text-sm">
                    {healthData.old_sessions} old sessions detected ({'>'}7 days)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-amber-600/30 border-amber-400/40 text-amber-300 hover:bg-amber-600/50 hover:border-amber-300/60 backdrop-blur-sm font-jetbrains uppercase tracking-wider text-xs"
                  >
                    CLEANUP
                  </Button>
                </div>
              )}
              
              {healthData.old_visit_stats > 0 && (
                <div className="flex items-center justify-between p-3 bg-amber-500/10 border border-amber-400/20 rounded-lg">
                  <span className="text-amber-300 font-jetbrains text-sm">
                    {healthData.old_visit_stats} old visit stats detected ({'>'}30 days)
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="bg-amber-600/30 border-amber-400/40 text-amber-300 hover:bg-amber-600/50 hover:border-amber-300/60 backdrop-blur-sm font-jetbrains uppercase tracking-wider text-xs"
                  >
                    CLEANUP
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
