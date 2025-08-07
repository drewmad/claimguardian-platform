#!/usr/bin/env node

/**
 * @fileMetadata
 * @purpose Production monitoring script for Claude Learning System
 * @owner ai-team
 * @status active
 */

const {
  claudeProductionMonitor,
} = require("../../apps/web/src/lib/claude/claude-production-monitor");
const {
  claudeABTesting,
} = require("../../apps/web/src/lib/claude/claude-ab-testing");
const {
  claudeFeedbackLoops,
} = require("../../apps/web/src/lib/claude/claude-feedback-loops");
const {
  claudeThresholdTuner,
} = require("../../apps/web/src/lib/claude/claude-threshold-tuner");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

async function monitorProduction() {
  console.clear();
  console.log(
    `${colors.bright}${colors.cyan}🚀 Claude Learning System - Production Monitor${colors.reset}`,
  );
  console.log(`${colors.dim}${new Date().toLocaleString()}${colors.reset}`);
  console.log("=".repeat(80));

  try {
    // 1. Production Status
    const status = await claudeProductionMonitor.getProductionStatus();
    console.log(`\n${colors.bright}📊 PRODUCTION STATUS${colors.reset}`);
    console.log(
      `Status: ${getStatusColor(status.status)}${status.status.toUpperCase()}${colors.reset}`,
    );
    console.log(`Uptime: ${formatUptime(status.uptime)}`);
    console.log(`\nMetrics:`);
    console.log(
      `  Success Rate: ${formatPercentage(status.metrics.successRate)}`,
    );
    console.log(
      `  Learning Enabled: ${status.metrics.learningEnabled ? colors.green + "✓" : colors.red + "✗"}${colors.reset}`,
    );
    console.log(
      `  Avg Execution Time: ${colors.cyan}${(status.metrics.avgExecutionTime / 1000).toFixed(2)}s${colors.reset}`,
    );
    console.log(
      `  Total Tasks: ${colors.bright}${status.metrics.totalTasks}${colors.reset}`,
    );

    // 2. A/B Testing Results
    const abReport = await claudeABTesting.generateABTestReport("hour");
    console.log(`\n${colors.bright}🧪 A/B TESTING (Last Hour)${colors.reset}`);
    console.log(
      `Active Sessions: ${colors.bright}${abReport.summary.totalSessions}${colors.reset}`,
    );
    console.log(`\nControl Group:`);
    console.log(`  Tasks: ${abReport.controlGroup.taskCount}`);
    console.log(
      `  Success Rate: ${formatPercentage(abReport.controlGroup.successRate)}`,
    );
    console.log(
      `  Avg Time: ${(abReport.controlGroup.avgExecutionTime / 1000).toFixed(2)}s`,
    );
    console.log(`\nTreatment Group (Learning Enabled):`);
    console.log(`  Tasks: ${abReport.treatmentGroup.taskCount}`);
    console.log(
      `  Success Rate: ${formatPercentage(abReport.treatmentGroup.successRate)}`,
    );
    console.log(
      `  Avg Time: ${(abReport.treatmentGroup.avgExecutionTime / 1000).toFixed(2)}s`,
    );
    console.log(
      `  Optimizations: ${colors.cyan}${abReport.treatmentGroup.avgOptimizations}${colors.reset}`,
    );
    console.log(`\n${colors.bright}Business Impact:${colors.reset}`);
    console.log(
      `  Performance Improvement: ${formatImpact(abReport.businessMetrics.performanceImprovement)}`,
    );
    console.log(
      `  Time Saved: ${colors.green}${abReport.businessMetrics.timeSaved.toFixed(1)} hours${colors.reset}`,
    );
    console.log(`  ROI: ${formatROI(abReport.businessMetrics.roi)}`);

    // 3. Threshold Analysis
    const thresholdAnalysis =
      await claudeThresholdTuner.analyzeCurrentThreshold();
    console.log(`\n${colors.bright}🎯 CONFIDENCE THRESHOLD${colors.reset}`);
    console.log(
      `Current Threshold: ${colors.cyan}${thresholdAnalysis.recommendation.currentThreshold}${colors.reset}`,
    );
    console.log(
      `Recommended: ${colors.yellow}${thresholdAnalysis.recommendation.recommendedThreshold}${colors.reset}`,
    );
    console.log(
      `Expected Improvement: ${formatImpact(thresholdAnalysis.recommendation.expectedImprovement)}`,
    );
    console.log(`\nCurrent Performance:`);
    console.log(
      `  F1 Score: ${formatScore(thresholdAnalysis.analysis.f1Score)}`,
    );
    console.log(
      `  Precision: ${formatPercentage(thresholdAnalysis.analysis.precision)}`,
    );
    console.log(
      `  Recall: ${formatPercentage(thresholdAnalysis.analysis.recall)}`,
    );

    // 4. Feedback System Status
    const feedbackStatus = claudeFeedbackLoops.getFeedbackSystemStatus();
    console.log(`\n${colors.bright}📈 FEEDBACK SYSTEM${colors.reset}`);
    console.log(
      `System Health: ${getHealthColor(feedbackStatus.systemHealth)}${feedbackStatus.systemHealth.toUpperCase()}${colors.reset}`,
    );
    console.log(`Active Improvement Cycles: ${feedbackStatus.activeCycles}`);
    console.log(`\nKey Metrics:`);
    feedbackStatus.metrics.slice(0, 3).forEach((metric) => {
      const progress = (metric.currentValue / metric.targetValue) * 100;
      console.log(
        `  ${metric.name}: ${formatMetricValue(metric.currentValue)} / ${formatMetricValue(metric.targetValue)} (${formatPercentage(progress / 100)})`,
      );
    });
    console.log(`\nUser Feedback:`);
    console.log(`  Total: ${feedbackStatus.userFeedbackSummary.total}`);
    console.log(
      `  Average Rating: ${feedbackStatus.userFeedbackSummary.avgRating.toFixed(1)}/5 ⭐`,
    );
    console.log(
      `  Unresolved: ${feedbackStatus.userFeedbackSummary.unresolved}`,
    );

    // 5. Real-time Alerts
    console.log(`\n${colors.bright}🚨 ALERTS${colors.reset}`);
    const alerts = checkForAlerts(status, abReport, feedbackStatus);
    if (alerts.length === 0) {
      console.log(`${colors.green}✓ No active alerts${colors.reset}`);
    } else {
      alerts.forEach((alert) => {
        console.log(
          `${alert.color}${alert.icon} ${alert.message}${colors.reset}`,
        );
      });
    }

    // Footer
    console.log("\n" + "=".repeat(80));
    console.log(
      `${colors.dim}Next update in 30 seconds... (Press Ctrl+C to exit)${colors.reset}`,
    );
  } catch (error) {
    console.error(
      `${colors.red}❌ Monitoring error: ${error.message}${colors.reset}`,
    );
  }
}

