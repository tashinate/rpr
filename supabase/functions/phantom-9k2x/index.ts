import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface ManualDecisionRequest {
  sessionToken: string;
  decision: 'allow' | 'deny';
  visitorData: any;
  decisionKey?: string;
}

// Stealth protection
function stealthResponse(): Response {
  return new Response(null, { 
    status: 403,
    headers: corsHeaders 
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Basic stealth protection
  const userAgent = req.headers.get('user-agent') || '';
  if (/bot|crawl|spider|scanner/i.test(userAgent) || !userAgent) {
    return stealthResponse();
  }

  try {
    const { sessionToken, decision, visitorData, decisionKey }: ManualDecisionRequest = await req.json();
    
    // Validate session first (stealth protection)
    const sessionValidation = await supabase.rpc('validate_session_with_license', {
      session_token_input: sessionToken
    });
    
    if (sessionValidation.error || !sessionValidation.data?.valid) {
      return stealthResponse();
    }

    // Log the manual decision
    await supabase.rpc('log_system_error_enhanced', {
      error_type_input: 'manual_decision',
      error_message_input: `Manual bot decision: ${decision}`,
      error_details_input: {
        decision,
        visitor_data: visitorData,
        session_token: sessionToken
      },
      user_session_token_input: sessionToken,
      severity_input: 'info'
    });

    // Update decision record
    if (decisionKey) {
      await supabase.from('manual_decisions')
        .update({ decision: decision })
        .eq('decision_key', decisionKey)
        .eq('license_key_id', sessionValidation.data.license_id);
    }

    return new Response(JSON.stringify({ 
      success: true,
      decision,
      decisionKey: decisionKey || 'updated'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return stealthResponse();
  }
});