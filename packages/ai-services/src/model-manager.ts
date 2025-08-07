/**
 * AI Model Manager - Unified interface for managing multiple AI providers
 * Supports OpenAI, Gemini, Anthropic, and xAI models
 */

import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

export type AIProvider = "openai" | "gemini" | "anthropic" | "xai";
export type AIModel =
  | "gpt-4-turbo-preview"
  | "gpt-4-vision-preview"
  | "gpt-3.5-turbo"
  | "gemini-pro"
  | "gemini-pro-vision"
  | "claude-3-opus"
  | "claude-3-sonnet"
  | "grok-1";

export interface AIModelConfig {
  provider: AIProvider;
  model: AIModel;
  apiKey: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

export interface AIResponse {
  content: string;
  model: AIModel;
  provider: AIProvider;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
  metadata?: Record<string, any>;
}

export interface AIImageAnalysis {
  description: string;
  objects: Array<{
    name: string;
    confidence: number;
    boundingBox?: { x: number; y: number; width: number; height: number };
  }>;
  text?: string[];
  damages?: Array<{
    type: string;
    severity: "minor" | "moderate" | "severe" | "total_loss";
    confidence: number;
    estimatedCost?: number;
  }>;
  metadata?: Record<string, any>;
}

class AIModelManager {
  private openaiClient?: OpenAI;
  private geminiClient?: GoogleGenerativeAI;
  private configs: Map<AIProvider, AIModelConfig> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize OpenAI
    const openaiKey =
      process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY;
    if (openaiKey) {
      this.openaiClient = new OpenAI({ apiKey: openaiKey });
      this.configs.set("openai", {
        provider: "openai",
        model: "gpt-4-turbo-preview",
        apiKey: openaiKey,
        temperature: 0.7,
        maxTokens: 2000,
      });
    }

    // Initialize Gemini
    const geminiKey =
      process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (geminiKey) {
      this.geminiClient = new GoogleGenerativeAI(geminiKey);
      this.configs.set("gemini", {
        provider: "gemini",
        model: "gemini-pro",
        apiKey: geminiKey,
        temperature: 0.7,
        maxTokens: 2000,
      });
    }
  }

  /**
   * Get available providers based on configured API keys
   */
  getAvailableProviders(): AIProvider[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Check if a specific provider is available
   */
  isProviderAvailable(provider: AIProvider): boolean {
    return this.configs.has(provider);
  }

  /**
   * Get the best available model for a specific task
   */
  getBestModelForTask(
    task: "text" | "vision" | "analysis" | "fast",
  ): { provider: AIProvider; model: AIModel } | null {
    const taskModels: Record<
      string,
      Array<{ provider: AIProvider; model: AIModel }>
    > = {
      text: [
        { provider: "openai", model: "gpt-4-turbo-preview" },
        { provider: "gemini", model: "gemini-pro" },
        { provider: "anthropic", model: "claude-3-opus" },
      ],
      vision: [
        { provider: "openai", model: "gpt-4-vision-preview" },
        { provider: "gemini", model: "gemini-pro-vision" },
      ],
      analysis: [
        { provider: "openai", model: "gpt-4-turbo-preview" },
        { provider: "anthropic", model: "claude-3-opus" },
      ],
      fast: [
        { provider: "openai", model: "gpt-3.5-turbo" },
        { provider: "gemini", model: "gemini-pro" },
        { provider: "anthropic", model: "claude-3-sonnet" },
      ],
    };

    const models = taskModels[task] || taskModels.text;
    for (const model of models) {
      if (this.isProviderAvailable(model.provider)) {
        return model;
      }
    }

    return null;
  }

  /**
   * Generate text completion using specified or best available model
   */
  async generateText(
    prompt: string,
    options?: {
      provider?: AIProvider;
      model?: AIModel;
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    },
  ): Promise<AIResponse> {
    let provider = options?.provider;
    let model = options?.model;

    // Auto-select if not specified
    if (!provider || !model) {
      const bestModel = this.getBestModelForTask("text");
      if (!bestModel) {
        throw new Error("No AI models available. Please configure API keys.");
      }
      provider = bestModel.provider;
      model = bestModel.model;
    }

    // Validate provider is available
    if (!this.isProviderAvailable(provider)) {
      throw new Error(`Provider ${provider} is not configured`);
    }

    switch (provider) {
      case "openai":
        return this.generateOpenAIText(prompt, model, options);
      case "gemini":
        return this.generateGeminiText(prompt, model, options);
      default:
        throw new Error(`Provider ${provider} not implemented`);
    }
  }

  /**
   * Analyze image using vision models
   */
  async analyzeImage(
    imageData: string | Buffer,
    prompt: string,
    options?: {
      provider?: AIProvider;
      model?: AIModel;
    },
  ): Promise<AIImageAnalysis> {
    let provider = options?.provider;
    let model = options?.model;

    // Auto-select vision model
    if (!provider || !model) {
      const bestModel = this.getBestModelForTask("vision");
      if (!bestModel) {
        throw new Error("No vision models available");
      }
      provider = bestModel.provider;
      model = bestModel.model;
    }

    switch (provider) {
      case "openai":
        return this.analyzeOpenAIImage(imageData, prompt, model);
      case "gemini":
        return this.analyzeGeminiImage(imageData, prompt, model);
      default:
        throw new Error(`Vision not supported for provider ${provider}`);
    }
  }

  /**
   * OpenAI text generation
   */
  private async generateOpenAIText(
    prompt: string,
    model: AIModel,
    options?: any,
  ): Promise<AIResponse> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const messages: any[] = [];
    if (options?.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await this.openaiClient.chat.completions.create({
      model: model === "gpt-4-turbo-preview" ? "gpt-4-1106-preview" : model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2000,
      top_p: options?.topP ?? 1,
      frequency_penalty: options?.frequencyPenalty ?? 0,
      presence_penalty: options?.presencePenalty ?? 0,
    });

    const response = completion.choices[0]?.message?.content || "";
    const usage = completion.usage;

    return {
      content: response,
      model,
      provider: "openai",
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
            cost: this.calculateOpenAICost(
              model,
              usage.prompt_tokens,
              usage.completion_tokens,
            ),
          }
        : undefined,
    };
  }

