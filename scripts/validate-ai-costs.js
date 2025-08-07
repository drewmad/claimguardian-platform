#!/usr/bin/env node

/**
 * AI Cost Validation CLI
 * Command-line tool for validating AI cost tracking with real API usage
 */

const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");

const execAsync = promisify(exec);

// Configuration
const config = {
  features: ["damage-analyzer", "policy-advisor", "inventory-scanner", "all"],
  providers: ["openai", "gemini", "both"],
  environments: ["development", "staging", "production"],
  formats: ["console", "json", "html", "csv"],
};

// Color codes for output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Utility functions
const log = {
  info: (msg) => console.log(`${colors.blue}💰 ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) =>
    console.log(`${colors.cyan}${colors.bright}🔍 ${msg}${colors.reset}\n`),
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    feature: "all",
    provider: "both",
    environment: "development",
    format: "console",
    output: null,
    maxCost: 2.0, // $2.00 maximum cost
    record: true,
    verbose: false,
    help: false,
    dryRun: false,
    concurrent: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--feature":
      case "-f":
        options.feature = args[++i];
        break;
      case "--provider":
      case "-p":
        options.provider = args[++i];
        break;
      case "--environment":
      case "-e":
        options.environment = args[++i];
        break;
      case "--format":
        options.format = args[++i];
        break;
      case "--output":
      case "-o":
        options.output = args[++i];
        break;
      case "--max-cost":
      case "-c":
        options.maxCost = parseFloat(args[++i]);
        break;
      case "--no-record":
        options.record = false;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--concurrent":
        options.concurrent = true;
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        if (arg.startsWith("--")) {
          log.warning(`Unknown option: ${arg}`);
        }
    }
  }

  return options;
}

// Display help
function showHelp() {
  console.log(`
${colors.cyan}${colors.bright}ClaimGuardian AI Cost Validation CLI${colors.reset}

${colors.bright}USAGE:${colors.reset}
  node validate-ai-costs.js [OPTIONS]

${colors.bright}OPTIONS:${colors.reset}
  -f, --feature <feature>    AI feature to validate (default: all)
                            Options: ${config.features.join(", ")}

  -p, --provider <provider>  AI provider to test (default: both)
                            Options: ${config.providers.join(", ")}

  -e, --environment <env>    Target environment (default: development)
                            Options: ${config.environments.join(", ")}

  --format <format>         Output format (default: console)
                            Options: ${config.formats.join(", ")}

  -o, --output <file>       Output file path (optional)

  -c, --max-cost <amount>   Maximum cost allowed for validation (default: $2.00)

  --no-record              Don't record results to database

  --dry-run                Show what would be tested without making API calls

  --concurrent             Run validations concurrently (faster but higher cost)

  -v, --verbose            Enable verbose output

  -h, --help               Show this help message

${colors.bright}EXAMPLES:${colors.reset}
  # Validate all features with both providers
  node validate-ai-costs.js

  # Validate specific feature with cost limit
  node validate-ai-costs.js -f damage-analyzer -c 0.50

  # Test only OpenAI with verbose output
  node validate-ai-costs.js -p openai -v

  # Dry run to see what would be tested
  node validate-ai-costs.js --dry-run

  # Generate HTML report
  node validate-ai-costs.js --format html -o validation-report.html

  # Production validation with concurrent testing
  node validate-ai-costs.js -e production --concurrent -c 5.00

${colors.bright}FEATURES:${colors.reset}
  damage-analyzer   - Test damage analysis AI with property damage prompts
  policy-advisor    - Test insurance policy guidance AI
  inventory-scanner - Test home inventory categorization and valuation AI
  all              - Test all AI features sequentially

${colors.bright}PROVIDERS:${colors.reset}
  openai   - Test OpenAI models (GPT-4, GPT-3.5-turbo)
  gemini   - Test Google Gemini models (1.5 Flash, 1.5 Pro)
  both     - Test both OpenAI and Gemini models

${colors.bright}SAFETY FEATURES:${colors.reset}
  - Automatic cost tracking and limits
  - API key validation before testing
  - Rate limiting between requests
  - Detailed cost accuracy reporting
  - Database recording for audit trail

${colors.bright}REQUIREMENTS:${colors.reset}
  - Valid OpenAI API key (OPENAI_API_KEY)
  - Valid Gemini API key (GEMINI_API_KEY)
  - Supabase configuration for result recording
  - Internet connection for API calls
`);
}

// Validate options
function validateOptions(options) {
  const errors = [];

  if (!config.features.includes(options.feature)) {
    errors.push(
      `Invalid feature: ${options.feature}. Valid options: ${config.features.join(", ")}`,
    );
  }

  if (!config.providers.includes(options.provider)) {
    errors.push(
      `Invalid provider: ${options.provider}. Valid options: ${config.providers.join(", ")}`,
    );
  }

  if (!config.environments.includes(options.environment)) {
    errors.push(
      `Invalid environment: ${options.environment}. Valid options: ${config.environments.join(", ")}`,
    );
  }

  if (!config.formats.includes(options.format)) {
    errors.push(
      `Invalid format: ${options.format}. Valid options: ${config.formats.join(", ")}`,
    );
  }

  if (options.maxCost < 0.01 || options.maxCost > 100) {
    errors.push("Max cost must be between $0.01 and $100.00");
  }

  return errors;
}

// Check prerequisites
async function checkPrerequisites(options) {
  const issues = [];

  // Check if we're in the correct directory
  const packageJsonPath = path.join(process.cwd(), "apps/web/package.json");
  if (!fs.existsSync(packageJsonPath)) {
    issues.push("Must be run from ClaimGuardian root directory");
  }

  // Check for required environment variables based on provider
  if (options.provider === "openai" || options.provider === "both") {
    if (!process.env.OPENAI_API_KEY) {
      issues.push("OPENAI_API_KEY environment variable is required");
    }
  }

  if (options.provider === "gemini" || options.provider === "both") {
    if (!process.env.GEMINI_API_KEY) {
      issues.push("GEMINI_API_KEY environment variable is required");
    }
  }

  // Check Supabase configuration if recording results
  if (options.record) {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      issues.push("Supabase configuration required for recording results");
    }
  }

  // Test API connectivity
  if (!options.dryRun) {
    try {
      await execAsync(
        "curl -s --connect-timeout 5 https://api.openai.com > /dev/null",
      );
    } catch (error) {
      issues.push("Cannot connect to OpenAI API - check internet connection");
    }
  }

  return issues;
}

// Estimate validation costs
function estimateValidationCost(options) {
  const baseCosts = {
    "damage-analyzer": { openai: 0.15, gemini: 0.08 },
    "policy-advisor": { openai: 0.12, gemini: 0.06 },
    "inventory-scanner": { openai: 0.1, gemini: 0.05 },
  };

  let totalCost = 0;

  const features =
    options.feature === "all" ? Object.keys(baseCosts) : [options.feature];

  const providers =
    options.provider === "both" ? ["openai", "gemini"] : [options.provider];

  features.forEach((feature) => {
    providers.forEach((provider) => {
      if (baseCosts[feature] && baseCosts[feature][provider]) {
        totalCost += baseCosts[feature][provider];
      }
    });
  });

  return totalCost;
}

// Run validation using the TypeScript validation service
async function runValidation(options) {
  log.info("Compiling TypeScript validation service...");

  // Build the validation service
  try {
    await execAsync("npx tsc --build", {
      cwd: path.join(process.cwd(), "apps/web"),
    });
  } catch (error) {
    if (options.verbose) {
      log.warning("TypeScript compilation had warnings, continuing...");
    }
  }

  log.info("Starting AI cost validation...");

  return new Promise((resolve, reject) => {
    const validationScript = `
const { validateAICosts, runProductionAIValidation } = require('./src/lib/validation/ai-cost-validator');

async function runValidation() {
  const options = ${JSON.stringify(options)};

  try {
    let results;

    if (options.feature === 'all') {
      results = await runProductionAIValidation();
    } else {
      const validator = validateAICosts;

      switch (options.feature) {
        case 'damage-analyzer':
          results = [await validator.validateDamageAnalyzer()];
          break;
        case 'policy-advisor':
          results = [await validator.validatePolicyAdvisor()];
          break;
        case 'inventory-scanner':
          results = [await validator.validateInventoryScanner()];
          break;
        default:
          throw new Error('Unknown feature: ' + options.feature);
      }
    }

    console.log(JSON.stringify({
      success: true,
      results: results,
      totalCost: results.reduce((sum, r) => sum + r.totalCost, 0),
      summary: {
        totalTests: results.reduce((sum, r) => sum + r.summary.totalTests, 0),
        successfulTests: results.reduce((sum, r) => sum + r.summary.successfulTests, 0),
        averageAccuracy: results.reduce((sum, r) => sum + r.summary.averageCostAccuracy, 0) / results.length
      }
    }));

  } catch (error) {
    console.log(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }));
  }
}

