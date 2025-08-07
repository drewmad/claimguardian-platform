/**
 * @fileMetadata
 * @purpose "Infrastructure monitoring API for admin dashboard"
 * @dependencies ["@/lib/monitoring", "@/lib/database", "@/lib/cache"]
 * @owner platform-team
 * @complexity high
 * @tags ["infrastructure", "monitoring", "admin", "metrics"]
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger/production-logger'
import { productionMonitor } from '@/lib/monitoring/production-monitor'
import { connectionPool } from '@/lib/database/connection-pool'
import { cacheManager } from '@/lib/cache/redis-cache-manager'
import { createClient } from '@/lib/supabase/server'

interface InfrastructureMetrics {
  timestamp: string
  system: {
    status: 'healthy' | 'degraded' | 'critical'
    uptime: number
    version: string
    environment: string
  }
  database: {
    connectionPool: {
      total: number
      active: number
      idle: number
      pending: number
    }
    performance: {
      avgQueryTime: number
      slowQueries: number
      errorRate: number
    }
    health: 'healthy' | 'degraded' | 'critical'
  }
  cache: {
    stats: {
      hits: number
      misses: number
      hitRate: number
      totalOperations: number
    }
    redis: {
      connected: boolean
      memory?: string
      commands?: number
    }
    fallback: {
      itemCount: number
      enabled: boolean
    }
    health: 'healthy' | 'degraded' | 'critical'
  }
  application: {
    responseTime: number
    errorRate: number
    throughput: number
    activeUsers?: number
    cpuUsage?: number
    memoryUsage?: number
  }
  alerts: {
    active: number
    critical: number
    resolved24h: number
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify admin access
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // TODO: Add proper admin role check
    // For now, log the access attempt
    logger.info('Infrastructure metrics accessed', {
      userId: user.id,
      email: user.email
    })

    const startTime = Date.now()

    // Gather all infrastructure metrics in parallel
    const [
      systemStatus,
      dbMetrics,
      cacheMetrics,
      appMetrics,
      alertMetrics
    ] = await Promise.allSettled([
      getSystemStatus(),
      getDatabaseMetrics(),
      getCacheMetrics(),
      getApplicationMetrics(),
      getAlertMetrics(supabase)
    ])

    const metrics: InfrastructureMetrics = {
      timestamp: new Date().toISOString(),
      system: systemStatus.status === 'fulfilled' ? systemStatus.value : {
        status: 'critical',
        uptime: process.uptime(),
        version: 'unknown',
        environment: 'unknown'
      },
      database: dbMetrics.status === 'fulfilled' ? dbMetrics.value : {
        connectionPool: { total: 0, active: 0, idle: 0, pending: 0 },
        performance: { avgQueryTime: 0, slowQueries: 0, errorRate: 1 },
        health: 'critical'
      },
      cache: cacheMetrics.status === 'fulfilled' ? cacheMetrics.value : {
        stats: { hits: 0, misses: 0, hitRate: 0, totalOperations: 0 },
        redis: { connected: false },
        fallback: { itemCount: 0, enabled: false },
        health: 'critical'
      },
      application: appMetrics.status === 'fulfilled' ? appMetrics.value : {
        responseTime: 0,
        errorRate: 0,
        throughput: 0
      },
      alerts: alertMetrics.status === 'fulfilled' ? alertMetrics.value : {
        active: 0,
        critical: 0,
        resolved24h: 0
      }
    }

    const responseTime = Date.now() - startTime

    logger.debug('Infrastructure metrics collected', {
      responseTime,
      systemStatus: metrics.system.status
    })

    return NextResponse.json(metrics)

  } catch (error) {
    logger.error('Failed to collect infrastructure metrics', error)

    return NextResponse.json(
      { error: 'Failed to collect infrastructure metrics' },
      { status: 500 }
    )
  }
}

async function getSystemStatus(): Promise<{
  status: 'healthy' | 'degraded' | 'critical'
  uptime: number
  version: string
  environment: string
}> {
  const systemStatus = await productionMonitor.getSystemStatus()

  return {
    status: systemStatus.status,
    uptime: process.uptime(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'
  }
}

async function getDatabaseMetrics(): Promise<{
  connectionPool: {
    total: number
    active: number
    idle: number
    pending: number
  }
  performance: {
    avgQueryTime: number
    slowQueries: number
    errorRate: number
  }
  health: 'healthy' | 'degraded' | 'critical'
}> {
  const poolStats = connectionPool.getStats()
  const { healthy } = await connectionPool.healthCheck()

  // Get recent query performance data
  const queryPerformance = await getQueryPerformance()

  return {
    connectionPool: {
      total: poolStats.totalConnections,
      active: poolStats.activeConnections,
      idle: poolStats.idleConnections,
      pending: poolStats.pendingAcquires
    },
    performance: queryPerformance,
    health: healthy ? 'healthy' : 'critical'
  }
}

async function getQueryPerformance(): Promise<{
  avgQueryTime: number
  slowQueries: number
  errorRate: number
}> {
  try {
    const supabase = await createClient()

    // Query recent performance metrics if table exists
    const { data, error } = await supabase
      .from('query_performance_logs')
      .select('duration, status')
      .gte('created_at', new Date(Date.now() - 60000).toISOString()) // Last minute
      .limit(100)

    if (error || !data) {
      return { avgQueryTime: 0, slowQueries: 0, errorRate: 0 }
    }

    const avgQueryTime = data.reduce((sum, log) => sum + (log.duration || 0), 0) / data.length
    const slowQueries = data.filter(log => (log.duration || 0) > 1000).length
    const errorQueries = data.filter(log => log.status === 'error').length
    const errorRate = errorQueries / data.length

    return {
      avgQueryTime: Math.round(avgQueryTime),
      slowQueries,
      errorRate: parseFloat(errorRate.toFixed(4))
    }
  } catch (error) {
    logger.warn('Failed to get query performance metrics', error)
    return { avgQueryTime: 0, slowQueries: 0, errorRate: 0 }
  }
}

async function getCacheMetrics(): Promise<{
  stats: {
    hits: number
    misses: number
    hitRate: number
    totalOperations: number
  }
  redis: {
    connected: boolean
    memory?: string
    commands?: number
  }
  fallback: {
    itemCount: number
    enabled: boolean
  }
  health: 'healthy' | 'degraded' | 'critical'
}> {
  const stats = cacheManager.getStats()
  const { healthy, details } = await cacheManager.healthCheck()

  return {
    stats: {
      hits: stats.hits,
      misses: stats.misses,
      hitRate: parseFloat(stats.hitRate.toFixed(4)),
      totalOperations: stats.totalOperations
    },
    redis: {
      connected: (details.redis as any)?.connected || false,
      memory: (details.redis as any)?.memory,
      commands: (details.redis as any)?.commands
    },
    fallback: {
      itemCount: (details.fallback as any)?.itemCount || 0,
      enabled: (details.fallback as any)?.enabled || false
    },
    health: healthy ? 'healthy' : 'degraded'
  }
}

async function getApplicationMetrics(): Promise<{
  responseTime: number
  errorRate: number
  throughput: number
  activeUsers?: number
  cpuUsage?: number
  memoryUsage?: number
}> {
  const latestMetrics = await productionMonitor.getLatestMetrics()

  if (!latestMetrics) {
    return {
      responseTime: 0,
      errorRate: 0,
      throughput: 0
    }
  }

  // Get active users count
  const activeUsers = await getActiveUsersCount()

  return {
    responseTime: latestMetrics.responseTime,
    errorRate: latestMetrics.errorRate,
    throughput: latestMetrics.throughput,
    activeUsers,
    cpuUsage: latestMetrics.cpuUsage,
    memoryUsage: latestMetrics.memoryUsage
  }
}

async function getActiveUsersCount(): Promise<number> {
  try {
    const supabase = await createClient()

    const { count, error } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', new Date(Date.now() - 15 * 60000).toISOString()) // Active in last 15 minutes

    return count || 0
  } catch (error) {
    logger.warn('Failed to get active users count', error)
    return 0
  }
}

async function getAlertMetrics(supabase: any): Promise<{
  active: number
  critical: number
  resolved24h: number
}> {
  try {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [activeAlertsResult, criticalAlertsResult, resolvedAlertsResult] = await Promise.allSettled([
      supabase
        .from('system_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active'),

      supabase
        .from('system_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('severity', 'critical'),

      supabase
        .from('system_alerts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'resolved')
        .gte('resolved_at', yesterday.toISOString())
    ])

    return {
      active: activeAlertsResult.status === 'fulfilled' ? (activeAlertsResult.value.count || 0) : 0,
      critical: criticalAlertsResult.status === 'fulfilled' ? (criticalAlertsResult.value.count || 0) : 0,
      resolved24h: resolvedAlertsResult.status === 'fulfilled' ? (resolvedAlertsResult.value.count || 0) : 0
    }
  } catch (error) {
    logger.warn('Failed to get alert metrics', error)
    return { active: 0, critical: 0, resolved24h: 0 }
  }
}

// Endpoint for real-time metrics updates
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { action, timeRange = '1h' } = body

    switch (action) {
      case 'get-historical-metrics':
        const historicalData = await getHistoricalMetrics(timeRange)
        return NextResponse.json({ data: historicalData })

      case 'get-performance-breakdown':
        const breakdown = await getPerformanceBreakdown()
        return NextResponse.json({ data: breakdown })

      case 'trigger-health-check':
        const healthStatus = await productionMonitor.getSystemStatus()
        return NextResponse.json({ data: healthStatus })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    logger.error('Infrastructure API error', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getHistoricalMetrics(timeRange: string): Promise<any[]> {
  try {
    // Convert time range to hours
    const hours = timeRange === '1h' ? 1 :
                 timeRange === '6h' ? 6 :
                 timeRange === '24h' ? 24 : 1

    const metrics = await productionMonitor.getMetricHistory(hours)

    // Sample data points for better visualization (max 100 points)
    const sampleSize = Math.min(100, metrics.length)
    const step = Math.max(1, Math.floor(metrics.length / sampleSize))

    return metrics.filter((_, index) => index % step === 0)
  } catch (error) {
    logger.error('Failed to get historical metrics', error)
    return []
  }
}

async function getPerformanceBreakdown(): Promise<Record<string, unknown>> {
  try {
    const supabase = await createClient()

    // Get endpoint performance breakdown
    const { data: endpointData } = await supabase
      .from('request_logs')
      .select('endpoint, avg(response_time) as avg_time, count(*) as requests')
      .gte('created_at', new Date(Date.now() - 60000).toISOString())
      .not('endpoint', 'is', null)
      .limit(10)

    // Get error breakdown
    const { data: errorData } = await supabase
      .from('error_logs')
      .select('error_type, count(*) as count')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString())
      .limit(10)

    return {
      endpoints: endpointData || [],
      errors: errorData || [],
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    logger.error('Failed to get performance breakdown', error)
    return { endpoints: [], errors: [], timestamp: new Date().toISOString() }
  }
}
