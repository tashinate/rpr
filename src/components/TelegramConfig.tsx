import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { telegramNotifier } from '@/utils/services/telegramNotifier';
import { useToast } from '@/hooks/use-toast';
import { Check, Send, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const TelegramConfig: React.FC = () => {
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    humanVisits: true,
    botDetections: true
  });
  const { toast } = useToast();
  
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        console.log('No session token found');
        return;
      }

      // Get config from database - no fallback
      const { data, error } = await supabase.rpc('get_user_telegram_config', {
        session_token_input: sessionToken
      });

      if (error) {
        console.error('Failed to load telegram config:', error);
        // Log error to database
        await supabase.rpc('log_system_error', {
          error_type_input: 'telegram_config',
          error_message_input: `Failed to load Telegram configuration: ${error.message}`,
          error_details_input: { error: error.message, code: error.code },
          user_session_token_input: sessionToken,
          severity_input: 'error'
        });
        toast({
          title: "Configuration Error",
          description: "Failed to load Telegram configuration from database",
          variant: "destructive"
        });
        return;
      }

      if (data && data.length > 0) {
        const config = data[0];
        setIsConfigured(true);
        
        // Set notification settings from database
        const dbSettings = config.notification_settings as { humanVisits: boolean; botDetections: boolean } || { humanVisits: true, botDetections: true };
        setNotificationSettings(dbSettings);
        
        // Sync with telegramNotifier (no localStorage backup)
        telegramNotifier.setConfig(config.bot_token, config.chat_id);
        telegramNotifier.setNotificationSettings(dbSettings);
        
        console.log('Loaded configuration from database');
      } else {
        // No config in database - user needs to set it up
        setIsConfigured(false);
        console.log('No Telegram configuration found in database');
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      const sessionToken = localStorage.getItem('license_session_token');
      if (sessionToken) {
        await supabase.rpc('log_system_error', {
          error_type_input: 'telegram_config',
          error_message_input: `Unexpected error loading Telegram configuration: ${error.message}`,
          error_details_input: { error: error.message },
          user_session_token_input: sessionToken,
          severity_input: 'error'
        });
      }
      toast({
        title: "Configuration Error",
        description: "Unexpected error loading Telegram configuration",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!botToken.trim() || !chatId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both bot token and chat ID",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (!sessionToken) {
        toast({
          title: "Session Error",
          description: "No active session found. Please login again.",
          variant: "destructive"
        });
        return;
      }

      // Save to database
      const { error } = await supabase.rpc('upsert_user_telegram_config', {
        session_token_input: sessionToken,
        bot_token_input: botToken.trim(),
        chat_id_input: chatId.trim(),
        notification_settings_input: notificationSettings
      });

      if (error) {
        console.error('Database save error:', error);
        // Log error to database
        await supabase.rpc('log_system_error', {
          error_type_input: 'telegram_config',
          error_message_input: `Failed to save Telegram configuration: ${error.message}`,
          error_details_input: { error: error.message, code: error.code },
          user_session_token_input: sessionToken,
          severity_input: 'error'
        });
        toast({
          title: "Configuration Save Failed",
          description: "Failed to save Telegram configuration to database",
          variant: "destructive"
        });
        return;
      }

      // Sync with telegramNotifier (no localStorage backup)
      telegramNotifier.setConfig(botToken.trim(), chatId.trim());
      telegramNotifier.setNotificationSettings(notificationSettings);
      
      setIsConfigured(true);
      setBotToken('');
      setChatId('');
      
      toast({
        title: "Success",
        description: "Telegram notifications configured successfully"
      });
    } catch (error) {
      console.error('Save error:', error);
      const sessionToken = localStorage.getItem('license_session_token');
      if (sessionToken) {
        await supabase.rpc('log_system_error', {
          error_type_input: 'telegram_config',
          error_message_input: `Unexpected error saving Telegram configuration: ${error.message}`,
          error_details_input: { error: error.message },
          user_session_token_input: sessionToken,
          severity_input: 'error'
        });
      }
      toast({
        title: "Configuration Save Failed",
        description: "Unexpected error saving Telegram configuration",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!isConfigured) {
      toast({
        title: "Not Configured",
        description: "Please configure Telegram first",
        variant: "destructive"
      });
      return;
    }

    setIsTestLoading(true);
    try {
      await telegramNotifier.sendNotification({
        ip: '127.0.0.1',
        userAgent: 'Test Browser - Manual Test',
        isBot: false
      });
      
      toast({
        title: "Test Sent",
        description: "Check your Telegram for the test message"
      });
    } catch (error) {
      console.error('Test notification error:', error);
      const sessionToken = localStorage.getItem('license_session_token');
      if (sessionToken) {
        await supabase.rpc('log_system_error', {
          error_type_input: 'telegram_send',
          error_message_input: `Test notification failed: ${error.message}`,
          error_details_input: { error: error.message },
          user_session_token_input: sessionToken,
          severity_input: 'error'
        });
      }
      toast({
        title: "Test Notification Failed",
        description: "Could not send test message - check admin panel for details",
        variant: "destructive"
      });
    } finally {
      setIsTestLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (sessionToken) {
        // Clear from database
        const { error } = await supabase.rpc('delete_user_telegram_config', {
          session_token_input: sessionToken
        });
        
        if (error) {
          console.error('Failed to clear database config:', error);
          // Log error to database
          await supabase.rpc('log_system_error', {
            error_type_input: 'telegram_config',
            error_message_input: `Failed to clear Telegram configuration: ${error.message}`,
            error_details_input: { error: error.message, code: error.code },
            user_session_token_input: sessionToken,
            severity_input: 'error'
          });
        }
      }
      
      // Clear local state (no localStorage cleanup needed)
      setBotToken('');
      setChatId('');
      setIsConfigured(false);
      telegramNotifier.clearConfig();
      
      toast({
        title: "Cleared",
        description: "Telegram configuration has been reset"
      });
    } catch (error) {
      console.error('Error clearing config:', error);
      const sessionToken = localStorage.getItem('license_session_token');
      if (sessionToken) {
        await supabase.rpc('log_system_error', {
          error_type_input: 'telegram_config',
          error_message_input: `Unexpected error clearing Telegram configuration: ${error.message}`,
          error_details_input: { error: error.message },
          user_session_token_input: sessionToken,
          severity_input: 'error'
        });
      }
      toast({
        title: "Clear Configuration Failed",
        description: "Unexpected error clearing Telegram configuration",
        variant: "destructive"
      });
    }
  };
  
  const updateNotificationSetting = async (type: string, value: boolean) => {
    const newSettings = {
      ...notificationSettings,
      [type]: value
    };
    setNotificationSettings(newSettings);
    
    try {
      const sessionToken = localStorage.getItem('license_session_token');
      if (sessionToken) {
        // Save to database
        const { error } = await supabase.rpc('update_user_notification_settings', {
          session_token_input: sessionToken,
          notification_settings_input: newSettings
        });
        
        if (error) {
          console.error('Failed to update notification settings in database:', error);
          // Log error to database
          await supabase.rpc('log_system_error', {
            error_type_input: 'telegram_config',
            error_message_input: `Failed to update notification settings: ${error.message}`,
            error_details_input: { error: error.message, code: error.code },
            user_session_token_input: sessionToken,
            severity_input: 'error'
          });
        }
      }
      
      // Sync with telegramNotifier (no localStorage backup)
      telegramNotifier.setNotificationSettings(newSettings);
      
      toast({
        title: `${value ? 'Enabled' : 'Disabled'}`,
        description: `${type === 'humanVisits' ? 'Human visit' : 'Bot detection'} notifications ${value ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      const sessionToken = localStorage.getItem('license_session_token');
      if (sessionToken) {
        await supabase.rpc('log_system_error', {
          error_type_input: 'telegram_config',
          error_message_input: `Unexpected error updating notification settings: ${error.message}`,
          error_details_input: { error: error.message },
          user_session_token_input: sessionToken,
          severity_input: 'error'
        });
      }
      toast({
        title: "Settings Update Failed",
        description: "Unexpected error updating notification settings",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {!isConfigured ? (
        /* Configuration Setup */
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 shadow-xl shadow-blue-500/10 touch-manipulation">
            <h3 className="font-jetbrains text-base sm:text-lg font-semibold text-blue-200 mb-4 sm:mb-6 tracking-wide">Bot Authentication</h3>
            
            <div className="space-y-4 sm:space-y-5">
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="botToken" className="font-inter text-sm font-medium text-blue-300 tracking-wide">
                  Bot Token
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
                  <Input
                    id="botToken"
                    type={showToken ? "text" : "password"}
                    placeholder="Enter your Telegram bot token"
                    value={botToken}
                    onChange={(e) => setBotToken(e.target.value)}
                    className="relative z-10 pr-12 bg-slate-800/60 backdrop-blur-sm border-blue-500/30 focus:border-blue-400/60 focus:ring-blue-400/30 text-blue-200 placeholder:text-blue-400/60 text-sm font-inter min-h-[44px] touch-manipulation"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 transition-all duration-200 backdrop-blur-sm min-h-[32px] touch-manipulation"
                    disabled={isLoading}
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="font-inter text-xs text-blue-300/60 leading-relaxed">
                  Obtain from @BotFather on Telegram
                </p>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="chatId" className="font-inter text-sm font-medium text-blue-300 tracking-wide">
                  Chat ID
                </Label>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg opacity-0 group-focus-within:opacity-100 transition duration-300 blur-sm"></div>
                  <Input
                    id="chatId"
                    type="text"
                    placeholder="Enter your Telegram chat ID"
                    value={chatId}
                    onChange={(e) => setChatId(e.target.value)}
                    className="relative z-10 bg-slate-800/60 backdrop-blur-sm border-blue-500/30 focus:border-blue-400/60 focus:ring-blue-400/30 text-blue-200 placeholder:text-blue-400/60 text-sm font-inter min-h-[44px] touch-manipulation"
                    disabled={isLoading}
                  />
                </div>
                <p className="font-inter text-xs text-blue-300/60 leading-relaxed">
                  Personal or group ID for notifications
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 sm:pt-8">
              <div className="relative group sm:order-1">
                <Button
                  variant="outline"
                  onClick={handleClear}
                  className="w-full sm:w-auto border-blue-500/30 text-blue-300 hover:text-blue-200 hover:bg-slate-700/60 bg-slate-800/50 backdrop-blur-sm font-inter font-medium min-h-[44px] px-4 sm:px-6 touch-manipulation transition-all duration-300"
                  disabled={isLoading}
                >
                  Reset
                </Button>
              </div>
              <div className="relative group sm:order-2">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg opacity-60 blur group-hover:opacity-90 transition duration-300"></div>
                <Button
                  onClick={handleSave}
                  className="relative z-10 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-inter font-semibold min-h-[44px] px-4 sm:px-6 touch-manipulation shadow-lg transition-all duration-300 backdrop-blur-sm"
                  disabled={isLoading || (!botToken.trim() || !chatId.trim())}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Configured State */
        <div className="space-y-4 sm:space-y-6">
          {/* Status */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-green-500/40 rounded-xl p-4 sm:p-6 shadow-xl shadow-green-500/10 touch-manipulation">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400/30 rounded-full blur-sm animate-pulse"></div>
                    <Check className="relative z-10 h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                  </div>
                  <h3 className="font-jetbrains text-base sm:text-lg font-semibold text-green-300 tracking-wide">Active Configuration</h3>
                </div>
                <p className="font-inter text-xs sm:text-sm text-green-400/80 leading-relaxed">
                  Telegram notifications are configured and operational
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  className="border-red-500/40 text-red-300 hover:text-red-200 hover:bg-red-500/20 bg-slate-800/50 backdrop-blur-sm font-inter font-medium min-h-[44px] px-4 touch-manipulation transition-all duration-300"
                >
                  Disconnect
                </Button>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg opacity-60 blur group-hover:opacity-90 transition duration-300"></div>
                  <Button
                    size="sm"
                    onClick={handleTest}
                    disabled={isTestLoading}
                    className="relative z-10 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white font-inter font-semibold min-h-[44px] px-4 touch-manipulation shadow-lg transition-all duration-300"
                  >
                    {isTestLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Testing...
                      </span>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Test
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="bg-slate-800/40 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 sm:p-6 shadow-xl shadow-blue-500/10 touch-manipulation">
            <h3 className="font-jetbrains text-base sm:text-lg font-semibold text-blue-200 mb-4 sm:mb-6 tracking-wide">Notification Preferences</h3>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Human Visits */}
              <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-700/40 backdrop-blur-sm rounded-lg border border-blue-500/20 gap-4 touch-manipulation transition-all duration-200 hover:bg-slate-700/60">
                <div className="flex-1 min-w-0">
                  <h4 className="font-inter font-medium text-blue-200 text-sm sm:text-base leading-tight">Human Visits</h4>
                  <p className="font-inter text-xs sm:text-sm text-blue-300/70 mt-0.5 sm:mt-1 leading-relaxed">Alert when real users access your links</p>
                </div>
                <button
                  onClick={() => updateNotificationSetting('humanVisits', !notificationSettings.humanVisits)}
                  className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-800 flex-shrink-0 min-h-[44px] min-w-[44px] touch-manipulation ${
                    notificationSettings.humanVisits 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  style={{ minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span
                    className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      notificationSettings.humanVisits ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              {/* Bot Detection */}
              <div className="flex items-start sm:items-center justify-between p-3 sm:p-4 bg-slate-700/40 backdrop-blur-sm rounded-lg border border-blue-500/20 gap-4 touch-manipulation transition-all duration-200 hover:bg-slate-700/60">
                <div className="flex-1 min-w-0">
                  <h4 className="font-inter font-medium text-blue-200 text-sm sm:text-base leading-tight">Bot Detection</h4>
                  <p className="font-inter text-xs sm:text-sm text-blue-300/70 mt-0.5 sm:mt-1 leading-relaxed">Alert when automated traffic is detected</p>
                </div>
                <button
                  onClick={() => updateNotificationSetting('botDetections', !notificationSettings.botDetections)}
                  className={`relative inline-flex h-6 w-11 sm:h-7 sm:w-13 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2 focus:ring-offset-slate-800 flex-shrink-0 min-h-[44px] min-w-[44px] touch-manipulation ${
                    notificationSettings.botDetections 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30' 
                      : 'bg-slate-600 hover:bg-slate-500'
                  }`}
                  style={{ minHeight: '44px', minWidth: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span
                    className={`inline-block h-4 w-4 sm:h-5 sm:w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                      notificationSettings.botDetections ? 'translate-x-6 sm:translate-x-7' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramConfig;
