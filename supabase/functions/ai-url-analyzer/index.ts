import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AIAnalysisRequest {
  targetUrl: string
  context?: {
    industry?: string
    region?: string
    tier?: string
  }
}

interface AIAnalysisResponse {
  industry: string
  category: string
  riskLevel: number
  recommendedPatterns: string[]
  optimizedPlaceholders: Record<string, string>
  reasoning: string
  confidence: number
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if AI features are enabled
    const { data: settingData } = await supabase
      .from('global_system_config')
      .select('config_value')
      .eq('config_key', 'ai_url_analysis_enabled')
      .single()

    // Handle both boolean and object formats
    const configValue = settingData?.config_value
    const isEnabled = typeof configValue === 'boolean' ? configValue : 
                     (typeof configValue === 'object' && configValue?.enabled === true)
    
    if (!isEnabled) {
      return new Response(
        JSON.stringify({ error: 'AI features are disabled' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { targetUrl, context }: AIAnalysisRequest = await req.json()

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ error: 'targetUrl is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Prepare AI prompt
    const prompt = `Analyze this URL for stealth email delivery optimization: ${targetUrl}

Context: ${JSON.stringify(context || {})}

Please provide:
1. Industry classification (technology, finance, healthcare, retail, etc.)
2. Content category (business, social, news, ecommerce, etc.) 
3. Risk level (0-100, where 100 is highest risk for detection)
4. Recommended pattern types (professional, casual, news, social, etc.)
5. Optimized placeholder values for domains, paths, and parameters
6. Reasoning for recommendations
7. Confidence level (0-100)

Respond in JSON format matching this structure:
{
  "industry": "string",
  "category": "string", 
  "riskLevel": number,
  "recommendedPatterns": ["string"],
  "optimizedPlaceholders": {
    "domain": "string",
    "subdomain": "string", 
    "path": "string",
    "params": "string"
  },
  "reasoning": "string",
  "confidence": number
}`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in email deliverability and URL optimization for stealth campaigns. Provide precise, actionable analysis.'
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const aiContent = openaiData.choices[0]?.message?.content

    if (!aiContent) {
      throw new Error('No response from OpenAI')
    }

    // Parse AI response
    let analysis: AIAnalysisResponse
    try {
      analysis = JSON.parse(aiContent)
    } catch (e) {
      // Fallback parsing if JSON is malformed
      analysis = {
        industry: 'general',
        category: 'business',
        riskLevel: 50,
        recommendedPatterns: ['professional'],
        optimizedPlaceholders: {
          domain: 'businessdocs',
          subdomain: 'secure',
          path: 'documents',
          params: 'ref=email'
        },
        reasoning: 'AI parsing failed, using safe defaults',
        confidence: 30
      }
    }

    // Update AI usage stats
    await supabase.rpc('increment_ai_usage')

    return new Response(
      JSON.stringify(analysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI URL Analyzer error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})