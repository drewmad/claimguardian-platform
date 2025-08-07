/**
 * Load Testing Framework for AI Endpoints
 * Comprehensive load testing suite for ClaimGuardian AI endpoints
 */

import { performance } from "perf_hooks";

export interface LoadTestConfig {
  name: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  payload?: Record<string, unknown>;
  concurrent: number;
  duration: number; // milliseconds
  rampUp: number; // seconds to reach full load
  thresholds: {
    avgResponseTime: number; // ms
    p95ResponseTime: number; // ms
    errorRate: number; // percentage
    requestsPerSecond: number;
  };
}

export interface LoadTestResult {
  config: LoadTestConfig;
  startTime: number;
  endTime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  metrics: {
    avgResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    throughput: number; // requests per second
  };
  errors: Array<{
    timestamp: number;
    error: string;
    statusCode?: number;
    responseTime: number;
  }>;
  thresholdResults: {
    avgResponseTime: { passed: boolean; actual: number; expected: number };
    p95ResponseTime: { passed: boolean; actual: number; expected: number };
    errorRate: { passed: boolean; actual: number; expected: number };
    requestsPerSecond: { passed: boolean; actual: number; expected: number };
  };
}

export interface RequestResult {
  timestamp: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  size: number;
}

export class LoadTestFramework {
  private results: LoadTestResult[] = [];
  private activeRequests: Set<Promise<RequestResult>> = new Set();

  async runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    console.log(`🚀 Starting load test: ${config.name}`);
    console.log(`   Endpoint: ${config.endpoint}`);
    console.log(`   Concurrent users: ${config.concurrent}`);
    console.log(`   Duration: ${config.duration}ms`);
    console.log(`   Ramp-up: ${config.rampUp}s`);

    const startTime = performance.now();
    const endTime = startTime + config.duration;
    const results: RequestResult[] = [];
    const errors: LoadTestResult["errors"] = [];

    // Ramp-up phase: gradually increase concurrent users
    let currentConcurrency = 1;
    const rampUpInterval = (config.rampUp * 1000) / config.concurrent;
    let lastRampUp = startTime;

    while (performance.now() < endTime) {
      // Increase concurrency during ramp-up
      if (
        currentConcurrency < config.concurrent &&
        performance.now() - lastRampUp > rampUpInterval
      ) {
        currentConcurrency++;
        lastRampUp = performance.now();
      }

      // Maintain target concurrency
      while (
        this.activeRequests.size < currentConcurrency &&
        performance.now() < endTime
      ) {
        const requestPromise = this.makeRequest(config);
        this.activeRequests.add(requestPromise);

        requestPromise
          .then((result) => {
            results.push(result);
            if (!result.success) {
              errors.push({
                timestamp: result.timestamp,
                error: result.error || "Unknown error",
                statusCode: result.statusCode,
                responseTime: result.responseTime,
              });
            }
          })
          .catch((error) => {
            errors.push({
              timestamp: performance.now(),
              error: error.message,
              responseTime: 0,
            });
          })
          .finally(() => {
            this.activeRequests.delete(requestPromise);
          });
      }

      // Small delay to prevent overwhelming the system
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Wait for remaining requests to complete
    console.log(
      `⏳ Waiting for ${this.activeRequests.size} remaining requests...`,
    );
    await Promise.allSettled(Array.from(this.activeRequests));

    const actualEndTime = performance.now();
    const testResult = this.calculateMetrics(
      config,
      startTime,
      actualEndTime,
      results,
      errors,
    );

    this.results.push(testResult);
    this.logResults(testResult);

    return testResult;
  }

  private async makeRequest(config: LoadTestConfig): Promise<RequestResult> {
    const startTime = performance.now();

    try {
      const requestOptions: RequestInit = {
        method: config.method,
        headers: {
          "Content-Type": "application/json",
          ...config.headers,
        },
      };

      if (config.payload && config.method !== "GET") {
        requestOptions.body = JSON.stringify(config.payload);
      }

      const response = await fetch(config.endpoint, requestOptions);
      const responseText = await response.text();
      const endTime = performance.now();

      return {
        timestamp: startTime,
        responseTime: endTime - startTime,
        statusCode: response.status,
        success: response.ok,
        error: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
        size: responseText.length,
      };
    } catch (error) {
      const endTime = performance.now();
      return {
        timestamp: startTime,
        responseTime: endTime - startTime,
        statusCode: 0,
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        size: 0,
      };
    }
  }

