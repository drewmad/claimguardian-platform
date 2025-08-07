/**
 * @fileMetadata
 * @purpose "AI Request Batching System for bulk operations and cost optimization"
 * @dependencies []
 * @owner ai-team
 * @status stable
 */

import { aiCacheManager } from './ai-cache-manager'
import { enhancedAIClient } from './enhanced-client'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface BatchRequest {
  id: string
  featureId: string
  userId?: string
  messages?: ChatMessage[]
  imageAnalysis?: {
    image: string
    prompt: string
  }
  priority: 'low' | 'normal' | 'high'
  timestamp: number
  resolve: (result: unknown) => void
  reject: (error: unknown) => void
}

interface BatchConfig {
  maxBatchSize: number
  maxWaitTime: number
  priorityProcessing: boolean
  enableCaching: boolean
  costOptimization: boolean
}

interface BatchMetrics {
  totalRequests: number
  batchesProcessed: number
  avgBatchSize: number
  avgProcessingTime: number
  costSavings: number
  cacheHitRate: number
}

class AIBatchProcessor {
  private requestQueue: BatchRequest[] = []
  private processingQueue: BatchRequest[] = []
  private isProcessing = false
  private batchTimeout: NodeJS.Timeout | null = null
  private metrics: BatchMetrics = {
    totalRequests: 0,
    batchesProcessed: 0,
    avgBatchSize: 0,
    avgProcessingTime: 0,
    costSavings: 0,
    cacheHitRate: 0
  }

  private config: BatchConfig = {
    maxBatchSize: 10,
    maxWaitTime: 2000, // 2 seconds
    priorityProcessing: true,
    enableCaching: true,
    costOptimization: true
  }

  /**
   * Add request to batch queue
   */
  async addRequest(request: Omit<BatchRequest, 'id' | 'timestamp' | 'resolve' | 'reject'>): Promise<any> {
    return new Promise((resolve, reject) => {
      const batchRequest: BatchRequest = {
        ...request,
        id: this.generateRequestId(),
        timestamp: Date.now(),
        resolve,
        reject
      }

      // Add to appropriate queue based on priority
      if (this.config.priorityProcessing && request.priority === 'high') {
        this.requestQueue.unshift(batchRequest)
      } else {
        this.requestQueue.push(batchRequest)
      }

      this.metrics.totalRequests++

      // Process immediately if high priority or queue is full
      if (request.priority === 'high' || this.requestQueue.length >= this.config.maxBatchSize) {
        this.processBatch()
      } else {
        this.scheduleBatchProcessing()
      }
    })
  }

