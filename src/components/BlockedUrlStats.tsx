
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deadUrlCache } from '@/utils/analytics/deadUrlCache';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react';

const BlockedUrlStats: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [recentErrors, setRecentErrors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadStats = () => {
    const cacheStats = deadUrlCache.getStats();
    setStats(cacheStats);
  };

  const loadRecentErrors = async () => {
    try {
      const { data, error } = await supabase
        .from('system_error_logs')
        .select('*')
        .eq('error_type', 'dead_url')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentErrors(data || []);
    } catch (error) {
      console.error('Error loading recent blocked URL errors:', error);
    }
  };

  const clearCache = () => {
    deadUrlCache.clear();
    loadStats();
    toast({
      title: "Cache Cleared",
      description: "Dead URL cache has been cleared successfully.",
    });
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      loadStats();
      await loadRecentErrors();
      setLoading(false);
    };

    loadData();

    // Refresh stats every 30 seconds
    const interval = setInterval(() => {
      loadStats();
      loadRecentErrors();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-blue-500/5 to-purple-500/5 animate-gradient-flow"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
            BLOCKED URL ATTEMPTS
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center justify-center p-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 to-blue-500/40 rounded-full animate-pulse blur-md"></div>
              <div className="relative z-10 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 backdrop-blur-sm border border-cyan-400/40 flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-300"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-blue-500/5 to-purple-500/5 animate-gradient-flow"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line"></div>
        
        <CardHeader className="relative z-10 flex flex-row items-center justify-between">
          <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
            BLOCKED URL ATTEMPTS
          </CardTitle>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={clearCache}
              className="relative z-10 bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 font-jetbrains font-bold uppercase tracking-wider backdrop-blur-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              PURGE CACHE
            </Button>
          </div>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent font-jetbrains">
                {stats?.totalUniqueDeadUrls || 0}
              </div>
              <div className="text-sm text-cyan-300/80 font-jetbrains font-bold uppercase tracking-wider mt-2">
                UNIQUE DEAD URLS
              </div>
            </div>
            <div className="text-center p-6 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent font-jetbrains">
                {stats?.totalAttempts || 0}
              </div>
              <div className="text-sm text-cyan-300/80 font-jetbrains font-bold uppercase tracking-wider mt-2">
                TOTAL ATTEMPTS
              </div>
            </div>
            <div className="text-center p-6 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent font-jetbrains">
                {recentErrors.length}
              </div>
              <div className="text-sm text-cyan-300/80 font-jetbrains font-bold uppercase tracking-wider mt-2">
                RECENT LOGS
              </div>
            </div>
          </div>

          {stats?.topDeadUrls && stats.topDeadUrls.length > 0 && (
            <div className="mb-8">
              <h4 className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-lg mb-4">
                MOST ATTEMPTED DEAD URLS
              </h4>
              <div className="space-y-3">
                {stats.topDeadUrls.map((url: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
                    <code className="text-cyan-300 font-jetbrains bg-slate-800/60 px-3 py-1 rounded border border-cyan-400/30">
                      {url.hash}
                    </code>
                    <Badge className="bg-red-600/30 border-red-400/40 text-red-300 hover:bg-red-600/50 hover:border-red-300/60 font-jetbrains font-bold uppercase tracking-wider">
                      {url.attempts} ATTEMPTS
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-blue-500/5 to-purple-500/5 animate-gradient-flow"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line"></div>
        
        <CardHeader className="relative z-10">
          <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
            RECENT BLOCKED URL LOGS
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {recentErrors.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-green-400/40 to-emerald-500/40 rounded-full animate-pulse blur-md"></div>
                <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-br from-green-400/30 to-emerald-500/30 backdrop-blur-sm border border-green-400/40 flex items-center justify-center">
                  <AlertTriangle className="w-8 h-8 text-green-300" />
                </div>
              </div>
              <p className="text-cyan-300/80 font-jetbrains font-bold uppercase tracking-wider">
                NO RECENT BLOCKED URL ATTEMPTS
              </p>
              <p className="text-cyan-400/60 font-jetbrains text-sm mt-2">
                ALIEN PHANTOM ENGINE SECURITY ACTIVE
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentErrors.map((error) => (
                <div key={error.id} className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="text-cyan-300 font-jetbrains font-medium text-sm mb-2">
                        {error.error_message}
                      </div>
                      <div className="text-xs text-cyan-400/60 font-jetbrains">
                        {new Date(error.created_at).toLocaleString()}
                      </div>
                    </div>
                    <Badge className="ml-4 bg-yellow-600/30 border-yellow-400/40 text-yellow-300 hover:bg-yellow-600/50 hover:border-yellow-300/60 font-jetbrains font-bold uppercase tracking-wider">
                      {error.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockedUrlStats;
