/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Gemini 2.0 optimized strategy for ClaimGuardian insurance tasks"
 * @dependencies ["@google/generative-ai"]
 * @status stable
 * @ai-integration gemini-specific
 * @insurance-context claims
 * @supabase-integration edge-functions
 */

import { AIRequest, ChatRequest, ImageAnalysisRequest } from '../types/index';

/**
 * Gemini 2.0 Strategy - Optimal Use Cases for ClaimGuardian
 *
 * Based on the latest Gemini updates (Jan 2025):
 * - Gemini 2.0 Flash Experimental: FREE, excellent for high-volume tasks
 * - Gemini 1.5 Pro-002: Better performance, stable for production
 * - Enhanced vision capabilities in 2.0 Flash
 * - 8192 token default output for comprehensive responses
 */

export interface GeminiTaskRecommendation {
  model: 'gemini-2.0-flash-exp' | 'gemini-1.5-pro-002';
  reason: string;
  priority: number; // 1-10, higher is better
  costSavings: number; // Percentage vs alternatives
  features: string[];
}

export class GeminiStrategy {
  /**
   * Determines optimal Gemini model and configuration for specific tasks
   */
  static getOptimalConfiguration(
    taskType: string,
    request: AIRequest | ChatRequest | ImageAnalysisRequest
  ): GeminiTaskRecommendation {
    const taskStrategies: Record<string, GeminiTaskRecommendation> = {
      // HIGH PRIORITY FOR GEMINI 2.0 FLASH (FREE!)
      'document-extraction': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Free processing with excellent OCR and structured data extraction',
        priority: 10,
        costSavings: 100, // 100% savings since it's free
        features: [
          'Multi-page document processing',
          'Table extraction',
          'Form field recognition',
          'Handwriting support'
        ]
      },

      'policy-analysis': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Free long-context analysis (up to 1M tokens input)',
        priority: 10,
        costSavings: 100,
        features: [
          'Full policy document understanding',
          'Cross-reference detection',
          'Exclusion identification',
          'Coverage gap analysis'
        ]
      },

