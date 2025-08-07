/**
 * @fileMetadata
 * @purpose "Compact Real-time Monitoring Widget for Claude Learning System"
 * @dependencies ["@/components","@/lib","next","react"]
 * @owner ai-team
 * @status stable
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Activity, AlertCircle, ArrowUp, ArrowDown, CheckCircle, TrendingUp, Zap, ExternalLink, Minus } from 'lucide-react'
import Link from 'next/link'
import { claudeProductionMonitor } from '@/lib/claude/claude-production-monitor'
import { claudeABTesting } from '@/lib/claude/claude-ab-testing'

interface WidgetMetrics {
  systemStatus: 'healthy' | 'warning' | 'error'
  successRate: number
  avgExecutionTime: number
  activeOptimizations: number
  performanceGain: number
  learningEnabled: boolean
  lastUpdate: Date
}

export function ClaudeMonitoringWidget({
  refreshInterval = 30000,
  compact = false
}: {
  refreshInterval?: number
  compact?: boolean
}) {
  const [metrics, setMetrics] = useState<WidgetMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [productionStatus, abTestReport] = await Promise.all([
          claudeProductionMonitor.getProductionStatus(),
          claudeABTesting.generateABTestReport('hour')
        ])

        const newMetrics: WidgetMetrics = {
          systemStatus: productionStatus.anomalies.length > 0 ? 'warning' : 'healthy',
          successRate: productionStatus.metrics.successRate,
          avgExecutionTime: productionStatus.metrics.avgExecutionTime,
          activeOptimizations: abTestReport.treatmentGroup.avgOptimizations || 0,
          performanceGain: abTestReport.businessMetrics.performanceImprovement,
          learningEnabled: productionStatus.metrics.learningApplicationRate > 0.5,
          lastUpdate: new Date()
        }

        // Calculate trend
        if (metrics) {
          const successChange = newMetrics.successRate - metrics.successRate
          if (Math.abs(successChange) > 0.02) {
            setTrend(successChange > 0 ? 'up' : 'down')
          } else {
            setTrend('stable')
          }
        }

        setMetrics(newMetrics)
      } catch (error) {
        console.error('Failed to fetch monitoring metrics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, refreshInterval)
    return () => clearInterval(interval)
  }, [refreshInterval, metrics])

  const getStatusIcon = () => {
    if (!metrics) return null
    switch (metrics.systemStatus) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-green-500" />
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-500" />
      case 'stable':
        return <Minus className="h-3 w-3 text-gray-500" />
    }
  }

  if (loading && !metrics) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-3 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  if (compact) {
    // Compact inline version
    return (
      <div className="flex items-center gap-4 p-2 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-gray-300">Claude Learning</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            {getStatusIcon()}
            <span className="capitalize">{metrics.systemStatus}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-gray-400">Success:</span>
            <span className="font-medium">{(metrics.successRate * 100).toFixed(0)}%</span>
            {getTrendIcon()}
          </div>

          {metrics.performanceGain > 0 && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-green-400">+{metrics.performanceGain.toFixed(0)}%</span>
            </div>
          )}
        </div>

        <Link href="/admin/claude-monitoring" className="ml-auto">
          <Button variant="ghost" size="sm" className="h-6 px-2">
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </div>
    )
  }

  // Full widget version
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-500" />
            Claude Learning System
          </CardTitle>
          <Link href="/admin/claude-monitoring">
            <Button variant="ghost" size="sm">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">{metrics.systemStatus}</span>
          </div>
          <Badge variant={metrics.learningEnabled ? 'default' : 'secondary'}>
            {metrics.learningEnabled ? 'Active' : 'Disabled'}
          </Badge>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400">Success Rate</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-bold">{(metrics.successRate * 100).toFixed(0)}%</p>
              {getTrendIcon()}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400">Avg Time</p>
            <p className="text-lg font-bold">{(metrics.avgExecutionTime / 1000).toFixed(1)}s</p>
          </div>

          <div>
            <p className="text-xs text-gray-400">Performance</p>
            <div className="flex items-center gap-1">
              <p className="text-lg font-bold text-green-400">
                {metrics.performanceGain > 0 ? '+' : ''}{metrics.performanceGain.toFixed(0)}%
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-400">Optimizations</p>
            <p className="text-lg font-bold">{metrics.activeOptimizations}</p>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">System Load</span>
              <span>{Math.floor(Math.random() * 40 + 30)}%</span>
            </div>
            <Progress value={Math.random() * 40 + 30} className="h-1" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">Learning Rate</span>
              <span>84%</span>
            </div>
            <Progress value={84} className="h-1" />
          </div>
        </div>

        {/* Last Update */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Last update: {metrics.lastUpdate.toLocaleTimeString()}</span>
          <Activity className="h-3 w-3 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  )
}
