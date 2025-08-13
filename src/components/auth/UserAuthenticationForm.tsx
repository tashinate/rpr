
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, AlertCircle } from 'lucide-react';

interface UserAuthenticationFormProps {
  onLoginSuccess: (isPasswordGeneration?: boolean) => void;
}

const UserAuthenticationForm = ({ onLoginSuccess }: UserAuthenticationFormProps) => {
  const [password, setPassword] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGenerateMode, setIsGenerateMode] = useState(false);
  const [hasExistingCipher, setHasExistingCipher] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState<any>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<any>(null);

  useEffect(() => {
    console.log('🔍 Auth check on mount');
    // Check for existing authentication
    const authToken = localStorage.getItem('license_session_token');
    const sessionAuth = sessionStorage.getItem('redirect_system_authenticated');
    const passwordAuth = sessionStorage.getItem('password_authenticated');
    
    console.log('📊 Auth state:', { 
      authToken: !!authToken, 
      sessionAuth,
      passwordAuth 
    });
    
    if (authToken && passwordAuth) {
      console.log('✅ Found existing valid auth, redirecting to main app');
      onLoginSuccess();
    } else {
      console.log('❌ No valid auth found, staying on login');
    }
  }, [onLoginSuccess]);

  // Check generation status
  const checkGenerationStatus = useCallback(async (licenseKeyInput: string) => {
    try {
      console.log('🔍 Checking generation status for license:', licenseKeyInput);
      
      const { data, error } = await supabase.rpc('check_generation_status', {
        license_key_input: licenseKeyInput
      });
      
      if (error) {
        console.error('❌ Generation status check error:', error);
        return null;
      }
      
      console.log('📊 Generation status result:', data);
      setGenerationStatus(data);
      return data;
    } catch (error) {
      console.error('🚫 Error checking generation status:', error);
      return null;
    }
  }, []);

  // Check for existing cipher and cooldown
  const checkForExistingCipher = useCallback(async (licenseKeyInput: string) => {
    try {
      console.log('🔍 Checking for existing cipher and cooldown');
      
      // Check generation status first
      await checkGenerationStatus(licenseKeyInput);
      
      const { data, error } = await supabase.rpc('check_auth_cooldown', {
        license_key_input: licenseKeyInput
      });
      
      if (error) {
        console.error('❌ Cooldown check error:', error);
        return false;
      }
      
      console.log('📊 Cooldown check result:', data);
      
      if (data && typeof data === 'object' && 'under_cooldown' in data && data.under_cooldown) {
        setCooldownInfo(data);
        console.log('⏰ Account under cooldown');
        return false;
      }
      
      // Check if cipher exists by trying to validate license
      try {
        const { data: licenseData } = await supabase
          .from('license_keys')
          .select('id')
          .eq('license_key', licenseKeyInput)
          .single();
        
        if (licenseData) {
          const { data: cipherData } = await supabase
            .from('auth_ciphers')
            .select('id')
            .eq('license_key_id', licenseData.id)
            .single();
          
          setHasExistingCipher(!!cipherData);
          return !cipherData;
        }
      } catch (err) {
        console.log('No existing cipher found');
      }
      
      return true;
    } catch (error) {
      console.error('🚫 Error checking existing cipher:', error);
      return true;
    }
  }, [checkGenerationStatus]);

  // Generate secure password with retry logic
  const generateSecurePassword = useCallback(async () => {
    if (!licenseKey.trim()) {
      setError('LICENSE KEY REQUIRED FOR CIPHER GENERATION');
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    const attemptGeneration = async () => {
      try {
        console.log(`🔄 Password generation attempt ${retryCount + 1}/${maxRetries}`);
        setError('');
        
        // Check cooldown and existing cipher
        const canGenerate = await checkForExistingCipher(licenseKey);
        if (!canGenerate && cooldownInfo?.under_cooldown) {
          const minutes = Math.ceil(cooldownInfo.remaining_seconds / 60);
          setError(`COOLDOWN ACTIVE - WAIT ${minutes} MINUTES`);
          return false;
        }
        
        if (hasExistingCipher && !confirm('Cipher already exists for this license. Reset password?')) {
          return false;
        }

        console.log('🔐 Generating secure password...');
        // Generate secure 24-character password
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let result = '';
        for (let i = 0; i < 24; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        
        console.log('💾 Storing cipher in database...');
        // Use enhanced function which handles both new and existing ciphers
        const { data, error } = await supabase.rpc('create_auth_cipher_enhanced', {
          license_key_input: licenseKey,
          password_hash_input: result  // Send plain text, database will hash
        });
        
        if (error) {
          console.error('❌ Database error:', error);
          throw error;
        }
        
        if (!data || typeof data !== 'object' || !('success' in data) || !data.success) {
          const errorMsg = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' 
            ? data.error 
            : 'Failed to create cipher';
          console.error('❌ Cipher creation failed:', errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log('✅ Cipher stored successfully');
        
        // Update generation status after successful generation
        if (data.remaining_generations !== undefined) {
          setGenerationStatus({
            ...generationStatus,
            remaining_generations: data.remaining_generations,
            generations_used: data.generations_used,
            max_generations: data.max_generations
          });
        }
        
        setPassword(result);
        
        // Copy to clipboard and show password
        await navigator.clipboard.writeText(result);
        setIsPasswordVisible(true);
        setShowSuccessMessage(true);
        
        // Store password generation flag for next step
        sessionStorage.setItem('password_generated', 'true');
        sessionStorage.setItem('generated_license_key', licenseKey);
        
        toast.success('CIPHER GENERATED & COPIED TO CLIPBOARD!');
        
        return true;
        
      } catch (error: any) {
        console.error(`❌ Generation attempt ${retryCount + 1} failed:`, error);
        
        if (retryCount < maxRetries - 1) {
          console.log(`🔄 Retrying in 2 seconds... (${retryCount + 2}/${maxRetries})`);
          setError(`ATTEMPT ${retryCount + 1} FAILED - RETRYING...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          return false;
        } else {
          console.error('🚫 All generation attempts failed');
          setError(error.message || 'CIPHER GENERATION FAILED AFTER ALL RETRIES');
          return false;
        }
      }
    };

    try {
      setIsLoading(true);
      
      while (retryCount < maxRetries) {
        const success = await attemptGeneration();
        if (success) {
          break;
        }
        retryCount++;
      }
      
    } finally {
      setIsLoading(false);
    }
  }, [licenseKey, checkForExistingCipher, cooldownInfo, hasExistingCipher, generationStatus]);

  // Handle login with enhanced error handling
  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password) {
      setError('CIPHER REQUIRED FOR ACCESS');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      
      console.log('🔐 Starting login process...');
      
      // Use the authenticate_user_session function
      console.log('🔍 Authenticating with database function...');
      const { data, error } = await supabase.rpc('authenticate_user_session', {
        password_input: password
      });

      if (error) {
        console.error('❌ Authentication error:', error);
        setError('AUTHENTICATION FAILED - PLEASE TRY AGAIN');
        return;
      }

      if (!data || typeof data !== 'object' || !('success' in data) || !data.success) {
        const errorMsg = data && typeof data === 'object' && 'error' in data && typeof data.error === 'string' 
          ? data.error 
          : 'Authentication failed';
        console.error('❌ Authentication failed:', errorMsg);
        setError('INCORRECT CIPHER - PASSWORD DOES NOT MATCH');
        return;
      }

      console.log('🎯 Authentication successful! Setting up session...');
      
      // Extract session data from response
      const sessionToken = data.session_token as string;
      const licenseKey = data.license_key as string;
      
      // Store authentication data
      localStorage.setItem('license_session_token', sessionToken);
      localStorage.setItem('licenseKey', licenseKey);
      localStorage.setItem('authTimestamp', Date.now().toString());
      
      // Store in sessionStorage for this browser session
      sessionStorage.setItem('redirect_system_authenticated', 'true');
      sessionStorage.setItem('password_authenticated', 'true');
      
      console.log('💾 Session data stored successfully');
      
      toast.success('ALIEN ACCESS AUTHORIZED - PHANTOM ENGINE ACTIVATED');
      
      console.log('🚀 Redirecting to main application...');
      onLoginSuccess(false); // Not password generation, regular login
    } catch (error: any) {
      console.error('🚫 Login process failed:', error);
      setError(`SYSTEM ERROR: ${error.message || 'AUTHENTICATION FAILED'}`);
    } finally {
      setIsLoading(false);
    }
  }, [password, onLoginSuccess]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 bg-[length:400%_400%] animate-gradient-flow flex items-center justify-center p-2 sm:p-3 md:p-4 relative overflow-hidden">
      {/* Animated background effects - optimized for mobile */}
      <div className="absolute inset-0 pointer-events-none opacity-30 sm:opacity-100">
        <div className="absolute top-20 left-10 w-16 h-16 bg-cyan-400/10 backdrop-blur-sm rounded-lg animate-float-1"></div>
        <div className="absolute top-40 right-16 w-12 h-12 bg-blue-400/10 backdrop-blur-sm rounded-full animate-float-2"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-8 bg-purple-400/10 backdrop-blur-sm transform rotate-45 animate-float-1"></div>
        <div className="absolute bottom-20 right-1/3 w-10 h-10 bg-teal-400/10 backdrop-blur-sm transform rotate-12 animate-float-2"></div>
      </div>

      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md z-10">
        <div className="relative bg-gradient-to-br from-slate-800/80 via-blue-900/50 to-indigo-900/60 border border-cyan-400/30 backdrop-blur-sm rounded-2xl p-4 sm:p-6 md:p-8 shadow-2xl overflow-hidden">
          {/* Animated card effects */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-blue-500/5 to-purple-500/5 animate-gradient-flow"></div>
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent animate-scan-line"></div>
          
          <div className="text-center mb-6 sm:mb-8 relative z-10">
            <div className="text-3xl sm:text-4xl md:text-5xl mb-3 sm:mb-4 text-white animate-bounce">👽</div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains uppercase tracking-wider mb-1 sm:mb-2 leading-tight">
              RAPIDREACH CAMPAIGN
            </h2>
            <p className="text-cyan-300/80 text-xs sm:text-sm font-jetbrains tracking-wide leading-relaxed px-2">
              built for the culture
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
            <div className="space-y-3 sm:space-y-4">
              {isGenerateMode && (
                <>
                  <div className="relative group">
                    <Input
                      type="text"
                      placeholder="Enter License Key"
                      value={licenseKey}
                      onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-purple-500/30 rounded-lg text-purple-100 placeholder-purple-300/50 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all duration-300 backdrop-blur-sm font-mono text-sm sm:text-base min-h-[48px] touch-manipulation"
                      disabled={isLoading}
                    />
                  </div>
                  
                  {generationStatus && (
                    <div className="text-center p-3 bg-purple-900/40 border border-purple-400/30 rounded-lg backdrop-blur-sm">
                      <div className="text-purple-300 text-xs font-jetbrains uppercase tracking-wider">
                        🔐 GENERATION STATUS
                      </div>
                      <div className="text-purple-200 text-sm font-mono mt-1">
                        {generationStatus.remaining_generations > 0 ? (
                          <>
                            <span className="text-green-300">{generationStatus.remaining_generations}</span> / {generationStatus.max_generations} generations remaining
                          </>
                        ) : (
                          <span className="text-red-300">GENERATION LIMIT REACHED ({generationStatus.generations_used}/{generationStatus.max_generations})</span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="relative group">
                <Input
                  type={isPasswordVisible ? "text" : "password"}
                  placeholder={isGenerateMode ? "Generated Password Will Appear Here" : "Paste Your Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-black/40 border border-cyan-500/30 rounded-lg text-cyan-100 placeholder-cyan-300/50 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all duration-300 backdrop-blur-sm font-mono text-sm sm:text-base min-h-[48px] touch-manipulation"
                  disabled={isLoading || isGenerateMode}
                  readOnly={isGenerateMode}
                />
                <button
                  type="button"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-cyan-300/70 hover:text-cyan-200 transition-colors p-1 min-h-[48px] min-w-[48px] flex items-center justify-center touch-manipulation"
                  disabled={isLoading}
                >
                  <span className="text-sm sm:text-base">{isPasswordVisible ? '👁️' : '🔒'}</span>
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm font-mono text-center bg-red-500/10 border border-red-500/30 rounded-lg py-3 px-4 backdrop-blur-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="break-words">{error}</span>
                </div>
              )}

              {showSuccessMessage && isGenerateMode && (
                <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-gradient-to-r from-green-900/40 to-emerald-900/40 border border-green-400/30 rounded-lg backdrop-blur-sm">
                  <div className="text-green-300 text-xs sm:text-sm font-jetbrains uppercase tracking-wider text-center">
                    🎯 <strong>CIPHER GENERATED & COPIED!</strong><br />
                    <span className="text-green-200/80 normal-case">Next: Enter your license key to complete authorization</span>
                  </div>
                  <Button
                    type="button"
                    onClick={() => onLoginSuccess(true)}
                    className="w-full mt-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-jetbrains font-bold uppercase tracking-wider text-xs sm:text-sm py-3 min-h-[48px] touch-manipulation"
                  >
                    Continue to License Validation
                  </Button>
                </div>
              )}

              {cooldownInfo?.under_cooldown && (
                <div className="text-yellow-400 text-sm font-mono text-center bg-yellow-500/10 border border-yellow-500/30 rounded-lg py-2 px-4 backdrop-blur-sm">
                  COOLDOWN ACTIVE - {Math.ceil(cooldownInfo.remaining_seconds / 60)} MINUTES REMAINING
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-2 sm:space-y-3">
              {!isGenerateMode ? (
                <>
                  <Button 
                    type="submit" 
                    disabled={isLoading || !password}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono uppercase tracking-wider text-sm sm:text-base min-h-[48px] touch-manipulation"
                  >
                    {isLoading ? 'VALIDATING...' : 'AUTHENTICATE'}
                  </Button>
                  
                  <div className="text-center py-1">
                    <span className="text-cyan-300/60 text-xs sm:text-sm font-mono">OR</span>
                  </div>
                  
                  <Button 
                    type="button"
                    onClick={() => {
                      setIsGenerateMode(true);
                      setPassword('');
                      setError('');
                    }}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono uppercase tracking-wider text-sm sm:text-base min-h-[48px] touch-manipulation"
                  >
                    GENERATE NEW PASSWORD
                  </Button>
                </>
              ) : (
                <>
                  {!showSuccessMessage && (
                    <Button 
                      type="button"
                      onClick={generateSecurePassword}
                      disabled={isLoading || !licenseKey.trim() || (generationStatus?.remaining_generations === 0)}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-4 sm:px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-mono uppercase tracking-wider text-sm sm:text-base min-h-[48px] touch-manipulation"
                    >
                      {isLoading ? 'GENERATING...' : 'GENERATE PASSWORD'}
                    </Button>
                  )}
                  
                  <Button 
                    type="button"
                    onClick={() => {
                      setIsGenerateMode(false);
                      setLicenseKey('');
                      setPassword('');
                      setError('');
                      setShowSuccessMessage(false);
                      setHasExistingCipher(false);
                      setCooldownInfo(null);
                    }}
                    disabled={isLoading}
                    className="w-full bg-slate-700/80 hover:bg-slate-600/80 text-cyan-200 font-jetbrains font-bold py-3 px-6 rounded-lg transition-all duration-200 backdrop-blur-sm border border-cyan-400/40 hover:border-cyan-300/60 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs sm:text-sm min-h-[48px] touch-manipulation flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={16} />
                    BACK TO LOGIN
                  </Button>
                </>
              )}
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-cyan-400/30 relative z-10">
            <div className="text-center">
              <p className="text-xs text-cyan-300/70 font-mono mb-2">
                👻 PHANTOM PROTECTION
              </p>
              <p className="text-xs text-cyan-300/50 font-mono">
                ENCRYPTED ACCESS • CULTURE VERIFIED
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAuthenticationForm;