// Helper functions
function getStatusColor(status) {
  switch (status) {
    case "healthy":
      return colors.green;
    case "warning":
      return colors.yellow;
    case "error":
      return colors.red;
    default:
      return colors.reset;
  }
}

function getHealthColor(health) {
  switch (health) {
    case "healthy":
      return colors.green;
    case "warning":
      return colors.yellow;
    case "critical":
      return colors.red;
    default:
      return colors.reset;
  }
}

function formatPercentage(value) {
  const percentage = value * 100;
  const color =
    percentage >= 80
      ? colors.green
      : percentage >= 60
        ? colors.yellow
        : colors.red;
  return `${color}${percentage.toFixed(1)}%${colors.reset}`;
}

function formatImpact(value) {
  const color =
    value > 0 ? colors.green : value < 0 ? colors.red : colors.yellow;
  return `${color}${value > 0 ? "+" : ""}${value.toFixed(1)}%${colors.reset}`;
}

function formatROI(value) {
  return `${colors.bright}${colors.green}${value.toFixed(0)}%${colors.reset}`;
}

function formatScore(value) {
  const color =
    value >= 0.8 ? colors.green : value >= 0.6 ? colors.yellow : colors.red;
  return `${color}${value.toFixed(3)}${colors.reset}`;
}

function formatMetricValue(value) {
  if (value < 1) return (value * 100).toFixed(1) + "%";
  if (value > 1000) return (value / 1000).toFixed(1) + "k";
  return value.toFixed(1);
}

function formatUptime(startTime) {
  const uptime = Date.now() - new Date(startTime).getTime();
  const hours = Math.floor(uptime / (1000 * 60 * 60));
  const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}

function checkForAlerts(status, abReport, feedbackStatus) {
  const alerts = [];

  // Check success rate
  if (status.metrics.successRate < 0.8) {
    alerts.push({
      icon: "⚠️",
      message: "Success rate below 80%",
      color: colors.yellow,
    });
  }

  // Check execution time
  if (status.metrics.avgExecutionTime > 300000) {
    // 5 minutes
    alerts.push({
      icon: "🐌",
      message: "Average execution time exceeds 5 minutes",
      color: colors.yellow,
    });
  }

  // Check A/B test performance
  if (abReport.businessMetrics.performanceImprovement < 0) {
    alerts.push({
      icon: "📉",
      message: "Learning system performing worse than control",
      color: colors.red,
    });
  }

  // Check system health
  if (feedbackStatus.systemHealth === "critical") {
    alerts.push({
      icon: "🔥",
      message: "System health is critical",
      color: colors.red,
    });
  }

  // Check unresolved feedback
  if (feedbackStatus.userFeedbackSummary.unresolved > 10) {
    alerts.push({
      icon: "📬",
      message: `${feedbackStatus.userFeedbackSummary.unresolved} unresolved user feedback items`,
      color: colors.yellow,
    });
  }

  return alerts;
}

// Run monitoring
async function startMonitoring() {
  // Initial run
  await monitorProduction();

  // Update every 30 seconds
  setInterval(monitorProduction, 30000);
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log(`\n${colors.dim}Monitoring stopped.${colors.reset}`);
  process.exit(0);
});

console.log(
  `${colors.bright}Starting Claude Learning System production monitoring...${colors.reset}`,
);
startMonitoring();
