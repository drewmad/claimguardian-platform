/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose Multi-modal AI provider orchestration with xAI Grok integration
 * @dependencies ["openai", "@google/generative-ai", "@anthropic-ai/sdk"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context document-extraction
 * @florida-specific true
 */

import { logger } from "../logger";

// Lazy load AI providers to reduce initial bundle size
const loadOpenAI = () => import("openai");
const loadAnthropic = () => import("@anthropic-ai/sdk");
const loadGoogleAI = () => import("@google/generative-ai");

// Type imports only (no runtime impact)
import type { GoogleGenerativeAI } from "@google/generative-ai";
import type OpenAI from "openai";
import type Anthropic from "@anthropic-ai/sdk";

// Type definitions for better type safety
export type DocumentType = 
  | "invoice" 
  | "receipt" 
  | "policy" 
  | "contract" 
  | "report" 
  | "legal" 
  | "medical" 
  | "general";

export interface FloridaContext {
  hurricane?: boolean;
  flood?: boolean;
  windMitigation?: string[];
  floodZone?: string;
  femaDeclaration?: string;
  buildingCode?: string;
  sinkholeRisk?: boolean;
}

export interface ExtractedEntity {
  type: string;
  value: string;
  confidence: number;
}

export interface ExtractedAmount {
  value: number;
  type: string;
  currency?: string;
  confidence: number;
}

export interface DamageAssessment {
  severity: "minor" | "moderate" | "severe" | "catastrophic";
  types: string[];
  estimatedCost: number;
  confidence: number;
}

export interface DetectedAnomaly {
  type: string;
  description: string;
  confidence: number;
  severity: "low" | "medium" | "high";
}

export interface DocumentAnalysisResult {
  documentType?: DocumentType;
  category?: string;
  dates?: string[];
  amounts?: ExtractedAmount[];
  entities?: Record<string, ExtractedEntity>;
  damageAssessment?: DamageAssessment;
  anomalies?: DetectedAnomaly[];
  suggestedName?: string;
  associations?: Array<{
    type: string;
    id: string;
    confidence: number;
  }>;
  confidence?: number;
  floridaSpecific?: FloridaContext;
  providerInsights?: Array<{
    provider: string;
    uniqueFindings: Array<{
      field: string;
      value: unknown;
    }>;
  }>;
}

export interface AnalysisResponse {
  result: DocumentAnalysisResult;
  confidence: number;
  rawText?: string;
  metadata?: Record<string, unknown>;
  providerInsights?: Array<{
    provider: string;
    uniqueFindings: Array<{
      field: string;
      value: unknown;
    }>;
  }>;
}

export interface ProviderAnalysis {
  provider: string;
  result: DocumentAnalysisResult;
  processingTime?: number;
  error?: string;
}

export interface AnalysisInput {
  fileData: Blob;
  documentType?: DocumentType;
  floridaContext?: FloridaContext;
}

export interface AnalysisConsensus {
  consensus: DocumentAnalysisResult;
  providers: ProviderAnalysis[];
  confidence: number;
  processingTime: number;
}

export interface AIProvider {
  name: string;
  analyze: (data: AnalysisInput) => Promise<DocumentAnalysisResult>;
  confidence: number;
  specialties: Array<DocumentType | string>;
}

export interface AIConfig {
  openaiKey?: string;
  geminiKey?: string;
  anthropicKey?: string;
  xaiKey?: string;
}

export class MultiModalAIOrchestrator {
  private providers: Map<string, AIProvider> = new Map();
  private readonly module = "multi-modal-ai";

  constructor(private config: AIConfig) {
    this.initializeProviders();
    logger.info("MultiModalAIOrchestrator initialized", {
      module: this.module,
      providersCount: this.providers.size,
    });
  }

  private initializeProviders() {
    // OpenAI GPT-4 Vision for general document analysis
    if (this.config.openaiKey) {
      this.providers.set("openai", {
        name: "OpenAI GPT-4 Vision",
        analyze: this.analyzeWithOpenAI.bind(this),
        confidence: 0.9,
        specialties: ["invoices", "receipts", "contracts", "general"],
      });
    }

    // Google Gemini for complex multi-page documents
    if (this.config.geminiKey) {
      this.providers.set("gemini", {
        name: "Google Gemini Pro Vision",
        analyze: this.analyzeWithGemini.bind(this),
        confidence: 0.88,
        specialties: ["policies", "reports", "multi-page", "handwritten"],
      });
    }

    // Anthropic Claude for nuanced understanding
    if (this.config.anthropicKey) {
      this.providers.set("claude", {
        name: "Anthropic Claude 3",
        analyze: this.analyzeWithClaude.bind(this),
        confidence: 0.92,
        specialties: [
          "legal",
          "medical",
          "complex-reasoning",
          "florida-regulations",
        ],
      });
    }

    // xAI Grok for cutting-edge multi-modal analysis
    if (this.config.xaiKey) {
      this.providers.set("xai", {
        name: "xAI Grok",
        analyze: this.analyzeWithXAI.bind(this),
        confidence: 0.95,
        specialties: [
          "damage-assessment",
          "real-time",
          "anomaly-detection",
          "hurricane-damage",
        ],
      });
    }
  }

  async analyzeDocument(
    fileData: Blob,
    documentType?: DocumentType,
    floridaContext?: FloridaContext,
  ): Promise<AnalysisConsensus> {
    const startTime = Date.now();
    
    logger.info("Starting document analysis", {
      module: this.module,
      documentType,
      fileSize: fileData.size,
      fileType: fileData.type,
    });
    try {
      // Select optimal providers based on document type
      const selectedProviders = this.selectProviders(
        documentType,
        floridaContext,
      );

      logger.debug("Selected providers for analysis", {
        module: this.module,
        providers: selectedProviders.map(p => p.name),
        count: selectedProviders.length,
      });

      // Run parallel analysis with all selected providers
      const analyses = await Promise.allSettled(
        selectedProviders.map(async (provider): Promise<ProviderAnalysis> => {
          const providerStartTime = Date.now();
          try {
            const result = await provider.analyze({
              fileData,
              documentType,
              floridaContext,
            });
            
            const processingTime = Date.now() - providerStartTime;
            
            logger.debug("Provider analysis completed", {
              module: this.module,
              provider: provider.name,
              processingTime,
              success: true,
            });
            
            return {
              provider: provider.name,
              result,
              processingTime,
            };
          } catch (error) {
            const processingTime = Date.now() - providerStartTime;
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            
            logger.error("Provider analysis failed", {
              module: this.module,
              provider: provider.name,
              processingTime,
              error: errorMessage,
            }, error instanceof Error ? error : new Error(errorMessage));
            
            return {
              provider: provider.name,
              result: {} as DocumentAnalysisResult,
              processingTime,
              error: errorMessage,
            };
          }
        }),
      );

      // Process results
      const successfulAnalyses: ProviderAnalysis[] = analyses
        .filter((r): r is PromiseFulfilledResult<ProviderAnalysis> => r.status === "fulfilled")
        .map((r) => r.value)
        .filter(analysis => !analysis.error);

      const failedAnalyses = analyses
        .filter((r) => r.status === "rejected" || 
          (r.status === "fulfilled" && r.value.error))
        .length;

      if (successfulAnalyses.length === 0) {
        const error = new Error("All AI providers failed to analyze the document");
        logger.error("Document analysis completely failed", {
          module: this.module,
          failedProviders: failedAnalyses,
          totalProviders: analyses.length,
        }, error);
        throw error;
      }

      logger.info("Provider analyses completed", {
        module: this.module,
        successful: successfulAnalyses.length,
        failed: failedAnalyses,
        total: analyses.length,
      });

      // Build consensus from multiple AI providers
      const consensus = this.buildConsensus(successfulAnalyses);

      // Calculate overall confidence
      const confidence = this.calculateConfidence(successfulAnalyses, consensus);
      
      const totalProcessingTime = Date.now() - startTime;
      
      logger.info("Document analysis completed", {
        module: this.module,
        consensus: {
          documentType: consensus.documentType,
          confidence,
          entitiesFound: Object.keys(consensus.entities || {}).length,
          amountsFound: consensus.amounts?.length || 0,
          anomaliesFound: consensus.anomalies?.length || 0,
        },
        totalProcessingTime,
        providersUsed: successfulAnalyses.map(a => a.provider),
      });

      return {
        consensus,
        providers: successfulAnalyses,
        confidence,
        processingTime: totalProcessingTime,
      };
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : "Unknown analysis error";
      
      logger.error("Document analysis failed", {
        module: this.module,
        documentType,
        fileSize: fileData.size,
        processingTime: totalProcessingTime,
        error: errorMessage,
      }, error instanceof Error ? error : new Error(errorMessage));
      
      throw error;
    }
  }

  private selectProviders(
    documentType?: DocumentType,
    floridaContext?: FloridaContext,
  ): AIProvider[] {
    logger.debug("Selecting optimal providers", {
      module: this.module,
      documentType,
      floridaContext: floridaContext ? Object.keys(floridaContext) : [],
    });
    const providers = Array.from(this.providers.values());

    // For Florida hurricane/flood claims, prioritize xAI and Claude
    if (floridaContext?.hurricane || floridaContext?.flood) {
      return providers
        .sort((a, b) => {
          if (a.name.includes("xAI")) return -1;
          if (b.name.includes("xAI")) return 1;
          if (a.name.includes("Claude")) return -1;
          if (b.name.includes("Claude")) return 1;
          return 0;
        })
        .slice(0, 3);
    }

    // For complex documents, use all available providers
    if (documentType === "policy" || documentType === "legal") {
      return providers;
    }

    // Default: use top 2 providers by confidence
    return providers.sort((a, b) => b.confidence - a.confidence).slice(0, 2);
  }

  private async analyzeWithOpenAI(data: AnalysisInput): Promise<DocumentAnalysisResult> {
    logger.debug("Starting OpenAI analysis", {
      module: this.module,
      provider: "OpenAI GPT-4 Vision",
      fileSize: data.fileData.size,
    });
    
    try {
      const { default: OpenAI } = await loadOpenAI();
      const openai = new OpenAI({ apiKey: this.config.openaiKey! });
      const base64 = await this.fileToBase64(data.fileData);

      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert document analyzer for Florida insurance claims.
              Extract all relevant information and return structured JSON.`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this document. Context: ${JSON.stringify(data.floridaContext || {})}`,
              },
              {
                type: "image_url",
                image_url: { url: `data:${data.fileData.type};base64,${base64}` },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      const result = JSON.parse(content) as DocumentAnalysisResult;
      
      logger.debug("OpenAI analysis completed", {
        module: this.module,
        provider: "OpenAI GPT-4 Vision",
        resultType: result.documentType,
        confidence: result.confidence,
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "OpenAI analysis failed";
      logger.error("OpenAI analysis error", {
        module: this.module,
        provider: "OpenAI GPT-4 Vision",
        error: errorMessage,
      }, error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }

  private async analyzeWithGemini(data: AnalysisInput): Promise<DocumentAnalysisResult> {
    logger.debug("Starting Gemini analysis", {
      module: this.module,
      provider: "Google Gemini Pro Vision",
      fileSize: data.fileData.size,
    });
    
    try {
      const { GoogleGenerativeAI } = await loadGoogleAI();
      const gemini = new GoogleGenerativeAI(this.config.geminiKey!);
      const model = gemini.getGenerativeModel({ model: "gemini-1.5-pro-vision" });

      const base64 = await this.fileToBase64(data.fileData);
      const result = await model.generateContent([
        `Analyze this insurance document for a Florida property claim.
         Extract: document type, dates, amounts, parties, damage descriptions.
         Context: ${JSON.stringify(data.floridaContext || {})}
         Return structured JSON.`,
        { inlineData: { data: base64, mimeType: data.fileData.type } },
      ]);

      const responseText = result.response.text();
      if (!responseText) {
        throw new Error("No response received from Gemini");
      }

      const parsedResult = JSON.parse(responseText) as DocumentAnalysisResult;
      
      logger.debug("Gemini analysis completed", {
        module: this.module,
        provider: "Google Gemini Pro Vision",
        resultType: parsedResult.documentType,
        confidence: parsedResult.confidence,
      });
      
      return parsedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Gemini analysis failed";
      logger.error("Gemini analysis error", {
        module: this.module,
        provider: "Google Gemini Pro Vision",
        error: errorMessage,
      }, error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }

  private async analyzeWithClaude(data: AnalysisInput): Promise<DocumentAnalysisResult> {
    logger.debug("Starting Claude analysis", {
      module: this.module,
      provider: "Anthropic Claude 3",
      fileSize: data.fileData.size,
    });
    
    try {
      const { default: Anthropic } = await loadAnthropic();
      const anthropic = new Anthropic({ apiKey: this.config.anthropicKey! });
      const base64 = await this.fileToBase64(data.fileData);

      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229",
        max_tokens: 4000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this Florida insurance document with special attention to:
                  - Hurricane/flood damage indicators
                  - Policy coverage details
                  - Claim deadlines and requirements
                  - Florida-specific regulations (FLOIR)
                  Context: ${JSON.stringify(data.floridaContext || {})}
                  Return comprehensive structured JSON.`,
              },
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: data.fileData.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                  data: base64,
                },
              },
            ],
          },
        ],
      });

      const content = response.content[0];
      if (!content || content.type !== "text") {
        throw new Error("Invalid response format from Claude");
      }
      
      const result = JSON.parse(content.text) as DocumentAnalysisResult;
      
      logger.debug("Claude analysis completed", {
        module: this.module,
        provider: "Anthropic Claude 3",
        resultType: result.documentType,
        confidence: result.confidence,
      });
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Claude analysis failed";
      logger.error("Claude analysis error", {
        module: this.module,
        provider: "Anthropic Claude 3",
        error: errorMessage,
      }, error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }

  private async analyzeWithXAI(data: AnalysisInput): Promise<DocumentAnalysisResult> {
    logger.debug("Starting xAI analysis", {
      module: this.module,
      provider: "xAI Grok",
      fileSize: data.fileData.size,
    });
    
    try {
      // xAI Grok integration for advanced multi-modal analysis
      // Grok excels at real-time analysis and anomaly detection

      const base64 = await this.fileToBase64(data.fileData);

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.xaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-vision-beta",
          messages: [
            {
              role: "system",
              content: `You are Grok, an advanced AI specialized in Florida property damage assessment.
                Your strengths:
                - Hurricane and flood damage pattern recognition
                - Anomaly detection in insurance documents
                - Real-time damage progression analysis
                - Correlation with weather events and disaster data`,
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Perform comprehensive multi-modal analysis:
                    1. Document classification and information extraction
                    2. Damage assessment if visual damage present
                    3. Anomaly detection (fraudulent patterns, inconsistencies)
                    4. Florida-specific context correlation
                    5. Temporal analysis (damage progression, claim timing)

                    Florida Context: ${JSON.stringify(data.floridaContext || {})}

                    Return detailed JSON with confidence scores for each finding.`,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${data.fileData.type};base64,${base64}`,
                  },
                },
              ],
            },
          ],
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`xAI API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error("No content received from xAI");
      }
      
      const parsedResult = JSON.parse(content) as DocumentAnalysisResult;
      
      logger.debug("xAI analysis completed", {
        module: this.module,
        provider: "xAI Grok",
        resultType: parsedResult.documentType,
        confidence: parsedResult.confidence,
        anomaliesFound: parsedResult.anomalies?.length || 0,
      });
      
      return parsedResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "xAI analysis failed";
      logger.error("xAI analysis error", {
        module: this.module,
        provider: "xAI Grok",
        error: errorMessage,
      }, error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }

  private buildConsensus(analyses: ProviderAnalysis[]): DocumentAnalysisResult {
    if (analyses.length === 0) {
      throw new Error("No successful analyses");
    }

    if (analyses.length === 1) {
      return analyses[0].result;
    }

    // Build consensus from multiple AI providers
    const consensus: DocumentAnalysisResult = {
      documentType: this.findConsensusValue(analyses, "documentType") as DocumentType,
      category: this.findConsensusValue(analyses, "category") as string,
      dates: this.mergeDates(analyses),
      amounts: this.mergeAmounts(analyses),
      entities: this.mergeEntities(analyses),
      damageAssessment: this.mergeDamageAssessments(analyses),
      anomalies: this.mergeAnomalies(analyses),
      suggestedName: this.generateConsensusName(analyses),
      associations: this.mergeAssociations(analyses),
      floridaSpecific: this.mergeFloridaSpecific(analyses),
    };

    // Add provider-specific insights
    consensus.providerInsights = analyses.map((analysis) => ({
      provider: analysis.provider,
      uniqueFindings: this.extractUniqueFindings(analysis.result, consensus),
    }));

    return consensus;
  }

  private findConsensusValue(analyses: ProviderAnalysis[], field: string): unknown {
    const values = analyses.map((a) => a.result[field]).filter((v) => v);
    if (values.length === 0) return null;

    // Find most common value
    const counts = new Map();
    values.forEach((v) => {
      const key = JSON.stringify(v);
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
    return JSON.parse(sorted[0][0]);
  }

  private mergeDates(analyses: ProviderAnalysis[]): string[] {
    const allDates = new Set<string>();
    analyses.forEach((analysis) => {
      if (analysis.result?.dates && Array.isArray(analysis.result.dates)) {
        analysis.result.dates.forEach((d: string) => allDates.add(d));
      }
    });
    return Array.from(allDates).sort();
  }

  private mergeAmounts(analyses: ProviderAnalysis[]): ExtractedAmount[] {
    const amounts: ExtractedAmount[] = [];
    const seen = new Set();

    analyses.forEach((analysis) => {
      if (analysis.result?.amounts && Array.isArray(analysis.result.amounts)) {
        analysis.result.amounts.forEach((amount) => {
          if (amount && typeof amount === 'object' && 'value' in amount && 'type' in amount && 'confidence' in amount) {
            const key = `${amount.value}_${amount.type}`;
            if (!seen.has(key)) {
              seen.add(key);
              amounts.push(amount as ExtractedAmount);
            }
          }
        });
      }
    });

    return amounts;
  }

  private mergeEntities(analyses: ProviderAnalysis[]): Record<string, ExtractedEntity> {
    const entities = {};

    analyses.forEach((a) => {
      if (a.result.entities) {
        Object.assign(entities, a.result.entities);
      }
    });

    return entities;
  }

  private mergeDamageAssessments(analyses: ProviderAnalysis[]): DamageAssessment | null {
    const xaiAnalysis = analyses.find((a) => a.provider === "xAI Grok");
    if (xaiAnalysis?.result?.damageAssessment) {
      return xaiAnalysis.result.damageAssessment;
    }

    // Fallback to other providers
    const assessments = analyses
      .map((a) => a.result.damageAssessment)
      .filter((d) => d);

    if (assessments.length === 0) return null;

    return {
      severity: (this.findConsensusValue(analyses, "damageAssessment.severity") || "moderate") as "minor" | "moderate" | "severe" | "catastrophic",
      types: this.mergeArrays(assessments.map((a) => a.types || [])),
      estimatedCost: this.averageValues(
        assessments.map((a) => a.estimatedCost || 0),
      ),
      confidence: this.averageValues(
        assessments.map((a) => a.confidence || 0.5),
      ),
    };
  }

  private mergeAnomalies(analyses: ProviderAnalysis[]): DetectedAnomaly[] {
    // Prioritize xAI's anomaly detection
    const xaiAnalysis = analyses.find(
      (a) => a.provider === "xAI Grok",
    );
    if (xaiAnalysis?.result?.anomalies) {
      return xaiAnalysis.result.anomalies.filter(this.isValidAnomaly);
    }

    const allAnomalies: DetectedAnomaly[] = [];
    analyses.forEach((analysis) => {
      if (
        analysis.result?.anomalies &&
        Array.isArray(analysis.result.anomalies)
      ) {
        const validAnomalies = analysis.result.anomalies.filter(this.isValidAnomaly);
        allAnomalies.push(...validAnomalies);
      }
    });

    return this.deduplicateAnomalies(allAnomalies);
  }

  private mergeAssociations(analyses: ProviderAnalysis[]): Array<{
    type: string;
    id: string;
    confidence: number;
  }> {
    const associations = new Map<string, { type: string; id: string; confidence: number; }>();

    analyses.forEach((analysis) => {
      if (
        analysis.result?.associations &&
        Array.isArray(analysis.result.associations)
      ) {
        analysis.result.associations.forEach((assoc) => {
          if (this.isValidAssociation(assoc)) {
            const key = `${assoc.type}_${assoc.id}`;
            if (
              !associations.has(key) ||
              assoc.confidence > associations.get(key)!.confidence
            ) {
              associations.set(key, assoc);
            }
          }
        });
      }
    });

    return Array.from(associations.values());
  }

  private mergeFloridaSpecific(analyses: ProviderAnalysis[]): FloridaContext {
    // Combine Florida-specific insights from all providers
    const floridaData: FloridaContext = {
      hurricane: false,
      flood: false,
      windMitigation: [],
      floodZone: undefined,
      femaDeclaration: undefined,
      buildingCode: undefined,
      sinkholeRisk: false,
    };

    analyses.forEach((analysis) => {
      if (analysis.result.floridaSpecific) {
        Object.assign(floridaData, analysis.result.floridaSpecific);
      }
    });

    return floridaData;
  }

  private generateConsensusName(analyses: ProviderAnalysis[]): string {
    const names = analyses.map((analysis) => analysis.result.suggestedName).filter((n) => n);
    if (names.length === 0) return "document_" + Date.now();

    // Use the most detailed/specific name
    return names.sort((a, b) => b!.length - a!.length)[0]!;
  }

  private extractUniqueFindings(
    providerResult: DocumentAnalysisResult,
    consensus: DocumentAnalysisResult,
  ): Array<{
    field: string;
    value: unknown;
  }> {
    const unique: Array<{
      field: string;
      value: unknown;
    }> = [];

    // Find findings unique to this provider
    Object.keys(providerResult).forEach((key) => {
      const typedKey = key as keyof DocumentAnalysisResult;
      if (
        !consensus[typedKey] ||
        JSON.stringify(consensus[typedKey]) !== JSON.stringify(providerResult[typedKey])
      ) {
        unique.push({
          field: key,
          value: providerResult[typedKey],
        });
      }
    });

    return unique;
  }

  private calculateConfidence(analyses: ProviderAnalysis[], consensus: DocumentAnalysisResult): number {
    if (analyses.length === 1) {
      return analyses[0].result.confidence || 0.7;
    }

    // Calculate agreement score
    let agreementScore = 0;
    const fields: (keyof DocumentAnalysisResult)[] = ["documentType", "category", "dates", "amounts"];

    fields.forEach((field) => {
      const values = analyses.map((analysis) => JSON.stringify(analysis.result[field]));
      const uniqueValues = new Set(values).size;
      agreementScore += (analyses.length - uniqueValues + 1) / analyses.length;
    });

    const baseConfidence = agreementScore / fields.length;

    // Boost confidence if xAI is involved (due to its advanced capabilities)
    const hasXAI = analyses.some((analysis) => analysis.provider === "xAI Grok");
    const xaiBoost = hasXAI ? 0.1 : 0;

    return Math.min(baseConfidence + xaiBoost, 0.99);
  }

  private mergeArrays(arrays: string[][]): string[] {
    const merged = new Set<string>();
    arrays.forEach((arr) => {
      if (arr) arr.forEach((item) => merged.add(item));
    });
    return Array.from(merged);
  }

  private averageValues(values: number[]): number {
    const valid = values.filter((v) => v && !isNaN(v));
    if (valid.length === 0) return 0;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
  }

  private deduplicateAnomalies(anomalies: DetectedAnomaly[]): DetectedAnomaly[] {
    const seen = new Set();
    return anomalies.filter((a) => {
      const key = JSON.stringify(a);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private isValidAnomaly(item: unknown): item is DetectedAnomaly {
    if (typeof item !== 'object' || item === null) return false;
    
    const obj = item as Record<string, unknown>;
    return (
      'type' in obj &&
      'description' in obj &&
      'confidence' in obj &&
      'severity' in obj &&
      typeof obj.type === 'string' &&
      typeof obj.description === 'string' &&
      typeof obj.confidence === 'number' &&
      ['low', 'medium', 'high'].includes(obj.severity as string)
    );
  }

  private isValidAssociation(item: unknown): item is { type: string; id: string; confidence: number; } {
    if (typeof item !== 'object' || item === null) return false;
    
    const obj = item as Record<string, unknown>;
    return (
      'type' in obj &&
      'id' in obj &&
      'confidence' in obj &&
      typeof obj.type === 'string' &&
      typeof obj.id === 'string' &&
      typeof obj.confidence === 'number'
    );
  }

  private async fileToBase64(file: Blob): Promise<string> {
    // Use FileReader API for better performance with large files
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Extract base64 part (remove data:mime;base64, prefix)
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }
}
