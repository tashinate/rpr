import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ContentGenerationRequest {
  context: {
    industry?: string
    contentType?: string
    targetAudience?: string
    purpose?: string
    length?: 'short' | 'medium' | 'long'
  }
}

interface ContentGenerationResponse {
  title: string
  content: string
  metadata: {
    contentType: string
    wordCount: number
    readingTime: string
  }
  seoOptimizations: {
    keywords: string[]
    metaDescription: string
  }
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

    // Check if AI content generation is enabled
    const { data: settingData } = await supabase
      .from('global_system_config')
      .select('config_value')
      .eq('config_key', 'ai_content_generation_enabled')
      .single()

    // Handle both boolean and object formats
    const configValue = settingData?.config_value
    const isEnabled = typeof configValue === 'boolean' ? configValue : 
                     (typeof configValue === 'object' && configValue?.enabled === true)
    
    if (!isEnabled) {
      return new Response(
        JSON.stringify({ error: 'AI content generation is disabled' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const { context }: ContentGenerationRequest = await req.json()

    if (!context) {
      return new Response(
        JSON.stringify({ error: 'context is required' }),
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

    // Create content generation prompt
    const prompt = `Generate realistic decoy content for stealth email delivery that appears legitimate and engaging.

Context:
- Industry: ${context.industry || 'general business'}
- Content Type: ${context.contentType || 'article'}
- Target Audience: ${context.targetAudience || 'professionals'}
- Purpose: ${context.purpose || 'informational'}
- Length: ${context.length || 'medium'}

Requirements:
1. Create compelling, realistic content that would naturally be shared via email
2. Content should appear professional and trustworthy
3. Include proper SEO elements
4. Avoid any suspicious or spam-like language
5. Make it relevant to the specified industry and audience

Respond in JSON format:
{
  "title": "Engaging, professional title",
  "content": "Full content body (HTML formatted)",
  "metadata": {
    "contentType": "article/blog/news/report",
    "wordCount": number,
    "readingTime": "X min read"
  },
  "seoOptimizations": {
    "keywords": ["relevant", "keywords"],
    "metaDescription": "SEO meta description"
  },
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
            content: 'You are an expert content creator specializing in professional, engaging content for email campaigns. Generate realistic, high-quality content that would naturally be shared in professional communications.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
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
    let generatedContent: ContentGenerationResponse
    try {
      generatedContent = JSON.parse(aiContent)
    } catch (e) {
      // Fallback content if JSON parsing fails
      generatedContent = {
        title: 'Professional Industry Update',
        content: '<p>Stay informed with the latest industry developments and insights that matter to your business.</p>',
        metadata: {
          contentType: 'article',
          wordCount: 50,
          readingTime: '1 min read'
        },
        seoOptimizations: {
          keywords: ['business', 'industry', 'professional'],
          metaDescription: 'Professional industry insights and updates for business professionals.'
        },
        confidence: 40
      }
    }

    // Update AI usage statistics
    await supabase.rpc('increment_ai_usage')

    return new Response(
      JSON.stringify(generatedContent),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('AI Content Generator error:', error)
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