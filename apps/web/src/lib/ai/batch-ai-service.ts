/**
 * @fileMetadata
 * @purpose "Batch-enabled AI service wrapper for optimized bulk operations"
 * @dependencies []
 * @owner ai-team
 * @status stable
 */

import { aiBatchProcessor } from './batch-processor'
import { enhancedAIClient } from './enhanced-client'
interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface BatchChatRequest {
  messages: ChatMessage[]
  featureId: string
  userId?: string
  priority?: 'low' | 'normal' | 'high'
}

interface BatchImageRequest {
  image: string
  prompt: string
  featureId: string
  userId?: string
  priority?: 'low' | 'normal' | 'high'
}

interface BatchResponse {
  response: string
  cached: boolean
  cost: number
  responseTime: number
  batchId?: string
}

class BatchAIService {
  /**
   * Process chat request through batch system or direct processing
   */
  async processChat(request: BatchChatRequest): Promise<BatchResponse> {
    const { priority = 'normal', ...requestData } = request

    // Direct processing for high priority requests with low queue
    const queueStatus = aiBatchProcessor.getQueueStatus()
    if (priority === 'high' && queueStatus.pending < 3) {
      const startTime = Date.now()
      
      try {
        const response = await enhancedAIClient.enhancedChat({
          messages: request.messages,
          featureId: request.featureId,
          userId: request.userId
        })

        return {
          response,
          cached: false,
          cost: this.estimateCost(request.featureId, Date.now() - startTime),
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        console.error('Direct chat processing failed, falling back to batch:', error)
      }
    }

    // Use batch processing for optimization
    return await aiBatchProcessor.addRequest({
      messages: request.messages,
      featureId: request.featureId,
      userId: request.userId,
      priority
    })
  }

  /**
   * Process image analysis through batch system
   */
  async processImageAnalysis(request: BatchImageRequest): Promise<BatchResponse> {
    const { priority = 'normal', ...requestData } = request

    // Always use batch processing for image analysis due to higher cost
    return await aiBatchProcessor.addRequest({
      imageAnalysis: {
        image: request.image,
        prompt: request.prompt
      },
      featureId: request.featureId,
      userId: request.userId,
      priority
    })
  }

  /**
   * Process multiple chat requests in bulk
   */
  async processBulkChat(requests: BatchChatRequest[]): Promise<BatchResponse[]> {
    const promises = requests.map(request => this.processChat(request))
    return await Promise.all(promises)
  }

  /**
   * Process multiple image analysis requests in bulk
   */
  async processBulkImageAnalysis(requests: BatchImageRequest[]): Promise<BatchResponse[]> {
    const promises = requests.map(request => this.processImageAnalysis(request))
    return await Promise.all(promises)
  }

  /**
   * Smart request routing based on system load and priority
   */
  async smartProcess(request: BatchChatRequest | BatchImageRequest): Promise<BatchResponse> {
    const metrics = aiBatchProcessor.getMetrics()
    const queueStatus = aiBatchProcessor.getQueueStatus()

    // Determine processing strategy
    const isImageRequest = 'image' in request
    const shouldBatch = this.shouldUseBatching(metrics, queueStatus, request.priority, isImageRequest)

    if (!shouldBatch && !isImageRequest) {
      // Direct processing for chat requests when optimal
      const chatRequest = request as BatchChatRequest
      const startTime = Date.now()
      
      try {
        const response = await enhancedAIClient.enhancedChat({
          messages: chatRequest.messages,
          featureId: chatRequest.featureId,
          userId: chatRequest.userId
        })

        return {
          response,
          cached: false,
          cost: this.estimateCost(chatRequest.featureId, Date.now() - startTime),
          responseTime: Date.now() - startTime
        }
      } catch (error) {
        console.error('Smart processing fallback to batch:', error)
      }
    }

    // Use batch processing
    if (isImageRequest) {
      return await this.processImageAnalysis(request as BatchImageRequest)
    } else {
      return await this.processChat(request as BatchChatRequest)
    }
  }

  /**
   * Determine if batching should be used based on system state
   */
  private shouldUseBatching(
    metrics: unknown, 
    queueStatus: unknown, 
    priority?: string, 
    isImageRequest = false
  ): boolean {
    // Always batch image requests for cost optimization
    if (isImageRequest) return true

    // Don't batch if queue is empty and priority is high
    if (priority === 'high' && queueStatus.pending === 0) return false

    // Batch if queue has significant load
    if (queueStatus.pending > 5) return true

    // Batch if processing efficiency is good
    if (metrics.avgBatchSize > 3 && metrics.avgProcessingTime < 2000) return true

    // Default to direct processing for low-load scenarios
    return false
  }

  /**
   * Estimate cost for request
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
   * Get batch processing status for monitoring
   */
  getBatchStatus() {
    return {
      metrics: aiBatchProcessor.getMetrics(),
      queueStatus: aiBatchProcessor.getQueueStatus(),
      config: aiBatchProcessor.getConfig()
    }
  }

  /**
   * Process requests with automatic load balancing
   */
  async processWithLoadBalancing(requests: (BatchChatRequest | BatchImageRequest)[]): Promise<BatchResponse[]> {
    const metrics = aiBatchProcessor.getMetrics()
    const queueStatus = aiBatchProcessor.getQueueStatus()

    // Group requests by type and priority
    const chatRequests = requests.filter(r => 'messages' in r) as BatchChatRequest[]
    const imageRequests = requests.filter(r => 'image' in r) as BatchImageRequest[]

    const highPriorityChat = chatRequests.filter(r => r.priority === 'high')
    const normalPriorityChat = chatRequests.filter(r => r.priority !== 'high')

    const results: BatchResponse[] = []

    // Process high priority chat requests directly if queue is low
    if (highPriorityChat.length > 0 && queueStatus.pending < 5) {
      const directResults = await Promise.all(
        highPriorityChat.map(async (request) => {
          const startTime = Date.now()
          try {
            const response = await enhancedAIClient.enhancedChat({
              messages: request.messages,
              featureId: request.featureId,
              userId: request.userId
            })

            return {
              response,
              cached: false,
              cost: this.estimateCost(request.featureId, Date.now() - startTime),
              responseTime: Date.now() - startTime
            }
          } catch (error) {
            console.error('Load balanced processing failed:', error)
            // Fallback to batch processing
            return await this.processChat(request)
          }
        })
      )
      results.push(...directResults)
    } else {
      // Use batch processing for high priority when queue is busy
      const batchResults = await this.processBulkChat(highPriorityChat)
      results.push(...batchResults)
    }

    // Process normal priority and image requests through batch system
    const normalResults = await this.processBulkChat(normalPriorityChat)
    const imageResults = await this.processBulkImageAnalysis(imageRequests)
    
    results.push(...normalResults, ...imageResults)

    return results
  }

  /**
   * Emergency processing bypass for critical requests
   */
  async emergencyProcess(request: BatchChatRequest): Promise<BatchResponse> {
    const startTime = Date.now()
    
    try {
      const response = await enhancedAIClient.enhancedChat({
        messages: request.messages,
        featureId: request.featureId,
        userId: request.userId
      })

      return {
        response,
        cached: false,
        cost: this.estimateCost(request.featureId, Date.now() - startTime),
        responseTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('Emergency processing failed:', error)
      throw error
    }
  }
}

// Export singleton instance
export const batchAIService = new BatchAIService()
export type { BatchChatRequest, BatchImageRequest, BatchResponse }