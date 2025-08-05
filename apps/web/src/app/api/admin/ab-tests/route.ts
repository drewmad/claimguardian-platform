/**
 * @fileMetadata
 * @purpose A/B Testing API endpoints for admin panel
 * @owner ai-team
 * @status active
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { 
  AIABTest, 
  CreateABTestRequest, 
  UpdateABTestRequest,
  ABTestMetrics,
  AIOperationsResponse 
} from '@/types/ai-operations'

// GET /api/admin/ab-tests - Get all A/B tests with metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const includeMetrics = searchParams.get('include_metrics') === 'true'

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

    // Get A/B tests
    const { data: tests, error: testsError } = await supabase
      .from('ai_ab_tests')
      .select('*')
      .order('created_at', { ascending: false })

    if (testsError) {
      console.error('Error fetching A/B tests:', testsError)
      return NextResponse.json(
        { error: 'Failed to fetch A/B tests', success: false },
        { status: 500 }
      )
    }

    let response: any = { tests }

    if (includeMetrics && tests?.length > 0) {
      // Get metrics for each test
      const testIds = tests.map(test => test.id)
      
      const { data: results, error: resultsError } = await supabase
        .from('ai_ab_test_results')
        .select('*')
        .in('test_id', testIds)

      if (!resultsError && results) {
        // Aggregate metrics by test and model
        const metricsMap: Record<string, ABTestMetrics> = {}

        tests.forEach(test => {
          metricsMap[test.id] = {
            test_id: test.id,
            model_a_metrics: { requests: 0, avg_time: 0, success_rate: 0, user_rating: 0 },
            model_b_metrics: { requests: 0, avg_time: 0, success_rate: 0, user_rating: 0 }
          }
        })

        results.forEach(result => {
          const metrics = metricsMap[result.test_id]
          if (!metrics) return

          const modelMetrics = result.model === 'model_a' 
            ? metrics.model_a_metrics 
            : metrics.model_b_metrics

          modelMetrics.requests++
          modelMetrics.avg_time += result.response_time
          
          if (result.success) {
            modelMetrics.success_rate++
          }
          
          if (result.user_rating) {
            modelMetrics.user_rating += result.user_rating
          }
        })

        // Calculate averages
        Object.values(metricsMap).forEach(metrics => {
          ['model_a_metrics', 'model_b_metrics'].forEach(key => {
            const m = metrics[key as keyof ABTestMetrics] as any
            if (m.requests > 0) {
              m.avg_time = Math.round(m.avg_time / m.requests) / 1000 // Convert to seconds
              m.success_rate = Math.round((m.success_rate / m.requests) * 100 * 10) / 10
              m.user_rating = Math.round((m.user_rating / m.requests) * 10) / 10
            }
          })
        })

        response.metrics = metricsMap
      }
    }

    return NextResponse.json({
      data: response,
      success: true
    })

  } catch (error) {
    console.error('A/B Tests GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

// POST /api/admin/ab-tests - Create new A/B test
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body: CreateABTestRequest = await request.json()

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
    if (!body.name || !body.feature_id || !body.model_a || !body.model_b) {
      return NextResponse.json(
        { error: 'Missing required fields', success: false },
        { status: 400 }
      )
    }

    if (body.traffic_split < 10 || body.traffic_split > 90) {
      return NextResponse.json(
        { error: 'Traffic split must be between 10 and 90', success: false },
        { status: 400 }
      )
    }

    // Check if there's already an active test for this feature
    const { data: existingTest } = await supabase
      .from('ai_ab_tests')
      .select('id')
      .eq('feature_id', body.feature_id)
      .eq('status', 'active')
      .single()

    if (existingTest) {
      return NextResponse.json(
        { error: 'An active A/B test already exists for this feature', success: false },
        { status: 409 }
      )
    }

    // Create new A/B test
    const { data: newTest, error: createError } = await supabase
      .from('ai_ab_tests')
      .insert({
        name: body.name,
        feature_id: body.feature_id,
        model_a: body.model_a,
        model_b: body.model_b,
        traffic_split: body.traffic_split,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating A/B test:', createError)
      return NextResponse.json(
        { error: 'Failed to create A/B test', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: newTest,
      success: true
    })

  } catch (error) {
    console.error('A/B Tests POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}