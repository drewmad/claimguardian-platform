/**
 * @fileMetadata
 * @purpose "Enhanced AI Client with database-driven model selection and A/B testing"
 * @dependencies ["@/actions"]
 * @owner ai-team
 * @status stable
 */

import { AIClient } from "./client";
import { aiModelConfigService } from "./model-config-service";
import { aiCacheManager } from "./ai-cache-manager";
import { redisAICacheService } from "./redis-cache-service";
import { analyticsStream } from "../analytics/stream-processor";
import { trackAIMetric } from "@/actions/ai-analytics";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ImageAnalysisRequest {
  image: string; // base64 or URL
  prompt: string;
  featureId: string;
}

interface EnhancedChatRequest {
  messages: ChatMessage[];
  featureId: string;
  userId?: string;
}

interface ModelSelectionResult {
  selectedModel: string;
  provider: "openai" | "gemini" | "claude" | "grok";
  fallbackModel?: string;
  abTestId?: string;
  isABTest?: boolean;
}

interface CustomPrompt {
  feature_id: string;
  is_active: boolean;
  system_prompt: string;
}

export class EnhancedAIClient extends AIClient {
  /**
   * Chat with database-driven model selection and intelligent caching
   */
  async enhancedChat(request: EnhancedChatRequest): Promise<string> {
    const startTime = Date.now();
    let selectedModel: ModelSelectionResult | null = null;
    let response: string = "";
    let success = false;
    let error: Error | null = null;
    let cacheHit = false;

    try {
      // Get model configuration from database
      selectedModel = await this.selectModelForFeature(
        request.featureId,
        request.userId,
      );

      if (!selectedModel) {
        throw new Error(
          `No model configuration found for feature: ${request.featureId}`,
        );
      }

      // Apply custom prompts if configured
      const enhancedMessages = await this.applyCustomPrompts(
        request.messages,
        request.featureId,
      );

      // Check Redis cache first (persistent cache)
      const redisCachedResponse = await redisAICacheService.get(
        enhancedMessages,
        request.featureId,
        selectedModel.selectedModel,
        request.userId,
      );

      if (redisCachedResponse) {
        response = redisCachedResponse.response;
        success = true;
        cacheHit = true;
        console.log(
          `Redis cache hit for ${request.featureId} with model ${selectedModel.selectedModel}`,
        );
      } else {
        // Check in-memory cache as fallback
        const memoryCachedResponse = await aiCacheManager.getCachedResponse(
          enhancedMessages,
          request.featureId,
          selectedModel.selectedModel,
        );

        if (memoryCachedResponse) {
          response = memoryCachedResponse.response;
          success = true;
          cacheHit = true;
          console.log(
            `Memory cache hit for ${request.featureId} with model ${selectedModel.selectedModel}`,
          );
        } else {
          // Try primary model first
          try {
            response = await this.chat(
              enhancedMessages,
              selectedModel.provider,
            );
            success = true;

            // Cache the response in both Redis and memory
            const estimatedCost = this.estimateCost(
              selectedModel.selectedModel,
              Date.now() - startTime,
            );
            const responseTime = Date.now() - startTime;
            const tokensUsed = Math.ceil(response.length / 4); // Rough estimate

            // Cache in Redis (persistent)
            await redisAICacheService.set(
              enhancedMessages,
              request.featureId,
              selectedModel.selectedModel,
              response,
              {
                cost: estimatedCost,
                tokensUsed,
                responseTime,
              },
              request.userId,
            );

            // Cache in memory (fast access)
            await aiCacheManager.cacheResponse(
              enhancedMessages,
              request.featureId,
              selectedModel.selectedModel,
              response,
              estimatedCost,
              responseTime,
            );
          } catch (primaryError) {
            console.warn(
              `Primary model ${selectedModel.selectedModel} failed, trying fallback:`,
              primaryError,
            );

            // Try fallback model if primary fails
            if (selectedModel.fallbackModel) {
              const fallbackProvider = this.getProviderFromModel(
                selectedModel.fallbackModel,
              );
              response = await this.chat(enhancedMessages, fallbackProvider);
              success = true;

              // Cache fallback response in both systems
              const estimatedCost = this.estimateCost(
                selectedModel.fallbackModel,
                Date.now() - startTime,
              );
              const responseTime = Date.now() - startTime;
              const tokensUsed = Math.ceil(response.length / 4);

              // Cache in Redis
              await redisAICacheService.set(
                enhancedMessages,
                request.featureId,
                selectedModel.fallbackModel,
                response,
                {
                  cost: estimatedCost,
                  tokensUsed,
                  responseTime,
                },
                request.userId,
              );

              // Cache in memory
              await aiCacheManager.cacheResponse(
                enhancedMessages,
                request.featureId,
                selectedModel.fallbackModel,
                response,
                estimatedCost,
                responseTime,
              );

              // Update model selection for next request
              selectedModel.selectedModel = selectedModel.fallbackModel;
              selectedModel.provider = fallbackProvider;
            } else {
              throw primaryError;
            }
          }
        }
      }

      return response;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      // Track usage for analytics and A/B testing
      if (selectedModel) {
        await this.trackUsage({
          featureId: request.featureId,
          model: selectedModel.selectedModel,
          success,
          responseTime: Date.now() - startTime,
          userId: request.userId,
          abTestId: selectedModel.abTestId,
          error: error?.message,
          cacheHit,
        });
      }
    }
  }

