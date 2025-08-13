import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { TrendingUp, Download, Users, Clock, BarChart3 } from 'lucide-react';

interface DownloadStats {
  script_id: string;
  script_name: string;
  total_downloads: number;
  recent_downloads: number;
  unique_users: number;
}

export const DownloadAnalytics = () => {
  const [stats, setStats] = useState<DownloadStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStats, setTotalStats] = useState({
    totalDownloads: 0,
    totalScripts: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetchDownloadStats();
  }, []);

  const fetchDownloadStats = async () => {
    try {
      setIsLoading(true);
      
      // Get detailed stats from function
      const { data: statsData, error: statsError } = await supabase
        .rpc('get_script_download_stats', { days_back: 30 });

      if (statsError) throw statsError;
      setStats(statsData || []);

      // Calculate totals
      const totals = (statsData || []).reduce(
        (acc, curr) => ({
          totalDownloads: acc.totalDownloads + Number(curr.total_downloads),
          totalScripts: acc.totalScripts + 1,
          totalUsers: acc.totalUsers + Number(curr.unique_users)
        }),
        { totalDownloads: 0, totalScripts: 0, totalUsers: 0 }
      );
      setTotalStats(totals);

    } catch (error) {
      console.error('Error fetching download stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400"></div>
        <span className="ml-3 text-cyan-300 font-jetbrains">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/50 border-blue-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-300/70 text-sm font-jetbrains">Total Downloads</p>
                <p className="text-2xl font-bold text-white font-jetbrains">{totalStats.totalDownloads}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/50 border-green-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-300/70 text-sm font-jetbrains">Active Scripts</p>
                <p className="text-2xl font-bold text-white font-jetbrains">{totalStats.totalScripts}</p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/50 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-300/70 text-sm font-jetbrains">Unique Users</p>
                <p className="text-2xl font-bold text-white font-jetbrains">{totalStats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card className="bg-slate-800/50 border-blue-500/30">
        <CardHeader>
          <CardTitle className="font-jetbrains text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-300" />
            Script Performance Analytics
          </CardTitle>
          <CardDescription className="text-blue-300/70">
            Download statistics for the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-blue-400/50 mx-auto mb-4" />
              <p className="text-blue-300/70 font-jetbrains">No download data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.map((stat) => (
                <div
                  key={stat.script_id}
                  className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg border border-blue-500/20"
                >
                  <div className="flex-1">
                    <h3 className="font-jetbrains font-semibold text-white mb-2">
                      {stat.script_name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1 text-blue-300/70">
                        <Download className="w-3 h-3" />
                        <span>{stat.total_downloads} total</span>
                      </div>
                      <div className="flex items-center gap-1 text-green-300/70">
                        <Clock className="w-3 h-3" />
                        <span>{stat.recent_downloads} recent</span>
                      </div>
                      <div className="flex items-center gap-1 text-purple-300/70">
                        <Users className="w-3 h-3" />
                        <span>{stat.unique_users} users</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={
                        stat.recent_downloads > 10 
                          ? 'bg-green-500/20 text-green-300 border-green-400/30' 
                          : stat.recent_downloads > 5
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30'
                          : 'bg-blue-500/20 text-blue-300 border-blue-400/30'
                      }
                    >
                      {stat.recent_downloads > 10 ? 'Hot' : stat.recent_downloads > 5 ? 'Popular' : 'Stable'}
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