runValidation();
`;

    const testProcess = spawn("node", ["-e", validationScript], {
      cwd: path.join(process.cwd(), "apps/web"),
      stdio: "pipe",
      env: {
        ...process.env,
        NODE_ENV: options.environment,
      },
    });

    let output = "";
    let errorOutput = "";

    testProcess.stdout.on("data", (data) => {
      const text = data.toString();
      output += text;

      if (options.verbose) {
        // Filter out JSON result and show progress
        const lines = text
          .split("\n")
          .filter(
            (line) =>
              line.trim() && !line.startsWith("{") && !line.startsWith("}"),
          );
        lines.forEach((line) => log.info(line));
      }
    });

    testProcess.stderr.on("data", (data) => {
      errorOutput += data.toString();
      if (options.verbose) {
        log.warning(data.toString().trim());
      }
    });

    testProcess.on("close", (code) => {
      try {
        // Extract JSON result from output
        const jsonMatch = output.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          resolve(result);
        } else {
          reject(new Error("No JSON result found in output"));
        }
      } catch (error) {
        reject(
          new Error(
            `Failed to parse validation result: ${error.message}\nOutput: ${output}`,
          ),
        );
      }
    });

    testProcess.on("error", (error) => {
      reject(new Error(`Validation process failed: ${error.message}`));
    });
  });
}

// Generate comprehensive report
function generateReport(validationResult, options) {
  const { results, totalCost, summary } = validationResult;
  const timestamp = new Date().toISOString();

  const report = {
    timestamp,
    configuration: {
      feature: options.feature,
      provider: options.provider,
      environment: options.environment,
      maxCost: options.maxCost,
      concurrent: options.concurrent,
    },
    costs: {
      totalCost,
      maxAllowed: options.maxCost,
      withinBudget: totalCost <= options.maxCost,
    },
    summary,
    results,
    analysis: analyzeResults(results),
    recommendations: generateRecommendations(
      results,
      totalCost,
      options.maxCost,
    ),
  };

  switch (options.format) {
    case "json":
      return JSON.stringify(report, null, 2);
    case "html":
      return generateHTMLReport(report);
    case "csv":
      return generateCSVReport(report);
    default:
      return formatConsoleReport(report);
  }
}

// Analyze validation results
function analyzeResults(results) {
  const allResults = results.flatMap((r) => r.results);
  const successfulResults = allResults.filter((r) => r.success);

  const analysis = {
    overallSuccessRate: (successfulResults.length / allResults.length) * 100,
    averageLatency:
      successfulResults.reduce((sum, r) => sum + r.latency, 0) /
        successfulResults.length || 0,
    costAccuracyDistribution: {
      excellent: successfulResults.filter((r) => r.costAccuracy >= 95).length,
      good: successfulResults.filter(
        (r) => r.costAccuracy >= 90 && r.costAccuracy < 95,
      ).length,
      acceptable: successfulResults.filter(
        (r) => r.costAccuracy >= 80 && r.costAccuracy < 90,
      ).length,
      poor: successfulResults.filter((r) => r.costAccuracy < 80).length,
    },
    providerComparison: {},
    modelPerformance: {},
  };

  // Provider comparison
  ["openai", "gemini"].forEach((provider) => {
    const providerResults = successfulResults.filter(
      (r) => r.provider === provider,
    );
    if (providerResults.length > 0) {
      analysis.providerComparison[provider] = {
        averageAccuracy:
          providerResults.reduce((sum, r) => sum + r.costAccuracy, 0) /
          providerResults.length,
        averageLatency:
          providerResults.reduce((sum, r) => sum + r.latency, 0) /
          providerResults.length,
        totalCost: providerResults.reduce((sum, r) => sum + r.actualCost, 0),
        reliability:
          (providerResults.length /
            allResults.filter((r) => r.provider === provider).length) *
          100,
      };
    }
  });

  return analysis;
}

// Generate recommendations based on results
function generateRecommendations(results, totalCost, maxCost) {
  const recommendations = [];
  const allResults = results.flatMap((r) => r.results);
  const successRate =
    (allResults.filter((r) => r.success).length / allResults.length) * 100;

  // Cost recommendations
  if (totalCost > maxCost * 0.8) {
    recommendations.push({
      type: "cost",
      priority: "high",
      message: `Validation cost ($${totalCost.toFixed(4)}) is approaching limit ($${maxCost}). Consider reducing test scope for regular validation.`,
    });
  }

  // Accuracy recommendations
  const avgAccuracy =
    results.reduce((sum, r) => sum + r.summary.averageCostAccuracy, 0) /
    results.length;
  if (avgAccuracy < 90) {
    recommendations.push({
      type: "accuracy",
      priority: "medium",
      message: `Cost estimation accuracy (${avgAccuracy.toFixed(1)}%) could be improved. Review token counting algorithms.`,
    });
  }

  // Reliability recommendations
  if (successRate < 95) {
    recommendations.push({
      type: "reliability",
      priority: "high",
      message: `API success rate (${successRate.toFixed(1)}%) indicates reliability issues. Check API keys and rate limits.`,
    });
  }

  // Performance recommendations
  const avgLatency =
    allResults.filter((r) => r.success).reduce((sum, r) => sum + r.latency, 0) /
    allResults.filter((r) => r.success).length;
  if (avgLatency > 3000) {
    recommendations.push({
      type: "performance",
      priority: "medium",
      message: `High average latency (${avgLatency.toFixed(0)}ms) detected. Consider implementing caching or optimization.`,
    });
  }

  return recommendations;
}

// Format console report
function formatConsoleReport(report) {
  const { costs, summary, analysis, recommendations } = report;

  let output = `
