import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface ErrorAnalytics {
  total_errors: number;
  critical_errors: number;
  resolved_errors: number;
  resolution_rate: number;
  error_trends: Array<{ date: string; count: number }>;
  common_errors: Array<{ error_type: string; count: number }>;
  timeframe_days: number;
}

export const ErrorAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<ErrorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(7);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_error_analytics', {
        days_back: timeframe
      });
      
      if (error) throw error;
      setAnalytics(data as unknown as ErrorAnalytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch error analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const cleanupObsoleteErrors = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_obsolete_errors');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Cleaned up ${(data as any).deleted_count} obsolete errors`
      });
      
      await fetchAnalytics();
    } catch (error) {
      console.error('Error cleaning up obsolete errors:', error);
      toast({
        title: "Error", 
        description: "Failed to cleanup obsolete errors",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (!analytics) return null;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Error Analytics</h3>
        <div className="flex gap-2">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(Number(e.target.value))}
            className="px-3 py-1 border border-border rounded-md bg-background text-foreground"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <Button onClick={cleanupObsoleteErrors} variant="outline" size="sm">
            Cleanup Obsolete
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{analytics.total_errors}</div>
          <div className="text-sm text-muted-foreground">Total Errors</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-destructive">{analytics.critical_errors}</div>
          <div className="text-sm text-muted-foreground">Critical Errors</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">{analytics.resolved_errors}</div>
          <div className="text-sm text-muted-foreground">Resolved Errors</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{analytics.resolution_rate}%</div>
          <div className="text-sm text-muted-foreground">Resolution Rate</div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Error trends */}
        <Card className="p-6">
          <h4 className="text-md font-semibold mb-4 text-foreground">Error Trends</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.error_trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Common error types */}
        <Card className="p-6">
          <h4 className="text-md font-semibold mb-4 text-foreground">Common Error Types</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.common_errors}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ error_type, percent }) => `${error_type} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
                nameKey="error_type"
              >
                {analytics.common_errors.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};