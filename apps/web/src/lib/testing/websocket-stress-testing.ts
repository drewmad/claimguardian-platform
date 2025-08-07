/**
 * WebSocket Stress Testing Framework
 * Comprehensive stress testing for WebSocket connections and real-time features
 */

import { performance } from "perf_hooks";

export interface WebSocketStressConfig {
  name: string;
  url: string;
  concurrent: number; // Number of simultaneous connections
  duration: number; // Test duration in milliseconds
  messageRate: number; // Messages per second per connection
  messageSize: number; // Size of test messages in bytes
  protocols?: string[];
  headers?: Record<string, string>;
  reconnectOnFailure: boolean;
  maxReconnectAttempts: number;
  thresholds: {
    connectionSuccessRate: number; // Percentage
    messageSuccessRate: number; // Percentage
    avgLatency: number; // Milliseconds
    maxLatency: number; // Milliseconds
    connectionsPerSecond: number; // Minimum connections/sec
  };
}

export interface WebSocketConnection {
  id: string;
  ws: WebSocket | null;
  connected: boolean;
  messagesSent: number;
  messagesReceived: number;
  errors: string[];
  latencies: number[];
  connectTime?: number;
  disconnectTime?: number;
  reconnectAttempts: number;
}

export interface WebSocketStressResult {
  config: WebSocketStressConfig;
  startTime: number;
  endTime: number;
  connections: {
    attempted: number;
    successful: number;
    failed: number;
    active: number;
  };
  messages: {
    sent: number;
    received: number;
    lost: number;
  };
  metrics: {
    connectionSuccessRate: number;
    messageSuccessRate: number;
    avgLatency: number;
    minLatency: number;
    maxLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    connectionsPerSecond: number;
    messagesPerSecond: number;
    bandwidth: number; // bytes per second
  };
  errors: Array<{
    timestamp: number;
    connectionId: string;
    error: string;
    type: "connection" | "message" | "protocol";
  }>;
  thresholdResults: {
    connectionSuccessRate: {
      passed: boolean;
      actual: number;
      expected: number;
    };
    messageSuccessRate: { passed: boolean; actual: number; expected: number };
    avgLatency: { passed: boolean; actual: number; expected: number };
    maxLatency: { passed: boolean; actual: number; expected: number };
    connectionsPerSecond: { passed: boolean; actual: number; expected: number };
  };
}

export class WebSocketStressTestFramework {
  private connections: Map<string, WebSocketConnection> = new Map();
  private results: WebSocketStressResult[] = [];
  private messageLatencies: Map<string, number> = new Map(); // messageId -> timestamp

  async runStressTest(
    config: WebSocketStressConfig,
  ): Promise<WebSocketStressResult> {
    console.log(`🔥 Starting WebSocket stress test: ${config.name}`);
    console.log(`   URL: ${config.url}`);
    console.log(`   Concurrent connections: ${config.concurrent}`);
    console.log(`   Duration: ${config.duration}ms`);
    console.log(`   Message rate: ${config.messageRate} msg/s per connection`);

    const startTime = performance.now();
    const endTime = startTime + config.duration;
    const errors: WebSocketStressResult["errors"] = [];

    // Initialize connections
    await this.initializeConnections(config, errors);

    // Wait for connections to establish
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Start message sending
    this.startMessageSending(config, endTime, errors);

    // Monitor connections during test
    const monitorInterval = setInterval(() => {
      this.monitorConnections(errors);
    }, 1000);

    // Wait for test duration
    await new Promise((resolve) => setTimeout(resolve, config.duration));

    // Stop monitoring and clean up
    clearInterval(monitorInterval);
    this.cleanup();

    const actualEndTime = performance.now();
    const result = this.calculateResults(
      config,
      startTime,
      actualEndTime,
      errors,
    );

    this.results.push(result);
    this.logResults(result);

    return result;
  }

