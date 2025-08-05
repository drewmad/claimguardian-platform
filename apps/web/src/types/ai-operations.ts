/**
 * @fileMetadata
 * @purpose TypeScript types for AI Operations database entities
 * @owner ai-team
 * @status active
 */

// Database entity types for AI Operations

export interface AIModelConfig {
  id: string
  feature_id: string
  feature_name: string
  current_model: string
  fallback_model: string
  category: 'analysis' | 'generation' | 'vision' | 'reasoning'
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string
}

export interface AIUsageTracking {
  id: string
  feature_id: string
  model: string
  user_id?: string
  success: boolean
  response_time: number // milliseconds
  cost: number
  tokens_used?: number
  error_message?: string
  request_metadata?: Record<string, unknown>
  created_at: string
}

export interface AIABTest {
  id: string
  name: string
  feature_id: string
  model_a: string
  model_b: string
  status: 'active' | 'paused' | 'completed'
  traffic_split: number // percentage for model A (10-90)
  start_date: string
  end_date?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AIABTestResult {
  id: string
  test_id: string
  model: 'model_a' | 'model_b'
  user_id?: string
  response_time: number
  success: boolean
  user_rating?: number // 1-5
  feedback?: string
  request_metadata?: Record<string, unknown>
  created_at: string
}

export interface AICustomPrompt {
  id: string
  feature_id: string
  name: string
  system_prompt: string
  is_active: boolean
  version: number
  created_by?: string
  created_at: string
  updated_at: string
}

export interface AIPromptPerformance {
  id: string
  prompt_id: string
  user_id?: string
  response_time: number
  success: boolean
  user_rating?: number // 1-5
  feedback?: string
  cost: number
  created_at: string
}

export interface AIQualityScore {
  id: string
  feature_id: string
  model: string
  prompt_id?: string
  user_id?: string
  rating: 'excellent' | 'good' | 'fair' | 'poor'
  numeric_rating: number // 1-5
  response_time: number
  feedback?: string
  response_content?: string
  request_metadata?: Record<string, unknown>
  created_at: string
}

export interface AIRecommendation {
  id: string
  type: 'model_switch' | 'prompt_optimization' | 'ab_test' | 'cost_optimization'
  priority: 'high' | 'medium' | 'low'
  feature_id: string
  current_config?: Record<string, unknown>
  recommended_config?: Record<string, unknown>
  reason: string
  confidence: number // 0-100
  potential_impact?: Record<string, unknown> // cost savings, performance improvement, etc.
  status: 'pending' | 'applied' | 'dismissed'
  applied_by?: string
  applied_at?: string
  created_at: string
}

// Request/Response types for API endpoints

export interface CreateABTestRequest {
  name: string
  feature_id: string
  model_a: string
  model_b: string
  traffic_split: number
}

export interface UpdateABTestRequest {
  name?: string
  status?: 'active' | 'paused' | 'completed'
  traffic_split?: number
  end_date?: string
}

export interface CreateCustomPromptRequest {
  feature_id: string
  name: string
  system_prompt: string
}

export interface UpdateCustomPromptRequest {
  name?: string
  system_prompt?: string
  is_active?: boolean
}

export interface CreateQualityScoreRequest {
  feature_id: string
  model: string
  prompt_id?: string
  rating: 'excellent' | 'good' | 'fair' | 'poor'
  numeric_rating: number
  response_time: number
  feedback?: string
  response_content?: string
  request_metadata?: Record<string, unknown>
}

export interface UpdateModelConfigRequest {
  current_model?: string
  fallback_model?: string
  is_active?: boolean
}

export interface TrackUsageRequest {
  feature_id: string
  model: string
  success: boolean
  response_time: number
  cost?: number
  tokens_used?: number
  error_message?: string
  request_metadata?: Record<string, unknown>
}

// Aggregated data types for analytics

export interface ABTestMetrics {
  test_id: string
  model_a_metrics: {
    requests: number
    avg_time: number
    success_rate: number
    user_rating: number
  }
  model_b_metrics: {
    requests: number
    avg_time: number
    success_rate: number
    user_rating: number
  }
}

export interface FeaturePerformanceMetrics {
  feature_id: string
  feature_name: string
  current_model: string
  total_requests: number
  avg_response_time: number
  success_rate: number
  total_cost: number
  avg_user_rating: number
  quality_score: number
}

export interface ModelComparisonMetrics {
  model_id: string
  model_name: string
  provider: string
  requests: number
  avg_response_time: number
  success_rate: number
  total_cost: number
  cost_per_request: number
  avg_user_rating: number
  features_used: string[]
}

export interface QualityMetricsSummary {
  overall_rating: number
  total_ratings: number
  response_rate: number
  satisfaction_rate: number
  ratings_by_feature: Record<string, {
    rating: number
    count: number
    latest_feedback: string
  }>
}

// Utility types

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_more: boolean
}

export interface AIOperationsResponse<T> {
  data?: T
  error?: string
  success: boolean
}

// Feature mapping types (matching admin panel)
export interface FeatureModelMapping {
  feature_id: string
  feature_name: string
  current_model: string
  fallback_model: string
  category: 'analysis' | 'generation' | 'vision' | 'reasoning'
}