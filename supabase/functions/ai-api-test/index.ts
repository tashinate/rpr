import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: 'OpenAI API key not configured in Supabase secrets',
          configured: false
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Test both models endpoint and direct GPT-4 access
    const [modelsResponse, chatResponse] = await Promise.allSettled([
      fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
      }),
      fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 5
        })
      })
    ])

    let models = { data: [] }
    let hasGPT4 = false
    let modelsCount = 0

    // Check models response
    if (modelsResponse.status === 'fulfilled' && modelsResponse.value.ok) {
      models = await modelsResponse.value.json()
      modelsCount = models.data?.length || 0
      hasGPT4 = models.data?.some((model: any) => 
        model.id.includes('gpt-4') || model.id.includes('gpt-4o')
      ) || false
    }

    // Check if chat API works (more important than models endpoint)
    if (chatResponse.status === 'rejected' || !chatResponse.value.ok) {
      const errorText = chatResponse.status === 'fulfilled' 
        ? await chatResponse.value.text() 
        : 'Failed to test chat API'
      return new Response(
        JSON.stringify({ 
          status: 'error',
          message: 'OpenAI API key is invalid or expired',
          configured: true,
          valid: false,
          details: errorText
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        message: 'OpenAI API is properly configured and working',
        configured: true,
        valid: true,
        hasGPT4,
        modelsCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('API test error:', error)
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: 'Failed to test OpenAI API',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})