/**
 * @fileMetadata
 * @purpose "A/B testing hook for ClaimGuardian conversion optimization"
 * @dependencies ["react"]
 * @owner marketing-team
 * @status stable
 */

import { useEffect, useState } from "react";

export interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
  data: any;
}

export interface ABTestConfig {
  testId: string;
  variants: ABTestVariant[];
  enabled: boolean;
  expiry?: Date;
}

export interface ABTestResult {
  variant: ABTestVariant | null;
  loading: boolean;
  isControlGroup: boolean;
}

/**
 * Custom hook for A/B testing functionality
 */
export function useABTest(testConfig: ABTestConfig): ABTestResult {
  const [variant, setVariant] = useState<ABTestVariant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Skip A/B testing if disabled or expired
    if (!testConfig.enabled || (testConfig.expiry && new Date() > testConfig.expiry)) {
      // Default to control group (first variant)
      setVariant(testConfig.variants[0] || null);
      setLoading(false);
      return;
    }

    // Check for existing assignment in localStorage
    const storageKey = `ab_test_${testConfig.testId}`;
    const savedVariant = localStorage.getItem(storageKey);

    if (savedVariant) {
      // User has been assigned before, use same variant
      const foundVariant = testConfig.variants.find(v => v.id === savedVariant);
      if (foundVariant) {
        setVariant(foundVariant);
        setLoading(false);
        return;
      }
    }

    // New user - assign to variant based on weights
    const selectedVariant = selectVariantByWeight(testConfig.variants);
    
    // Store assignment
    localStorage.setItem(storageKey, selectedVariant.id);
    
    // Track assignment event (optional - for analytics)
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag('event', 'ab_test_assignment', {
        test_id: testConfig.testId,
        variant_id: selectedVariant.id,
        variant_name: selectedVariant.name,
      });
    }

    setVariant(selectedVariant);
    setLoading(false);
  }, [testConfig]);

  const isControlGroup = variant?.id === testConfig.variants[0]?.id;

  return {
    variant,
    loading,
    isControlGroup,
  };
}

/**
 * Select variant based on weights
 */
function selectVariantByWeight(variants: ABTestVariant[]): ABTestVariant {
  const totalWeight = variants.reduce((sum, variant) => sum + variant.weight, 0);
  const random = Math.random() * totalWeight;
  
  let currentWeight = 0;
  for (const variant of variants) {
    currentWeight += variant.weight;
    if (random <= currentWeight) {
      return variant;
    }
  }
  
  // Fallback to first variant
  return variants[0];
}

/**
 * Track conversion event for A/B test
 */
export function trackABTestConversion(testId: string, variantId: string, conversionType: string = 'click') {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag('event', 'ab_test_conversion', {
      test_id: testId,
      variant_id: variantId,
      conversion_type: conversionType,
    });
  }

  // Also track to local storage for debugging
  const conversionKey = `ab_conversion_${testId}_${variantId}`;
  const existingConversions = JSON.parse(localStorage.getItem(conversionKey) || '[]');
  existingConversions.push({
    timestamp: new Date().toISOString(),
    type: conversionType,
  });
  localStorage.setItem(conversionKey, JSON.stringify(existingConversions));
}

/**
 * Predefined A/B test configurations for ClaimGuardian
 */
export const AB_TEST_CONFIGS = {
  HERO_TAGLINE: {
    testId: 'hero_tagline_2025_08',
    enabled: true,
    expiry: new Date('2025-09-15'), // Run until mid-September
    variants: [
      {
        id: 'control',
        name: 'Control - Current Tagline',
        weight: 25,
        data: {
          tagline: 'Your Property Intelligence, Not Theirs',
          description: 'Current proven tagline focusing on data ownership'
        }
      },
      {
        id: 'industry_focus',
        name: 'Industry Opposition',
        weight: 25,
        data: {
          tagline: 'AI That Works For You—Not The Industry',
          description: 'Emphasizes opposition to insurance industry'
        }
      },
      {
        id: 'management_focus',
        name: 'Management Focused',
        weight: 25,
        data: {
          tagline: 'Intelligent Property Management, On Your Side',
          description: 'Focuses on management benefits and advocacy'
        }
      },
      {
        id: 'ownership_focus',
        name: 'Ownership Focused',
        weight: 25,
        data: {
          tagline: 'Your Property, Your Data, Your Guardian',
          description: 'Triple emphasis on ownership and protection'
        }
      }
    ]
  } as ABTestConfig,

  CTA_BUTTON: {
    testId: 'cta_button_2025_08',
    enabled: false, // Disabled for now - current CTA is performing well
    variants: [
      {
        id: 'control',
        name: 'Deploy My Digital Guardian',
        weight: 50,
        data: { text: 'Deploy My Digital Guardian', style: 'primary' }
      },
      {
        id: 'protect_now',
        name: 'Protect My Property Now',
        weight: 50,
        data: { text: 'Protect My Property Now', style: 'primary' }
      }
    ]
  } as ABTestConfig,

  URGENCY_BANNER: {
    testId: 'urgency_banner_2025_08',
    enabled: false, // Current hurricane banner is effective
    variants: [
      {
        id: 'control',
        name: 'Hurricane Season Active',
        weight: 50,
        data: { 
          message: 'HURRICANE SEASON 2025 ACTIVE',
          cta: 'Get Protected Now'
        }
      },
      {
        id: 'claim_season',
        name: 'Claim Season Focus',
        weight: 50,
        data: { 
          message: 'CLAIM SEASON 2025 - DON\'T GET LEFT BEHIND',
          cta: 'Secure My Claims'
        }
      }
    ]
  } as ABTestConfig
};