import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const startTime = Date.now()
    console.log('[AutoCleanup] Starting automated cleanup process...')

    // 1. Clean up expired URLs (deactivate instead of delete for audit trail)
    const expiredUrlsResult = await cleanupExpiredUrls(supabaseClient)
    
    // 2. Clean up old pattern usage stats (keep last 90 days)
    const patternStatsResult = await cleanupOldPatternStats(supabaseClient)
    
    // 3. Clean up old visit logs (keep last 30 days for performance)
    const visitLogsResult = await cleanupOldVisitLogs(supabaseClient)
    
    // 4. Clean up old audit logs (keep last 180 days for compliance)
    const auditLogsResult = await cleanupOldAuditLogs(supabaseClient)
    
    // 5. Clean up expired session tokens
    const sessionTokensResult = await cleanupExpiredSessions(supabaseClient)
    
    // 6. Clean up system error logs with different retention policies
    const systemErrorLogsResult = await cleanupSystemErrorLogs(supabaseClient)

    const totalTime = Date.now() - startTime
    
    const summaryResult = {
      success: true,
      cleanup_duration_ms: totalTime,
      timestamp: new Date().toISOString(),
      results: {
        expired_urls: expiredUrlsResult,
        pattern_stats: patternStatsResult,
        visit_logs: visitLogsResult,
        audit_logs: auditLogsResult,
        session_tokens: sessionTokensResult,
        system_error_logs: systemErrorLogsResult
      },
      total_records_processed: 
        expiredUrlsResult.processed + 
        patternStatsResult.processed + 
        visitLogsResult.processed + 
        auditLogsResult.processed + 
        sessionTokensResult.processed + 
        systemErrorLogsResult.processed
    }

    console.log('[AutoCleanup] Cleanup completed:', summaryResult)

    return new Response(
      JSON.stringify(summaryResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('[AutoCleanup] Error during cleanup:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// Clean up expired URLs by deactivating them
async function cleanupExpiredUrls(supabase: any) {
  try {
    console.log('[AutoCleanup] Cleaning up expired URLs...')
    
    const { data, error } = await supabase
      .from('url_registry')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('[AutoCleanup] Error cleaning expired URLs:', error)
      return { success: false, processed: 0, error: error.message }
    }

    const processedCount = data?.length || 0
    console.log(`[AutoCleanup] Deactivated ${processedCount} expired URLs`)

    return { success: true, processed: processedCount }
  } catch (error) {
    console.error('[AutoCleanup] Exception cleaning expired URLs:', error)
    return { success: false, processed: 0, error: error.message }
  }
}

// Clean up old pattern usage statistics (keep last 90 days)
async function cleanupOldPatternStats(supabase: any) {
  try {
    console.log('[AutoCleanup] Cleaning up old pattern statistics...')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 90) // Keep 90 days
    
    const { data, error } = await supabase
      .from('pattern_usage_stats')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .eq('is_active', false) // Only delete inactive patterns
      .select('id')

    if (error) {
      console.error('[AutoCleanup] Error cleaning pattern stats:', error)
      return { success: false, processed: 0, error: error.message }
    }

    const processedCount = data?.length || 0
    console.log(`[AutoCleanup] Deleted ${processedCount} old pattern statistics`)

    return { success: true, processed: processedCount }
  } catch (error) {
    console.error('[AutoCleanup] Exception cleaning pattern stats:', error)
    return { success: false, processed: 0, error: error.message }
  }
}

// Clean up old visit logs (keep last 30 days for performance)
async function cleanupOldVisitLogs(supabase: any) {
  try {
    console.log('[AutoCleanup] Cleaning up old visit logs...')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 30) // Keep 30 days
    
    // Delete in batches to avoid performance issues
    let totalProcessed = 0
    const batchSize = 1000
    
    while (true) {
      const { data, error } = await supabase
        .from('visit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .limit(batchSize)
        .select('id')

      if (error) {
        console.error('[AutoCleanup] Error cleaning visit logs:', error)
        return { success: false, processed: totalProcessed, error: error.message }
      }

      const batchCount = data?.length || 0
      totalProcessed += batchCount
      
      if (batchCount < batchSize) {
        break // No more records to delete
      }
      
      // Small delay between batches to reduce database load
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`[AutoCleanup] Deleted ${totalProcessed} old visit logs`)
    return { success: true, processed: totalProcessed }
  } catch (error) {
    console.error('[AutoCleanup] Exception cleaning visit logs:', error)
    return { success: false, processed: 0, error: error.message }
  }
}

// Clean up old audit logs (keep last 180 days for compliance)
async function cleanupOldAuditLogs(supabase: any) {
  try {
    console.log('[AutoCleanup] Cleaning up old audit logs...')
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - 180) // Keep 180 days for compliance
    
    // Check if audit log table exists first
    const { data: tableExists, error: tableError } = await supabase
      .from('url_audit_log')
      .select('id')
      .limit(1)

    if (tableError && tableError.code === '42P01') {
      // Table doesn't exist yet, skip cleanup
      console.log('[AutoCleanup] Audit log table does not exist yet, skipping...')
      return { success: true, processed: 0 }
    }

    // Delete in batches
    let totalProcessed = 0
    const batchSize = 500 // Smaller batches for audit logs
    
    while (true) {
      const { data, error } = await supabase
        .from('url_audit_log')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .limit(batchSize)
        .select('id')

      if (error) {
        console.error('[AutoCleanup] Error cleaning audit logs:', error)
        return { success: false, processed: totalProcessed, error: error.message }
      }

      const batchCount = data?.length || 0
      totalProcessed += batchCount
      
      if (batchCount < batchSize) {
        break // No more records to delete
      }
      
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    console.log(`[AutoCleanup] Deleted ${totalProcessed} old audit logs`)
    return { success: true, processed: totalProcessed }
  } catch (error) {
    console.error('[AutoCleanup] Exception cleaning audit logs:', error)
    return { success: false, processed: 0, error: error.message }
  }
}

// Clean up expired session tokens
async function cleanupExpiredSessions(supabase: any) {
  try {
    console.log('[AutoCleanup] Cleaning up expired session tokens...')
    
    const { data, error } = await supabase
      .from('admin_users')
      .update({ 
        session_token: null,
        session_expires_at: null,
        updated_at: new Date().toISOString()
      })
      .lt('session_expires_at', new Date().toISOString())
      .not('session_expires_at', 'is', null)
      .select('id')

    if (error) {
      console.error('[AutoCleanup] Error cleaning expired sessions:', error)
      return { success: false, processed: 0, error: error.message }
    }

    const processedCount = data?.length || 0
    console.log(`[AutoCleanup] Cleaned up ${processedCount} expired sessions`)

    return { success: true, processed: processedCount }
  } catch (error) {
    console.error('[AutoCleanup] Exception cleaning expired sessions:', error)
    return { success: false, processed: 0, error: error.message }
  }
}

// Clean up system error logs with intelligent retention policies
async function cleanupSystemErrorLogs(supabase: any) {
  try {
    console.log('[AutoCleanup] Cleaning up system error logs...')
    
    const { data, error } = await supabase.rpc('cleanup_system_error_logs')

    if (error) {
      console.error('[AutoCleanup] Error cleaning system error logs:', error)
      return { success: false, processed: 0, error: error.message }
    }

    console.log(`[AutoCleanup] System error logs cleanup result:`, data)
    
    return { 
      success: true, 
      processed: data?.total_deleted || 0,
      details: {
        telegram_errors: data?.telegram_errors_deleted || 0,
        critical_errors: data?.critical_errors_deleted || 0,
        regular_errors: data?.regular_errors_deleted || 0,
        warnings: data?.warnings_deleted || 0
      }
    }
  } catch (error) {
    console.error('[AutoCleanup] Exception cleaning system error logs:', error)
    return { success: false, processed: 0, error: error.message }
  }
}
