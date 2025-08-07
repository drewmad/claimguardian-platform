import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com',
  Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:3000' : null
].filter(Boolean)

interface EmailRequest {
  type: 'welcome' | 'property_enrichment' | 'claim_update' | 'verification'
  userId: string
  [key: string]: any
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin')

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  }

  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured')
    }

    const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@claimguardianai.com'

    const emailRequest = await req.json() as EmailRequest
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .eq('id', emailRequest.userId)
      .single()

    if (profileError || !profile) {
      throw new Error('User not found')
    }

    const name = profile.first_name || profile.email.split('@')[0]
    let emailContent: any = {}

    // Generate email content based on type
    switch (emailRequest.type) {
      case 'welcome':
        emailContent = {
          to: profile.email,
          from: RESEND_FROM_EMAIL,
          subject: 'Welcome to ClaimGuardian - Your AI Insurance Advocate',
          html: `<h1>Welcome ${name}!</h1><p>Thank you for joining ClaimGuardian.</p>`,
          text: `Welcome ${name}! Thank you for joining ClaimGuardian.`
        }
        break
      default:
        throw new Error(`Unknown email type: ${emailRequest.type}`)
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify(emailContent)
    })

    if (!response.ok) {
      throw new Error(`Failed to send email: ${response.statusText}`)
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Send email error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