  /**
   * Gemini text generation
   */
  private async generateGeminiText(
    prompt: string,
    model: AIModel,
    options?: any,
  ): Promise<AIResponse> {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    const geminiModel = this.geminiClient.getGenerativeModel({
      model: model === "gemini-pro" ? "gemini-pro" : "gemini-pro-vision",
    });

    const fullPrompt = options?.systemPrompt
      ? `${options.systemPrompt}\n\n${prompt}`
      : prompt;

    const result = await geminiModel.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      content: text,
      model,
      provider: "gemini",
      usage: {
        promptTokens: 0, // Gemini doesn't provide token counts
        completionTokens: 0,
        totalTokens: 0,
        cost: 0, // Gemini is free during preview
      },
    };
  }

  /**
   * OpenAI image analysis
   */
  private async analyzeOpenAIImage(
    imageData: string | Buffer,
    prompt: string,
    model: AIModel,
  ): Promise<AIImageAnalysis> {
    if (!this.openaiClient) {
      throw new Error("OpenAI client not initialized");
    }

    const base64Image =
      typeof imageData === "string" ? imageData : imageData.toString("base64");

    const analysisPrompt = `${prompt}

Please analyze this image and provide:
1. A detailed description
2. List of objects detected with confidence scores
3. Any visible damage with type, severity (minor/moderate/severe/total_loss), and estimated repair cost
4. Any visible text in the image

Format your response as JSON.`;

    const completion = await this.openaiClient.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: analysisPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content || "{}";

    try {
      const parsed = JSON.parse(response);
      return {
        description: parsed.description || "",
        objects: parsed.objects || [],
        text: parsed.text || [],
        damages: parsed.damages || [],
        metadata: { model, provider: "openai" },
      };
    } catch {
      // Fallback for non-JSON response
      return {
        description: response,
        objects: [],
        damages: [],
        metadata: { model, provider: "openai" },
      };
    }
  }

  /**
   * Gemini image analysis
   */
  private async analyzeGeminiImage(
    imageData: string | Buffer,
    prompt: string,
    model: AIModel,
  ): Promise<AIImageAnalysis> {
    if (!this.geminiClient) {
      throw new Error("Gemini client not initialized");
    }

    const geminiModel = this.geminiClient.getGenerativeModel({
      model: "gemini-pro-vision",
    });

    const base64Image =
      typeof imageData === "string" ? imageData : imageData.toString("base64");

    const analysisPrompt = `${prompt}

Analyze this image and provide:
1. A detailed description
2. List of objects detected
3. Any visible damage with severity
4. Any visible text

Format as JSON if possible.`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg",
      },
    };

    const result = await geminiModel.generateContent([
      analysisPrompt,
      imagePart,
    ]);
    const response = await result.response;
    const text = response.text();

    try {
      const parsed = JSON.parse(text);
      return {
        description: parsed.description || "",
        objects: parsed.objects || [],
        text: parsed.text || [],
        damages: parsed.damages || [],
        metadata: { model, provider: "gemini" },
      };
    } catch {
      // Fallback for non-JSON response
      return {
        description: text,
        objects: [],
        damages: [],
        metadata: { model, provider: "gemini" },
      };
    }
  }

  /**
   * Calculate OpenAI API costs
   */
  private calculateOpenAICost(
    model: AIModel,
    promptTokens: number,
    completionTokens: number,
  ): number {
    const costs: Record<string, { prompt: number; completion: number }> = {
      "gpt-4-turbo-preview": { prompt: 0.01, completion: 0.03 }, // per 1K tokens
      "gpt-4-vision-preview": { prompt: 0.01, completion: 0.03 },
      "gpt-3.5-turbo": { prompt: 0.0005, completion: 0.0015 },
    };

    const modelCost = costs[model] || costs["gpt-3.5-turbo"];
    return (
      (promptTokens * modelCost.prompt) / 1000 +
      (completionTokens * modelCost.completion) / 1000
    );
  }

  /**
   * Stream text generation (for chat interfaces)
   */
  async *streamText(
    prompt: string,
    options?: {
      provider?: AIProvider;
      model?: AIModel;
      systemPrompt?: string;
    },
  ): AsyncGenerator<string, void, unknown> {
    let provider = options?.provider;
    let model = options?.model;

    if (!provider || !model) {
      const bestModel = this.getBestModelForTask("fast");
      if (!bestModel) {
        throw new Error("No AI models available");
      }
      provider = bestModel.provider;
      model = bestModel.model;
    }

    if (provider === "openai" && this.openaiClient) {
      const messages: any[] = [];
      if (options?.systemPrompt) {
        messages.push({ role: "system", content: options.systemPrompt });
      }
      messages.push({ role: "user", content: prompt });

      const stream = await this.openaiClient.chat.completions.create({
        model: model === "gpt-4-turbo-preview" ? "gpt-4-1106-preview" : model,
        messages,
        stream: true,
      });

      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || "";
      }
    } else {
      // Fallback to non-streaming for other providers
      const response = await this.generateText(prompt, options);
      yield response.content;
    }
  }

  /**
   * Get model capabilities
   */
  getModelCapabilities(model: AIModel): {
    supportsVision: boolean;
    supportsStreaming: boolean;
    maxTokens: number;
    costPerMillionTokens: number;
  } {
    const capabilities: Record<AIModel, any> = {
      "gpt-4-turbo-preview": {
        supportsVision: false,
        supportsStreaming: true,
        maxTokens: 128000,
        costPerMillionTokens: 10,
      },
      "gpt-4-vision-preview": {
        supportsVision: true,
        supportsStreaming: true,
        maxTokens: 128000,
        costPerMillionTokens: 10,
      },
      "gpt-3.5-turbo": {
        supportsVision: false,
        supportsStreaming: true,
        maxTokens: 16385,
        costPerMillionTokens: 0.5,
      },
      "gemini-pro": {
        supportsVision: false,
        supportsStreaming: false,
        maxTokens: 30720,
        costPerMillionTokens: 0, // Free during preview
      },
      "gemini-pro-vision": {
        supportsVision: true,
        supportsStreaming: false,
        maxTokens: 30720,
        costPerMillionTokens: 0,
      },
      "claude-3-opus": {
        supportsVision: true,
        supportsStreaming: true,
        maxTokens: 200000,
        costPerMillionTokens: 15,
      },
      "claude-3-sonnet": {
        supportsVision: true,
        supportsStreaming: true,
        maxTokens: 200000,
        costPerMillionTokens: 3,
      },
      "grok-1": {
        supportsVision: false,
        supportsStreaming: true,
        maxTokens: 8192,
        costPerMillionTokens: 5,
      },
    };

    return (
      capabilities[model] || {
        supportsVision: false,
        supportsStreaming: false,
        maxTokens: 4096,
        costPerMillionTokens: 1,
      }
    );
  }
}

// Export singleton instance
export const aiModelManager = new AIModelManager();

// Export convenience functions
export async function generateAIText(
  prompt: string,
  options?: any,
): Promise<AIResponse> {
  return aiModelManager.generateText(prompt, options);
}

export async function analyzeAIImage(
  imageData: string | Buffer,
  prompt: string,
  options?: any,
): Promise<AIImageAnalysis> {
  return aiModelManager.analyzeImage(imageData, prompt, options);
}

export function getAvailableAIProviders(): AIProvider[] {
  return aiModelManager.getAvailableProviders();
}

export function getBestAIModel(task: "text" | "vision" | "analysis" | "fast") {
  return aiModelManager.getBestModelForTask(task);
}
