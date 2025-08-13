
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Bot, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalVisits: number;
  humanVisits: number;
  botVisits: number;
  todayVisits: number;
  todayHuman: number;
  todayBot: number;
}

export const AnalyticsSummaryCards: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalVisits: 0,
    humanVisits: 0,
    botVisits: 0,
    todayVisits: 0,
    todayHuman: 0,
    todayBot: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
    
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchAnalyticsData, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const { data, error } = await supabase.rpc('get_real_analytics_summary' as any);
      
      if (error) {
        console.error('Error fetching analytics data:', error);
        return;
      }

      // Handle null values for today's data and cast the response
      const analyticsResult = data as any;
      setAnalyticsData({
        totalVisits: analyticsResult?.totalVisits || 0,
        humanVisits: analyticsResult?.humanVisits || 0,
        botVisits: analyticsResult?.botVisits || 0,
        todayVisits: analyticsResult?.todayVisits || 0,
        todayHuman: analyticsResult?.todayHuman || 0,
        todayBot: analyticsResult?.todayBot || 0,
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  const humanPercentage = analyticsData.totalVisits > 0 ? 
    Math.round((analyticsData.humanVisits / analyticsData.totalVisits) * 100) : 0;
  
  const botPercentage = analyticsData.totalVisits > 0 ? 
    Math.round((analyticsData.botVisits / analyticsData.totalVisits) * 100) : 0;

  const cards = [
    {
      title: 'HUMAN VISITORS',
      value: analyticsData.humanVisits.toLocaleString(),
      percentage: humanPercentage,
      icon: Users,
      color: 'emerald',
      description: `${analyticsData.todayHuman} today`,
      gradient: 'from-emerald-500/40 to-green-400/40',
      border: 'border-emerald-400/50',
      text: 'text-emerald-300'
    },
    {
      title: 'BOT DETECTIONS',
      value: analyticsData.botVisits.toLocaleString(),
      percentage: botPercentage,
      icon: Bot,
      color: 'red',
      description: `${analyticsData.todayBot} today`,
      gradient: 'from-red-500/40 to-orange-400/40',
      border: 'border-red-400/50',
      text: 'text-red-300'
    },
    {
      title: 'TOTAL VISITS',
      value: analyticsData.totalVisits.toLocaleString(),
      percentage: 100,
      icon: Eye,
      color: 'blue',
      description: `${analyticsData.todayVisits} today`,
      gradient: 'from-cyan-500/40 to-blue-400/40',
      border: 'border-cyan-400/50',
      text: 'text-cyan-300'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {[1, 2, 3].map((i) => (
          <Card 
            key={i}
            className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border-cyan-500/20 backdrop-blur-sm overflow-hidden"
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-slate-700/50 rounded-lg animate-pulse">
                  <RefreshCw className="w-5 h-5 text-cyan-400/50 animate-spin" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="h-3 bg-slate-700/50 rounded animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="h-8 bg-slate-700/50 rounded animate-pulse"></div>
                <div className="flex items-center justify-between">
                  <div className="h-3 bg-slate-700/50 rounded flex-1 mr-4 animate-pulse"></div>
                  <div className="h-3 bg-slate-700/50 rounded w-8 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
      {cards.map((card, index) => (
        <Card 
          key={card.title}
          className={`relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 ${card.border} backdrop-blur-sm overflow-hidden hover:scale-105 transition-all duration-300 shadow-2xl`}
        >
          {/* Animated background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} animate-pulse`}></div>
          
          <CardContent className="relative z-10 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 bg-gradient-to-br ${card.gradient} rounded-lg ${card.border}`}>
                <card.icon className={`w-5 h-5 ${card.text}`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className={`font-jetbrains text-xs font-bold ${card.text} uppercase tracking-wider block truncate`}>
                  {card.title}
                </span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className={`font-jetbrains text-2xl font-bold ${card.text}`}>
                {card.value}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-jetbrains text-xs">
                  {card.description}
                </span>
                <span className={`font-jetbrains text-xs font-bold ${card.text}`}>
                  {card.percentage}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
