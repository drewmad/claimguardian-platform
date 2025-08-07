/**
 * Real-time alert delivery system
 * Handles multiple notification channels: email, webhook, push notifications
 */

import { createClient } from "@supabase/supabase-js";

export interface AlertDeliveryConfig {
  email: {
    enabled: boolean;
    adminEmails: string[];
    userNotifications: boolean;
    templates: {
      budget_warning: string;
      budget_critical: string;
      usage_spike: string;
      model_error: string;
    };
  };
  webhook: {
    enabled: boolean;
    url?: string;
    secret?: string;
    includeMetadata: boolean;
  };
  push: {
    enabled: boolean;
    topics: string[];
  };
  slack: {
    enabled: boolean;
    webhookUrl?: string;
    channel?: string;
  };
}

export interface AlertPayload {
  id: string;
  type:
    | "budget_warning"
    | "budget_critical"
    | "usage_spike"
    | "model_error"
    | "system_alert";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
  userEmail?: string;
  metadata?: Record<string, unknown>;
  channels: ("email" | "webhook" | "push" | "slack")[];
}

export interface DeliveryResult {
  channel: string;
  success: boolean;
  error?: string;
  deliveredAt: string;
}

class AlertDeliverySystem {
  private config: AlertDeliveryConfig;
  private supabase: any = null;
  private deliveryHistory: Map<string, DeliveryResult[]> = new Map();

  constructor(config?: Partial<AlertDeliveryConfig>) {
    this.config = {
      email: {
        enabled: true,
        adminEmails: ["admin@claimguardian.ai"],
        userNotifications: true,
        templates: {
          budget_warning:
            "Budget Warning: You have used {percentage}% of your {period} budget ({current}/{budget})",
          budget_critical:
            "CRITICAL: Budget limit reached! You have used {percentage}% of your {period} budget ({current}/{budget})",
          usage_spike:
            "Usage Spike Alert: {requests} requests in the last minute (cost: {cost})",
          model_error:
            "Model Error Alert: {model} has {error_rate}% error rate ({failures}/{total} requests)",
        },
      },
      webhook: {
        enabled: false,
        includeMetadata: true,
      },
      push: {
        enabled: false,
        topics: ["cost-alerts", "admin-alerts"],
      },
      slack: {
        enabled: false,
        channel: "#alerts",
      },
      ...config,
    };

    this.initializeSupabase();
  }

