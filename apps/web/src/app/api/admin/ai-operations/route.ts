/**
 * @fileMetadata
 * @purpose AI Operations API endpoints for admin panel
 * @owner ai-team  
 * @status active
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { 
  AIModelConfig, 
  UpdateModelConfigRequest,
  FeaturePerformanceMetrics,
  AIOperationsResponse 
} from '@/types/ai-operations'

// GET /api/admin/ai-operations - Get all AI configurations and metrics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'configs', 'metrics', 'all'

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

    let response: any = {}

    if (type === 'configs' || type === 'all' || !type) {
      // Get model configurations
      const { data: configs, error: configsError } = await supabase
        .from('ai_model_configs')
        .select('*')
        .order('created_at', { ascending: false })

      if (configsError) {
        console.error('Error fetching AI model configs:', configsError)
        return NextResponse.json(
          { error: 'Failed to fetch configurations', success: false },
          { status: 500 }
        )
      }

      response.configs = configs
    }

    if (type === 'metrics' || type === 'all') {
      // Get performance metrics per feature
      const { data: usageData, error: usageError } = await supabase
        .from('ai_usage_tracking')
        .select(`
          feature_id,
          model,
          success,
          response_time,
          cost,
          created_at
        `)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()) // Last 7 days

      if (usageError) {
        console.error('Error fetching usage data:', usageError)
        response.metrics = []
      } else {
        // Aggregate metrics by feature
        const featureMetrics: Record<string, FeaturePerformanceMetrics> = {}
        
        usageData?.forEach((usage) => {
          if (!featureMetrics[usage.feature_id]) {
            featureMetrics[usage.feature_id] = {
              feature_id: usage.feature_id,
              feature_name: usage.feature_id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
              current_model: usage.model,
              total_requests: 0,
              avg_response_time: 0,
              success_rate: 0,
              total_cost: 0,
              avg_user_rating: 0,
              quality_score: 0
            }
          }

          const metrics = featureMetrics[usage.feature_id]
          metrics.total_requests++
          metrics.avg_response_time += usage.response_time
          metrics.total_cost += usage.cost || 0
          
          if (usage.success) {
            metrics.success_rate++
          }
        })

        // Calculate averages
        Object.values(featureMetrics).forEach((metrics) => {
          if (metrics.total_requests > 0) {
            metrics.avg_response_time = Math.round(metrics.avg_response_time / metrics.total_requests)
            metrics.success_rate = Math.round((metrics.success_rate / metrics.total_requests) * 100)
          }
        })

        response.metrics = Object.values(featureMetrics)
      }
    }

    return NextResponse.json({
      data: response,
      success: true
    })

  } catch (error) {
    console.error('AI Operations API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

// POST /api/admin/ai-operations - Create or update model configuration
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { feature_mappings } = body

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

    if (!feature_mappings || !Array.isArray(feature_mappings)) {
      return NextResponse.json(
        { error: 'Invalid feature mappings data', success: false },
        { status: 400 }
      )
    }

    // Upsert model configurations
    const configsToUpsert = feature_mappings.map((mapping: any) => ({
      feature_id: mapping.featureId,
      feature_name: mapping.featureName,
      current_model: mapping.currentModel,
      fallback_model: mapping.fallbackModel,
      category: mapping.category,
      created_by: user.id,
      updated_at: new Date().toISOString()
    }))

    const { error: upsertError } = await supabase
      .from('ai_model_configs')
      .upsert(configsToUpsert, {
        onConflict: 'feature_id',
        ignoreDuplicates: false
      })

    if (upsertError) {
      console.error('Error upserting model configurations:', upsertError)
      return NextResponse.json(
        { error: 'Failed to save configurations', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { message: 'Configurations saved successfully' },
      success: true
    })

  } catch (error) {
    console.error('AI Operations POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}