import "jsr:@supabase/functions-js/edge-runtime.d.ts"

/**
 * Setup Production Metrics Tables and Functions
 * Creates the necessary database schema for Claude Learning System production monitoring
 */

Deno.serve(async (req: Request) => {
  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create production metrics table
    const { error: tableError } = await supabase.rpc('create_production_metrics_schema', {})

    if (tableError && !tableError.message.includes('already exists')) {
      throw tableError
    }

    // Create indexes for performance
    const { error: indexError } = await supabase.rpc('create_production_metrics_indexes', {})

    if (indexError && !indexError.message.includes('already exists')) {
      console.warn('Index creation warning:', indexError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Production metrics schema created successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('Setup error:', error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
