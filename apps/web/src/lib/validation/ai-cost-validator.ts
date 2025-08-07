/**
 * AI Cost Tracking Validation Service
 * Real API validation and cost accuracy verification for AI services
 */

import { OpenAI } from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/client";

export interface RealAPITestConfig {
  validateOpenAI: boolean;
  validateGemini: boolean;
  testPrompts: string[];
  maxTestCost: number; // Maximum cost allowed for validation tests (in USD)
  recordResults: boolean;
  generateReport: boolean;
}

export interface APIValidationResult {
  provider: "openai" | "gemini";
  model: string;
  prompt: string;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  actualCost: number;
  estimatedCost: number;
  costAccuracy: number; // Percentage accuracy
  latency: number;
  success: boolean;
  error?: string;
  metadata: {
    timestamp: number;
    modelVersion: string;
    usage: Record<string, unknown>;
  };
}

export interface ValidationReport {
  testConfig: RealAPITestConfig;
  timestamp: number;
  duration: number;
  totalCost: number;
  results: APIValidationResult[];
  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    averageCostAccuracy: number;
    totalTokensUsed: number;
    costPerToken: Record<string, number>;
    modelPerformance: Record<
      string,
      {
        averageLatency: number;
        costAccuracy: number;
        reliability: number;
      }
    >;
  };
  recommendations: string[];
}

export class AIContentValidationService {
  private openai?: OpenAI;
  private gemini?: GoogleGenerativeAI;
  private supabase = createClient();