${colors.cyan}${colors.bright}🔍 AI Cost Validation Report${colors.reset}
${colors.cyan}Generated: ${report.timestamp}${colors.reset}

${colors.bright}Configuration:${colors.reset}
  Feature: ${report.configuration.feature}
  Provider: ${report.configuration.provider}
  Environment: ${report.configuration.environment}
  Max Cost: $${report.configuration.maxCost.toFixed(2)}

${colors.bright}Cost Summary:${colors.reset}
  Total Cost: ${costs.withinBudget ? colors.green : colors.red}$${costs.totalCost.toFixed(6)}${colors.reset}
  Budget Status: ${costs.withinBudget ? "✅ Within Budget" : "⚠️ Over Budget"}

${colors.bright}Test Results:${colors.reset}
  Total Tests: ${summary.totalTests}
  Successful: ${colors.green}${summary.successfulTests}${colors.reset}
  Failed: ${colors.red}${summary.totalTests - summary.successfulTests}${colors.reset}
  Success Rate: ${analysis.overallSuccessRate.toFixed(1)}%
  Average Accuracy: ${summary.averageAccuracy.toFixed(1)}%

${colors.bright}Performance Analysis:${colors.reset}
  Average Latency: ${analysis.averageLatency.toFixed(0)}ms
  Cost Accuracy Distribution:
    Excellent (95%+): ${analysis.costAccuracyDistribution.excellent}
    Good (90-95%): ${analysis.costAccuracyDistribution.good}
    Acceptable (80-90%): ${analysis.costAccuracyDistribution.acceptable}
    Poor (<80%): ${analysis.costAccuracyDistribution.poor}
