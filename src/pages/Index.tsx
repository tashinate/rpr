import PhantomUrlGenerator from '@/components/PhantomUrlGenerator';
import AuthWrapper from '@/components/auth/AuthWrapper';
import UserLicenseStatus from '@/components/auth/UserLicenseStatus';
import VisitAnalytics from '@/components/analytics/VisitAnalytics';
import SecurityMonitoring from '@/components/security/SecurityMonitoring';
import { ScriptDownloads } from '@/components/ScriptDownloads';
import PendingDecisions from '@/components/PendingDecisions';

import { Settings, Sparkles, BarChart3, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <AuthWrapper>
      <div className="min-h-screen w-full fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 bg-[length:400%_400%] animate-gradient-flow overflow-y-auto overflow-x-hidden">
          {/* Animated Background Effects - Fixed positioning */}
          <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
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

          {/* Main Content Container - Relative positioning with fade-in */}
          <div className="relative z-10 w-full animate-fade-in">
            {/* Header with Enhanced Settings Button */}
            <header className="pt-4 sm:pt-6 px-3 sm:px-4 md:px-6 lg:px-8">
              <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  {/* Enhanced cyber icon with multiple animations - Responsive sizing */}
                  <div className="relative w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/30 to-blue-500/30 rounded-full animate-pulse blur-sm"></div>
                    <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 backdrop-blur-sm border border-cyan-400/30 flex items-center justify-center">
                      <span className="text-base sm:text-lg md:text-2xl font-jetbrains font-bold text-cyan-300 animate-pulse drop-shadow-lg select-none">
                        ⚡
                      </span>
                    </div>
                  </div>
                  
                  <span className="font-jetbrains text-sm sm:text-lg md:text-xl font-black bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-wider truncate drop-shadow-lg min-w-0">
                    RAPIDREACH
                  </span>
                  
                </div>
                
                {/* Enhanced Settings Button - Responsive sizing */}
                <div className="relative group flex-shrink-0">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-60 blur group-hover:opacity-100 transition duration-300"></div>
                  <Button
                    onClick={() => navigate('/nexus')}
                    variant="outline"
                    size="sm"
                    className="relative z-10 h-8 sm:h-10 md:h-12 px-2 sm:px-4 md:px-6 flex items-center gap-1 sm:gap-2 md:gap-3 border-blue-400/40 hover:border-blue-300/60 bg-slate-800/50 hover:bg-slate-700/60 text-blue-200 hover:text-blue-100 transition-all duration-300 backdrop-blur-sm font-jetbrains font-semibold tracking-wide shadow-lg min-h-[44px] touch-manipulation"
                  >
                    <Settings className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                    <span className="hidden xs:hidden sm:inline text-xs sm:text-sm md:text-base">Settings</span>
                  </Button>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-12 lg:py-16">
              <div className="text-center mb-6 sm:mb-8 md:mb-12 lg:mb-16">
                <div className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-xs sm:text-sm font-jetbrains font-medium mb-3 sm:mb-4 touch-manipulation">
                  <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-3.5 md:h-3.5" />
                  <span className="whitespace-nowrap">ALIEN PHANTOM Engine - Invisible Transit</span>
                </div>
                
                {/* Enhanced main title with cyber icon - Responsive layout */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 flex-shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/40 to-blue-500/40 rounded-full animate-pulse blur-md"></div>
                    <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-cyan-400/30 to-blue-500/30 backdrop-blur-sm border border-cyan-400/40 flex items-center justify-center">
                      <span className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-jetbrains font-bold text-cyan-300 animate-pulse drop-shadow-lg select-none">
                        ⚡
                      </span>
                    </div>
                  </div>
                  
                  <h1 className="font-jetbrains text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black bg-gradient-to-r from-cyan-200 via-blue-200 to-purple-200 bg-clip-text text-transparent tracking-wider drop-shadow-2xl text-center sm:text-left leading-tight">
                    RAPIDREACH
                  </h1>
                </div>
                
                <p className="font-jetbrains text-blue-300/80 max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl mx-auto font-medium tracking-wide text-xs sm:text-sm md:text-base leading-relaxed px-2">
                  Next-gen URL technology with bulletproof protection
                </p>
              </div>

              {/* Dashboard Components with smooth fade-in animations */}
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {/* License Status - User Dashboard */}
                <div className="w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <UserLicenseStatus />
                </div>


                {/* URL Generators */}
                <div className="w-full animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="bg-gradient-to-br from-slate-900/90 via-blue-900/20 to-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-lg overflow-hidden">
                    <PhantomUrlGenerator />
                  </div>
                </div>

                {/* Advanced Analytics Dashboard with Tabs */}
                <div className="w-full animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="bg-gradient-to-br from-slate-900/90 via-blue-900/20 to-slate-900/90 backdrop-blur-xl border border-blue-500/30 rounded-lg overflow-hidden">
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-b border-blue-500/30">
                        <TabsTrigger value="basic" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 font-jetbrains font-bold uppercase tracking-wider text-xs sm:text-sm">
                          <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">Analytics</span>
                        </TabsTrigger>
                        <TabsTrigger value="scripts" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-blue-600 font-jetbrains font-bold uppercase tracking-wider text-xs sm:text-sm">
                          <Package className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden xs:inline">Scripts</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="basic" className="mt-0">
                        <div className="p-4 sm:p-6 space-y-6">
                          <PendingDecisions />
                          <VisitAnalytics />
                        </div>
                      </TabsContent>

                      <TabsContent value="scripts" className="mt-0">
                        <div className="p-4 sm:p-6">
                          <ScriptDownloads />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                {/* Security Monitoring Dashboard */}
                <div className="w-full animate-fade-in" style={{ animationDelay: '0.4s' }}>
                  <SecurityMonitoring />
                </div>
              </div>

              {/* Footer */}
              <footer className="mt-8 sm:mt-12 md:mt-16 mb-4 sm:mb-6 md:mb-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                {/* Feature highlights - Mobile optimized */}
                <div className="max-w-xs sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl mx-auto mb-6 sm:mb-8 px-2 sm:px-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                  <div className="flex items-start gap-2 sm:gap-3 group p-2 sm:p-3 rounded-lg hover:bg-blue-500/10 transition-all duration-200 touch-manipulation">
                    <div className="text-xl sm:text-2xl md:text-2xl flex-shrink-0">🔐</div>
                    <div className="min-w-0">
                      <h4 className="font-jetbrains text-sm sm:text-base font-semibold text-blue-200 leading-tight">Encrypted URLs</h4>
                      <p className="font-inter text-xs sm:text-sm text-blue-300/70 mt-0.5 sm:mt-1 leading-relaxed">Secure encoding prevents tampering</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 sm:gap-3 group p-2 sm:p-3 rounded-lg hover:bg-blue-500/10 transition-all duration-200 touch-manipulation">
                    <div className="text-xl sm:text-2xl md:text-2xl flex-shrink-0">✅</div>
                    <div className="min-w-0">
                      <h4 className="font-jetbrains text-sm sm:text-base font-semibold text-blue-200 leading-tight">Real-time validation</h4>
                      <p className="font-inter text-xs sm:text-sm text-blue-300/70 mt-0.5 sm:mt-1 leading-relaxed">Instant checks for link security</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 sm:gap-3 group p-2 sm:p-3 rounded-lg hover:bg-blue-500/10 transition-all duration-200 touch-manipulation">
                    <div className="text-xl sm:text-2xl md:text-2xl flex-shrink-0">⚡</div>
                    <div className="min-w-0">
                      <h4 className="font-jetbrains text-sm sm:text-base font-semibold text-blue-200 leading-tight">Instant generation</h4>
                      <p className="font-inter text-xs sm:text-sm text-blue-300/70 mt-0.5 sm:mt-1 leading-relaxed">Lightning-fast URL processing</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 sm:gap-3 group p-2 sm:p-3 rounded-lg hover:bg-blue-500/10 transition-all duration-200 touch-manipulation">
                    <div className="text-xl sm:text-2xl md:text-2xl flex-shrink-0">🛡️</div>
                    <div className="min-w-0">
                      <h4 className="font-jetbrains text-sm sm:text-base font-semibold text-blue-200 leading-tight">Multi-tier protection</h4>
                      <p className="font-inter text-xs sm:text-sm text-blue-300/70 mt-0.5 sm:mt-1 leading-relaxed">Defense in depth security</p>
                    </div>
                  </div>
                </div>
                
                {/* Educational Use Disclaimer and Copyright */}
                <div className="border-t border-blue-400/30 pt-4 sm:pt-6">
                  {/* Educational Use Disclaimer */}
                  <div className="text-center mb-3 sm:mb-4">
                    <p className="text-xs sm:text-sm text-blue-300/50 max-w-xs sm:max-w-md md:max-w-lg mx-auto px-2 sm:px-4 font-jetbrains">
                      Intended for educational purposes and legitimate email marketing campaigns only - Any form of abuse, spam, or illegal activity is strictly prohibited
                    </p>
                  </div>
                  
                  {/* Copyright and brand line */}
                  <div className="flex flex-row flex-wrap justify-center items-center gap-x-2 sm:gap-x-3 md:gap-x-4 text-xs sm:text-sm text-blue-300/60 max-w-xs sm:max-w-md md:max-w-lg mx-auto px-2 sm:px-4 text-center font-jetbrains">
                    <span>© 2025 RapidReach</span>
                    <span>•</span>
                    <span>Premium Email Campaign Service</span>
                  </div>
                </div>
              </footer>
            </main>
          </div>
        </div>
    </AuthWrapper>
  );
};

export default Index;
