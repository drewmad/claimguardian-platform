/**
 * @fileMetadata
 * @purpose "Comprehensive health check API endpoint for production monitoring"
 * @dependencies ["@/lib/monitoring", "@/lib/database", "@/lib/cache"]
 * @owner platform-team
 * @complexity medium
 * @tags ["health-check", "monitoring", "api", "system-status"]
 * @status stable
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger/production-logger'
import { productionMonitor } from '@/lib/monitoring/production-monitor'
import { connectionPool } from '@/lib/database/connection-pool'
import { cacheManager } from '@/lib/cache/redis-cache-manager'
import { createClient } from '@/lib/supabase/server'

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'critical'
  timestamp: string
  version: string
  environment: string
  uptime: number
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn'
      responseTime?: number
      details?: Record<string, unknown>
      error?: string
    }
  }
  metrics?: {
    responseTime: number
    errorRate: number
    throughput: number
    cpuUsage?: number
    memoryUsage?: number
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  const isMonitoringCheck = request.headers.get('x-monitoring-check') === 'true'
  
  try {
    // Initialize health check result
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {}
    }

    // Parallel health checks for better performance
    const [
      databaseResult,
      cacheResult,
      supabaseResult,
      systemMetrics
    ] = await Promise.allSettled([
      checkDatabaseHealth(),
      checkCacheHealth(),
      checkSupabaseHealth(),
      getSystemMetrics()
    ])

    // Process database health
    if (databaseResult.status === 'fulfilled') {
      healthCheck.checks.database = databaseResult.value
    } else {
      healthCheck.checks.database = {
        status: 'fail',
        error: databaseResult.reason?.message || 'Database health check failed'
      }
    }

    // Process cache health
    if (cacheResult.status === 'fulfilled') {
      healthCheck.checks.cache = cacheResult.value
    } else {
      healthCheck.checks.cache = {
        status: 'fail',
        error: cacheResult.reason?.message || 'Cache health check failed'
      }
    }

    // Process Supabase health
    if (supabaseResult.status === 'fulfilled') {
      healthCheck.checks.supabase = supabaseResult.value
    } else {
      healthCheck.checks.supabase = {
        status: 'fail',
        error: supabaseResult.reason?.message || 'Supabase health check failed'
      }
    }

    // Add system metrics if available
    if (systemMetrics.status === 'fulfilled') {
      healthCheck.metrics = systemMetrics.value
    }

    // Add connection pool stats
    try {
      const poolStats = connectionPool.getStats()
      healthCheck.checks.connectionPool = {
        status: poolStats.totalConnections > 0 ? 'pass' : 'warn',
        details: { ...poolStats }
      }
    } catch (error) {
      healthCheck.checks.connectionPool = {
        status: 'fail',
        error: error instanceof Error ? error.message : 'Connection pool check failed'
      }
    }

    // Check external services if not a monitoring check (to avoid rate limits)
    if (!isMonitoringCheck) {
      const externalServicesResult = await checkExternalServices()
      healthCheck.checks.externalServices = externalServicesResult
    }

    // Determine overall system status
    const failedChecks = Object.values(healthCheck.checks).filter(check => check.status === 'fail')
    const warnChecks = Object.values(healthCheck.checks).filter(check => check.status === 'warn')
    
    if (failedChecks.length > 0) {
      // Critical systems failing
      const criticalFailures = ['database', 'supabase'].some(critical => 
        healthCheck.checks[critical]?.status === 'fail'
      )
      healthCheck.status = criticalFailures ? 'critical' : 'degraded'
    } else if (warnChecks.length > 0) {
      healthCheck.status = 'degraded'
    }

    // Calculate response time
    const responseTime = Date.now() - startTime
    healthCheck.checks.api = {
      status: 'pass',
      responseTime
    }

    // Log health check for monitoring
    if (!isMonitoringCheck) {
      logger.info('Health check completed', {
        status: healthCheck.status,
        responseTime,
        failedChecks: failedChecks.length,
        warnChecks: warnChecks.length
      })
    }

    // Return appropriate HTTP status code
    const httpStatus = healthCheck.status === 'healthy' ? 200 :
                      healthCheck.status === 'degraded' ? 200 : 503

    return NextResponse.json(healthCheck, { status: httpStatus })

  } catch (error) {
    const responseTime = Date.now() - startTime
    logger.error('Health check error', error)

    const errorResponse: HealthCheckResult = {
      status: 'critical',
      timestamp: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA || '1.0.0',
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        api: {
          status: 'fail',
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json(errorResponse, { status: 503 })
  }
}

async function checkDatabaseHealth(): Promise<{
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  details?: Record<string, unknown>
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const { healthy, details } = await connectionPool.healthCheck()
    const responseTime = Date.now() - startTime

    return {
      status: healthy ? 'pass' : 'fail',
      responseTime,
      details
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Database health check failed'
    }
  }
}

async function checkCacheHealth(): Promise<{
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  details?: Record<string, unknown>
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const { healthy, details } = await cacheManager.healthCheck()
    const responseTime = Date.now() - startTime

    return {
      status: healthy ? 'pass' : 'warn', // Cache failure is not critical
      responseTime,
      details
    }
  } catch (error) {
    return {
      status: 'warn',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Cache health check failed'
    }
  }
}

async function checkSupabaseHealth(): Promise<{
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  details?: Record<string, unknown>
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    
    // Test basic query
    const { error } = await supabase.from('users').select('id').limit(1)
    const responseTime = Date.now() - startTime

    if (error && !error.message.includes('permission denied')) {
      return {
        status: 'fail',
        responseTime,
        error: error.message
      }
    }

    return {
      status: 'pass',
      responseTime,
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL
      }
    }
  } catch (error) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Supabase health check failed'
    }
  }
}

async function checkExternalServices(): Promise<{
  status: 'pass' | 'fail' | 'warn'
  responseTime?: number
  details?: Record<string, unknown>
  error?: string
}> {
  const startTime = Date.now()
  
  try {
    const checks = await Promise.allSettled([
      // Test OpenAI API if key exists
      process.env.OPENAI_API_KEY ? 
        fetch('https://api.openai.com/v1/models', {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
          signal: AbortSignal.timeout(10000)
        }).then(res => ({ service: 'openai', ok: res.ok, status: res.status })) :
        Promise.resolve({ service: 'openai', ok: true, status: 200, skipped: true }),

      // Test Google Gemini API if key exists
      process.env.GEMINI_API_KEY ?
        fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`, {
          signal: AbortSignal.timeout(10000)
        }).then(res => ({ service: 'gemini', ok: res.ok, status: res.status })) :
        Promise.resolve({ service: 'gemini', ok: true, status: 200, skipped: true })
    ])

    const results = checks.map((check, index) => {
      if (check.status === 'fulfilled') {
        return check.value
      } else {
        return {
          service: index === 0 ? 'openai' : 'gemini',
          ok: false,
          error: check.reason?.message || 'Service check failed'
        }
      }
    })

    const failedServices = results.filter(result => {
      if ('skipped' in result && result.skipped) {
        return false
      }
      return !result.ok
    })
    const responseTime = Date.now() - startTime

    return {
      status: failedServices.length === 0 ? 'pass' : 
              failedServices.length < results.length ? 'warn' : 'fail',
      responseTime,
      details: {
        services: results.reduce((acc, result) => {
          acc[result.service] = {
            ok: result.ok,
            status: 'status' in result ? result.status : undefined,
            skipped: 'skipped' in result ? result.skipped : undefined,
            error: 'error' in result ? result.error : undefined
          }
          return acc
        }, {} as Record<string, unknown>)
      }
    }
  } catch (error) {
    return {
      status: 'warn',
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'External services check failed'
    }
  }
}

async function getSystemMetrics(): Promise<{
  responseTime: number
  errorRate: number
  throughput: number
  cpuUsage?: number
  memoryUsage?: number
}> {
  try {
    const metrics = await productionMonitor.getLatestMetrics()
    
    return {
      responseTime: metrics?.responseTime || 0,
      errorRate: metrics?.errorRate || 0,
      throughput: metrics?.throughput || 0,
      cpuUsage: metrics?.cpuUsage,
      memoryUsage: metrics?.memoryUsage
    }
  } catch (error) {
    // Return default metrics if monitoring not available
    return {
      responseTime: 0,
      errorRate: 0,
      throughput: 0
    }
  }
}

// Also support HEAD requests for simple up/down checks
export async function HEAD(): Promise<NextResponse> {
  try {
    // Simple check - just verify we can respond
    const supabase = await createClient()
    const { error } = await supabase.from('users').select('id').limit(1)
    
    if (error && !error.message.includes('permission denied')) {
      return new NextResponse(null, { status: 503 })
    }
    
    return new NextResponse(null, { status: 200 })
  } catch {
    return new NextResponse(null, { status: 503 })
  }
}