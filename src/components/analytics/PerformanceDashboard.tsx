import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Database, Clock, BarChart3, RefreshCw, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { performanceCacheService } from '@/utils/services/performanceCacheService';
import { supabase } from '@/integrations/supabase/client';

interface PerformanceMetrics {
  cache_hit_rates: {
    pattern_cache: number;
    key_cache: number;
    analytics_cache: number;
    overall: number;
  };
  response_times: {
    url_generation_avg: number;
    pattern_analysis_avg: number;
    database_query_avg: number;
    cache_lookup_avg: number;
  };
  system_health: {
    memory_usage_mb: number;
    active_connections: number;
    database_performance: string;
    cache_efficiency: string;
  };
  optimization_stats: {
    cache_saves_count: number;
    performance_improvement: number;
    cpu_utilization_reduction: number;
    total_operations: number;
  };
}

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchPerformanceMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPerformanceMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPerformanceMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[PerformanceDashboard] Fetching real performance metrics from Supabase functions...');
      
      // Call the real analytics function using RPC with type assertion
      const { data: functionResult, error: perfError } = await (supabase as any)
        .rpc('get_system_performance_metrics');
      
      if (perfError) {
        console.error('[PerformanceDashboard] RPC Error:', perfError);
        setError(`Database connection failed: ${perfError.message}`);
        setMetrics(null);
        return;
      }
      
      console.log('[PerformanceDashboard] Function result:', functionResult);
      
      // Check if we have real data
      if (!functionResult || Object.keys(functionResult).length === 0) {
        console.log('[PerformanceDashboard] No data available in database');
        setMetrics(null);
        setError(null);
        setLastUpdate(new Date());
        return;
      }
      
      // Parse the JSON result from the function
      const parsedData = functionResult;
      
      // Transform the real data from our analytics function - only use real values
      const realMetrics = {
        cache_hit_rates: {
          pattern_cache: parsedData?.cache_hit_rates?.pattern_cache ?? null,
          key_cache: parsedData?.cache_hit_rates?.key_cache ?? null,
          analytics_cache: parsedData?.cache_hit_rates?.analytics_cache ?? null,
          overall: parsedData?.cache_hit_rates?.overall ?? null
        },
        response_times: {
          url_generation_avg: parsedData?.response_times?.url_generation_avg ?? null,
          pattern_analysis_avg: parsedData?.response_times?.pattern_analysis_avg ?? null,
          database_query_avg: parsedData?.response_times?.database_query_avg ?? null,
          cache_lookup_avg: parsedData?.response_times?.cache_lookup_avg ?? null
        },
        system_health: {
          memory_usage_mb: parsedData?.system_health?.memory_usage_mb ?? null,
          active_connections: parsedData?.system_health?.active_connections ?? null,
          database_performance: parsedData?.system_health?.database_performance || null,
          cache_efficiency: parsedData?.system_health?.cache_efficiency || null
        },
        optimization_stats: {
          cache_saves_count: parsedData?.optimization_stats?.cache_saves_count ?? null,
          performance_improvement: parsedData?.optimization_stats?.performance_improvement ?? null,
          cpu_utilization_reduction: parsedData?.optimization_stats?.cpu_utilization_reduction ?? null,
          total_operations: parsedData?.optimization_stats?.total_operations ?? null
        }
      };
      
      console.log('[PerformanceDashboard] Processed real metrics:', realMetrics);
      setMetrics(realMetrics);
      setError(null);
      setLastUpdate(new Date());
      
    } catch (error) {
      console.error('[PerformanceDashboard] Error fetching real metrics:', error);
      setError(`Failed to fetch performance data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMetrics(null);
    } finally {
      setIsLoading(false);
    }
  };

  const getHealthColor = (value: number, good: number, excellent: number) => {
    if (value >= excellent) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
    if (value >= good) return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    return 'bg-red-500/20 text-red-300 border-red-400/30';
  };

  const getResponseTimeColor = (ms: number) => {
    if (ms <= 50) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
    if (ms <= 100) return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    return 'bg-red-500/20 text-red-300 border-red-400/30';
  };

  // Loading State
  if (isLoading) {
    return (
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <CardContent className="relative z-10 p-8">
          <div className="flex items-center justify-center gap-3">
            <Activity className="w-6 h-6 text-cyan-300 animate-pulse" />
            <span className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">
              INITIALIZING PERFORMANCE MONITORING...
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
              onClick={() => fetchPerformanceMetrics()}
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
            <Database className="w-6 h-6 text-gray-300" />
            <span className="text-gray-200 font-jetbrains font-bold uppercase tracking-wider">
              NO DATA AVAILABLE
            </span>
          </div>
          <div className="text-center text-gray-300/80 font-jetbrains text-sm mb-4">
            DATABASE CONTAINS NO PERFORMANCE METRICS
          </div>
          <div className="flex justify-center">
            <Button
              onClick={() => fetchPerformanceMetrics()}
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
                <Zap className="w-6 h-6 text-cyan-300" />
                SYSTEM PERFORMANCE MONITOR
              </CardTitle>
              <CardDescription className="text-cyan-300/80 font-jetbrains tracking-wide">
                REAL-TIME CACHE EFFICIENCY • RESPONSE TIMES • OPTIMIZATION METRICS
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-cyan-300/60 font-jetbrains">
                Updated: {lastUpdate.toLocaleTimeString()}
              </span>
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                <Button
                  onClick={() => fetchPerformanceMetrics()}
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

      {/* Cache Performance Metrics */}
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-300" />
            CACHE PERFORMANCE ANALYSIS
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Pattern Cache */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">PATTERN CACHE</span>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getHealthColor(metrics.cache_hit_rates.pattern_cache, 80, 90)} border backdrop-blur-sm`}>
                  {metrics.cache_hit_rates.pattern_cache.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-600/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.cache_hit_rates.pattern_cache}%` }}
                ></div>
              </div>
            </div>

            {/* Key Cache */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">KEY CACHE</span>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getHealthColor(metrics.cache_hit_rates.key_cache, 80, 90)} border backdrop-blur-sm`}>
                  {metrics.cache_hit_rates.key_cache.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-600/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-emerald-400 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.cache_hit_rates.key_cache}%` }}
                ></div>
              </div>
            </div>

            {/* Analytics Cache */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">ANALYTICS CACHE</span>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getHealthColor(metrics.cache_hit_rates.analytics_cache, 80, 90)} border backdrop-blur-sm`}>
                  {metrics.cache_hit_rates.analytics_cache.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-600/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.cache_hit_rates.analytics_cache}%` }}
                ></div>
              </div>
            </div>

            {/* Overall Performance */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">OVERALL</span>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getHealthColor(metrics.cache_hit_rates.overall, 80, 90)} border backdrop-blur-sm`}>
                  {metrics.cache_hit_rates.overall.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-600/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${metrics.cache_hit_rates.overall}%` }}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Time Metrics */}
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-300" />
            RESPONSE TIME ANALYSIS
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* URL Generation */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.response_times.url_generation_avg.toFixed(0)}ms
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  URL GENERATION
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getResponseTimeColor(metrics.response_times.url_generation_avg)} border backdrop-blur-sm`}>
                  {metrics.response_times.url_generation_avg <= 50 ? 'EXCELLENT' : 
                   metrics.response_times.url_generation_avg <= 100 ? 'GOOD' : 'SLOW'}
                </span>
              </div>
            </div>

            {/* Pattern Analysis */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.response_times.pattern_analysis_avg.toFixed(0)}ms
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  PATTERN ANALYSIS
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getResponseTimeColor(metrics.response_times.pattern_analysis_avg)} border backdrop-blur-sm`}>
                  {metrics.response_times.pattern_analysis_avg <= 50 ? 'EXCELLENT' : 
                   metrics.response_times.pattern_analysis_avg <= 100 ? 'GOOD' : 'SLOW'}
                </span>
              </div>
            </div>

            {/* Database Query */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.response_times.database_query_avg.toFixed(0)}ms
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  DATABASE QUERY
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getResponseTimeColor(metrics.response_times.database_query_avg)} border backdrop-blur-sm`}>
                  {metrics.response_times.database_query_avg <= 50 ? 'EXCELLENT' : 
                   metrics.response_times.database_query_avg <= 100 ? 'GOOD' : 'SLOW'}
                </span>
              </div>
            </div>

            {/* Cache Lookup */}
            <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-2xl font-jetbrains font-bold text-cyan-200 mb-1">
                  {metrics.response_times.cache_lookup_avg.toFixed(1)}ms
                </div>
                <div className="text-xs text-cyan-300/80 font-jetbrains uppercase tracking-wider mb-2">
                  CACHE LOOKUP
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getResponseTimeColor(metrics.response_times.cache_lookup_avg)} border backdrop-blur-sm`}>
                  LIGHTNING
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health & Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health */}
        <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-300" />
              SYSTEM HEALTH
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Memory Usage</span>
              <span className="text-cyan-300 font-jetbrains font-bold">{metrics.system_health.memory_usage_mb.toFixed(0)} MB</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Active Connections</span>
              <span className="text-cyan-300 font-jetbrains font-bold">{metrics.system_health.active_connections}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">DB Performance</span>
              <span className="px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
                {metrics.system_health.database_performance}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Cache Efficiency</span>
              <span className="px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-sm">
                {metrics.system_health.cache_efficiency}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Optimization Stats */}
        <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
          
          <CardHeader className="relative z-10">
            <CardTitle className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-cyan-300" />
              OPTIMIZATION IMPACT
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Cache Saves</span>
              <span className="text-cyan-300 font-jetbrains font-bold">{metrics.optimization_stats.cache_saves_count.toLocaleString()}</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Performance Boost</span>
              <span className="text-emerald-300 font-jetbrains font-bold">+{metrics.optimization_stats.performance_improvement.toFixed(1)}%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">CPU Reduction</span>
              <span className="text-emerald-300 font-jetbrains font-bold">-{metrics.optimization_stats.cpu_utilization_reduction.toFixed(1)}%</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-cyan-400/20">
              <span className="text-cyan-200 font-jetbrains font-bold text-sm uppercase tracking-wider">Total Operations</span>
              <span className="text-cyan-300 font-jetbrains font-bold">{metrics.optimization_stats.total_operations.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
