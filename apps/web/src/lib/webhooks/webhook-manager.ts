/**
 * @fileMetadata
 * @purpose "Comprehensive webhook management system for real-time notifications"
 * @dependencies ["@/lib"]
 * @owner webhooks-team
 * @status stable
 */

import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger/production-logger";

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: Record<string, unknown>;
  user_id: string;
  timestamp: Date;
  metadata?: {
    source: string;
    version: string;
    environment: string;
  };
}

export type WebhookEventType =
  | "property.damage.detected"
  | "property.damage.analyzed"
  | "claim.status.updated"
  | "claim.approved"
  | "claim.denied"
  | "field_documentation.synced"
  | "field_documentation.failed"
  | "billing.subscription.changed"
  | "billing.payment.failed"
  | "billing.payment.succeeded"
  | "ai.prediction.completed"
  | "ai.risk.assessment.updated"
  | "maintenance.prediction.generated";

export interface WebhookSubscription {
  id: string;
  user_id: string;
  webhook_url: string;
  event_types: WebhookEventType[];
  secret_key: string;
  is_active: boolean;
  retry_count: number;
  last_success_at?: Date;
  last_failure_at?: Date;
  metadata?: Record<string, unknown>;
}

export interface WebhookDeliveryAttempt {
  id: string;
  webhook_subscription_id: string;
  event_id: string;
  attempt_number: number;
  http_status?: number;
  response_body?: string;
  error_message?: string;
  delivered_at?: Date;
  next_retry_at?: Date;
}

export class WebhookManager {
  private static instance: WebhookManager;
  private deliveryQueue: WebhookEvent[] = [];
  private isProcessing = false;

  static getInstance(): WebhookManager {
    if (!WebhookManager.instance) {
      WebhookManager.instance = new WebhookManager();
    }
    return WebhookManager.instance;
  }