  private async initializeConnections(
    config: WebSocketStressConfig,
    errors: WebSocketStressResult["errors"],
  ): Promise<void> {
    console.log(
      `📡 Establishing ${config.concurrent} WebSocket connections...`,
    );

    const connectionPromises: Promise<void>[] = [];

    for (let i = 0; i < config.concurrent; i++) {
      const connectionId = `conn-${i}`;
      const connection: WebSocketConnection = {
        id: connectionId,
        ws: null,
        connected: false,
        messagesSent: 0,
        messagesReceived: 0,
        errors: [],
        latencies: [],
        reconnectAttempts: 0,
      };

      this.connections.set(connectionId, connection);

      const promise = this.establishConnection(connection, config, errors);
      connectionPromises.push(promise);

      // Stagger connection attempts to avoid overwhelming the server
      if (i > 0 && i % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    // Wait for all connections to attempt
    await Promise.allSettled(connectionPromises);

    const successfulConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.connected,
    ).length;

    console.log(
      `✅ ${successfulConnections}/${config.concurrent} connections established`,
    );
  }

  private async establishConnection(
    connection: WebSocketConnection,
    config: WebSocketStressConfig,
    errors: WebSocketStressResult["errors"],
  ): Promise<void> {
    return new Promise((resolve) => {
      try {
        const connectStart = performance.now();

        // Create WebSocket connection
        const ws = new WebSocket(config.url, config.protocols);
        connection.ws = ws;

        const timeout = setTimeout(() => {
          if (!connection.connected) {
            ws.close();
            errors.push({
              timestamp: performance.now(),
              connectionId: connection.id,
              error: "Connection timeout",
              type: "connection",
            });
            resolve();
          }
        }, 10000); // 10 second timeout

        ws.onopen = () => {
          const connectEnd = performance.now();
          connection.connected = true;
          connection.connectTime = connectEnd - connectStart;
          clearTimeout(timeout);
          resolve();
        };

        ws.onmessage = (event) => {
          connection.messagesReceived++;
          this.handleMessage(connection, event, errors);
        };

        ws.onerror = (error) => {
          connection.errors.push(`WebSocket error: ${error}`);
          errors.push({
            timestamp: performance.now(),
            connectionId: connection.id,
            error: `WebSocket error: ${error}`,
            type: "connection",
          });
        };

        ws.onclose = (event) => {
          connection.connected = false;
          connection.disconnectTime = performance.now();

          if (!event.wasClean) {
            errors.push({
              timestamp: performance.now(),
              connectionId: connection.id,
              error: `Connection closed unexpectedly: ${event.code} ${event.reason}`,
              type: "connection",
            });

            // Attempt reconnection if enabled
            if (
              config.reconnectOnFailure &&
              connection.reconnectAttempts < config.maxReconnectAttempts
            ) {
              connection.reconnectAttempts++;
              setTimeout(() => {
                this.establishConnection(connection, config, errors);
              }, 1000 * connection.reconnectAttempts); // Exponential backoff
            }
          }

          if (!connection.connected) {
            resolve();
          }
        };
      } catch (error) {
        errors.push({
          timestamp: performance.now(),
          connectionId: connection.id,
          error: `Failed to create WebSocket: ${error}`,
          type: "connection",
        });
        resolve();
      }
    });
  }

  private handleMessage(
    connection: WebSocketConnection,
    event: MessageEvent,
    errors: WebSocketStressResult["errors"],
  ): void {
    try {
      const data = JSON.parse(event.data);

      // Calculate latency if it's a response to our message
      if (data.messageId && this.messageLatencies.has(data.messageId)) {
        const sentTime = this.messageLatencies.get(data.messageId)!;
        const latency = performance.now() - sentTime;
        connection.latencies.push(latency);
        this.messageLatencies.delete(data.messageId);
      }

      // Handle different message types
      switch (data.type) {
        case "ping":
          // Respond to ping
          this.sendMessage(
            connection,
            { type: "pong", timestamp: data.timestamp },
            errors,
          );
          break;
        case "cost_update":
          // Handle cost tracking updates
          break;
        case "alert":
          // Handle real-time alerts
          break;
        default:
          // Unknown message type
          break;
      }
    } catch (error) {
      errors.push({
        timestamp: performance.now(),
        connectionId: connection.id,
        error: `Failed to parse message: ${error}`,
        type: "message",
      });
    }
  }

  private startMessageSending(
    config: WebSocketStressConfig,
    endTime: number,
    errors: WebSocketStressResult["errors"],
  ): void {
    const connectedConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.connected,
    );

    console.log(
      `📤 Starting message sending for ${connectedConnections.length} connections...`,
    );

    connectedConnections.forEach((connection) => {
      this.sendMessagesForConnection(connection, config, endTime, errors);
    });
  }

