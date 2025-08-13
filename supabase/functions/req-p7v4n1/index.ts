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

// Stealth protection: Return 403 Forbidden for unverified requests
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
    const body = await req.json();
    
    // Handle different actions
    if (body.action === 'create_decision') {
      return await handleCreateDecision(body);
    }
    
    if (body.action === 'check_decision') {
      return await handleCheckDecision(body);
    }
    
    // Handle decision updates (Allow/Deny buttons)
    if (body.sessionToken && body.decision && body.decisionKey) {
      return await handleUpdateDecision(body);
    }
    
    // Default URL registry lookup
    const { url_hash_input } = body;
    
    if (!url_hash_input) {
      return stealthResponse();
    }

    // Call the database function securely
    const { data, error } = await supabase.rpc('get_license_from_url', {
      url_hash_input: url_hash_input
    });

    if (error || !data) {
      return stealthResponse();
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return stealthResponse();
  }
});

async function handleCreateDecision(body: any) {
  try {
    const { sessionToken, decisionKey, visitorData } = body;
    
    // Validate session
    const sessionValidation = await supabase.rpc('validate_session_with_license', {
      session_token_input: sessionToken
    });
    
    if (sessionValidation.error || !sessionValidation.data?.valid) {
      return stealthResponse();
    }
    
    // Insert decision record
    const { error } = await supabase.from('manual_decisions').insert({
      session_token: sessionToken,
      decision_key: decisionKey,
      decision: 'pending',
      visitor_data: visitorData,
      license_key_id: sessionValidation.data.license_id,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    });
    
    if (error) {
      return stealthResponse();
    }
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return stealthResponse();
  }
}

async function handleCheckDecision(body: any) {
  try {
    const { decisionKey } = body;
    
    if (!decisionKey) {
      return stealthResponse();
    }
    
    // Get decision status
    const { data, error } = await supabase
      .from('manual_decisions')
      .select('decision')
      .eq('decision_key', decisionKey)
      .single();
    
    if (error || !data) {
      return new Response(JSON.stringify({ decision: 'pending' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ decision: data.decision }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ decision: 'pending' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handleUpdateDecision(body: any) {
  try {
    const { sessionToken, decision, decisionKey } = body;
    
    if (!sessionToken || !decision || !decisionKey) {
      return stealthResponse();
    }
    
    // Validate session
    const sessionValidation = await supabase.rpc('validate_session_with_license', {
      session_token_input: sessionToken
    });
    
    if (sessionValidation.error || !sessionValidation.data?.valid) {
      return stealthResponse();
    }
    
    // Update the decision
    const { error } = await supabase
      .from('manual_decisions')
      .update({ 
        decision: decision,
        updated_at: new Date().toISOString()
      })
      .eq('decision_key', decisionKey)
      .eq('license_key_id', sessionValidation.data.license_id);
    
    if (error) {
      console.error('Error updating decision:', error);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Failed to update decision' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Log the decision
    await supabase.rpc('log_system_error_enhanced', {
      error_type_input: 'manual_decision',
      error_message_input: `Manual decision updated: ${decision}`,
      error_details_input: {
        decision,
        decision_key: decisionKey,
        timestamp: new Date().toISOString()
      },
      user_session_token_input: sessionToken,
      severity_input: 'info',
      skip_if_configuration: true
    });
    
    return new Response(JSON.stringify({ 
      success: true, 
      decision 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error in handleUpdateDecision:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Failed to update decision' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}