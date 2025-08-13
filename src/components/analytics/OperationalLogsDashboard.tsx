import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface OperationalLog {
  id: string;
  operation_type: string;
  operation_message: string;
  operation_details: any;
  severity: string;
  created_at: string;
  user_session_token?: string;
  license_key_id?: string;
}

export const OperationalLogsDashboard = () => {
  const [logs, setLogs] = useState<OperationalLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('operational_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter !== 'all') {
        query = query.eq('operation_type', filter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching operational logs:', error);
      toast({
        title: "Error",
        description: "Failed to fetch operational logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'warning': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'error': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getOperationTypeColor = (type: string) => {
    switch (type) {
      case 'manual_decision': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'url_generation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'authentication': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'telegram_notification': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const operationTypes = ['all', 'manual_decision', 'url_generation', 'authentication', 'telegram_notification'];

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-foreground">Operational Logs</h3>
        <div className="flex gap-2">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1 border border-border rounded-md bg-background text-foreground"
          >
            {operationTypes.map(type => (
              <option key={type} value={type}>
                {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold text-foreground">{logs.length}</div>
          <div className="text-sm text-muted-foreground">Total Operations</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {logs.filter(log => log.severity === 'success' || log.severity === 'info').length}
          </div>
          <div className="text-sm text-muted-foreground">Successful</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-yellow-600">
            {logs.filter(log => log.severity === 'warning').length}
          </div>
          <div className="text-sm text-muted-foreground">Warnings</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">
            {logs.filter(log => log.severity === 'error').length}
          </div>
          <div className="text-sm text-muted-foreground">Errors</div>
        </Card>
      </div>

      {/* Logs table */}
      <Card className="p-6">
        <div className="space-y-4">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No operational logs found for the selected filter.
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge className={getOperationTypeColor(log.operation_type)}>
                        {log.operation_type.replace('_', ' ')}
                      </Badge>
                      <Badge className={getSeverityColor(log.severity)}>
                        {log.severity}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                    
                    <div className="text-sm text-foreground font-medium">
                      {log.operation_message}
                    </div>
                    
                    {log.operation_details && Object.keys(log.operation_details).length > 0 && (
                      <details className="text-xs text-muted-foreground">
                        <summary className="cursor-pointer">View details</summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(log.operation_details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};