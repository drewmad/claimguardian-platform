/**
 * @fileMetadata
 * @purpose "Comprehensive AI feature testing utility for ClaimGuardian"
 * @dependencies ["@/lib/ai/client"]
 * @owner ai-team
 * @status stable
 */

import { AIClient } from "@/lib/ai/client";

export interface AITestResult {
  feature: string;
  provider: string;
  success: boolean;
  responseTime: number;
  response?: string;
  error?: string;
  cost?: number;
  tokensUsed?: number;
}

export interface AIFeatureTestSuite {
  damageAnalysis: AITestResult[];
  inventoryScanning: AITestResult[];
  policyAdvising: AITestResult[];
  documentProcessing: AITestResult[];
}

export class AIFeatureTester {
  private aiClient: AIClient;
  private testResults: AIFeatureTestSuite;

  constructor() {
    this.aiClient = new AIClient();
    this.testResults = {
      damageAnalysis: [],
      inventoryScanning: [],
      policyAdvising: [],
      documentProcessing: [],
    };
  }

  /**
   * Test damage analysis functionality with sample image data
   */
  async testDamageAnalysis(): Promise<AITestResult[]> {
    const sampleDamagePrompt = `Analyze this property damage image and provide:
1. Damage type and severity (1-10 scale)
2. Affected areas and materials
3. Estimated repair timeline
4. Insurance claim recommendations
5. Priority level for repairs

Respond in JSON format with structured damage assessment.`;

    const sampleBase64Image = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD//gA7Q1JFQVRPUjogZ2QtanBlZyB2MS4wICh1c2luZyBJSkcgSlBFRyB2NjIpLCBxdWFsaXR5ID0gOTAK/9sAQwADAgIDAgIDAwMDBAMDBAUIBQUEBAUKBwcGCAwKDAwLCgsLDQ4SEA0OEQ4LCxAWEBETFBUVFQwPFxgWFBgSFBUU"; // Sample 1x1 pixel image

    const providers: ("openai" | "gemini")[] = ["openai", "gemini"];
    const results: AITestResult[] = [];

    for (const provider of providers) {
      const startTime = Date.now();
      try {
        const response = await this.aiClient.analyzeImage({
          image: sampleBase64Image,
          prompt: sampleDamagePrompt,
          model: provider,
        });

        const endTime = Date.now();
        results.push({
          feature: "Damage Analysis",
          provider,
          success: true,
          responseTime: endTime - startTime,
          response: response.substring(0, 500) + "...",
          cost: 0.01, // Estimated cost per request
          tokensUsed: Math.floor(response.length / 4), // Rough token estimation
        });
      } catch (error) {
        const endTime = Date.now();
        results.push({
          feature: "Damage Analysis",
          provider,
          success: false,
          responseTime: endTime - startTime,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    this.testResults.damageAnalysis = results;
    return results;
  }

  /**
   * Test inventory scanning with sample product description
   */
  async testInventoryScanning(): Promise<AITestResult[]> {
    const inventoryPrompts = [
      {
        name: "Electronics Inventory",
        prompt: `You are an AI inventory assistant. Analyze this item description and provide:
1. Item category and subcategory
2. Estimated current market value
3. Depreciation assessment
4. Insurance replacement cost
5. Key specifications to document

Item: "Samsung 65-inch QLED 4K Smart TV, Model QN65Q80A, purchased 2022"
Respond in JSON format.`,
      },
      {
        name: "Jewelry Appraisal",
        prompt: `Analyze this jewelry description for insurance purposes:
1. Material identification and quality assessment
2. Estimated replacement value range
3. Appraisal requirements
4. Documentation recommendations
5. Special care instructions

Item: "14k gold diamond engagement ring, 1.2ct center stone, purchased 2021 for $8,500"
Respond in JSON format.`,
      },
    ];

    const providers: ("openai" | "gemini")[] = ["openai", "gemini"];
    const results: AITestResult[] = [];

    for (const testCase of inventoryPrompts) {
      for (const provider of providers) {
        const startTime = Date.now();
        try {
          const response = await this.aiClient.chat(
            [
              {
                role: "system",
                content: "You are a professional property inventory specialist with expertise in valuation and insurance documentation.",
              },
              {
                role: "user",
                content: testCase.prompt,
              },
            ],
            provider
          );

          const endTime = Date.now();
          results.push({
            feature: `Inventory Scanning - ${testCase.name}`,
            provider,
            success: true,
            responseTime: endTime - startTime,
            response: response.substring(0, 300) + "...",
            cost: 0.005,
            tokensUsed: Math.floor(response.length / 4),
          });
        } catch (error) {
          const endTime = Date.now();
          results.push({
            feature: `Inventory Scanning - ${testCase.name}`,
            provider,
            success: false,
            responseTime: endTime - startTime,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.testResults.inventoryScanning = results;
    return results;
  }

  /**
   * Test policy advisory functionality
   */
  async testPolicyAdvising(): Promise<AITestResult[]> {
    const policyQuestions = [
      {
        name: "Coverage Analysis",
        prompt: `Analyze this insurance policy scenario and provide recommendations:

Property: Single-family home, Cape Coral FL, built 2018, $450K value
Current Coverage: $350K dwelling, $175K personal property, $1M liability
Recent Events: Hurricane Ian impact, minor roof damage, no flooding

Questions:
1. Is coverage adequate for current property value?
2. What additional coverages should be considered?
3. Hurricane-specific recommendations for Florida?
4. Deductible optimization suggestions?
5. Rate reduction opportunities?

Respond with detailed analysis and action items.`,
      },
      {
        name: "Claims Strategy",
        prompt: `Develop a claim strategy for this scenario:

Incident: Water damage from burst pipe, affected kitchen and living room
Initial Assessment: $15K visible damage, potential hidden damage
Insurance Response: Adjuster visit scheduled, preliminary $8K estimate
Timeline: Incident 3 days ago, temporary repairs needed

Provide:
1. Immediate action items for policyholder
2. Documentation requirements
3. Negotiation strategy with adjuster
4. Hidden damage investigation plan
5. Timeline and milestone tracking

Respond with step-by-step action plan.`,
      },
    ];

    const providers: ("openai" | "gemini")[] = ["openai", "gemini"];
    const results: AITestResult[] = [];

    for (const testCase of policyQuestions) {
      for (const provider of providers) {
        const startTime = Date.now();
        try {
          const response = await this.aiClient.chat(
            [
              {
                role: "system",
                content: "You are an expert insurance advisor specializing in Florida property insurance. You have deep knowledge of hurricane damage, water damage claims, and Florida insurance regulations.",
              },
              {
                role: "user",
                content: testCase.prompt,
              },
            ],
            provider
          );

          const endTime = Date.now();
          results.push({
            feature: `Policy Advising - ${testCase.name}`,
            provider,
            success: true,
            responseTime: endTime - startTime,
            response: response.substring(0, 400) + "...",
            cost: 0.008,
            tokensUsed: Math.floor(response.length / 4),
          });
        } catch (error) {
          const endTime = Date.now();
          results.push({
            feature: `Policy Advising - ${testCase.name}`,
            provider,
            success: false,
            responseTime: endTime - startTime,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.testResults.policyAdvising = results;
    return results;
  }

  /**
   * Test document processing capabilities
   */
  async testDocumentProcessing(): Promise<AITestResult[]> {
    const documentScenarios = [
      {
        name: "Policy Extraction",
        prompt: `Extract key information from this insurance policy document:

HOMEOWNER'S INSURANCE POLICY
Policy Number: HO-2024-FL-45678
Effective Date: January 1, 2024 - January 1, 2025
Named Insured: John & Mary Smith
Property Address: 1234 Gulf Coast Blvd, Naples, FL 34102

COVERAGE LIMITS:
Dwelling (Coverage A): $485,000
Other Structures (Coverage B): $48,500
Personal Property (Coverage C): $340,000
Loss of Use (Coverage D): $97,000
Personal Liability: $500,000
Medical Payments: $5,000

DEDUCTIBLES:
All Perils: $2,500
Named Storm: $9,700 (2% of Coverage A)

Extract and structure: policyholder info, coverage limits, deductibles, effective dates, special provisions.`,
      },
      {
        name: "Damage Documentation",
        prompt: `Process this damage report and create structured data:

PROPERTY DAMAGE ASSESSMENT
Date: August 5, 2025
Inspector: Mike Thompson, Licensed Adjuster
Property: 5678 Coastal Ave, Fort Myers, FL

FINDINGS:
- Roof: Missing shingles on south side, estimated 400 sq ft affected
- Windows: Two broken windows on second floor
- Interior: Water damage in master bedroom and hallway
- HVAC: Unit damaged, needs replacement
- Electrical: Panel flooded, safety concerns

ESTIMATES:
Roofing: $8,500
Windows: $1,200
Interior repairs: $12,500
HVAC replacement: $7,800
Electrical work: $3,200

Create structured damage inventory with categories, costs, and priorities.`,
      },
    ];

    const providers: ("openai" | "gemini")[] = ["openai", "gemini"];
    const results: AITestResult[] = [];

    for (const testCase of documentScenarios) {
      for (const provider of providers) {
        const startTime = Date.now();
        try {
          const response = await this.aiClient.chat(
            [
              {
                role: "system",
                content: "You are a document processing AI specializing in insurance and property damage documentation. Extract and structure information accurately for database storage.",
              },
              {
                role: "user",
                content: testCase.prompt,
              },
            ],
            provider
          );

          const endTime = Date.now();
          results.push({
            feature: `Document Processing - ${testCase.name}`,
            provider,
            success: true,
            responseTime: endTime - startTime,
            response: response.substring(0, 400) + "...",
            cost: 0.006,
            tokensUsed: Math.floor(response.length / 4),
          });
        } catch (error) {
          const endTime = Date.now();
          results.push({
            feature: `Document Processing - ${testCase.name}`,
            provider,
            success: false,
            responseTime: endTime - startTime,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.testResults.documentProcessing = results;
    return results;
  }

  /**
   * Run comprehensive test suite for all AI features
   */
  async runFullTestSuite(): Promise<AIFeatureTestSuite> {
    console.log("🤖 Starting ClaimGuardian AI Feature Test Suite...");

    try {
      console.log("📸 Testing Damage Analysis...");
      await this.testDamageAnalysis();

      console.log("📋 Testing Inventory Scanning...");
      await this.testInventoryScanning();

      console.log("📄 Testing Policy Advising...");
      await this.testPolicyAdvising();

      console.log("🔍 Testing Document Processing...");
      await this.testDocumentProcessing();

      console.log("✅ All tests completed!");
      return this.testResults;
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      throw error;
    }
  }

  /**
   * Generate test report summary
   */
  generateTestReport(): string {
    const allResults = [
      ...this.testResults.damageAnalysis,
      ...this.testResults.inventoryScanning,
      ...this.testResults.policyAdvising,
      ...this.testResults.documentProcessing,
    ];

    const totalTests = allResults.length;
    const successfulTests = allResults.filter((r) => r.success).length;
    const totalCost = allResults.reduce((sum, r) => sum + (r.cost || 0), 0);
    const avgResponseTime = allResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;

    const providerStats = allResults.reduce((acc, result) => {
      if (!acc[result.provider]) {
        acc[result.provider] = { success: 0, total: 0, avgTime: 0 };
      }
      acc[result.provider].total++;
      if (result.success) acc[result.provider].success++;
      acc[result.provider].avgTime += result.responseTime;
      return acc;
    }, {} as Record<string, { success: number; total: number; avgTime: number }>);

    // Calculate provider averages
    Object.keys(providerStats).forEach(provider => {
      providerStats[provider].avgTime /= providerStats[provider].total;
    });

    return `
🤖 ClaimGuardian AI Feature Test Report
=========================================

📊 Overall Results:
• Total Tests: ${totalTests}
• Successful: ${successfulTests} (${((successfulTests/totalTests) * 100).toFixed(1)}%)
• Failed: ${totalTests - successfulTests}
• Average Response Time: ${avgResponseTime.toFixed(0)}ms
• Estimated Total Cost: $${totalCost.toFixed(3)}

🔧 Provider Performance:
${Object.entries(providerStats).map(([provider, stats]) => 
  `• ${provider.toUpperCase()}: ${stats.success}/${stats.total} (${((stats.success/stats.total) * 100).toFixed(1)}%) - ${stats.avgTime.toFixed(0)}ms avg`
).join('\n')}

📋 Feature Breakdown:
• Damage Analysis: ${this.testResults.damageAnalysis.filter(r => r.success).length}/${this.testResults.damageAnalysis.length}
• Inventory Scanning: ${this.testResults.inventoryScanning.filter(r => r.success).length}/${this.testResults.inventoryScanning.length}
• Policy Advising: ${this.testResults.policyAdvising.filter(r => r.success).length}/${this.testResults.policyAdvising.length}
• Document Processing: ${this.testResults.documentProcessing.filter(r => r.success).length}/${this.testResults.documentProcessing.length}

❌ Failures:
${allResults.filter(r => !r.success).map(r => 
  `• ${r.feature} (${r.provider}): ${r.error}`
).join('\n') || 'None'}

✅ Test Suite ${successfulTests === totalTests ? 'PASSED' : 'PARTIALLY PASSED'}
`;
  }

  /**
   * Get test results for specific feature
   */
  getFeatureResults(feature: keyof AIFeatureTestSuite): AITestResult[] {
    return this.testResults[feature];
  }

  /**
   * Check if API keys are configured
   */
  async validateAPIKeys(): Promise<{ openai: boolean; gemini: boolean; claude: boolean; grok: boolean }> {
    const validation = {
      openai: false,
      gemini: false,
      claude: false,
      grok: false,
    };

    // Test each provider with a simple request
    try {
      await this.aiClient.chat([{ role: "user", content: "test" }], "openai");
      validation.openai = true;
    } catch (error) {
      // OpenAI key not configured or invalid
    }

    try {
      await this.aiClient.chat([{ role: "user", content: "test" }], "gemini");
      validation.gemini = true;
    } catch (error) {
      // Gemini key not configured or invalid
    }

    try {
      await this.aiClient.chat([{ role: "user", content: "test" }], "claude");
      validation.claude = true;
    } catch (error) {
      // Claude key not configured or invalid
    }

    try {
      await this.aiClient.chat([{ role: "user", content: "test" }], "grok");
      validation.grok = true;
    } catch (error) {
      // Grok key not configured or invalid
    }

    return validation;
  }
}

/**
 * Quick test runner for development
 */
export async function runQuickAITest(): Promise<void> {
  const tester = new AIFeatureTester();
  
  console.log("🔑 Validating API Keys...");
  const keyValidation = await tester.validateAPIKeys();
  console.log("API Key Status:", keyValidation);
  
  if (!keyValidation.openai && !keyValidation.gemini) {
    console.warn("⚠️  No API keys configured. Please set OPENAI_API_KEY or GEMINI_API_KEY environment variables.");
    return;
  }

  console.log("🚀 Running Quick AI Feature Test...");
  const results = await tester.runFullTestSuite();
  
  const report = tester.generateTestReport();
  console.log(report);
}