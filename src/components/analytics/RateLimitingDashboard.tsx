import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, Clock, Users, RefreshCw, TrendingUp, Activity, Gauge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitMetrics {
  system_overview: {
    total_licenses: number;
    active_violations: number;
    total_requests_today: number;
    avg_requests_per_license: number;
  };
  violation_alerts: {
    critical_violations: number;
    warning_violations: number;
    recent_violations: ViolationDetail[];
  };
  license_usage: {
    high_usage_licenses: LicenseUsage[];
    approaching_limits: LicenseUsage[];
    healthy_licenses: number;
  };
  rate_limit_health: {
    system_capacity: number;
    peak_usage_hour: string;
    efficiency_score: number;
    recommendation: string;
  };
}

interface ViolationDetail {
  license_id: string;
  license_key: string;
  operation: string;
  violation_time: string;
  attempts: number;
  severity: 'critical' | 'warning';
}

interface LicenseUsage {
  license_id: string;
  license_key: string;
  current_usage: number;
  limit: number;
  usage_percentage: number;
  operation_type: string;
  reset_time: string;
}

const RateLimitingDashboard = () => {
  const [metrics, setMetrics] = useState<RateLimitMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchRateLimitMetrics();
    
    // Auto-refresh every minute for rate limiting data
    const interval = setInterval(fetchRateLimitMetrics, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchRateLimitMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('[RateLimitingDashboard] Fetching real rate limiting metrics from Supabase functions...');
      
      // Call the real rate limiting analytics function
      const { data: functionResult, error: rateLimitError } = await (supabase as any)
        .rpc('get_rate_limiting_metrics');
      
      if (rateLimitError) {
        console.error('[RateLimitingDashboard] RPC Error:', rateLimitError);
        setError(`Database connection failed: ${rateLimitError.message}`);
        setMetrics(null);
        return;
      }
      
      console.log('[RateLimitingDashboard] Function result:', functionResult);
      
      // Check if we have real data
      if (!functionResult || Object.keys(functionResult).length === 0) {
        console.log('[RateLimitingDashboard] No data available in database');
        setMetrics(null);
        setError(null);
        setLastUpdate(new Date());
        return;
      }
      
      // Parse the JSON result from the function
      const parsedData = functionResult;
      
      // Transform the real data from our analytics function - only use real values
      const realMetrics: RateLimitMetrics = {
        system_overview: {
          total_licenses: parsedData?.system_overview?.total_licenses ?? null,
          active_violations: parsedData?.system_overview?.active_violations ?? null,
          total_requests_today: parsedData?.system_overview?.total_requests_today ?? null,
          avg_requests_per_license: parsedData?.system_overview?.avg_requests_per_license ?? null
        },
        violation_alerts: {
          critical_violations: parsedData?.violation_alerts?.critical_violations ?? null,
          warning_violations: parsedData?.violation_alerts?.warning_violations ?? null,
          recent_violations: parsedData?.violation_alerts?.recent_violations || []
        },
        license_usage: {
          high_usage_licenses: parsedData?.license_usage?.high_usage_licenses || [],
          approaching_limits: parsedData?.license_usage?.approaching_limits || [],
          healthy_licenses: parsedData?.license_usage?.healthy_licenses ?? null
        },
        rate_limit_health: {
          system_capacity: parsedData?.rate_limit_health?.system_capacity ?? null,
          peak_usage_hour: parsedData?.rate_limit_health?.peak_usage_hour || null,
          efficiency_score: parsedData?.rate_limit_health?.efficiency_score ?? null,
          recommendation: parsedData?.rate_limit_health?.recommendation || null
        }
      };

      console.log('[RateLimitingDashboard] Processed real metrics:', realMetrics);
      setMetrics(realMetrics);
      setError(null);
      setLastUpdate(new Date());

    } catch (error) {
      console.error('[RateLimitingDashboard] Error fetching real metrics:', error);
      setError(`Failed to fetch rate limiting data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getViolationColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500/20 text-red-300 border-red-400/30';
    if (percentage >= 75) return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    if (percentage >= 50) return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return 'from-red-400 to-red-600';
    if (percentage >= 75) return 'from-yellow-400 to-orange-500';
    if (percentage >= 50) return 'from-blue-400 to-cyan-500';
    return 'from-emerald-400 to-green-500';
  };

  // Loading State
  if (isLoading) {
    return (
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <CardContent className="relative z-10 p-8">
          <div className="flex items-center justify-center gap-3">
            <Shield className="w-6 h-6 text-cyan-300 animate-pulse" />
            <span className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">
              INITIALIZING RATE LIMIT MONITORING...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error State
  if (error) {
    return (
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-red-900/50 to-orange-900/60 border border-red-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-red-400/3 via-orange-500/3 to-red-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-red-400/30 to-transparent"></div>
        
        <CardContent className="relative z-10 p-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-300" />
            <span className="text-red-200 font-jetbrains font-bold uppercase tracking-wider">
              DATABASE CONNECTION FAILED
            </span>
          </div>
          <div className="text-center text-red-300/80 font-jetbrains text-sm">
            {error}
          </div>
          <div className="flex justify-center mt-4">
            <Button
              onClick={() => fetchRateLimitMetrics()}
              size="sm"
              className="bg-red-700/80 border-red-400/40 text-red-200 hover:bg-red-600/80 hover:border-red-300/60 font-jetbrains font-bold uppercase tracking-wider"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              RETRY
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No Data State
  if (!metrics) {
    return (
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-gray-900/50 to-slate-900/60 border border-gray-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-400/3 via-slate-500/3 to-gray-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gray-400/30 to-transparent"></div>
        
        <CardContent className="relative z-10 p-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-gray-300" />
            <span className="text-gray-200 font-jetbrains font-bold uppercase tracking-wider">
              NO DATA AVAILABLE
            </span>
          </div>
          <div className="text-center text-gray-300/80 font-jetbrains text-sm mb-4">
            DATABASE CONTAINS NO RATE LIMITING METRICS
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => fetchRateLimitMetrics()}
              size="sm"
              className="bg-gray-700/80 border-gray-400/40 text-gray-200 hover:bg-gray-600/80 hover:border-gray-300/60 font-jetbrains font-bold uppercase tracking-wider"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              CHECK AGAIN
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <CardHeader className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-6 h-6 text-cyan-300" />
                RATE LIMITING CONTROL CENTER
              </CardTitle>
              <CardDescription className="text-cyan-300/80 font-jetbrains tracking-wide">
                VIOLATION MONITORING • USAGE ANALYTICS • SYSTEM PROTECTION
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-cyan-300/60 font-jetbrains">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                <Button
                  onClick={() => fetchRateLimitMetrics()}
                  disabled={isLoading}
                  size="sm"
                  className="relative z-10 bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 font-jetbrains font-bold uppercase tracking-wider backdrop-blur-sm"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  REFRESH
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* System Overview */}
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-300" />
            SYSTEM OVERVIEW
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Licenses */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.system_overview.total_licenses}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  ACTIVE LICENSES
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 backdrop-blur-sm">
                  MONITORED
                </span>
              </div>
            </div>

            {/* Active Violations */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.system_overview.active_violations}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  ACTIVE VIOLATIONS
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${
                  metrics.system_overview.active_violations > 0 
                    ? 'bg-red-500/20 text-red-300 border-red-400/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                } border backdrop-blur-sm`}>
                  {metrics.system_overview.active_violations > 0 ? 'ALERT' : 'CLEAN'}
                </span>
              </div>
            </div>

            {/* Daily Requests */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.system_overview.total_requests_today.toLocaleString()}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  REQUESTS TODAY
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 backdrop-blur-sm">
                  TRACKING
                </span>
              </div>
            </div>

            {/* Average Usage */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.system_overview.avg_requests_per_license}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  AVG PER LICENSE
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 backdrop-blur-sm">
                  OPTIMAL
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Violation Alerts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violation Alerts */}
        <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-cyan-300" />
              VIOLATION ALERTS
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            {/* Alert Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700/30 rounded-lg border border-red-400/20">
                <div className="text-center">
                  <div className="text-lg font-jetbrains font-bold text-red-300 mb-1">
                    {metrics.violation_alerts.critical_violations}
                  </div>
                  <div className="text-xs text-red-300/80 font-jetbrains uppercase tracking-wider">
                    CRITICAL
                  </div>
                </div>
              </div>
              <div className="p-3 bg-slate-700/30 rounded-lg border border-yellow-400/20">
                <div className="text-center">
                  <div className="text-lg font-jetbrains font-bold text-yellow-300 mb-1">
                    {metrics.violation_alerts.warning_violations}
                  </div>
                  <div className="text-xs text-yellow-300/80 font-jetbrains uppercase tracking-wider">
                    WARNING
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Violations */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {metrics.violation_alerts.recent_violations.length > 0 ? (
                metrics.violation_alerts.recent_violations.map((violation, index) => (
                  <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-cyan-200 font-jetbrains font-bold text-sm">
                        {violation.license_key}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getViolationColor(violation.severity)} border backdrop-blur-sm`}>
                        {violation.severity}
                      </span>
                    </div>
                    <div className="text-xs text-cyan-300/80 font-jetbrains space-y-1">
                      <div>Operation: {violation.operation}</div>
                      <div>Attempts: {violation.attempts}</div>
                      <div>Time: {new Date(violation.violation_time).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-cyan-300/60 font-jetbrains">
                  NO RECENT VIOLATIONS
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-300" />
              RATE LIMIT HEALTH
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">System Capacity</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-slate-600/50 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${metrics.rate_limit_health.system_capacity}%` }}
                  ></div>
                </div>
                <span className="text-cyan-300 font-jetbrains font-bold text-sm">{metrics.rate_limit_health.system_capacity.toFixed(0)}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Peak Usage</span>
              <span className="text-cyan-300 font-jetbrains font-bold">{metrics.rate_limit_health.peak_usage_hour}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Efficiency Score</span>
              <span className="text-emerald-300 font-jetbrains font-bold">{metrics.rate_limit_health.efficiency_score.toFixed(1)}%</span>
            </div>
            
            <div className="p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <div className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider mb-2">Recommendation</div>
              <div className="text-cyan-300/80 font-jetbrains text-sm">{metrics.rate_limit_health.recommendation}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* License Usage Analysis */}
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-300" />
            LICENSE USAGE ANALYSIS
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* High Usage Licenses */}
            <div>
              <h4 className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider mb-3">
                HIGH USAGE LICENSES ({metrics.license_usage.high_usage_licenses.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.license_usage.high_usage_licenses.length > 0 ? (
                  metrics.license_usage.high_usage_licenses.map((license, index) => (
                    <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-200 font-jetbrains font-bold text-sm">
                          {license.license_key}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getUsageColor(license.usage_percentage)} border backdrop-blur-sm`}>
                          {license.usage_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="w-full bg-slate-600/50 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${getUsageBarColor(license.usage_percentage)} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${license.usage_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-cyan-300/80 font-jetbrains">
                        {license.current_usage} / {license.limit} ({license.operation_type})
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-cyan-300/60 font-jetbrains text-sm">
                    NO HIGH USAGE LICENSES
                  </div>
                )}
              </div>
            </div>

            {/* Approaching Limits */}
            <div>
              <h4 className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider mb-3">
                APPROACHING LIMITS ({metrics.license_usage.approaching_limits.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metrics.license_usage.approaching_limits.length > 0 ? (
                  metrics.license_usage.approaching_limits.map((license, index) => (
                    <div key={index} className="p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-cyan-200 font-jetbrains font-bold text-sm">
                          {license.license_key}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getUsageColor(license.usage_percentage)} border backdrop-blur-sm`}>
                          {license.usage_percentage.toFixed(1)}%
                        </span>
                      </div>
                      <div className="mb-2">
                        <div className="w-full bg-slate-600/50 rounded-full h-2">
                          <div 
                            className={`bg-gradient-to-r ${getUsageBarColor(license.usage_percentage)} h-2 rounded-full transition-all duration-500`}
                            style={{ width: `${license.usage_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-xs text-cyan-300/80 font-jetbrains">
                        {license.current_usage} / {license.limit} ({license.operation_type})
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-cyan-300/60 font-jetbrains text-sm">
                    NO APPROACHING LIMITS
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-lg font-jetbrains font-bold text-emerald-300">
                  {metrics.license_usage.healthy_licenses}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider">
                  HEALTHY LICENSES
                </div>
              </div>
              <div className="w-px h-8 bg-cyan-400/30"></div>
              <div className="text-center">
                <div className="text-lg font-jetbrains font-bold text-yellow-300">
                  {metrics.license_usage.approaching_limits.length}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider">
                  APPROACHING LIMITS
                </div>
              </div>
              <div className="w-px h-8 bg-cyan-400/30"></div>
              <div className="text-center">
                <div className="text-lg font-jetbrains font-bold text-red-300">
                  {metrics.license_usage.high_usage_licenses.length}
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider">
                  HIGH USAGE
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RateLimitingDashboard;
