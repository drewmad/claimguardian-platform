/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { AIOrchestrator } from "../../orchestrator/orchestrator";
import { AIRequest, ClarityCalculation } from "../../types/index";

interface ClaimData {
  propertyValue: number;
  damageType: string;
  damageDescription: string;
  coverageType: string;
  deductible: number;
  policyLimits: {
    dwelling?: number;
    personalProperty?: number;
    additionalLiving?: number;
  };
  photos?: string[];
  location?: {
    city: string;
    state: string;
    zipCode: string;
  };
}

interface CalculationStep {
  stepNumber: number;
  description: string;
  value: number;
  explanation: string;
  formula?: string;
  sources: string[];
  confidence: number;
}

export class ClarityService {
  private orchestrator: AIOrchestrator;

  // Insurance calculation constants (Florida-specific)
  private readonly DEPRECIATION_RATES = {
    roof: 0.03, // 3% per year
    siding: 0.02,
    appliances: 0.05,
    flooring: 0.04,
    general: 0.025,
  };

  private readonly FLORIDA_DEDUCTIBLES = {
    hurricane: 0.02, // 2% of dwelling coverage
    flood: 0.01,
    standard: 500,
  };

  constructor(orchestrator: AIOrchestrator) {
    this.orchestrator = orchestrator;
  }

  async calculateClaim(
    claimData: ClaimData,
    userId: string,
  ): Promise<ClarityCalculation> {
    // 1. Generate calculation steps
    const steps = await this.generateCalculationSteps(claimData);

    // 2. Enhance each step with AI explanations
    const explainedSteps = await this.explainSteps(steps, claimData, userId);

    // 3. Calculate total value
    const totalValue = this.calculateTotal(explainedSteps);

    // 4. Generate summary
    const summary = await this.generateSummary(
      explainedSteps,
      totalValue,
      claimData,
      userId,
    );

    return {
      totalValue,
      steps: explainedSteps,
      summary,
      confidence: this.calculateConfidence(explainedSteps),
      lastUpdated: new Date(),
    };
  }

  private async generateCalculationSteps(
    claimData: ClaimData,
  ): Promise<CalculationStep[]> {
    const steps: CalculationStep[] = [];

    // Step 1: Base Replacement Cost
    const replacementCost = await this.calculateReplacementCost(claimData);
    steps.push({
      stepNumber: 1,
      description: "Base Replacement Cost",
      value: replacementCost.value,
      explanation: replacementCost.explanation,
      formula: replacementCost.formula,
      sources: ["Policy Declaration Page", "Coverage A - Dwelling"],
      confidence: 0.95,
    });

    // Step 2: Depreciation (if ACV policy)
    if (claimData.coverageType === "ACV") {
      const depreciation = this.calculateDepreciation(
        replacementCost.value,
        claimData,
      );
      steps.push({
        stepNumber: 2,
        description: "Less: Depreciation",
        value: -depreciation.value,
        explanation: depreciation.explanation,
        formula: depreciation.formula,
        sources: ["Insurance Policy Terms", "Industry Depreciation Tables"],
        confidence: 0.85,
      });
    }

    // Step 3: Apply Policy Limits
    const limitedAmount = this.applyPolicyLimits(
      steps.reduce((sum, step) => sum + step.value, 0),
      claimData,
    );
    if (limitedAmount.limited) {
      steps.push({
        stepNumber: steps.length + 1,
        description: "Policy Limit Adjustment",
        value: limitedAmount.adjustment,
        explanation: limitedAmount.explanation,
        sources: ["Policy Limits Section"],
        confidence: 1.0,
      });
    }

    // Step 4: Deductible
    const deductible = this.calculateDeductible(claimData);
    steps.push({
      stepNumber: steps.length + 1,
      description: "Less: Deductible",
      value: -deductible.value,
      explanation: deductible.explanation,
      formula: deductible.formula,
      sources: ["Policy Declaration Page", "Deductible Schedule"],
      confidence: 1.0,
    });

    // Step 5: Additional Living Expenses (if applicable)
    if (
      claimData.damageType === "total_loss" ||
      claimData.damageType === "major"
    ) {
      const ale = this.calculateALE(claimData);
      steps.push({
        stepNumber: steps.length + 1,
        description: "Additional Living Expenses",
        value: ale.value,
        explanation: ale.explanation,
        sources: ["Coverage D - Loss of Use"],
        confidence: 0.8,
      });
    }

    return steps;
  }

  private async explainSteps(
    steps: CalculationStep[],
    claimData: ClaimData,
    userId: string,
  ): Promise<CalculationStep[]> {
    const explainedSteps = await Promise.all(
      steps.map(async (step) => {
        const request: AIRequest = {
          prompt: `Explain this insurance calculation step in simple terms:
            Step: ${step.description}
            Value: $${Math.abs(step.value).toLocaleString()}
            Formula: ${step.formula || "Standard calculation"}
            Context: ${claimData.damageType} damage in Florida

            Provide a clear, friendly explanation that a homeowner would understand.
            Include why this step is necessary and how it affects their claim.`,
          systemPrompt: `You are Clarity, an AI that explains insurance calculations transparently.
            Use simple language, avoid jargon, and help homeowners understand their claim value.
            Be accurate but accessible. Format: 2-3 sentences maximum.`,
          userId,
          feature: "clarity",
          temperature: 0.3,
          maxTokens: 200,
        };

        const response = await this.orchestrator.process(request);

        return {
          ...step,
          explanation: response.text,
        };
      }),
    );

    return explainedSteps;
  }

