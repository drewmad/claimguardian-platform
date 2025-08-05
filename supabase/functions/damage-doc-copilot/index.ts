/**
 * @fileMetadata
 * @purpose Damage Documentation Copilot Edge Function - Server-side AI guidance processing
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
  imageUrl: string
  sessionProgress: {
    current: number
    total: number
    completedAngles: string[]
  }
  previousImages: number
}

interface GuidanceResult {
  nextStep: string
  done: boolean
  quality: number
  completedAngle?: string
  completionMessage?: string
  suggestions: string[]
}

const DOCUMENTATION_GUIDANCE = {
  overview: {
    instruction: 'Capture a wide shot showing the entire damage area and surrounding context.',
    qualityChecks: ['good lighting', 'entire damage visible', 'stable framing']
  },
  close_up: {
    instruction: 'Take a detailed close-up photo of the specific damage. Get close enough to see material details.',
    qualityChecks: ['damage clearly visible', 'material texture visible', 'focused shot']
  },
  context: {
    instruction: 'Show how the damage relates to the surrounding area. Step back to include more context.',
    qualityChecks: ['damage and surroundings visible', 'scale evident', 'good perspective']
  },
  surrounding_area: {
    instruction: 'Photograph undamaged areas nearby for comparison. This helps establish the extent of damage.',
    qualityChecks: ['undamaged areas clear', 'good contrast with damage', 'comparative perspective']
  },
  supporting_evidence: {
    instruction: 'Capture any serial numbers, measurements, or reference objects that help document the damage.',
    qualityChecks: ['text/numbers readable', 'reference objects visible', 'measurement clear']
  }
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

    const { imageUrl, sessionProgress, previousImages }: RequestBody = await req.json()

    if (!imageUrl || !sessionProgress) {
      throw new Error('Missing required fields: imageUrl and sessionProgress')
    }

    // Determine what type of photo this should be based on progress
    const allAngles = ['overview', 'close_up', 'context', 'surrounding_area', 'supporting_evidence']
    const nextRequiredAngle = allAngles.find(angle => 
      !sessionProgress.completedAngles.includes(angle)
    )

    // Simulate AI analysis (in production, this would call actual computer vision service)
    const analysisResult = await analyzeImage(imageUrl, nextRequiredAngle, sessionProgress)

    // Store the analysis result
    const { error: insertError } = await supabase
      .from('damage_copilot_sessions')
      .insert({
        image_path: imageUrl,
        analysis_result: analysisResult,
        session_progress: sessionProgress,
        quality_score: analysisResult.quality,
        status: analysisResult.done ? 'completed' : 'in_progress'
      })

    if (insertError) {
      console.error('Database insert error:', insertError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...analysisResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Error in damage-doc-copilot function:', error)
    
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

async function analyzeImage(
  imageUrl: string, 
  expectedAngle: string | undefined, 
  progress: any
): Promise<GuidanceResult> {
  // Simulate AI image analysis
  // In production, this would use actual computer vision APIs
  
  const isComplete = progress.current >= progress.total - 1
  const quality = Math.floor(Math.random() * 30) + 70 // 70-100 quality score
  
  if (isComplete) {
    return {
      nextStep: '✅ Documentation complete! All required angles captured with good quality.',
      done: true,
      quality,
      completionMessage: 'Excellent work! Your damage documentation is thorough and well-captured.',
      suggestions: [
        'Review all images for clarity',
        'Consider additional detail shots if needed',
        'Submit documentation to your insurance claim'
      ]
    }
  }

  if (!expectedAngle) {
    return {
      nextStep: 'Continue capturing additional angles of the damage area.',
      done: false,
      quality,
      suggestions: ['Ensure good lighting', 'Keep camera steady']
    }
  }

  const guidance = DOCUMENTATION_GUIDANCE[expectedAngle as keyof typeof DOCUMENTATION_GUIDANCE]
  
  return {
    nextStep: guidance.instruction,
    done: false,
    quality,
    completedAngle: expectedAngle,
    suggestions: [
      ...guidance.qualityChecks,
      'Ensure image is well-lit and in focus'
    ]
  }
}

// Helper function to determine image quality based on various factors
function calculateImageQuality(imageAnalysis: any): number {
  // This would use actual computer vision metrics in production
  // For now, return a simulated quality score
  let score = 70
  
  // Simulate quality checks
  if (imageAnalysis.lighting === 'good') score += 10
  if (imageAnalysis.focus === 'sharp') score += 10
  if (imageAnalysis.framing === 'appropriate') score += 10
  
  return Math.min(100, score)
}