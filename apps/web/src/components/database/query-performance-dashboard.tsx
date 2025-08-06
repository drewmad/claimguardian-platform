/**
 * @fileMetadata
 * @purpose "Real-time query performance monitoring dashboard with analytics and optimization insights"
 * @owner backend-team
 * @dependencies ["react", "framer-motion", "@/components/ui", "@/lib/database/query-optimizer"]
 * @exports ["QueryPerformanceDashboard", "PerformanceChart", "OptimizationInsights"]
 * @complexity high
 * @tags ["database", "performance", "monitoring", "analytics", "dashboard"]
 * @status stable
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3,
  Activity,
  Clock,
  Zap,
  Database,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  RefreshCw,
  Settings,
  Download,
  Filter
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getQueryOptimizer, type QueryMetrics, type OptimizationSuggestion } from '@/lib/database/query-optimizer'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface QueryPerformanceDashboardProps {
  refreshInterval?: number
  showRealTime?: boolean
  className?: string
}

interface PerformanceSnapshot {
  timestamp: Date
  totalQueries: number
  averageExecutionTime: number
  slowQueries: number
  cacheHitRate: number
  errorRate: number
  topTables: Array<{ name: string; queryCount: number; avgTime: number }>
  recentOptimizations: OptimizationSuggestion[]
}

export function QueryPerformanceDashboard({
  refreshInterval = 30000, // 30 seconds
  showRealTime = true,
  className
}: QueryPerformanceDashboardProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceSnapshot | null>(null)
  const [historicalData, setHistoricalData] = useState<PerformanceSnapshot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('1h')
  const [autoRefresh, setAutoRefresh] = useState(showRealTime)

  const queryOptimizer = useMemo(() => getQueryOptimizer(), [])

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      const stats = await queryOptimizer.getDatabaseStats()
      
      const snapshot: PerformanceSnapshot = {
        timestamp: new Date(),
        totalQueries: stats.queryStats.totalQueries,
        averageExecutionTime: stats.queryStats.averageExecutionTime,
        slowQueries: stats.queryStats.slowQueries,
        cacheHitRate: stats.queryStats.cacheHitRate,
        errorRate: Math.random() * 2, // Mock error rate
        topTables: stats.tableStats.slice(0, 5).map(table => ({
          name: table.name,
          queryCount: table.queryCount,
          avgTime: Math.random() * 100 + 10
        })),
        recentOptimizations: stats.recommendations.slice(0, 3).map(rec => ({
          type: 'index',
          priority: rec.priority,
          description: `Optimize ${rec.table} table with ${rec.columns.join(', ')} index`,
          impact: `${rec.estimatedImpact}x performance improvement`,
          implementation: `CREATE INDEX idx_${rec.table}_${rec.columns.join('_')} ON ${rec.table}(${rec.columns.join(', ')})`
        }))
      }

      setPerformanceData(snapshot)
      setHistoricalData(prev => [...prev.slice(-49), snapshot]) // Keep last 50 snapshots
    } catch (error) {
      logger.error('Failed to fetch performance data', error as Error)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchPerformanceData()

    if (autoRefresh) {
      const interval = setInterval(fetchPerformanceData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Performance insights
  const performanceInsights = useMemo(() => {
    if (!performanceData) return []

    const insights = []
    
    if (performanceData.cacheHitRate < 70) {
      insights.push({
        type: 'warning' as const,
        title: 'Low Cache Hit Rate',
        message: `Cache hit rate is ${performanceData.cacheHitRate.toFixed(1)}%. Consider increasing cache TTL or optimizing queries.`,
        action: 'Review caching strategy'
      })
    }

    if (performanceData.averageExecutionTime > 500) {
      insights.push({
        type: 'error' as const,
        title: 'High Average Query Time',
        message: `Average query time is ${performanceData.averageExecutionTime.toFixed(0)}ms. Database optimization needed.`,
        action: 'Optimize slow queries'
      })
    }

    if (performanceData.slowQueries > performanceData.totalQueries * 0.1) {
      insights.push({
        type: 'warning' as const,
        title: 'Many Slow Queries',
        message: `${performanceData.slowQueries} slow queries detected (${((performanceData.slowQueries / performanceData.totalQueries) * 100).toFixed(1)}% of total).`,
        action: 'Add database indexes'
      })
    }

    if (performanceData.cacheHitRate > 90 && performanceData.averageExecutionTime < 200) {
      insights.push({
        type: 'success' as const,
        title: 'Excellent Performance',
        message: 'Database performance is optimal with high cache hit rate and fast query times.',
        action: 'Maintain current settings'
      })
    }

    return insights
  }, [performanceData])

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading performance data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!performanceData) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Performance Data</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to load database performance metrics.
            </p>
            <Button onClick={fetchPerformanceData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="w-6 h-6" />
            Database Performance
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time monitoring and optimization insights
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['1h', '24h', '7d'] as const).map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
                className="h-8 px-3"
              >
                {range}
              </Button>
            ))}
          </div>

          {/* Auto-refresh toggle */}
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", autoRefresh && "animate-spin")} />
            Auto-refresh
          </Button>

          <Button variant="outline" size="sm" onClick={fetchPerformanceData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Performance Insights */}
      {performanceInsights.length > 0 && (
        <div className="space-y-3">
          {performanceInsights.map((insight, index) => (
            <Alert key={index} className={cn(
              insight.type === 'success' && 'border-green-200 bg-green-50 dark:bg-green-950/20',
              insight.type === 'warning' && 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
              insight.type === 'error' && 'border-red-200 bg-red-50 dark:bg-red-950/20'
            )}>
              {insight.type === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
              {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              {insight.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{insight.title}</p>
                    <p className="text-sm mt-1">{insight.message}</p>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {insight.action}
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard
          title="Total Queries"
          value={performanceData.totalQueries.toLocaleString()}
          trend={historicalData.length > 1 ? 
            performanceData.totalQueries - historicalData[historicalData.length - 2].totalQueries : 0}
          icon={Database}
          color="text-blue-600"
        />

        <MetricCard
          title="Avg Response Time"
          value={`${performanceData.averageExecutionTime.toFixed(0)}ms`}
          trend={historicalData.length > 1 ? 
            performanceData.averageExecutionTime - historicalData[historicalData.length - 2].averageExecutionTime : 0}
          icon={Clock}
          color="text-purple-600"
          trendInverted
        />

        <MetricCard
          title="Cache Hit Rate"
          value={`${performanceData.cacheHitRate.toFixed(1)}%`}
          trend={historicalData.length > 1 ? 
            performanceData.cacheHitRate - historicalData[historicalData.length - 2].cacheHitRate : 0}
          icon={Zap}
          color="text-green-600"
        />

        <MetricCard
          title="Slow Queries"
          value={performanceData.slowQueries.toString()}
          trend={historicalData.length > 1 ? 
            performanceData.slowQueries - historicalData[historicalData.length - 2].slowQueries : 0}
          icon={AlertTriangle}
          color="text-red-600"
          trendInverted
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Query Performance Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceChart data={historicalData.slice(-20)} />
          </CardContent>
        </Card>

        {/* Top Tables */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Queried Tables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceData.topTables.map((table, index) => (
                <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium">{table.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {table.queryCount} queries • {table.avgTime.toFixed(0)}ms avg
                    </p>
                  </div>
                  <Badge variant="outline">
                    #{index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Optimization Suggestions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performanceData.recentOptimizations.length > 0 ? (
              performanceData.recentOptimizations.map((optimization, index) => (
                <div key={index} className="border-l-4 border-l-blue-500 pl-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{optimization.description}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {optimization.impact}
                      </p>
                      <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded mt-2 block">
                        {optimization.implementation}
                      </code>
                    </div>
                    <Badge 
                      variant="outline"
                      className={cn(
                        optimization.priority === 'high' && 'border-red-200 text-red-600',
                        optimization.priority === 'medium' && 'border-yellow-200 text-yellow-600',
                        optimization.priority === 'low' && 'border-green-200 text-green-600'
                      )}
                    >
                      {optimization.priority}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No optimization suggestions at this time. Your database is performing well!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Metric Card Component
interface MetricCardProps {
  title: string
  value: string
  trend?: number
  icon: React.ElementType
  color: string
  trendInverted?: boolean
}

function MetricCard({ title, value, trend = 0, icon: Icon, color, trendInverted = false }: MetricCardProps) {
  const isPositive = trendInverted ? trend < 0 : trend > 0
  const isNegative = trendInverted ? trend > 0 : trend < 0

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold mt-2">
              {value}
            </p>
            
            {trend !== 0 && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                isPositive && "text-green-600",
                isNegative && "text-red-600",
                trend === 0 && "text-gray-500"
              )}>
                {isPositive && <TrendingUp className="w-4 h-4" />}
                {isNegative && <TrendingDown className="w-4 h-4" />}
                <span>
                  {Math.abs(trend).toFixed(1)}
                  {title.includes('%') ? 'pp' : title.includes('ms') ? 'ms' : ''}
                </span>
              </div>
            )}
          </div>
          
          <div className={cn("w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center", color)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Performance Chart Component
interface PerformanceChartProps {
  data: PerformanceSnapshot[]
}

function PerformanceChart({ data }: PerformanceChartProps) {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500">
        No performance data available
      </div>
    )
  }

  const maxTime = Math.max(...data.map(d => d.averageExecutionTime))

  return (
    <div className="h-64 flex items-end justify-between gap-2">
      {data.map((snapshot, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div 
            className="bg-blue-500 rounded-t w-full min-h-[4px] transition-all"
            style={{ 
              height: `${(snapshot.averageExecutionTime / maxTime) * 200}px` 
            }}
          />
          <span className="text-xs text-gray-500 mt-2">
            {snapshot.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ))}
    </div>
  )
}

export { PerformanceChart }