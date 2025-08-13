import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Zap, AlertCircle } from 'lucide-react';

interface AdminLoginFormProps {
  onLoginSuccess: (sessionToken: string, username: string) => void;
}

export const AdminLoginForm: React.FC<AdminLoginFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const { data, error: dbError } = await supabase.rpc('authenticate_admin', {
        username_input: username,
        password_input: password
      });

      if (dbError) {
        console.error('❌ Admin login error:', dbError);
        throw dbError;
      }

      console.log('📊 Admin login response:', data);
      const result = data as any;
      
      if (result?.success) {
        localStorage.setItem('admin_session_token', result.session_token);
        localStorage.setItem('admin_username', result.username);
        localStorage.setItem('admin_expires_at', result.expires_at);
        
        toast.success('ADMIN ACCESS AUTHORIZED', {
          description: 'PHANTOM ENGINE COMMAND INTERFACE ACTIVATED'
        });
        
        onLoginSuccess(result.session_token, result.username);
      } else {
        console.error('❌ Admin login failed:', result?.error);
        setError(result?.error || 'Invalid credentials');
      }
    } catch (error: any) {
      console.error('🚫 Admin login error:', error);
      setError('System error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 bg-[length:400%_400%] animate-gradient-flow flex items-center justify-center p-2 sm:p-3 md:p-4 relative overflow-hidden">
      {/* Animated background effects */}
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
              ALIEN
            </h2>
            <p className="text-cyan-300/80 text-xs sm:text-sm font-jetbrains tracking-wide leading-relaxed px-2">
              RAPIDREACH IS HERE
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 relative z-10">
            <div className="space-y-1 sm:space-y-2">
  
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ENTER ADMIN USERNAME"
                className="bg-slate-700/80 border-cyan-400/30 text-cyan-200 font-jetbrains backdrop-blur-sm focus:border-cyan-300/60 placeholder:text-cyan-400/60 text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4 min-h-[48px] touch-manipulation"
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-1 sm:space-y-2">
              
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER ADMIN PASSWORD"
                  className="bg-slate-700/80 border-cyan-400/30 text-cyan-200 font-jetbrains backdrop-blur-sm focus:border-cyan-300/60 placeholder:text-cyan-400/60 text-sm sm:text-base py-2 sm:py-3 px-3 sm:px-4 min-h-[48px] touch-manipulation"
                  disabled={isLoading}
                />
                {error && (
                  <div className="absolute -bottom-6 sm:-bottom-7 left-0 flex items-center gap-1 text-red-300 text-xs font-jetbrains">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="break-words">{error}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-lg opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                <Button
                  type="submit"
                  disabled={isLoading || !username || !password}
                  className="relative z-10 w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-jetbrains font-bold uppercase tracking-wider border-0 text-xs sm:text-base py-3 min-h-[48px] touch-manipulation"
                >
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                    {isLoading ? 'AUTHENTICATING...' : 'AUTHORIZE ACCESS'}
                  </div>
                </Button>
              </div>
            </div>
          </form>

          <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-cyan-400/30 relative z-10">
            <p className="text-xs sm:text-sm text-cyan-300/70 text-center font-jetbrains leading-relaxed px-2">
              PHANTOM ENGINE COMMAND PROTOCOL
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};