
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function securely queries the database to audit the permissions
// of the currently authenticated user (or the anon role if no user).
// It MUST be called with the user's JWT in the Authorization header.

Deno.serve(async (req) => {
  // This is needed if you're planning to invoke your function from a browser.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the calling user.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // The query provided in the prompt.
    const query = `
      SELECT 
        current_setting('request.jwt.claims', true)::jsonb->>'role' AS jwt_role,
        current_user                                       AS db_user,
        has_table_privilege(current_user,'auth.users','insert') AS can_insert_auth_users,
        pg_row_security_active('auth.users')               AS rls_active_auth_users,
        (SELECT polname FROM pg_policy
           WHERE polrelid = 'auth.users'::regclass
           AND polcmd = 'i'
           LIMIT 1)                                        AS insert_policy_auth_users;
    `

    // Execute the query.
    const { data, error } = await supabaseClient.rpc('execute_sql', { sql: query })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ data }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
