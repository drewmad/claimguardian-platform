/**
 * @fileMetadata
 * @purpose "React context provider for A/B testing framework"
 * @owner frontend-team
 * @dependencies ["react", "@/lib/ab-testing/framework"]
 * @exports ["ABTestProvider", "useABTestContext"]
 * @complexity low
 * @tags ["ab-testing", "context", "react"]
 * @status stable
 */
"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useABTest, ABTestAnalytics } from "@/lib/ab-testing/framework";

type ABTestContextType = {
  getVariant: (testId: string) => any;
  trackConversion: (testId: string, eventData?: Record<string, any>) => void;
  getUserVariants: () => Record<string, string>;
};

const ABTestContext = createContext<ABTestContextType | null>(null);

export function ABTestProvider({ children }: { children: ReactNode }) {
  const contextValue: ABTestContextType = {
    getVariant: (testId: string) => {
      const { variant } = useABTest(testId);
      return variant;
    },
    trackConversion: (testId: string, eventData?: Record<string, any>) => {
      // Import the function dynamically to avoid issues
      import("@/lib/ab-testing/framework").then(({ trackConversion }) => {
        trackConversion(testId, eventData);
      });
    },
    getUserVariants: ABTestAnalytics.getUserVariants
  };

  return (
    <ABTestContext.Provider value={contextValue}>
      {children}
    </ABTestContext.Provider>
  );
}

export function useABTestContext() {
  const context = useContext(ABTestContext);
  if (!context) {
    throw new Error("useABTestContext must be used within an ABTestProvider");
  }
  return context;
}

/**
 * Component for rendering A/B test variants
 */
export function ABTestVariant({
  testId,
  variantId,
  children
}: {
  testId: string;
  variantId: string;
  children: ReactNode;
}) {
  const { variant } = useABTest(testId);
  
  if (!variant || variant.id !== variantId) {
    return null;
  }
  
  return <>{children}</>;
}

/**
 * Hook for A/B testing with automatic tracking
 */
export function useABTestVariant(testId: string) {
  const { variant } = useABTest(testId);
  
  const trackConversion = (eventData?: Record<string, any>) => {
    import("@/lib/ab-testing/framework").then(({ trackConversion }) => {
      trackConversion(testId, eventData);
    });
  };
  
  return {
    variant,
    trackConversion,
    isVariant: (variantId: string) => variant?.id === variantId,
    getData: (key?: string) => {
      if (!variant?.data) return undefined;
      return key ? variant.data[key] : variant.data;
    }
  };
}