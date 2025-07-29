// Performance metrics
export * from './metrics'
export { getMetricsCollector, recordMetric, recordDatabaseQuery, recordAPICall } from './metrics'

// Error tracking with Sentry
export * from './sentry'
export { 
  initializeSentry, 
  withErrorBoundary, 
  profileComponent, 
  captureError,
  withTransaction,
  identifyUser,
  clearUser,
  addBreadcrumb
} from './sentry'

// User behavior analytics
export * from './analytics'
export { 
  getAnalytics,
  identify,
  track,
  trackPageView,
  trackFeatureUsage,
  trackError,
  trackPerformance
} from './analytics'

// Monitoring utilities
export { monitorSupabaseClient } from './supabase-monitor'
export { createPerformanceObserver } from './performance-observer'