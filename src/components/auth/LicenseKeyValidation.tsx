
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Zap, ArrowLeft, AlertCircle } from 'lucide-react';

interface LicenseKeyValidationProps {
  onValidationSuccess: () => void;
  onBack: () => void;
}

const LicenseKeyValidation = ({ onValidationSuccess, onBack }: LicenseKeyValidationProps) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isPasswordFlow, setIsPasswordFlow] = useState(false);
  const { toast } = useToast();

  // Check if this is part of password generation flow
  useEffect(() => {
    const passwordGenerated = sessionStorage.getItem('password_generated');
    const generatedLicenseKey = sessionStorage.getItem('generated_license_key');
    
    if (passwordGenerated && generatedLicenseKey) {
      setIsPasswordFlow(true);
      setLicenseKey(generatedLicenseKey);
    }
  }, []);

  const validateLicenseKey = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is completing password generation flow
    const passwordGenerated = sessionStorage.getItem('password_generated');
    const generatedLicenseKey = sessionStorage.getItem('generated_license_key');
    
    // Use generated license key if available, otherwise use entered key
    const keyToValidate = passwordGenerated && generatedLicenseKey ? generatedLicenseKey : licenseKey.trim();
    
    if (!keyToValidate) {
      setError('Please enter a license key');
      return;
    }

    // Rate limiting - max 5 attempts
    if (attempts >= 5) {
      setError('Too many attempts. Please try again later.');
      return;
    }

    setError('');
    setIsValidating(true);

    try {
      console.log('🔍 Validating license key:', keyToValidate);
      
      // Call the enhanced database function to create user session
      const { data, error: dbError } = await supabase.rpc('create_user_session_enhanced', {
        key_input: keyToValidate
      });

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }

      console.log('📊 Validation response:', data);
      const response = data as any;
      
      if (response && response.valid) {
        console.log('✅ License validation successful');
        
        // Store session token in localStorage
        localStorage.setItem('license_session_token', response.session_token);
        localStorage.setItem('license_session_expires', response.expires_at);
        sessionStorage.setItem('license_validated', 'true');
        
        // Clean up password generation flags
        sessionStorage.removeItem('password_generated');
        sessionStorage.removeItem('generated_license_key');
        
        // Mark as authenticated for users with both password and license
        if (passwordGenerated) {
          sessionStorage.setItem('redirect_system_authenticated', 'true');
        }
        
        toast({
          title: "ALIEN ACCESS AUTHORIZED",
          description: passwordGenerated 
            ? "CIPHER AND LICENSE VALIDATED. PHANTOM ENGINE ACTIVATED."
            : "PHANTOM ENGINE ACTIVATED. WELCOME TO RAPIDREACH.",
        });
        
        console.log('🚀 Proceeding to main application');
        onValidationSuccess();
      } else {
        console.error('❌ License validation failed:', response?.error);
        setError(response?.error || 'Invalid license key');
        setAttempts(prev => prev + 1);
      }
    } catch (error: any) {
      console.error('🚫 License validation error:', error);
      setError('System error. Please try again.');
      setAttempts(prev => prev + 1);
    } finally {
      setIsValidating(false);
    }
  };

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
            <div className="mx-auto relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mb-3 sm:mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 to-blue-500/40 rounded-xl animate-pulse blur-md"></div>
              <div className="relative z-10 w-full h-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-xl border border-cyan-400/40 backdrop-blur-sm flex items-center justify-center">
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-cyan-300" />
              </div>
            </div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent font-jetbrains uppercase tracking-wider mb-1 sm:mb-2 leading-tight px-2">
              {isPasswordFlow ? 'ALIEN AUTHORIZATION' : 'ALIEN ACCESS AUTHORIZATION'}
            </h2>
            <p className="text-cyan-300/80 text-xs sm:text-sm font-jetbrains tracking-wide leading-relaxed px-2">
              {isPasswordFlow 
                ? 'LICENSE CONFIRMATION REQUIRED'
                : 'INITIALIZE ACCESS PANEL TO ENTER PHANTOM ENGINE'
              }
            </p>
          </div>

          <form onSubmit={validateLicenseKey} className="space-y-4 sm:space-y-6 relative z-10">
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="licenseKey" className="text-cyan-200 font-jetbrains font-bold uppercase tracking-wider text-xs sm:text-sm">
                ACCESS PANEL
              </Label>
              <div className="relative">
                <Input
                  id="licenseKey"
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                  placeholder={isPasswordFlow ? "CONFIRM YOUR LICENSE KEY" : "PASTE YOUR ACCESS CODE"}
                  className="bg-slate-700/80 border-cyan-400/30 text-cyan-200 font-jetbrains backdrop-blur-sm focus:border-cyan-300/60 placeholder:text-cyan-400/60 text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4 min-h-[48px] touch-manipulation"
                  disabled={isPasswordFlow} // Disable if pre-filled from password flow
                />
                {error && (
                  <div className="absolute -bottom-6 sm:-bottom-7 left-0 flex items-center gap-1 text-red-300 text-xs font-jetbrains">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}
              </div>
            </div>

            {attempts > 0 && attempts < 5 && (
              <div className="text-xs sm:text-sm text-cyan-400/80 text-center font-jetbrains uppercase tracking-wider">
                AUTHORIZATION ATTEMPTS: {attempts}/5
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="order-2 sm:order-1 flex-1 bg-slate-700/80 border-cyan-400/40 text-cyan-200 hover:bg-slate-600/80 hover:border-cyan-300/60 font-jetbrains font-bold uppercase tracking-wider backdrop-blur-sm text-xs sm:text-sm py-3 min-h-[48px] touch-manipulation"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                RETURN
              </Button>
              <div className="order-1 sm:order-2 flex-1 relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                <Button
                  type="submit"
                  disabled={attempts >= 5 || isValidating || !licenseKey.trim()}
                  className="relative z-10 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-jetbrains font-bold uppercase tracking-wider border-0 text-xs sm:text-base py-3 min-h-[48px] touch-manipulation"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    {isValidating ? 'VALIDATING...' : isPasswordFlow ? 'COMPLETE ACTIVATION' : 'AUTHORIZE ACCESS'}
                  </div>
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-cyan-400/30 relative z-10">
            <p className="text-xs sm:text-sm text-cyan-300/70 text-center font-jetbrains leading-relaxed px-2">
              DIMENSIONAL GATEWAY PROTOCOL ENGAGED
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseKeyValidation;
