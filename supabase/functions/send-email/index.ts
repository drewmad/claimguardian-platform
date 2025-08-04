import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') || 'noreply@claimguardianai.com'

interface EmailRequest {
  type: 'welcome' | 'property_enrichment' | 'claim_update' | 'verification'
  userId: string
  [key: string]: any
}

serve(async (req) => {
  try {
    const emailRequest = await req.json() as EmailRequest
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

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
          html: getWelcomeEmailHtml(name),
          text: getWelcomeEmailText(name)
        }
        break

      case 'property_enrichment':
        const { propertyAddress, enrichmentData } = emailRequest
        emailContent = {
          to: profile.email,
          from: RESEND_FROM_EMAIL,
          subject: `Property Analysis Complete - ${propertyAddress}`,
          html: getPropertyEnrichmentEmailHtml(name, propertyAddress, enrichmentData),
          text: getPropertyEnrichmentEmailText(name, propertyAddress, enrichmentData)
        }
        break

      default:
        throw new Error(`Unknown email type: ${emailRequest.type}`)
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailContent)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email')
    }

    // Log email sent
    await supabase.from('email_logs').insert({
      user_id: emailRequest.userId,
      email_type: emailRequest.type,
      recipient: profile.email,
      status: 'sent',
      resend_id: result.id
    })

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Email sending error:', error
}));
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Email template functions
function getWelcomeEmailHtml(name: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #1a1a1a; color: white; padding: 24px; text-align: center; }
    .content { padding: 32px 24px; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ClaimGuardian</h1>
    </div>
    <div class="content">
      <h2>Welcome to ClaimGuardian, ${name}!</h2>
      <p>Thank you for joining ClaimGuardian, your AI-powered insurance claim advocate.</p>
      <p>We're here to help you navigate the complex world of insurance claims with confidence.</p>
      <p style="margin-top: 24px;">
        <a href="https://app.claimguardianai.com/dashboard" class="button">Get Started</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

function getWelcomeEmailText(name: string): string {
  return `Welcome to ClaimGuardian, ${name}!

Thank you for joining ClaimGuardian, your AI-powered insurance claim advocate.

We're here to help you navigate the complex world of insurance claims with confidence.

Get started at: https://app.claimguardianai.com/dashboard`
}

function getPropertyEnrichmentEmailHtml(name: string, address: string, data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; }
    .header { background: #1a1a1a; color: white; padding: 24px; text-align: center; }
    .content { padding: 32px 24px; }
    .data-box { background: #f9fafb; padding: 20px; margin: 24px 0; border-radius: 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>ClaimGuardian</h1>
    </div>
    <div class="content">
      <h2>Property Analysis Complete</h2>
      <p>Hi ${name},</p>
      <p>We've completed the comprehensive analysis of your property at <strong>${address}</strong>.</p>
      <div class="data-box">
        <h3>Property Risk Assessment</h3>
        <p>Flood Zone: ${data.floodZone}<br>
        Elevation: ${data.elevation.toFixed(1)} meters above sea level<br>
        Hurricane Zone: ${data.hurricaneZone}<br>
        Fire Protection Class: ${data.protectionClass}/10</p>
      </div>
      <p>
        <a href="https://app.claimguardianai.com/dashboard/properties" class="button">View Full Report</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

function getPropertyEnrichmentEmailText(name: string, address: string, data: any): string {
  return `Property Analysis Complete

Hi ${name},

We've completed the comprehensive analysis of your property at ${address}.

Property Risk Assessment:
- Flood Zone: ${data.floodZone}
- Elevation: ${data.elevation.toFixed(1)} meters above sea level
- Hurricane Zone: ${data.hurricaneZone}
- Fire Protection Class: ${data.protectionClass}/10

View full report at: https://app.claimguardianai.com/dashboard/properties`
}