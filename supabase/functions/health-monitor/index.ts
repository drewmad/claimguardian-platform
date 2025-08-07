import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com'
]

// List of functions to monitor
const EDGE_FUNCTIONS = [
  'ai-document-extraction',
  'analyze-damage-with-policy',
  'extract-policy-data',
  'policy-chat',
  'send-email',
  'ocr-document',
  'property-ai-enrichment',
  'spatial-ai-api'
]

interface HealthCheckResult {
  timestamp: string
  edgeFunctions: {
    total: number
    healthy: number
    failed: string[]
  }
  database: {
    connected: boolean
    errorCount: number
  }
  apiKeys: {
    configured: string[]
  }
  overallHealth: 'healthy' | 'degraded' | 'critical'
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const result: HealthCheckResult = {
      timestamp: new Date().toISOString(),
      edgeFunctions: {
        total: EDGE_FUNCTIONS.length,
        healthy: 0,
        failed: []
      },
      database: {
        connected: false,
        errorCount: 0
      },
      apiKeys: {
        configured: []
      },
      overallHealth: 'healthy'
    }

    // 1. Check Edge Functions
    console.log('Checking Edge Functions...')
    for (const func of EDGE_FUNCTIONS) {
      try {
        const response = await fetch(
          `https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/${func}`,
          {
            method: 'OPTIONS',
            headers: {
              'Origin': 'https://claimguardianai.com'
            }
          }
        )

        if (response.status === 200 || response.status === 204) {
          result.edgeFunctions.healthy++
        } else {
          result.edgeFunctions.failed.push(func)
        }
      } catch (error) {
        result.edgeFunctions.failed.push(func)
      }
    }

    // 2. Check Database
    console.log('Checking database connection...')
    try {
      const { error } = await supabase
        .from('properties')
        .select('id')
        .limit(1)

      result.database.connected = !error

      // Count recent errors
      const { count } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .is('resolved_at', null)

      result.database.errorCount = count || 0
    } catch (error) {
      result.database.connected = false
    }

    // 3. Check API Keys
    console.log('Checking API keys...')
    const apiKeys = [
      'OPENAI_API_KEY',
      'GEMINI_API_KEY',
      'ANTHROPIC_API_KEY',
      'XAI_API_KEY',
      'RESEND_API_KEY'
    ]

    for (const key of apiKeys) {
      if (Deno.env.get(key)) {
        result.apiKeys.configured.push(key)
      }
    }

    // 4. Determine overall health
    const healthyFunctions = result.edgeFunctions.healthy / result.edgeFunctions.total
    if (healthyFunctions < 0.5 || !result.database.connected) {
      result.overallHealth = 'critical'
    } else if (healthyFunctions < 0.8 || result.database.errorCount > 100) {
      result.overallHealth = 'degraded'
    }

    // 5. Store monitoring result
    const { error: insertError } = await supabase
      .from('monitoring_logs')
      .insert({
        check_type: 'health_monitor',
        status: result.overallHealth,
        details: result,
        created_at: new Date().toISOString()
      })

    if (insertError) {
      console.error('Failed to store monitoring result:', insertError)
    }

    // 6. Send alerts if critical
    if (result.overallHealth === 'critical') {
      console.log('CRITICAL: System health is critical, sending alert...')

      // Try to send email alert if possible
      if (result.apiKeys.configured.includes('RESEND_API_KEY')) {
        try {
          await fetch('https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/send-email', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              type: 'system_alert',
              subject: 'CRITICAL: ClaimGuardian System Health Alert',
              body: `System health check failed at ${result.timestamp}. ${result.edgeFunctions.failed.length} functions are down.`
            })
          })
        } catch (error) {
          console.error('Failed to send alert email:', error)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        result
      }),
      { headers: corsHeaders }
    )

  } catch (error) {
    console.error('Health monitor error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 500,
        headers: corsHeaders
      }
    )
  }
})
