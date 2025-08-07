/**
 * Analytics Service for ClaimGuardian
 * Tracks feature usage, user behavior, and performance metrics
 */

import { createClient } from "@/lib/supabase/client";

export interface AnalyticsEvent {
  event_name: string;
  event_category: "feature" | "navigation" | "action" | "error" | "performance";
  user_id?: string;
  session_id?: string;
  properties?: Record<string, any>;
  timestamp?: string;
}

export interface FeatureUsage {
  feature_name: string;
  feature_category: string;
  user_id?: string;
  session_id?: string;
  duration_ms?: number;
  metadata?: Record<string, any>;
}

export interface PageView {
  page_path: string;
  page_title: string;
  referrer?: string;
  user_id?: string;
  session_id?: string;
  time_on_page_ms?: number;
}

class AnalyticsService {
  private sessionId: string;
  private userId: string | null = null;
  private pageStartTime: number = Date.now();
  private featureStartTimes: Map<string, number> = new Map();
  private batchedEvents: AnalyticsEvent[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly BATCH_INTERVAL = 5000; // 5 seconds

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();

    // Set up page visibility tracking
    if (typeof window !== "undefined") {
      this.setupPageVisibilityTracking();
      this.setupErrorTracking();
      this.setupPerformanceTracking();
    }
  }

  /**
   * Initialize analytics with user context
   */
  public initialize(userId?: string) {
    if (userId) {
      this.userId = userId;
      this.track("session_start", {
        user_id: userId,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Track a custom event
   */
  public track(eventName: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = {
      event_name: eventName,
      event_category: this.categorizeEvent(eventName),
      user_id: this.userId || undefined,
      session_id: this.sessionId,
      properties: {
        ...properties,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        user_agent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
      timestamp: new Date().toISOString(),
    };

    this.batchEvent(event);
  }

  /**
   * Track feature usage
   */
  public trackFeature(
    featureName: string,
    category: string,
    metadata?: Record<string, any>,
  ) {
    const feature: FeatureUsage = {
      feature_name: featureName,
      feature_category: category,
      user_id: this.userId || undefined,
      session_id: this.sessionId,
      metadata,
    };

    // Start timing if not already started
    if (!this.featureStartTimes.has(featureName)) {
      this.featureStartTimes.set(featureName, Date.now());
    }

    this.track("feature_used", {
      feature: featureName,
      category,
      ...metadata,
    });
  }

  /**
   * Track feature usage completion
   */
  public trackFeatureComplete(
    featureName: string,
    metadata?: Record<string, any>,
  ) {
    const startTime = this.featureStartTimes.get(featureName);
    const duration = startTime ? Date.now() - startTime : undefined;

    this.track("feature_completed", {
      feature: featureName,
      duration_ms: duration,
      ...metadata,
    });

    this.featureStartTimes.delete(featureName);
  }

  /**
   * Track page views
   */
  public trackPageView(pagePath: string, pageTitle: string) {
    // Track time on previous page
    const timeOnPage = Date.now() - this.pageStartTime;

    const pageView: PageView = {
      page_path: pagePath,
      page_title: pageTitle,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      user_id: this.userId || undefined,
      session_id: this.sessionId,
      time_on_page_ms: timeOnPage,
    };

    this.track("page_view", pageView);
    this.pageStartTime = Date.now();
  }

  /**
   * Track AI feature usage
   */
  public trackAIUsage(
    feature:
      | "damage_analyzer"
      | "policy_advisor"
      | "inventory_scanner"
      | "claim_assistant",
    action: string,
    metadata?: Record<string, any>,
  ) {
    this.track("ai_feature_used", {
      feature,
      action,
      model: metadata?.model,
      tokens_used: metadata?.tokens,
      response_time_ms: metadata?.responseTime,
      success: metadata?.success,
      ...metadata,
    });
  }

  /**
   * Track NIMS compliance features
   */
  public trackNIMSUsage(
    feature: "incident" | "resource" | "alert" | "workflow",
    action: string,
    metadata?: Record<string, any>,
  ) {
    this.track("nims_feature_used", {
      feature,
      action,
      incident_type: metadata?.incidentType,
      complexity_level: metadata?.complexityLevel,
      ...metadata,
    });
  }

  /**
   * Track performance metrics
   */
  public trackPerformance(
    metric: string,
    value: number,
    metadata?: Record<string, any>,
  ) {
    this.track("performance_metric", {
      metric,
      value,
      unit: metadata?.unit || "ms",
      ...metadata,
    });
  }

  /**
   * Track errors
   */
  public trackError(error: Error, context?: Record<string, any>) {
    this.track("error_occurred", {
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.name,
      ...context,
    });
  }

  /**
   * Track user actions
   */
  public trackAction(
    action: string,
    target: string,
    metadata?: Record<string, any>,
  ) {
    this.track("user_action", {
      action,
      target,
      ...metadata,
    });
  }

  /**
   * Track conversion events
   */
  public trackConversion(
    conversionType: string,
    value?: number,
    metadata?: Record<string, any>,
  ) {
    this.track("conversion", {
      conversion_type: conversionType,
      conversion_value: value,
      ...metadata,
    });
  }

  /**
   * Batch events for efficient storage
   */
  private batchEvent(event: AnalyticsEvent) {
    this.batchedEvents.push(event);

    if (this.batchedEvents.length >= this.BATCH_SIZE) {
      this.flushEvents();
    } else if (!this.batchTimer) {
      this.batchTimer = setTimeout(
        () => this.flushEvents(),
        this.BATCH_INTERVAL,
      );
    }
  }

  /**
   * Flush batched events to storage
   */
  private async flushEvents() {
    if (this.batchedEvents.length === 0) return;

    const events = [...this.batchedEvents];
    this.batchedEvents = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      // Store in Supabase
      const supabase = createClient();
      const { error } = await supabase.from("analytics_events").insert(events);

      if (error) {
        console.error("Failed to store analytics events:", error);
        // Fallback to localStorage for recovery
        this.storeInLocalStorage(events);
      }
    } catch (error) {
      console.error("Analytics flush error:", error);
      this.storeInLocalStorage(events);
    }
  }

  /**
   * Store events in localStorage as fallback
   */
  private storeInLocalStorage(events: AnalyticsEvent[]) {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("pending_analytics") || "[]";
      const pending = JSON.parse(stored);
      pending.push(...events);

      // Keep only last 100 events to prevent storage overflow
      const trimmed = pending.slice(-100);
      localStorage.setItem("pending_analytics", JSON.stringify(trimmed));
    } catch (error) {
      console.error("Failed to store analytics in localStorage:", error);
    }
  }

  /**
   * Retry sending stored events
   */
  public async retryStoredEvents() {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem("pending_analytics");
      if (!stored) return;

      const events = JSON.parse(stored);
      if (events.length === 0) return;

      const supabase = createClient();
      const { error } = await supabase.from("analytics_events").insert(events);

      if (!error) {
        localStorage.removeItem("pending_analytics");
      }
    } catch (error) {
      console.error("Failed to retry stored events:", error);
    }
  }

  /**
   * Set up page visibility tracking
   */
  private setupPageVisibilityTracking() {
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.track("page_hidden", {
          time_visible_ms: Date.now() - this.pageStartTime,
        });
        this.flushEvents(); // Flush events when page is hidden
      } else {
        this.track("page_visible", {});
        this.pageStartTime = Date.now();
      }
    });

