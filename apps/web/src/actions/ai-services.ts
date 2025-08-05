/**
 * @fileMetadata
 * @purpose "Server actions for AI prediction, analysis, and smart categorization services"
 * @dependencies ["@/lib","next"]
 * @owner ai-team
 * @status stable
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { PredictionEngine } from '@/lib/ai/prediction-engine'
import { SmartCategorizationEngine } from '@/lib/ai/smart-categorization'
import { WebhookManager, WebhookEventType } from '@/lib/webhooks/webhook-manager'
import { revalidatePath } from 'next/cache'

const predictionEngine = PredictionEngine.getInstance()
const categorizationEngine = SmartCategorizationEngine.getInstance()
const webhookManager = WebhookManager.getInstance()

/**
 * Generate claim likelihood prediction for a property
 */
export async function generateClaimPrediction(
  propertyId: string,
  contextData?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Verify property ownership
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propError || !property) {
      return { data: null, error: 'Property not found or access denied' }
    }

    // Generate prediction
    const prediction = await predictionEngine.predictClaimLikelihood(
      propertyId, 
      user.id, 
      contextData
    )

    revalidatePath('/dashboard/properties')
    return { data: prediction, error: null }
  } catch (error) {
    console.error('Failed to generate claim prediction:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to generate prediction' 
    }
  }
}

/**
 * Estimate damage repair costs using AI analysis
 */
export async function estimateDamageRepairCost(
  propertyId: string,
  damageType: string,
  severity: 'minor' | 'moderate' | 'major' | 'severe',
  additionalContext?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Verify property ownership
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propError || !property) {
      return { data: null, error: 'Property not found or access denied' }
    }

    // Generate cost estimation
    const estimation = await predictionEngine.estimateDamageCost(
      propertyId,
      damageType,
      severity,
      additionalContext
    )

    revalidatePath('/dashboard/properties')
    return { data: estimation, error: null }
  } catch (error) {
    console.error('Failed to estimate damage cost:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to estimate cost' 
    }
  }
}

/**
 * Generate AI-powered settlement recommendation
 */
export async function generateSettlementRecommendation(claimId: string) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Verify claim ownership
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .select('id')
      .eq('id', claimId)
      .eq('user_id', user.id)
      .single()

    if (claimError || !claim) {
      return { data: null, error: 'Claim not found or access denied' }
    }

    // Generate recommendation
    const recommendation = await predictionEngine.generateSettlementRecommendation(
      claimId,
      user.id
    )

    revalidatePath('/dashboard/claims')
    return { data: recommendation, error: null }
  } catch (error) {
    console.error('Failed to generate settlement recommendation:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to generate recommendation' 
    }
  }
}

/**
 * Predict maintenance needs for a property
 */
export async function predictMaintenanceNeeds(propertyId: string) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Verify property ownership
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .eq('user_id', user.id)
      .single()

    if (propError || !property) {
      return { data: null, error: 'Property not found or access denied' }
    }

    // Generate maintenance predictions
    const predictions = await predictionEngine.predictMaintenanceNeeds(
      propertyId,
      user.id
    )

    revalidatePath('/dashboard/properties')
    return { data: predictions, error: null }
  } catch (error) {
    console.error('Failed to predict maintenance needs:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to predict maintenance' 
    }
  }
}

/**
 * Classify field documentation using smart categorization
 */
export async function classifyFieldDocumentation(
  documentId: string,
  content: string,
  metadata: Record<string, unknown> = {}
) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Verify document ownership
    const { data: document, error: docError } = await supabase
      .from('field_documentation')
      .select('id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return { data: null, error: 'Document not found or access denied' }
    }

    // Classify document
    const classification = await categorizationEngine.classifyDocument(
      documentId,
      content,
      metadata,
      user.id
    )

    revalidatePath('/mobile/field')
    return { data: classification, error: null }
  } catch (error) {
    console.error('Failed to classify document:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to classify document' 
    }
  }
}

/**
 * Analyze damage from uploaded images
 */