  private calculateMetrics(
    config: LoadTestConfig,
    startTime: number,
    endTime: number,
    results: RequestResult[],
    errors: LoadTestResult["errors"],
  ): LoadTestResult {
    const duration = endTime - startTime;
    const totalRequests = results.length;
    const successfulRequests = results.filter((r) => r.success).length;
    const failedRequests = totalRequests - successfulRequests;

    // Calculate response time percentiles
    const responseTimes = results
      .map((r) => r.responseTime)
      .sort((a, b) => a - b);
    const avgResponseTime =
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length || 0;
    const minResponseTime = responseTimes[0] || 0;
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;
    const p50ResponseTime = this.percentile(responseTimes, 50);
    const p95ResponseTime = this.percentile(responseTimes, 95);
    const p99ResponseTime = this.percentile(responseTimes, 99);

    // Calculate throughput
    const requestsPerSecond = totalRequests / (duration / 1000);
    const errorRate = (failedRequests / totalRequests) * 100;

    // Check thresholds
    const thresholdResults = {
      avgResponseTime: {
        passed: avgResponseTime <= config.thresholds.avgResponseTime,
        actual: avgResponseTime,
        expected: config.thresholds.avgResponseTime,
      },
      p95ResponseTime: {
        passed: p95ResponseTime <= config.thresholds.p95ResponseTime,
        actual: p95ResponseTime,
        expected: config.thresholds.p95ResponseTime,
      },
      errorRate: {
        passed: errorRate <= config.thresholds.errorRate,
        actual: errorRate,
        expected: config.thresholds.errorRate,
      },
      requestsPerSecond: {
        passed: requestsPerSecond >= config.thresholds.requestsPerSecond,
        actual: requestsPerSecond,
        expected: config.thresholds.requestsPerSecond,
      },
    };

    return {
      config,
      startTime,
      endTime,
      totalRequests,
      successfulRequests,
      failedRequests,
      metrics: {
        avgResponseTime,
        minResponseTime,
        maxResponseTime,
        p50ResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        requestsPerSecond,
        errorRate,
        throughput: requestsPerSecond,
      },
      errors,
      thresholdResults,
    };
  }