      'damage-assessment': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Superior vision capabilities with zero cost',
        priority: 10,
        costSavings: 100,
        features: [
          'Multi-angle damage analysis',
          'Severity scoring',
          'Repair cost estimation',
          'Before/after comparison'
        ]
      },

      'receipt-scanning': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Excellent OCR with structured data extraction at no cost',
        priority: 10,
        costSavings: 100,
        features: [
          'Line item extraction',
          'Total calculation verification',
          'Vendor information capture',
          'Date/time parsing'
        ]
      },

      'property-imagery': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Advanced vision for property condition assessment',
        priority: 9,
        costSavings: 100,
        features: [
          'Room-by-room analysis',
          'Fixture identification',
          'Condition rating',
          'Square footage estimation'
        ]
      },

      // MEDIUM PRIORITY - USE GEMINI FOR COST EFFICIENCY
      'claim-summarization': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Fast, free summarization with good accuracy',
        priority: 8,
        costSavings: 100,
        features: [
          'Timeline extraction',
          'Key facts highlighting',
          'Action items identification',
          'Risk factor detection'
        ]
      },

      'customer-communication': {
        model: 'gemini-1.5-pro-002',
        reason: 'Stable, professional responses for customer-facing content',
        priority: 7,
        costSavings: 60, // 60% cheaper than GPT-4
        features: [
          'Tone adjustment',
          'Legal compliance checking',
          'Personalization',
          'Multi-language support'
        ]
      },

      // SPECIALIZED USE CASES
      'florida-regulation-compliance': {
        model: 'gemini-1.5-pro-002',
        reason: 'Reliable for complex regulatory analysis',
        priority: 8,
        costSavings: 60,
        features: [
          'Statute interpretation',
          'Deadline calculation',
          'Compliance checking',
          'Filing requirement identification'
        ]
      },

      'hurricane-damage-analysis': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Specialized vision for wind/water damage differentiation',
        priority: 10,
        costSavings: 100,
        features: [
          'Wind vs water damage classification',
          'FEMA category assessment',
          'Structural damage evaluation',
          'Debris impact analysis'
        ]
      },

      'batch-processing': {
        model: 'gemini-2.0-flash-exp',
        reason: 'Free processing for high-volume tasks',
        priority: 10,
        costSavings: 100,
        features: [
          'Parallel processing',
          'Bulk document analysis',
          'Mass data extraction',
          'Report generation'
        ]
      }
    };

    // Default strategy if task type not found
    const defaultStrategy: GeminiTaskRecommendation = {
      model: 'gemini-2.0-flash-exp',
      reason: 'Default to free model for cost optimization',
      priority: 6,
      costSavings: 100,
      features: ['General purpose processing']
    };

    return taskStrategies[taskType] || defaultStrategy;
  }

  /**
   * Determines if Gemini should be preferred over other providers
   */
  static shouldPreferGemini(
    taskType: string,
    costSensitive: boolean = true,
    requiresStability: boolean = false
  ): boolean {
    const recommendation = this.getOptimalConfiguration(taskType, {} as AIRequest);

    // Always prefer Gemini for free tasks
    if (recommendation.costSavings === 100 && costSensitive) {
      return true;
    }

    // Prefer Gemini for high priority tasks
    if (recommendation.priority >= 8) {
      return true;
    }

    // Use stable model if stability required
    if (requiresStability && recommendation.model === 'gemini-1.5-pro-002') {
      return true;
    }

    return recommendation.priority >= 6;
  }

  /**
   * Get optimal parameters for specific Gemini models
   */
  static getOptimalParameters(model: string, taskType: string): Record<string, unknown> {
    const baseParams = {
      maxOutputTokens: 8192,
      temperature: 0.7,
      topP: 0.95
    };

    // Task-specific optimizations
    const taskParams: Record<string, Partial<typeof baseParams>> = {
      'document-extraction': {
        temperature: 0.3, // Lower for accuracy
        maxOutputTokens: 4096 // Usually sufficient for extraction
      },
      'damage-assessment': {
        temperature: 0.4, // Consistent analysis
        maxOutputTokens: 8192 // Detailed reports
      },
      'customer-communication': {
        temperature: 0.8, // More natural responses
        maxOutputTokens: 2048 // Concise messages
      },
      'policy-analysis': {
        temperature: 0.5, // Balanced accuracy
        maxOutputTokens: 8192 // Comprehensive analysis
      }
    };

    const modelSpecific = model.includes('2.0') ?
      { topK: 64 } :
      { topK: 40 };

    return {
      ...baseParams,
      ...taskParams[taskType],
      ...modelSpecific
    };
  }

  /**
   * Insurance-specific Gemini prompts
   */
  static getInsurancePrompts(taskType: string): Record<string, string> {
    return {
      'claim-validation': `You are an expert insurance claim validator. Analyze the provided claim information and:
1. Verify all required documentation is present
2. Check for red flags or inconsistencies
3. Validate coverage based on policy terms
4. Estimate claim value based on damage assessment
5. Recommend next steps for the adjuster

Format your response as structured JSON with sections for: validation_status, missing_items, red_flags, coverage_analysis, value_estimate, and recommendations.`,

      'florida-hurricane-assessment': `You are a Florida hurricane damage assessment specialist. Analyze the provided images and information to:
1. Classify damage type (wind vs. water)
2. Estimate damage severity (1-10 scale)
3. Identify specific damaged components
4. Determine if damage is covered under standard HO3 policy
5. Flag any potential flood damage requiring separate coverage
6. Estimate repair timeline and costs

Consider Florida-specific factors like building codes, impact windows requirements, and hurricane deductibles.`,

      'policy-comparison': `Compare the provided insurance policies and create a detailed analysis including:
1. Coverage differences (dwelling, personal property, liability)
2. Deductible variations (standard vs. hurricane)
3. Exclusions and limitations comparison
4. Premium cost analysis
5. Florida-specific coverage (sinkhole, flood, windstorm)
6. Recommendations based on property location and risk factors

Present findings in a clear, tabular format with recommendations.`
    };
  }

  /**
   * Batch processing optimization for Gemini
   */
  static getBatchConfiguration(itemCount: number): {
    batchSize: number;
    model: string;
    parallel: boolean;
  } {
    // Gemini 2.0 Flash can handle larger batches efficiently
    if (itemCount > 100) {
      return {
        batchSize: 50,
        model: 'gemini-2.0-flash-exp',
        parallel: true
      };
    } else if (itemCount > 20) {
      return {
        batchSize: 20,
        model: 'gemini-2.0-flash-exp',
        parallel: true
      };
    } else {
      return {
        batchSize: itemCount,
        model: 'gemini-2.0-flash-exp',
        parallel: false
      };
    }
  }
}

/**
 * Cost comparison helper
 */
export class GeminiCostAnalyzer {
  static calculateSavings(
    taskType: string,
    monthlyVolume: number
  ): {
    geminiCost: number;
    openAICost: number;
    savings: number;
    savingsPercent: number;
  } {
    const avgTokensPerTask: Record<string, { input: number; output: number }> = {
      'document-extraction': { input: 2000, output: 1000 },
      'damage-assessment': { input: 1000, output: 2000 },
      'policy-analysis': { input: 5000, output: 3000 },
      'customer-communication': { input: 500, output: 500 }
    };

    const tokens = avgTokensPerTask[taskType] || { input: 1000, output: 1000 };

    // Gemini 2.0 Flash Experimental is FREE
    const geminiCostPerTask = 0;

    // GPT-4 Turbo pricing (approximate)
    const gpt4CostPerTask = (tokens.input * 0.01 + tokens.output * 0.03) / 1000;

    const geminiMonthly = geminiCostPerTask * monthlyVolume;
    const openAIMonthly = gpt4CostPerTask * monthlyVolume;
    const savings = openAIMonthly - geminiMonthly;
    const savingsPercent = (savings / openAIMonthly) * 100;

    return {
      geminiCost: geminiMonthly,
      openAICost: openAIMonthly,
      savings,
      savingsPercent
    };
  }
}
