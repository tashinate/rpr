
import { supabase } from '@/integrations/supabase/client';

/**
 * Comprehensive session cleanup utility
 */
export const cleanupAuthState = () => {
  console.log('🧹 Cleaning up auth state...');
  
  // Clear all session storage
  sessionStorage.removeItem('redirect_system_authenticated');
  sessionStorage.removeItem('license_validated');
  sessionStorage.removeItem('password_authenticated');
  sessionStorage.removeItem('password_generated');
  sessionStorage.removeItem('generated_license_key');
  
  // Clear all local storage auth-related items
  localStorage.removeItem('license_session_token');
  localStorage.removeItem('license_session_expires');
  localStorage.removeItem('licenseKey');
  localStorage.removeItem('authTimestamp');
  
  // Clear any Supabase auth keys
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
    }
  });
  
  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      sessionStorage.removeItem(key);
    }
  });
  
  console.log('✅ Auth state cleanup complete');
};

/**
 * Force logout with immediate redirect to login page
 */
export const forceLogout = (reason?: string) => {
  console.log('🚪 Force logout triggered:', reason || 'No reason specified');
  
  cleanupAuthState();
  
  // Force page reload to ensure clean state
  if (reason) {
    console.log(`Forced logout: ${reason}`);
  }
  
  // Use replace to prevent back button issues - redirect to login page
  window.location.replace('/greyboi');
};

/**
 * Validate session using the enhanced database function
 */
export const validateSessionWithDatabase = async (sessionToken: string): Promise<{ valid: boolean; error?: string }> => {
  try {
    console.log('🔍 Validating session with database...');
    
    const { data, error } = await supabase.rpc('validate_session_with_license', {
      session_token_input: sessionToken
    });
    
    if (error) {
      console.error('❌ Session validation error:', error);
      return { valid: false, error: error.message };
    }
    
    console.log('📊 Session validation result:', data);
    return (data as { valid: boolean; error?: string }) || { valid: false, error: 'No response' };
  } catch (error) {
    console.error('🚫 Session validation exception:', error);
    return { valid: false, error: 'Validation failed' };
  }
};