  /**
   * Emit a webhook event to all subscribers
   */
  async emit(event: Omit<WebhookEvent, "id" | "timestamp">): Promise<void> {
    try {
      const supabase = await createClient();

      // Create event record
      const webhookEvent: WebhookEvent = {
        ...event,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };

      // Store event in database
      const { error: eventError } = await supabase
        .from("webhook_events")
        .insert({
          id: webhookEvent.id,
          type: webhookEvent.type,
          data: webhookEvent.data,
          user_id: webhookEvent.user_id,
          metadata: webhookEvent.metadata || {},
        });

      if (eventError) {
        logger.error("Failed to store webhook event", new Error(eventError.message || "Unknown database error"));
        return;
      }

      // Get active subscriptions for this event type
      const { data: subscriptions, error: subError } = await supabase
        .from("webhook_subscriptions")
        .select("*")
        .eq("user_id", event.user_id)
        .eq("is_active", true)
        .contains("event_types", [event.type]);

      if (subError) {
        logger.error("Failed to fetch webhook subscriptions", new Error(subError.message || "Unknown database error"));
        return;
      }

      // Queue deliveries
      for (const subscription of subscriptions || []) {
        await this.queueDelivery(webhookEvent, subscription);
      }

      logger.info(
        `Webhook event ${event.type} emitted to ${subscriptions?.length || 0} subscribers`,
      );
    } catch (error) {
      logger.error("Failed to emit webhook event", error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Queue webhook delivery with retry logic
   */
  private async queueDelivery(
    event: WebhookEvent,
    subscription: WebhookSubscription,
  ): Promise<void> {
    this.deliveryQueue.push(event);

    if (!this.isProcessing) {
      this.processDeliveryQueue();
    }
  }

  /**
   * Process webhook delivery queue
   */
  private async processDeliveryQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.deliveryQueue.length > 0) {
        const event = this.deliveryQueue.shift();
        if (event) {
          await this.deliverWebhook(event);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Deliver webhook to specific endpoint
   */
  private async deliverWebhook(event: WebhookEvent): Promise<void> {
    try {
      const supabase = await createClient();

      // Get subscriptions for this event
      const { data: subscriptions } = await supabase
        .from("webhook_subscriptions")
        .select("*")
        .eq("user_id", event.user_id)
        .eq("is_active", true)
        .contains("event_types", [event.type]);

      for (const subscription of subscriptions || []) {
        await this.attemptDelivery(event, subscription);
      }
    } catch (error) {
      logger.error("Failed to deliver webhook", error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Attempt webhook delivery with exponential backoff
   */
  private async attemptDelivery(
    event: WebhookEvent,
    subscription: WebhookSubscription,
    attemptNumber: number = 1,
  ): Promise<void> {
    const supabase = await createClient();

    try {
      // Create webhook payload
      const payload = {
        id: event.id,
        type: event.type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        user_id: event.user_id,
      };

      // Generate signature for security
      const signature = await this.generateSignature(
        JSON.stringify(payload),
        subscription.secret_key,
      );

      // Make HTTP request
      const response = await fetch(subscription.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ClaimGuardian-Signature": signature,
          "X-ClaimGuardian-Event-Type": event.type,
          "X-ClaimGuardian-Delivery-ID": crypto.randomUUID(),
          "User-Agent": "ClaimGuardian-Webhooks/1.0",
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      // Record delivery attempt
      const deliveryAttempt = {
        id: crypto.randomUUID(),
        webhook_subscription_id: subscription.id,
        event_id: event.id,
        attempt_number: attemptNumber,
        http_status: response.status,
        response_body: await response.text().catch(() => ""),
        delivered_at: response.ok ? new Date() : undefined,
        error_message: response.ok
          ? undefined
          : `HTTP ${response.status}: ${response.statusText}`,
      };

      await supabase.from("webhook_delivery_attempts").insert(deliveryAttempt);

      if (response.ok) {
        // Update subscription success
        await supabase
          .from("webhook_subscriptions")
          .update({ last_success_at: new Date() })
          .eq("id", subscription.id);

        logger.info(
          `Webhook delivered successfully to ${subscription.webhook_url}`,
        );
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      logger.error(
        `Webhook delivery failed (attempt ${attemptNumber})`,
        error instanceof Error ? error : new Error(String(error)),
      );

      // Record failed attempt
      await supabase.from("webhook_delivery_attempts").insert({
        id: crypto.randomUUID(),
        webhook_subscription_id: subscription.id,
        event_id: event.id,
        attempt_number: attemptNumber,
        error_message: error instanceof Error ? error.message : "Unknown error",
        next_retry_at: this.calculateNextRetry(attemptNumber),
      });

      // Update subscription failure
      await supabase
        .from("webhook_subscriptions")
        .update({
          last_failure_at: new Date(),
          retry_count: subscription.retry_count + 1,
        })
        .eq("id", subscription.id);

      // Retry with exponential backoff (max 5 attempts)
      if (attemptNumber < 5) {
        const delay = this.calculateRetryDelay(attemptNumber);
        setTimeout(() => {
          this.attemptDelivery(event, subscription, attemptNumber + 1);
        }, delay);
      } else {
        // Disable subscription after 5 failed attempts
        await supabase
          .from("webhook_subscriptions")
          .update({ is_active: false })
          .eq("id", subscription.id);

        logger.error(
          `Webhook subscription ${subscription.id} disabled after 5 failed attempts`,
        );
      }
    }
  }

  /**
   * Generate HMAC signature for webhook security
   */
  private async generateSignature(
    payload: string,
    secret: string,
  ): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(payload),
    );
    return `sha256=${Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 2^attempt seconds (max 1 hour)
    const baseDelay = Math.pow(2, attemptNumber) * 1000;
    return Math.min(baseDelay, 3600000); // Max 1 hour
  }

  /**
   * Calculate next retry timestamp
   */
  private calculateNextRetry(attemptNumber: number): Date {
    const delay = this.calculateRetryDelay(attemptNumber);
    return new Date(Date.now() + delay);
  }

  /**
   * Create webhook subscription
   */
  async createSubscription(
    userId: string,
    webhookUrl: string,
    eventTypes: WebhookEventType[],
    secretKey?: string,
  ): Promise<{ data: WebhookSubscription | null; error: string | null }> {
    try {
      const supabase = await createClient();

      const subscription = {
        id: crypto.randomUUID(),
        user_id: userId,
        webhook_url: webhookUrl,
        event_types: eventTypes,
        secret_key: secretKey || crypto.randomUUID(),
        is_active: true,
        retry_count: 0,
      };

      const { data, error } = await supabase
        .from("webhook_subscriptions")
        .insert(subscription)
        .select()
        .single();

      if (error) {
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Test webhook endpoint
   */
  async testWebhook(
    subscriptionId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await createClient();

      const { data: subscription } = await supabase
        .from("webhook_subscriptions")
        .select("*")
        .eq("id", subscriptionId)
        .single();

      if (!subscription) {
        return { success: false, error: "Subscription not found" };
      }

      // Send test event
      const testEvent: WebhookEvent = {
        id: crypto.randomUUID(),
        type: "property.damage.detected",
        data: {
          test: true,
          message: "This is a test webhook from ClaimGuardian",
        },
        user_id: subscription.user_id,
        timestamp: new Date(),
        metadata: {
          source: "webhook-test",
          version: "1.0",
          environment: "test",
        },
      };

      await this.attemptDelivery(testEvent, subscription);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