`;

  // Provider comparison
  if (Object.keys(analysis.providerComparison).length > 1) {
    output += `\n${colors.bright}Provider Comparison:${colors.reset}\n`;
    Object.entries(analysis.providerComparison).forEach(([provider, stats]) => {
      output += `  ${provider.toUpperCase()}:
    Accuracy: ${stats.averageAccuracy.toFixed(1)}%
    Latency: ${stats.averageLatency.toFixed(0)}ms
    Cost: $${stats.totalCost.toFixed(6)}
    Reliability: ${stats.reliability.toFixed(1)}%\n`;
    });
  }

  // Recommendations
  if (recommendations.length > 0) {
    output += `\n${colors.bright}Recommendations:${colors.reset}\n`;
    recommendations.forEach((rec) => {
      const priority =
        rec.priority === "high"
          ? colors.red
          : rec.priority === "medium"
            ? colors.yellow
            : colors.blue;
      output += `  ${priority}${rec.priority.toUpperCase()}${colors.reset}: ${rec.message}\n`;
    });
  }

  return output;
}

// Generate HTML report
function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>AI Cost Validation Report - ClaimGuardian</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .success { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .info { color: #17a2b8; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .recommendations { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .recommendation { margin: 10px 0; padding: 10px; border-left: 4px solid #007bff; background: white; }
        .recommendation.high { border-left-color: #dc3545; }
        .recommendation.medium { border-left-color: #ffc107; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 AI Cost Validation Report</h1>
        <p><strong>Generated:</strong> ${report.timestamp}</p>
        <p><strong>Feature:</strong> ${report.configuration.feature} | <strong>Provider:</strong> ${report.configuration.provider}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Cost</h3>
            <div class="value ${report.costs.withinBudget ? "success" : "danger"}">$${report.costs.totalCost.toFixed(6)}</div>
            <small>${report.costs.withinBudget ? "Within Budget" : "Over Budget"} (${report.costs.maxAllowed})</small>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value ${report.analysis.overallSuccessRate >= 95 ? "success" : "warning"}">${report.analysis.overallSuccessRate.toFixed(1)}%</div>
            <small>${report.summary.successfulTests}/${report.summary.totalTests} tests</small>
        </div>
        <div class="metric">
            <h3>Cost Accuracy</h3>
            <div class="value ${report.summary.averageAccuracy >= 90 ? "success" : "warning"}">${report.summary.averageAccuracy.toFixed(1)}%</div>
            <small>Average across all tests</small>
        </div>
        <div class="metric">
            <h3>Average Latency</h3>
            <div class="value ${report.analysis.averageLatency < 2000 ? "success" : "warning"}">${report.analysis.averageLatency.toFixed(0)}ms</div>
            <small>Response time</small>
        </div>
    </div>

    ${
      Object.keys(report.analysis.providerComparison).length > 1
        ? `
    <h2>Provider Comparison</h2>
    <table>
        <thead>
            <tr>
                <th>Provider</th>
                <th>Accuracy</th>
                <th>Latency</th>
                <th>Total Cost</th>
                <th>Reliability</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(report.analysis.providerComparison)
              .map(
                ([provider, stats]) => `
                <tr>
                    <td>${provider.toUpperCase()}</td>
                    <td>${stats.averageAccuracy.toFixed(1)}%</td>
                    <td>${stats.averageLatency.toFixed(0)}ms</td>
                    <td>$${stats.totalCost.toFixed(6)}</td>
                    <td>${stats.reliability.toFixed(1)}%</td>
                </tr>
            `,
              )
              .join("")}
        </tbody>
    </table>
    `
        : ""
    }

    ${
      report.recommendations.length > 0
        ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        ${report.recommendations
          .map(
            (rec) => `
            <div class="recommendation ${rec.priority}">
                <strong>${rec.type.toUpperCase()} (${rec.priority})</strong>: ${rec.message}
            </div>
        `,
          )
          .join("")}
    </div>
    `
        : ""
    }
