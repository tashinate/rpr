
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import UserAuthenticationForm from './UserAuthenticationForm';
import LicenseKeyValidation from './LicenseKeyValidation';
import { validateSessionWithDatabase, forceLogout } from '@/utils/services/sessionCleanup';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper = ({ children }: AuthWrapperProps) => {
  // Track current state to prevent unnecessary re-renders
  const currentAuthState = useRef<'needsLogin' | 'needsLicenseKey' | 'authenticated'>();
  const realtimeChannelRef = useRef<any>(null);
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);
  const currentLicenseKeyId = useRef<string | null>(null);
  
  // Start with loading and validate immediately
  const [authState, setAuthState] = useState<'needsLogin' | 'needsLicenseKey' | 'authenticated' | 'loading'>('loading');
  const [isInitializing, setIsInitializing] = useState(true);

  // Optimized setState that only updates if state actually changes
  const setAuthStateOptimized = useCallback((newState: 'needsLogin' | 'needsLicenseKey' | 'authenticated') => {
    if (currentAuthState.current !== newState) {
      currentAuthState.current = newState;
      setAuthState(newState);
    }
  }, []);

  // Cross-tab logout synchronization
  const setupBroadcastChannel = useCallback(() => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.close();
    }
    
    broadcastChannelRef.current = new BroadcastChannel('auth-sync');
    broadcastChannelRef.current.onmessage = (event) => {
      if (event.data.type === 'FORCE_LOGOUT') {
        console.log('Cross-tab logout triggered:', event.data.reason);
        forceLogout(event.data.reason);
      }
    };
  }, []);

  // Broadcast logout to all tabs
  const broadcastLogout = useCallback((reason: string) => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ type: 'FORCE_LOGOUT', reason });
    }
  }, []);

  // Simplified database validation - always validate with database
  const validateLicenseWithDatabase = useCallback(async (): Promise<{ valid: boolean; licenseKeyId?: string }> => {
    const licenseSessionToken = localStorage.getItem('license_session_token');
    
    if (!licenseSessionToken) {
      return { valid: false };
    }

    try {
      const result = await validateSessionWithDatabase(licenseSessionToken);
      
      if (!result.valid) {
        console.log('Session validation failed:', result.error);
        broadcastLogout(`Session validation failed: ${result.error}`);
        forceLogout(`Session validation failed: ${result.error}`);
        return { valid: false };
      }
      
      // Extract license key ID from session validation result
      const licenseKeyId = (result as any).license_id;
      if (licenseKeyId) {
        currentLicenseKeyId.current = licenseKeyId;
      }
      
      return { valid: result.valid, licenseKeyId };
    } catch (error) {
      console.error('Database validation error:', error);
      broadcastLogout('Database validation failed');
      forceLogout('Database validation failed');
      return { valid: false };
    }
  }, [broadcastLogout]);

  // Simplified auth state check - focus on core flow
  const checkAuthState = useCallback(async () => {
    console.log('🔍 Checking auth state...');
    
    const passwordAuth = sessionStorage.getItem('password_authenticated');
    const licenseSessionToken = localStorage.getItem('license_session_token');
    const redirectAuth = sessionStorage.getItem('redirect_system_authenticated');

    console.log('📊 Auth tokens:', { 
      passwordAuth: !!passwordAuth, 
      licenseSessionToken: !!licenseSessionToken,
      redirectAuth: !!redirectAuth
    });

    // If user has authenticated with password and has a valid database session
    if (passwordAuth && licenseSessionToken) {
      console.log('🔐 User has password auth + license session, validating...');
      const validationResult = await validateLicenseWithDatabase();
      
      if (validationResult.valid) {
        console.log('✅ Full authentication confirmed');
        setAuthStateOptimized('authenticated');
        
        // Set up real-time monitoring
        if (validationResult.licenseKeyId) {
          setupUserSpecificRealtimeMonitoring(validationResult.licenseKeyId);
        }
        return;
      }
    }

    // If user has password auth but no valid session, need license validation
    if (passwordAuth && !licenseSessionToken) {
      console.log('🔑 Password auth exists but no valid session, need license key');
      setAuthStateOptimized('needsLicenseKey');
      return;
    }

    // If user has redirect auth but no password auth (legacy license-only users)
    if (redirectAuth && !passwordAuth) {
      console.log('📜 Legacy license-only user detected');
      if (licenseSessionToken) {
        const validationResult = await validateLicenseWithDatabase();
        if (validationResult.valid) {
          setAuthStateOptimized('authenticated');
          if (validationResult.licenseKeyId) {
            setupUserSpecificRealtimeMonitoring(validationResult.licenseKeyId);
          }
          return;
        }
      }
      setAuthStateOptimized('needsLicenseKey');
      return;
    }

    // Default: need login
    console.log('❌ No valid authentication found, need login');
    setAuthStateOptimized('needsLogin');
  }, [setAuthStateOptimized, validateLicenseWithDatabase]);

  // Periodic validation - reduced frequency for mobile performance
  const performPeriodicValidation = useCallback(async () => {
    // Only run if we're currently authenticated
    if (currentAuthState.current !== 'authenticated') {
      return;
    }

    const licenseSessionToken = localStorage.getItem('license_session_token');
    if (!licenseSessionToken) {
      await checkAuthState();
      return;
    }

    // Validate with database
    await checkAuthState();
  }, [checkAuthState]);

  const handleLoginSuccess = useCallback((isPasswordGeneration: boolean = false) => {
    console.log('🎉 Login success, isPasswordGeneration:', isPasswordGeneration);
    
    const passwordAuth = sessionStorage.getItem('password_authenticated');
    const licenseSessionToken = localStorage.getItem('license_session_token');
    
    if (isPasswordGeneration) {
      console.log('🔐 Password generation flow - need license validation');
      setAuthStateOptimized('needsLicenseKey');
    } else if (passwordAuth && licenseSessionToken) {
      console.log('✅ Existing user with full auth - authenticated');
      setAuthStateOptimized('authenticated');
    } else {
      console.log('🔑 Need license validation');
      setAuthStateOptimized('needsLicenseKey');
    }
  }, [setAuthStateOptimized]);

  const handleLicenseValidated = useCallback(() => {
    console.log('✅ License validated successfully');
    setAuthStateOptimized('authenticated');
  }, [setAuthStateOptimized]);

  const handleBackToLogin = useCallback(() => {
    console.log('⬅️ Back to login');
    setAuthStateOptimized('needsLogin');
  }, [setAuthStateOptimized]);

  // Enhanced user-specific real-time monitoring
  const setupUserSpecificRealtimeMonitoring = useCallback((licenseKeyId: string) => {
    // Clean up existing channel
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }

    // Subscribe to changes for this specific license only
    realtimeChannelRef.current = supabase
      .channel(`license-monitor-${licenseKeyId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'license_keys',
          filter: `id=eq.${licenseKeyId}`
        },
        async (payload) => {
          console.log('User license deleted in real-time:', payload);
          broadcastLogout('Your license was deleted');
          forceLogout('Your license was deleted');
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'license_keys',
          filter: `id=eq.${licenseKeyId}`
        },
        async (payload) => {
          console.log('User license updated in real-time:', payload);
          const newRecord = payload.new as any;
          
          // Check for paused status first
          if (newRecord?.status === 'paused') {
            broadcastLogout('Your license was paused');
            forceLogout('Your license was paused');
          } else if (newRecord && (!newRecord.is_active || newRecord.status !== 'active')) {
            broadcastLogout('Your license was deactivated');
            forceLogout('Your license was deactivated');
          }
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Real-time subscription error:', err);
          // Retry connection after delay
          setTimeout(() => {
            if (currentLicenseKeyId.current) {
              setupUserSpecificRealtimeMonitoring(currentLicenseKeyId.current);
            }
          }, 5000);
        } else {
          console.log('Real-time subscription status:', status);
        }
      });
  }, [broadcastLogout]);

  useEffect(() => {
    // Setup cross-tab communication
    setupBroadcastChannel();
    
    // Initial database validation
    const initializeAuth = async () => {
      console.log('🚀 Initializing auth...');
      setIsInitializing(true);
      await checkAuthState();
      setIsInitializing(false);
      console.log('✅ Auth initialization complete');
    };
    
    initializeAuth();
    
    // Set up periodic validation (reduced frequency for mobile - 60 seconds)
    const interval = setInterval(performPeriodicValidation, 60 * 1000);
    
    return () => {
      clearInterval(interval);
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
      }
      if (broadcastChannelRef.current) {
        broadcastChannelRef.current.close();
      }
    };
  }, [checkAuthState, performPeriodicValidation, setupBroadcastChannel]);

  // Show loading while initializing
  if (isInitializing || authState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (authState === 'needsLogin') {
    return (
      <UserAuthenticationForm 
        onLoginSuccess={handleLoginSuccess} 
      />
    );
  }

  if (authState === 'needsLicenseKey') {
    return (
      <LicenseKeyValidation 
        onValidationSuccess={handleLicenseValidated}
        onBack={handleBackToLogin}
      />
    );
  }

  return <>{children}</>;
};

export default AuthWrapper;