  private sendMessagesForConnection(
    connection: WebSocketConnection,
    config: WebSocketStressConfig,
    endTime: number,
    errors: WebSocketStressResult["errors"],
  ): void {
    const interval = 1000 / config.messageRate; // ms between messages

    const sendMessage = () => {
      if (performance.now() >= endTime || !connection.connected) {
        return;
      }

      const messageId = `${connection.id}-${Date.now()}-${Math.random()}`;
      const message = {
        messageId,
        type: "test_message",
        timestamp: performance.now(),
        data: "x".repeat(config.messageSize - 100), // Adjust for JSON overhead
      };

      this.messageLatencies.set(messageId, performance.now());
      this.sendMessage(connection, message, errors);

      // Schedule next message
      setTimeout(sendMessage, interval + Math.random() * 100 - 50); // ±50ms jitter
    };

    // Start sending messages with staggered start
    setTimeout(sendMessage, Math.random() * 1000);
  }

  private sendMessage(
    connection: WebSocketConnection,
    message: unknown,
    errors: WebSocketStressResult["errors"],
  ): void {
    if (!connection.ws || !connection.connected) {
      return;
    }

    try {
      connection.ws.send(JSON.stringify(message));
      connection.messagesSent++;
    } catch (error) {
      errors.push({
        timestamp: performance.now(),
        connectionId: connection.id,
        error: `Failed to send message: ${error}`,
        type: "message",
      });
    }
  }

  private monitorConnections(errors: WebSocketStressResult["errors"]): void {
    const activeConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.connected,
    ).length;

    // Log connection status periodically
    if (Math.random() < 0.1) {
      // 10% chance each second
      console.log(
        `📊 Active connections: ${activeConnections}/${this.connections.size}`,
      );
    }

