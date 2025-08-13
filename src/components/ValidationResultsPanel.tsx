/**
 * Real-time URL Validation Results Panel
 * Shows validation results, risk analysis, and recommendations
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, AlertTriangle, Info, Shield, Target, Zap } from 'lucide-react';

export interface ValidationResult {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
  riskScore: number;
  detectedPatterns?: Array<{
    pattern: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  metadata?: {
    pattern: string;
    tier: number;
    contentType: string;
    expectedSuccessRate: string;
    encryptionMode: string;
    generationMethod: string;
    serviceName?: string;
    recognitionRate?: number;
    trustScore?: number;
    subdomain?: string;
  };
}

interface ValidationResultsPanelProps {
  result: ValidationResult | null;
  isLoading?: boolean;
  url?: string;
}

export const ValidationResultsPanel: React.FC<ValidationResultsPanelProps> = ({
  result,
  isLoading = false,
  url
}) => {
  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/90 rounded-2xl shadow-xl border border-cyan-400/40 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-6 w-6 text-cyan-400 animate-spin" />
          <h3 className="text-xl font-jetbrains font-bold text-cyan-100 uppercase tracking-wide">
            Validating URL...
          </h3>
        </div>
        <div className="space-y-3">
          <div className="animate-pulse">
            <div className="h-4 bg-cyan-500/30 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-cyan-500/20 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-gray-400" />
            URL Validation
          </CardTitle>
          <CardDescription>
            Generate a URL to see validation results and security analysis
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const getRiskColor = (score: number) => {
    if (score <= 25) return 'text-green-600 bg-green-100';
    if (score <= 50) return 'text-yellow-600 bg-yellow-100';
    if (score <= 75) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 25) return 'Low Risk';
    if (score <= 50) return 'Medium Risk';
    if (score <= 75) return 'High Risk';
    return 'Critical Risk';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-900/90 via-blue-900/30 to-purple-900/30 backdrop-blur-lg rounded-2xl shadow-2xl border border-cyan-400/40 p-6 transition-all duration-300 hover:shadow-cyan-300/20 hover:border-cyan-300/60 relative overflow-hidden">
      {/* Simplified background for performance */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-cyan-500/5"></div>
      </div>

      <div className="relative z-10">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            {result.isValid ? (
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            ) : (
              <XCircle className="h-6 w-6 text-red-400" />
            )}
            <h3 className="text-xl font-jetbrains font-bold text-cyan-100 uppercase tracking-wide">
              URL Validation Results
            </h3>
          </div>
          <p className="text-sm text-cyan-200/80 font-inter">
            Security analysis and recommendations for generated URL
          </p>
        </div>
        <div className="space-y-6">
        
        {/* Overall Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-medium">Overall Status</h3>
            <p className="text-sm text-gray-600">
              {result.isValid ? 'URL passed all validation checks' : `${result.issues.length} issues detected`}
            </p>
          </div>
          <Badge className={result.isValid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {result.isValid ? 'Valid' : 'Invalid'}
          </Badge>
        </div>

        {/* Risk Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Risk Assessment</h3>
            <Badge className={getRiskColor(result.riskScore)}>
              {getRiskLabel(result.riskScore)}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Risk Score</span>
              <span>{result.riskScore}/100</span>
            </div>
            <Progress value={result.riskScore} className="h-2" />
          </div>
        </div>

        {/* Detected Issues */}
        {result.issues.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-red-700">Issues Detected</h3>
            <div className="space-y-2">
              {result.issues.map((issue, index) => (
                <Alert key={index} className="border-red-200">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <AlertDescription className="text-red-700">
                    {issue}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Detected Patterns */}
        {result.detectedPatterns && result.detectedPatterns.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-orange-700">Suspicious Patterns</h3>
            <div className="space-y-2">
              {result.detectedPatterns.map((pattern, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {getSeverityIcon(pattern.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{pattern.pattern}</span>
                      <Badge variant="outline" className={`text-xs ${
                        pattern.severity === 'critical' ? 'border-red-500 text-red-700' :
                        pattern.severity === 'high' ? 'border-orange-500 text-orange-700' :
                        pattern.severity === 'medium' ? 'border-yellow-500 text-yellow-700' :
                        'border-blue-500 text-blue-700'
                      }`}>
                        {pattern.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{pattern.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {result.recommendations.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-blue-700">Recommendations</h3>
            <div className="space-y-2">
              {result.recommendations.map((recommendation, index) => (
                <Alert key={index} className="border-blue-200">
                  <Info className="h-4 w-4 text-blue-500" />
                  <AlertDescription className="text-blue-700">
                    {recommendation}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Metadata Display */}
        {result.metadata && (
          <div className="space-y-3">
            <h3 className="font-medium">Generation Details</h3>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <span className="text-sm text-gray-600">Pattern:</span>
                <p className="font-medium">{result.metadata.pattern}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Method:</span>
                <p className="font-medium">{result.metadata.generationMethod}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Encryption:</span>
                <p className="font-medium">{result.metadata.encryptionMode.toUpperCase()}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Success Rate:</span>
                <p className="font-medium">{result.metadata.expectedSuccessRate}%</p>
              </div>
              {result.metadata.serviceName && (
                <div>
                  <span className="text-sm text-gray-600">Service:</span>
                  <p className="font-medium">{result.metadata.serviceName}</p>
                </div>
              )}
              {result.metadata.recognitionRate && (
                <div>
                  <span className="text-sm text-gray-600">Recognition:</span>
                  <p className="font-medium">{result.metadata.recognitionRate}%</p>
                </div>
              )}
              {result.metadata.trustScore && (
                <div>
                  <span className="text-sm text-gray-600">Trust Score:</span>
                  <p className="font-medium">{result.metadata.trustScore}/100</p>
                </div>
              )}
              {result.metadata.subdomain && (
                <div>
                  <span className="text-sm text-gray-600">Subdomain:</span>
                  <p className="font-medium">{result.metadata.subdomain}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* URL Preview */}
        {url && (
          <div className="space-y-2">
            <h3 className="font-medium">Generated URL</h3>
            <div className="p-3 bg-gray-100 rounded-lg">
              <code className="text-sm break-all">{url}</code>
            </div>
          </div>
        )}

        {/* Security Score Summary */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-blue-800">Security Summary</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-lg text-blue-700">
                {result.metadata?.expectedSuccessRate || 'N/A'}%
              </div>
              <div className="text-blue-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-700">
                {100 - result.riskScore}%
              </div>
              <div className="text-blue-600">Safety Score</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-lg text-blue-700">
                {result.metadata?.tier || 'N/A'}
              </div>
              <div className="text-blue-600">Tier Level</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationResultsPanel;
