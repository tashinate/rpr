import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Settings, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TelegramConfig {
  bot_token: string;
  chat_id: string;
  notification_settings: any; // JSON type from database
}

export const TelegramStatus: React.FC = () => {
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTelegramConfig = async () => {
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        setTelegramConfig(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_user_telegram_config', {
        session_token_input: sessionToken
      });

      if (error) {
        console.error('Error fetching Telegram config:', error);
        setTelegramConfig(null);
      } else if (data && data.length > 0) {
        setTelegramConfig(data[0] as TelegramConfig);
      } else {
        setTelegramConfig(null);
      }
    } catch (error) {
      console.error('Error fetching Telegram config:', error);
      setTelegramConfig(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramConfig();
  }, []);

  const getStatusBadge = () => {
    if (!telegramConfig) {
      return (
        <Badge className="bg-gradient-to-r from-gray-500/30 to-slate-400/30 text-gray-200 border border-gray-400/40 font-jetbrains text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          NOT CONFIGURED
        </Badge>
      );
    }

    const { humanVisits, botDetections } = telegramConfig.notification_settings;
    
    if (humanVisits && botDetections) {
      return (
        <Badge className="bg-gradient-to-r from-emerald-500/30 to-green-400/30 text-emerald-200 border border-emerald-400/40 font-jetbrains text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          FULLY ACTIVE
        </Badge>
      );
    } else if (humanVisits || botDetections) {
      return (
        <Badge className="bg-gradient-to-r from-yellow-500/30 to-orange-400/30 text-yellow-200 border border-yellow-400/40 font-jetbrains text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          PARTIAL
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-gradient-to-r from-red-500/30 to-pink-400/30 text-red-200 border border-red-400/40 font-jetbrains text-xs">
          <XCircle className="w-3 h-3 mr-1" />
          DISABLED
        </Badge>
      );
    }
  };

  const getNotificationStatus = () => {
    if (!telegramConfig) {
      return {
        human: false,
        bot: false,
        description: 'No Telegram integration configured'
      };
    }

    const { humanVisits, botDetections } = telegramConfig.notification_settings;
    
    return {
      human: humanVisits,
      bot: botDetections,
      description: `Notifications: ${humanVisits ? 'Human ✓' : 'Human ✗'} ${botDetections ? 'Bot ✓' : 'Bot ✗'}`
    };
  };

  if (loading) {
    return (
      <Card className="relative bg-glass-tier-2 border border-blue-400/30 backdrop-blur-sm overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-cyan-500/5 to-blue-400/5 animate-gradient-flow"></div>
        
        <CardContent className="relative z-10 p-4">
          <div className="animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-6 h-6 bg-blue-400/30 rounded animate-pulse"></div>
              <div className="h-4 bg-blue-400/20 rounded w-1/3"></div>
            </div>
            <div className="h-3 bg-blue-400/20 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const notificationStatus = getNotificationStatus();

  return (
    <Card className="relative bg-glass-tier-2 border border-blue-400/30 backdrop-blur-sm overflow-hidden hover:scale-[1.02] transition-all duration-300">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-cyan-500/5 to-blue-400/5 animate-gradient-flow"></div>
      
      <CardContent className="relative z-10 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-400/20 to-cyan-500/20 rounded-lg border border-blue-400/30">
              <MessageCircle className="w-5 h-5 text-blue-300" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-jetbrains text-blue-300 text-sm font-bold uppercase tracking-wider">
                  TELEGRAM INTEGRATION
                </span>
                {getStatusBadge()}
              </div>
              <div className="text-blue-400 text-xs">
                {notificationStatus.description}
              </div>
            </div>
          </div>
          
          <Button
            size="sm"
            variant="outline"
            className="border-blue-400/40 hover:border-blue-300/60 bg-blue-900/30 hover:bg-blue-800/40 text-blue-200"
            onClick={() => navigate('/nexus')}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>

        {telegramConfig && (
          <div className="mt-4 pt-4 border-t border-blue-400/20">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${notificationStatus.human ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
                <span className="text-xs text-blue-300 font-jetbrains">
                  Human Visits: {notificationStatus.human ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${notificationStatus.bot ? 'bg-emerald-400' : 'bg-red-400'} animate-pulse`}></div>
                <span className="text-xs text-blue-300 font-jetbrains">
                  Bot Detection: {notificationStatus.bot ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-blue-400/70">
              Chat ID: {telegramConfig.chat_id.slice(0, 4)}•••••{telegramConfig.chat_id.slice(-4)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};