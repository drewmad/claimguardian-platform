/**
 * WebSocket Alert Delivery System
 * Multi-channel alert delivery for WebSocket monitoring
 */

import { webSocketMonitor, WebSocketAlert, WebSocketServiceMetrics } from "./websocket-metrics";

export interface AlertChannel {
  name: string;
  type: "email" | "slack" | "discord" | "webhook" | "sms" | "pagerduty";
  enabled: boolean;
  config: Record<string, unknown>;
  severityFilter: Array<WebSocketAlert["severity"]>;
  rateLimitMinutes: number;
  lastSent: number;
}

export interface AlertRule {
  name: string;
  condition: (metrics: WebSocketServiceMetrics) => boolean;
  message: (metrics: WebSocketServiceMetrics) => string;
  severity: WebSocketAlert["severity"];
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered: number;
}

export class WebSocketAlertManager {
  private channels: Map<string, AlertChannel> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private alertHistory: Array<{
    timestamp: number;
    alert: WebSocketAlert;
    channels: string[];
    success: boolean;
  }> = [];

  constructor() {
    this.setupDefaultChannels();
    this.setupDefaultRules();
    this.startListening();
  }

  private setupDefaultChannels(): void {
    // Slack channel for critical alerts
    this.addChannel({
      name: "slack-critical",
      type: "slack",
      enabled: true,
      config: {
        webhookUrl: process.env.SLACK_WEBHOOK_URL,
        channel: "#websocket-alerts",
        username: "ClaimGuardian WebSocket Monitor",
      },
      severityFilter: ["critical", "emergency"],
      rateLimitMinutes: 5,
      lastSent: 0,
    });

    // Email channel for all alerts
    this.addChannel({
      name: "email-ops",
      type: "email",
      enabled: true,
      config: {
        to: process.env.OPS_EMAIL || "ops@claimguardianai.com",
        subject: "ClaimGuardian WebSocket Alert",
      },
      severityFilter: ["warning", "critical", "emergency"],
      rateLimitMinutes: 15,
      lastSent: 0,
    });

    // Discord webhook for development alerts
    this.addChannel({
      name: "discord-dev",
      type: "discord",
      enabled: !!process.env.DISCORD_WEBHOOK_URL,
      config: {
        webhookUrl: process.env.DISCORD_WEBHOOK_URL,
      },
      severityFilter: ["info", "warning", "critical", "emergency"],
      rateLimitMinutes: 10,
      lastSent: 0,
    });

    // Custom webhook for external monitoring
    this.addChannel({
      name: "monitoring-webhook",
      type: "webhook",
      enabled: !!process.env.MONITORING_WEBHOOK_URL,
      config: {
        url: process.env.MONITORING_WEBHOOK_URL,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.MONITORING_WEBHOOK_TOKEN}`,
        },
      },
      severityFilter: ["critical", "emergency"],
      rateLimitMinutes: 1,
      lastSent: 0,
    });
  }

  private setupDefaultRules(): void {
    // High connection count rule
    this.addRule({
      name: "high-connection-count",
      condition: (metrics) => metrics.activeConnections > 750,
      message: (metrics) =>
        `High WebSocket connection count: ${metrics.activeConnections} active connections (threshold: 750)`,
      severity: "warning",
      enabled: true,
      cooldownMinutes: 15,
      lastTriggered: 0,
    });

    // Critical connection count rule
    this.addRule({
      name: "critical-connection-count",
      condition: (metrics) => metrics.activeConnections > 900,
      message: (metrics) =>
        `CRITICAL: WebSocket connection count: ${metrics.activeConnections} active connections (threshold: 900)`,
      severity: "critical",
      enabled: true,
      cooldownMinutes: 5,
      lastTriggered: 0,
    });

    // High error rate rule
    this.addRule({
      name: "high-error-rate",
      condition: (metrics) => metrics.errorRate > 10,
      message: (metrics) =>
        `High WebSocket error rate: ${metrics.errorRate.toFixed(2)} errors/minute (threshold: 10)`,
      severity: "warning",
      enabled: true,
      cooldownMinutes: 10,
      lastTriggered: 0,
    });

    // Critical error rate rule
    this.addRule({
      name: "critical-error-rate",
      condition: (metrics) => metrics.errorRate > 25,
      message: (metrics) =>
        `CRITICAL: WebSocket error rate: ${metrics.errorRate.toFixed(2)} errors/minute (threshold: 25)`,
      severity: "critical",
      enabled: true,
      cooldownMinutes: 5,
      lastTriggered: 0,
    });

    // High latency rule
    this.addRule({
      name: "high-latency",
      condition: (metrics) => metrics.avgLatency > 2000,
      message: (metrics) =>
        `High WebSocket latency: ${metrics.avgLatency.toFixed(2)}ms average (threshold: 2000ms)`,
      severity: "warning",
      enabled: true,
      cooldownMinutes: 10,
      lastTriggered: 0,
    });

    // Memory usage rule
    this.addRule({
      name: "high-memory-usage",
      condition: (metrics) => metrics.memoryUsage > 200 * 1024 * 1024, // 200MB
      message: (metrics) =>
        `High WebSocket memory usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB (threshold: 200MB)`,
      severity: "warning",
      enabled: true,
      cooldownMinutes: 20,
      lastTriggered: 0,
    });

    // Connection drop rate rule
    this.addRule({
      name: "high-drop-rate",
      condition: (metrics) => {
        const dropRate =
          (metrics.disconnectionRate / (metrics.connectionRate || 1)) * 100;
        return dropRate > 20 && metrics.connectionRate > 1;
      },
      message: (metrics) => {
        const dropRate =
          (metrics.disconnectionRate / (metrics.connectionRate || 1)) * 100;
        return `High WebSocket connection drop rate: ${dropRate.toFixed(2)}% (threshold: 20%)`;
      },
      severity: "warning",
      enabled: true,
      cooldownMinutes: 15,
      lastTriggered: 0,
    });

    // Service health rule
    this.addRule({
      name: "service-unhealthy",
      condition: () => {
        const health = webSocketMonitor.getHealthStatus();
        return health.status === "unhealthy";
      },
      message: () => {
        const health = webSocketMonitor.getHealthStatus();
        const failedChecks = Object.entries(health.checks)
          .filter(([_, check]) => check.status === "fail")
          .map(([name, check]) => `${name}: ${check.message}`)
          .join(", ");
        return `WebSocket service is unhealthy. Failed checks: ${failedChecks}`;
      },
      severity: "critical",
      enabled: true,
      cooldownMinutes: 10,
      lastTriggered: 0,
    });
  }

  private startListening(): void {
    // Listen to WebSocket monitor events
    webSocketMonitor.on("alert", (alert: WebSocketAlert) => {
      this.handleAlert(alert);
    });

    webSocketMonitor.on("metrics_updated", (metrics) => {
      this.checkRules(metrics);
    });

    // Periodic health check
    setInterval(() => {
      this.performHealthCheck();
    }, 60000); // Every minute

    console.log("✅ WebSocket alert manager started");
  }

  // Channel management
  addChannel(channel: AlertChannel): void {
    this.channels.set(channel.name, channel);
  }

  removeChannel(name: string): void {
    this.channels.delete(name);
  }

  updateChannel(name: string, updates: Partial<AlertChannel>): void {
    const channel = this.channels.get(name);
    if (channel) {
      Object.assign(channel, updates);
    }
  }

  getChannels(): AlertChannel[] {
    return Array.from(this.channels.values());
  }

  // Rule management
  addRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
  }

  removeRule(name: string): void {
    this.rules.delete(name);
  }

  updateRule(name: string, updates: Partial<AlertRule>): void {
    const rule = this.rules.get(name);
    if (rule) {
      Object.assign(rule, updates);
    }
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // Alert handling
  private async handleAlert(alert: WebSocketAlert): Promise<void> {
    console.log(`🚨 Handling WebSocket alert: ${alert.message}`);

    const eligibleChannels = this.getEligibleChannels(alert);
    const deliveryResults = await Promise.allSettled(
      eligibleChannels.map((channel) => this.deliverAlert(alert, channel)),
    );

    const successfulDeliveries = deliveryResults.filter(
      (r) => r.status === "fulfilled",
    ).length;
    const channelNames = eligibleChannels.map((c) => c.name);

    this.alertHistory.push({
      timestamp: alert.timestamp,
      alert,
      channels: channelNames,
      success: successfulDeliveries > 0,
    });

    // Trim history to last 1000 alerts
    if (this.alertHistory.length > 1000) {
      this.alertHistory.shift();
    }

    console.log(
      `📤 Alert delivered to ${successfulDeliveries}/${eligibleChannels.length} channels`,
    );
  }

  private getEligibleChannels(alert: WebSocketAlert): AlertChannel[] {
    const now = Date.now();

    return Array.from(this.channels.values()).filter((channel) => {
      // Check if channel is enabled
      if (!channel.enabled) return false;

      // Check severity filter
      if (!channel.severityFilter.includes(alert.severity)) return false;

      // Check rate limit
      const timeSinceLastSent = now - channel.lastSent;
      const rateLimitMs = channel.rateLimitMinutes * 60 * 1000;
      if (timeSinceLastSent < rateLimitMs) return false;

      return true;
    });
  }

  private async deliverAlert(
    alert: WebSocketAlert,
    channel: AlertChannel,
  ): Promise<void> {
    try {
      switch (channel.type) {
        case "slack":
          await this.deliverToSlack(alert, channel);
          break;
        case "discord":
          await this.deliverToDiscord(alert, channel);
          break;
        case "email":
          await this.deliverToEmail(alert, channel);
          break;
        case "webhook":
          await this.deliverToWebhook(alert, channel);
          break;
        case "sms":
          await this.deliverToSMS(alert, channel);
          break;
        case "pagerduty":
          await this.deliverToPagerDuty(alert, channel);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }

      channel.lastSent = Date.now();
      console.log(`✅ Alert delivered to ${channel.name} (${channel.type})`);
    } catch (error) {
      console.error(`❌ Failed to deliver alert to ${channel.name}:`, error);
      throw error;
    }
  }

  private async deliverToSlack(
    alert: WebSocketAlert,
    channel: AlertChannel,
  ): Promise<void> {
    const webhookUrl = channel.config.webhookUrl as string;
    if (!webhookUrl) throw new Error("Slack webhook URL not configured");

    const color = this.getSeverityColor(alert.severity);
    const payload = {
      channel: channel.config.channel,
      username: channel.config.username || "WebSocket Monitor",
      attachments: [
        {
          color,
          title: `WebSocket ${alert.type.replace(/_/g, " ").toUpperCase()} Alert`,
          text: alert.message,
          fields: [
            {
              title: "Severity",
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: "Timestamp",
              value: new Date(alert.timestamp).toISOString(),
              short: true,
            },
            ...(alert.metadata
              ? Object.entries(alert.metadata).map(([key, value]) => ({
                  title: key.replace(/_/g, " ").toUpperCase(),
                  value: String(value),
                  short: true,
                }))
              : []),
          ],
          footer: "ClaimGuardian WebSocket Monitor",
          ts: Math.floor(alert.timestamp / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack delivery failed: ${response.statusText}`);
    }
  }

