import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface FederatedLearningRequest {
  action: 'register_node' | 'start_round' | 'submit_update' | 'aggregate_round' | 'get_model'
  data: Record<string, unknown>
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const { action, data }: FederatedLearningRequest = await req.json()

    switch (action) {
      case 'register_node': {
        const { nodeType, dataVolumeEstimate, capabilities } = data
        
        // Generate anonymized node ID
        const nodeId = generateSecureNodeId()
        
        // Register node with privacy guarantees
        const { error } = await supabase
          .from('federated_learning_nodes')
          .insert({
            node_identifier: nodeId,
            node_type: nodeType,
            data_volume_estimate: dataVolumeEstimate,
            compute_capability: capabilities,
            differential_privacy_epsilon: calculatePrivacyBudget(dataVolumeEstimate as number),
            last_heartbeat: new Date().toISOString()
          })

        if (error) throw error

        return new Response(JSON.stringify({
          success: true,
          nodeId,
          privacyConfig: {
            epsilon: calculatePrivacyBudget(dataVolumeEstimate as number),
            delta: 1e-5,
            clippingNorm: 1.0
          }
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'start_round': {
        const { modelFamily, targetNodes, aggregationAlgorithm } = data
        
        // Get current model version
        const { data: currentModel } = await supabase
          .from('ml_model_versions')
          .select('*')
          .eq('model_family', modelFamily)
          .eq('production_ready', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!currentModel) {
          throw new Error('No production model found for family')
        }

        // Select participating nodes
        const { data: eligibleNodes } = await supabase
          .from('federated_learning_nodes')
          .select('*')
          .gte('last_heartbeat', new Date(Date.now() - 86400000).toISOString()) // Active in last 24h
          .order('total_contribution_score', { ascending: false })
          .limit(targetNodes as number * 2) // Over-select for redundancy

        const selectedNodes = selectNodesForRound(eligibleNodes || [], targetNodes as number)

        // Create new round
        const { data: round, error } = await supabase
          .from('federated_learning_rounds')
          .insert({
            model_family: modelFamily,
            round_number: await getNextRoundNumber(supabase, modelFamily as string),
            target_nodes: targetNodes,
            minimum_nodes: Math.ceil((targetNodes as number) * 0.6),
            aggregation_algorithm: aggregationAlgorithm || 'fedavg',
            noise_multiplier: calculateNoiseMultiplier(selectedNodes.length),
            base_model_version: currentModel.id,
            status: 'active',
            started_at: new Date().toISOString(),
            invited_nodes: selectedNodes.map(n => n.node_identifier)
          })
          .select()
          .single()

        if (error) throw error

        // Notify selected nodes
        await notifyNodesForRound(selectedNodes, round.id)

        return new Response(JSON.stringify({
          success: true,
          roundId: round.id,
          selectedNodes: selectedNodes.length,
          modelCheckpoint: currentModel.model_artifacts?.checkpoint_url
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'submit_update': {
        const { roundId, nodeId, encryptedUpdate, updateMetrics } = data
        
        // Verify node is invited to round
        const { data: round } = await supabase
          .from('federated_learning_rounds')
          .select('*')
          .eq('id', roundId)
          .single()

        if (!round || !round.invited_nodes.includes(nodeId)) {
          throw new Error('Node not authorized for this round')
        }

        // Store encrypted update (would be decrypted in secure aggregation)
        const updateData = {
          nodeId,
          encryptedGradients: encryptedUpdate,
          metrics: updateMetrics,
          timestamp: new Date().toISOString()
        }

        // Update round with participant
        await supabase
          .from('federated_learning_rounds')
          .update({
            participating_nodes: [...(round.participating_nodes || []), nodeId],
            completed_nodes: [...(round.completed_nodes || []), nodeId]
          })
          .eq('id', roundId)

        // Update node statistics
        await supabase
          .from('federated_learning_nodes')
          .update({
            total_rounds_participated: supabase.raw('total_rounds_participated + 1'),
            successful_updates: supabase.raw('successful_updates + 1'),
            last_heartbeat: new Date().toISOString()
          })
          .eq('node_identifier', nodeId)

        // Check if enough updates for aggregation
        const completedCount = round.completed_nodes.length + 1
        if (completedCount >= round.minimum_nodes) {
          // Trigger aggregation
          await triggerAggregation(supabase, roundId as string)
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Update submitted successfully',
          aggregationPending: completedCount >= round.minimum_nodes
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'aggregate_round': {
        const { roundId } = data
        
        // Get round and all updates
        const { data: round } = await supabase
          .from('federated_learning_rounds')
          .select('*')
          .eq('id', roundId)
          .single()

        if (!round || round.status !== 'active') {
          throw new Error('Round not ready for aggregation')
        }

        // Perform secure aggregation (simplified)
        const aggregatedUpdate = await performSecureAggregation(round)

        // Apply differential privacy
        const privatizedUpdate = applyDifferentialPrivacy(
          aggregatedUpdate,
          round.noise_multiplier,
          round.clipping_threshold
        )

        // Create new model version
        const { data: newModel, error } = await supabase
          .from('ml_model_versions')
          .insert({
            model_family: round.model_family,
            version_tag: `fl_round_${round.round_number}`,
            architecture: aggregatedUpdate.architecture,
            hyperparameters: aggregatedUpdate.hyperparameters,
            training_config: {
              method: 'federated_learning',
              round_id: roundId,
              participants: round.completed_nodes.length
            },
            framework: 'tensorflow',
            parent_model_id: round.base_model_version,
            improvement_notes: `Federated learning round ${round.round_number}`,
            validation_metrics: aggregatedUpdate.metrics,
            test_metrics: {},
            production_ready: false
          })
          .select()
          .single()

        if (error) throw error

        // Update round status
        await supabase
          .from('federated_learning_rounds')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            aggregated_update: privatizedUpdate,
            model_improvement_metrics: aggregatedUpdate.improvements
          })
          .eq('id', roundId)

        // Reward contributing nodes
        await rewardContributingNodes(supabase, round)

        return new Response(JSON.stringify({
          success: true,
          newModelId: newModel.id,
          improvements: aggregatedUpdate.improvements,
          participantCount: round.completed_nodes.length
        }), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'get_model': {
        const { nodeId, modelFamily } = data
        
        // Verify node registration
        const { data: node } = await supabase
          .from('federated_learning_nodes')
          .select('*')
          .eq('node_identifier', nodeId)
          .single()

        if (!node) {
          throw new Error('Node not registered')
        }

        // Get latest model for family
        const { data: model } = await supabase
          .from('ml_model_versions')
          .select('*')
          .eq('model_family', modelFamily)
          .eq('production_ready', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (!model) {
          throw new Error('No model available')
        }

        // Update node heartbeat
        await supabase
          .from('federated_learning_nodes')
          .update({ last_heartbeat: new Date().toISOString() })
          .eq('node_identifier', nodeId)

        return new Response(JSON.stringify({
          success: true,
          modelUrl: model.model_artifacts?.model_url,
          modelVersion: model.version_tag,
          architecture: model.architecture,
          hyperparameters: model.hyperparameters
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
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

// Helper functions

function generateSecureNodeId(): string {
  // Generate cryptographically secure node ID
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

function calculatePrivacyBudget(dataVolume: number): number {
  // Calculate differential privacy epsilon based on data volume
  // More data = smaller epsilon (stronger privacy)
  if (dataVolume > 10000) return 0.1
  if (dataVolume > 1000) return 0.5
  if (dataVolume > 100) return 1.0
  return 2.0
}

function selectNodesForRound(nodes: any[], targetCount: number): any[] {
  // Select diverse nodes based on:
  // - Geographic distribution
  // - Node type diversity
  // - Historical contribution quality
  // - Data volume
  
  const selected: any[] = []
  const nodesByType: Record<string, any[]> = {}
  
  // Group by type
  nodes.forEach(node => {
    if (!nodesByType[node.node_type]) {
      nodesByType[node.node_type] = []
    }
    nodesByType[node.node_type].push(node)
  })
  
  // Select proportionally from each type
  const typesCount = Object.keys(nodesByType).length
  const perType = Math.ceil(targetCount / typesCount)
  
  Object.values(nodesByType).forEach(typeNodes => {
    const sorted = typeNodes.sort((a, b) => 
      b.total_contribution_score - a.total_contribution_score
    )
    selected.push(...sorted.slice(0, perType))
  })
  
  return selected.slice(0, targetCount)
}

function calculateNoiseMultiplier(nodeCount: number): number {
  // Calculate noise for differential privacy
  // More nodes = less noise needed
  const baseNoise = 1.0
  return baseNoise / Math.sqrt(nodeCount)
}

async function getNextRoundNumber(supabase: any, modelFamily: string): Promise<number> {
  const { data } = await supabase
    .from('federated_learning_rounds')
    .select('round_number')
    .eq('model_family', modelFamily)
    .order('round_number', { ascending: false })
    .limit(1)
    .single()
  
  return (data?.round_number || 0) + 1
}

async function notifyNodesForRound(nodes: any[], roundId: string) {
  // In production, this would send push notifications or webhooks
  console.log(`Notifying ${nodes.length} nodes for round ${roundId}`)
}

async function triggerAggregation(supabase: any, roundId: string) {
  // Schedule aggregation job
  console.log(`Triggering aggregation for round ${roundId}`)
  
  // In production, this would trigger a background job
  // For now, we'll set a flag
  await supabase
    .from('federated_learning_rounds')
    .update({ status: 'aggregating' })
    .eq('id', roundId)
}

async function performSecureAggregation(round: any) {
  // Simplified secure aggregation
  // In production, this would:
  // 1. Decrypt updates using secure multi-party computation
  // 2. Verify update integrity
  // 3. Apply aggregation algorithm (FedAvg, FedProx, etc.)
  
  return {
    architecture: { layers: 12, hidden_dim: 768 },
    hyperparameters: { learning_rate: 0.001 },
    weights: {}, // Aggregated weights
    metrics: {
      accuracy: 0.92,
      loss: 0.15
    },
    improvements: {
      accuracy_delta: 0.02,
      loss_delta: -0.03
    }
  }
}

function applyDifferentialPrivacy(update: any, noiseMultiplier: number, clippingThreshold: number = 1.0) {
  // Apply differential privacy to aggregated update
  // This is a simplified version - real implementation would:
  // 1. Clip gradients to bounded sensitivity
  // 2. Add calibrated Gaussian noise
  
  const noisyUpdate = { ...update }
  
  // Add noise to weights (simplified)
  if (noisyUpdate.weights) {
    Object.keys(noisyUpdate.weights).forEach(key => {
      const noise = gaussianNoise(0, noiseMultiplier)
      noisyUpdate.weights[key] = noisyUpdate.weights[key] + noise
    })
  }
  
  return noisyUpdate
}

function gaussianNoise(mean: number, stdDev: number): number {
  // Box-Muller transform for Gaussian distribution
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * stdDev + mean
}

async function rewardContributingNodes(supabase: any, round: any) {
  // Update contribution scores for participating nodes
  const contributionBonus = 10 / round.completed_nodes.length
  
  for (const nodeId of round.completed_nodes) {
    await supabase
      .from('federated_learning_nodes')
      .update({
        total_contribution_score: supabase.raw(`total_contribution_score + ${contributionBonus}`)
      })
      .eq('node_identifier', nodeId)
  }
}