/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Gemini-powered insurance-specific AI services optimized for Florida claims"
 * @dependencies ["../providers/gemini.provider", "../strategies/gemini-strategy"]
 * @status stable
 * @ai-integration gemini-2.0
 * @insurance-context florida-claims
 * @supabase-integration edge-functions
 */

import { GeminiProvider } from '../providers/gemini.provider';
import { GeminiStrategy } from '../strategies/gemini-strategy';
import { 
  AIRequest, 
  ImageAnalysisRequest,
  AIProviderConfig 
} from '../types/index';

export interface FloridaClaimAnalysis {
  damageType: 'hurricane' | 'flood' | 'wind' | 'hail' | 'fire' | 'other';
  severity: number; // 1-10 scale
  coverageType: 'HO3' | 'HO6' | 'DP3' | 'flood' | 'windstorm';
  estimatedCost: number;
  repairTimeline: string;
  redFlags: string[];
  documentationStatus: 'complete' | 'partial' | 'insufficient';
  nextSteps: string[];
}

export interface PolicyExtractionResult {
  policyNumber: string;
  carrier: string;
  coverageLimits: {
    dwelling: number;
    personalProperty: number;
    liability: number;
    hurricane: number;
    flood?: number;
  };
  deductibles: {
    standard: number;
    hurricane: number | string; // Can be percentage
    flood?: number;
  };
  exclusions: string[];
  effectiveDate: string;
  expirationDate: string;
  floridaSpecific: {
    sinkholesCovered: boolean;
    ordinanceOrLaw: boolean;
    replacementCost: boolean;
    screenedEnclosure: boolean;
  };
}

export class GeminiInsuranceService {
  private provider: GeminiProvider;
  
  constructor(config: AIProviderConfig) {
    this.provider = new GeminiProvider(config);
  }
  
  /**
   * Analyze hurricane damage using Gemini 2.0's advanced vision
   * FREE with Gemini 2.0 Flash Experimental!
   */
  async analyzeHurricaneDamage(
    images: string[],
    propertyDetails?: Record<string, unknown>
  ): Promise<FloridaClaimAnalysis> {
    const prompt = GeminiStrategy.getInsurancePrompts('florida-hurricane-assessment');
    
    // Process multiple images for comprehensive analysis
    const analyses = await Promise.all(
      images.map(image => 
        this.provider.analyzeImage({
          imageBase64: image,
          prompt: prompt + '\n\nProperty details: ' + JSON.stringify(propertyDetails || {}),
          feature: 'hurricane-analyzer',
          userId: 'system',
          temperature: 0.4, // Lower for consistent analysis
          maxTokens: 8192
        })
      )
    );
    
    // Combine analyses from multiple angles
    const combinedPrompt = `Based on these multiple damage assessments, provide a comprehensive Florida hurricane claim analysis:
    
${analyses.map((a, i) => `Image ${i + 1} Analysis: ${a.text}`).join('\n\n')}

Synthesize into a single comprehensive assessment following Florida insurance requirements.
Format as JSON with: damageType, severity (1-10), coverageType, estimatedCost, repairTimeline, redFlags[], documentationStatus, nextSteps[]`;
    
    const result = await this.provider.generateText({
      prompt: combinedPrompt,
      feature: 'hurricane-analyzer',
      userId: 'system',
      temperature: 0.5,
      maxTokens: 4096,
      responseFormat: 'json'
    });
    
    return JSON.parse(result.text) as FloridaClaimAnalysis;
  }
  
  /**
   * Extract policy details from documents - FREE with Gemini 2.0!
   */
  async extractPolicyDetails(
    documentBase64: string,
    documentType: 'pdf' | 'image'
  ): Promise<PolicyExtractionResult> {
    const prompt = `Extract all insurance policy details from this document. Focus on:
1. Policy number and carrier information
2. Coverage limits (dwelling, personal property, liability)
3. Deductibles (standard and hurricane - note if hurricane is percentage-based)
4. Florida-specific coverages (sinkhole, ordinance/law, replacement cost, screened enclosures)
5. Exclusions and limitations
6. Policy effective and expiration dates

Format the response as structured JSON matching the PolicyExtractionResult interface.
Be precise with numbers and percentages. For hurricane deductibles, preserve percentage format (e.g., "2%" not 0.02).`;
    
    const result = await this.provider.analyzeImage({
      imageBase64: documentBase64,
      prompt,
      feature: 'document-extractor',
      userId: 'system',
      temperature: 0.3, // Very low for accuracy
      maxTokens: 8192
    });
    
    return JSON.parse(result.text) as PolicyExtractionResult;
  }
  