  /**
   * Schedule batch processing with timeout
   */
  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch()
    }, this.config.maxWaitTime)
  }

  /**
   * Process batch of requests
   */
  private async processBatch(): Promise<void> {
    if (this.isProcessing || this.requestQueue.length === 0) {
      return
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    this.isProcessing = true
    const startTime = Date.now()

    try {
      // Get batch of requests
      const batchSize = Math.min(this.requestQueue.length, this.config.maxBatchSize)
      const batch = this.requestQueue.splice(0, batchSize)
      this.processingQueue.push(...batch)

      // Group requests by feature and type for optimization
      const groupedRequests = this.groupRequestsByFeature(batch)

      // Process each group
      const results = await Promise.allSettled(
        Object.entries(groupedRequests).map(([featureId, requests]) =>
          this.processFeatureBatch(featureId, requests)
        )
      )

      // Update metrics
      const processingTime = Date.now() - startTime
      this.updateMetrics(batch.length, processingTime)

      console.log(`Batch processed: ${batch.length} requests in ${processingTime}ms`)

    } catch (error) {
      console.error('Batch processing error:', error)

      // Reject all requests in processing queue
      this.processingQueue.forEach(req => {
        req.reject(new Error('Batch processing failed'))
      })
    } finally {
      this.processingQueue = []
      this.isProcessing = false

      // Process next batch if queue is not empty
      if (this.requestQueue.length > 0) {
        setTimeout(() => this.processBatch(), 100)
      }
    }
  }

  /**
   * Group requests by feature for optimized processing
   */
  private groupRequestsByFeature(batch: BatchRequest[]): Record<string, BatchRequest[]> {
    return batch.reduce((groups, request) => {
      if (!groups[request.featureId]) {
        groups[request.featureId] = []
      }
      groups[request.featureId].push(request)
      return groups
    }, {} as Record<string, BatchRequest[]>)
  }

  /**
   * Process batch of requests for a specific feature
   */
  private async processFeatureBatch(featureId: string, requests: BatchRequest[]): Promise<void> {
    console.log(`Processing batch for ${featureId}: ${requests.length} requests`)

    // Separate chat and image analysis requests
    const chatRequests = requests.filter(r => r.messages)
    const imageRequests = requests.filter(r => r.imageAnalysis)

    // Process chat requests in parallel with intelligent batching
    if (chatRequests.length > 0) {
      await this.processChatBatch(featureId, chatRequests)
    }

    // Process image analysis requests in parallel
    if (imageRequests.length > 0) {
      await this.processImageBatch(featureId, imageRequests)
    }
  }

  /**
   * Process batch of chat requests
   */
  private async processChatBatch(featureId: string, requests: BatchRequest[]): Promise<void> {
    // Check cache first if enabled
    if (this.config.enableCaching) {
      const cacheResults = await Promise.allSettled(
        requests.map(async (request) => {
          if (!request.messages) return null

          const cached = await aiCacheManager.getCachedResponse(
            request.messages,
            featureId,
            'batch-processing'
          )

          if (cached) {
            request.resolve({
              response: cached.response,
              cached: true,
              cost: 0,
              responseTime: 5
            })
            return { request, cached: true }
          }

          return { request, cached: false }
        })
      )

      // Filter out cached requests
      const uncachedRequests = cacheResults
        .filter((result, index) =>
          result.status === 'fulfilled' &&
          result.value &&
          !result.value.cached
        )
        .map((result, index) => requests[index])
        .filter(Boolean)

      if (uncachedRequests.length === 0) {
        return // All requests were served from cache
      }

      requests = uncachedRequests
    }

    // Process requests in parallel with controlled concurrency
    const concurrency = Math.min(requests.length, 5) // Max 5 concurrent requests
    const chunks = this.chunkArray(requests, concurrency)

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async (request) => {
          try {
            const startTime = Date.now()

            if (!request.messages) {
              throw new Error('No messages provided for chat request')
            }

            const response = await enhancedAIClient.enhancedChat({
              messages: request.messages,
              featureId,
              userId: request.userId
            })

            const responseTime = Date.now() - startTime
            const estimatedCost = this.estimateCost(featureId, responseTime)

            // Cache the response
            if (this.config.enableCaching) {
              await aiCacheManager.cacheResponse(
                request.messages,
                featureId,
                'batch-processing',
                response,
                estimatedCost,
                responseTime
              )
            }

            request.resolve({
              response,
              cached: false,
              cost: estimatedCost,
              responseTime
            })

          } catch (error) {
            console.error(`Chat request ${request.id} failed:`, error)
            request.reject(error)
          }
        })
      )
    }
  }

  /**
   * Process batch of image analysis requests
   */
  private async processImageBatch(featureId: string, requests: BatchRequest[]): Promise<void> {
    // Process image requests with controlled concurrency (lower for vision models)
    const concurrency = Math.min(requests.length, 3) // Max 3 concurrent vision requests
    const chunks = this.chunkArray(requests, concurrency)

    for (const chunk of chunks) {
      await Promise.allSettled(
        chunk.map(async (request) => {
          try {
            const startTime = Date.now()

            if (!request.imageAnalysis) {
              throw new Error('No image analysis data provided')
            }

            const response = await enhancedAIClient.enhancedImageAnalysis({
              image: request.imageAnalysis.image,
              prompt: request.imageAnalysis.prompt,
              featureId
            })

            const responseTime = Date.now() - startTime
            const estimatedCost = this.estimateVisionCost(featureId, responseTime)

            request.resolve({
              response,
              cached: false,
              cost: estimatedCost,
              responseTime
            })

          } catch (error) {
            console.error(`Image request ${request.id} failed:`, error)
            request.reject(error)
          }
        })
      )
    }
  }

  /**
   * Utility function to chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Estimate cost for chat request
   */
  private estimateCost(featureId: string, responseTime: number): number {
    const baseCosts: Record<string, number> = {
      'damage-analyzer': 0.035,
      'policy-chat': 0.025,
      'settlement-analyzer': 0.045,
      'claim-assistant': 0.020,
      'document-generator': 0.030,
      'communication-helper': 0.015
    }

    const baseCost = baseCosts[featureId] || 0.025
    const tokenEstimate = Math.ceil(responseTime / 100) * 50
    return (tokenEstimate / 1000) * baseCost
  }

  /**
   * Estimate cost for vision request
   */
  private estimateVisionCost(featureId: string, responseTime: number): number {
    return this.estimateCost(featureId, responseTime) * 2.5 // Vision models are ~2.5x more expensive
  }

  /**
   * Update batch processing metrics
   */
  private updateMetrics(batchSize: number, processingTime: number): void {
    this.metrics.batchesProcessed++

    // Update average batch size
    const totalProcessed = this.metrics.avgBatchSize * (this.metrics.batchesProcessed - 1) + batchSize
    this.metrics.avgBatchSize = totalProcessed / this.metrics.batchesProcessed

    // Update average processing time
    const totalTime = this.metrics.avgProcessingTime * (this.metrics.batchesProcessed - 1) + processingTime
    this.metrics.avgProcessingTime = totalTime / this.metrics.batchesProcessed
  }

  /**
   * Get current batch processing metrics
   */
  getMetrics(): BatchMetrics & {
    queueLength: number
    isProcessing: boolean
    estimatedWaitTime: number
  } {
    const estimatedWaitTime = this.requestQueue.length > 0
      ? Math.max(0, this.config.maxWaitTime - (Date.now() - (this.requestQueue[0]?.timestamp || Date.now())))
      : 0

    return {
      ...this.metrics,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      estimatedWaitTime
    }
  }

  /**
   * Update batch processing configuration
   */
  updateConfig(newConfig: Partial<BatchConfig>): void {
    this.config = { ...this.config, ...newConfig }
    console.log('Batch processor config updated:', this.config)
  }

  /**
   * Get current configuration
   */
  getConfig(): BatchConfig {
    return { ...this.config }
  }

  /**
   * Clear request queue (emergency stop)
   */
  clearQueue(): number {
    const queueLength = this.requestQueue.length

    // Reject all pending requests
    this.requestQueue.forEach(request => {
      request.reject(new Error('Queue cleared by administrator'))
    })

    this.requestQueue = []

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    return queueLength
  }

  /**
   * Get queue status for monitoring
   */
  getQueueStatus(): {
    pending: number
    processing: number
    byPriority: Record<string, number>
    byFeature: Record<string, number>
    oldestRequest: number | null
  } {
    const byPriority = this.requestQueue.reduce((acc, req) => {
      acc[req.priority] = (acc[req.priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byFeature = this.requestQueue.reduce((acc, req) => {
      acc[req.featureId] = (acc[req.featureId] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const oldestRequest = this.requestQueue.length > 0
      ? Date.now() - Math.min(...this.requestQueue.map(r => r.timestamp))
      : null

    return {
      pending: this.requestQueue.length,
      processing: this.processingQueue.length,
      byPriority,
      byFeature,
      oldestRequest
    }
  }
}

// Export singleton instance
export const aiBatchProcessor = new AIBatchProcessor()
export type { BatchRequest, BatchConfig, BatchMetrics }