</body>
</html>`;
}

// Generate CSV report
function generateCSVReport(report) {
  const allResults = report.results.flatMap((r) => r.results);

  const headers = [
    "Provider",
    "Model",
    "Success",
    "Actual Cost",
    "Estimated Cost",
    "Cost Accuracy (%)",
    "Latency (ms)",
    "Input Tokens",
    "Output Tokens",
    "Total Tokens",
  ].join(",");

  const rows = allResults
    .map((result) =>
      [
        result.provider,
        result.model,
        result.success,
        result.actualCost.toFixed(6),
        result.estimatedCost.toFixed(6),
        result.costAccuracy.toFixed(2),
        result.latency,
        result.tokens.input,
        result.tokens.output,
        result.tokens.total,
      ].join(","),
    )
    .join("\n");

  return `${headers}\n${rows}`;
}

// Main execution function
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  log.header("ClaimGuardian AI Cost Validation");

  // Validate options
  const optionErrors = validateOptions(options);
  if (optionErrors.length > 0) {
    log.error("Invalid options:");
    optionErrors.forEach((error) => log.error(`  ${error}`));
    process.exit(1);
  }

  // Check prerequisites
  const prerequisiteIssues = await checkPrerequisites(options);
  if (prerequisiteIssues.length > 0) {
    log.error("Prerequisites not met:");
    prerequisiteIssues.forEach((issue) => log.error(`  ${issue}`));
    process.exit(1);
  }

  // Estimate costs
  const estimatedCost = estimateValidationCost(options);
  log.info(`Estimated validation cost: $${estimatedCost.toFixed(4)}`);
  log.info(`Maximum allowed cost: $${options.maxCost.toFixed(2)}`);

  if (estimatedCost > options.maxCost) {
    log.warning(
      `Estimated cost exceeds maximum allowed. Consider reducing scope or increasing limit.`,
    );
  }

  if (options.dryRun) {
    log.info("Dry run mode - no API calls will be made");
    log.info(
      `Would test: ${options.feature} feature with ${options.provider} provider(s)`,
    );
    process.exit(0);
  }

  // Confirm before proceeding with real API calls
  if (process.stdin.isTTY) {
    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const confirm = await new Promise((resolve) => {
      readline.question(
        `Proceed with real API validation? This will cost approximately $${estimatedCost.toFixed(4)} (y/N): `,
        resolve,
      );
    });

    readline.close();

    if (confirm.toLowerCase() !== "y" && confirm.toLowerCase() !== "yes") {
      log.info("Validation cancelled by user");
      process.exit(0);
    }
  }

  const startTime = Date.now();

  try {
    log.info("Starting AI cost validation...");

    const validationResult = await runValidation(options);

    if (!validationResult.success) {
      throw new Error(validationResult.error);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    log.success(`Validation completed in ${duration}ms`);
    log.info(`Actual cost: $${validationResult.totalCost.toFixed(6)}`);

    // Generate report
    const report = generateReport(validationResult, options);

    if (options.output) {
      fs.writeFileSync(options.output, report);
      log.success(`Report saved to: ${options.output}`);
    } else {
      console.log(report);
    }

    // Exit with success/failure based on results
    const success =
      validationResult.totalCost <= options.maxCost &&
      validationResult.summary.successfulTests > 0;
    process.exit(success ? 0 : 1);
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    log.error(`Validation failed after ${duration}ms: ${error.message}`);

    if (options.verbose && error.stack) {
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Handle uncaught errors
process.on("uncaughtException", (error) => {
  log.error(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  log.error(`Unhandled rejection at ${promise}: ${reason}`);
  process.exit(1);
});

// Run the CLI tool
if (require.main === module) {
  main();
}

module.exports = {
  parseArgs,
  validateOptions,
  checkPrerequisites,
  main,
};