  private percentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    const index = Math.ceil(values.length * (percentile / 100)) - 1;
    return values[Math.max(0, Math.min(index, values.length - 1))];
  }

  private logResults(result: LoadTestResult): void {
    const { metrics, thresholdResults } = result;

    console.log(`\n📊 Load Test Results: ${result.config.name}`);
    console.log("=".repeat(50));
    console.log(`Total Requests: ${result.totalRequests}`);
    console.log(`Successful: ${result.successfulRequests}`);
    console.log(`Failed: ${result.failedRequests}`);
    console.log(`Error Rate: ${metrics.errorRate.toFixed(2)}%`);
    console.log(`\nResponse Times:`);
    console.log(`  Average: ${metrics.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min: ${metrics.minResponseTime.toFixed(2)}ms`);
    console.log(`  Max: ${metrics.maxResponseTime.toFixed(2)}ms`);
    console.log(`  P50: ${metrics.p50ResponseTime.toFixed(2)}ms`);
    console.log(`  P95: ${metrics.p95ResponseTime.toFixed(2)}ms`);
    console.log(`  P99: ${metrics.p99ResponseTime.toFixed(2)}ms`);
    console.log(`\nThroughput: ${metrics.requestsPerSecond.toFixed(2)} req/s`);

    console.log(`\n🎯 Threshold Results:`);
    Object.entries(thresholdResults).forEach(([key, threshold]) => {
      const status = threshold.passed ? "✅" : "❌";
      console.log(
        `  ${status} ${key}: ${threshold.actual.toFixed(2)} (expected: ${threshold.expected})`,
      );
    });

    // Show error summary
    if (result.errors.length > 0) {
      console.log(`\n🚨 Error Summary (${result.errors.length} errors):`);
      const errorCounts = result.errors.reduce(
        (acc, error) => {
          const key = error.statusCode
            ? `HTTP ${error.statusCode}`
            : "Network Error";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      Object.entries(errorCounts).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    const allPassed = Object.values(thresholdResults).every((t) => t.passed);
    console.log(
      `\n${allPassed ? "🎉" : "⚠️"} Overall: ${allPassed ? "PASSED" : "FAILED"}`,
    );
  }

  async runMultipleTests(configs: LoadTestConfig[]): Promise<LoadTestResult[]> {
    console.log(`🧪 Running ${configs.length} load tests sequentially...`);

    const results: LoadTestResult[] = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      console.log(`\n--- Test ${i + 1}/${configs.length} ---`);

      const result = await this.runLoadTest(config);
      results.push(result);

      // Cool-down period between tests
      if (i < configs.length - 1) {
        console.log(`⏳ Cool-down period (5s)...`);
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    this.generateSummaryReport(results);
    return results;
  }

  private generateSummaryReport(results: LoadTestResult[]): void {
    console.log(`\n📈 Summary Report`);
    console.log("=".repeat(60));

    const totalPassed = results.filter((r) =>
      Object.values(r.thresholdResults).every((t) => t.passed),
    ).length;

    console.log(`Tests Run: ${results.length}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${results.length - totalPassed}`);
    console.log(
      `Success Rate: ${((totalPassed / results.length) * 100).toFixed(1)}%`,
    );

    console.log(`\nPerformance Summary:`);
    const avgResponseTimes = results.map((r) => r.metrics.avgResponseTime);
    const avgThroughput = results.map((r) => r.metrics.requestsPerSecond);
    const avgErrorRates = results.map((r) => r.metrics.errorRate);

    console.log(
      `  Avg Response Time: ${(avgResponseTimes.reduce((a, b) => a + b, 0) / avgResponseTimes.length).toFixed(2)}ms`,
    );
    console.log(
      `  Avg Throughput: ${(avgThroughput.reduce((a, b) => a + b, 0) / avgThroughput.length).toFixed(2)} req/s`,
    );
    console.log(
      `  Avg Error Rate: ${(avgErrorRates.reduce((a, b) => a + b, 0) / avgErrorRates.length).toFixed(2)}%`,
    );

    // Individual test summary
    console.log(`\nIndividual Test Results:`);
    results.forEach((result, index) => {
      const allPassed = Object.values(result.thresholdResults).every(
        (t) => t.passed,
      );
      const status = allPassed ? "✅" : "❌";
      console.log(
        `  ${status} ${result.config.name}: ${result.metrics.requestsPerSecond.toFixed(1)} req/s, ${result.metrics.avgResponseTime.toFixed(1)}ms avg`,
      );
    });
  }

  getResults(): LoadTestResult[] {
    return this.results;
  }

  exportResults(format: "json" | "csv" | "html" = "json"): string {
    switch (format) {
      case "csv":
        return this.exportToCSV();
      case "html":
        return this.exportToHTML();
      default:
        return JSON.stringify(this.results, null, 2);
    }
  }

  private exportToCSV(): string {
    const headers = [
      "Test Name",
      "Total Requests",
      "Successful Requests",
      "Failed Requests",
      "Error Rate (%)",
      "Avg Response Time (ms)",
      "P95 Response Time (ms)",
      "Requests Per Second",
      "Passed",
    ].join(",");

    const rows = this.results
      .map((result) => {
        const allPassed = Object.values(result.thresholdResults).every(
          (t) => t.passed,
        );
        return [
          `"${result.config.name}"`,
          result.totalRequests,
          result.successfulRequests,
          result.failedRequests,
          result.metrics.errorRate.toFixed(2),
          result.metrics.avgResponseTime.toFixed(2),
          result.metrics.p95ResponseTime.toFixed(2),
          result.metrics.requestsPerSecond.toFixed(2),
          allPassed,
        ].join(",");
      })
      .join("\n");

    return `${headers}\n${rows}`;
  }

  private exportToHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>Load Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .pass { color: green; }
        .fail { color: red; }
        .summary { background: #f0f8ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>ClaimGuardian AI Load Test Results</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Tests Run:</strong> ${this.results.length}</p>
        <p><strong>Total Requests:</strong> ${this.results.reduce((sum, r) => sum + r.totalRequests, 0)}</p>
        <p><strong>Average Throughput:</strong> ${(this.results.reduce((sum, r) => sum + r.metrics.requestsPerSecond, 0) / this.results.length).toFixed(2)} req/s</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Test Name</th>
                <th>Requests</th>
                <th>Success Rate</th>
                <th>Avg Response Time</th>
                <th>P95 Response Time</th>
                <th>Throughput</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${this.results
              .map((result) => {
                const allPassed = Object.values(result.thresholdResults).every(
                  (t) => t.passed,
                );
                const successRate = (
                  (result.successfulRequests / result.totalRequests) *
                  100
                ).toFixed(1);
                return `
                <tr>
                    <td>${result.config.name}</td>
                    <td>${result.totalRequests}</td>
                    <td>${successRate}%</td>
                    <td>${result.metrics.avgResponseTime.toFixed(2)}ms</td>
                    <td>${result.metrics.p95ResponseTime.toFixed(2)}ms</td>
                    <td>${result.metrics.requestsPerSecond.toFixed(2)} req/s</td>
                    <td class="${allPassed ? "pass" : "fail"}">${allPassed ? "PASS" : "FAIL"}</td>
                </tr>
              `;
              })
              .join("")}
        </tbody>
    </table>
</body>
</html>`;
  }
}

// Pre-defined load test configurations for ClaimGuardian AI endpoints
export const aiEndpointLoadTests: LoadTestConfig[] = [
  {
    name: "Damage Analyzer - Light Load",
    endpoint: "/api/ai/damage-analyzer",
    method: "POST",
    headers: {
      Authorization: "Bearer test-token",
    },
    payload: {
      prompt: "Analyze this property damage photo",
      model: "gpt-4-turbo",
      imageData: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...", // Mock base64 image
    },
    concurrent: 5,
    duration: 30000, // 30 seconds
    rampUp: 10, // 10 seconds to reach full load
    thresholds: {
      avgResponseTime: 3000, // 3 seconds
      p95ResponseTime: 5000, // 5 seconds
      errorRate: 5, // 5%
      requestsPerSecond: 2, // 2 req/s minimum
    },
  },

  {
    name: "Policy Advisor - Heavy Load",
    endpoint: "/api/ai/policy-advisor",
    method: "POST",
    headers: {
      Authorization: "Bearer test-token",
    },
    payload: {
      prompt: "Help me understand my insurance policy coverage options",
      model: "gpt-4",
      context: "homeowners insurance",
    },
    concurrent: 10,
    duration: 60000, // 1 minute
    rampUp: 15, // 15 seconds to reach full load
    thresholds: {
      avgResponseTime: 4000, // 4 seconds
      p95ResponseTime: 8000, // 8 seconds
      errorRate: 3, // 3%
      requestsPerSecond: 3, // 3 req/s minimum
    },
  },

  {
    name: "Inventory Scanner - Burst Load",
    endpoint: "/api/ai/inventory-scanner",
    method: "POST",
    headers: {
      Authorization: "Bearer test-token",
    },
    payload: {
      prompt: "Scan and categorize these household items",
      model: "gemini-pro-vision",
      items: ["furniture", "electronics", "jewelry"],
    },
    concurrent: 20,
    duration: 45000, // 45 seconds
    rampUp: 5, // 5 seconds - burst load
    thresholds: {
      avgResponseTime: 2500, // 2.5 seconds
      p95ResponseTime: 4000, // 4 seconds
      errorRate: 8, // 8% (higher tolerance for burst)
      requestsPerSecond: 5, // 5 req/s minimum
    },
  },

  {
    name: "Cost Tracking API",
    endpoint: "/api/ai/cost-tracking",
    method: "GET",
    headers: {
      Authorization: "Bearer test-token",
    },
    concurrent: 15,
    duration: 30000, // 30 seconds
    rampUp: 5,
    thresholds: {
      avgResponseTime: 500, // 500ms
      p95ResponseTime: 1000, // 1 second
      errorRate: 1, // 1%
      requestsPerSecond: 10, // 10 req/s minimum
    },
  },

  {
    name: "WebSocket Cost Updates",
    endpoint: "/api/ws/cost-updates",
    method: "GET",
    headers: {
      Upgrade: "websocket",
      Connection: "Upgrade",
    },
    concurrent: 25,
    duration: 60000, // 1 minute
    rampUp: 10,
    thresholds: {
      avgResponseTime: 200, // 200ms for WebSocket upgrade
      p95ResponseTime: 500, // 500ms
      errorRate: 2, // 2%
      requestsPerSecond: 8, // 8 req/s minimum
    },
  },
];

// Export main testing function
export async function runAILoadTests(): Promise<LoadTestResult[]> {
  console.log("🔥 Starting AI Endpoints Load Testing Suite");

  const loadTestFramework = new LoadTestFramework();

  try {
    const results =
      await loadTestFramework.runMultipleTests(aiEndpointLoadTests);

    console.log("\n📊 Generating detailed report...");
    const htmlReport = loadTestFramework.exportResults("html");

    // In a real implementation, you might save this to a file
    console.log("HTML report generated (would be saved to file)");

    return results;
  } catch (error) {
    console.error("❌ Load testing failed:", error);
    throw error;
  }
}
