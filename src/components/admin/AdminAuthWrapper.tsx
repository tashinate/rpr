
import React, { useState, useEffect } from 'react';
import { AdminLoginForm } from './AdminLoginForm';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { LogOut, Zap } from 'lucide-react';

interface AdminData {
  licenseKeys: any[];
  systemErrors: any[];
  totalCounts: {[key: string]: number};
}

interface AdminAuthWrapperProps {
  children: (data?: AdminData, onLogout?: () => void) => React.ReactNode;
}

export const AdminAuthWrapper: React.FC<AdminAuthWrapperProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [username, setUsername] = useState<string>('');
  const [adminData, setAdminData] = useState<AdminData | undefined>(undefined);

  useEffect(() => {
    checkAdminSession();
  }, []);

  const checkAdminSession = async () => {
    const sessionToken = localStorage.getItem('admin_session_token');
    const storedUsername = localStorage.getItem('admin_username');
    const expiresAt = localStorage.getItem('admin_expires_at');

    if (!sessionToken || !expiresAt) {
      setIsLoading(false);
      return;
    }

    // Check if session has expired locally
    if (new Date(expiresAt) <= new Date()) {
      handleLogout();
      return;
    }

    try {
      const { data, error } = await supabase.rpc('validate_admin_session', {
        session_token_input: sessionToken
      });

      if (error) {
        throw error;
      }

      const result = data as any;
      if (result?.valid) {
        setIsAuthenticated(true);
        setUsername(storedUsername || result.username);
        
        // Pre-load admin data
        await loadAdminData();
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Session validation error:', error);
      handleLogout();
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Fetch license keys with pagination
      const { data: keys, error: keysError, count: licensesCount } = await supabase
        .from('license_keys')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 19); // First 20 items

      if (keysError) throw keysError;

      // Fetch system error logs
      const { data: errorLogs, error: errorLogsError, count: errorsCount } = await supabase
        .from('system_error_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 19); // First 20 items

      if (errorLogsError) throw errorLogsError;

      setAdminData({
        licenseKeys: keys || [],
        systemErrors: errorLogs || [],
        totalCounts: {
          licenses: licensesCount || 0,
          errors: errorsCount || 0
        }
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      // Don't show error toast for initial load
    }
  };

  const handleLoginSuccess = async (sessionToken: string, adminUsername: string) => {
    setIsAuthenticated(true);
    setUsername(adminUsername);
    
    // Pre-load admin data after successful login
    await loadAdminData();
  };

  const handleLogout = async () => {
    const sessionToken = localStorage.getItem('admin_session_token');
    
    if (sessionToken) {
      try {
        await supabase.rpc('logout_admin', {
          session_token_input: sessionToken
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('admin_session_token');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_expires_at');
    
    setIsAuthenticated(false);
    setUsername('');
    toast.success('Logged out successfully');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 bg-[length:400%_400%] animate-gradient-flow flex items-center justify-center relative overflow-hidden">
        {/* Animated background effects */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute top-20 left-10 w-16 h-16 bg-cyan-400/10 backdrop-blur-sm rounded-lg animate-float-1"></div>
          <div className="absolute top-40 right-16 w-12 h-12 bg-blue-400/10 backdrop-blur-sm rounded-full animate-float-2"></div>
        </div>
        
        <div className="text-center space-y-4 relative z-10">
          <div className="mx-auto relative w-16 h-16 mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 to-blue-500/40 rounded-xl animate-pulse blur-md"></div>
            <div className="relative z-10 w-full h-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-xl border border-cyan-400/40 backdrop-blur-sm flex items-center justify-center">
              <Zap className="w-8 h-8 text-cyan-300 animate-pulse" />
            </div>
          </div>
          <div className="text-cyan-300/80 font-jetbrains tracking-wide uppercase inline-flex">
            {"INITIALIZING RAPIDREACH CONTROL CENTER...".split('').map((char, index) => (
              <span
                key={index}
                className="animate-wave-letter"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative">
      {/* Admin Content */}
      <div className="p-6">
        {children(adminData, handleLogout)}
      </div>
    </div>
  );
};
