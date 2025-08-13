import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ThreatDetectionRequest {
  patterns: Array<{
    id: string
    template: string
    category: string
    usageStats?: any
    recentActivity?: any
  }>
}

interface ThreatDetectionResponse {
  overallRiskLevel: number
  threats: Array<{
    patternId: string
    threatType: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    description: string
    recommendations: string[]
    confidence: number
  }>
  systemRecommendations: string[]
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

    // Check if AI threat detection is enabled
    const { data: settingData } = await supabase
      .from('global_system_config')
      .select('config_value')
      .eq('config_key', 'ai_threat_detection_enabled')
      .single()

    // Handle both boolean and object formats
    const configValue = settingData?.config_value
    const isEnabled = typeof configValue === 'boolean' ? configValue : 
                     (typeof configValue === 'object' && configValue?.enabled === true)
    
    if (!isEnabled) {
      return new Response(
        JSON.stringify({ error: 'AI threat detection is disabled' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { patterns }: ThreatDetectionRequest = await req.json()

    if (!patterns || !Array.isArray(patterns)) {
      return new Response(
        JSON.stringify({ error: 'patterns array is required' }),
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

    // Create threat detection prompt
    const prompt = `Analyze these URL patterns for potential security threats and detection risks in stealth email campaigns.

Patterns to analyze:
${patterns.map(p => `
ID: ${p.id}
Template: ${p.template}
Category: ${p.category}
Usage Stats: ${JSON.stringify(p.usageStats || {})}
Recent Activity: ${JSON.stringify(p.recentActivity || {})}
`).join('\n')}

Please analyze for:
1. Pattern overuse detection risk
2. Suspicious URL structure patterns
3. Potential fingerprinting vulnerabilities
4. Category-based clustering risks
5. Timing pattern detection risks
6. Domain reputation threats
7. Anti-spam filter triggers

Provide specific threat assessments and actionable recommendations.

Respond in JSON format:
{
  "overallRiskLevel": number (0-100),
  "threats": [
    {
      "patternId": "pattern-id",
      "threatType": "overuse|fingerprinting|spam-trigger|clustering|etc",
      "severity": "low|medium|high|critical",
      "description": "Detailed threat description",
      "recommendations": ["specific actionable recommendations"],
      "confidence": number (0-100)
    }
  ],
  "systemRecommendations": ["overall system security recommendations"],
  "confidence": number (0-100)
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
            content: 'You are a cybersecurity expert specializing in email delivery security and threat detection. Analyze URL patterns for potential detection risks and security vulnerabilities with precision and provide actionable security recommendations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
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
    let threatAnalysis: ThreatDetectionResponse
    try {
      threatAnalysis = JSON.parse(aiContent)
    } catch (e) {
      // Fallback analysis if JSON parsing fails
      threatAnalysis = {
        overallRiskLevel: 30,
        threats: patterns.map(p => ({
          patternId: p.id,
          threatType: 'analysis-failed',
          severity: 'low' as const,
          description: 'AI threat analysis parsing failed, manual review recommended',
          recommendations: ['Manual security review recommended', 'Monitor pattern usage carefully'],
          confidence: 20
        })),
        systemRecommendations: [
          'Implement pattern rotation regularly',
          'Monitor usage patterns for clustering',
          'Review domain reputation regularly'
        ],
        confidence: 20
      }
    }

    // Log threat detections for monitoring
    if (threatAnalysis.threats.some(t => t.severity === 'high' || t.severity === 'critical')) {
      await supabase.rpc('log_system_error', {
        error_type_input: 'threat_detection',
        error_message_input: 'High-severity threats detected in patterns',
        error_details_input: { threatAnalysis },
        severity_input: 'warning'
      })
    }

    // Update AI usage statistics
    await supabase.rpc('increment_ai_usage')

    return new Response(
      JSON.stringify(threatAnalysis),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI Threat Detector error:', error)
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