  constructor() {
    // Initialize API clients only if keys are available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (process.env.GEMINI_API_KEY) {
      this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }
  }

  async validateRealAPIUsage(
    config: RealAPITestConfig,
  ): Promise<ValidationReport> {
    console.log("🔍 Starting real API validation tests");
    const startTime = Date.now();
    const results: APIValidationResult[] = [];
    let totalCost = 0;

    // Validate API keys are available
    this.validateAPIKeys(config);

    // Test OpenAI if enabled and available
    if (config.validateOpenAI && this.openai) {
      console.log("🤖 Testing OpenAI API...");
      const openAIResults = await this.testOpenAI(config);
      results.push(...openAIResults);
      totalCost += openAIResults.reduce((sum, r) => sum + r.actualCost, 0);
    }

    // Test Gemini if enabled and available
    if (config.validateGemini && this.gemini) {
      console.log("✨ Testing Gemini API...");
      const geminiResults = await this.testGemini(config);
      results.push(...geminiResults);
      totalCost += geminiResults.reduce((sum, r) => sum + r.actualCost, 0);
    }

    // Check if we exceeded max test cost
    if (totalCost > config.maxTestCost) {
      console.warn(
        `⚠️ Total test cost ($${totalCost.toFixed(4)}) exceeded limit ($${config.maxTestCost})`,
      );
    }

    const endTime = Date.now();
    const report = this.generateValidationReport(
      config,
      startTime,
      endTime,
      results,
      totalCost,
    );

    // Record results to database if enabled
    if (config.recordResults) {
      await this.recordValidationResults(report);
    }

    console.log(`✅ API validation completed in ${endTime - startTime}ms`);
    console.log(`💰 Total cost: $${totalCost.toFixed(6)}`);
    console.log(
      `📊 Success rate: ${report.summary.successfulTests}/${report.summary.totalTests} (${((report.summary.successfulTests / report.summary.totalTests) * 100).toFixed(1)}%)`,
    );

    return report;
  }

  private validateAPIKeys(config: RealAPITestConfig): void {
    const missingKeys: string[] = [];

    if (config.validateOpenAI && !process.env.OPENAI_API_KEY) {
      missingKeys.push("OPENAI_API_KEY");
    }

    if (config.validateGemini && !process.env.GEMINI_API_KEY) {
      missingKeys.push("GEMINI_API_KEY");
    }

    if (missingKeys.length > 0) {
      throw new Error(`Missing required API keys: ${missingKeys.join(", ")}`);
    }
  }

  private async testOpenAI(
    config: RealAPITestConfig,
  ): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];
    const models = ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo"];

    for (const model of models) {
      for (const prompt of config.testPrompts) {
        try {
          const result = await this.testOpenAIModel(model, prompt);
          results.push(result);

          // Small delay between requests to be respectful to API
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          results.push({
            provider: "openai",
            model,
            prompt,
            tokens: { input: 0, output: 0, total: 0 },
            actualCost: 0,
            estimatedCost: 0,
            costAccuracy: 0,
            latency: 0,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            metadata: {
              timestamp: Date.now(),
              modelVersion: model,
              usage: {},
            },
          });
        }
      }
    }

    return results;
  }

  private async testOpenAIModel(
    model: string,
    prompt: string,
  ): Promise<APIValidationResult> {
    const startTime = Date.now();

    // Get our estimated cost before making the request
    const estimatedTokens = this.estimateTokenCount(prompt);
    const estimatedCost = this.calculateOpenAICost(
      model,
      estimatedTokens,
      estimatedTokens,
    );

    const response = await this.openai!.chat.completions.create({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 150, // Keep responses short for cost control
      temperature: 0.7,
    });

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Extract actual usage data
    const usage = response.usage!;
    const actualCost = this.calculateOpenAICost(
      model,
      usage.prompt_tokens,
      usage.completion_tokens,
    );
    const costAccuracy =
      Math.abs(1 - Math.abs(actualCost - estimatedCost) / actualCost) * 100;

    return {
      provider: "openai",
      model,
      prompt,
      tokens: {
        input: usage.prompt_tokens,
        output: usage.completion_tokens,
        total: usage.total_tokens,
      },
      actualCost,
      estimatedCost,
      costAccuracy,
      latency,
      success: true,
      metadata: {
        timestamp: startTime,
        modelVersion: model,
        usage: {
          prompt_tokens: usage.prompt_tokens,
          completion_tokens: usage.completion_tokens,
          total_tokens: usage.total_tokens,
          response_length: response.choices[0]?.message?.content?.length || 0,
        },
      },
    };
  }

  private async testGemini(
    config: RealAPITestConfig,
  ): Promise<APIValidationResult[]> {
    const results: APIValidationResult[] = [];
    const models = ["gemini-1.5-flash", "gemini-1.5-pro"];

    for (const modelName of models) {
      for (const prompt of config.testPrompts) {
        try {
          const result = await this.testGeminiModel(modelName, prompt);
          results.push(result);

          // Small delay between requests
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } catch (error) {
          results.push({
            provider: "gemini",
            model: modelName,
            prompt,
            tokens: { input: 0, output: 0, total: 0 },
            actualCost: 0,
            estimatedCost: 0,
            costAccuracy: 0,
            latency: 0,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            metadata: {
              timestamp: Date.now(),
              modelVersion: modelName,
              usage: {},
            },
          });
        }
      }
    }

    return results;
  }

  private async testGeminiModel(
    model: string,
    prompt: string,
  ): Promise<APIValidationResult> {
    const startTime = Date.now();

    // Get our estimated cost before making the request
    const estimatedTokens = this.estimateTokenCount(prompt);
    const estimatedCost = this.calculateGeminiCost(
      model,
      estimatedTokens,
      estimatedTokens,
    );

    const genModel = this.gemini!.getGenerativeModel({ model });
    const result = await genModel.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.7,
      },
    });

    const endTime = Date.now();
    const latency = endTime - startTime;

    // Extract usage data - Gemini provides token counts in usage metadata
    const response = result.response;
    const usageMetadata = response.usageMetadata;

    // Calculate actual cost using Gemini pricing
    const inputTokens = usageMetadata?.promptTokenCount || estimatedTokens;
    const outputTokens = usageMetadata?.candidatesTokenCount || estimatedTokens;
    const actualCost = this.calculateGeminiCost(
      model,
      inputTokens,
      outputTokens,
    );
    const costAccuracy =
      Math.abs(1 - Math.abs(actualCost - estimatedCost) / actualCost) * 100;

    return {
      provider: "gemini",
      model,
      prompt,
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      },
      actualCost,
      estimatedCost,
      costAccuracy,
      latency,
      success: true,
      metadata: {
        timestamp: startTime,
        modelVersion: model,
        usage: {
          promptTokenCount: inputTokens,
          candidatesTokenCount: outputTokens,
          totalTokenCount: inputTokens + outputTokens,
          response_length: response.text()?.length || 0,
        },
      },
    };
  }

  private estimateTokenCount(text: string): number {
    // Simple estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  private calculateOpenAICost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    // OpenAI pricing (as of 2024) per 1000 tokens
    const pricing: Record<string, { input: number; output: number }> = {
      "gpt-4o": { input: 0.005, output: 0.015 },
      "gpt-4o-mini": { input: 0.00015, output: 0.0006 },
      "gpt-3.5-turbo": { input: 0.001, output: 0.002 },
    };

    const modelPricing = pricing[model] || pricing["gpt-3.5-turbo"];

    return (
      (inputTokens / 1000) * modelPricing.input +
      (outputTokens / 1000) * modelPricing.output
    );
  }

  private calculateGeminiCost(
    model: string,
    inputTokens: number,
    outputTokens: number,
  ): number {
    // Gemini pricing (as of 2024) per 1000 tokens
    const pricing: Record<string, { input: number; output: number }> = {
      "gemini-1.5-flash": { input: 0.00015, output: 0.0006 },
      "gemini-1.5-pro": { input: 0.0035, output: 0.0105 },
    };

    const modelPricing = pricing[model] || pricing["gemini-1.5-flash"];

    return (
      (inputTokens / 1000) * modelPricing.input +
      (outputTokens / 1000) * modelPricing.output
    );
  }

  private generateValidationReport(
    config: RealAPITestConfig,
    startTime: number,
    endTime: number,
    results: APIValidationResult[],
    totalCost: number,
  ): ValidationReport {
    const duration = endTime - startTime;
    const successfulTests = results.filter((r) => r.success).length;
    const failedTests = results.length - successfulTests;

    // Calculate average cost accuracy
    const successfulResults = results.filter((r) => r.success);
    const averageCostAccuracy =
      successfulResults.length > 0
        ? successfulResults.reduce((sum, r) => sum + r.costAccuracy, 0) /
          successfulResults.length
        : 0;

    // Calculate total tokens used
    const totalTokensUsed = results.reduce((sum, r) => sum + r.tokens.total, 0);

    // Calculate cost per token by provider
    const costPerToken: Record<string, number> = {};
    const providerCosts = results.reduce(
      (acc, r) => {
        if (r.success) {
          if (!acc[r.provider]) acc[r.provider] = { cost: 0, tokens: 0 };
          acc[r.provider].cost += r.actualCost;
          acc[r.provider].tokens += r.tokens.total;
        }
        return acc;
      },
      {} as Record<string, { cost: number; tokens: number }>,
    );

    Object.entries(providerCosts).forEach(([provider, data]) => {
      costPerToken[provider] = data.tokens > 0 ? data.cost / data.tokens : 0;
    });

    // Calculate model performance metrics
    const modelPerformance: Record<
      string,
      { averageLatency: number; costAccuracy: number; reliability: number }
    > = {};
    const modelGroups = results.reduce(
      (acc, r) => {
        const key = `${r.provider}-${r.model}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(r);
        return acc;
      },
      {} as Record<string, APIValidationResult[]>,
    );

    Object.entries(modelGroups).forEach(([modelKey, modelResults]) => {
      const successfulModelResults = modelResults.filter((r) => r.success);
      modelPerformance[modelKey] = {
        averageLatency:
          successfulModelResults.length > 0
            ? successfulModelResults.reduce((sum, r) => sum + r.latency, 0) /
              successfulModelResults.length
            : 0,
        costAccuracy:
          successfulModelResults.length > 0
            ? successfulModelResults.reduce(
                (sum, r) => sum + r.costAccuracy,
                0,
              ) / successfulModelResults.length
            : 0,
        reliability:
          (successfulModelResults.length / modelResults.length) * 100,
      };
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      results,
      modelPerformance,
      averageCostAccuracy,
    );

    return {
      testConfig: config,
      timestamp: startTime,
      duration,
      totalCost,
      results,
      summary: {
        totalTests: results.length,
        successfulTests,
        failedTests,
        averageCostAccuracy,
        totalTokensUsed,
        costPerToken,
        modelPerformance,
      },
      recommendations,
    };
  }

  private generateRecommendations(
    results: APIValidationResult[],
    modelPerformance: Record<
      string,
      { averageLatency: number; costAccuracy: number; reliability: number }
    >,
    averageCostAccuracy: number,
  ): string[] {
    const recommendations: string[] = [];

    // Cost accuracy recommendations
    if (averageCostAccuracy < 90) {
      recommendations.push(
        "Consider improving token estimation algorithms - cost accuracy is below 90%",
      );
    } else if (averageCostAccuracy > 95) {
      recommendations.push(
        "Excellent cost estimation accuracy - current implementation is reliable",
      );
    }

    // Model performance recommendations
    const sortedModels = Object.entries(modelPerformance).sort(
      (a, b) =>
        b[1].reliability * b[1].costAccuracy -
        a[1].reliability * a[1].costAccuracy,
    );

    if (sortedModels.length > 0) {
      recommendations.push(
        `Best performing model: ${sortedModels[0][0]} (${sortedModels[0][1].reliability.toFixed(1)}% reliability, ${sortedModels[0][1].costAccuracy.toFixed(1)}% cost accuracy)`,
      );
    }

    // Cost efficiency recommendations
    const providerCosts = results.reduce(
      (acc, r) => {
        if (r.success) {
          if (!acc[r.provider]) acc[r.provider] = { cost: 0, tokens: 0 };
          acc[r.provider].cost += r.actualCost;
          acc[r.provider].tokens += r.tokens.total;
        }
        return acc;
      },
      {} as Record<string, { cost: number; tokens: number }>,
    );

    const costPerToken = Object.entries(providerCosts)
      .map(([provider, data]) => ({
        provider,
        costPerToken: data.tokens > 0 ? data.cost / data.tokens : 0,
      }))
      .sort((a, b) => a.costPerToken - b.costPerToken);

    if (costPerToken.length > 1) {
      recommendations.push(
        `Most cost-effective provider: ${costPerToken[0].provider} ($${(costPerToken[0].costPerToken * 1000).toFixed(6)}/1k tokens)`,
      );
    }

    // Error rate recommendations
    const errorRate =
      (results.filter((r) => !r.success).length / results.length) * 100;
    if (errorRate > 10) {
      recommendations.push(
        `High error rate detected (${errorRate.toFixed(1)}%) - check API key configuration and rate limits`,
      );
    }

    // Latency recommendations
    const avgLatency =
      results.filter((r) => r.success).reduce((sum, r) => sum + r.latency, 0) /
      results.filter((r) => r.success).length;
    if (avgLatency > 5000) {
      recommendations.push(
        `High average latency detected (${avgLatency.toFixed(0)}ms) - consider implementing request caching or optimization`,
      );
    }

    return recommendations;
  }

  private async recordValidationResults(
    report: ValidationReport,
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from("ai_validation_reports")
        .insert({
          timestamp: new Date(report.timestamp).toISOString(),
          duration: report.duration,
          total_cost: report.totalCost,
          total_tests: report.summary.totalTests,
          successful_tests: report.summary.successfulTests,
          failed_tests: report.summary.failedTests,
          average_cost_accuracy: report.summary.averageCostAccuracy,
          total_tokens_used: report.summary.totalTokensUsed,
          model_performance: report.summary.modelPerformance,
          recommendations: report.recommendations,
          detailed_results: report.results,
        });

      if (error) {
        console.error("Failed to record validation results:", error);
      } else {
        console.log("✅ Validation results recorded to database");
      }
    } catch (error) {
      console.error("Error recording validation results:", error);
    }
  }

  // Public methods for different validation scenarios
  async validateDamageAnalyzer(): Promise<ValidationReport> {
    return this.validateRealAPIUsage({
      validateOpenAI: true,
      validateGemini: true,
      testPrompts: [
        "Analyze this property damage: roof has missing shingles, water stains visible on ceiling, gutters are damaged. Estimate repair costs and severity.",
        "Property damage assessment: cracked foundation wall, multiple cracks about 2-3 feet long, no immediate structural failure. Provide analysis.",
        "Storm damage evaluation: broken windows on east side, siding damage, fence knocked down, landscaping destroyed. What's the priority?",
      ],
      maxTestCost: 0.5, // $0.50 maximum
      recordResults: true,
      generateReport: true,
    });
  }

  async validatePolicyAdvisor(): Promise<ValidationReport> {
    return this.validateRealAPIUsage({
      validateOpenAI: true,
      validateGemini: true,
      testPrompts: [
        "I have a homeowners policy with State Farm. My roof was damaged in a hurricane. What coverage applies and what should I expect?",
        "Explain the difference between replacement cost and actual cash value for property insurance claims in Florida.",
        "My insurance company is offering a settlement that seems low. What factors determine claim payouts and how can I negotiate?",
      ],
      maxTestCost: 0.3,
      recordResults: true,
      generateReport: true,
    });
  }

  async validateInventoryScanner(): Promise<ValidationReport> {
    return this.validateRealAPIUsage({
      validateOpenAI: true,
      validateGemini: true,
      testPrompts: [
        "Categorize and estimate values for these household items: 65-inch Samsung TV, leather sectional sofa, KitchenAid stand mixer, Persian area rug 8x10",
        "Home inventory assessment: dining room set (table + 6 chairs), China cabinet, fine China set, crystal glassware, artwork collection",
        "Electronics inventory: MacBook Pro 16-inch, iPhone 15 Pro, iPad Air, AirPods Pro, gaming console, smart home devices",
      ],
      maxTestCost: 0.25,
      recordResults: true,
      generateReport: true,
    });
  }

  async validateAllAIFeatures(): Promise<ValidationReport[]> {
    console.log(
      "🔍 Running comprehensive AI cost validation across all features",
    );

    const results = await Promise.all([
      this.validateDamageAnalyzer(),
      this.validatePolicyAdvisor(),
      this.validateInventoryScanner(),
    ]);

    console.log("📊 Validation Summary:");
    results.forEach((report, index) => {
      const featureNames = [
        "Damage Analyzer",
        "Policy Advisor",
        "Inventory Scanner",
      ];
      console.log(
        `  ${featureNames[index]}: $${report.totalCost.toFixed(6)} (${report.summary.successfulTests}/${report.summary.totalTests} passed, ${report.summary.averageCostAccuracy.toFixed(1)}% accuracy)`,
      );
    });

    const totalCost = results.reduce((sum, r) => sum + r.totalCost, 0);
    console.log(`💰 Total validation cost: $${totalCost.toFixed(6)}`);

    return results;
  }
}

// Export convenience functions
export const validateAICosts = new AIContentValidationService();

export async function runProductionAIValidation(): Promise<ValidationReport[]> {
  console.log("🚀 Starting production AI cost validation");

  try {
    const results = await validateAICosts.validateAllAIFeatures();

    console.log("✅ Production validation completed successfully");
    return results;
  } catch (error) {
    console.error("❌ Production validation failed:", error);
    throw error;
  }
}

export default AIContentValidationService;
