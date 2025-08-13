import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ManualDecisionRequest {
  sessionToken: string;
  decision: 'allow' | 'deny';
  visitorData: {
    ip: string;
    userAgent: string;
    currentUrl: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { sessionToken, decision, visitorData }: ManualDecisionRequest = await req.json();

    // Log the manual decision
    await supabase.rpc('log_system_error_enhanced', {
      error_type_input: 'manual_decision',
      error_message_input: `Manual decision: ${decision} for visitor`,
      error_details_input: {
        decision,
        visitor_data: visitorData,
        timestamp: new Date().toISOString()
      },
      user_session_token_input: sessionToken,
      severity_input: 'info'
    });

    // Store decision in a temporary cache (you might want to use a proper cache/database)
    // For now, we'll use a simple in-memory approach with session storage
    const decisionKey = `manual_decision_${visitorData.ip}_${Date.now()}`;
    
    // You could also store this in Supabase for persistent decision tracking
    await supabase.from('manual_decisions').insert({
      session_token: sessionToken,
      visitor_ip: visitorData.ip,
      decision: decision,
      visitor_data: visitorData,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    }).catch(error => {
      // Table might not exist yet, continue anyway
      console.log('Manual decisions table not found, continuing...');
    });

    return new Response(JSON.stringify({ 
      success: true, 
      decision,
      decisionKey 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in manual-decision-handler:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});