  /**
   * Enhanced image analysis with database-driven model selection and intelligent caching
   */
  async enhancedImageAnalysis(request: ImageAnalysisRequest): Promise<string> {
    const startTime = Date.now();
    let selectedModel: ModelSelectionResult | null = null;
    let response: string = "";
    let success = false;
    let error: Error | null = null;
    let cacheHit = false;

    try {
      // Get model configuration from database
      selectedModel = await this.selectModelForFeature(request.featureId);

      if (!selectedModel) {
        throw new Error(
          `No model configuration found for feature: ${request.featureId}`,
        );
      }

      // Only use vision-capable models
      const visionCapableProvider = this.getVisionCapableProvider(
        selectedModel.provider,
      );

      // Apply custom prompts if configured
      const enhancedPrompt = await this.applyCustomPromptToText(
        request.prompt,
        request.featureId,
      );

      // Create cache key data for image analysis (include image hash)
      const imageHash = this.createImageHash(request.image);
      const cacheMessages = [
        {
          role: "user" as const,
          content: `${enhancedPrompt}|IMG:${imageHash}`,
        },
      ];

      // Check cache first
      const cachedResponse = await aiCacheManager.getCachedResponse(
        cacheMessages,
        request.featureId,
        selectedModel.selectedModel,
        { imageHash },
      );

      if (cachedResponse) {
        response = cachedResponse.response;
        success = true;
        cacheHit = true;
        console.log(`Image analysis cache hit for ${request.featureId}`);
      } else {
        // Try primary model first
        try {
          response = await this.analyzeImage({
            ...request,
            prompt: enhancedPrompt,
            model: visionCapableProvider,
          });
          success = true;

          // Cache the response
          const estimatedCost = this.estimateCost(
            selectedModel.selectedModel,
            Date.now() - startTime,
          );
          await aiCacheManager.cacheResponse(
            cacheMessages,
            request.featureId,
            selectedModel.selectedModel,
            response,
            estimatedCost,
            Date.now() - startTime,
            { imageHash },
          );
        } catch (primaryError) {
          console.warn(
            `Primary vision model failed, trying fallback:`,
            primaryError,
          );

          // Try fallback model
          if (selectedModel.fallbackModel) {
            const fallbackProvider = this.getVisionCapableProvider(
              this.getProviderFromModel(selectedModel.fallbackModel),
            );
            response = await this.analyzeImage({
              ...request,
              prompt: enhancedPrompt,
              model: fallbackProvider,
            });
            success = true;

            // Cache fallback response
            const estimatedCost = this.estimateCost(
              selectedModel.fallbackModel,
              Date.now() - startTime,
            );
            await aiCacheManager.cacheResponse(
              cacheMessages,
              request.featureId,
              selectedModel.fallbackModel,
              response,
              estimatedCost,
              Date.now() - startTime,
              { imageHash },
            );
          } else {
            throw primaryError;
          }
        }
      }

      return response;
    } catch (err) {
      error = err as Error;
      throw err;
    } finally {
      // Track usage for analytics
      if (selectedModel) {
        await this.trackUsage({
          featureId: request.featureId,
          model: selectedModel.selectedModel,
          success,
          responseTime: Date.now() - startTime,
          error: error?.message,
          cacheHit,
        });
      }
    }
  }

