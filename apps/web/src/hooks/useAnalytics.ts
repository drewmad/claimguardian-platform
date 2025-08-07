/**
 * Analytics Hook for ClaimGuardian
 * Provides easy analytics tracking in React components
 */

import React, { useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
  analytics,
  trackEvent,
  trackFeature,
  trackPageView,
  trackAIUsage,
  trackNIMSUsage,
  trackAction,
  trackConversion
} from '@/lib/analytics/analytics-service'

export function useAnalytics() {
  const pathname = usePathname()
  const previousPath = useRef<string>('')

  // TODO: Re-enable auth integration after build fix
  // For now, analytics works without user context to fix build
  const user = null

  // Initialize analytics with user context
  useEffect(() => {
    if (user?.id) {
      analytics.initialize(user.id)
    }
  }, [user])

  // Track page views on route change
  useEffect(() => {
    if (pathname !== previousPath.current) {
      const pageTitle = document.title || pathname
      trackPageView(pathname, pageTitle)
      previousPath.current = pathname
    }
  }, [pathname])

  // Track feature usage with timing
  const trackFeatureUsage = useCallback((
    featureName: string,
    category: string,
    metadata?: Record<string, any>
  ) => {
    trackFeature(featureName, category, metadata)

    // Return a function to mark feature as complete
    return () => {
      analytics.trackFeatureComplete(featureName, metadata)
    }
  }, [])

  // Track AI feature usage with cost estimation
  const trackAI = useCallback((
    feature: 'damage_analyzer' | 'policy_advisor' | 'inventory_scanner' | 'claim_assistant',
    action: string,
    options?: {
      model?: string
      tokens?: number
      responseTime?: number
      success?: boolean
      error?: string
    }
  ) => {
    const startTime = Date.now()

    // Return a function to complete the tracking
    return (result?: { success?: boolean; tokens?: number; error?: string }) => {
      const responseTime = Date.now() - startTime

      trackAIUsage(feature, action, {
        model: options?.model,
        tokens: result?.tokens || options?.tokens,
        responseTime: options?.responseTime || responseTime,
        success: result?.success ?? options?.success ?? true,
        error: result?.error || options?.error,
        // Estimate cost based on tokens (rough estimate)
        cost: result?.tokens ? (result.tokens * 0.00002) : undefined
      })
    }
  }, [])

  // Track NIMS compliance feature usage
  const trackNIMS = useCallback((
    feature: 'incident' | 'resource' | 'alert' | 'workflow',
    action: string,
    metadata?: {
      incidentType?: string
      complexityLevel?: number
      [key: string]: any
    }
  ) => {
    trackNIMSUsage(feature, action, metadata)
  }, [])

  // Track user interactions
  const trackClick = useCallback((
    elementName: string,
    metadata?: Record<string, any>
  ) => {
    trackAction('click', elementName, metadata)
  }, [])

  // Track form submissions
  const trackFormSubmit = useCallback((
    formName: string,
    success: boolean,
    metadata?: Record<string, any>
  ) => {
    trackAction('form_submit', formName, {
      success,
      ...metadata
    })
  }, [])

  // Track conversions
  const trackConversionEvent = useCallback((
    type: 'signup' | 'claim_created' | 'property_added' | 'subscription' | 'demo_requested',
    value?: number,
    metadata?: Record<string, any>
  ) => {
    trackConversion(type, value, metadata)
  }, [])

  // Track search queries
  const trackSearch = useCallback((
    query: string,
    resultsCount: number,
    metadata?: Record<string, any>
  ) => {
    trackEvent('search', {
      query,
      results_count: resultsCount,
      ...metadata
    })
  }, [])

  // Track errors
  const trackErrorEvent = useCallback((
    error: Error | string,
    context?: Record<string, any>
  ) => {
    if (typeof error === 'string') {
      error = new Error(error)
    }
    analytics.trackError(error, context)
  }, [])

  // Track performance metrics
  const trackPerformance = useCallback((
    metric: string,
    value: number,
    unit: string = 'ms'
  ) => {
    analytics.trackPerformance(metric, value, { unit })
  }, [])

  return {
    trackEvent,
    trackFeatureUsage,
    trackAI,
    trackNIMS,
    trackClick,
    trackFormSubmit,
    trackConversionEvent,
    trackSearch,
    trackErrorEvent,
    trackPerformance
  }
}

// HOC for tracking component mount/unmount
export function withAnalytics<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
  category: string = 'component'
) {
  return function AnalyticsWrappedComponent(props: P) {
    const { trackFeatureUsage } = useAnalytics()
    const completeTracking = useRef<(() => void) | null>(null)

    useEffect(() => {
      // Track component mount
      completeTracking.current = trackFeatureUsage(componentName, category, {
        action: 'mounted'
      })

      // Track component unmount
      return () => {
        if (completeTracking.current) {
          completeTracking.current()
        }
      }
    }, [trackFeatureUsage])

    return React.createElement(Component, props)
  }
}
