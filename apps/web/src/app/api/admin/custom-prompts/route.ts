/**
 * @fileMetadata
 * @purpose "Custom Prompts API endpoints for admin panel"
 * @dependencies ["@/lib","next"]
 * @owner ai-team
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  AICustomPrompt,
  CreateCustomPromptRequest,
  AIOperationsResponse
} from '@/types/ai-operations'

// GET /api/admin/custom-prompts - Get all custom prompts with performance data
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const featureId = searchParams.get('feature_id')
    const includePerformance = searchParams.get('include_performance') === 'true'

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', success: false },
        { status: 403 }
      )
    }

    // Build query
    let query = supabase
      .from('ai_custom_prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (featureId) {
      query = query.eq('feature_id', featureId)
    }

    const { data: prompts, error: promptsError } = await query

    if (promptsError) {
      console.error('Error fetching custom prompts:', promptsError)
      return NextResponse.json(
        { error: 'Failed to fetch custom prompts', success: false },
        { status: 500 }
      )
    }

    const response: Record<string, unknown> = { prompts }

    if (includePerformance && prompts?.length > 0) {
      // Get performance data for each prompt
      const promptIds = prompts.map(prompt => prompt.id)

      const { data: performance, error: perfError } = await supabase
        .from('ai_prompt_performance')
        .select('*')
        .in('prompt_id', promptIds)

      if (!perfError && performance) {
        // Aggregate performance by prompt
        const performanceMap: Record<string, Record<string, number>> = {}

        prompts.forEach(prompt => {
          performanceMap[prompt.id] = {
            total_uses: 0,
            avg_time: 0,
            success_rate: 0,
            user_rating: 0,
            total_cost: 0
          }
        })

        performance.forEach(perf => {
          const metrics = performanceMap[perf.prompt_id]
          if (!metrics) return

          metrics.total_uses++
          metrics.avg_time += perf.response_time
          metrics.total_cost += perf.cost || 0

          if (perf.success) {
            metrics.success_rate++
          }

          if (perf.user_rating) {
            metrics.user_rating += perf.user_rating
          }
        })

        // Calculate averages
        Object.values(performanceMap).forEach((metrics: Record<string, number>) => {
          if (metrics.total_uses > 0) {
            metrics.avg_time = Math.round(metrics.avg_time / metrics.total_uses) / 1000 // Convert to seconds
            metrics.success_rate = Math.round((metrics.success_rate / metrics.total_uses) * 100)
            metrics.user_rating = Math.round((metrics.user_rating / metrics.total_uses) * 10) / 10
          }
        })

        response.performance = performanceMap
      }
    }

    return NextResponse.json({
      data: response,
      success: true
    })

  } catch (error) {
    console.error('Custom Prompts GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

// POST /api/admin/custom-prompts - Create new custom prompt
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: CreateCustomPromptRequest = await request.json()

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required', success: false },
        { status: 403 }
      )
    }

    // Validate input
    if (!body.feature_id || !body.name || !body.system_prompt) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      )
    }

    if (body.system_prompt.length < 10) {
      return NextResponse.json(
        { error: 'System prompt must be at least 10 characters', success: false },
        { status: 400 }
      )
    }

    // Check if prompt name already exists for this feature
    const { data: existingPrompt } = await supabase
      .from('ai_custom_prompts')
      .select('id')
      .eq('feature_id', body.feature_id)
      .eq('name', body.name)
      .single()

    if (existingPrompt) {
      return NextResponse.json(
        { error: 'A prompt with this name already exists for this feature', success: false },
        { status: 409 }
      )
    }

    // Create new custom prompt
    const { data: newPrompt, error: createError } = await supabase
      .from('ai_custom_prompts')
      .insert({
        feature_id: body.feature_id,
        name: body.name,
        system_prompt: body.system_prompt,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating custom prompt:', createError)
      return NextResponse.json(
        { error: 'Failed to create custom prompt', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: newPrompt,
      success: true
    })

  } catch (error) {
    console.error('Custom Prompts POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}