  private initializeSupabase(): void {
    try {
      if (typeof window !== "undefined") {
        // Client-side initialization
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey) {
          this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        }
      }
    } catch (error) {
      console.error("Failed to initialize Supabase for alert delivery:", error);
    }
  }

  async deliverAlert(alert: AlertPayload): Promise<DeliveryResult[]> {
    const results: DeliveryResult[] = [];
    const deliveryPromises: Promise<DeliveryResult>[] = [];

    // Determine which channels to use based on severity and configuration
    const activeChannels = this.getActiveChannels(alert);

    for (const channel of activeChannels) {
      switch (channel) {
        case "email":
          deliveryPromises.push(this.deliverEmail(alert));
          break;
        case "webhook":
          deliveryPromises.push(this.deliverWebhook(alert));
          break;
        case "push":
          deliveryPromises.push(this.deliverPushNotification(alert));
          break;
        case "slack":
          deliveryPromises.push(this.deliverSlack(alert));
          break;
      }
    }

    // Execute all deliveries in parallel
    const deliveryResults = await Promise.allSettled(deliveryPromises);

    deliveryResults.forEach((result, index) => {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        results.push({
          channel: activeChannels[index],
          success: false,
          error: result.reason?.message || "Unknown delivery error",
          deliveredAt: new Date().toISOString(),
        });
      }
    });

    // Store delivery history
    this.deliveryHistory.set(alert.id, results);

    // Log delivery results
    await this.logDeliveryResults(alert, results);

    return results;
  }

  private getActiveChannels(
    alert: AlertPayload,
  ): ("email" | "webhook" | "push" | "slack")[] {
    const channels: ("email" | "webhook" | "push" | "slack")[] = [];

    // Always use specified channels if provided
    if (alert.channels && alert.channels.length > 0) {
      return alert.channels;
    }

    // Otherwise, determine based on configuration and severity
    if (this.config.email.enabled) {
      channels.push("email");
    }

    if (this.config.webhook.enabled && this.config.webhook.url) {
      channels.push("webhook");
    }

    if (this.config.slack.enabled && this.config.slack.webhookUrl) {
      channels.push("slack");
    }

    // Push notifications for critical alerts only
    if (this.config.push.enabled && alert.severity === "critical") {
      channels.push("push");
    }

    return channels;
  }

  private async deliverEmail(alert: AlertPayload): Promise<DeliveryResult> {
    try {
      const template = this.getEmailTemplate(alert);
      const recipients = this.getEmailRecipients(alert);

      // Use Next.js API route for email delivery
      const response = await fetch("/api/alerts/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: recipients,
          subject: `[ClaimGuardian] ${alert.title}`,
          html: template,
          alert: alert,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email delivery failed: ${response.statusText}`);
      }

      return {
        channel: "email",
        success: true,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        channel: "email",
        success: false,
        error: error instanceof Error ? error.message : "Unknown email error",
        deliveredAt: new Date().toISOString(),
      };
    }
  }

  private async deliverWebhook(alert: AlertPayload): Promise<DeliveryResult> {
    try {
      if (!this.config.webhook.url) {
        throw new Error("Webhook URL not configured");
      }

      const payload = {
        alert: {
          id: alert.id,
          type: alert.type,
          severity: alert.severity,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp,
          userId: alert.userId,
          userEmail: alert.userEmail,
        },
        metadata: this.config.webhook.includeMetadata
          ? alert.metadata
          : undefined,
      };

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "User-Agent": "ClaimGuardian-AlertSystem/1.0",
      };

      // Add webhook signature if secret is configured
      if (this.config.webhook.secret) {
        const crypto = require("crypto");
        const signature = crypto
          .createHmac("sha256", this.config.webhook.secret)
          .update(JSON.stringify(payload))
          .digest("hex");
        headers["X-ClaimGuardian-Signature"] = `sha256=${signature}`;
      }

      const response = await fetch(this.config.webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `Webhook delivery failed: ${response.status} ${response.statusText}`,
        );
      }

      return {
        channel: "webhook",
        success: true,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        channel: "webhook",
        success: false,
        error: error instanceof Error ? error.message : "Unknown webhook error",
        deliveredAt: new Date().toISOString(),
      };
    }
  }

  private async deliverSlack(alert: AlertPayload): Promise<DeliveryResult> {
    try {
      if (!this.config.slack.webhookUrl) {
        throw new Error("Slack webhook URL not configured");
      }

      const color =
        alert.severity === "critical"
          ? "#ff0000"
          : alert.severity === "warning"
            ? "#ff9900"
            : "#36a64f";

      const slackPayload = {
        channel: this.config.slack.channel,
        username: "ClaimGuardian Alerts",
        icon_emoji:
          alert.severity === "critical" ? ":rotating_light:" : ":warning:",
        attachments: [
          {
            color,
            title: alert.title,
            text: alert.message,
            fields: [
              {
                title: "Severity",
                value: alert.severity.toUpperCase(),
                short: true,
              },
              {
                title: "Type",
                value: alert.type
                  .replace(/_/g, " ")
                  .replace(/\b\w/g, (l) => l.toUpperCase()),
                short: true,
              },
              {
                title: "Time",
                value: new Date(alert.timestamp).toLocaleString(),
                short: true,
              },
            ],
            footer: "ClaimGuardian Alert System",
            ts: Math.floor(new Date(alert.timestamp).getTime() / 1000),
          },
        ],
      };

      // Add user information if available
      if (alert.userEmail) {
        slackPayload.attachments[0].fields.push({
          title: "User",
          value: alert.userEmail,
          short: true,
        });
      }

      const response = await fetch(this.config.slack.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(slackPayload),
      });

      if (!response.ok) {
        throw new Error(
          `Slack delivery failed: ${response.status} ${response.statusText}`,
        );
      }

      return {
        channel: "slack",
        success: true,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        channel: "slack",
        success: false,
        error: error instanceof Error ? error.message : "Unknown Slack error",
        deliveredAt: new Date().toISOString(),
      };
    }
  }

  private async deliverPushNotification(
    alert: AlertPayload,
  ): Promise<DeliveryResult> {
    try {
      // This would integrate with a push notification service like Firebase
      // For now, we'll use a placeholder implementation

      const pushPayload = {
        title: alert.title,
        body: alert.message,
        data: {
          alertId: alert.id,
          type: alert.type,
          severity: alert.severity,
        },
        topics: this.config.push.topics,
      };

      // Placeholder for push notification delivery
      console.log("Push notification would be sent:", pushPayload);

      return {
        channel: "push",
        success: true,
        deliveredAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        channel: "push",
        success: false,
        error: error instanceof Error ? error.message : "Unknown push error",
        deliveredAt: new Date().toISOString(),
      };
    }
  }

  private getEmailTemplate(alert: AlertPayload): string {
    const template =
      this.config.email.templates[
        alert.type as keyof typeof this.config.email.templates
      ];

    if (!template) {
      return `
        <h2>${alert.title}</h2>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        <p><strong>Message:</strong> ${alert.message}</p>
        <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
        ${alert.userEmail ? `<p><strong>User:</strong> ${alert.userEmail}</p>` : ""}
        <hr>
        <p><small>This is an automated alert from ClaimGuardian AI Cost Monitoring System.</small></p>
      `;
    }

    // Template variable replacement
    let html = template;
    if (alert.metadata) {
      Object.entries(alert.metadata).forEach(([key, value]) => {
        html = html.replace(new RegExp(`{${key}}`, "g"), String(value));
      });
    }

    return `
      <h2>${alert.title}</h2>
      <p>${html}</p>
      <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
      ${alert.userEmail ? `<p><strong>User:</strong> ${alert.userEmail}</p>` : ""}
      <hr>
      <p><small>This is an automated alert from ClaimGuardian AI Cost Monitoring System.</small></p>
    `;
  }

  private getEmailRecipients(alert: AlertPayload): string[] {
    const recipients: string[] = [];

    // Always include admin emails for critical alerts
    if (alert.severity === "critical") {
      recipients.push(...this.config.email.adminEmails);
    }

    // Include user email if user notifications are enabled and user exists
    if (this.config.email.userNotifications && alert.userEmail) {
      recipients.push(alert.userEmail);
    }

    // Remove duplicates
    return [...new Set(recipients)];
  }

  private async logDeliveryResults(
    alert: AlertPayload,
    results: DeliveryResult[],
  ): Promise<void> {
    try {
      if (!this.supabase) return;

      const deliveryLog = {
        alert_id: alert.id,
        alert_type: alert.type,
        severity: alert.severity,
        delivery_results: results,
        total_channels: results.length,
        successful_deliveries: results.filter((r) => r.success).length,
        failed_deliveries: results.filter((r) => !r.success).length,
        created_at: new Date().toISOString(),
      };

      await this.supabase.from("alert_delivery_logs").insert(deliveryLog);
    } catch (error) {
      console.error("Failed to log delivery results:", error);
    }
  }

  // Configuration management
  updateConfig(newConfig: Partial<AlertDeliveryConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): AlertDeliveryConfig {
    return { ...this.config };
  }

  // Delivery history
  getDeliveryHistory(alertId: string): DeliveryResult[] | undefined {
    return this.deliveryHistory.get(alertId);
  }

  // Test delivery methods
  async testEmail(recipient: string): Promise<DeliveryResult> {
    const testAlert: AlertPayload = {
      id: "test-email",
      type: "system_alert",
      severity: "info",
      title: "Test Email Alert",
      message: "This is a test email from ClaimGuardian Alert Delivery System",
      timestamp: new Date().toISOString(),
      userEmail: recipient,
      channels: ["email"],
    };

    const results = await this.deliverAlert(testAlert);
    return results[0];
  }

  async testWebhook(): Promise<DeliveryResult> {
    const testAlert: AlertPayload = {
      id: "test-webhook",
      type: "system_alert",
      severity: "info",
      title: "Test Webhook Alert",
      message:
        "This is a test webhook from ClaimGuardian Alert Delivery System",
      timestamp: new Date().toISOString(),
      channels: ["webhook"],
    };

    const results = await this.deliverAlert(testAlert);
    return results[0];
  }

  async testSlack(): Promise<DeliveryResult> {
    const testAlert: AlertPayload = {
      id: "test-slack",
      type: "system_alert",
      severity: "info",
      title: "Test Slack Alert",
      message:
        "This is a test message from ClaimGuardian Alert Delivery System",
      timestamp: new Date().toISOString(),
      channels: ["slack"],
    };

    const results = await this.deliverAlert(testAlert);
    return results[0];
  }
}

// Export singleton instance
export const alertDeliverySystem = new AlertDeliverySystem();
export default alertDeliverySystem;
