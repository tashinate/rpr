
import React from 'react';
import { Button } from '@/components/ui/button';
import TelegramConfigLoader from '@/components/TelegramConfigLoader';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Nexus = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 bg-[length:400%_400%] animate-gradient-flow relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Floating geometric elements */}
        <div className="absolute top-20 left-10 w-16 h-16 bg-blue-400/20 backdrop-blur-sm rounded-lg animate-float-1"></div>
        <div className="absolute top-40 right-16 w-12 h-12 bg-indigo-400/20 backdrop-blur-sm rounded-full animate-float-2"></div>
        <div className="absolute bottom-32 left-1/4 w-20 h-8 bg-purple-400/20 backdrop-blur-sm transform rotate-45 animate-float-1"></div>
        <div className="absolute bottom-20 right-1/3 w-10 h-10 bg-teal-400/20 backdrop-blur-sm transform rotate-12 animate-float-2"></div>
        
        {/* Scan lines */}
        <div className="absolute top-1/4 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent animate-scan-line"></div>
        <div className="absolute bottom-1/3 w-full h-px bg-gradient-to-r from-transparent via-indigo-400/50 to-transparent animate-scan-line" style={{ animationDelay: '4s' }}></div>
        
        {/* Radar pulse */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-blue-400/30 rounded-full animate-radar-pulse"></div>
        
        {/* Energy grid overlay */}
        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(90deg,transparent_24px,rgba(59,130,246,0.5)_25px,rgba(59,130,246,0.5)_26px,transparent_27px,transparent_49px,rgba(59,130,246,0.5)_50px,rgba(59,130,246,0.5)_51px,transparent_52px),linear-gradient(rgba(59,130,246,0.5)_24px,transparent_25px,transparent_26px,rgba(59,130,246,0.5)_27px,rgba(59,130,246,0.5)_49px,transparent_50px,transparent_51px,rgba(59,130,246,0.5)_52px)] bg-[size:52px_52px]"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-3 sm:pt-4 md:pt-6 px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 min-w-0 flex-1">
              {/* Enhanced cyber icon - Responsive sizing */}
              <div className="relative w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full animate-pulse blur-sm"></div>
                <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 flex items-center justify-center">
                  <span className="text-sm sm:text-base md:text-lg lg:text-xl font-jetbrains font-bold text-cyan-300 animate-pulse drop-shadow-lg select-none">
                    ⚡
                  </span>
                </div>
              </div>
              <h1 className="font-jetbrains text-sm sm:text-lg md:text-xl font-black bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-wider drop-shadow-lg truncate min-w-0">
                RAPIDREACH SETTINGS
              </h1>
            </div>

            {/* Enhanced Back Button - Right positioned */}
            <div className="relative group flex-shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-50 group-hover:opacity-70 blur transition duration-300"></div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/greyboi')}
                className="relative z-10 flex items-center gap-1 sm:gap-2 border-blue-400/40 hover:border-blue-300/60 bg-slate-800/50 hover:bg-slate-700/60 text-blue-200 hover:text-blue-100 transition-all duration-300 backdrop-blur-sm font-jetbrains font-medium text-xs sm:text-sm min-h-[44px] px-2 sm:px-3 md:px-4 touch-manipulation"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        <div className="max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Telegram Integration Section */}
          <div className="space-y-4 sm:space-y-6">
            <div className="border-b border-blue-400/30 pb-3 sm:pb-4">
              <h2 className="font-jetbrains text-lg sm:text-xl md:text-2xl font-bold text-blue-200 tracking-tight leading-tight">Telegram Integration</h2>
              <p className="font-inter text-blue-300/80 mt-0.5 sm:mt-1 text-sm sm:text-base leading-relaxed">Configure instant notification delivery</p>
            </div>
            
            <TelegramConfigLoader />
          </div>

          {/* Future Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 pt-4 sm:pt-6 md:pt-8">
            
            {/* Security Protocols */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 opacity-40 touch-manipulation">
              <h3 className="font-jetbrains text-base sm:text-lg font-semibold text-blue-200 mb-1 sm:mb-2 leading-tight">Security Protocols</h3>
              <p className="font-inter text-blue-300/70 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">Advanced protection configuration</p>
              <div className="space-y-2 sm:space-y-3">
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-full"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-3/4"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-1/2"></div>
              </div>
              <div className="mt-3 sm:mt-4 text-xs text-blue-300/40 italic font-jetbrains">Available Soon</div>
            </div>

            {/* Performance Optimization */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 opacity-40 touch-manipulation">
              <h3 className="font-jetbrains text-base sm:text-lg font-semibold text-blue-200 mb-1 sm:mb-2 leading-tight">Performance Optimization</h3>
              <p className="font-inter text-blue-300/70 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">Speed and efficiency tuning</p>
              <div className="space-y-2 sm:space-y-3">
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-full"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-2/3"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-4/5"></div>
              </div>
              <div className="mt-3 sm:mt-4 text-xs text-blue-300/40 italic font-jetbrains">Available Soon</div>
            </div>

            {/* Bot Detection */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 opacity-40 touch-manipulation">
              <h3 className="font-jetbrains text-base sm:text-lg font-semibold text-blue-200 mb-1 sm:mb-2 leading-tight">Bot Detection</h3>
              <p className="font-inter text-blue-300/70 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">Automated traffic filtering</p>
              <div className="space-y-2 sm:space-y-3">
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-full"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-3/5"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-4/5"></div>
              </div>
              <div className="mt-3 sm:mt-4 text-xs text-blue-300/40 italic font-jetbrains">Available Soon</div>
            </div>

            {/* Advanced Configuration */}
            <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 opacity-40 touch-manipulation">
              <h3 className="font-jetbrains text-base sm:text-lg font-semibold text-blue-200 mb-1 sm:mb-2 leading-tight">Advanced Configuration</h3>
              <p className="font-inter text-blue-300/70 text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed">Extended functionality controls</p>
              <div className="space-y-2 sm:space-y-3">
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-full"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-1/2"></div>
                <div className="h-2 sm:h-3 bg-blue-500/20 rounded w-3/4"></div>
              </div>
              <div className="mt-3 sm:mt-4 text-xs text-blue-300/40 italic font-jetbrains">Available Soon</div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default Nexus;
