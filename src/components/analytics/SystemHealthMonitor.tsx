
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Wifi, Database, Cpu, AlertCircle, Check, AlertTriangle, X } from 'lucide-react';

interface SystemHealth {
  alienApiStatus: 'healthy' | 'degraded' | 'offline';
  edgeFunctionStatus: 'healthy' | 'degraded' | 'offline';
  localDetectionStatus: 'healthy' | 'degraded' | 'offline';
  lastAlienCall?: number;
  lastEdgeFunctionCall?: number;
  circuitBreakerOpen?: boolean;
  apiResponseTime?: number;
  totalDetections: number;
  botDetections: number;
  humanDetections: number;
}

export const SystemHealthMonitor: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth>({
    alienApiStatus: 'offline',
    edgeFunctionStatus: 'offline',
    localDetectionStatus: 'healthy',
    totalDetections: 0,
    botDetections: 0,
    humanDetections: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkSystemHealth = async () => {
    setIsLoading(true);
    try {
      // Test edge function health
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('bot-detection', {
        body: {
          ip: '127.0.0.1',
          userAgent: 'HealthCheck/1.0',
          currentUrl: window.location.href,
          localData: {
            hasHumanActivity: true,
            behaviorScore: 0,
            localScore: 0
          }
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      if (error) {
        setHealth(prev => ({
          ...prev,
          edgeFunctionStatus: 'offline',
          alienApiStatus: 'offline'
        }));
      } else {
        // Parse response to determine AlienAPI status
        const alienApiStatus = data?.circuitBreakerStatus?.isOpen 
          ? 'degraded' 
          : data?.alienScore > 0 
            ? 'healthy' 
            : 'degraded';
            
        setHealth(prev => ({
          ...prev,
          edgeFunctionStatus: 'healthy',
          alienApiStatus: alienApiStatus,
          lastEdgeFunctionCall: Date.now(),
          lastAlienCall: data?.alienScore > 0 ? Date.now() : prev.lastAlienCall,
          circuitBreakerOpen: data?.circuitBreakerStatus?.isOpen || false,
          apiResponseTime: responseTime
        }));
      }
    } catch (error) {
      console.error('Health check failed:', error);
      setHealth(prev => ({
        ...prev,
        edgeFunctionStatus: 'offline',
        alienApiStatus: 'offline'
      }));
    }
    setIsLoading(false);
  };

  useEffect(() => {
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <Check className="w-4 h-4" />;
      case 'degraded': return <AlertTriangle className="w-4 h-4" />;
      case 'offline': return <X className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30';
      case 'degraded': return 'bg-amber-500/20 border-amber-500/40 text-amber-400 hover:bg-amber-500/30';
      case 'offline': return 'bg-red-500/20 border-red-500/40 text-red-400 hover:bg-red-500/30';
      default: return 'bg-slate-500/20 border-slate-500/40 text-slate-400 hover:bg-slate-500/30';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'HEALTHY';
      case 'degraded': return 'DEGRADED';
      case 'offline': return 'OFFLINE';
      default: return 'UNKNOWN';
    }
  };

  const getStatusIconComponent = (status: string) => {
    switch (status) {
      case 'healthy': return <Wifi className="w-4 h-4 mr-2" />;
      case 'degraded': return <Wifi className="w-4 h-4 mr-2" />;
      case 'offline': return <Wifi className="w-4 h-4 mr-2 opacity-50" />;
      default: return <Wifi className="w-4 h-4 mr-2 opacity-50" />;
    }
  };

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-slate-900/90 via-blue-950/70 to-indigo-950/80 border border-cyan-500/20 backdrop-blur-sm">
      <div className="absolute inset-0 bg-grid-slate-700/20 bg-[size:20px_20px] mask-fade-out"></div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-cyan-200 font-jetbrains text-lg uppercase tracking-wider">System Health</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={checkSystemHealth}
          disabled={isLoading}
          className="bg-slate-800/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-700/80 hover:border-cyan-300/60 font-jetbrains uppercase tracking-wider text-xs backdrop-blur-sm group"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : 'group-hover:animate-spin'}`} />
          {isLoading ? 'CHECKING...' : 'REFRESH'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-5 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Wifi className="w-4 h-4 mr-2 text-cyan-400" />
              <h4 className="text-sm font-medium text-cyan-200 font-jetbrains">AlienAPI</h4>
            </div>
            <Badge className={`${getStatusColor(health.alienApiStatus)} border font-jetbrains text-xs py-1 px-3 flex items-center gap-1`}>
              {getStatusIcon(health.alienApiStatus)}
              {getStatusText(health.alienApiStatus)}
            </Badge>
            {health.circuitBreakerOpen && (
              <p className="text-xs text-red-400 font-jetbrains flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Circuit breaker open
              </p>
            )}
            {health.lastAlienCall && (
              <p className="text-xs text-cyan-400/60 font-jetbrains">
                Last call: {new Date(health.lastAlienCall).toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Database className="w-4 h-4 mr-2 text-cyan-400" />
              <h4 className="text-sm font-medium text-cyan-200 font-jetbrains">Edge Function</h4>
            </div>
            <Badge className={`${getStatusColor(health.edgeFunctionStatus)} border font-jetbrains text-xs py-1 px-3 flex items-center gap-1`}>
              {getStatusIcon(health.edgeFunctionStatus)}
              {getStatusText(health.edgeFunctionStatus)}
            </Badge>
            {health.apiResponseTime && (
              <p className="text-xs text-cyan-400/60 font-jetbrains">
                Response: {health.apiResponseTime}ms
              </p>
            )}
            {health.lastEdgeFunctionCall && (
              <p className="text-xs text-cyan-400/60 font-jetbrains">
                Last call: {new Date(health.lastEdgeFunctionCall).toLocaleTimeString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Cpu className="w-4 h-4 mr-2 text-cyan-400" />
              <h4 className="text-sm font-medium text-cyan-200 font-jetbrains">Local Detection</h4>
            </div>
            <Badge className={`${getStatusColor(health.localDetectionStatus)} border font-jetbrains text-xs py-1 px-3 flex items-center gap-1`}>
              {getStatusIcon(health.localDetectionStatus)}
              {getStatusText(health.localDetectionStatus)}
            </Badge>
            <p className="text-xs text-cyan-400/60 font-jetbrains">
              Fallback ready
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-cyan-500/20">
          <h4 className="text-sm font-medium mb-3 text-cyan-200 font-jetbrains">Performance Metrics</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-cyan-500/20">
              <p className="text-2xl font-bold text-cyan-200 font-jetbrains">{health.totalDetections}</p>
              <p className="text-xs text-cyan-400/60 font-jetbrains uppercase tracking-wider mt-1">Total Checks</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-red-500/20">
              <p className="text-2xl font-bold text-red-400 font-jetbrains">{health.botDetections}</p>
              <p className="text-xs text-red-400/60 font-jetbrains uppercase tracking-wider mt-1">Bots Blocked</p>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-emerald-500/20">
              <p className="text-2xl font-bold text-emerald-400 font-jetbrains">{health.humanDetections}</p>
              <p className="text-xs text-emerald-400/60 font-jetbrains uppercase tracking-wider mt-1">Humans Allowed</p>
            </div>
          </div>
        </div>

        {(health.alienApiStatus === 'offline' || health.circuitBreakerOpen) && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mt-4">
            <h5 className="text-sm font-medium text-amber-300 mb-1 font-jetbrains flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              FALLBACK MODE ACTIVE
            </h5>
            <p className="text-xs text-amber-300/80 font-jetbrains">
              System is using enhanced local detection while AlienAPI is unavailable.
              Security levels remain high through behavioral analysis and fingerprinting.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
