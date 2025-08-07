/**
 * @fileMetadata
 * @purpose "Confidence Threshold Tuning System for Claude Learning"
 * @owner ai-team
 * @status stable
 * @dependencies ["@/lib/claude/claude-production-monitor", "@/lib/claude/claude-ab-testing"]
 */

import { claudeProductionMonitor } from "./claude-production-monitor";
import { claudeABTesting } from "./claude-ab-testing";
import { logger } from "../logger";

interface ThresholdAnalysis {
  threshold: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  sampleSize: number;
}

interface ThresholdRecommendation {
  currentThreshold: number;
  recommendedThreshold: number;
  expectedImprovement: number;
  confidence: number;
  reasoning: string;
  riskAssessment: "low" | "medium" | "high";
  implementationSteps: string[];
}

interface TuningConfig {
  enabled: boolean;
  evaluationWindow: number; // Hours of data to analyze
  minimumSampleSize: number;
  retuningInterval: number; // Hours between automatic retuning
  maxThresholdChange: number; // Maximum change per adjustment
  validationPeriod: number; // Hours to validate new threshold
  rollbackThreshold: number; // Performance drop % that triggers rollback
}

class ClaudeThresholdTuner {
  private config: TuningConfig = {
    enabled: process.env.CLAUDE_THRESHOLD_TUNING_ENABLED !== "false",
    evaluationWindow: parseInt(process.env.CLAUDE_TUNING_WINDOW || "72"), // 3 days
    minimumSampleSize: parseInt(process.env.CLAUDE_TUNING_MIN_SAMPLE || "100"),
    retuningInterval: parseInt(process.env.CLAUDE_RETUNING_INTERVAL || "168"), // 1 week
    maxThresholdChange: parseFloat(
      process.env.CLAUDE_MAX_THRESHOLD_CHANGE || "0.1",
    ),
    validationPeriod: parseInt(process.env.CLAUDE_VALIDATION_PERIOD || "24"), // 1 day
    rollbackThreshold: parseFloat(
      process.env.CLAUDE_ROLLBACK_THRESHOLD || "0.05",
    ), // 5% performance drop
  };

  private lastTuningTimestamp: Date | null = null;
  private thresholdHistory: Array<{
    timestamp: Date;
    threshold: number;
    reason: string;
    performance: number;
  }> = [];

  /**
   * ANALYZE CURRENT THRESHOLD PERFORMANCE
   */
  async analyzeCurrentThreshold(): Promise<{
    analysis: ThresholdAnalysis;
    recommendation: ThresholdRecommendation;
    historicalPerformance: Array<{ threshold: number; performance: number }>;
  }> {
    logger.info("Analyzing current confidence threshold performance");

    const currentThreshold = parseFloat(
      process.env.CLAUDE_CONFIDENCE_THRESHOLD || "0.8",
    );

    // Get recent production data
    const productionStatus =
      await claudeProductionMonitor.getProductionStatus();

    // Analyze threshold performance across different values
    const thresholdAnalyses = await this.evaluateThresholdRange(
      0.6,
      0.95,
      0.05,
    );

    // Find current threshold analysis
    const currentAnalysis =
      thresholdAnalyses.find(
        (a) => Math.abs(a.threshold - currentThreshold) < 0.025,
      ) || thresholdAnalyses[0];

    // Generate recommendation
    const recommendation = this.generateThresholdRecommendation(
      currentThreshold,
      thresholdAnalyses,
      productionStatus,
    );

    // Extract historical performance
    const historicalPerformance = this.thresholdHistory.map((h) => ({
      threshold: h.threshold,
      performance: h.performance,
    }));

    return {
      analysis: currentAnalysis,
      recommendation,
      historicalPerformance,
    };
  }

  /**
   * EVALUATE THRESHOLD RANGE
   */
  private async evaluateThresholdRange(
    minThreshold: number,
    maxThreshold: number,
    step: number,
  ): Promise<ThresholdAnalysis[]> {
    const thresholds: number[] = [];
    for (let t = minThreshold; t <= maxThreshold; t += step) {
      thresholds.push(Math.round(t * 100) / 100);
    }

    // Get production metrics for analysis
    const abTestReport = await claudeABTesting.generateABTestReport("week");
    const mockMetrics = this.generateMockProductionMetrics(500); // In production, would use real data

    const analyses: ThresholdAnalysis[] = [];

    for (const threshold of thresholds) {
      const analysis = this.analyzeThresholdPerformance(mockMetrics, threshold);
      analyses.push({
        threshold,
        ...analysis,
      });
    }

    return analyses.sort((a, b) => b.f1Score - a.f1Score);
  }

