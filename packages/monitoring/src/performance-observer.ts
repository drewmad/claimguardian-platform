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
import { isLayoutShift, isFirstInput, isPerformanceEntry, PerformanceEventTiming } from './utils/type-guards'
import { recordMetric } from './metrics'

interface PerformanceObserverConfig {
  enableResourceTiming?: boolean
  enableLongTasks?: boolean
  enableLayoutShift?: boolean
  enableFirstInput?: boolean
  resourceTimingBufferSize?: number
  longTaskThreshold?: number
}

export function createPerformanceObserver(config: PerformanceObserverConfig = {}) {
  if (typeof window === 'undefined' || !window.PerformanceObserver) {
    console.warn('PerformanceObserver not available')
    return null
  }

  const observers: PerformanceObserver[] = []

  // Resource Timing (network requests)
  if (config.enableResourceTiming !== false) {
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resourceEntry = entry as PerformanceResourceTiming
          
          recordMetric('resource-load', resourceEntry.duration, {
            name: resourceEntry.name,
            initiatorType: resourceEntry.initiatorType,
            transferSize: resourceEntry.transferSize,
            encodedBodySize: resourceEntry.encodedBodySize,
            decodedBodySize: resourceEntry.decodedBodySize
          })

          // Alert on slow resources
          if (resourceEntry.duration > 3000) {
            console.warn(`Slow resource detected: ${resourceEntry.name} took ${resourceEntry.duration}ms`)
          }
        }
      })

      resourceObserver.observe({ entryTypes: ['resource'] })
      observers.push(resourceObserver)

      // Set buffer size
      if (config.resourceTimingBufferSize) {
        performance.setResourceTimingBufferSize(config.resourceTimingBufferSize)
      }
    } catch (e) {
      console.error('Failed to create resource timing observer:', e)
    }
  }

  // Long Tasks (blocking the main thread)
  if (config.enableLongTasks !== false && 'PerformanceLongTaskTiming' in window) {
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const threshold = config.longTaskThreshold || 50
          
          if (entry.duration > threshold) {
            recordMetric('long-task', entry.duration, {
              startTime: entry.startTime,
              attribution: isPerformanceEntry(entry) ? 'long-task' : 'unknown'
            })

            console.warn(`Long task detected: ${entry.duration}ms`)
          }
        }
      })

      longTaskObserver.observe({ entryTypes: ['longtask'] })
      observers.push(longTaskObserver)
    } catch (e) {
      console.error('Failed to create long task observer:', e)
    }
  }

  // Layout Shifts (visual stability)
  if (config.enableLayoutShift !== false && 'LayoutShift' in window) {
    try {
      let cumulativeLayoutShift = 0
      
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (isLayoutShift(entry)) {
            // Only count shifts without user input
            if (!entry.hadRecentInput) {
              cumulativeLayoutShift += entry.value
              
              recordMetric('layout-shift', entry.value, {
                cumulative: cumulativeLayoutShift,
                sources: (entry as LayoutShift).sources?.length || 0
              })
            }
          }
        }
      })

      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      observers.push(layoutShiftObserver)
    } catch (e) {
      console.error('Failed to create layout shift observer:', e)
    }
  }

  // First Input Delay
  if (config.enableFirstInput !== false) {
    try {
      const firstInputObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (isFirstInput(entry)) {
            recordMetric('first-input-delay', entry.processingStart - entry.startTime, {
              eventType: entry.name,
              target: (entry as PerformanceEventTiming).target?.tagName
            })
          }
        }
      })

      firstInputObserver.observe({ entryTypes: ['first-input'] })
      observers.push(firstInputObserver)
    } catch (e) {
      console.error('Failed to create first input observer:', e)
    }
  }

  // Navigation timing
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing
    const navigationStart = timing.navigationStart

    // Record key navigation metrics
    window.addEventListener('load', () => {
      const metrics = {
        'dns-lookup': timing.domainLookupEnd - timing.domainLookupStart,
        'tcp-connection': timing.connectEnd - timing.connectStart,
        'request-time': timing.responseStart - timing.requestStart,
        'response-time': timing.responseEnd - timing.responseStart,
        'dom-processing': timing.domComplete - timing.domLoading,
        'page-load-total': timing.loadEventEnd - navigationStart
      }

      Object.entries(metrics).forEach(([name, value]) => {
        if (value > 0) {
          recordMetric(name, value)
        }
      })
    })
  }

  // Memory usage monitoring (if available)
  if ('memory' in performance) {
    setInterval(() => {
      const memory = (performance as unknown).memory
      
      recordMetric('memory-usage', memory.usedJSHeapSize, {
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      })

      // Alert on high memory usage
      const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit
      if (usage > 0.9) {
        console.warn(`High memory usage detected: ${(usage * 100).toFixed(1)}%`)
      }
    }, 30000) // Check every 30 seconds
  }

  return {
    disconnect: () => {
      observers.forEach(observer => observer.disconnect())
    },
    
    takeRecords: () => {
      return observers.flatMap(observer => observer.takeRecords())
    }
  }
}