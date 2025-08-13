import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SystemHealthDashboard } from '@/components/analytics/SystemHealthDashboard';
import { SystemHealthMonitor } from '@/components/analytics/SystemHealthMonitor';
import { BulkActionToolbar } from '@/components/BulkActionToolbar';
import { ResponsiveTable, ResponsiveTableHeader, ResponsiveTableBody, ResponsiveTableRow, ResponsiveTableCell, ResponsiveTableHeaderCell } from '@/components/ResponsiveTable';
import BlockedUrlStats from '@/components/BlockedUrlStats';
import { ScriptManager } from '@/components/ScriptManager';
import PerformanceDashboard from '@/components/analytics/PerformanceDashboard';
import RateLimitingDashboard from '@/components/analytics/RateLimitingDashboard';
import CacheAnalyticsDashboard from '@/components/analytics/CacheAnalyticsDashboard';
import { Zap, Key, Plus, Copy, Eye, EyeOff, Pause, Play, Trash2, RefreshCw, AlertTriangle, CheckCircle, Activity, Package, LogOut } from 'lucide-react';
import { AdminAuthWrapper } from '@/components/admin/AdminAuthWrapper';

interface LicenseKey {
  id: string;
  license_key: string;
  is_active: boolean;
  status: 'active' | 'paused' | 'expired';
  created_at: string;
  expires_at: string | null;
  password_generation_count: number;
  max_password_generations: number;
  metadata: any;
  expiry_preset: string | null;
  assigned_user_email: string | null;
}

