/**
 * @fileMetadata
 * @purpose AI Claim Swarm Edge Function - Server-side collaborative damage analysis
 * @owner ai-innovation-team
 * @dependencies ["@supabase/supabase-js"]
 * @exports ["handler"]
 * @complexity high
 * @status active
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  sessionId: string
  imageUrls: string[]
  timestamp: string
}

interface AnalysisResult {
  severity: 'minor' | 'moderate' | 'major' | 'severe'
  confidence: number
  keyFindings: string[]
  estimatedCost: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { sessionId, imageUrls, timestamp }: RequestBody = await req.json()

    if (!sessionId || !imageUrls || imageUrls.length === 0) {
      throw new Error('Missing required fields: sessionId and imageUrls')
    }

    // Analyze images using AI (simulated - would integrate with actual AI service)
    const analysisPrompt = `
You are an expert insurance damage assessor. Analyze the provided images and return a JSON object with:
{
  "severity": "minor|moderate|major|severe",
  "confidence": 0-1,
  "keyFindings": ["specific damage observation 1", "specific damage observation 2"],
  "estimatedCost": estimated_repair_cost_in_dollars
}

Images to analyze: ${imageUrls.length} damage photos
Focus on structural integrity, water damage, and repair urgency.
`

    // In a real implementation, this would call your AI service
    // For now, we'll create a mock analysis
    const mockAnalysis: AnalysisResult = {
      severity: 'moderate',
      confidence: 0.85,
      keyFindings: [
        'Visible water staining on ceiling',
        'Minor structural damage to roof area',
        'Potential mold risk if not addressed'
      ],
      estimatedCost: 2500
    }

    // Store the analysis in the database
    const { error: insertError } = await supabase
      .from('claim_swarms')
      .upsert({
        session_id: sessionId,
        interim_analysis: mockAnalysis,
        updated_at: timestamp
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
      throw insertError
    }

    // Broadcast the analysis to all connected clients
    const channel = supabase.channel('claim_swarm_updates')
    await channel.send({
      type: 'broadcast',
      event: 'analysis_complete',
      payload: {
        session_id: sessionId,
        analysis: JSON.stringify(mockAnalysis, null, 2),
        timestamp
      }
    })

    // Check if we should generate consensus (multiple analyses exist)
    const { data: existingAnalyses, error: queryError } = await supabase
      .from('claim_swarms')
      .select('interim_analysis')
      .eq('session_id', sessionId)
      .not('interim_analysis', 'is', null)

    if (queryError) {
      console.error('Query error:', queryError)
    }

    // If multiple analyses exist, generate consensus
    if (existingAnalyses && existingAnalyses.length > 1) {
      const consensus = {
        consensusSeverity: 'moderate',
        confidence: 0.9,
        keyFindings: mockAnalysis.keyFindings,
        recommendedActions: [
          'Schedule immediate roof inspection',
          'Document all water damage areas',
          'Contact insurance adjuster within 48 hours'
        ],
        estimatedCost: mockAnalysis.estimatedCost
      }

      // Update with consensus
      await supabase
        .from('claim_swarms')
        .update({ consensus_text: JSON.stringify(consensus, null, 2) })
        .eq('session_id', sessionId)

      // Broadcast consensus
      await channel.send({
        type: 'broadcast',
        event: 'consensus_ready',
        payload: {
          session_id: sessionId,
          consensus: JSON.stringify(consensus, null, 2),
          timestamp
        }
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: JSON.stringify(mockAnalysis, null, 2),
        confidence: mockAnalysis.confidence
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in claim-swarm function:', error)
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error) || 'Internal server error',
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})