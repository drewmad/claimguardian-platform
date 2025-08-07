/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Brief description of file purpose"
 * @dependencies ["package1", "package2"]
 * @status stable
 * @ai-integration multi-provider
 * @insurance-context claims
 * @supabase-integration edge-functions
 */
import { onCLS, onFCP, onLCP, onTTFB, onINP, Metric } from 'web-vitals'

export interface PerformanceMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  timestamp: number
  metadata?: Record<string, unknown>
}

export interface DatabaseMetric {
  queryName: string
  duration: number
  rowCount?: number
  error?: string
  timestamp: number
}

export interface APIMetric {
  endpoint: string
  method: string
  statusCode: number
  duration: number
  size?: number
  timestamp: number
}

class MetricsCollector {
  private metrics: PerformanceMetric[] = []
  private dbMetrics: DatabaseMetric[] = []
  private apiMetrics: APIMetric[] = []
  private listeners: Array<(metric: PerformanceMetric) => void> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeWebVitals()
    }
  }

  private initializeWebVitals() {
    // Cumulative Layout Shift
    onCLS((metric) => this.recordWebVital(metric))

    // First Contentful Paint
    onFCP((metric) => this.recordWebVital(metric))

    // Largest Contentful Paint
    onLCP((metric) => this.recordWebVital(metric))

    // Time to First Byte
    onTTFB((metric) => this.recordWebVital(metric))

    // Interaction to Next Paint (replaces FID)
    onINP((metric) => this.recordWebVital(metric))
  }

  private recordWebVital(metric: Metric) {
    const performanceMetric: PerformanceMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating || 'needs-improvement',
      timestamp: Date.now(),
      metadata: {
        id: metric.id,
        navigationType: metric.navigationType
      }
    }

    this.metrics.push(performanceMetric)
    this.notifyListeners(performanceMetric)
  }

  recordCustomMetric(name: string, value: number, metadata?: Record<string, unknown>) {
    const metric: PerformanceMetric = {
      name,
      value,
      rating: this.calculateRating(name, value),
      timestamp: Date.now(),
      metadata
    }

    this.metrics.push(metric)
    this.notifyListeners(metric)
  }

  recordDatabaseQuery(metric: DatabaseMetric) {
    this.dbMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    })

    // Alert on slow queries
    if (metric.duration > 1000) {
      console.warn(`Slow database query detected: ${metric.queryName} took ${metric.duration}ms`)
    }
  }

  recordAPICall(metric: APIMetric) {
    this.apiMetrics.push({
      ...metric,
      timestamp: metric.timestamp || Date.now()
    })

    // Alert on slow API calls
    if (metric.duration > 2000) {
      console.warn(`Slow API call detected: ${metric.method} ${metric.endpoint} took ${metric.duration}ms`)
    }
  }

  private calculateRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    // Define thresholds for custom metrics
    const thresholds: Record<string, { good: number; poor: number }> = {
      'page-load': { good: 2000, poor: 4000 },
      'api-response': { good: 200, poor: 1000 },
      'db-query': { good: 100, poor: 500 }
    }

    const threshold = thresholds[name]
    if (!threshold) return 'needs-improvement'

    if (value <= threshold.good) return 'good'
    if (value >= threshold.poor) return 'poor'
    return 'needs-improvement'
  }

  getMetrics(): PerformanceMetric[] {
    return [...this.metrics]
  }

  getDatabaseMetrics(): DatabaseMetric[] {
    return [...this.dbMetrics]
  }

  getAPIMetrics(): APIMetric[] {
    return [...this.apiMetrics]
  }

  getMetricsSummary() {
    const webVitals = this.metrics.filter(m =>
      ['CLS', 'FCP', 'LCP', 'TTFB', 'INP'].includes(m.name)
    )

    const summary = {
      webVitals: webVitals.reduce((acc, metric) => {
        acc[metric.name] = {
          value: metric.value,
          rating: metric.rating
        }
        return acc
      }, {} as Record<string, { value: number; rating: string }>),
      database: {
        totalQueries: this.dbMetrics.length,
        averageDuration: this.dbMetrics.length > 0
          ? this.dbMetrics.reduce((sum, m) => sum + m.duration, 0) / this.dbMetrics.length
          : 0,
        slowQueries: this.dbMetrics.filter(m => m.duration > 1000).length
      },
      api: {
        totalCalls: this.apiMetrics.length,
        averageDuration: this.apiMetrics.length > 0
          ? this.apiMetrics.reduce((sum, m) => sum + m.duration, 0) / this.apiMetrics.length
          : 0,
        errorRate: this.apiMetrics.length > 0
          ? this.apiMetrics.filter(m => m.statusCode >= 400).length / this.apiMetrics.length
          : 0
      }
    }

    return summary
  }

  clearMetrics() {
    this.metrics = []
    this.dbMetrics = []
    this.apiMetrics = []
  }

  onMetric(callback: (metric: PerformanceMetric) => void) {
    this.listeners.push(callback)
  }

  private notifyListeners(metric: PerformanceMetric) {
    this.listeners.forEach(listener => listener(metric))
  }
}

// Singleton instance
let metricsCollector: MetricsCollector | null = null

export function getMetricsCollector(): MetricsCollector {
  if (!metricsCollector) {
    metricsCollector = new MetricsCollector()
  }
  return metricsCollector
}

// Convenience functions
export function recordMetric(name: string, value: number, metadata?: Record<string, unknown>) {
  getMetricsCollector().recordCustomMetric(name, value, metadata)
}

export function recordDatabaseQuery(metric: DatabaseMetric) {
  getMetricsCollector().recordDatabaseQuery(metric)
}

export function recordAPICall(metric: APIMetric) {
  getMetricsCollector().recordAPICall(metric)
}