    // Check for hung connections
    this.connections.forEach((connection) => {
      if (connection.ws && connection.ws.readyState === WebSocket.CONNECTING) {
        // Connection has been stuck in CONNECTING state too long
        const now = performance.now();
        if (connection.connectTime && now - connection.connectTime > 15000) {
          connection.ws.close();
          errors.push({
            timestamp: now,
            connectionId: connection.id,
            error: "Connection hung in CONNECTING state",
            type: "connection",
          });
        }
      }
    });
  }

  private cleanup(): void {
    console.log(`🧹 Cleaning up ${this.connections.size} connections...`);

    this.connections.forEach((connection) => {
      if (connection.ws && connection.connected) {
        connection.ws.close(1000, "Test completed");
      }
    });

    // Clear latency tracking
    this.messageLatencies.clear();
  }

  private calculateResults(
    config: WebSocketStressConfig,
    startTime: number,
    endTime: number,
    errors: WebSocketStressResult["errors"],
  ): WebSocketStressResult {
    const duration = endTime - startTime;
    const connections = Array.from(this.connections.values());

    // Connection metrics
    const attemptedConnections = connections.length;
    const successfulConnections = connections.filter(
      (c) => c.connected || c.connectTime,
    ).length;
    const failedConnections = attemptedConnections - successfulConnections;
    const activeConnections = connections.filter((c) => c.connected).length;

    // Message metrics
    const totalMessagesSent = connections.reduce(
      (sum, c) => sum + c.messagesSent,
      0,
    );
    const totalMessagesReceived = connections.reduce(
      (sum, c) => sum + c.messagesReceived,
      0,
    );
    const lostMessages = totalMessagesSent - totalMessagesReceived;

    // Latency metrics
    const allLatencies = connections
      .flatMap((c) => c.latencies)
      .sort((a, b) => a - b);
    const avgLatency =
      allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length || 0;
    const minLatency = allLatencies[0] || 0;
    const maxLatency = allLatencies[allLatencies.length - 1] || 0;
    const p50Latency = this.percentile(allLatencies, 50);
    const p95Latency = this.percentile(allLatencies, 95);
    const p99Latency = this.percentile(allLatencies, 99);

    // Throughput metrics
    const connectionSuccessRate =
      (successfulConnections / attemptedConnections) * 100;
    const messageSuccessRate =
      totalMessagesSent > 0
        ? (totalMessagesReceived / totalMessagesSent) * 100
        : 0;
    const connectionsPerSecond = successfulConnections / (duration / 1000);
    const messagesPerSecond = totalMessagesReceived / (duration / 1000);
    const bandwidth =
      (totalMessagesReceived * config.messageSize) / (duration / 1000);

    // Threshold checks
    const thresholdResults = {
      connectionSuccessRate: {
        passed:
          connectionSuccessRate >= config.thresholds.connectionSuccessRate,
        actual: connectionSuccessRate,
        expected: config.thresholds.connectionSuccessRate,
      },
      messageSuccessRate: {
        passed: messageSuccessRate >= config.thresholds.messageSuccessRate,
        actual: messageSuccessRate,
        expected: config.thresholds.messageSuccessRate,
      },
      avgLatency: {
        passed: avgLatency <= config.thresholds.avgLatency,
        actual: avgLatency,
        expected: config.thresholds.avgLatency,
      },
      maxLatency: {
        passed: maxLatency <= config.thresholds.maxLatency,
        actual: maxLatency,
        expected: config.thresholds.maxLatency,
      },
      connectionsPerSecond: {
        passed: connectionsPerSecond >= config.thresholds.connectionsPerSecond,
        actual: connectionsPerSecond,
        expected: config.thresholds.connectionsPerSecond,
      },
    };

    return {
      config,
      startTime,
      endTime,
      connections: {
        attempted: attemptedConnections,
        successful: successfulConnections,
        failed: failedConnections,
        active: activeConnections,
      },
      messages: {
        sent: totalMessagesSent,
        received: totalMessagesReceived,
        lost: lostMessages,
      },
      metrics: {
        connectionSuccessRate,
        messageSuccessRate,
        avgLatency,
        minLatency,
        maxLatency,
        p50Latency,
        p95Latency,
        p99Latency,
        connectionsPerSecond,
        messagesPerSecond,
        bandwidth,
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

  private logResults(result: WebSocketStressResult): void {
    const { connections, messages, metrics, thresholdResults } = result;

    console.log(`\n🔥 WebSocket Stress Test Results: ${result.config.name}`);
    console.log("=".repeat(60));

    console.log(`\nConnections:`);
    console.log(`  Attempted: ${connections.attempted}`);
    console.log(`  Successful: ${connections.successful}`);
    console.log(`  Failed: ${connections.failed}`);
    console.log(`  Success Rate: ${metrics.connectionSuccessRate.toFixed(2)}%`);
    console.log(
      `  Connections/sec: ${metrics.connectionsPerSecond.toFixed(2)}`,
    );

    console.log(`\nMessages:`);
    console.log(`  Sent: ${messages.sent}`);
    console.log(`  Received: ${messages.received}`);
    console.log(`  Lost: ${messages.lost}`);
    console.log(`  Success Rate: ${metrics.messageSuccessRate.toFixed(2)}%`);
    console.log(`  Messages/sec: ${metrics.messagesPerSecond.toFixed(2)}`);

    console.log(`\nLatency (ms):`);
    console.log(`  Average: ${metrics.avgLatency.toFixed(2)}`);
    console.log(`  Min: ${metrics.minLatency.toFixed(2)}`);
    console.log(`  Max: ${metrics.maxLatency.toFixed(2)}`);
    console.log(`  P50: ${metrics.p50Latency.toFixed(2)}`);
    console.log(`  P95: ${metrics.p95Latency.toFixed(2)}`);
    console.log(`  P99: ${metrics.p99Latency.toFixed(2)}`);

    console.log(`\nThroughput:`);
    console.log(`  Bandwidth: ${(metrics.bandwidth / 1024).toFixed(2)} KB/s`);

    console.log(`\n🎯 Threshold Results:`);
    Object.entries(thresholdResults).forEach(([key, threshold]) => {
      const status = threshold.passed ? "✅" : "❌";
      console.log(
        `  ${status} ${key}: ${threshold.actual.toFixed(2)} (expected: ${threshold.expected})`,
      );
    });

    // Error summary
    if (result.errors.length > 0) {
      console.log(`\n🚨 Error Summary (${result.errors.length} errors):`);
      const errorTypes = result.errors.reduce(
        (acc, error) => {
          acc[error.type] = (acc[error.type] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      Object.entries(errorTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    const allPassed = Object.values(thresholdResults).every((t) => t.passed);
    console.log(
      `\n${allPassed ? "🎉" : "⚠️"} Overall: ${allPassed ? "PASSED" : "FAILED"}`,
    );
  }

  async runMultipleTests(
    configs: WebSocketStressConfig[],
  ): Promise<WebSocketStressResult[]> {
    console.log(`🧪 Running ${configs.length} WebSocket stress tests...`);

    const results: WebSocketStressResult[] = [];

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      console.log(`\n--- WebSocket Test ${i + 1}/${configs.length} ---`);

      const result = await this.runStressTest(config);
      results.push(result);

      // Cool-down period between tests
      if (i < configs.length - 1) {
        console.log(`⏳ Cool-down period (10s)...`);
        await new Promise((resolve) => setTimeout(resolve, 10000));
      }
    }

    this.generateSummaryReport(results);
    return results;
  }

  private generateSummaryReport(results: WebSocketStressResult[]): void {
    console.log(`\n📈 WebSocket Stress Test Summary`);
    console.log("=".repeat(70));

    const totalPassed = results.filter((r) =>
      Object.values(r.thresholdResults).every((t) => t.passed),
    ).length;

    console.log(`Tests Run: ${results.length}`);
    console.log(`Passed: ${totalPassed}`);
    console.log(`Failed: ${results.length - totalPassed}`);
    console.log(
      `Success Rate: ${((totalPassed / results.length) * 100).toFixed(1)}%`,
    );

    // Aggregate statistics
    const totalConnections = results.reduce(
      (sum, r) => sum + r.connections.attempted,
      0,
    );
    const totalMessages = results.reduce((sum, r) => sum + r.messages.sent, 0);
    const avgConnectionSuccessRate =
      results.reduce((sum, r) => sum + r.metrics.connectionSuccessRate, 0) /
      results.length;
    const avgMessageSuccessRate =
      results.reduce((sum, r) => sum + r.metrics.messageSuccessRate, 0) /
      results.length;
    const avgLatency =
      results.reduce((sum, r) => sum + r.metrics.avgLatency, 0) /
      results.length;

    console.log(`\nAggregate Statistics:`);
    console.log(`  Total Connections Tested: ${totalConnections}`);
    console.log(`  Total Messages Sent: ${totalMessages}`);
    console.log(
      `  Avg Connection Success Rate: ${avgConnectionSuccessRate.toFixed(2)}%`,
    );
    console.log(
      `  Avg Message Success Rate: ${avgMessageSuccessRate.toFixed(2)}%`,
    );
    console.log(`  Avg Latency: ${avgLatency.toFixed(2)}ms`);

    console.log(`\nIndividual Test Results:`);
    results.forEach((result, index) => {
      const allPassed = Object.values(result.thresholdResults).every(
        (t) => t.passed,
      );
      const status = allPassed ? "✅" : "❌";
      console.log(
        `  ${status} ${result.config.name}: ${result.connections.successful}/${result.connections.attempted} connections, ${result.metrics.avgLatency.toFixed(1)}ms avg latency`,
      );
    });
  }

  getResults(): WebSocketStressResult[] {
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
      "Connections Attempted",
      "Connections Successful",
      "Connection Success Rate (%)",
      "Messages Sent",
      "Messages Received",
      "Message Success Rate (%)",
      "Avg Latency (ms)",
      "P95 Latency (ms)",
      "Passed",
    ].join(",");

    const rows = this.results
      .map((result) => {
        const allPassed = Object.values(result.thresholdResults).every(
          (t) => t.passed,
        );
        return [
          `"${result.config.name}"`,
          result.connections.attempted,
          result.connections.successful,
          result.metrics.connectionSuccessRate.toFixed(2),
          result.messages.sent,
          result.messages.received,
          result.metrics.messageSuccessRate.toFixed(2),
          result.metrics.avgLatency.toFixed(2),
          result.metrics.p95Latency.toFixed(2),
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
    <title>WebSocket Stress Test Results</title>
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
    <h1>ClaimGuardian WebSocket Stress Test Results</h1>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Tests Run:</strong> ${this.results.length}</p>
        <p><strong>Total Connections:</strong> ${this.results.reduce((sum, r) => sum + r.connections.attempted, 0)}</p>
        <p><strong>Total Messages:</strong> ${this.results.reduce((sum, r) => sum + r.messages.sent, 0)}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Test Name</th>
                <th>Connections</th>
                <th>Success Rate</th>
                <th>Messages</th>
                <th>Avg Latency</th>
                <th>P95 Latency</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${this.results
              .map((result) => {
                const allPassed = Object.values(result.thresholdResults).every(
                  (t) => t.passed,
                );
                return `
                <tr>
                    <td>${result.config.name}</td>
                    <td>${result.connections.successful}/${result.connections.attempted}</td>
                    <td>${result.metrics.connectionSuccessRate.toFixed(1)}%</td>
                    <td>${result.messages.received}/${result.messages.sent}</td>
                    <td>${result.metrics.avgLatency.toFixed(2)}ms</td>
                    <td>${result.metrics.p95Latency.toFixed(2)}ms</td>
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

// Pre-defined WebSocket stress test configurations
export const webSocketStressTests: WebSocketStressConfig[] = [
  {
    name: "Cost Tracking WebSocket - Normal Load",
    url: "ws://localhost:3000/api/ws/cost-updates",
    concurrent: 50,
    duration: 60000, // 1 minute
    messageRate: 2, // 2 messages per second per connection
    messageSize: 512, // 512 bytes
    reconnectOnFailure: true,
    maxReconnectAttempts: 3,
    thresholds: {
      connectionSuccessRate: 90, // 90%
      messageSuccessRate: 95, // 95%
      avgLatency: 100, // 100ms
      maxLatency: 500, // 500ms
      connectionsPerSecond: 10, // 10 connections/sec minimum
    },
  },

  {
    name: "Cost Tracking WebSocket - High Load",
    url: "ws://localhost:3000/api/ws/cost-updates",
    concurrent: 200,
    duration: 120000, // 2 minutes
    messageRate: 5, // 5 messages per second per connection
    messageSize: 1024, // 1KB
    reconnectOnFailure: true,
    maxReconnectAttempts: 2,
    thresholds: {
      connectionSuccessRate: 85, // 85%
      messageSuccessRate: 90, // 90%
      avgLatency: 200, // 200ms
      maxLatency: 1000, // 1 second
      connectionsPerSecond: 20, // 20 connections/sec minimum
    },
  },

  {
    name: "Alert Delivery WebSocket - Burst Load",
    url: "ws://localhost:3000/api/ws/alerts",
    concurrent: 500,
    duration: 30000, // 30 seconds
    messageRate: 10, // 10 messages per second per connection
    messageSize: 256, // 256 bytes
    reconnectOnFailure: false, // No reconnection for burst test
    maxReconnectAttempts: 0,
    thresholds: {
      connectionSuccessRate: 75, // 75% (lower expectation for burst)
      messageSuccessRate: 80, // 80%
      avgLatency: 300, // 300ms
      maxLatency: 2000, // 2 seconds
      connectionsPerSecond: 50, // 50 connections/sec minimum
    },
  },

  {
    name: "Real-time Dashboard - Sustained Load",
    url: "ws://localhost:3000/api/ws/dashboard",
    concurrent: 100,
    duration: 300000, // 5 minutes
    messageRate: 1, // 1 message per second per connection
    messageSize: 2048, // 2KB (larger dashboard updates)
    reconnectOnFailure: true,
    maxReconnectAttempts: 5,
    thresholds: {
      connectionSuccessRate: 95, // 95%
      messageSuccessRate: 98, // 98%
      avgLatency: 150, // 150ms
      maxLatency: 750, // 750ms
      connectionsPerSecond: 15, // 15 connections/sec minimum
    },
  },
];

// Export main testing function
export async function runWebSocketStressTests(): Promise<
  WebSocketStressResult[]
> {
  console.log("⚡ Starting WebSocket Stress Testing Suite");

  const stressTestFramework = new WebSocketStressTestFramework();

  try {
    const results =
      await stressTestFramework.runMultipleTests(webSocketStressTests);

    console.log("\n📊 Generating detailed report...");
    const htmlReport = stressTestFramework.exportResults("html");

    // In a real implementation, you might save this to a file
    console.log("HTML report generated (would be saved to file)");

    return results;
  } catch (error) {
    console.error("❌ WebSocket stress testing failed:", error);
    throw error;
  }
}
