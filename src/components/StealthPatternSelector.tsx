
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, TrendingUp, Globe, Shield, Cpu, Target, BarChart3, Eye, ChevronDown, ChevronRight, Info, Sparkles, Star } from 'lucide-react';
import { getLocalPatterns, getPatternsByCategory, type LocalPattern } from '@/data/localPatterns';
import { optionalAnalytics } from '@/utils/optionalAnalytics';

// Use LocalPattern interface from local patterns
type PatternOption = LocalPattern;

interface StealthPatternSelectorProps {
  selectedPattern: any;
  onPatternSelect: (pattern: any) => void;
  className?: string;
}

const StealthPatternSelector: React.FC<StealthPatternSelectorProps> = ({
  selectedPattern,
  onPatternSelect,
  className = ""
}) => {
  const [patterns, setPatterns] = useState<PatternOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Debug logging
  console.log('[StealthPatternSelector] Current selectedPattern:', selectedPattern);

  const categoryIcons = {
    'document': BarChart3,
    'business': Cpu,
    'content': Eye,
    'government': Shield,
    'medical': Target,
    'ecommerce': TrendingUp,
    'banking': Globe,
    'news': Zap,
    'education': Target,
    'technology': Cpu,
    'realestate': Globe,
    'legal': Shield,
    'search': Globe,
    // NEW EVASION CATEGORIES
    'evasion': Shield,
    'microsoft': Shield,
    'google': Target,
    'mimicry': Eye,
    'intelligent': Cpu
  };

  const categoryDescriptions = {
    'document': 'Professional documents and file sharing',
    'business': 'Corporate APIs and enterprise platforms',
    'content': 'Editorial content and media platforms',
    'government': 'Official institutions and public services',
    'medical': 'Healthcare portals and medical services',
    'ecommerce': 'Online retail and shopping platforms',
    'banking': 'Financial services and banking portals',
    'news': 'News media and publishing networks',
    'search': 'Search engines and query platforms',
    'education': 'Educational institutions and learning platforms',
    'technology': 'Tech companies and development hubs',
    'realestate': 'Property listings and real estate services',
    'legal': 'Legal services and law firm portals',
    // NEW EVASION CATEGORIES
    'evasion': 'Advanced anti-detection and evasion patterns',
    'microsoft': 'Microsoft-specific evasion (Outlook, Office365)',
    'google': 'Google-optimized patterns (Gmail, Workspace)',
    'mimicry': 'Service mimicry patterns (Drive, Dropbox, etc.)',
    'intelligent': 'AI-powered intelligent pattern selection'
  };

  // Standardized Quick Presets with consistent IDs
  const quickPresets = [
    { 
      id: 'quick-marketing', 
      name: 'Marketing Campaign', 
      category: 'business', 
      icon: TrendingUp,
      success_rate: 92,
      description: 'Optimized for marketing campaigns and promotional content'
    },
    { 
      id: 'quick-newsletter', 
      name: 'Newsletter', 
      category: 'news', 
      icon: Zap,
      success_rate: 88,
      description: 'Perfect for newsletter and editorial content'
    },
    { 
      id: 'quick-business', 
      name: 'Business Update', 
      category: 'business', 
      icon: Cpu,
      success_rate: 90,
      description: 'Corporate communications and business updates'
    },
    { 
      id: 'quick-auto', 
      name: 'Smart Auto-Select', 
      category: 'auto', 
      icon: Sparkles,
      success_rate: 95,
      description: 'AI-powered automatic pattern selection'
    }
  ];

  // HIGH-PERFORMING PATTERN PRESETS FOR MAXIMUM INBOX DELIVERY
  const premiumPresets = [
    {
      id: 'quick-cloud',
      name: 'Cloud Storage',
      category: 'cloudStorage',
      icon: Globe,
      success_rate: 99,
      description: 'Drive/OneDrive/Dropbox file sharing - highest success rate'
    },
    {
      id: 'quick-calendar',
      name: 'Calendar Meeting',
      category: 'calendar', 
      icon: Target,
      success_rate: 98,
      description: 'Calendar meeting invites - excellent inbox delivery'
    },
    {
      id: 'quick-invoice',
      name: 'Invoice',
      category: 'invoice',
      icon: BarChart3,
      success_rate: 99,
      description: 'Invoice documents - premium business legitimacy'
    }
  ];

  // Bing Quick Access
  const bingQuickAccess = {
    id: 'quick-bing',
    name: 'B',
    category: 'search',
    icon: Globe,
    success_rate: 94,
    description: 'Bing search engine optimization'
  };

  const fetchPatterns = async () => {
    try {
      setLoading(true);
      console.log('🎯 [StealthPatternSelector] Loading patterns from local library...');

      // Get patterns from local library - no database dependency
      const localPatterns = getLocalPatterns();

      if (localPatterns.length === 0) {
        console.error('[StealthPatternSelector] No local patterns available');
        setPatterns([]);
        return;
      }

      // Convert to expected format and sort by success rate
      const formattedPatterns = localPatterns
        .map(pattern => ({
          ...pattern,
          description: getPatternDescription(pattern.category)
        }))
        .sort((a, b) => b.success_rate - a.success_rate);

      setPatterns(formattedPatterns);
      console.log(`✅ [StealthPatternSelector] Loaded ${formattedPatterns.length} patterns from local library`);

      // Track pattern loading (optional analytics)
      await optionalAnalytics.trackEvent('patterns_loaded', {
        count: formattedPatterns.length,
        source: 'local_library'
      });
    } catch (error) {
      console.error('❌ [StealthPatternSelector] Pattern loading error:', error);
      setPatterns([]);
    } finally {
      setLoading(false);
    }
  };



  const getPatternDescription = (category: string): string => {
    return categoryDescriptions[category as keyof typeof categoryDescriptions] || 'Specialized pattern optimization';
  };

  useEffect(() => {
    fetchPatterns();
  }, []);

  const categories = ['all', ...Array.from(new Set(patterns.map(p => p.category)))];

  const handleQuickPreset = (preset: any) => {
    console.log('[StealthPatternSelector] Quick preset selected:', preset.id);
    // For Bing preset, specifically set search category context
    if (preset.id === 'quick-bing') {
      onPatternSelect({
        ...preset,
        context: { category: 'search', targetAudience: 'general', tier: 1 }
      });
    } else {
      onPatternSelect(preset);
    }
  };

  const handlePatternSelect = (pattern: PatternOption) => {
    console.log('[StealthPatternSelector] Individual pattern selected:', pattern.id);
    onPatternSelect(pattern);
  };

  const toggleCategoryExpansion = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  // Improved selection checking functions
  const isQuickPresetSelected = (presetId: string): boolean => {
    const isSelected = selectedPattern === presetId;
    console.log(`[StealthPatternSelector] Quick preset ${presetId} selected:`, isSelected);
    return isSelected;
  };

  const isPatternSelected = (patternId: string): boolean => {
    const isSelected = selectedPattern === patternId;
    console.log(`[StealthPatternSelector] Pattern ${patternId} selected:`, isSelected);
    return isSelected;
  };

  const isCategorySelected = (category: string): boolean => {
    const hasSelected = patterns.some(p => p.category === category && isPatternSelected(p.id));
    console.log(`[StealthPatternSelector] Category ${category} has selected pattern:`, hasSelected);
    return hasSelected;
  };

  if (loading) {
    return (
      <Card className={`${className} bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border border-cyan-400/30 backdrop-blur-md shadow-2xl animate-pulse`}>
        <CardContent className="p-6">
          <div className="h-6 bg-slate-700/50 rounded mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-20 bg-slate-700/50 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${className} bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 border border-cyan-400/30 backdrop-blur-md shadow-2xl relative overflow-hidden text-white`}>
      {/* Cyberpunk animated background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5 animate-pulse opacity-60"></div>
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
      
      <CardContent className="p-6 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-cyan-400/30 rounded-lg animate-pulse blur-sm"></div>
            <div className="relative z-10 p-2.5 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-lg border border-cyan-400/30">
              <Cpu className="w-5 h-5 text-cyan-300" />
            </div>
          </div>
          <div>
            <h3 className="font-jetbrains font-bold text-cyan-200 text-lg tracking-wider uppercase">AI Pattern Selection</h3>
            <p className="font-jetbrains text-sm text-blue-300/80">Choose your stealth approach</p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mb-6">
          <h4 className="font-jetbrains text-sm font-medium text-cyan-300 mb-3 flex items-center gap-2 uppercase tracking-wide">
            <Sparkles className="w-4 h-4" />
            Quick Launch
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {quickPresets.map(preset => {
              const IconComponent = preset.icon;
              const isSelected = isQuickPresetSelected(preset.id);
              
              return (
                <Button
                  key={preset.id}
                  size="sm"
                  onClick={() => handleQuickPreset(preset)}
                  className={`h-auto p-3 flex flex-col items-center gap-2 text-xs transition-all duration-300 font-jetbrains border ${
                    isSelected 
                      ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/60 text-cyan-200 shadow-lg shadow-cyan-500/30' 
                      : 'bg-gradient-to-br from-slate-800/60 to-blue-900/60 border-cyan-400/30 text-blue-200 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-blue-500/10 hover:border-cyan-400/50 hover:text-cyan-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span className="text-center leading-tight">{preset.name}</span>
                </Button>
              );
            })}
          </div>

          {/* Premium High-Performing Patterns */}
          <div className="mt-4">
            <h5 className="font-jetbrains text-xs font-medium text-yellow-300 mb-2 flex items-center gap-2 uppercase tracking-wide">
              <Star className="w-3 h-3" />
              99% Inbox Rate
            </h5>
            <div className="grid grid-cols-3 gap-2">
              {premiumPresets.map(preset => {
                const IconComponent = preset.icon;
                const isSelected = isQuickPresetSelected(preset.id);
                
                return (
                  <Button
                    key={preset.id}
                    size="sm"
                    onClick={() => handleQuickPreset(preset)}
                    className={`h-auto p-2 flex flex-col items-center gap-1 text-xs transition-all duration-300 font-jetbrains border ${
                      isSelected 
                        ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/60 text-yellow-200 shadow-lg shadow-yellow-500/30' 
                        : 'bg-gradient-to-br from-slate-800/60 to-yellow-900/60 border-yellow-400/30 text-yellow-200 hover:bg-gradient-to-br hover:from-yellow-500/10 hover:to-orange-500/10 hover:border-yellow-400/50'
                    }`}
                  >
                    <IconComponent className="w-3 h-3" />
                    <span className="text-center leading-tight text-[10px]">{preset.name}</span>
                    <Badge variant="outline" className="text-[8px] px-1 py-0 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                      {preset.success_rate}%
                    </Badge>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Bing Quick Access */}
          <div className="mt-3">
            <Button
              size="sm"
              onClick={() => handleQuickPreset(bingQuickAccess)}
              className={`h-auto p-3 flex items-center justify-center gap-2 text-xs transition-all duration-300 font-jetbrains border min-w-[80px] ${
                isQuickPresetSelected(bingQuickAccess.id)
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-400/60 text-cyan-200 shadow-lg shadow-cyan-500/30' 
                  : 'bg-gradient-to-br from-slate-800/60 to-blue-900/60 border-cyan-400/30 text-blue-200 hover:bg-gradient-to-br hover:from-cyan-500/10 hover:to-blue-500/10 hover:border-cyan-400/50 hover:text-cyan-200'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span className="text-center leading-tight font-bold">B</span>
            </Button>
          </div>
        </div>

        {/* Category-First Selection */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-jetbrains text-sm font-medium text-cyan-300 flex items-center gap-2 uppercase tracking-wide">
              <Target className="w-4 h-4" />
              Pattern Categories
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="font-jetbrains text-xs text-slate-400 hover:text-cyan-300"
            >
              <Info className="w-3 h-3 mr-1" />
              {showTechnicalDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          <div className="space-y-2">
            {categories.filter(cat => cat !== 'all').map(category => {
              const categoryPatterns = patterns.filter(p => p.category === category);
              const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Target;
              const isExpanded = expandedCategory === category;
              const hasSelectedPattern = isCategorySelected(category);
              
              return (
                <div key={category} className="border border-cyan-400/20 rounded-lg overflow-hidden bg-gradient-to-r from-slate-800/50 to-blue-900/50">
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategoryExpansion(category)}
                    className={`flex items-center justify-between p-3 cursor-pointer transition-all duration-200 ${
                      hasSelectedPattern 
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-b border-cyan-500/20' 
                        : 'hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-blue-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`w-4 h-4 ${hasSelectedPattern ? 'text-cyan-400' : 'text-blue-400'}`} />
                      <div>
                        <span className={`font-jetbrains font-medium capitalize tracking-wide ${hasSelectedPattern ? 'text-cyan-200' : 'text-blue-200'}`}>
                          {category}
                        </span>
                        <p className="font-jetbrains text-xs text-blue-300/80 mt-0.5">
                          {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-jetbrains text-xs bg-slate-700/50 text-blue-300 border-blue-500/30">
                        {categoryPatterns.length} patterns
                      </Badge>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-blue-400" /> : <ChevronRight className="w-4 h-4 text-blue-400" />}
                    </div>
                  </div>

                  {/* Expanded Pattern List */}
                  {isExpanded && (
                    <div className="p-3 bg-gradient-to-r from-slate-900/60 to-blue-900/60 border-t border-cyan-400/20">
                      <div className="grid grid-cols-1 gap-2">
                        {categoryPatterns.map(pattern => {
                          const isSelected = isPatternSelected(pattern.id);
                          
                          return (
                            <div
                              key={pattern.id}
                              onClick={() => handlePatternSelect(pattern)}
                              className={`cursor-pointer p-3 rounded-lg border transition-all duration-200 ${
                                isSelected 
                                  ? 'border-cyan-400/50 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 shadow-md shadow-cyan-500/20' 
                                  : 'border-blue-500/30 bg-gradient-to-r from-slate-800/40 to-blue-900/40 hover:border-cyan-400/40 hover:bg-gradient-to-r hover:from-slate-700/50 hover:to-blue-800/50'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`font-jetbrains font-medium text-sm tracking-wide ${isSelected ? 'text-cyan-200' : 'text-blue-200'}`}>
                                      {pattern.name}
                                    </span>
                                    {showTechnicalDetails && (
                                      <Badge className={`font-jetbrains text-xs px-2 py-0.5 ${
                                        pattern.success_rate >= 90 
                                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                          : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                                      }`}>
                                        {pattern.success_rate}%
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="font-jetbrains text-xs text-blue-300/70">{pattern.description}</p>
                                  
                                  {showTechnicalDetails && (
                                    <div className="flex items-center gap-3 mt-2 font-jetbrains text-xs text-blue-400/60">
                                      <span>Tier {pattern.tier}</span>
                                      <span>{pattern.content_type}</span>
                                      <span>{pattern.current_uses}/{pattern.max_uses} uses</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* No patterns available message */}
        {!loading && patterns.length === 0 && (
          <div className="text-center py-8">
            <Cpu className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <p className="font-jetbrains text-blue-300">No patterns available</p>
            <p className="font-jetbrains text-xs text-blue-400/60 mt-2">Patterns are being loaded from the database</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StealthPatternSelector;
