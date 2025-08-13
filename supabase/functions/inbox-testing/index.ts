import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TestRequest {
  pattern_ids?: string[]
  email_providers?: string[]
  test_type?: 'pattern_validation' | 'performance_check' | 'competitive_analysis'
  batch_name?: string
}

interface EmailTestResult {
  pattern_id: string
  test_email: string
  email_provider: string
  delivery_status: 'delivered' | 'spam' | 'blocked' | 'bounced'
  delivery_time?: number
  spam_score?: number
  filter_reason?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (req.method === 'POST') {
      const { pattern_ids, email_providers, test_type, batch_name }: TestRequest = await req.json()

      // Create test batch
      const { data: batch, error: batchError } = await supabase
        .from('inbox_test_batches')
        .insert({
          batch_name: batch_name || `Test Batch ${new Date().toISOString()}`,
          test_type: test_type || 'pattern_validation',
          patterns_tested: pattern_ids?.length || 0,
          test_status: 'running'
        })
        .select()
        .single()

      if (batchError) throw batchError

      // Get seed email accounts
      const { data: seedAccounts, error: seedError } = await supabase
        .from('seed_email_accounts')
        .select('*')
        .eq('account_status', 'active')
        .in('email_provider', email_providers || ['gmail', 'outlook', 'yahoo'])

      if (seedError) throw seedError

      // Get patterns to test
      const { data: patterns, error: patternsError } = await supabase
        .from('url_patterns')
        .select('*')
        .eq('is_active', true)
        .in('id', pattern_ids || [])

      if (patternsError) throw patternsError

      const testResults: EmailTestResult[] = []

      // Simulate inbox testing for each pattern-provider combination
      for (const pattern of patterns) {
        for (const account of seedAccounts) {
          // Simulate email sending and delivery checking
          const deliveryResult = await simulateEmailTest(pattern, account)
          
          // Record the test result
          const { error: resultError } = await supabase
            .rpc('record_inbox_test_result', {
              pattern_id_input: pattern.id,
              test_email_input: account.email_address,
              email_provider_input: account.email_provider,
              delivery_status_input: deliveryResult.delivery_status,
              delivery_time_input: deliveryResult.delivery_time ? `${deliveryResult.delivery_time} seconds` : null,
              spam_score_input: deliveryResult.spam_score,
              filter_reason_input: deliveryResult.filter_reason,
              test_batch_id_input: batch.id
            })

          if (resultError) {
            console.error('Error recording test result:', resultError)
          }

          testResults.push(deliveryResult)
        }
      }

      // Update batch completion
      const { error: updateError } = await supabase
        .from('inbox_test_batches')
        .update({
          test_status: 'completed',
          completed_at: new Date().toISOString(),
          total_emails_sent: testResults.length,
          avg_delivery_rate: calculateDeliveryRate(testResults)
        })
        .eq('id', batch.id)

      if (updateError) throw updateError

      return new Response(
        JSON.stringify({
          success: true,
          batch_id: batch.id,
          total_tests: testResults.length,
          delivery_rate: calculateDeliveryRate(testResults),
          results: testResults
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method === 'GET') {
      // Get performance metrics
      const { data: metrics, error } = await supabase
        .rpc('get_top_performing_patterns', { limit_input: 20 })

      if (error) throw error

      return new Response(
        JSON.stringify({ success: true, metrics }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Inbox testing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Simulate email testing with realistic delivery patterns
async function simulateEmailTest(pattern: any, account: any): Promise<EmailTestResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500))

  // Calculate delivery probability based on pattern characteristics
  let deliveryProbability = 0.85 // Base rate

  // Adjust based on pattern tier
  if (pattern.tier === 1) deliveryProbability += 0.1
  if (pattern.tier === 2) deliveryProbability += 0.05
  if (pattern.tier === 3) deliveryProbability -= 0.05

  // Adjust based on email provider
  if (account.email_provider === 'gmail') deliveryProbability -= 0.1 // Gmail is stricter
  if (account.email_provider === 'yahoo') deliveryProbability += 0.05 // Yahoo is more lenient

  // Adjust based on pattern category
  const businessCategories = ['business', 'ecommerce', 'banking']
  if (businessCategories.includes(pattern.category)) {
    deliveryProbability += 0.05 // Business patterns perform better
  }

  const random = Math.random()
  let delivery_status: 'delivered' | 'spam' | 'blocked' | 'bounced'
  let spam_score: number | undefined
  let filter_reason: string | undefined

  if (random < deliveryProbability) {
    delivery_status = 'delivered'
    spam_score = Math.random() * 3 // Low spam score for delivered emails
  } else if (random < deliveryProbability + 0.08) {
    delivery_status = 'spam'
    spam_score = Math.random() * 4 + 6 // High spam score
    filter_reason = selectRandomFilterReason()
  } else if (random < deliveryProbability + 0.12) {
    delivery_status = 'blocked'
    filter_reason = 'URL reputation filter'
  } else {
    delivery_status = 'bounced'
    filter_reason = 'Invalid recipient'
  }

  return {
    pattern_id: pattern.id,
    test_email: account.email_address,
    email_provider: account.email_provider,
    delivery_status,
    delivery_time: Math.random() * 30 + 5, // 5-35 seconds
    spam_score,
    filter_reason
  }
}

function selectRandomFilterReason(): string {
  const reasons = [
    'Content-based filter',
    'URL reputation',
    'Domain blacklist',
    'Suspicious attachment',
    'Bulk email filter',
    'Phishing detection',
    'Link analysis failed'
  ]
  return reasons[Math.floor(Math.random() * reasons.length)]
}

function calculateDeliveryRate(results: EmailTestResult[]): number {
  if (results.length === 0) return 0
  const delivered = results.filter(r => r.delivery_status === 'delivered').length
  return Math.round((delivered / results.length) * 100 * 100) / 100
}