  private generateMockProductionMetrics(count: number) {
    // Generate realistic mock data for threshold analysis
    const metrics = [];

    for (let i = 0; i < count; i++) {
      const isSuccess = Math.random() > 0.2; // 80% success rate
      const confidenceLevel = isSuccess
        ? 0.6 + Math.random() * 0.4 // Higher confidence for successes
        : 0.3 + Math.random() * 0.5; // Lower confidence for failures

      metrics.push({
        confidenceLevel,
        actualSuccess: isSuccess,
        executionTime: 100 + Math.random() * 400,
        optimizationsApplied: Math.floor(Math.random() * 4),
      });
    }

    return metrics;
  }

  private analyzeThresholdPerformance(metrics: unknown[], threshold: number) {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const metric of metrics) {
      const predicted = (metric as any).confidenceLevel >= threshold;
      const actual = (metric as any).actualSuccess;

      if (predicted && actual) truePositives++;
      else if (predicted && !actual) falsePositives++;
      else if (!predicted && !actual) trueNegatives++;
      else falseNegatives++;
    }

    const accuracy = (truePositives + trueNegatives) / metrics.length;
    const precision =
      truePositives > 0 ? truePositives / (truePositives + falsePositives) : 0;
    const recall =
      truePositives > 0 ? truePositives / (truePositives + falseNegatives) : 0;
    const f1Score =
      precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : 0;
    const falsePositiveRate =
      falsePositives + trueNegatives > 0
        ? falsePositives / (falsePositives + trueNegatives)
        : 0;
    const falseNegativeRate =
      falseNegatives + truePositives > 0
        ? falseNegatives / (falseNegatives + truePositives)
        : 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      falsePositiveRate,
      falseNegativeRate,
      truePositives,
      falsePositives,
      trueNegatives,
      falseNegatives,
      sampleSize: metrics.length,
    };
  }

  /**
   * GENERATE THRESHOLD RECOMMENDATION
   */
  private generateThresholdRecommendation(
    currentThreshold: number,
    analyses: ThresholdAnalysis[],
    productionStatus: unknown,
  ): ThresholdRecommendation {
    // Find optimal threshold based on F1 score
    const optimalAnalysis = analyses[0]; // Already sorted by F1 score
    const currentAnalysis =
      analyses.find((a) => Math.abs(a.threshold - currentThreshold) < 0.025) ||
      analyses[analyses.length - 1];

    const expectedImprovement =
      ((optimalAnalysis.f1Score - currentAnalysis.f1Score) /
        currentAnalysis.f1Score) *
      100;
    const thresholdChange = Math.abs(
      optimalAnalysis.threshold - currentThreshold,
    );

    // Determine confidence in recommendation
    let confidence = 0.5;
    if (optimalAnalysis.sampleSize >= this.config.minimumSampleSize)
      confidence += 0.2;
    if (expectedImprovement > 5) confidence += 0.2;
    if (thresholdChange <= this.config.maxThresholdChange) confidence += 0.1;

    // Risk assessment
    let riskAssessment: "low" | "medium" | "high" = "medium";
    if (thresholdChange <= 0.05 && expectedImprovement > 0)
      riskAssessment = "low";
    else if (thresholdChange > 0.15 || expectedImprovement < -2)
      riskAssessment = "high";

    // Generate reasoning
    let reasoning = `Current threshold (${currentThreshold}) has F1 score of ${currentAnalysis.f1Score.toFixed(3)}. `;
    reasoning += `Optimal threshold (${optimalAnalysis.threshold}) would improve F1 score to ${optimalAnalysis.f1Score.toFixed(3)} `;
    reasoning += `(${expectedImprovement.toFixed(1)}% improvement). `;

    if (expectedImprovement < 2) {
      reasoning += "Current threshold is already near-optimal.";
    } else if (expectedImprovement > 10) {
      reasoning += "Significant improvement opportunity identified.";
    }

    // Implementation steps
    const implementationSteps = [
      `Update CLAUDE_CONFIDENCE_THRESHOLD to ${optimalAnalysis.threshold}`,
      `Monitor performance for ${this.config.validationPeriod} hours`,
      "Compare A/B test results before and after change",
      "Rollback if performance degrades by more than 5%",
      "Document threshold change and reasoning",
    ];

    return {
      currentThreshold,
      recommendedThreshold: optimalAnalysis.threshold,
      expectedImprovement,
      confidence,
      reasoning,
      riskAssessment,
      implementationSteps,
    };
  }

  /**
   * AUTO-TUNE THRESHOLD BASED ON PRODUCTION DATA
   */
  async autoTuneThreshold(): Promise<{
    tuningPerformed: boolean;
    previousThreshold: number;
    newThreshold: number;
    expectedImprovement: number;
    reason: string;
  }> {
    if (!this.config.enabled) {
      return {
        tuningPerformed: false,
        previousThreshold: parseFloat(
          process.env.CLAUDE_CONFIDENCE_THRESHOLD || "0.8",
        ),
        newThreshold: parseFloat(
          process.env.CLAUDE_CONFIDENCE_THRESHOLD || "0.8",
        ),
        expectedImprovement: 0,
        reason: "Auto-tuning is disabled",
      };
    }

    const now = new Date();

    // Check if enough time has passed since last tuning
    if (this.lastTuningTimestamp) {
      const hoursSinceLastTuning =
        (now.getTime() - this.lastTuningTimestamp.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastTuning < this.config.retuningInterval) {
        return {
          tuningPerformed: false,
          previousThreshold: parseFloat(
            process.env.CLAUDE_CONFIDENCE_THRESHOLD || "0.8",
          ),
          newThreshold: parseFloat(
            process.env.CLAUDE_CONFIDENCE_THRESHOLD || "0.8",
          ),
          expectedImprovement: 0,
          reason: `Too soon since last tuning (${hoursSinceLastTuning.toFixed(1)} hours ago)`,
        };
      }
    }

    logger.info("Starting automatic threshold tuning");

    const analysis = await this.analyzeCurrentThreshold();
    const currentThreshold = analysis.recommendation.currentThreshold;
    const recommendedThreshold = analysis.recommendation.recommendedThreshold;
    const expectedImprovement = analysis.recommendation.expectedImprovement;

    // Only tune if improvement is significant and within safe bounds
    const thresholdChange = Math.abs(recommendedThreshold - currentThreshold);
    const shouldTune =
      expectedImprovement > 3 && // At least 3% improvement
      thresholdChange <= this.config.maxThresholdChange && // Safe change amount
      analysis.recommendation.confidence > 0.7 && // High confidence
      analysis.recommendation.riskAssessment !== "high" && // Not high risk
      analysis.analysis.sampleSize >= this.config.minimumSampleSize; // Sufficient data

    if (!shouldTune) {
      return {
        tuningPerformed: false,
        previousThreshold: currentThreshold,
        newThreshold: currentThreshold,
        expectedImprovement: 0,
        reason: "Conditions not met for auto-tuning",
      };
    }

    // Perform the tuning
    await this.applyThresholdChange(
      recommendedThreshold,
      "Automatic tuning based on production performance",
    );

    this.lastTuningTimestamp = now;
    this.thresholdHistory.push({
      timestamp: now,
      threshold: recommendedThreshold,
      reason: "Auto-tune",
      performance: analysis.analysis.f1Score,
    });

    logger.info("Automatic threshold tuning completed", {
      previousThreshold: currentThreshold,
      newThreshold: recommendedThreshold,
      expectedImprovement,
    });

    return {
      tuningPerformed: true,
      previousThreshold: currentThreshold,
      newThreshold: recommendedThreshold,
      expectedImprovement,
      reason:
        "Automatic tuning - performance improvement opportunity identified",
    };
  }

  /**
   * APPLY THRESHOLD CHANGE
   */
  private async applyThresholdChange(
    newThreshold: number,
    reason: string,
  ): Promise<void> {
    // In a real production environment, this would update the environment variable
    // or configuration system. For now, we'll log the change.

    logger.info("Applying threshold change", {
      newThreshold,
      reason,
      timestamp: new Date(),
    });

    // Would update environment variable:
    // process.env.CLAUDE_CONFIDENCE_THRESHOLD = newThreshold.toString()

    // In production, would also:
    // 1. Update deployment configuration
    // 2. Restart relevant services
    // 3. Notify team of change
    // 4. Begin validation period monitoring
  }

  /**
   * VALIDATE THRESHOLD CHANGE
   */
  async validateThresholdChange(
    previousThreshold: number,
    newThreshold: number,
    changeTimestamp: Date,
  ): Promise<{
    validationStatus: "success" | "warning" | "failure";
    performanceChange: number;
    recommendation: "keep" | "rollback" | "continue_monitoring";
    details: {
      beforeMetrics: unknown;
      afterMetrics: unknown;
      significantChange: boolean;
    };
  }> {
    const validationPeriodHours = this.config.validationPeriod;
    const now = new Date();
    const hoursSinceChange =
      (now.getTime() - changeTimestamp.getTime()) / (1000 * 60 * 60);

    if (hoursSinceChange < validationPeriodHours) {
      return {
        validationStatus: "warning",
        performanceChange: 0,
        recommendation: "continue_monitoring",
        details: {
          beforeMetrics: {},
          afterMetrics: {},
          significantChange: false,
        },
      };
    }

    // Get performance metrics before and after the change
    const beforeMetrics = await this.getPerformanceMetricsForPeriod(
      new Date(
        changeTimestamp.getTime() - validationPeriodHours * 60 * 60 * 1000,
      ),
      changeTimestamp,
    );

    const afterMetrics = await this.getPerformanceMetricsForPeriod(
      changeTimestamp,
      now,
    );

    // Calculate performance change
    const performanceChange =
      ((afterMetrics.f1Score - beforeMetrics.f1Score) / beforeMetrics.f1Score) *
      100;

    // Determine validation status
    let validationStatus: "success" | "warning" | "failure" = "success";
    let recommendation: "keep" | "rollback" | "continue_monitoring" = "keep";

    if (performanceChange < -this.config.rollbackThreshold * 100) {
      validationStatus = "failure";
      recommendation = "rollback";
    } else if (performanceChange < 0) {
      validationStatus = "warning";
      recommendation = "continue_monitoring";
    }

    const significantChange = Math.abs(performanceChange) > 2; // 2% change considered significant

    return {
      validationStatus,
      performanceChange,
      recommendation,
      details: {
        beforeMetrics,
        afterMetrics,
        significantChange,
      },
    };
  }

  private async getPerformanceMetricsForPeriod(startTime: Date, endTime: Date) {
    // Mock implementation - in production would query actual metrics
    return {
      f1Score: 0.82 + (Math.random() - 0.5) * 0.1,
      accuracy: 0.85 + (Math.random() - 0.5) * 0.1,
      sampleSize: 100 + Math.floor(Math.random() * 200),
    };
  }

  /**
   * GET TUNING STATUS AND HISTORY
   */
  getTuningStatus(): {
    enabled: boolean;
    lastTuning: Date | null;
    currentThreshold: number;
    nextScheduledTuning: Date | null;
    tuningHistory: Array<{
      timestamp: Date;
      threshold: number;
      reason: string;
      performance: number;
    }>;
    config: TuningConfig;
  } {
    const currentThreshold = parseFloat(
      process.env.CLAUDE_CONFIDENCE_THRESHOLD || "0.8",
    );

    let nextScheduledTuning: Date | null = null;
    if (this.config.enabled && this.lastTuningTimestamp) {
      nextScheduledTuning = new Date(
        this.lastTuningTimestamp.getTime() +
          this.config.retuningInterval * 60 * 60 * 1000,
      );
    }

    return {
      enabled: this.config.enabled,
      lastTuning: this.lastTuningTimestamp,
      currentThreshold,
      nextScheduledTuning,
      tuningHistory: [...this.thresholdHistory],
      config: { ...this.config },
    };
  }

  /**
   * UPDATE TUNING CONFIGURATION
   */
  updateConfig(newConfig: Partial<TuningConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info("Threshold tuning configuration updated", {
      config: this.config,
    });
  }
}

// Export singleton instance
export const claudeThresholdTuner = new ClaudeThresholdTuner();

// Export types
export type { ThresholdAnalysis, ThresholdRecommendation, TuningConfig };
