import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Clock, Hash, Shield, Zap, RotateCcw, Cpu } from 'lucide-react';

interface GenerationMetadataProps {
  timestamp: number;
  rotationCounter: number;
  encryptionMode: 'aes' | 'xor' | 'hybrid';
  patternName?: string;
  encryptedPreview?: string;
  varietySeed?: number;
  securityLevel?: number;
}

const GenerationMetadata: React.FC<GenerationMetadataProps> = ({
  timestamp,
  rotationCounter,
  encryptionMode,
  patternName,
  encryptedPreview,
  varietySeed,
  securityLevel = 85
}) => {
  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit'
    }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
  };

  const getEncryptionColor = (mode: string) => {
    switch (mode) {
      case 'aes': return 'bg-emerald-500/10 text-emerald-700 border-emerald-200';
      case 'xor': return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'hybrid': return 'bg-purple-500/10 text-purple-700 border-purple-200';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  const truncateEncrypted = (encrypted: string) => {
    if (!encrypted || encrypted.length < 16) return encrypted;
    return `${encrypted.slice(0, 8)}...${encrypted.slice(-8)}`;
  };

  return (
    <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-semibold text-slate-700">Generation Metadata</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        {/* Timestamp */}
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-slate-500" />
          <div>
            <div className="text-slate-500">Generated</div>
            <div className="font-mono text-slate-700">{formatTimestamp(timestamp)}</div>
          </div>
        </div>

        {/* Rotation Counter */}
        <div className="flex items-center gap-2">
          <RotateCcw className="h-3 w-3 text-slate-500" />
          <div>
            <div className="text-slate-500">Rotation</div>
            <div className="font-mono text-slate-700">#{rotationCounter}</div>
          </div>
        </div>

        {/* Encryption Mode */}
        <div className="flex items-center gap-2">
          <Shield className="h-3 w-3 text-slate-500" />
          <div>
            <div className="text-slate-500">Encryption</div>
            <Badge 
              variant="outline" 
              className={`text-xs px-2 py-0.5 ${getEncryptionColor(encryptionMode)}`}
            >
              {encryptionMode.toUpperCase()}
            </Badge>
          </div>
        </div>

        {/* Pattern Name */}
        {patternName && (
          <div className="flex items-center gap-2">
            <Cpu className="h-3 w-3 text-slate-500" />
            <div>
              <div className="text-slate-500">Pattern</div>
              <div className="font-medium text-slate-700 truncate">{patternName}</div>
            </div>
          </div>
        )}

        {/* Encrypted Preview */}
        {encryptedPreview && (
          <div className="flex items-center gap-2">
            <Hash className="h-3 w-3 text-slate-500" />
            <div>
              <div className="text-slate-500">Encrypted</div>
              <div className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                {truncateEncrypted(encryptedPreview)}
              </div>
            </div>
          </div>
        )}

        {/* Variety Seed */}
        {varietySeed && (
          <div className="flex items-center gap-2">
            <Zap className="h-3 w-3 text-slate-500" />
            <div>
              <div className="text-slate-500">Variety</div>
              <div className="font-mono text-slate-700">{varietySeed % 10000}</div>
            </div>
          </div>
        )}
      </div>

      {/* Security Level Bar */}
      <div className="pt-2 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-slate-500">Security Level</span>
          <span className="text-slate-700 font-semibold">{securityLevel}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${securityLevel}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerationMetadata;