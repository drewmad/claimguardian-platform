/**
 * @fileMetadata
 * @purpose "A/B testing framework for conversion optimization"
 * @owner frontend-team
 * @dependencies []
 * @exports ["ABTest", "useABTest", "trackConversion"]
 * @complexity medium
 * @tags ["ab-testing", "analytics", "conversion"]
 * @status stable
 */

export type ABTestVariant = {
  id: string;
  name: string;
  weight: number; // 0-1, should sum to 1 across all variants
  data?: Record<string, any>; // Custom data for the variant
};

export type ABTestConfig = {
  testId: string;
  name: string;
  description: string;
  variants: ABTestVariant[];
  enabled: boolean;
  startDate?: Date;
  endDate?: Date;
  sampleRate?: number; // 0-1, what percentage of users to include
};

// Example A/B tests configuration
export const AB_TESTS: Record<string, ABTestConfig> = {
  hero_cta_text: {
    testId: "hero_cta_text_v1",
    name: "Hero CTA Text",
    description: "Test different CTA button text on hero section",
    enabled: process.env.NODE_ENV === "production",
    variants: [
      {
        id: "control",
        name: "Start Free",
        weight: 0.5,
        data: { text: "Start Free", analytics: "hero_cta_start_free" }
      },
      {
        id: "variant_a",
        name: "Create Digital Twin",
        weight: 0.5,
        data: { text: "Create My Digital Twin", analytics: "hero_cta_digital_twin" }
      }
    ],
    sampleRate: 0.8, // Include 80% of users
  },
  hero_structure: {
    testId: "hero_structure_v1",
    name: "Hero Section Structure",
    description: "Test different hero section layouts",
    enabled: false, // Disabled for now
    variants: [
      {
        id: "control",
        name: "Current Layout",
        weight: 0.6,
        data: { layout: "current" }
      },
      {
        id: "variant_bullets",
        name: "Bulleted Value Props",
        weight: 0.4,
        data: { layout: "bulleted" }
      }
    ],
    sampleRate: 0.5,
  },
  pricing_highlight: {
    testId: "pricing_highlight_v1",
    name: "Pricing Card Emphasis",
    description: "Test different ways to highlight the Essential plan",
    enabled: process.env.NODE_ENV === "production",
    variants: [
      {
        id: "control",
        name: "Current Highlight",
        weight: 0.5,
        data: { highlight: "border" }
      },
      {
        id: "variant_badge",
        name: "Badge + Border",
        weight: 0.5,
        data: { highlight: "badge_border" }
      }
    ],
    sampleRate: 1.0,
  }
};

/**
 * Simple hash function for consistent user assignment
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent user ID for A/B testing
 * Uses localStorage if available, falls back to session storage
 */
function getUserId(): string {
  if (typeof window === "undefined") return "server";
  
  let userId = localStorage.getItem("claimguardian_ab_user_id");
  if (!userId) {
    userId = "user_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    localStorage.setItem("claimguardian_ab_user_id", userId);
  }
  return userId;
}

/**
 * Determine which variant a user should see
 */
function getVariantForUser(testConfig: ABTestConfig, userId: string): ABTestVariant | null {
  if (!testConfig.enabled) return null;
  
  // Check date constraints
  const now = new Date();
  if (testConfig.startDate && now < testConfig.startDate) return null;
  if (testConfig.endDate && now > testConfig.endDate) return null;
  
  // Check if user should be included in test
  const userHash = hashString(userId + testConfig.testId);
  const includeUser = (userHash % 100) / 100 < (testConfig.sampleRate || 1.0);
  if (!includeUser) return null;
  
  // Assign variant based on user hash
  const variantHash = hashString(userId + testConfig.testId + "variant");
  const variantScore = (variantHash % 10000) / 10000; // 0-1 with more precision
  
  let cumulativeWeight = 0;
  for (const variant of testConfig.variants) {
    cumulativeWeight += variant.weight;
    if (variantScore <= cumulativeWeight) {
      return variant;
    }
  }
  
  // Fallback to first variant
  return testConfig.variants[0] || null;
}

/**
 * Hook for using A/B tests in React components
 */
export function useABTest(testId: string) {
  const testConfig = AB_TESTS[testId];
  if (!testConfig) {
    console.warn(`A/B test "${testId}" not found`);
    return { variant: null, loading: false };
  }
  
  const userId = getUserId();
  const variant = getVariantForUser(testConfig, userId);
  
  // Track participation (only once per session)
  if (variant && typeof window !== "undefined") {
    const sessionKey = `ab_tracked_${testId}`;
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, "true");
      trackABTestEvent("participation", testConfig.testId, variant.id);
    }
  }
  
  return {
    variant,
    loading: false
  };
}

/**
 * Track A/B test events
 */
export function trackABTestEvent(
  eventType: "participation" | "conversion",
  testId: string,
  variantId: string,
  eventData?: Record<string, any>
) {
  if (typeof window === "undefined") return;
  
  const eventPayload = {
    test_id: testId,
    variant_id: variantId,
    event_type: eventType,
    user_id: getUserId(),
    timestamp: new Date().toISOString(),
    ...eventData
  };
  
  // Send to your analytics platform
  console.log("[A/B Test]", eventType, eventPayload);
  
  // Example integrations:
  // Google Analytics
  if (window.gtag) {
    window.gtag("event", `ab_test_${eventType}`, {
      test_id: testId,
      variant_id: variantId,
      custom_parameter: eventData
    });
  }
  
  // PostHog
  if (window.posthog) {
    window.posthog.capture(`ab_test_${eventType}`, eventPayload);
  }
  
  // Plausible
  if (window.plausible) {
    window.plausible(`AB Test ${eventType}`, {
      props: eventPayload
    });
  }
}

/**
 * Track conversion for an A/B test
 */
export function trackConversion(testId: string, eventData?: Record<string, any>) {
  const testConfig = AB_TESTS[testId];
  if (!testConfig || !testConfig.enabled) return;
  
  const userId = getUserId();
  const variant = getVariantForUser(testConfig, userId);
  
  if (variant) {
    trackABTestEvent("conversion", testConfig.testId, variant.id, eventData);
  }
}

/**
 * Force a specific variant (for testing)
 */
export function forceVariant(testId: string, variantId: string) {
  if (typeof window === "undefined") return;
  
  const key = `ab_force_${testId}`;
  if (variantId === "clear") {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, variantId);
  }
}

/**
 * Get forced variant (for testing)
 */
function getForcedVariant(testId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`ab_force_${testId}`);
}

/**
 * Analytics utilities for A/B testing
 */
export const ABTestAnalytics = {
  /**
   * Get test results (for admin dashboard)
   */
  getTestResults: async (testId: string) => {
    // This would typically call your analytics API
    // Return participation and conversion data
    return {
      testId,
      participants: 0,
      conversions: 0,
      variants: []
    };
  },
  
  /**
   * Get all active tests
   */
  getActiveTests: () => {
    return Object.values(AB_TESTS).filter(test => test.enabled);
  },
  
  /**
   * Get user's current variants
   */
  getUserVariants: () => {
    const userId = getUserId();
    const variants: Record<string, string> = {};
    
    for (const [testId, config] of Object.entries(AB_TESTS)) {
      const variant = getVariantForUser(config, userId);
      if (variant) {
        variants[testId] = variant.id;
      }
    }
    
    return variants;
  }
};

// Export for debugging
if (typeof window !== "undefined") {
  (window as any).ClaimGuardianAB = {
    forceVariant,
    getUserVariants: ABTestAnalytics.getUserVariants,
    trackConversion,
    getUserId
  };
}

// TypeScript augmentation for window object
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    plausible?: (eventName: string, options?: { props?: any }) => void;
    posthog?: {
      capture?: (eventName: string, properties?: any) => void;
    };
  }
}