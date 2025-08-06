/**
 * API route for estimating AI request cost
 */
import { NextRequest, NextResponse } from 'next/server'
import { costTrackingService, TokenEstimator } from '@/services/cost-tracking'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { 
      toolName, 
      inputLength = 0, 
      outputLength = 300, 
      imageCount = 0,
      audioSeconds = 0 
    } = body

    if (!toolName) {
      return NextResponse.json(
        { error: 'Tool name is required' },
        { status: 400 }
      )
    }

    // Estimate tokens based on text length
    const inputTokens = TokenEstimator.estimateOpenAITokens('x'.repeat(inputLength))
    const outputTokens = TokenEstimator.estimateOpenAITokens('x'.repeat(outputLength))

    const estimatedCost = await costTrackingService.calculateEstimatedCost(
      toolName,
      inputTokens,
      outputTokens,
      imageCount,
      audioSeconds
    )
    
    return NextResponse.json({
      estimatedCost,
      breakdown: {
        inputTokens,
        outputTokens,
        imageCount,
        audioSeconds,
        toolName
      }
    })

  } catch (error) {
    console.error('Failed to estimate cost:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}