interface SystemErrorLog {
  id: string;
  error_type: string;
  error_message: string;
  error_details: any;
  user_session_token: string | null;
  license_key_id: string | null;
  severity: 'info' | 'warning' | 'error' | 'critical';
  resolved_status: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const EXPIRY_PRESETS = [
  { value: '1_day', label: '1 Day' },
  { value: '2_days', label: '2 Days' },
  { value: '5_days', label: '5 Days' },
  { value: '1_month', label: '1 Month (30 days)' },
  { value: '1_year', label: '1 Year (365 days)' },
  { value: 'lifetime', label: 'Lifetime' }
];

interface AdminPanelProps {
  initialData?: {
    licenseKeys: LicenseKey[];
    systemErrors: SystemErrorLog[];
    totalCounts: {[key: string]: number};
  };
  onLogout?: () => void;
}

const AdminPanel = ({ initialData, onLogout }: AdminPanelProps) => {
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>(initialData?.licenseKeys || []);
  const [systemErrors, setSystemErrors] = useState<SystemErrorLog[]>(initialData?.systemErrors || []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [showTokens, setShowTokens] = useState(false);
  const { toast } = useToast();

  // Form states
  const [keyCount, setKeyCount] = useState(1);
  const [expiryPreset, setExpiryPreset] = useState<string>('1_month');
  const [userName, setUserName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<{[key: string]: number}>({
    licenses: 1,
    errors: 1
  });
  const [itemsPerPage] = useState(20);
  const [totalCounts, setTotalCounts] = useState<{[key: string]: number}>(initialData?.totalCounts || {
    licenses: 0,
    errors: 0
  });

  // Bulk operation states - Fixed to prevent cross-contamination
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<string[]>([]);

  // Refs for checkbox indeterminate states
  const licensesSelectAllRef = useRef<HTMLInputElement>(null);
  const errorsSelectAllRef = useRef<HTMLInputElement>(null);

  // Update indeterminate states when selections change
  useEffect(() => {
    if (licensesSelectAllRef.current) {
      const isIndeterminate = selectedLicenses.length > 0 && selectedLicenses.length < licenseKeys.length;
      licensesSelectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedLicenses, licenseKeys]);

  useEffect(() => {
    if (errorsSelectAllRef.current) {
      const isIndeterminate = selectedErrors.length > 0 && selectedErrors.length < systemErrors.length;
      errorsSelectAllRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedErrors, systemErrors]);

  // Clear selections when data changes to prevent stale selections
  useEffect(() => {
    setSelectedLicenses(prev => prev.filter(id => licenseKeys.some(key => key.id === id)));
  }, [licenseKeys]);

  useEffect(() => {
    setSelectedErrors(prev => prev.filter(id => systemErrors.some(error => error.id === id)));
  }, [systemErrors]);

  useEffect(() => {
    // Only fetch data if not provided initially
    if (!initialData) {
      fetchData(true);
    }
    // Set up automatic cleanup every 5 minutes
    const cleanupInterval = setInterval(cleanupExpiredLicenses, 5 * 60 * 1000);
    // Set up dashboard refresh every 3 minutes (background refresh)
    const refreshInterval = setInterval(() => fetchData(false), 3 * 60 * 1000);
    
    return () => {
      clearInterval(cleanupInterval);
      clearInterval(refreshInterval);
    };
  }, [initialData]);

  const fetchData = async (showLoading = false) => {
    try {
      if (showLoading) setIsLoading(true);
      
      // Fetch license keys with pagination
      const licenseQuery = supabase
        .from('license_keys')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      const { data: keys, error: keysError, count: licensesCount } = await licenseQuery
        .range(
          (currentPage.licenses - 1) * itemsPerPage,
          currentPage.licenses * itemsPerPage - 1
        );

      if (keysError) throw keysError;
      setLicenseKeys(keys || []);
      setTotalCounts(prev => ({ ...prev, licenses: licensesCount || 0 }));

      // Fetch system error logs
      const errorQuery = supabase
        .from('system_error_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      const { data: errorLogs, error: errorLogsError, count: errorsCount } = await errorQuery
        .range(
          (currentPage.errors - 1) * itemsPerPage,
          currentPage.errors * itemsPerPage - 1
        );

      if (errorLogsError) throw errorLogsError;
      setSystemErrors((errorLogs || []) as SystemErrorLog[]);
      setTotalCounts(prev => ({ ...prev, errors: errorsCount || 0 }));

    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive"
      });
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const generateLicenseKeys = async () => {
    try {
      setIsGenerating(true);
      
      const keys = [];
      const generatedKeys = [];
      
      for (let i = 0; i < keyCount; i++) {
        const email = keyCount === 1 && userName ? userName : null;
        
        const { data, error } = await supabase.rpc('generate_license_with_preset', {
          preset: expiryPreset,
          user_email_input: email
        });

        if (error) throw error;
        if (!(data as any)?.success) throw new Error((data as any)?.error);
        
        keys.push(data);
        generatedKeys.push((data as any).license_key);
      }

      // Auto-copy license keys to clipboard
      if (generatedKeys.length === 1) {
        await navigator.clipboard.writeText(generatedKeys[0]);
        toast({
          title: "License Generated & Copied!",
          description: `License key copied to clipboard automatically`,
        });
      } else {
        const allKeys = generatedKeys.join('\n');
        await navigator.clipboard.writeText(allKeys);
        toast({
          title: "Licenses Generated & Copied!",
          description: `All ${keyCount} license keys copied to clipboard`,
        });
      }

      // Reset form
      setKeyCount(1);
      setExpiryPreset('1_month');
      setUserName('');
      
      // Refresh data
      fetchData();

    } catch (error: any) {
      console.error('Error generating keys:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to generate license keys. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLicenseStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      console.log('Toggling license status:', { id, currentStatus, newStatus });
      
      const { data, error } = await supabase.rpc('toggle_license_status', {
        license_id: id,
        new_status: newStatus
      });

      console.log('Toggle response:', { data, error });
      
      if (error) throw error;
      if (!(data as any)?.success) throw new Error((data as any)?.error);

      toast({
        title: "Status Updated",
        description: `License ${newStatus === 'active' ? 'activated' : 'paused'}`,
      });

      fetchData();

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update license status",
        variant: "destructive"
      });
    }
  };

  const deleteLicense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('license_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: "License deleted successfully",
      });

      fetchData();

    } catch (error: any) {
      console.error('Error deleting license:', error);
      toast({
        title: "Error",
        description: "Failed to delete license",
        variant: "destructive"
      });
    }
  };

  const cleanupExpiredLicenses = async () => {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_licenses');
      
      if (error) throw error;
      
      if (data > 0) {
        toast({
          title: "Cleanup Complete",
          description: `Removed ${data} expired license(s)`,
        });
        fetchData();
      }
    } catch (error: any) {
      console.error('Error during cleanup:', error);
    }
  };

  const performComprehensiveCleanup = async () => {
    try {
      setIsLoading(true);
      
      // Run sequential cleanup operations to avoid overloading
      let totalCleaned = 0;
      let successCount = 0;

      // Clean expired licenses
      try {
        const { data: expiredResult, error } = await supabase.rpc('cleanup_expired_licenses');
        if (!error && typeof expiredResult === 'number') {
          totalCleaned += expiredResult;
          successCount++;
        }
      } catch (error) {
        console.error('Failed to cleanup expired licenses:', error);
      }

      // Clean user sessions
      try {
        const { data: sessionsResult, error } = await supabase.rpc('cleanup_user_sessions', { days_old: 7 });
        if (!error && sessionsResult && typeof sessionsResult === 'object') {
          const result = sessionsResult as any;
          if (result.deleted_sessions) totalCleaned += result.deleted_sessions;
          successCount++;
        }
      } catch (error) {
        console.error('Failed to cleanup user sessions:', error);
      }

      // Clean visit stats
      try {
        const { data: statsResult, error } = await supabase.rpc('cleanup_visit_stats', { days_old: 30 });
        if (!error && statsResult && typeof statsResult === 'object') {
          const result = statsResult as any;
          if (result.deleted_stats) totalCleaned += result.deleted_stats;
          successCount++;
        }
      } catch (error) {
        console.error('Failed to cleanup visit stats:', error);
      }

      // Clean orphaned sessions
      try {
        const { data: orphanedResult, error } = await supabase.rpc('cleanup_orphaned_sessions');
        if (!error && orphanedResult && typeof orphanedResult === 'object') {
          const result = orphanedResult as any;
          if (result.deleted_sessions) totalCleaned += result.deleted_sessions;
          successCount++;
        }
      } catch (error) {
        console.error('Failed to cleanup orphaned sessions:', error);
      }

      // Run automated cleanup function
      try {
        await supabase.rpc('auto_cleanup_expired_data');
        successCount++;
      } catch (error) {
        console.error('Failed to run auto cleanup:', error);
      }

      toast({
        title: "Database Purge Complete",
        description: `Successfully executed ${successCount} cleanup operations, cleaned ${totalCleaned} records`,
      });

      fetchData();

    } catch (error: any) {
      console.error('Error during comprehensive cleanup:', error);
      toast({
        title: "Cleanup Error",
        description: "Some cleanup operations failed. Check console for details.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupInactiveLicenseData = async () => {
    try {
      // Clean up data for inactive/paused licenses
      const { data: inactiveLicenses, error: fetchError } = await supabase
        .from('license_keys')
        .select('id')
        .or('status.eq.paused,status.eq.expired,is_active.eq.false');

      if (fetchError) throw fetchError;

      if (inactiveLicenses && inactiveLicenses.length > 0) {
        const licenseIds = inactiveLicenses.map(l => l.id);
        
        // Clean up sessions for inactive licenses
        const { error: sessionsError } = await supabase
          .from('user_sessions')
          .delete()
          .in('license_key_id', licenseIds);

        if (sessionsError) throw sessionsError;

        toast({
          title: "Inactive License Cleanup",
          description: `Cleaned up data for ${inactiveLicenses.length} inactive licenses`,
        });

        fetchData();
      } else {
        toast({
          title: "No Cleanup Needed",
          description: "No inactive license data found to clean",
        });
      }

    } catch (error: any) {
      console.error('Error cleaning inactive license data:', error);
      toast({
        title: "Cleanup Error",
        description: "Failed to clean inactive license data",
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const getStatusColor = (status: string, isActive: boolean, expiresAt: string | null) => {
    if (!isActive || status === 'paused') return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
    if (status === 'expired' || (expiresAt && new Date(expiresAt) < new Date())) return 'bg-red-500/20 text-red-300 border-red-400/30';
    return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30';
  };

  const getStatusText = (status: string, isActive: boolean, expiresAt: string | null) => {
    if (!isActive || status === 'paused') return 'Paused';
    if (status === 'expired' || (expiresAt && new Date(expiresAt) < new Date())) return 'Expired';
    return 'Active';
  };

  const resolveSystemError = async (errorId: string) => {
    try {
      const { error } = await supabase.rpc('resolve_system_error', {
        error_id_input: errorId,
        resolved_by_input: 'Admin'
      });

      if (error) throw error;

      setSystemErrors(prev => 
        prev.map(err => 
          err.id === errorId 
            ? { ...err, resolved_status: true, resolved_by: 'Admin', resolved_at: new Date().toISOString() }
            : err
        )
      );

      toast({
        title: "Error Resolved",
        description: "System error marked as resolved",
      });
    } catch (error) {
      console.error('Error resolving system error:', error);
      toast({
        title: "Error",
        description: "Failed to resolve system error",
        variant: "destructive"
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/30 text-red-200 border-red-400/40';
      case 'error': return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'warning': return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'info': return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      default: return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getErrorTypeColor = (errorType: string) => {
    switch (errorType) {
      case 'telegram_config': return 'bg-purple-500/20 text-purple-300 border-purple-400/30';
      case 'telegram_send': return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'encryption': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      case 'decryption': return 'bg-orange-500/20 text-orange-300 border-orange-400/30';
      default: return 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30';
    }
  };

  // FIXED: Bulk operation handlers with proper state management
  const handleBulkDeleteLicenses = async () => {
    if (selectedLicenses.length === 0) return;
    
    try {
      const { data, error } = await supabase.rpc('bulk_delete_licenses', {
        license_ids: selectedLicenses
      });

      if (error) throw error;

      const result = data as any;
      toast({
        title: "Bulk Delete Complete",
        description: `Deleted ${result.deleted_count} of ${result.total_requested} licenses`,
      });

      setSelectedLicenses([]);
      fetchData();

    } catch (error: any) {
      console.error('Error bulk deleting licenses:', error);
      toast({
        title: "Error",
        description: "Failed to delete licenses",
        variant: "destructive"
      });
    }
  };

  const handleBulkToggleLicenseStatus = async () => {
    if (selectedLicenses.length === 0) return;
    
    // Determine new status (if majority are active, pause them; otherwise activate)
    const selectedKeys = licenseKeys.filter(key => selectedLicenses.includes(key.id));
    const activeCount = selectedKeys.filter(key => key.status === 'active').length;
    const newStatus = activeCount > selectedKeys.length / 2 ? 'paused' : 'active';
    
    try {
      const { data, error } = await supabase.rpc('bulk_toggle_license_status', {
        license_ids: selectedLicenses,
        new_status: newStatus
      });

      if (error) throw error;

      const result = data as any;
      toast({
        title: "Bulk Status Update Complete",
        description: `Updated ${result.updated_count} licenses to ${newStatus}`,
      });

      setSelectedLicenses([]);
      fetchData();

    } catch (error: any) {
      console.error('Error bulk updating license status:', error);
      toast({
        title: "Error",
        description: "Failed to update license status",
        variant: "destructive"
      });
    }
  };

  const handleBulkExportLicenses = async () => {
    if (selectedLicenses.length === 0) return;
    
    const selectedKeys = licenseKeys.filter(key => selectedLicenses.includes(key.id));
    const exportData = selectedKeys.map(key => ({
      license_key: key.license_key,
      user_email: key.assigned_user_email || 'Unassigned',
      status: key.status,
      created_at: key.created_at,
      expires_at: key.expires_at || 'Never',
      expiry_preset: key.expiry_preset || 'Custom'
    }));

    const csvContent = [
      'License Key,User Email,Status,Created Date,Expires Date,Expiry Preset',
      ...exportData.map(row => 
        `"${row.license_key}","${row.user_email}","${row.status}","${row.created_at}","${row.expires_at}","${row.expiry_preset}"`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `licenses_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${selectedLicenses.length} licenses to CSV`,
    });

    setSelectedLicenses([]);
  };

  const handleBulkResolveErrors = async () => {
    if (selectedErrors.length === 0) return;
    
    try {
      const { data, error } = await supabase.rpc('bulk_resolve_errors', {
        error_ids: selectedErrors,
        resolved_by_input: 'Admin'
      });

      if (error) throw error;

      const result = data as any;
      toast({
        title: "Bulk Resolve Complete",
        description: `Resolved ${result.resolved_count} of ${result.total_requested} errors`,
      });

      setSelectedErrors([]);
      fetchData();

    } catch (error: any) {
      console.error('Error bulk resolving errors:', error);
      toast({
        title: "Error",
        description: "Failed to resolve errors",
        variant: "destructive"
      });
    }
  };

  const handleBulkDeleteErrors = async () => {
    if (selectedErrors.length === 0) return;
    
    try {
      const { data, error } = await supabase.rpc('bulk_delete_errors', {
        error_ids: selectedErrors
      });

      if (error) throw error;

      const result = data as any;
      toast({
        title: "Bulk Delete Complete",
        description: `Deleted ${result.deleted_count} resolved errors`,
      });

      setSelectedErrors([]);
      fetchData();

    } catch (error: any) {
      console.error('Error bulk deleting errors:', error);
      toast({
        title: "Error",
        description: "Failed to delete errors",
        variant: "destructive"
      });
    }
  };

  // FIXED: Selection handlers with proper logic and event handling
  const handleSelectAllLicenses = (checked: boolean) => {
    if (checked) {
      setSelectedLicenses(licenseKeys.map(key => key.id));
    } else {
      setSelectedLicenses([]);
    }
  };

  const handleSelectLicense = (licenseId: string, checked: boolean) => {
    setSelectedLicenses(prev => {
      if (checked) {
        return prev.includes(licenseId) ? prev : [...prev, licenseId];
      } else {
        return prev.filter(id => id !== licenseId);
      }
    });
  };

  const handleSelectAllErrors = (checked: boolean) => {
    if (checked) {
      setSelectedErrors(systemErrors.map(error => error.id));
    } else {
      setSelectedErrors([]);
    }
  };

  const handleSelectError = (errorId: string, checked: boolean) => {
    setSelectedErrors(prev => {
      if (checked) {
        return prev.includes(errorId) ? prev : [...prev, errorId];
      } else {
        return prev.filter(id => id !== errorId);
      }
    });
  };

  return (
      <div className="min-h-screen w-full fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 overflow-y-auto overflow-x-hidden relative">
      {/* Stable background effects - no movement animations */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle static decorative elements */}
        <div className="absolute top-20 left-10 w-12 h-12 bg-cyan-400/5 backdrop-blur-sm rounded-lg opacity-60"></div>
        <div className="absolute top-40 right-16 w-8 h-8 bg-blue-400/5 backdrop-blur-sm rounded-full opacity-60"></div>
        <div className="absolute bottom-32 left-1/4 w-16 h-6 bg-purple-400/5 backdrop-blur-sm transform rotate-45 opacity-60"></div>
        <div className="absolute bottom-20 right-1/3 w-10 h-10 bg-teal-400/5 backdrop-blur-sm transform rotate-12 opacity-60"></div>
        
        {/* Single subtle scan line - reduced frequency */}
        <div className="absolute top-1/3 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent"></div>
        
        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(90deg,transparent_24px,rgba(59,130,246,0.3)_25px,rgba(59,130,246,0.3)_26px,transparent_27px,transparent_49px,rgba(59,130,246,0.3)_50px,rgba(59,130,246,0.3)_51px,transparent_52px),linear-gradient(rgba(59,130,246,0.3)_24px,transparent_25px,transparent_26px,rgba(59,130,246,0.3)_27px,rgba(59,130,246,0.3)_49px,transparent_50px,transparent_51px,rgba(59,130,246,0.3)_52px)] bg-[size:52px_52px]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto p-2 sm:p-4 lg:p-6 relative z-10 min-h-full">
        <div className="flex flex-row items-start gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-xl blur-sm"></div>
            <div className="relative z-10 p-2 sm:p-3 lg:p-4 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-xl border border-cyan-400/30 backdrop-blur-sm">
              <Zap className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-cyan-300" />
            </div>
          </div>
          <div className="flex-1 min-w-0 hidden md:block">
            <h1 className="text-base sm:text-lg md:text-2xl lg:text-3xl xl:text-4xl font-bold bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains uppercase tracking-wider mb-0.5 sm:mb-1 lg:mb-2 leading-tight break-words">
              RAPIDREACH CONTROL CENTER
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-cyan-300/80 font-jetbrains tracking-wide leading-tight">
              <span className="hidden sm:inline">SYSTEM MANAGEMENT • AUTOMATED CLEANUP • ENHANCED SECURITY</span>
              <span className="sm:hidden">SYSTEM MGMT</span>
            </p>
          </div>
          {onLogout && (
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="ml-auto bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 font-jetbrains text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-9"
            >
              <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Disconnect</span>
            </Button>
          )}
        </div>

        <Tabs defaultValue="generate" className="space-y-4 sm:space-y-6 lg:space-y-8">
          <div className="relative">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="generate" className="flex-shrink-0">
                <Plus className="w-4 h-4 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">LICENSE</span>
              </TabsTrigger>
              <TabsTrigger value="keys" className="flex-shrink-0">
                <Key className="w-4 h-4 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">USERS ({totalCounts.licenses})</span>
              </TabsTrigger>
              <TabsTrigger value="errors" className="flex-shrink-0">
                <AlertTriangle className="w-4 h-4 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">ERRORS ({totalCounts.errors})</span>
              </TabsTrigger>
              <TabsTrigger value="health" className="flex-shrink-0">
                <Activity className="w-4 h-4 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">MONITORING</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex-shrink-0">
                <Zap className="w-4 h-4 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">PERFORMANCE</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="flex-shrink-0">
                <Package className="w-4 h-4 sm:w-4 sm:h-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">FILES</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="generate">
            <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">LICENSE GENERATOR</CardTitle>
                <CardDescription className="text-cyan-300/80 font-jetbrains tracking-wide">
                  GENERATE LICENSE KEYS WITH EXPIRY SETTINGS
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <Label className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-sm">KEY QUANTITY</Label>
                    <Input
                      type="number"
                      value={keyCount}
                      onChange={(e) => setKeyCount(Math.max(1, parseInt(e.target.value) || 1))}
                      min="1"
                      max="50"
                      className="bg-slate-700/80 border-cyan-400/30 text-cyan-200 font-jetbrains backdrop-blur-sm focus:border-cyan-300/60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-sm">LICENSE</Label>
                    <select 
                      value={expiryPreset} 
                      onChange={(e) => setExpiryPreset(e.target.value)}
                      className="bg-slate-700/80 border border-cyan-400/30 text-cyan-200 font-jetbrains rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-cyan-500/50 backdrop-blur-sm"
                    >
                      {EXPIRY_PRESETS.map((preset) => (
                        <option key={preset.value} value={preset.value} className="bg-slate-800">
                          {preset.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-sm">USERNAME</Label>
                    <Input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="ASSIGN USER"
                      className="bg-slate-700/80 border-cyan-400/30 text-cyan-200 font-jetbrains backdrop-blur-sm focus:border-cyan-300/60 disabled:opacity-50"
                      disabled={keyCount > 1}
                    />
                    {keyCount > 1 && (
                      <p className="text-xs text-cyan-300/60 font-jetbrains mt-1">
                        USER ASSIGNMENT REQUIRES SINGLE KEY MODE
                      </p>
                    )}
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                  <Button 
                    onClick={generateLicenseKeys}
                    disabled={isGenerating}
                    className="relative z-10 w-full h-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-jetbrains font-bold uppercase tracking-wider border-0 shadow-lg"
                  >
                    {isGenerating ? '⚡ FORGING KEYS...' : `⚡ FORGE ${keyCount} KEY${keyCount > 1 ? 'S' : ''}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="keys">
            <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider flex items-center justify-between">
                  USER LICENSE DATABASE
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowTokens(!showTokens)}
                      className="relative z-10 bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 font-jetbrains font-bold uppercase tracking-wider backdrop-blur-sm"
                    >
                      {showTokens ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      <span className="ml-2 hidden sm:inline">{showTokens ? 'HIDE' : 'REVEAL'}</span>
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                {selectedLicenses.length > 0 && (
                   <div className="mb-6">
                     <BulkActionToolbar
                       selectedItems={selectedLicenses}
                       onClearSelection={() => setSelectedLicenses([])}
                       onBulkDelete={handleBulkDeleteLicenses}
                       onBulkToggleStatus={handleBulkToggleLicenseStatus}
                       onBulkExport={handleBulkExportLicenses}
                       itemType="licenses"
                     />
                   </div>
                 )}
                <ResponsiveTable>
                  <ResponsiveTableHeader>
                    <tr className="border-b border-cyan-400/30">
                      <ResponsiveTableHeaderCell priority="high" className="w-12">
                        <input
                          ref={licensesSelectAllRef}
                          type="checkbox"
                          checked={selectedLicenses.length === licenseKeys.length && licenseKeys.length > 0}
                          onChange={(e) => handleSelectAllLicenses(e.target.checked)}
                          className="rounded border-cyan-400/30 bg-slate-700/80 text-cyan-500 focus:ring-cyan-500/50 touch-target"
                        />
                      </ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell priority="high">LICENSE KEY</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell priority="medium">USERNAME</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell priority="high">STATUS</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell priority="low">USAGE</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell priority="low">EXPIRES</ResponsiveTableHeaderCell>
                      <ResponsiveTableHeaderCell priority="high">CONTROLS</ResponsiveTableHeaderCell>
                    </tr>
                  </ResponsiveTableHeader>
                  <ResponsiveTableBody>
                    {licenseKeys.map((key) => (
                      <ResponsiveTableRow 
                        key={key.id} 
                        className={`${selectedLicenses.includes(key.id) ? 'bg-cyan-500/10' : ''}`}
                         mobileLayout={
                           <div className="p-4 space-y-5 hover:bg-slate-800/40 transition-colors duration-200 rounded-lg border border-cyan-400/20">
                             <div className="flex items-center justify-between mb-4">
                               <input
                                 type="checkbox"
                                 checked={selectedLicenses.includes(key.id)}
                                 onChange={(e) => {
                                   e.stopPropagation();
                                   handleSelectLicense(key.id, e.target.checked);
                                 }}
                                 className="rounded border-cyan-400/30 bg-slate-700/80 text-cyan-500 focus:ring-cyan-500/50 touch-target h-5 w-5"
                               />
                                <span className={`px-3 py-1.5 rounded-md text-xs font-jetbrains font-medium uppercase tracking-wider ${getStatusColor(key.status, key.is_active, key.expires_at)} border backdrop-blur-sm`}>
                                  {getStatusText(key.status, key.is_active, key.expires_at)}
                                </span>
                             </div>
                             
                             <div className="space-y-3">
                               <div className="text-xs text-cyan-400 uppercase font-jetbrains mb-2 tracking-wider">LICENSE KEY</div>
                               <div className="flex items-center gap-3">
                                 <code className="bg-slate-700/70 px-3 py-2.5 rounded border border-cyan-400/30 backdrop-blur-sm text-xs break-all flex-1">
                                   {showTokens ? key.license_key : '●●●●●●●●●●●●●●●●●●●●●●●●'}
                                 </code>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => copyToClipboard(key.license_key)}
                                   className="p-3 h-12 w-12 hover:bg-cyan-500/20 text-cyan-400 touch-target flex-shrink-0 rounded-lg"
                                   title="Copy license key"
                                 >
                                   <Copy className="w-4 h-4" />
                                 </Button>
                               </div>
                             </div>

                             <div className="space-y-3">
                               <div className="text-xs text-cyan-400 uppercase font-jetbrains mb-2 tracking-wider">USERNAME</div>
                               <div className="text-cyan-300 font-jetbrains text-sm min-h-[1.25rem]">
                                 {key.assigned_user_email || (
                                   <span className="text-slate-400 italic">UNASSIGNED</span>
                                 )}
                               </div>
                             </div>

                             <div className="grid grid-cols-2 gap-6">
                               <div className="space-y-3">
                                 <div className="text-xs text-cyan-400 uppercase font-jetbrains tracking-wider">USAGE</div>
                                 <div className="text-cyan-300 font-jetbrains font-bold text-sm min-h-[1.25rem]">
                                   {key.password_generation_count}/{key.max_password_generations} USES
                                 </div>
                               </div>
                               <div className="space-y-3">
                                 <div className="text-xs text-cyan-400 uppercase font-jetbrains tracking-wider">EXPIRES</div>
                                 <div className="text-cyan-300 font-jetbrains text-sm min-h-[1.25rem]">
                                   {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'ETERNAL'}
                                 </div>
                               </div>
                             </div>

                             <div className="space-y-4 pt-2 border-t border-cyan-400/20">
                               <div className="text-xs text-cyan-400 uppercase font-jetbrains tracking-wider">CONTROLS</div>
                               <div className="flex gap-3">
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => toggleLicenseStatus(key.id, key.status)}
                                   className="bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm touch-target flex-1 h-11 min-w-0"
                                   disabled={key.status === 'expired'}
                                   title={key.status === 'active' ? 'Pause license' : 'Activate license'}
                                 >
                                   {key.status === 'active' ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                   <span className="text-xs font-semibold">
                                     {key.status === 'active' ? 'PAUSE' : 'ACTIVATE'}
                                   </span>
                                 </Button>
                                 <Button
                                   variant="outline"
                                   size="sm"
                                   onClick={() => deleteLicense(key.id)}
                                   className="bg-red-600/30 border-red-400/40 text-red-300 hover:bg-red-600/50 hover:border-red-300/60 backdrop-blur-sm touch-target px-4 h-11"
                                   title="Delete license"
                                 >
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                               </div>
                             </div>
                           </div>
                        }
                      >
                        <ResponsiveTableCell priority="high">
                          <input
                            type="checkbox"
                            checked={selectedLicenses.includes(key.id)}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleSelectLicense(key.id, e.target.checked);
                            }}
                            className="rounded border-cyan-400/30 bg-slate-700/80 text-cyan-500 focus:ring-cyan-500/50"
                          />
                        </ResponsiveTableCell>
                         <ResponsiveTableCell priority="high" label="License Key" className="text-cyan-300 font-jetbrains">
                           <div className="flex items-center gap-3">
                             <code className="bg-slate-700/70 px-3 py-2 rounded border border-cyan-400/30 backdrop-blur-sm text-sm">
                               {showTokens ? key.license_key : '●●●●●●●●●●●●●●●●●●●●●●●●'}
                             </code>
                             <Button
                               variant="ghost"
                               size="sm"
                               onClick={() => copyToClipboard(key.license_key)}
                               className="p-2 h-9 w-9 hover:bg-cyan-500/20 text-cyan-400 rounded-lg"
                               title="Copy license key"
                             >
                               <Copy className="w-4 h-4" />
                             </Button>
                           </div>
                         </ResponsiveTableCell>
                        <ResponsiveTableCell priority="medium" label="Username" className="text-cyan-300 font-jetbrains">
                          {key.assigned_user_email || (
                            <span className="text-slate-400 italic">UNASSIGNED</span>
                          )}
                        </ResponsiveTableCell>
                        <ResponsiveTableCell priority="high" label="Status">
                           <div className="space-y-2">
                              <span className={`px-3 py-1.5 rounded-md text-xs font-jetbrains font-medium uppercase tracking-wider ${getStatusColor(key.status, key.is_active, key.expires_at)} border backdrop-blur-sm`}>
                                {getStatusText(key.status, key.is_active, key.expires_at)}
                              </span>
                             {key.expiry_preset && (
                               <div className="text-xs text-cyan-400/60 font-jetbrains uppercase tracking-wide">
                                 {EXPIRY_PRESETS.find(p => p.value === key.expiry_preset)?.label}
                               </div>
                             )}
                           </div>
                         </ResponsiveTableCell>
                        <ResponsiveTableCell priority="low" label="Usage" className="text-cyan-300 font-jetbrains font-bold">
                          {key.password_generation_count}/{key.max_password_generations} USES
                        </ResponsiveTableCell>
                        <ResponsiveTableCell priority="low" label="Expires" className="text-cyan-300 font-jetbrains">
                          {key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'ETERNAL'}
                        </ResponsiveTableCell>
                         <ResponsiveTableCell priority="high" label="Controls">
                           <div className="flex gap-3">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => toggleLicenseStatus(key.id, key.status)}
                               className="bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 backdrop-blur-sm px-3 py-2 h-9"
                               disabled={key.status === 'expired'}
                               title={key.status === 'active' ? 'Pause license' : 'Activate license'}
                             >
                               {key.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                             </Button>
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => deleteLicense(key.id)}
                               className="bg-red-600/30 border-red-400/40 text-red-300 hover:bg-red-600/50 hover:border-red-300/60 backdrop-blur-sm px-3 py-2 h-9"
                               title="Delete license"
                             >
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                         </ResponsiveTableCell>
                      </ResponsiveTableRow>
                       ))}
                  </ResponsiveTableBody>
                </ResponsiveTable>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            {/* System Error Logs Section - First */}
            <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
                  SYSTEM ERROR LOGS
                </CardTitle>
                <CardDescription className="text-cyan-300/80 font-jetbrains tracking-wide">
                  TELEGRAM FAILURES • ENCRYPTION ERRORS • CRITICAL SYSTEM ALERTS
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                 {selectedErrors.length > 0 && (
                   <div className="mb-4">
                     <BulkActionToolbar
                       selectedItems={selectedErrors}
                       onClearSelection={() => setSelectedErrors([])}
                       onBulkDelete={handleBulkDeleteErrors}
                       onBulkToggleStatus={handleBulkResolveErrors}
                       itemType="errors"
                     />
                   </div>
                 )}
                 <div className="mb-4 flex gap-4 text-sm font-jetbrains">
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-red-500/30 rounded-full border border-red-400/40"></div>
                     <span className="text-red-300">Unresolved: {systemErrors.filter(e => !e.resolved_status).length}</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <div className="w-3 h-3 bg-green-500/30 rounded-full border border-green-400/40"></div>
                     <span className="text-green-300">Resolved: {systemErrors.filter(e => e.resolved_status).length}</span>
                   </div>
                 </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cyan-400/30">
                        <th className="text-left p-3 text-cyan-200 font-jetbrains font-bold uppercase tracking-wider w-12">
                          <input
                            ref={errorsSelectAllRef}
                            type="checkbox"
                            checked={selectedErrors.length === systemErrors.length && systemErrors.length > 0}
                            onChange={(e) => handleSelectAllErrors(e.target.checked)}
                            className="rounded border-cyan-400/30 bg-slate-700/80 text-cyan-500 focus:ring-cyan-500/50"
                          />
                        </th>
                        <th className="text-left p-3 text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">TYPE</th>
                        <th className="text-left p-3 text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">SEVERITY</th>
                        <th className="text-left p-3 text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">MESSAGE</th>
                        <th className="text-left p-3 text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">TIMESTAMP</th>
                        <th className="text-left p-3 text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">STATUS</th>
                        <th className="text-left p-3 text-cyan-200 font-jetbrains font-bold uppercase tracking-wider">ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {systemErrors.map((error) => (
                        <tr key={error.id} className={`border-b border-cyan-400/10 hover:bg-cyan-500/5 transition-colors ${selectedErrors.includes(error.id) ? 'bg-cyan-500/10' : ''}`}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={selectedErrors.includes(error.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                handleSelectError(error.id, e.target.checked);
                              }}
                              className="rounded border-cyan-400/30 bg-slate-700/80 text-cyan-500 focus:ring-cyan-500/50"
                            />
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getErrorTypeColor(error.error_type)} border backdrop-blur-sm`}>
                              {error.error_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider ${getSeverityColor(error.severity)} border backdrop-blur-sm`}>
                              {error.severity}
                            </span>
                          </td>
                          <td className="p-3 text-cyan-300 font-jetbrains max-w-md">
                            <div className="truncate" title={error.error_message}>
                              {error.error_message}
                            </div>
                            {error.error_details && (
                              <div className="text-xs text-cyan-400/60 mt-1">
                                {JSON.stringify(error.error_details).slice(0, 100)}...
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-cyan-300 font-jetbrains text-xs">
                            {new Date(error.created_at).toLocaleString()}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {error.resolved_status ? (
                                <span className="px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider bg-green-500/20 text-green-300 border border-green-400/30 backdrop-blur-sm">
                                  <CheckCircle className="w-3 h-3 inline mr-1" />
                                  RESOLVED
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-full text-xs font-jetbrains font-bold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-400/30 backdrop-blur-sm">
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  ACTIVE
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            {!error.resolved_status && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => resolveSystemError(error.id)}
                                className="bg-green-600/30 border-green-400/40 text-green-300 hover:bg-green-600/50 hover:border-green-300/60 backdrop-blur-sm"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                RESOLVE
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {systemErrors.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-cyan-300/60 font-jetbrains">
                            NO SYSTEM ERRORS DETECTED
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Blocked URLs Stats Section - Second */}
            <Card className="relative bg-gradient-to-br from-slate-800/80 via-purple-900/50 to-violet-900/60 border border-purple-400/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400/3 via-violet-500/3 to-indigo-500/3"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="bg-gradient-to-r from-purple-200 via-violet-200 to-indigo-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
                  BLOCKED URLS STATISTICS
                </CardTitle>
                <CardDescription className="text-purple-300/80 font-jetbrains tracking-wide">
                  DEAD URL ATTEMPTS • CACHE MANAGEMENT • REQUEST PATTERNS
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <BlockedUrlStats />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health">
            <div className="space-y-6">
              <SystemHealthMonitor />
              <SystemHealthDashboard />
              
              {/* Database Cleanup Section */}
              <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
                    DATABASE MAINTENANCE
                  </CardTitle>
                  <CardDescription className="text-cyan-300/80 font-jetbrains tracking-wide">
                    AUTOMATED CLEANUP • DATA OPTIMIZATION • SYSTEM MAINTENANCE
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    
                    {/* Comprehensive Cleanup */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-xl opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                      <Button
                        onClick={performComprehensiveCleanup}
                        disabled={isLoading}
                        className="relative z-10 w-full h-16 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-jetbrains font-bold uppercase tracking-wider border-0 shadow-lg flex flex-col items-center justify-center"
                      >
                        <RefreshCw className="w-6 h-6 mb-1" />
                        COMPREHENSIVE PURGE
                      </Button>
                    </div>

                    {/* Expired Licenses Only */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                      <Button
                        onClick={cleanupExpiredLicenses}
                        variant="outline"
                        className="relative z-10 w-full h-16 bg-slate-800/80 border-yellow-400/40 text-yellow-200 hover:bg-slate-700/80 hover:border-yellow-300/60 font-jetbrains font-bold uppercase tracking-wider backdrop-blur-sm flex flex-col items-center justify-center"
                      >
                        <Trash2 className="w-5 h-5 mb-1" />
                        PURGE EXPIRED
                      </Button>
                    </div>

                    {/* Inactive License Data */}
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                      <Button
                        onClick={cleanupInactiveLicenseData}
                        variant="outline"
                        className="relative z-10 w-full h-16 bg-slate-800/80 border-red-400/40 text-red-200 hover:bg-slate-700/80 hover:border-red-300/60 font-jetbrains font-bold uppercase tracking-wider backdrop-blur-sm flex flex-col items-center justify-center"
                      >
                        <AlertTriangle className="w-5 h-5 mb-1" />
                        CLEAN INACTIVE
                      </Button>
                    </div>
                  </div>

                  {/* Cleanup Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
                      <h4 className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-sm mb-3">COMPREHENSIVE PURGE TARGETS</h4>
                      <ul className="space-y-2 text-cyan-300/80 text-sm font-jetbrains">
                        <li>• Expired licenses (older than 30 days)</li>
                        <li>• Old user sessions (older than 7 days)</li>
                        <li>• Outdated visit statistics (older than 30 days)</li>
                        <li>• Orphaned session records</li>
                        <li>• Deactivated URL entries</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-slate-700/30 rounded-lg border border-cyan-400/20 backdrop-blur-sm">
                      <h4 className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-sm mb-3">SECURITY BENEFITS</h4>
                      <ul className="space-y-2 text-cyan-300/80 text-sm font-jetbrains">
                        <li>• Prevents database bloat</li>
                        <li>• Removes inactive user data</li>
                        <li>• Ensures URL security compliance</li>
                        <li>• Optimizes query performance</li>
                        <li>• Maintains data integrity</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-400/30 backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-300" />
                      <h4 className="text-yellow-200 font-jetbrains font-bold uppercase tracking-wider text-sm">AUTOMATED CLEANUP ACTIVE</h4>
                    </div>
                    <p className="text-yellow-300/80 text-sm font-jetbrains leading-relaxed">
                      The system automatically performs expired license cleanup every 5 minutes and refreshes health data every 3 minutes. 
                      Manual cleanup operations ensure optimal database performance and security compliance.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="space-y-6">
              {/* Performance Analytics */}
              <PerformanceDashboard />
              
              {/* Rate Limiting Section */}
              <RateLimitingDashboard />
              
              {/* Cache Analytics Section */}
              <CacheAnalyticsDashboard />
            </div>
          </TabsContent>

          <TabsContent value="files">
            <Card className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/3 via-blue-500/3 to-purple-500/3"></div>
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"></div>
              
              <CardHeader className="relative z-10">
                <CardTitle className="bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains font-bold text-xl uppercase tracking-wider">
                  FILE MANAGEMENT SYSTEM
                </CardTitle>
                <CardDescription className="text-cyan-300/80 font-jetbrains tracking-wide">
                  UPLOAD AND MANAGE SCRIPT DOWNLOADS FOR USERS
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10">
                <ScriptManager />
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>
        </div>
      </div>
  );
};

const WrappedAdminPanel = () => (
  <AdminAuthWrapper>
    {(data, onLogout) => <AdminPanel initialData={data} onLogout={onLogout} />}
  </AdminAuthWrapper>
);

export default WrappedAdminPanel;
