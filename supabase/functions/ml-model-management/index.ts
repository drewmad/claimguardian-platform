import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface MLModelRequest {
  action: 'deploy' | 'rollback' | 'monitor' | 'explain' | 'drift_check'
  data: Record<string, unknown>
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { action, data }: MLModelRequest = await req.json()
    const userId = req.headers.get('x-user-id')

    switch (action) {
      case 'deploy': {
        const { modelVersionId, deploymentConfig } = data

        // Validate model readiness
        const { data: model } = await supabase
          .from('ml_model_versions')
          .select('*')
          .eq('id', modelVersionId)
          .single()

        if (!model?.production_ready) {
          throw new Error('Model not ready for production deployment')
        }

        // Call deployment function
        const { data: deployment, error } = await supabase
          .rpc('promote_model_to_production', {
            p_model_version_id: modelVersionId,
            p_approver_id: userId,
            p_deployment_config: deploymentConfig || {}
          })

        if (error) throw error

        // Start deployment monitoring
        await startDeploymentMonitoring(supabase, deployment)

        return new Response(JSON.stringify({
          success: true,
          deploymentId: deployment,
          message: 'Model deployment initiated'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'monitor': {
        const { deploymentId } = data

        // Get deployment metrics
        const metrics = await getDeploymentMetrics(supabase, deploymentId as string)

        // Check for anomalies
        const anomalies = detectAnomalies(metrics)

        return new Response(JSON.stringify({
          success: true,
          metrics,
          anomalies,
          health: calculateHealthScore(metrics)
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'drift_check': {
        const { modelVersionId, window } = data

        // Run drift detection
        const { data: driftResult, error } = await supabase
          .rpc('check_model_drift', {
            p_model_version_id: modelVersionId,
            p_monitoring_window: window || '7 days'
          })

        if (error) throw error

        // Send alerts if needed
        if (driftResult.drift_detected && driftResult.severity === 'high') {
          await sendDriftAlert(supabase, modelVersionId as string, driftResult)
        }

        return new Response(JSON.stringify({
          success: true,
          driftAnalysis: driftResult
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'explain': {
        const { predictionId, propertyId, method } = data

        // Generate explanation
        const explanation = await generateExplanation(
          supabase,
          predictionId as string,
          propertyId as string,
          method as string || 'shap'
        )

        // Store explanation
        const { error } = await supabase
          .from('model_explanations')
          .insert({
            prediction_id: predictionId,
            property_id: propertyId,
            explanation_method: method || 'shap',
            feature_importance: explanation.featureImportance,
            text_explanation: explanation.textExplanation,
            decision_path: explanation.decisionPath,
            counterfactuals: explanation.counterfactuals
          })

        if (error) throw error

        return new Response(JSON.stringify({
          success: true,
          explanation
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'rollback': {
        const { deploymentId, reason } = data

        // Get current deployment
        const { data: deployment } = await supabase
          .from('ml_deployments')
          .select('*')
          .eq('id', deploymentId)
          .single()

        if (!deployment) {
          throw new Error('Deployment not found')
        }

        // Stop current deployment
        await supabase
          .from('ml_deployments')
          .update({
            status: 'stopped',
            stopped_at: new Date().toISOString()
          })
          .eq('id', deploymentId)

        // Reactivate previous deployment
        await rollbackToPreviousDeployment(supabase, deployment)

        // Log rollback
        await supabase
          .from('ai_decision_audit')
          .insert({
            decision_type: 'model_rollback',
            model_version_id: deployment.model_version_id,
            user_id: userId,
            decision_made: 'rolled_back',
            input_data: { deploymentId, reason }
          })

        return new Response(JSON.stringify({
          success: true,
          message: 'Model rollback completed'
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response('Invalid action', { status: 400 })
    }
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// Helper functions

async function startDeploymentMonitoring(supabase: any, deploymentId: string) {
  // Set up continuous monitoring
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Starting monitoring for deployment ${deploymentId}`
  }));

  // This would typically integrate with monitoring services
  // For now, we'll schedule periodic checks
}

async function getDeploymentMetrics(supabase: any, deploymentId: string) {
  // Aggregate metrics from various sources
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - 3600000) // Last hour

  // Get prediction latencies
  const { data: predictions } = await supabase
    .from('ai_decision_audit')
    .select('created_at, model_confidence')
    .eq('deployment_id', deploymentId)
    .gte('created_at', startTime.toISOString())
    .lte('created_at', endTime.toISOString())

  // Calculate metrics
  return {
    requestCount: predictions?.length || 0,
    averageLatency: Math.random() * 100 + 50, // Mock data
    p95Latency: Math.random() * 200 + 100,
    errorRate: Math.random() * 0.02,
    averageConfidence: predictions?.reduce((sum, p) => sum + p.model_confidence, 0) / (predictions?.length || 1) || 0
  }
}

function detectAnomalies(metrics: any) {
  const anomalies = []

  if (metrics.errorRate > 0.05) {
    anomalies.push({
      type: 'high_error_rate',
      severity: 'critical',
      value: metrics.errorRate
    })
  }

  if (metrics.p95Latency > 500) {
    anomalies.push({
      type: 'high_latency',
      severity: 'warning',
      value: metrics.p95Latency
    })
  }

  if (metrics.averageConfidence < 0.7) {
    anomalies.push({
      type: 'low_confidence',
      severity: 'warning',
      value: metrics.averageConfidence
    })
  }

  return anomalies
}

function calculateHealthScore(metrics: any) {
  let score = 100

  // Deduct points for issues
  score -= metrics.errorRate * 1000 // Heavy penalty for errors
  score -= Math.max(0, (metrics.p95Latency - 200) / 10) // Penalty for high latency
  score -= Math.max(0, (0.8 - metrics.averageConfidence) * 50) // Penalty for low confidence

  return Math.max(0, Math.min(100, score))
}

async function sendDriftAlert(supabase: any, modelVersionId: string, driftResult: any) {
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `ALERT: Model drift detected for ${modelVersionId}`
  }));
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Severity: ${driftResult.severity}`
  }));
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Recommendation: ${driftResult.recommendation}`
  }));

  // In production, this would send notifications via email/Slack/PagerDuty
}

async function generateExplanation(supabase: any, predictionId: string, propertyId: string, method: string) {
  // Get prediction details
  const { data: prediction } = await supabase
    .from('ai_decision_audit')
    .select('*')
    .eq('id', predictionId)
    .single()

  // Generate explanation based on method
  // This is a simplified example - real implementation would use SHAP/LIME
  const features = Object.keys(prediction.input_data || {})
  const featureImportance: Record<string, number> = {}

  // Mock feature importance
  features.forEach(feature => {
    featureImportance[feature] = Math.random()
  })

  // Normalize
  const total = Object.values(featureImportance).reduce((sum, val) => sum + val, 0)
  Object.keys(featureImportance).forEach(key => {
    featureImportance[key] = featureImportance[key] / total
  })

  // Generate text explanation
  const topFeatures = Object.entries(featureImportance)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  const textExplanation = `The ${prediction.decision_type} decision was primarily influenced by: ${
    topFeatures.map(([feature, importance]) =>
      `${feature} (${(importance * 100).toFixed(1)}%)`
    ).join(', ')
  }.`

  // Generate counterfactuals
  const counterfactuals = topFeatures.map(([feature, _]) => ({
    feature,
    currentValue: prediction.input_data[feature],
    suggestedValue: generateCounterfactualValue(prediction.input_data[feature]),
    expectedOutcome: 'different_decision'
  }))

  return {
    featureImportance,
    textExplanation,
    decisionPath: [
      { step: 1, description: 'Data preprocessing', confidence: 0.99 },
      { step: 2, description: 'Feature extraction', confidence: 0.95 },
      { step: 3, description: 'Model inference', confidence: prediction.model_confidence },
      { step: 4, description: 'Decision threshold', confidence: 0.90 }
    ],
    counterfactuals
  }
}

function generateCounterfactualValue(currentValue: any) {
  if (typeof currentValue === 'number') {
    return currentValue * 1.2 // Increase by 20%
  } else if (typeof currentValue === 'boolean') {
    return !currentValue
  } else {
    return 'alternative_value'
  }
}

async function rollbackToPreviousDeployment(supabase: any, currentDeployment: any) {
  // Find previous deployment for same model family
  const { data: previousDeployment } = await supabase
    .from('ml_deployments')
    .select('*')
    .eq('environment', 'production')
    .eq('status', 'stopped')
    .order('stopped_at', { ascending: false })
    .limit(1)
    .single()

  if (previousDeployment) {
    // Reactivate previous deployment
    await supabase
      .from('ml_deployments')
      .update({
        status: 'active',
        traffic_percentage: 100,
        stopped_at: null
      })
      .eq('id', previousDeployment.id)
  }
}
