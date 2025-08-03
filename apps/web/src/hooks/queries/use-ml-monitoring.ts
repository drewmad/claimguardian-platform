import { useQuery, useMutation } from '@tanstack/react-query'

import { createClient } from '@/lib/supabase/client'

interface MLMetrics {
  deploymentId: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  latencyP50: number
  latencyP95: number
  latencyP99: number
  throughput: number
  errorRate: number
  driftScore?: number
  lastUpdated: string
}

interface ModelDeployment {
  id: string
  modelVersionId: string
  deploymentEnv: string
  status: string
  trafficPercentage: number
  requestCount: number
  errorCount: number
  modelVersion: {
    modelFamily: string
    versionTag: string
    framework: string
  }
}

interface FederatedLearningRound {
  id: string
  modelFamily: string
  roundNumber: number
  status: string
  participatingNodes: any[]
  convergenceDelta: number
  startedAt: string
  completedAt?: string
}

export function useMLDeployments() {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['ml-deployments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ml_model_deployments')
        .select(`
          *,
          model_version:ml_model_versions(
            model_family,
            version_tag,
            framework
          )
        `)
        .eq('status', 'active')
        .order('deployed_at', { ascending: false })
      
      if (error) throw error
      return data as ModelDeployment[]
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  })
}

export function useMLMetrics(deploymentId: string, window: '1min' | '5min' | '1hour' | '1day' = '5min') {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['ml-metrics', deploymentId, window],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ml_performance_metrics')
        .select('*')
        .eq('model_deployment_id', deploymentId)
        .eq('metric_window', window)
        .order('metric_timestamp', { ascending: false })
        .limit(20)
      
      if (error) throw error
      return data as MLMetrics[]
    },
    refetchInterval: 10000, // Refresh every 10 seconds
    enabled: !!deploymentId
  })
}

export function useFederatedLearning(modelFamily?: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['federated-learning', modelFamily],
    queryFn: async () => {
      let query = supabase
        .from('federated_learning_rounds')
        .select('*')
        .order('round_number', { ascending: false })
        .limit(10)
      
      if (modelFamily) {
        query = query.eq('model_family', modelFamily)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data as FederatedLearningRound[]
    },
    refetchInterval: 60000 // Refresh every minute
  })
}

export function useModelDriftCheck(deploymentId: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['model-drift', deploymentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('check_model_drift', {
          p_deployment_id: deploymentId,
          p_window_hours: 24
        })
      
      if (error) throw error
      return data
    },
    refetchInterval: 300000, // Refresh every 5 minutes
    enabled: !!deploymentId
  })
}

export function usePromoteModel() {
  const supabase = createClient()
  
  return useMutation({
    mutationFn: async ({
      modelVersionId,
      deploymentConfig,
      trafficPercentage = 100
    }: {
      modelVersionId: string
      deploymentConfig: any
      trafficPercentage?: number
    }) => {
      const { data, error } = await supabase
        .rpc('promote_model_to_production', {
          p_model_version_id: modelVersionId,
          p_deployment_config: deploymentConfig,
          p_traffic_percentage: trafficPercentage
        })
      
      if (error) throw error
      return data
    }
  })
}

export function useStreamingMetrics(processorName: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['streaming-metrics', processorName],
    queryFn: async () => {
      const { data: processor, error: processorError } = await supabase
        .from('ai_stream_processors')
        .select('*')
        .eq('processor_name', processorName)
        .single()
      
      if (processorError) throw processorError
      
      const { data: results, error: resultsError } = await supabase
        .from('stream_analytics_results')
        .select('*')
        .eq('processor_id', processor.id)
        .order('window_end', { ascending: false })
        .limit(50)
      
      if (resultsError) throw resultsError
      
      return {
        processor,
        results
      }
    },
    refetchInterval: 5000 // Refresh every 5 seconds for real-time feel
  })
}

// Hook for A/B test monitoring
export function useABTestResults(modelFamily: string) {
  const supabase = createClient()
  
  return useQuery({
    queryKey: ['ab-test-results', modelFamily],
    queryFn: async () => {
      // Get deployments with traffic split
      const { data, error } = await supabase
        .from('ml_model_deployments')
        .select(`
          *,
          model_version:ml_model_versions(
            model_family,
            version_tag,
            validation_metrics,
            test_metrics
          ),
          metrics:ml_performance_metrics(
            accuracy,
            precision,
            recall,
            f1_score,
            metric_timestamp
          )
        `)
        .eq('model_version.model_family', modelFamily)
        .in('status', ['active', 'testing'])
        .gt('traffic_percentage', 0)
        .lt('traffic_percentage', 100)
        .order('deployed_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    refetchInterval: 60000 // Refresh every minute
  })
}