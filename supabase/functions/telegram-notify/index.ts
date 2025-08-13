import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VisitData {
  ip?: string;
  userAgent?: string;
  isBot?: boolean;
  confidence?: number;
  action?: string;
  behaviorScore?: number;
  localScore?: number;
  zerobotScore?: number;
  sessionToken?: string;
  locationData?: {
    country_name?: string;
    country_code?: string;
    isp?: string;
    hostname?: string;
    ip?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const visitData: VisitData = await req.json();
    
    if (!visitData.sessionToken) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Session token required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get user's Telegram configuration using the session token
    // Note: Bot tokens are automatically decrypted by the database function
    const { data: telegramConfig, error: configError } = await supabase
      .rpc('get_user_telegram_config', { 
        session_token_input: visitData.sessionToken 
      });
    
    if (configError || !telegramConfig || telegramConfig.length === 0) {
      console.error('No Telegram configuration found for user:', configError);
      // Log error to database
      await supabase.rpc('log_system_error', {
        error_type_input: 'telegram_config',
        error_message_input: `Telegram configuration not found for user: ${configError?.message || 'No config'}`,
        error_details_input: { error: configError?.message, code: configError?.code },
        user_session_token_input: visitData.sessionToken,
        severity_input: 'error'
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Telegram not configured for this user' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const { bot_token: botToken, chat_id: chatId, notification_settings } = telegramConfig[0];
    
    // Check notification settings
    if (visitData.isBot && !notification_settings?.botDetections) {
      // Log notification skip to database
      await supabase.rpc('log_system_error', {
        error_type_input: 'telegram_send',
        error_message_input: 'Bot detection notification skipped - disabled by user',
        error_details_input: { notification_settings, visitData },
        user_session_token_input: visitData.sessionToken,
        severity_input: 'info'
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Bot notifications disabled' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (!visitData.isBot && !notification_settings?.humanVisits) {
      // Log notification skip to database
      await supabase.rpc('log_system_error', {
        error_type_input: 'telegram_send',
        error_message_input: 'Human visit notification skipped - disabled by user',
        error_details_input: { notification_settings, visitData },
        user_session_token_input: visitData.sessionToken,
        severity_input: 'info'
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Human visit notifications disabled' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get country flag emoji
    const getCountryFlag = (countryCode: string): string => {
      if (!countryCode || countryCode.length !== 2) return '🌍';
      return String.fromCodePoint(
        ...countryCode.toUpperCase().split('').map(char => 0x1F1E6 + char.charCodeAt(0) - 65)
      );
    };

    // Get browser info from user agent
    const getBrowserInfo = (userAgent: string): string => {
      if (!userAgent) return 'Unknown Browser';
      
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
      if (userAgent.includes('Edg')) return 'Edge';
      if (userAgent.includes('Opera')) return 'Opera';
      
      return 'Unknown Browser';
    };

    // Format message based on bot detection
    let message: string;
    const flag = visitData.locationData?.country_code ? getCountryFlag(visitData.locationData.country_code) : '🌍';
    const browser = getBrowserInfo(visitData.userAgent || '');
    const timestamp = new Date().toLocaleString();

    if (visitData.isBot) {
      message = `🤖 *BOT DETECTED*\n\n` +
        `⚠️ *Confidence:* ${visitData.confidence}%\n` +
        `📍 *IP:* \`${visitData.ip}\`\n` +
        `${flag} *Location:* ${visitData.locationData?.country_name || 'Unknown'}\n` +
        `🏢 *ISP:* ${visitData.locationData?.isp || 'Unknown'}\n` +
        `🌐 *Browser:* ${browser}\n` +
        `🎯 *Action:* ${visitData.action}\n` +
        `📊 *Local Score:* ${visitData.localScore || 0}\n` +
        `🔍 *ZeroBot Score:* ${visitData.zerobotScore || 0}\n` +
        `⏰ *Time:* ${timestamp}`;
    } else {
      message = `👤 *Human Visitor*\n\n` +
        `📍 *IP:* \`${visitData.ip}\`\n` +
        `${flag} *Location:* ${visitData.locationData?.country_name || 'Unknown'}\n` +
        `🏢 *ISP:* ${visitData.locationData?.isp || 'Unknown'}\n` +
        `🌐 *Browser:* ${browser}\n` +
        `⏰ *Time:* ${timestamp}`;
    }

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
      }),
    });

    if (!telegramResponse.ok) {
      const errorText = await telegramResponse.text();
      console.error('Telegram API error:', errorText);
      // Log error to database
      await supabase.rpc('log_system_error', {
        error_type_input: 'telegram_send',
        error_message_input: `Telegram API error: ${errorText}`,
        error_details_input: { 
          error: errorText, 
          status: telegramResponse.status, 
          visitData,
          chatId: chatId 
        },
        user_session_token_input: visitData.sessionToken,
        severity_input: 'error'
      });
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to send Telegram notification' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in telegram-notify function:', error);
    // Log error to database
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    await supabase.rpc('log_system_error', {
      error_type_input: 'telegram_send',
      error_message_input: `Telegram notification function error: ${error.message}`,
      error_details_input: { error: error.message, stack: error.stack },
      user_session_token_input: null,
      severity_input: 'critical'
    });
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});