    // Track before page unload
    window.addEventListener("beforeunload", () => {
      this.track("session_end", {
        session_duration_ms:
          Date.now() - parseInt(sessionStorage.getItem("session_start") || "0"),
      });
      this.flushEvents();
    });
  }

  /**
   * Set up error tracking
   */
  private setupErrorTracking() {
    window.addEventListener("error", (event) => {
      this.trackError(new Error(event.message), {
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
      });
    });

    window.addEventListener("unhandledrejection", (event) => {
      this.trackError(new Error(event.reason), {
        type: "unhandled_promise_rejection",
      });
    });
  }

  /**
   * Set up performance tracking
   */
  private setupPerformanceTracking() {
    // Track page load performance
    if (window.performance && window.performance.timing) {
      window.addEventListener("load", () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domReadyTime =
            timing.domContentLoadedEventEnd - timing.navigationStart;
          const firstPaintTime = this.getFirstPaintTime();

          this.trackPerformance("page_load", loadTime);
          this.trackPerformance("dom_ready", domReadyTime);
          if (firstPaintTime) {
            this.trackPerformance("first_paint", firstPaintTime);
          }
        }, 0);
      });
    }

    // Track long tasks
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              // Tasks longer than 50ms
              this.trackPerformance("long_task", entry.duration, {
                task_name: entry.name,
              });
            }
          }
        });
        observer.observe({ entryTypes: ["longtask"] });
      } catch (error) {
        console.warn("Long task observer not supported");
      }
    }
  }

  /**
   * Get first paint time
   */
  private getFirstPaintTime(): number | null {
    if (window.performance && window.performance.getEntriesByType) {
      const paintEntries = window.performance.getEntriesByType("paint");
      const firstPaint = paintEntries.find(
        (entry) => entry.name === "first-contentful-paint",
      );
      return firstPaint ? firstPaint.startTime : null;
    }
    return null;
  }

  /**
   * Generate or retrieve session ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") {
      return `server-${Date.now()}`;
    }

    let sessionId = sessionStorage.getItem("analytics_session_id");

    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem("analytics_session_id", sessionId);
      sessionStorage.setItem("session_start", Date.now().toString());
    }

    return sessionId;
  }

  /**
   * Categorize events automatically
   */
  private categorizeEvent(eventName: string): AnalyticsEvent["event_category"] {
    if (eventName.includes("error") || eventName.includes("fail")) {
      return "error";
    }
    if (eventName.includes("page") || eventName.includes("route")) {
      return "navigation";
    }
    if (eventName.includes("performance") || eventName.includes("metric")) {
      return "performance";
    }
    if (
      eventName.includes("feature") ||
      eventName.includes("ai") ||
      eventName.includes("nims")
    ) {
      return "feature";
    }
    return "action";
  }
}

// Create singleton instance
export const analytics = new AnalyticsService();

// Export convenience methods
export const trackEvent = analytics.track.bind(analytics);
export const trackFeature = analytics.trackFeature.bind(analytics);
export const trackPageView = analytics.trackPageView.bind(analytics);
export const trackAIUsage = analytics.trackAIUsage.bind(analytics);
export const trackNIMSUsage = analytics.trackNIMSUsage.bind(analytics);
export const trackError = analytics.trackError.bind(analytics);
export const trackAction = analytics.trackAction.bind(analytics);
export const trackConversion = analytics.trackConversion.bind(analytics);