  /**
   * Batch process multiple claims - Optimized for Gemini 2.0's free tier
   */
  async batchProcessClaims(
    claims: Array<{
      id: string;
      images: string[];
      description: string;
    }>
  ): Promise<Map<string, FloridaClaimAnalysis>> {
    const config = GeminiStrategy.getBatchConfiguration(claims.length);
    const results = new Map<string, FloridaClaimAnalysis>();
    
    console.log(`[GeminiInsurance] Processing ${claims.length} claims in batches of ${config.batchSize} using ${config.model}`);
    
    // Process in optimized batches
    for (let i = 0; i < claims.length; i += config.batchSize) {
      const batch = claims.slice(i, i + config.batchSize);
      
      const batchPromises = batch.map(async claim => {
        try {
          const analysis = await this.analyzeHurricaneDamage(
            claim.images,
            { description: claim.description }
          );
          return { id: claim.id, analysis };
        } catch (error) {
          console.error(`[GeminiInsurance] Failed to process claim ${claim.id}:`, error);
          return null;
        }
      });
      
      const batchResults = config.parallel
        ? await Promise.all(batchPromises)
        : await this.processSequentially(batchPromises);
      
      for (const result of batchResults) {
        if (result) {
          results.set(result.id, result.analysis);
        }
      }
    }
    
    return results;
  }
  
  /**
   * Compare multiple insurance policies
   */
  async comparePolicies(
    policies: PolicyExtractionResult[]
  ): Promise<{
    comparison: Record<string, unknown>;
    recommendations: string[];
    bestValue: string;
  }> {
    const prompt = GeminiStrategy.getInsurancePrompts('policy-comparison');
    
    const result = await this.provider.generateText({
      prompt: prompt + '\n\nPolicies to compare:\n' + JSON.stringify(policies, null, 2),
      feature: 'policy-analysis',
      userId: 'system',
      temperature: 0.6,
      maxTokens: 8192,
      responseFormat: 'json'
    });
    
    return JSON.parse(result.text);
  }
  
  /**
   * Generate claim documentation using Gemini's comprehensive output
   */
  async generateClaimReport(
    analysis: FloridaClaimAnalysis,
    policy: PolicyExtractionResult,
    images: string[]
  ): Promise<string> {
    const prompt = `Generate a professional insurance claim report for submission to ${policy.carrier}.

Claim Analysis:
${JSON.stringify(analysis, null, 2)}

Policy Details:
${JSON.stringify(policy, null, 2)}

The report should include:
1. Executive Summary
2. Damage Assessment with severity ratings
3. Coverage Analysis based on policy terms
4. Repair Cost Estimates with breakdown
5. Supporting Documentation checklist
6. Recommended Next Steps
7. Florida-specific compliance notes

Format as a professional report suitable for insurance adjuster review.
Use clear sections, bullet points, and tables where appropriate.`;
    
    const result = await this.provider.generateText({
      prompt,
      feature: 'document-generator',
      userId: 'system',
      temperature: 0.5,
      maxTokens: 8192
    });
    
    return result.text;
  }
  
  /**
   * Validate claim against Florida regulations
   */
  async validateFloridaClaim(
    claimData: Record<string, unknown>
  ): Promise<{
    isValid: boolean;
    violations: string[];
    warnings: string[];
    deadlines: Array<{ task: string; dueDate: string; regulation: string }>;
  }> {
    const prompt = `Validate this insurance claim against Florida insurance regulations:

${JSON.stringify(claimData, null, 2)}

Check for:
1. Compliance with Florida Statute 627
2. Required documentation per FL insurance code
3. Deadline compliance (notice of loss, proof of loss, etc.)
4. Hurricane deductible application rules
5. Assignment of Benefits (AOB) requirements
6. Public adjuster involvement rules

Return a structured validation report with any violations, warnings, and important deadlines.`;
    
    const result = await this.provider.generateText({
      prompt,
      feature: 'florida-regulation-compliance',
      userId: 'system',
      temperature: 0.4,
      maxTokens: 4096,
      responseFormat: 'json'
    });
    
    return JSON.parse(result.text);
  }
  
  /**
   * Helper to process promises sequentially
   */
  private async processSequentially<T>(
    promises: Promise<T>[]
  ): Promise<T[]> {
    const results: T[] = [];
    for (const promise of promises) {
      results.push(await promise);
    }
    return results;
  }
  
  /**
   * Get cost analysis for current usage
   */
  getCostAnalysis(monthlyUsage: {
    hurricaneAnalysis: number;
    policyExtraction: number;
    claimReports: number;
  }): ReturnType<typeof GeminiCostAnalyzer.calculateSavings> {
    // All these are FREE with Gemini 2.0 Flash Experimental!
    const totalVolume = 
      monthlyUsage.hurricaneAnalysis + 
      monthlyUsage.policyExtraction + 
      monthlyUsage.claimReports;
    
    return {
      geminiCost: 0, // FREE!
      openAICost: totalVolume * 0.05, // Approximate GPT-4V cost
      savings: totalVolume * 0.05,
      savingsPercent: 100
    };
  }
}

// Export convenience function for Florida-specific setup
export function createFloridaInsuranceAI(apiKey: string): GeminiInsuranceService {
  return new GeminiInsuranceService({
    apiKey,
    provider: 'gemini',
    model: 'gemini-2.0-flash-exp', // Use free model by default
    maxRetries: 3,
    timeout: 30000
  });
}