export async function analyzeDamageFromImage(
  imageUrl: string,
  propertyContext: Record<string, unknown> = {}
) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Analyze damage
    const analysis = await categorizationEngine.analyzeDamageFromImage(
      imageUrl,
      propertyContext,
      user.id
    )

    revalidatePath('/ai-tools/damage-analyzer')
    return { data: analysis, error: null }
  } catch (error) {
    console.error('Failed to analyze damage from image:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to analyze damage' 
    }
  }
}

/**
 * Classify inventory items with smart categorization
 */
export async function classifyInventoryItem(
  itemName: string,
  description: string,
  imageUrl?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Classify item
    const classification = await categorizationEngine.classifyInventoryItem(
      itemName,
      description,
      imageUrl,
      metadata,
      user.id
    )

    revalidatePath('/ai-tools/inventory-scanner')
    return { data: classification, error: null }
  } catch (error) {
    console.error('Failed to classify inventory item:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to classify item' 
    }
  }
}

/**
 * Auto-tag field documentation
 */
export async function autoTagDocumentation(
  documentId: string,
  content: string,
  existingTags: string[] = []
) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Generate tags
    const tags = await categorizationEngine.autoTagDocumentation(
      documentId,
      content,
      existingTags
    )

    // Update document with new tags
    await supabase
      .from('field_documentation')
      .update({ tags })
      .eq('id', documentId)
      .eq('user_id', user.id)

    revalidatePath('/mobile/field')
    return { data: tags, error: null }
  } catch (error) {
    console.error('Failed to auto-tag documentation:', error)
    return { 
      data: existingTags, 
      error: error instanceof Error ? error.message : 'Failed to generate tags' 
    }
  }
}

/**
 * Create webhook subscription for AI events
 */
export async function createAIWebhookSubscription(
  webhookUrl: string,
  eventTypes: string[],
  secretKey?: string
) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Create subscription
    const result = await webhookManager.createSubscription(
      user.id,
      webhookUrl,
      eventTypes as WebhookEventType[],
      secretKey
    )

    if (result.error) {
      return { data: null, error: result.error }
    }

    revalidatePath('/dashboard/settings')
    return { data: result.data, error: null }
  } catch (error) {
    console.error('Failed to create webhook subscription:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to create subscription' 
    }
  }
}

/**
 * Test webhook endpoint
 */
export async function testWebhookEndpoint(subscriptionId: string) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Test webhook
    const result = await webhookManager.testWebhook(subscriptionId)

    return { data: result, error: null }
  } catch (error) {
    console.error('Failed to test webhook:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to test webhook' 
    }
  }
}

/**
 * Get AI prediction history for a property
 */
export async function getAIPredictionHistory(propertyId: string) {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Get predictions
    const { data: predictions, error } = await supabase
      .from('ai_predictions')
      .select('*')
      .eq('property_id', propertyId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: predictions, error: null }
  } catch (error) {
    console.error('Failed to get prediction history:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get history' 
    }
  }
}

/**
 * Get damage analysis history for user
 */
export async function getDamageAnalysisHistory() {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Get analyses
    const { data: analyses, error } = await supabase
      .from('damage_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: analyses, error: null }
  } catch (error) {
    console.error('Failed to get damage analysis history:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get history' 
    }
  }
}

/**
 * Get maintenance predictions for all user properties
 */
export async function getMaintenancePredictions() {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Get predictions with property details
    const { data: predictions, error } = await supabase
      .from('maintenance_predictions')
      .select(`
        *,
        properties (
          id,
          address,
          city,
          state
        )
      `)
      .eq('user_id', user.id)
      .order('urgency_level', { ascending: false })
      .order('predicted_date', { ascending: true })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: predictions, error: null }
  } catch (error) {
    console.error('Failed to get maintenance predictions:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get predictions' 
    }
  }
}

/**
 * Get webhook subscription status
 */
export async function getWebhookSubscriptions() {
  try {
    const supabase = await createClient()
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { data: null, error: 'Authentication required' }
    }

    // Get subscriptions
    const { data: subscriptions, error } = await supabase
      .from('webhook_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: subscriptions, error: null }
  } catch (error) {
    console.error('Failed to get webhook subscriptions:', error)
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Failed to get subscriptions' 
    }
  }
}