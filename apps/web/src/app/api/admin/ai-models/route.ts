/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { NextRequest, NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

import { createClient } from '@/lib/supabase/server'

interface FeatureModelMapping {
  featureId: string
  featureName: string
  currentModel: string
  fallbackModel: string
  category: 'analysis' | 'generation' | 'vision' | 'reasoning'
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('ai_model_configs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // Return default configuration if none exists
    const defaultConfig = {
      featureMappings: [
        {
          featureId: 'claim-assistant',
          featureName: 'Claim Assistant',
          currentModel: 'gpt-4-turbo',
          fallbackModel: 'gemini-1.5-pro',
          category: 'reasoning'
        },
        {
          featureId: 'damage-analyzer',
          featureName: 'Damage Analyzer',
          currentModel: 'gpt-4-vision',
          fallbackModel: 'gemini-1.5-pro',
          category: 'vision'
        },
        {
          featureId: 'policy-chat',
          featureName: 'Policy Chat',
          currentModel: 'gpt-4-turbo',
          fallbackModel: 'claude-3-sonnet',
          category: 'reasoning'
        },
        {
          featureId: 'settlement-analyzer',
          featureName: 'Settlement Analyzer',
          currentModel: 'claude-3-opus',
          fallbackModel: 'gpt-4-turbo',
          category: 'analysis'
        },
        {
          featureId: 'communication-helper',
          featureName: 'Communication Helper',
          currentModel: 'claude-3-sonnet',
          fallbackModel: 'gpt-4-turbo',
          category: 'generation'
        },
        {
          featureId: 'document-generator',
          featureName: 'Document Generator',
          currentModel: 'gpt-4-turbo',
          fallbackModel: 'claude-3-sonnet',
          category: 'generation'
        },
        {
          featureId: 'evidence-organizer',
          featureName: 'Evidence Organizer',
          currentModel: 'gpt-4-vision',
          fallbackModel: 'gemini-1.5-pro',
          category: 'vision'
        },
        {
          featureId: 'inventory-scanner',
          featureName: 'Inventory Scanner',
          currentModel: 'gemini-1.5-pro',
          fallbackModel: 'gpt-4-vision',
          category: 'vision'
        }
      ]
    }

    return NextResponse.json(data?.config || defaultConfig)
  } catch (error) {
    logger.error('Failed to fetch AI model configuration:', error)
    return NextResponse.json(
      { error: 'Failed to fetch configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { featureMappings } = body

    if (!featureMappings || !Array.isArray(featureMappings)) {
      return NextResponse.json(
        { error: 'Invalid feature mappings' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Get current user (admin check could be added here)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Save configuration
    const { error } = await supabase
      .from('ai_model_configs')
      .insert({
        config: { featureMappings },
        updated_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    if (error) {
      throw error
    }

    logger.info('AI model configuration updated', { 
      userId: user.id,
      featuresConfigured: featureMappings.length 
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Failed to save AI model configuration:', error)
    return NextResponse.json(
      { error: 'Failed to save configuration' },
      { status: 500 }
    )
  }
}

// Get model performance stats
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // This would typically query a model_usage_stats table
    // For now, return mock data
    const stats = {
      totalRequests: 15420,
      totalCost: 234.50,
      avgResponseTime: 1.2,
      successRate: 98.5,
      modelBreakdown: {
        'gpt-4-turbo': { requests: 6543, cost: 123.45, avgTime: 1.5 },
        'gemini-1.5-pro': { requests: 4321, cost: 67.89, avgTime: 0.9 },
        'claude-3-opus': { requests: 2876, cost: 31.23, avgTime: 1.8 },
        'claude-3-sonnet': { requests: 1680, cost: 11.93, avgTime: 1.1 }
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    logger.error('Failed to fetch model performance stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}