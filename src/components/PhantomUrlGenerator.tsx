import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Copy, ExternalLink, Globe, ArrowRight, Info, Zap, Shield, CheckCircle2, Settings, Sparkles, Wand2, Lock, Loader2, Building, FileText, Link as LinkIcon, EyeOff, Cpu, Search, Target, ArrowUpRight, Eye, Atom, TrendingUp, RotateCcw } from 'lucide-react';
import GenerationMetadata from './GenerationMetadata';
import { isValidHttpUrl } from '@/utils/validation/urlValidator';
import { centralizedUrlProcessor } from '@/utils/services/centralizedUrlProcessor';
import { PhantomUrlGenerator as PhantomUrlGeneratorClass, PhantomUrlOptions } from '@/utils/phantomUrlGenerator';

import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import StealthPatternSelector from './StealthPatternSelector';
import { localPatternAnalyzer } from '@/utils/localPatternAnalyzer';
import { optionalAnalytics } from '@/utils/optionalAnalytics';
import { hybridPatternManager } from '@/utils/hybridPatternManager';
import EvasionConfigPanel, { EvasionConfig } from './EvasionConfigPanel';
import ValidationResultsPanel, { ValidationResult } from './ValidationResultsPanel';

const PhantomUrlGenerator = () => {
  // Phantom URL Generator - Advanced phantom URL creation system
  // Inline styles for toggle switches
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .toggle-checkbox:checked {
        transform: translateX(100%);
        border-color: #4f46e5;
      }
      .toggle-checkbox:checked + .toggle-label {
        background-color: #818cf8;
      }
    `;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const [inputUrl, setInputUrl] = useState('');
  const [generatedRedirectUrl, setGeneratedRedirectUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [phantomOptions, setPhantomOptions] = useState<PhantomUrlOptions>({
    pattern: 'auto',
    stealthLevel: 'both',
    tier: 1
  });
  const [urlResult, setUrlResult] = useState<any>(null);
  const [selectedPatternData, setSelectedPatternData] = useState<any>(null);
  // Add selectedPatternId state for proper tracking with rotation
  const [selectedPatternId, setSelectedPatternId] = useState<string>('auto');
  const [patternRotationCounter, setPatternRotationCounter] = useState<number>(0);
  // Advanced intelligence states
  const [urlAnalysis, setUrlAnalysis] = useState<any>(null);
  const [patternRecommendations, setPatternRecommendations] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Generation metadata states
  const [generationMetadata, setGenerationMetadata] = useState<any>(null);
  const [lastGenerated, setLastGenerated] = useState<number>(0);

  // NEW: Enhanced evasion configuration state
  const [evasionConfig, setEvasionConfig] = useState<EvasionConfig>({
    enableAntiDetection: true,
    targetProvider: 'generic',
    useAgedUrl: false,
    enableSubdomainRotation: true,
    enableMicrosoftEvasion: false,
    enableBehavioralMimicry: false,
    mimicryService: 'auto',
    agingPeriod: 168 // 7 days
  });

  // NEW: Validation results state
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { toast } = useToast();

  // Initialize the PhantomUrlGenerator for URL generation
  const phantomGenerator = new PhantomUrlGeneratorClass();
  
  // Define quick access number to URL mapping
  const numberToUrlMap: { [key: string]: string } = {
    '1': 'https://google.com',
    '2': 'https://github.com',
    '3': 'https://stackoverflow.com',
    '4': 'https://developer.mozilla.org',
    '5': 'https://tailwindcss.com'
  };

  // Enhanced pattern mapping with smart auto-select functionality
  const handlePatternSelect = async () => {
    if (selectedPatternId === 'auto') {
      // Increment rotation counter for variety on every auto-select
      const newCounter = patternRotationCounter + 1;
      setPatternRotationCounter(newCounter);
      
      console.log('[PhantomUrlGenerator] Smart Auto-Select: Counter incremented to:', newCounter);
      
      // Force fresh generation by clearing any cached metadata
      setGenerationMetadata(null);
      
      // Get optimal pattern with variety injection
      try {
        const context = {
          industry: 'general',
          targetAudience: 'mixed' as const,
          securityLevel: 'medium' as const
        };

        const optimalPattern = await hybridPatternManager.selectOptimalPattern(context);
        
        if (optimalPattern) {
          console.log('[PhantomUrlGenerator] Smart Auto-Select: Selected pattern:', optimalPattern.name);
          setSelectedPatternData(optimalPattern);

          toast({
            title: "🤖 Smart Auto-Select",
            description: `Rotated to ${optimalPattern.name} (${optimalPattern.category})`,
            className: "bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500 text-blue-800 shadow-lg",
            duration: 2000
          });

          return optimalPattern.category;
        }
      } catch (error) {
        console.warn('[PhantomUrlGenerator] Auto-select failed, using random fallback:', error);
      }
    }
    
    return selectedPatternData?.category || 'intelligent';
  };

  // Enhanced pattern mapping with complete category support
  const mapPhantomOptions = (uiOptions: PhantomUrlOptions): PhantomUrlOptions => {
    let actualPattern = 'intelligent'; // Default to intelligent instead of auto
    
    if (selectedPatternData && selectedPatternId && !selectedPatternId.startsWith('quick-')) {
      // Use the database pattern's category directly - enhanced mapping
      const categoryMap: { [key: string]: string } = {
        'medical': 'medical',
        'banking': 'banking', 
        'finance': 'banking',
        'government': 'government',
        'technology': 'technology',
        'education': 'education',
        'business': 'business',
        'ecommerce': 'ecommerce',
        'news': 'content',
        'content': 'content',
        'document': 'document'
      };
      
      actualPattern = categoryMap[selectedPatternData.category] || 'intelligent';
    } else if (uiOptions.pattern) {
      // Enhanced UI mapping for backward compatibility
      const patternMap: { [key: string]: string } = {
        'auto': 'intelligent',   // Auto → Intelligent patterns
        'path': 'document',      // Direct → Document patterns (PDFs, presentations)
        'parameter': 'business', // Secure → Business patterns (API endpoints)
        'fragment': 'content',   // Silent → Content patterns (blog, pages)
        'subdomain': 'business'  // Shield → Business patterns (NO MORE /e/ fallback)
      };
      actualPattern = patternMap[uiOptions.pattern] || 'intelligent';
    }

    const stealthLevelMap: { [key: string]: string } = {
      'normal': 'planA',       // Standard → Plan A (basic stealth)
      'maximum': 'planB',      // Advanced → Plan B (maximum obfuscation)
      'both': 'both'           // Enterprise → Both (already correct)
    };

    return {
      ...uiOptions,
      pattern: actualPattern as any,
      stealthLevel: stealthLevelMap[uiOptions.stealthLevel || 'both'] as any || 'both',
      context: {
        ...uiOptions.context,
        tier: uiOptions.tier || 1,
        category: selectedPatternData?.category || actualPattern,
        industry: selectedPatternData?.industry || uiOptions.context?.industry
      }
    };
  };

  // AI-powered URL analysis function
  const analyzeUrlIntelligently = async (url: string) => {
    if (!url || !url.includes('.')) return;

    setIsAnalyzing(true);
    try {
      // Extract domain and infer context
      const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      const industry = inferIndustryFromDomain(domain);

      // Get AI-optimized pattern recommendations
      const context = {
        industry,
        targetCountry: 'US',
        securityLevel: 'high' as const
      };

      console.log('🧠 [AI Analysis] Starting analysis for:', domain, 'Industry:', industry);

      // Try to get pattern recommendations with error handling
      let recommendations: any[] = [];
      try {
        const analysisResults = await localPatternAnalyzer.analyzePatterns(context);
        recommendations = analysisResults.map(analysis => ({
          patternName: analysis.patternName,
          performanceScore: analysis.performanceScore,
          recommendationReason: analysis.reasoning?.[0] || 'AI-optimized for your industry',
          riskScore: analysis.riskScore
        }));
        console.log('🧠 [AI Analysis] Got recommendations:', recommendations.length);
      } catch (patternError) {
        console.warn('🧠 [AI Analysis] Pattern analysis failed, using fallback:', patternError);
        // Provide fallback recommendations based on industry
        recommendations = getFallbackRecommendations(industry);
      }

      setPatternRecommendations(recommendations.slice(0, 5));

      // Generate URL analysis
      const analysis = {
        domain,
        industry,
        security_level: 'high',
        recommended_approach: 'stealth',
        risk_factors: analyzeRiskFactors(domain),
        optimization_suggestions: generateOptimizationSuggestions(domain, industry)
      };

      setUrlAnalysis(analysis);

      toast({
        title: "🧠 Smart Analysis Complete",
        description: `Found ${recommendations.length} optimized patterns for ${industry}`,
        className: "bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500 text-purple-800 shadow-lg",
        duration: 3000
      });
    } catch (error) {
      console.error('🧠 [AI Analysis] Analysis failed:', error);
      // Provide basic fallback analysis
      const domain = url.replace(/^https?:\/\//, '').split('/')[0];
      const industry = inferIndustryFromDomain(domain);

      setUrlAnalysis({
        domain,
        industry,
        security_level: 'medium',
        recommended_approach: 'stealth',
        risk_factors: analyzeRiskFactors(domain),
        optimization_suggestions: ['Use stealth patterns for better delivery']
      });

      setPatternRecommendations(getFallbackRecommendations(industry));

      toast({
        title: "🧠 Basic Analysis Complete",
        description: `Analysis completed with fallback data for ${industry}`,
        className: "bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 text-amber-800 shadow-lg",
        duration: 3000
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Enhanced pattern change handler with AI insights
  const handlePatternChange = async (patternId: string, patternData: any) => {
    console.log('[PhantomUrlGenerator] Pattern changed:', patternId, patternData);
    
    // Update the selected pattern ID for proper tracking
    setSelectedPatternId(patternId);
    setSelectedPatternData(patternData);
    
    // Get enhanced pattern information from pattern manager
    if (patternId && !patternId.startsWith('quick-')) {
      try {
        const enhancedPattern = await hybridPatternManager.getPatternById(patternId);
        if (enhancedPattern) {
          setSelectedPatternData(enhancedPattern);
        }
        
        const context = urlAnalysis ? {
          industry: urlAnalysis.industry,
          countryCode: 'US' // Default for now
        } : {};
        
        // Use the actual UUID pattern ID (no prefix removal needed now)
        console.log('Pattern context for analysis:', context);
      } catch (error) {
        console.error('Pattern prediction error:', error);
      }
    }
    
    // Map the pattern selection to stealth options
    let mappedPattern = 'auto';
    
    if (patternId.startsWith('quick-')) {
      switch (patternId) {
        case 'quick-marketing':
        case 'quick-business':
          mappedPattern = 'business';
          break;
        case 'quick-newsletter':
          mappedPattern = 'content';
          break;
        case 'quick-bing':
          mappedPattern = 'search';
          break;
        case 'quick-auto':
          mappedPattern = 'auto';
          break;
        default:
          mappedPattern = patternData.category || 'auto';
      }
    } else if (patternId && !patternId.startsWith('quick-')) {
      // This is a database pattern with UUID
      mappedPattern = patternData.category || 'auto';
    }
    
    console.log('[PhantomUrlGenerator] Mapped pattern:', mappedPattern);
    
    setPhantomOptions(prev => ({ 
      ...prev, 
      pattern: mappedPattern as any 
    }));
    
    const successRate = patternData.success_rate || 85;
    const confidence = 'high';
    
    toast({
      title: "🎯 AI Pattern Selected",
      description: `${patternData.name} - ${successRate}% success rate (${confidence} confidence)`,
      className: "bg-gradient-to-r from-emerald-50 to-blue-50 border-l-4 border-emerald-500 text-emerald-800 shadow-lg",
      duration: 3000
    });
  };

  // Helper functions for AI analysis
  const inferIndustryFromDomain = (domain: string): string => {
    const industryKeywords = {
      'finance': ['bank', 'finance', 'trading', 'invest', 'crypto'],
      'healthcare': ['health', 'medical', 'pharma', 'clinic', 'hospital'],
      'technology': ['tech', 'software', 'app', 'dev', 'api', 'cloud'],
      'ecommerce': ['shop', 'store', 'buy', 'sell', 'commerce', 'retail'],
      'education': ['edu', 'school', 'university', 'course', 'learn'],
      'news': ['news', 'media', 'press', 'journal', 'times'],
      'government': ['gov', 'official', 'state', 'federal', 'public']
    };
    
    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      if (keywords.some(keyword => domain.toLowerCase().includes(keyword))) {
        return industry;
      }
    }
    return 'business';
  };

  const analyzeRiskFactors = (domain: string): string[] => {
    const risks = [];
    if (domain.includes('gov')) risks.push('government_domain');
    if (domain.includes('bank')) risks.push('financial_service');
    if (domain.length < 8) risks.push('short_domain');
    if (domain.split('.').length > 3) risks.push('complex_subdomain');
    return risks;
  };

  const generateOptimizationSuggestions = (domain: string, industry: string): string[] => {
    const suggestions = [];
    if (industry === 'finance') suggestions.push('Use document patterns for higher trust');
    if (industry === 'technology') suggestions.push('Business API patterns recommended');
    if (industry === 'healthcare') suggestions.push('Professional document mimicry optimal');
    suggestions.push('Enable geographic optimization');
    suggestions.push('Use AES encryption for maximum security');
    return suggestions;
  };

  const getFallbackRecommendations = (industry: string): any[] => {
    const baseRecommendations = [
      {
        patternName: 'Document Pattern',
        performanceScore: 96,
        recommendationReason: 'High trust document sharing format',
        riskScore: 15
      },
      {
        patternName: 'Business API Pattern',
        performanceScore: 93,
        recommendationReason: 'Professional API endpoint style',
        riskScore: 20
      },
      {
        patternName: 'Intelligent Pattern',
        performanceScore: 97,
        recommendationReason: 'AI-optimized URL structure',
        riskScore: 12
      }
    ];

    // Industry-specific recommendations
    if (industry === 'finance') {
      baseRecommendations.unshift({
        patternName: 'Secure Document Pattern',
        performanceScore: 98,
        recommendationReason: 'Optimized for financial services',
        riskScore: 10
      });
    } else if (industry === 'technology') {
      baseRecommendations.unshift({
        patternName: 'Developer API Pattern',
        performanceScore: 95,
        recommendationReason: 'Perfect for tech industry',
        riskScore: 18
      });
    }

    return baseRecommendations;
  };

  // Auto-analyze URL when it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputUrl && inputUrl.includes('.') && !inputUrl.match(/^[1-5]$/)) {
        analyzeUrlIntelligently(inputUrl);
      }
    }, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [inputUrl]);

  const handleGenerateRedirect = async () => {
    if (!inputUrl.trim()) {
      toast({
        title: "Action Required",
        description: "Please provide a destination URL or select a quick number (1-5)",
        variant: "destructive",
        className: "bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 shadow-lg",
        duration: 3000
      });
      return;
    }

    // Reset any previous states
    setShowResult(false);
    setIsGenerating(true);
    setGeneratedRedirectUrl(''); // Clear any previous URL
    
    try {
      console.log('🚀 [PhantomUrlGenerator] Starting URL generation process');
      console.log('📥 Input URL:', inputUrl);
      console.log('⚙️ Show Advanced:', showAdvanced);
      console.log('🎯 Selected Pattern:', selectedPatternData?.name || 'None');

      // Get current user's session token
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        console.error('❌ [Auth] No session token found');
        toast({
          title: "Authentication Required",
          description: "Please log in with your license key to generate URLs",
          variant: "destructive",
          className: "bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 text-amber-900 shadow-lg",
          duration: 4000
        });
        setIsGenerating(false);
        return;
      }

      console.log('🔐 [Auth] Session token found:', sessionToken.substring(0, 8) + '...');

      // Validate session and get license key ID
      const { data: sessionData, error: sessionError } = await supabase.rpc('validate_session_with_license', {
        session_token_input: sessionToken
      });

      if (sessionError) {
        console.error('❌ [Auth] Session validation error:', sessionError);
        toast({
          title: "Session Validation Failed",
          description: `Authentication error: ${sessionError.message}`,
          variant: "destructive",
          className: "bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 shadow-lg",
          duration: 4000
        });
        setIsGenerating(false);
        return;
      }

      if (!(sessionData as any)?.valid) {
        console.error('❌ [Auth] Session validation failed:', sessionData);
        toast({
          title: "Session Invalid",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
          className: "bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800 shadow-lg",
          duration: 4000
        });
        setIsGenerating(false);
        return;
      }

      const licenseKeyId = (sessionData as any).license_id;
      console.log('✅ [Auth] Session validated, license ID:', licenseKeyId);
      
      // Add a slight delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 300));
      
      let resultUrl = '';
      let resultData = null;
      
      // Handle quick access numbers (1-5)
      if (/^[1-5]$/.test(inputUrl.trim())) {
        console.log('🔢 [Generation] Processing quick number:', inputUrl.trim());
        const quickNumber = inputUrl.trim();
        const targetUrl = numberToUrlMap[quickNumber];
        console.log('🎯 [Generation] Target URL for quick number:', targetUrl);
        
        try {
          // Force fresh generation with unique timestamp and rotation
          const varietySeed = Date.now() + Math.random() * 1000;
          const result = await centralizedUrlProcessor.generateUnifiedUrl(targetUrl, licenseKeyId, {
            pattern: 'legacy',
            useAdvanced: false,
            forceNewHash: true,
            varietySeed: varietySeed
          });
          
          resultUrl = window.location.origin + result.url;
          resultData = {
            ...result.metadata,
            isQuickAccess: true,
            timestamp: Date.now(),
            rotationCounter: patternRotationCounter + 1,
            varietySeed: varietySeed
          };
          
          console.log('✅ [Generation] Generated quick access URL:', resultUrl);
        } catch (quickError) {
          console.error('❌ [Generation] Quick URL generation failed:', quickError);
          throw new Error(`Quick URL generation failed: ${quickError.message}`);
        }
      } 
      // Handle regular URLs when stealth options are hidden - use simple format
      else if (isValidHttpUrl(inputUrl) && !showAdvanced) {
        console.log('📝 [Generation] Processing standard URL with simple format:', inputUrl);
        
        try {
          // Force fresh generation with unique parameters
          const varietySeed = Date.now() + Math.random() * 1000;
          const result = await centralizedUrlProcessor.generateUnifiedUrl(inputUrl, licenseKeyId, {
            pattern: 'legacy',
            useAdvanced: false,
            forceNewHash: true,
            varietySeed: varietySeed
          });
          
          resultUrl = window.location.origin + result.url;
          resultData = {
            ...result.metadata,
            isQuickAccess: false,
            timestamp: Date.now(),
            rotationCounter: patternRotationCounter + 1,
            varietySeed: varietySeed
          };
          
          console.log('✅ [Generation] Generated simple URL:', resultUrl);
        } catch (simpleError) {
          console.error('❌ [Generation] Simple URL generation failed:', simpleError);
          throw new Error(`Simple URL generation failed: ${simpleError.message}`);
        }
      }
      // Handle regular URLs with advanced stealth options
      else if (isValidHttpUrl(inputUrl)) {
        console.log('🔮 [Generation] Processing URL with advanced options:', inputUrl);
        console.log('🎨 [Generation] Pattern data:', selectedPatternData);
        console.log('🛡️ [Generation] Phantom options:', phantomOptions);
        
        // AI integration removed - using standard generation
        
        try {
          // Get the mapped pattern with smart auto-select
          let mappedPattern = await handlePatternSelect();
          
          // Ensure we never use 'auto' in the actual generation
          if (mappedPattern === 'auto') {
            mappedPattern = 'intelligent';
          }
          
          console.log('📋 [Generation] Final mapped pattern:', mappedPattern);
          console.log('🔄 [Generation] Rotation counter:', patternRotationCounter);
          console.log('🎯 [Generation] Pattern data:', selectedPatternData?.name);
          
          // Force fresh generation with enhanced variety and new features
          const varietySeed = Date.now() + patternRotationCounter + Math.random() * 1000;

          // Determine pattern based on evasion config
          let finalPattern = mappedPattern;
          if (evasionConfig.enableMicrosoftEvasion && evasionConfig.targetProvider === 'microsoft') {
            finalPattern = 'microsoft';
          } else if (evasionConfig.enableBehavioralMimicry) {
            finalPattern = 'mimicry';
          }

          const result = await centralizedUrlProcessor.generateUnifiedUrl(inputUrl, licenseKeyId, {
            pattern: finalPattern,
            stealthLevel: phantomOptions.stealthLevel,
            encryptionMode: 'auto', // Intelligent mode selection
            patternData: selectedPatternData,
            useAdvanced: true,
            varietySeed: varietySeed,
            forceNewHash: true,
            // NEW ENHANCED OPTIONS FROM EVASION CONFIG:
            enableAntiDetection: evasionConfig.enableAntiDetection,
            targetProvider: evasionConfig.targetProvider,
            useAgedUrl: evasionConfig.useAgedUrl,
            enableSubdomainRotation: evasionConfig.enableSubdomainRotation
          });
          
          resultUrl = window.location.origin + result.url;
          
          // 🔍 DEBUG: Check for placeholder issues
          if (resultUrl.includes('{') || resultUrl.includes('}')) {
            console.error('🚨 [DEBUG] Placeholder replacement failed in URL:', resultUrl);
            console.error('🚨 [DEBUG] Raw result from processor:', result);
          }
          
          resultData = {
            ...result.metadata,
            timestamp: Date.now(),
            rotationCounter: patternRotationCounter + 1,
            varietySeed: varietySeed,
            patternName: selectedPatternData?.name || mappedPattern
          };
          
          console.log('✅ [Generation] Generated advanced URL:', resultUrl);
          console.log('📊 [Generation] Metadata:', resultData);

          // NEW: Validate the generated URL
          try {
            setIsValidating(true);
            const validation = await centralizedUrlProcessor.validateGeneratedUrl(result.url);
            setValidationResult({
              ...validation,
              metadata: resultData
            });
            console.log('🔍 [Validation] URL validation completed:', validation);
          } catch (validationError) {
            console.warn('⚠️ [Validation] URL validation failed:', validationError);
            setValidationResult({
              isValid: false,
              issues: ['Validation service unavailable'],
              recommendations: ['Manual review recommended'],
              riskScore: 50,
              metadata: resultData
            });
          } finally {
            setIsValidating(false);
          }
        } catch (advancedError) {
          console.error('❌ [Generation] Advanced URL generation failed:', advancedError);
          console.log('🔄 [Generation] Attempting fallback to simple generation...');
          
          try {
            // Fallback to simple generation
            const fallbackResult = await centralizedUrlProcessor.generateUnifiedUrl(inputUrl, licenseKeyId, {
              pattern: 'legacy',
              useAdvanced: false
            });
            
            resultUrl = window.location.origin + fallbackResult.url;
            resultData = {
              ...fallbackResult.metadata,
              fallbackUsed: true
            };
            
            console.log('✅ [Generation] Fallback URL generated:', resultUrl);
            
            toast({
              title: "⚠️ Advanced Generation Failed",
              description: "Using simplified format as fallback",
              className: "bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 text-amber-800 shadow-lg",
              duration: 3000
            });
          } catch (fallbackError) {
            console.error('❌ [Generation] Fallback generation also failed:', fallbackError);
            throw new Error(`Both advanced and fallback generation failed: ${advancedError.message}`);
          }
        }
      } 
      // Invalid input
      else {
        console.log('❌ [Validation] Invalid URL format:', inputUrl);
        toast({
          title: "Invalid Format",
          description: "Please enter a valid URL starting with http:// or https://",
          variant: "destructive",
          className: "bg-gradient-to-r from-amber-50 to-amber-100 border-l-4 border-amber-500 text-amber-900 shadow-lg",
          duration: 3000
        });
        setIsGenerating(false);
        return;
      }
      
      console.log('📤 [Result] Setting result data:', resultData);
      console.log('🔗 [Result] Setting URL:', resultUrl);
      
      // Show variation notification if this is not the first generation
      if (lastGenerated > 0) {
        toast({
          title: "🔄 New Variation Generated",
          description: `Rotation #${(resultData.rotationCounter || patternRotationCounter + 1)} with fresh encryption`,
          className: "bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-cyan-500 text-cyan-800 shadow-lg",
          duration: 2500
        });
      }
      
      // Validate the generated URL
      if (!resultUrl) {
        throw new Error('Generated URL is empty');
      }

      if (!resultUrl.startsWith(window.location.origin)) {
        throw new Error('Generated URL has invalid origin');
      }
      
      // Important: Update state in correct order
      setGeneratedRedirectUrl(resultUrl);
      setUrlResult(resultData);
      
      // Set generation metadata for display
      if (resultData) {
        setGenerationMetadata({
          timestamp: resultData.timestamp || Date.now(),
          rotationCounter: resultData.rotationCounter || patternRotationCounter + 1,
          encryptionMode: resultData.encryptionMode || 'aes',
          patternName: resultData.patternName || selectedPatternData?.name,
          encryptedPreview: resultData.encryptedData,
          varietySeed: resultData.varietySeed,
          securityLevel: resultData.securityLevel || 85
        });
        
        // Update rotation counter
        setPatternRotationCounter(resultData.rotationCounter || patternRotationCounter + 1);
        setLastGenerated(Date.now());
      }
      
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        setShowResult(true);
        console.log('✅ [UI] Results displayed successfully');
      }, 100);
      
      const successMessage = resultData?.fallbackUsed 
        ? "URL generated using simplified format"
        : selectedPatternData 
          ? `${selectedPatternData.name} pattern applied successfully`
          : "Your premium secure redirect is ready";
      
      toast({
        title: "✨ Generation Complete",
        description: successMessage,
        className: "bg-gradient-to-r from-emerald-50 to-blue-50 border-l-4 border-emerald-500 text-emerald-800 shadow-lg",
        duration: 4000
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('💥 [Error] URL generation failed:', errorMessage);
      console.error('📝 [Error] Full error details:', error);

      // Provide specific error messages based on error type
      let userMessage = "Unable to complete your secure redirect request";
      let errorTitle = "Generation Interrupted";

      if (errorMessage.includes('Rate limit')) {
        errorTitle = "Rate Limit Exceeded";
        userMessage = "Too many requests. Please wait a moment and try again.";
      } else if (errorMessage.includes('Invalid target URL')) {
        errorTitle = "Invalid URL";
        userMessage = "The provided URL format is not supported.";
      } else if (errorMessage.includes('Database registration failed')) {
        errorTitle = "Database Error";
        userMessage = "Temporary database issue. Your URL may still work.";
      } else if (errorMessage.includes('Session')) {
        errorTitle = "Authentication Error";
        userMessage = "Please refresh the page and log in again.";
      } else if (errorMessage.includes('fallback generation failed')) {
        errorTitle = "System Error";
        userMessage = "Multiple generation methods failed. Please try again.";
      }

      toast({
        title: errorTitle,
        description: `${userMessage} (Debug: ${errorMessage.substring(0, 100)})`,
        variant: "destructive",
        className: "bg-gradient-to-r from-red-50 to-rose-100 border-l-4 border-red-600 text-red-900 shadow-lg", 
        duration: 6000
      });
    } finally {
      setIsGenerating(false);
      console.log('🏁 [Generation] Process completed');
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(generatedRedirectUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "✓ Copied to Clipboard",
        description: "Secure redirect URL is ready to share",
        className: "bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-indigo-500 text-indigo-800 shadow-lg",
        duration: 2500
      });
    } catch (error) {
      toast({
        title: "Clipboard Action Failed",
        description: "Unable to copy the secure URL to your clipboard",
        variant: "destructive",
        className: "bg-gradient-to-r from-purple-50 to-red-50 border-l-4 border-purple-600 text-purple-900 shadow-lg",
        duration: 3000
      });
    }
  };

  const handleTestRedirect = () => {
    if (generatedRedirectUrl) {
      window.open(generatedRedirectUrl, '_blank');
    }
  };

  return (
    <div className="space-y-8 font-jetbrains antialiased">
      {/* Main Input Section - Enhanced Cyberpunk Design */}
      <div className="bg-gradient-to-br from-slate-900/90 via-blue-900/30 to-purple-900/30 backdrop-blur-lg rounded-3xl shadow-2xl border border-cyan-400/40 p-6 sm:p-8 transition-all duration-300 hover:shadow-cyan-300/20 hover:border-cyan-300/60 relative overflow-hidden">
        {/* Cyberpunk grid background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>
        
        {/* Animated scan line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
        
        <div className="space-y-7 relative z-10">
          {/* URL Input Field with Enhanced Cyberpunk Design */}
          <div className="space-y-4 max-w-lg mx-auto">
            <div className="relative group transition-all duration-300">
              {/* Enhanced glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/30 to-blue-600/30 rounded-2xl opacity-40 blur-md group-hover:opacity-60 transition duration-500"></div>
              
              <div className="relative bg-slate-800/60 backdrop-blur-sm rounded-2xl shadow-xl flex items-center overflow-hidden border border-cyan-400/50 group-hover:border-cyan-300/70 transition-all duration-300">
                <div className="pl-5 py-2">
                  <Globe className="w-6 h-6 text-cyan-400" />
                </div>
                
                <Input
                  type="text"
                  placeholder="Enter Destination URL or Quick Number (1-5)"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleGenerateRedirect()}
                  className="h-14 text-lg border-0 focus:ring-0 pl-4 pr-14 py-3 flex-1 bg-transparent font-jetbrains font-medium w-full text-cyan-50 placeholder:text-cyan-200/50"
                  style={{ minWidth: "0", boxShadow: "none" }}
                />
                
                <div className="absolute right-5 top-1/2 transform -translate-y-1/2 transition-all duration-300">
                  {/^\d+$/.test(inputUrl) ? (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-amber-400/80 to-orange-500/80 text-white shadow-lg">
                      <Zap className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400/80 to-blue-500/80 text-white shadow-lg">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-2 px-2">
              <div className="hidden sm:block h-px w-8 bg-gradient-to-r from-transparent to-cyan-300/60"></div>
              <p className="text-xs sm:text-sm text-cyan-100/80 font-jetbrains font-medium px-1 text-center">
                Enter URL or use quick numbers 1-5 for instant testing
              </p>
              <div className="hidden sm:block h-px w-8 bg-gradient-to-r from-cyan-300/60 to-transparent"></div>
            </div>
          </div>

          {/* Advanced Toggle - Enhanced Cyberpunk Design */}
          <div className="relative group/advancedToggle mb-6">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-500/20 via-cyan-500/20 to-blue-500/20 rounded-xl opacity-0 group-hover/advancedToggle:opacity-60 blur-md transition-all duration-500 hidden sm:block"></div>
            
            <div 
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="relative z-10 flex items-center gap-3 px-5 py-4 rounded-xl border border-cyan-500/40 bg-slate-800/40 hover:bg-slate-700/50 shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 cursor-pointer group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-100/10 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-1000 ease-out hidden sm:block"></div>
              
              <div className="relative z-10 flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  <div className={`${showAdvanced ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30' : 'bg-slate-700/50'} rounded-xl p-2.5 transition-all duration-300 shadow-lg`}>
                    <Settings className={`w-5 h-5 ${showAdvanced ? 'text-cyan-200' : 'text-slate-400'} transition-colors duration-300`} />
                  </div>
                  <div>
                    <span className={`text-base font-jetbrains font-semibold ${showAdvanced ? 'text-cyan-200' : 'text-slate-200'} transition-colors duration-300`}>
                      {showAdvanced ? 'Advanced Pattern Selection' : 'AI Pattern Selection'}
                    </span>
                    <p className="text-sm text-slate-400 mt-0.5">
                      {showAdvanced ? 'Choose specific stealth patterns' : 'Let AI select optimal patterns'}
                    </p>
                  </div>
                </div>
                
                <div className={`${showAdvanced ? 'bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-200' : 'bg-slate-700/50 text-slate-400'} rounded-xl p-2 transition-all duration-300 transform ${showAdvanced ? 'rotate-180' : 'rotate-0'} shadow-lg`}>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Pattern Selection */}
          {showAdvanced && (
            <div className="mb-12 sm:mb-16 animate-in slide-in-from-top-4 duration-500">
              <StealthPatternSelector
                selectedPattern={selectedPatternId}
                onPatternSelect={(pattern) => handlePatternChange(pattern?.id || 'auto', pattern)}
                className="mb-6"
              />
              
              {/* Simplified Security Level Selection */}
              <div className="relative group/phantomOptions">
                <div className="bg-gradient-to-br from-slate-800/60 via-slate-700/70 to-purple-800/40 rounded-xl p-5 border border-purple-500/30 shadow-lg backdrop-blur-sm overflow-hidden">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-gradient-to-br from-purple-500/80 to-indigo-600/80 p-2.5 rounded-xl border border-purple-400/30 shadow-lg">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-br from-purple-200 via-cyan-200 to-blue-200">Security Protocol</h3>
                      <p className="text-purple-200/80 text-sm">Choose your protection level</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      {id: 'normal' as const, name: 'Standard', desc: 'Basic stealth'}, 
                      {id: 'maximum' as const, name: 'Advanced', desc: 'High security'}, 
                      {id: 'both' as const, name: 'Maximum', desc: 'Military grade'}
                    ].map(({id, name, desc}: {id: string, name: string, desc: string}) => {
                      const isActive = phantomOptions.stealthLevel === id;
                      return (
                        <button
                          key={id}
                          onClick={() => setPhantomOptions({ ...phantomOptions, stealthLevel: id as any })}
                          className={`relative group overflow-hidden ${isActive 
                            ? 'bg-gradient-to-br from-purple-500/80 to-indigo-600/80 text-white shadow-lg shadow-purple-400/30 border border-purple-300/50' 
                            : 'bg-slate-800/70 hover:bg-slate-700/80 text-slate-300 border border-slate-600/50 hover:border-purple-400/30'} 
                            rounded-xl py-3 px-2 text-center font-medium transition-all duration-300 hover:shadow-lg transform hover:-translate-y-0.5`}
                        >
                          {isActive && (
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-60 animate-pulse"></div>
                          )}
                          
                          <div className="relative z-10">
                            <div className="text-sm font-semibold">{name}</div>
                            <div className="text-xs opacity-80 mt-1">{desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* NEW: Enhanced Evasion Configuration Panel */}
              <div className="mt-6">
                <EvasionConfigPanel
                  config={evasionConfig}
                  onChange={setEvasionConfig}
                  disabled={isGenerating}
                />
              </div>
            </div>
          )}

          {/* AI Analysis Display */}
          {(isAnalyzing || urlAnalysis || patternRecommendations.length > 0) && (
            <div className="mb-6 animate-in slide-in-from-top-4 duration-500">
              <div className="bg-gradient-to-br from-purple-900/20 via-indigo-900/30 to-blue-900/20 backdrop-blur-md rounded-2xl border border-purple-400/30 p-5 relative overflow-hidden">
                {/* AI Analysis Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/25 border border-purple-400/20">
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <Target className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">AI Analysis</h3>
                    <p className="text-sm text-purple-200">
                      {isAnalyzing ? 'Analyzing URL and optimizing patterns...' : 'Smart recommendations ready'}
                    </p>
                  </div>
                </div>

                {/* URL Analysis Results */}
                {urlAnalysis && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600/30">
                      <h4 className="text-sm font-medium text-cyan-200 mb-2 flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        Domain Analysis
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-300">Industry:</span>
                          <span className="text-cyan-300 capitalize">{urlAnalysis.industry}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-300">Security Level:</span>
                          <span className="text-green-300">{urlAnalysis.security_level}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600/30">
                      <h4 className="text-sm font-medium text-cyan-200 mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Risk Factors
                      </h4>
                      <div className="space-y-1">
                        {urlAnalysis.risk_factors.length > 0 ? (
                          urlAnalysis.risk_factors.map((risk: string, index: number) => (
                            <div key={index} className="text-xs text-amber-300 bg-amber-500/10 rounded px-2 py-1">
                              {risk.replace('_', ' ')}
                            </div>
                          ))
                        ) : (
                          <div className="text-xs text-green-300">No significant risks detected</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pattern Recommendations */}
                {patternRecommendations.length > 0 && (
                  <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-600/30">
                    <h4 className="text-sm font-medium text-cyan-200 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Recommendations ({patternRecommendations.length})
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {patternRecommendations.slice(0, 3).map((rec: any, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3 border border-slate-600/20"
                        >
                          <div>
                            <div className="text-sm font-medium text-white">{rec.patternName}</div>
                            <div className="text-xs text-slate-400">{rec.recommendationReason}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-300">{Math.round(rec.performanceScore)}%</div>
                            <div className="text-xs text-slate-400">success rate</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}


              </div>
            </div>
          )}

          {/* Enhanced Generate Button */}
          <div className="relative max-w-lg mx-auto w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/40 to-purple-600/40 rounded-2xl opacity-50 blur-lg animate-pulse"></div>
            
            <Button 
              onClick={handleGenerateRedirect} 
              disabled={!inputUrl.trim() || isGenerating}
              className="w-full h-16 text-lg font-jetbrains font-semibold bg-gradient-to-r from-cyan-500/90 via-blue-600/90 to-purple-700/90 hover:from-cyan-600 hover:via-blue-700 hover:to-purple-800 rounded-2xl shadow-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-cyan-300/40 border border-cyan-400/40 relative overflow-hidden group z-10"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="animate-pulse font-jetbrains font-bold tracking-wide">
                    {selectedPatternData ? `Applying ${selectedPatternData.name}...` : 'Generating PHANTOM URL...'}
                  </span>
                </div>
              ) : (
                <>
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/10 via-white/0 to-transparent transform translate-x-[-120%] group-hover:translate-x-[120%] transition-all duration-1500 ease-out"></span>
                  
                  <div className="flex items-center justify-center gap-4 relative z-10">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-300/80 to-purple-400/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-all duration-300">
                      <Sparkles className="w-5 h-5 text-white group-hover:scale-110 transition-all duration-300" />
                    </div>
                    <span className="font-jetbrains font-bold tracking-wide group-hover:tracking-wider transition-all duration-300">
                      {selectedPatternData ? `Generate with ${selectedPatternData.name}` : 'Generate PHANTOM URL'}
                    </span>
                  </div>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Results Section - Ultra Premium Design - Mobile Optimized */}
      {showResult && (
        <div className="bg-gradient-to-br from-emerald-50 via-white to-green-50 backdrop-blur-md rounded-3xl shadow-2xl border border-emerald-200/30 p-4 sm:p-8 transition-all duration-500 animate-in fade-in-50 slide-in-from-bottom-5 overflow-hidden relative">
          {/* Abstract decorative elements - Hidden on mobile for performance */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-300/10 to-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 hidden sm:block"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-br from-blue-300/10 to-green-400/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 hidden sm:block"></div>
          
          <div className="space-y-8 relative z-10">
            {/* Premium Success Header with Advanced Animation - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative group">
                  {/* Pulsing background effect - Simplified on mobile */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 opacity-50 group-hover:opacity-70 blur-sm animate-pulse-slow hidden sm:block"></div>
                  
                  <div className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-md sm:shadow-lg shadow-green-300/30 relative z-10 border-2 border-white">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine bg-repeat-x bg-[length:30%_100%] hidden sm:block"></div>
                    <Check className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow-md" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-600 tracking-tight leading-tight">
                    {selectedPatternData ? `${selectedPatternData.name} Applied` : 'PHANTOM Link Generated'}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-green-600 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> 
                    {selectedPatternData ? `${selectedPatternData.success_rate}% Success Rate` : 'Invisibility Engaged'}
                  </p>
                </div>
              </div>
              {urlResult && (
                <div className="flex flex-wrap gap-2">
                  {selectedPatternData && (
                    <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs sm:text-sm font-medium">
                      <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {selectedPatternData.category}
                    </div>
                  )}
                  <div className="inline-flex items-center px-2 sm:px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs sm:text-sm font-medium">
                    <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Protocol: PHANTOM
                  </div>
                </div>
              )}
            </div>

            {/* Generation Metadata Display */}
            {generationMetadata && (
              <GenerationMetadata
                timestamp={generationMetadata.timestamp}
                rotationCounter={generationMetadata.rotationCounter}
                encryptionMode={generationMetadata.encryptionMode}
                patternName={generationMetadata.patternName}
                encryptedPreview={generationMetadata.encryptedPreview}
                varietySeed={generationMetadata.varietySeed}
                securityLevel={generationMetadata.securityLevel}
              />
            )}

            {/* URL and Copy Button - Ultra Premium Design - Mobile Optimized */}
            <div className="relative group/url transition-all duration-300">
              {/* Subtle glow effect for input - Hidden on small screens for better performance */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-emerald-200/40 to-green-300/40 rounded-2xl opacity-50 blur-sm group-hover/url:opacity-70 transition-all duration-500 hidden sm:block"></div>
              
              <div className="relative bg-white rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg shadow-green-100/50 border border-emerald-100 flex items-center">
                <div className="pl-3 sm:pl-4 py-2 sm:py-3 flex items-center justify-center">
                  <div className="relative">
                    <LinkIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 drop-shadow-sm" />
                    {/* Subtle ripple animation - Hidden on small screens for better performance */}
                    <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/20 hidden sm:block"></span>
                  </div>
                </div>
                
                <div className="relative flex-1 flex items-center">
                  <Input 
                    readOnly 
                    value={generatedRedirectUrl} 
                    className="h-10 sm:h-14 text-sm sm:text-base border-0 focus:ring-0 bg-transparent font-medium text-emerald-800 flex-1 pl-2 sm:pl-3 pr-1 sm:pr-2 w-full truncate"
                    style={{ minWidth: "0", boxShadow: "none" }}
                  />
                </div>
                
                <div className="pr-2 sm:pr-3">
                  <Button
                    onClick={handleCopyUrl}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 sm:h-10 sm:w-10 hover:bg-emerald-100 rounded-lg sm:rounded-xl text-emerald-600 hover:text-emerald-800 transition-all duration-300 relative overflow-hidden group/copy"
                  >
                    {/* Copy button hover animation - Simplified for mobile */}
                    <span className="absolute inset-0 bg-gradient-to-r from-emerald-100/0 to-emerald-100/80 opacity-0 group-hover/copy:opacity-100 transition-opacity duration-300 hidden sm:block"></span>
                    
                    <div className="relative z-10">
                      {copied ? (
                        <Check className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 animate-in zoom-in-75 duration-300" />
                      ) : (
                        <Copy className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                  </Button>
                </div>
              </div>
              
              {/* Copy hint for users */}
              <div className="text-center mt-2">
                <p className="text-xs text-emerald-600/80 flex items-center justify-center gap-1">
                  <Copy className="w-3 h-3" />
                  <span>Click copy button above to save your campaign URL</span>
                </p>
              </div>
            </div>
            
            {/* Test Redirect Button - Premium Design - Mobile Optimized */}
            <div className="relative group/test">
              {/* Button glow effect - Hidden on small screens for better performance */}
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-300/30 to-green-300/30 rounded-xl opacity-40 blur-sm group-hover/test:opacity-70 group-hover/test:blur transition-all duration-500 hidden sm:block"></div>
              
              <Button
                onClick={handleTestRedirect}
                variant="outline"
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 hover:border-emerald-300 text-emerald-700 hover:text-emerald-800 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base tracking-wide transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 sm:gap-3 relative overflow-hidden group/button z-10"
              >
                {/* Hover animation for the button - Hidden on small screens for better performance */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-100/50 to-transparent opacity-0 group-hover/button:opacity-100 transform -translate-x-full group-hover/button:translate-x-full transition-all duration-1000 ease-out hidden sm:block"></div>
                
                <div className="flex items-center justify-center gap-2 sm:gap-3 relative z-10">
                  <div className="bg-emerald-100 rounded-full p-1 sm:p-1.5">
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                  </div>
                  <span>Launch URL</span>
                  <div className="bg-emerald-100 rounded-full p-1 sm:p-1.5 animate-pulse-slow">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700" />
                  </div>
                </div>
              </Button>
            </div>

            {/* Generate New Variation Button */}
            <div className="relative group/variation">
              <Button
                onClick={() => handleGenerateRedirect()}
                variant="outline"
                disabled={isGenerating}
                className="w-full h-12 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 hover:border-blue-300 text-blue-700 hover:text-blue-800 rounded-xl font-semibold text-sm tracking-wide transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-3 relative overflow-hidden group/button z-10"
              >
                <div className="flex items-center justify-center gap-3 relative z-10">
                  <div className="bg-blue-100 rounded-full p-1.5">
                    <RotateCcw className="w-4 h-4 text-blue-700" />
                  </div>
                  <span>Generate New Variation</span>
                  {lastGenerated > 0 && (
                    <div className="text-xs bg-blue-100 px-2 py-1 rounded-full">
                      #{patternRotationCounter + 1}
                    </div>
                  )}
                </div>
              </Button>
            </div>

            {/* Enterprise Security Features - Premium Design - Mobile Optimized */}
            <div className="relative group/security">
              {/* Subtle glow effect - Hidden on small screens for better performance */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-100/50 to-emerald-100/50 rounded-xl opacity-50 blur-md group-hover/security:opacity-70 transition-all duration-500 hidden sm:block"></div>
              
              <div className="bg-gradient-to-br from-white via-white to-emerald-50/30 backdrop-blur-md rounded-xl p-3 sm:p-5 border border-emerald-100 shadow-md sm:shadow-lg shadow-emerald-100/10 relative z-10 overflow-hidden">
                {/* Decorative security patterns in background - Hidden on small screens */}
                <div className="absolute inset-0 opacity-5 hidden sm:block">
                  <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_16px_16px,#e0e0e0_2px,transparent_0)] bg-[size:24px_24px]"></div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 mb-3 sm:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative group">
                      {/* Animated shield icon with pulsing effect - Simplified on mobile */}
                      <div className="absolute inset-0 rounded-full bg-purple-400 opacity-20 group-hover:opacity-40 blur-sm animate-pulse-slow hidden sm:block"></div>
                      <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center shadow-sm sm:shadow-md shadow-purple-200/50 relative z-10 border border-white/80">
                        <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white drop-shadow-sm" />
                      </div>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-700">PHANTOM Protocol Active</h4>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-full px-2.5 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold text-purple-700 flex items-center gap-1 sm:gap-1.5 shadow-sm border border-purple-200/50">
                    <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-600" /> Stealth Mode Engaged
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Enhanced security features with hover effects - Optimized for mobile */}
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-white to-purple-50/50 hover:from-white hover:to-purple-100/50 border border-purple-100/50 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-md group/item">
                    <div className="rounded-full bg-purple-100 p-1.5 sm:p-2 group-hover/item:bg-purple-200 transition-colors duration-300">
                      <EyeOff className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium text-slate-800">Ghost Protocol</div>
                      <div className="text-[10px] sm:text-xs text-slate-600">Makes your links invisible to trackers and scanners</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-white to-indigo-50/50 hover:from-white hover:to-indigo-100/50 border border-indigo-100/50 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-md group/item">
                    <div className="rounded-full bg-indigo-100 p-1.5 sm:p-2 group-hover/item:bg-indigo-200 transition-colors duration-300">
                      <Cpu className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium text-slate-800">Neural Firewall</div>
                      <div className="text-[10px] sm:text-xs text-slate-600">AI-powered shields that adapt to new threats</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-white to-blue-50/50 hover:from-white hover:to-blue-100/50 border border-blue-100/50 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-md group/item">
                    <div className="rounded-full bg-blue-100 p-1.5 sm:p-2 group-hover/item:bg-blue-200 transition-colors duration-300">
                      <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium text-slate-800">Threat Radar</div>
                      <div className="text-[10px] sm:text-xs text-slate-600">Scans for bots and malicious activity in real-time</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg bg-gradient-to-r from-white to-teal-50/50 hover:from-white hover:to-teal-100/50 border border-teal-100/50 transition-all duration-300 transform hover:translate-y-[-2px] hover:shadow-md group/item">
                    <div className="rounded-full bg-teal-100 p-1.5 sm:p-2 group-hover/item:bg-teal-200 transition-colors duration-300">
                      <Atom className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-teal-600" />
                    </div>
                    <div>
                      <div className="text-sm sm:text-base font-medium text-slate-800">Quantum Shield</div>
                      <div className="text-[10px] sm:text-xs text-slate-600">Deflects attacks using multi-dimensional encryption</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: Real-time URL Validation Results */}
            <div className="mt-8">
              <ValidationResultsPanel
                result={validationResult}
                isLoading={isValidating}
                url={generatedRedirectUrl}
              />
            </div>
          </div>
        </div>
      )}

      {/* Quick Info - Enhanced with more visual appeal */}
      <div className="text-center space-y-3">
        {/* Security information moved to Index.tsx footer */}
      </div>
    </div>
  );
};

export default PhantomUrlGenerator;
