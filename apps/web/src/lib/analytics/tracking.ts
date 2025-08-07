/**
 * @fileMetadata
 * @purpose "Analytics tracking utility for conversion events"
 * @owner frontend-team
 * @dependencies []
 * @exports ["trackEvent", "AnalyticsPayload"]
 * @complexity low
 * @tags ["analytics", "tracking", "events"]
 * @status stable
 */

export type AnalyticsPayload = Record<string, unknown>;

/**
 * Track analytics events across the application
 * Replace this stub with your actual analytics implementation
 * @param name Event name
 * @param payload Event properties
 */
export function trackEvent(name: string, payload?: AnalyticsPayload) {
  // Example implementations:
  // window.gtag?.("event", name, payload);
  // window.plausible?.(name, { props: payload });
  // window.posthog?.capture?.(name, payload);

  // Fallback log for development:
  if (typeof window !== "undefined") {
    console.debug("[analytics]", name, payload || {});
  }
}