  private async generateSummary(
    steps: CalculationStep[],
    totalValue: number,
    claimData: ClaimData,
    userId: string,
  ): Promise<string> {
    const stepsSummary = steps
      .map((s) => `${s.description}: $${s.value.toLocaleString()}`)
      .join("\n");

    const request: AIRequest = {
      prompt: `Summarize this insurance claim calculation:

        Damage Type: ${claimData.damageType}
        Location: ${claimData.location?.city}, FL

        Calculation Steps:
        ${stepsSummary}

        Final Claim Value: $${totalValue.toLocaleString()}

        Create a clear, empathetic summary that:
        1. Explains the final amount
        2. Highlights key factors that affected the calculation
        3. Provides confidence that the calculation is fair and accurate
        4. Suggests next steps`,
      systemPrompt: `You are Clarity, helping homeowners understand their claim value.
        Be transparent, supportive, and build trust. Keep it under 150 words.`,
      userId,
      feature: "clarity",
      temperature: 0.5,
    };

    const response = await this.orchestrator.process(request);
    return response.text;
  }

  // Calculation helper methods

  private async calculateReplacementCost(claimData: ClaimData): Promise<{
    value: number;
    explanation: string;
    formula: string;
  }> {
    // Simplified calculation - in production, this would use:
    // - Square footage
    // - Local construction costs
    // - Material quality
    // - Damage extent

    const baseCost = claimData.propertyValue * 0.8; // 80% of property value
    const damageMultiplier = this.getDamageMultiplier(claimData.damageType);

    const value = Math.round(baseCost * damageMultiplier);

    return {
      value,
      explanation: `Based on your property value and ${claimData.damageType} damage extent`,
      formula: `Property Value × 80% × Damage Multiplier (${damageMultiplier})`,
    };
  }

  private calculateDepreciation(
    replacementCost: number,
    claimData: ClaimData,
  ): {
    value: number;
    explanation: string;
    formula: string;
  } {
    // Simplified depreciation - in production would consider:
    // - Age of damaged items
    // - Type of materials
    // - Maintenance history

    const rate =
      (this.DEPRECIATION_RATES as Record<string, number>)[
        claimData.damageType
      ] || this.DEPRECIATION_RATES.general;
    const years = 5; // Would get from actual property data
    const value = Math.round(replacementCost * rate * years);

    return {
      value,
      explanation: `Depreciation for ${years} years at ${(rate * 100).toFixed(1)}% per year`,
      formula: `Replacement Cost × ${rate} × ${years} years`,
    };
  }

  private calculateDeductible(claimData: ClaimData): {
    value: number;
    explanation: string;
    formula: string;
  } {
    let value: number;
    let formula: string;

    if (claimData.damageType === "hurricane") {
      value =
        claimData.policyLimits.dwelling! * this.FLORIDA_DEDUCTIBLES.hurricane;
      formula = `Dwelling Coverage × 2% (Hurricane Deductible)`;
    } else if (claimData.damageType === "flood") {
      value = claimData.policyLimits.dwelling! * this.FLORIDA_DEDUCTIBLES.flood;
      formula = `Dwelling Coverage × 1% (Flood Deductible)`;
    } else {
      value = claimData.deductible || this.FLORIDA_DEDUCTIBLES.standard;
      formula = `Standard Deductible`;
    }

    return {
      value: Math.round(value),
      explanation: `Your policy deductible for ${claimData.damageType} damage`,
      formula,
    };
  }

  private calculateALE(claimData: ClaimData): {
    value: number;
    explanation: string;
  } {
    // Simplified ALE calculation
    const monthlyAmount = 2500; // Average FL rental
    const months = claimData.damageType === "total_loss" ? 12 : 6;

    return {
      value: monthlyAmount * months,
      explanation: `Living expenses for ${months} months while repairs are completed`,
    };
  }

  private applyPolicyLimits(
    currentTotal: number,
    claimData: ClaimData,
  ): {
    limited: boolean;
    adjustment: number;
    explanation: string;
  } {
    const limit = claimData.policyLimits.dwelling || Infinity;

    if (currentTotal > limit) {
      return {
        limited: true,
        adjustment: limit - currentTotal,
        explanation: `Claim exceeds policy limit of $${limit.toLocaleString()}`,
      };
    }

    return {
      limited: false,
      adjustment: 0,
      explanation: "",
    };
  }

  private getDamageMultiplier(damageType: string): number {
    const multipliers: Record<string, number> = {
      minor: 0.1,
      moderate: 0.3,
      major: 0.6,
      total_loss: 1.0,
      hurricane: 0.7,
      flood: 0.8,
      fire: 0.9,
      wind: 0.4,
      hail: 0.3,
    };

    return multipliers[damageType] || 0.5;
  }

  private calculateTotal(steps: CalculationStep[]): number {
    const total = steps.reduce((sum, step) => sum + step.value, 0);
    return Math.max(0, Math.round(total)); // Never negative
  }

  private calculateConfidence(steps: CalculationStep[]): number {
    const avgConfidence =
      steps.reduce((sum, step) => sum + step.confidence, 0) / steps.length;
    return Number(avgConfidence.toFixed(2));
  }
}
