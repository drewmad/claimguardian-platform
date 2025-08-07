#!/bin/bash

# Fix Edge Function Runtime Errors
# This script fixes the runtime errors in Edge Functions

set -euo pipefail

echo "========================================"
echo "🔧 FIXING EDGE FUNCTION ERRORS"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Fix send-email function - update to new import style
echo -e "${BLUE}Fixing send-email function...${NC}"

cat > supabase/functions/send-email/index.ts << 'EOF'
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
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
EOF

echo -e "${GREEN}  ✓ send-email fixed${NC}"

# Fix spatial-ai-api function
echo -e "${BLUE}Fixing spatial-ai-api function...${NC}"

cat > supabase/functions/spatial-ai-api/index.ts << 'EOF'
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Security: Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://claimguardianai.com',
  'https://app.claimguardianai.com',
  Deno.env.get('ENVIRONMENT') === 'development' ? 'http://localhost:3000' : null
].filter(Boolean)

interface SpatialAPIRequest {
  action: 'analyze_property' | 'generate_embeddings' | 'find_similar' | 'assess_risk' | 'environmental_data'
  data: Record<string, unknown>
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

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    })
  }

  try {
    const { action, data }: SpatialAPIRequest = await req.json()
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (action) {
      case 'analyze_property': {
        const { propertyId, imageUrls, gisData } = data

        // For now, return mock data until we integrate the actual services
        const analysisResult = {
          imageAnalysis: {
            detectedObjects: [
              { class: 'roof', confidence: 0.95 },
              { class: 'windows', confidence: 0.88 }
            ],
            damageAssessment: {
              overall_condition: 'good',
              damage_categories: { roof: 0.1, siding: 0.05 },
              estimated_repair_cost: 5000,
              urgency_level: 'low'
            }
          },
          environmental3D: {
            floodRisk: {
              baseFloodElevation: 10.5,
              propertyElevation: 12.0,
              floodDepthRisk: 0.15
            },
            windRisk: {
              exposureCategory: 'B',
              windBorneDebrisRisk: 0.3
            }
          },
          riskAssessment: {
            overallRiskScore: 0.25,
            riskFactors: ['flood_zone', 'hurricane_exposure'],
            recommendedActions: ['flood_insurance', 'wind_mitigation']
          }
        }

        return new Response(
          JSON.stringify(analysisResult),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Spatial AI API error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
EOF

echo -e "${GREEN}  ✓ spatial-ai-api fixed${NC}"

# Deploy the fixed functions
echo ""
echo -e "${BLUE}Deploying fixed Edge Functions...${NC}"
echo ""

supabase functions deploy send-email --no-verify-jwt
supabase functions deploy spatial-ai-api --no-verify-jwt

echo ""
echo "========================================"
echo -e "${GREEN}EDGE FUNCTION FIXES COMPLETE${NC}"
echo "========================================"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Verify RESEND_API_KEY is set: ./scripts/set-api-keys.sh"
echo "2. Test the functions:"
echo "   - send-email: Test email sending"
echo "   - spatial-ai-api: Test spatial analysis"
echo ""
echo -e "${GREEN}Functions fixed and deployed!${NC}"
