interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: number
  userId?: string
  sessionId?: string
}

// Extended Window interface for Next.js router
declare global {
  interface Window {
    next?: {
      router?: {
        events: {
          on: (event: string, callback: (url: string) => void) => void
          off: (event: string, callback: (url: string) => void) => void
        }
      }
    }
  }
}

interface PageViewEvent {
  path: string
  title?: string
  referrer?: string
  timestamp?: number
}

interface UserProperties {
  userId: string
  email?: string
  role?: string
  plan?: string
  createdAt?: Date
  [key: string]: any
}

class Analytics {
  private events: AnalyticsEvent[] = []
  private pageViews: PageViewEvent[] = []
  private userProperties: UserProperties | null = null
  private sessionId: string
  private isEnabled: boolean = true

  constructor() {
    this.sessionId = this.generateSessionId()
    
    if (typeof window !== 'undefined') {
      this.setupPageTracking()
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupPageTracking() {
    // Track initial page view
    this.trackPageView(window.location.pathname, document.title)

    // Listen for route changes (Next.js specific)
    if (typeof window !== 'undefined') {
      try {
        // Try to access Next.js router if available
        const router = window.next?.router
        if (router?.events) {
          router.events.on('routeChangeComplete', (url: string) => {
            this.trackPageView(url, document.title)
          })
        }
      } catch {
        // Router not available, skip route tracking
        console.debug('Next.js router not available for analytics tracking')
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  identify(properties: UserProperties) {
    if (!this.isEnabled) return

    this.userProperties = {
      ...properties,
      identifiedAt: new Date()
    }

    // Send to analytics service
    this.sendToAnalytics('identify', properties)
  }

  track(name: string, properties?: Record<string, any>) {
    if (!this.isEnabled) return

    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: Date.now(),
      userId: this.userProperties?.userId,
      sessionId: this.sessionId
    }

    this.events.push(event)
    this.sendToAnalytics('track', event)
  }

  trackPageView(path: string, title?: string) {
    if (!this.isEnabled) return

    const pageView: PageViewEvent = {
      path,
      title: title || document.title,
      referrer: document.referrer,
      timestamp: Date.now()
    }

    this.pageViews.push(pageView)
    this.sendToAnalytics('page', pageView)
  }

  // Feature usage tracking
  trackFeatureUsage(feature: string, metadata?: Record<string, any>) {
    this.track('feature_used', {
      feature,
      ...metadata
    })
  }

  // Error tracking
  trackError(error: Error, context?: Record<string, any>) {
    this.track('error_occurred', {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    })
  }

  // Performance tracking
  trackPerformance(metric: string, value: number, metadata?: Record<string, any>) {
    this.track('performance_metric', {
      metric,
      value,
      ...metadata
    })
  }

  // User actions
  trackClick(element: string, metadata?: Record<string, any>) {
    this.track('element_clicked', {
      element,
      ...metadata
    })
  }

  trackFormSubmit(formName: string, success: boolean, metadata?: Record<string, any>) {
    this.track('form_submitted', {
      formName,
      success,
      ...metadata
    })
  }

  // E-commerce/conversion events
  trackConversion(type: string, value?: number, metadata?: Record<string, any>) {
    this.track('conversion', {
      conversionType: type,
      conversionValue: value,
      ...metadata
    })
  }

  // Session management
  startNewSession() {
    this.sessionId = this.generateSessionId()
    this.track('session_started')
  }

  endSession() {
    this.track('session_ended', {
      duration: Date.now() - parseInt(this.sessionId.split('_')[1])
    })
  }

  // Get analytics data
  getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  getPageViews(): PageViewEvent[] {
    return [...this.pageViews]
  }

  getSessionAnalytics() {
    const sessionEvents = this.events.filter(e => e.sessionId === this.sessionId)
    const sessionPageViews = this.pageViews.filter(pv => 
      pv.timestamp && pv.timestamp > parseInt(this.sessionId.split('_')[1])
    )

    return {
      sessionId: this.sessionId,
      userId: this.userProperties?.userId,
      eventCount: sessionEvents.length,
      pageViewCount: sessionPageViews.length,
      duration: Date.now() - parseInt(this.sessionId.split('_')[1]),
      events: sessionEvents,
      pageViews: sessionPageViews
    }
  }

  // Clear data (for privacy/logout)
  clearUserData() {
    this.userProperties = null
    this.events = []
    this.pageViews = []
    this.startNewSession()
  }

  // Send to analytics service (implement based on your provider)
  private sendToAnalytics(type: string, data: any) {
    // This is where you would integrate with services like:
    // - Google Analytics
    // - Mixpanel
    // - Amplitude
    // - PostHog
    // - Custom analytics endpoint

    if (process.env.NODE_ENV === 'development') {
      console.log(`[Analytics] ${type}:`, data)
    }

    // Example: Send to custom endpoint
    if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
      fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data, timestamp: Date.now() })
      }).catch(err => console.error('Analytics error:', err))
    }
  }
}

// Singleton instance
let analytics: Analytics | null = null

export function getAnalytics(): Analytics {
  if (!analytics) {
    analytics = new Analytics()
  }
  return analytics
}

// Convenience functions
export function identify(properties: UserProperties) {
  getAnalytics().identify(properties)
}

export function track(name: string, properties?: Record<string, any>) {
  getAnalytics().track(name, properties)
}

export function trackPageView(path: string, title?: string) {
  getAnalytics().trackPageView(path, title)
}

export function trackFeatureUsage(feature: string, metadata?: Record<string, any>) {
  getAnalytics().trackFeatureUsage(feature, metadata)
}

export function trackError(error: Error, context?: Record<string, any>) {
  getAnalytics().trackError(error, context)
}

export function trackPerformance(metric: string, value: number, metadata?: Record<string, any>) {
  getAnalytics().trackPerformance(metric, value, metadata)
}