  /**
   * Select model for feature based on admin configuration and A/B tests
   */
  private async selectModelForFeature(
    featureId: string,
    userId?: string,
  ): Promise<ModelSelectionResult | null> {
    try {
      // Check for active A/B tests first
      const abTest = await this.getActiveABTest(featureId, userId);
      if (abTest) {
        return {
          selectedModel: abTest.selectedModel,
          provider: this.getProviderFromModel(abTest.selectedModel),
          fallbackModel: abTest.fallbackModel,
          abTestId: abTest.testId,
          isABTest: true,
        };
      }

      // Get standard model configuration
      const modelConfig =
        await aiModelConfigService.getModelForFeature(featureId);
      if (!modelConfig) {
        return null;
      }

      return {
        selectedModel: modelConfig.model,
        provider: this.getProviderFromModel(modelConfig.model),
        fallbackModel: modelConfig.fallback,
        isABTest: false,
      };
    } catch (error) {
      console.error("Failed to select model for feature:", error);
      return null;
    }
  }

  /**
   * Apply custom prompts configured by admin
   */
  private async applyCustomPrompts(
    messages: ChatMessage[],
    featureId: string,
  ): Promise<ChatMessage[]> {
    try {
      const response = await fetch(
        `/api/admin/custom-prompts?feature_id=${featureId}`,
      );
      if (!response.ok) return messages;

      const result = await response.json();
      if (!result.success || !result.data?.prompts) return messages;

      // Find active custom prompt for this feature
      const activePrompt = result.data.prompts.find(
        (p: CustomPrompt) => p.feature_id === featureId && p.is_active,
      );

      if (!activePrompt) return messages;

      // Replace or enhance system message
      const enhancedMessages = [...messages];
      const systemMessageIndex = enhancedMessages.findIndex(
        (m) => m.role === "system",
      );

      if (systemMessageIndex >= 0) {
        enhancedMessages[systemMessageIndex] = {
          role: "system",
          content: activePrompt.system_prompt,
        };
      } else {
        enhancedMessages.unshift({
          role: "system",
          content: activePrompt.system_prompt,
        });
      }

      return enhancedMessages;
    } catch (error) {
      console.error("Failed to apply custom prompts:", error);
      return messages;
    }
  }

  /**
   * Apply custom prompt to single text prompt
   */
  private async applyCustomPromptToText(
    prompt: string,
    featureId: string,
  ): Promise<string> {
    try {
      const response = await fetch(
        `/api/admin/custom-prompts?feature_id=${featureId}`,
      );
      if (!response.ok) return prompt;

      const result = await response.json();
      if (!result.success || !result.data?.prompts) return prompt;

      // Find active custom prompt for this feature
      const activePrompt = result.data.prompts.find(
        (p: CustomPrompt) => p.feature_id === featureId && p.is_active,
      );

      if (!activePrompt) return prompt;

      // Combine custom system prompt with user prompt
      return `${activePrompt.system_prompt}\n\nUser request: ${prompt}`;
    } catch (error) {
      console.error("Failed to apply custom prompt to text:", error);
      return prompt;
    }
  }

  /**
   * Get active A/B test for feature and user
   */
  private async getActiveABTest(
    featureId: string,
    userId?: string,
  ): Promise<{
    testId: string;
    selectedModel: string;
    fallbackModel: string;
  } | null> {
    try {
      const response = await fetch(
        `/api/admin/ab-tests?feature_id=${featureId}&active_only=true`,
      );
      if (!response.ok) return null;

      const result = await response.json();
      if (!result.success || !result.data || result.data.length === 0)
        return null;

      const activeTest = result.data[0]; // Get first active test

      // Determine which model to use based on traffic split
      const random = Math.random() * 100;
      const useModelA = random < activeTest.traffic_split;

      return {
        testId: activeTest.id,
        selectedModel: useModelA ? activeTest.model_a : activeTest.model_b,
        fallbackModel: useModelA ? activeTest.model_b : activeTest.model_a,
      };
    } catch (error) {
      console.error("Failed to get A/B test configuration:", error);
      return null;
    }
  }

  /**
   * Get provider from model ID
   */
  private getProviderFromModel(
    modelId: string,
  ): "openai" | "gemini" | "claude" | "grok" {
    if (modelId.includes("gpt")) return "openai";
    if (modelId.includes("gemini")) return "gemini";
    if (modelId.includes("claude")) return "claude";
    if (modelId.includes("grok")) return "grok";

    // Default to openai for unknown models
    return "openai";
  }

