import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Key, User, Activity, ChevronDown, ChevronUp, Zap, Shield, Database } from 'lucide-react';
import ExpiryCountdown from '../ExpiryCountdown';
import { useToast } from '@/hooks/use-toast';

interface LicenseData {
  license_key: string;
  expires_at: string | null;
  expiry_preset: string | null;
  password_generation_count: number;
  max_password_generations: number;
  status: string;
  assigned_user_email: string | null;
}

const UserLicenseStatus: React.FC = () => {
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed
  const { toast } = useToast();

  const fetchLicenseData = async () => {
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        console.log('No session token found');
        setLicenseData(null);
        setLoading(false);
        return;
      }

      console.log('Fetching license data with token:', sessionToken.slice(0, 8) + '...');

      // Get session and join with license data
      const { data: sessionData, error: sessionError } = await supabase
        .from('user_sessions')
        .select(`
          *,
          license_keys:license_key_id (
            license_key,
            expires_at,
            expiry_preset,
            password_generation_count,
            max_password_generations,
            status,
            assigned_user_email
          )
        `)
        .eq('session_token', sessionToken)
        .eq('is_active', true)
        .maybeSingle();

      console.log('Session query result:', { sessionData, sessionError });

      if (sessionError) {
        console.error('License session error:', sessionError);
        setLicenseData(null);
        setLoading(false);
        return;
      }

      if (!sessionData) {
        console.log('No session data found');
        setLicenseData(null);
        setLoading(false);
        return;
      }

      if (!sessionData.license_keys) {
        console.log('No license keys found in session data');
        setLicenseData(null);
        setLoading(false);
        return;
      }

      const licenseInfo = sessionData.license_keys as any;
      console.log('License data found:', licenseInfo);
      setLicenseData(licenseInfo);
    } catch (error) {
      console.error('Error fetching license data:', error);
      setLicenseData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenseData();
    
    // Set up real-time subscription for license status changes
    const channel = supabase
      .channel('license-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'license_keys'
        },
        (payload) => {
          console.log('License status changed:', payload);
          fetchLicenseData();
          
          // Show toast notification for status changes
          if (payload.eventType === 'UPDATE' && payload.new.status !== payload.old?.status) {
            toast({
              title: "License Status Updated",
              description: `License status changed to: ${payload.new.status}`,
              variant: payload.new.status === 'paused' ? 'destructive' : 'default'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  // Handle loading state first
  if (loading) {
    return (
      <Card className="mb-6 relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        
        <CardContent className="relative z-10 p-6">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-6 h-6 bg-cyan-400/30 rounded animate-pulse"></div>
              <div className="h-5 bg-cyan-400/20 rounded w-1/3"></div>
            </div>
            <div className="h-4 bg-blue-400/20 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle no license data
  if (!licenseData) {
    return null;
  }

  const getStatusBadge = () => {
    switch (licenseData.status) {
      case 'active':
        return (
          <Badge className="bg-gradient-to-r from-emerald-500/30 to-green-400/30 text-emerald-200 border border-emerald-400/40 font-jetbrains font-bold uppercase tracking-wider">
            OPERATIONAL
          </Badge>
        );
      case 'paused':
        return (
          <Badge className="bg-gradient-to-r from-yellow-500/30 to-orange-400/30 text-yellow-200 border border-yellow-400/40 font-jetbrains font-bold uppercase tracking-wider">
            SUSPENDED
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-gradient-to-r from-red-500/30 to-pink-400/30 text-red-200 border border-red-400/40 font-jetbrains font-bold uppercase tracking-wider">
            TERMINATED
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gradient-to-r from-gray-500/30 to-slate-400/30 text-gray-200 border border-gray-400/40 font-jetbrains font-bold uppercase tracking-wider">
            {licenseData.status.toUpperCase()}
          </Badge>
        );
    }
  };

  const getGenerationDisplay = () => {
    return `${licenseData.password_generation_count} / ${licenseData.max_password_generations} PASSWORD GENERATIONS`;
  };

  const getGenerationPercentage = () => {
    return (licenseData.password_generation_count / licenseData.max_password_generations) * 100;
  };

  const formatExpiryPreset = (preset: string | null) => {
    if (!preset) return 'CUSTOM PROTOCOL';
    
    const formatMap: { [key: string]: string } = {
      '1_day': 'ALPHA1 [24H]',
      '2_days': 'BETA2 [48H]', 
      '5_days': 'GAMMA5 [120H]',
      '1_month': 'DELTA30 [LUNAR]',
      '1_year': 'OMEGA365 [SOLAR]',
      'lifetime': 'QUANTUM ETERNAL'
    };
    
    return formatMap[preset] || `${preset.toUpperCase()} PROTOCOL`;
  };

  const generationPercentage = getGenerationPercentage();
  const isNearLimit = generationPercentage > 80;

  return (
    <Card className="mb-6 relative bg-glass-tier-1 border border-cyan-400/30 backdrop-blur-sm overflow-hidden shadow-2xl">
      {/* Simplified background effects */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
      
      <CardContent className="relative z-10 p-0">
        {/* Header - Always visible */}
        <div 
          className="p-6 cursor-pointer flex items-center justify-between hover:bg-cyan-500/10 transition-all duration-300 group"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                {getStatusBadge()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ExpiryCountdown 
              expiresAt={licenseData.expires_at} 
              expiryPreset={licenseData.expiry_preset}
            />
            <div className="p-2 rounded-lg bg-slate-700/50 border border-cyan-400/30 group-hover:border-cyan-300/50 transition-colors">
              {isCollapsed ? (
                <ChevronDown className="w-5 h-5 text-cyan-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-cyan-400" />
              )}
            </div>
          </div>
        </div>

        {/* Expandable content - Reordered */}
        {!isCollapsed && (
          <div className="px-6 pb-6 space-y-4 border-t border-cyan-400/20 bg-gradient-to-b from-transparent to-blue-900/20">
            
            {/* 1. User Email - First (Identity) */}
            {licenseData.assigned_user_email && (
              <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-cyan-400/20">
                <div className="p-2 bg-gradient-to-br from-purple-400/20 to-blue-500/20 rounded-lg border border-purple-400/30">
                  <User className="w-5 h-5 text-purple-300" />
                </div>
                <div className="flex-1">
                  <span className="text-purple-200 font-jetbrains text-sm">{licenseData.assigned_user_email}</span>
                </div>
              </div>
            )}

            {/* 2. License Type - Second (Plan Information) */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-cyan-400/20">
              <div className="p-2 bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-lg border border-indigo-400/30">
                <Zap className="w-5 h-5 text-indigo-300" />
              </div>
              <div className="flex-1">
                <Badge variant="outline" className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-200 border-indigo-400/40 font-jetbrains font-bold uppercase tracking-wider">
                  {formatExpiryPreset(licenseData.expiry_preset)}
                </Badge>
              </div>
            </div>

            {/* 3. Password Generation Status - Third (Usage Tracking) */}
            <div className="space-y-3 p-4 rounded-lg bg-slate-800/50 border border-cyan-400/20">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-lg border border-orange-400/30">
                  <Database className="w-5 h-5 text-orange-300" />
                </div>
                <div className="flex-1">
                  <span className={`font-jetbrains text-lg font-bold ${isNearLimit ? 'text-yellow-300' : 'text-orange-200'}`}>
                    {getGenerationDisplay()}
                  </span>
                </div>
              </div>
              
              {/* Simplified Progress Bar - Removed percentage display */}
              <div className="w-full bg-slate-700/70 rounded-full h-3 overflow-hidden border border-cyan-400/20">
                <div 
                  className={`h-full transition-all duration-500 ${
                    generationPercentage > 90 ? 'bg-gradient-to-r from-red-500 to-pink-400' :
                    generationPercentage > 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-400' : 
                    'bg-gradient-to-r from-emerald-500 to-cyan-400'
                  }`}
                  style={{ width: `${Math.min(generationPercentage, 100)}%` }}
                />
              </div>
            </div>

            {/* 4. License Key - Last (Technical Details) */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-slate-800/50 border border-cyan-400/20">
              <div className="p-2 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
                <Key className="w-5 h-5 text-cyan-300" />
              </div>
              <div className="flex-1">
                <code className="text-cyan-200 font-jetbrains text-sm bg-slate-700/70 px-3 py-2 rounded border border-cyan-400/30">
                  {licenseData.license_key.slice(0, 8)}●●●●●●●●{licenseData.license_key.slice(-4)}
                </code>
              </div>
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserLicenseStatus;