  private async deliverToDiscord(
    alert: WebSocketAlert,
    channel: AlertChannel,
  ): Promise<void> {
    const webhookUrl = channel.config.webhookUrl as string;
    if (!webhookUrl) throw new Error("Discord webhook URL not configured");

    const color = this.getSeverityColorInt(alert.severity);
    const payload = {
      embeds: [
        {
          title: `🔥 WebSocket ${alert.type.replace(/_/g, " ").toUpperCase()} Alert`,
          description: alert.message,
          color,
          fields: [
            {
              name: "Severity",
              value: alert.severity.toUpperCase(),
              inline: true,
            },
            {
              name: "Time",
              value: new Date(alert.timestamp).toLocaleString(),
              inline: true,
            },
            ...(alert.metadata
              ? Object.entries(alert.metadata).map(([key, value]) => ({
                  name: key.replace(/_/g, " ").toUpperCase(),
                  value: String(value),
                  inline: true,
                }))
              : []),
          ],
          footer: {
            text: "ClaimGuardian WebSocket Monitor",
          },
          timestamp: new Date(alert.timestamp).toISOString(),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord delivery failed: ${response.statusText}`);
    }
  }

  private async deliverToEmail(
    alert: WebSocketAlert,
    channel: AlertChannel,
  ): Promise<void> {
    // This would integrate with your email service (Resend, SendGrid, etc.)
    const emailPayload = {
      to: channel.config.to as string,
      subject: `${channel.config.subject} - ${alert.severity.toUpperCase()}`,
      html: this.generateEmailHTML(alert),
      text: this.generateEmailText(alert),
    };

    // Mock email delivery - replace with actual email service
    console.log(
      `📧 Email would be sent to ${emailPayload.to}:`,
      emailPayload.subject,
    );
  }

  private async deliverToWebhook(
    alert: WebSocketAlert,
    channel: AlertChannel,
  ): Promise<void> {
    const url = channel.config.url as string;
    const method = (channel.config.method as string) || "POST";
    const headers = (channel.config.headers as Record<string, string>) || {};

    const payload = {
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: alert.timestamp,
      metadata: alert.metadata,
      source: "claimguardian-websocket-monitor",
    };

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook delivery failed: ${response.statusText}`);
    }
  }

  private async deliverToSMS(
    alert: WebSocketAlert,
    channel: AlertChannel,
  ): Promise<void> {
    // This would integrate with SMS service (Twilio, AWS SNS, etc.)
    const message = `ClaimGuardian WebSocket Alert [${alert.severity.toUpperCase()}]: ${alert.message}`;
    console.log(`📱 SMS would be sent: ${message}`);
  }

  private async deliverToPagerDuty(
    alert: WebSocketAlert,
    channel: AlertChannel,
  ): Promise<void> {
    // This would integrate with PagerDuty Events API
    const payload = {
      routing_key: channel.config.routingKey as string,
      event_action: "trigger",
      payload: {
        summary: alert.message,
        severity: alert.severity,
        source: "claimguardian-websocket-monitor",
        component: "websocket-service",
        group: "infrastructure",
        class: alert.type,
        custom_details: alert.metadata,
      },
    };

    console.log(
      `📟 PagerDuty event would be triggered:`,
      payload.payload.summary,
    );
  }

  private checkRules(metrics: WebSocketServiceMetrics): void {
    const now = Date.now();

    this.rules.forEach((rule) => {
      if (!rule.enabled) return;

      // Check cooldown
      const timeSinceTriggered = now - rule.lastTriggered;
      const cooldownMs = rule.cooldownMinutes * 60 * 1000;
      if (timeSinceTriggered < cooldownMs) return;

      // Check condition
      try {
        if (rule.condition(metrics)) {
          const alert: WebSocketAlert = {
            type: "connection_threshold", // Default type
            severity: rule.severity,
            message: rule.message(metrics),
            timestamp: now,
            metadata: { rule: rule.name, ...metrics },
          };

          rule.lastTriggered = now;
          this.handleAlert(alert);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.name}:`, error instanceof Error ? error.message : String(error));
      }
    });
  }

  private performHealthCheck(): void {
    const health = webSocketMonitor.getHealthStatus();
    const metrics = webSocketMonitor.getServiceMetrics();

    // Log health status periodically
    console.log(
      `💓 WebSocket service health: ${health.status} (${metrics.activeConnections} connections, ${metrics.errorRate.toFixed(2)} err/min)`,
    );
  }

  // Utility methods
  private getSeverityColor(severity: WebSocketAlert["severity"]): string {
    switch (severity) {
      case "emergency":
        return "#8B0000";
      case "critical":
        return "#DC143C";
      case "warning":
        return "#FF8C00";
      case "info":
        return "#4169E1";
      default:
        return "#808080";
    }
  }

  private getSeverityColorInt(severity: WebSocketAlert["severity"]): number {
    switch (severity) {
      case "emergency":
        return 0x8b0000;
      case "critical":
        return 0xdc143c;
      case "warning":
        return 0xff8c00;
      case "info":
        return 0x4169e1;
      default:
        return 0x808080;
    }
  }

  private generateEmailHTML(alert: WebSocketAlert): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .alert { padding: 20px; border-radius: 8px; margin: 20px 0; }
        .emergency { background-color: #ffe6e6; border-left: 5px solid #8B0000; }
        .critical { background-color: #ffe6e6; border-left: 5px solid #DC143C; }
        .warning { background-color: #fff3cd; border-left: 5px solid #FF8C00; }
        .info { background-color: #e6f3ff; border-left: 5px solid #4169E1; }
        .metadata { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <h2>ClaimGuardian WebSocket Alert</h2>

    <div class="alert ${alert.severity}">
        <h3>${alert.type.replace(/_/g, " ").toUpperCase()} - ${alert.severity.toUpperCase()}</h3>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toISOString()}</p>

        ${
          alert.metadata
            ? `
        <div class="metadata">
            <h4>Additional Details:</h4>
            ${Object.entries(alert.metadata)
              .map(
                ([key, value]) =>
                  `<p><strong>${key.replace(/_/g, " ")}:</strong> ${value}</p>`,
              )
              .join("")}
        </div>
        `
            : ""
        }
    </div>

    <p><em>This alert was generated by the ClaimGuardian WebSocket monitoring system.</em></p>
</body>
</html>`;
  }

  private generateEmailText(alert: WebSocketAlert): string {
    const metadata = alert.metadata
      ? Object.entries(alert.metadata)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n")
      : "";

    return `
ClaimGuardian WebSocket Alert

Type: ${alert.type.replace(/_/g, " ").toUpperCase()}
Severity: ${alert.severity.toUpperCase()}
Time: ${new Date(alert.timestamp).toISOString()}

Message: ${alert.message}

${metadata ? `Additional Details:\n${metadata}` : ""}

This alert was generated by the ClaimGuardian WebSocket monitoring system.
`.trim();
  }

  // Public API
  getAlertHistory(limit?: number): typeof this.alertHistory {
    return limit ? this.alertHistory.slice(-limit) : [...this.alertHistory];
  }

  getAlertStats(): {
    totalAlerts: number;
    alertsByType: Record<string, number>;
    alertsBySeverity: Record<string, number>;
    deliverySuccessRate: number;
    channelStats: Record<string, { sent: number; failed: number }>;
  } {
    const totalAlerts = this.alertHistory.length;
    const alertsByType: Record<string, number> = {};
    const alertsBySeverity: Record<string, number> = {};
    const channelStats: Record<string, { sent: number; failed: number }> = {};

    let successfulDeliveries = 0;

    this.alertHistory.forEach((entry) => {
      // Count by type
      alertsByType[entry.alert.type] =
        (alertsByType[entry.alert.type] || 0) + 1;

      // Count by severity
      alertsBySeverity[entry.alert.severity] =
        (alertsBySeverity[entry.alert.severity] || 0) + 1;

      // Delivery stats
      if (entry.success) successfulDeliveries++;

      // Channel stats
      entry.channels.forEach((channel) => {
        if (!channelStats[channel]) {
          channelStats[channel] = { sent: 0, failed: 0 };
        }
        if (entry.success) {
          channelStats[channel].sent++;
        } else {
          channelStats[channel].failed++;
        }
      });
    });

    return {
      totalAlerts,
      alertsByType,
      alertsBySeverity,
      deliverySuccessRate:
        totalAlerts > 0 ? (successfulDeliveries / totalAlerts) * 100 : 0,
      channelStats,
    };
  }

  // Manual alert testing
  async testAlert(
    channelName?: string,
    severity: WebSocketAlert["severity"] = "info",
  ): Promise<void> {
    const testAlert: WebSocketAlert = {
      type: "connection_threshold",
      severity,
      message: `Test alert from WebSocket monitoring system - ${new Date().toISOString()}`,
      timestamp: Date.now(),
      metadata: {
        test: true,
        triggeredBy: "manual",
        environment: process.env.NODE_ENV || "development",
      },
    };

    if (channelName) {
      const channel = this.channels.get(channelName);
      if (!channel) {
        throw new Error(`Channel '${channelName}' not found`);
      }

      await this.deliverAlert(testAlert, channel);
      console.log(`✅ Test alert sent to ${channelName}`);
    } else {
      await this.handleAlert(testAlert);
    }
  }
}

// Global alert manager instance
export const webSocketAlertManager = new WebSocketAlertManager();

export default webSocketAlertManager;