  /**
   * Get vision-capable provider or fallback
   */
  private getVisionCapableProvider(
    provider: "openai" | "gemini" | "claude" | "grok",
  ): "openai" | "gemini" {
    if (provider === "openai" || provider === "gemini") {
      return provider;
    }

    // Claude and Grok don't support vision yet, fallback to OpenAI
    return "openai";
  }

  /**
   * Create hash for image content (for caching)
   */
  private createImageHash(image: string): string {
    // Simple hash of first and last 100 characters (in production would use proper image hashing)
    const start = image.substring(0, 100);
    const end = image.substring(Math.max(0, image.length - 100));
    return Buffer.from(start + end)
      .toString("base64")
      .substring(0, 16);
  }

  /**
   * Track model usage with enhanced metadata including cache hits
   */
  private async trackUsage(data: {
    featureId: string;
    model: string;
    success: boolean;
    responseTime: number;
    userId?: string;
    abTestId?: string;
    error?: string;
    cacheHit?: boolean;
    requestId?: string;
  }): Promise<void> {
    try {
      const cost = this.estimateCost(data.model, data.responseTime);
      const provider = this.getProviderFromModel(data.model);

      // Track to analytics stream for real-time processing
      analyticsStream.trackAIRequest({
        featureId: data.featureId,
        model: data.model,
        provider,
        responseTime: data.responseTime,
        tokensUsed: Math.ceil(data.responseTime / 100) * 50, // Rough estimate
        cost,
        cacheHit: data.cacheHit || false,
        success: data.success,
        userId: data.userId,
        error: data.error,
      });

      // Track individual metrics for time-series analysis
      await Promise.all([
        trackAIMetric({
          metricName: "response_time",
          metricValue: data.responseTime,
          featureId: data.featureId,
          modelName: data.model,
          provider,
          operationType: "request",
          success: data.success,
          requestId: data.requestId || `req_${Date.now()}`,
          errorMessage: data.error,
          metadata: {
            tokensUsed: Math.ceil(data.responseTime / 100) * 50,
            cacheHit: data.cacheHit || false,
            cost,
          },
        }),
        trackAIMetric({
          metricName: "cost",
          metricValue: cost,
          featureId: data.featureId,
          modelName: data.model,
          provider,
          operationType: "request",
          success: data.success,
          requestId: data.requestId || `req_${Date.now()}`,
          metadata: {
            responseTime: data.responseTime,
            tokensUsed: Math.ceil(data.responseTime / 100) * 50,
          },
        }),
        data.success
          ? trackAIMetric({
              metricName: "success_rate",
              metricValue: 1,
              featureId: data.featureId,
              modelName: data.model,
              provider,
              operationType: "request",
              success: true,
              requestId: data.requestId || `req_${Date.now()}`,
            })
          : trackAIMetric({
              metricName: "error_rate",
              metricValue: 1,
              featureId: data.featureId,
              modelName: data.model,
              provider,
              operationType: "request",
              success: false,
              requestId: data.requestId || `req_${Date.now()}`,
              errorMessage: data.error,
            }),
      ]).catch((error) => {
        console.error("Failed to track time-series metrics:", error);
        // Don't throw - continue with normal operation
      });

      // Track to model config service for persistence
      await aiModelConfigService.trackModelUsage({
        featureId: data.featureId,
        model: data.model,
        success: data.success,
        responseTime: data.responseTime,
        cost,
        userId: data.userId,
      });

      // Track A/B test result if applicable
      if (data.abTestId) {
        await fetch("/api/admin/ab-tests/track-result", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            test_id: data.abTestId,
            model: data.model,
            success: data.success,
            response_time: data.responseTime,
            error: data.error,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to track enhanced usage:", error);
    }
  }

  /**
   * Estimate cost based on model and response time
   */
  private estimateCost(model: string, responseTime: number): number {
    // Simple cost estimation - in production this would be more sophisticated
    const baseCosts: Record<string, number> = {
      "gpt-4-turbo": 0.03,
      "gpt-4-vision": 0.04,
      "gpt-3.5-turbo": 0.002,
      "gemini-1.5-pro": 0.01,
      "gemini-1.5-flash": 0.0005,
      "claude-3-opus": 0.075,
      "claude-3-sonnet": 0.015,
      "claude-3-haiku": 0.0025,
      "grok-beta": 0.02,
    };

    const baseCost = baseCosts[model] || 0.01;
    const tokenEstimate = Math.ceil(responseTime / 100) * 50; // Rough estimate
    return (tokenEstimate / 1000) * baseCost;
  }
}

// Export singleton instance
export const enhancedAIClient = new EnhancedAIClient();
