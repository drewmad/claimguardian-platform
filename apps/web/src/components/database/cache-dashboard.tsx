/**
 * @fileMetadata
 * @purpose "Comprehensive cache monitoring dashboard with real-time metrics and optimization controls"
 * @owner backend-team
 * @dependencies ["react", "framer-motion", "@/components/ui", "@/lib/database/cache-manager"]
 * @exports ["CacheDashboard", "CacheMetricsCard", "CacheLevelMonitor"]
 * @complexity high
 * @tags ["database", "caching", "dashboard", "monitoring", "performance"]
 * @status stable
 */
'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap,
  Database,
  Monitor,
  Cpu,
  HardDrive,
  Globe,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Trash2,
  Settings,
  RefreshCw,
  Optimize,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Filter,
  Download
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { getCacheManager, type CacheLevel, type CacheMetrics } from '@/lib/database/cache-manager'
import { useToast } from '@/components/notifications/toast-system'
import { cn } from '@/lib/utils'
import { logger } from '@/lib/logger'

interface CacheDashboardProps {
  refreshInterval?: number
  showOptimizations?: boolean
  className?: string
}

interface CacheAlert {
  id: string
  type: 'warning' | 'error' | 'info'
  title: string
  message: string
  level?: CacheLevel
  action?: () => void
  actionLabel?: string
}

export function CacheDashboard({
  refreshInterval = 10000, // 10 seconds
  showOptimizations = true,
  className
}: CacheDashboardProps) {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null)
  const [cacheInfo, setCacheInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [alerts, setAlerts] = useState<CacheAlert[]>([])
  const [selectedLevel, setSelectedLevel] = useState<CacheLevel | 'all'>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const { success, error, info } = useToast()
  const cacheManager = useMemo(() => getCacheManager(), [])

  // Fetch cache data
  const fetchCacheData = async () => {
    try {
      const [metricsData, infoData] = await Promise.all([
        cacheManager.getMetrics(),
        cacheManager.getCacheInfo()
      ])
      
      setMetrics(metricsData)
      setCacheInfo(infoData)
      setAlerts(generateAlerts(metricsData, infoData))
    } catch (err) {
      logger.error('Failed to fetch cache data', err as Error)
      error('Failed to load cache data')
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh effect
  useEffect(() => {
    fetchCacheData()

    if (autoRefresh) {
      const interval = setInterval(fetchCacheData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval])

  // Generate cache alerts
  const generateAlerts = (metrics: CacheMetrics, info: any): CacheAlert[] => {
    const alerts: CacheAlert[] = []

    // Low hit rate alert
    if (metrics.hitRate < 70) {
      alerts.push({
        id: 'low-hit-rate',
        type: 'warning',
        title: 'Low Cache Hit Rate',
        message: `Hit rate is ${metrics.hitRate.toFixed(1)}%. Consider optimizing cache keys or increasing TTL.`,
        action: () => handleOptimizeCache(),
        actionLabel: 'Optimize'
      })
    }

    // High memory usage alert
    if (metrics.memoryUsage.utilization > 85) {
      alerts.push({
        id: 'high-memory',
        type: 'error',
        title: 'High Memory Usage',
        message: `Memory utilization is ${metrics.memoryUsage.utilization.toFixed(1)}%. Cache eviction may occur.`,
        action: () => handleClearCache(),
        actionLabel: 'Clear Cache'
      })
    }

    // High latency alert
    if (metrics.performance.getLatency > 50) {
      alerts.push({
        id: 'high-latency',
        type: 'warning',
        title: 'High Cache Latency',
        message: `Average get latency is ${metrics.performance.getLatency.toFixed(1)}ms. Check cache layer performance.`,
        level: 'memory'
      })
    }

    // Excellent performance
    if (metrics.hitRate > 90 && metrics.memoryUsage.utilization < 70) {
      alerts.push({
        id: 'excellent-performance',
        type: 'info',
        title: 'Excellent Cache Performance',
        message: `Hit rate ${metrics.hitRate.toFixed(1)}% with optimal memory usage.`,
        action: () => info('Cache is performing excellently!'),
        actionLabel: 'Details'
      })
    }

    return alerts
  }

  // Cache operations
  const handleOptimizeCache = async () => {
    setIsOptimizing(true)
    try {
      const result = await cacheManager.optimize()
      success('Cache optimization completed', {
        subtitle: `Applied ${result.optimizations.length} optimizations`
      })
      await fetchCacheData()
    } catch (err) {
      error('Cache optimization failed')
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleClearCache = async () => {
    try {
      await cacheManager.clear()
      success('Cache cleared successfully')
      await fetchCacheData()
    } catch (err) {
      error('Failed to clear cache')
    }
  }

  const handleClearLevel = async (level: CacheLevel) => {
    try {
      await cacheManager.clear({ levels: [level] })
      success(`${level} cache cleared`)
      await fetchCacheData()
    } catch (err) {
      error(`Failed to clear ${level} cache`)
    }
  }

  // Filtered metrics by level
  const filteredMetrics = useMemo(() => {
    if (!metrics || selectedLevel === 'all') return metrics
    return metrics
  }, [metrics, selectedLevel])

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading cache metrics...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!metrics || !cacheInfo) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Cache Data Unavailable</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Unable to load cache metrics and information.
            </p>
            <Button onClick={fetchCacheData}>
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
            <Zap className="w-6 h-6" />
            Cache Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Real-time cache performance monitoring and optimization
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Level Filter */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['all', 'memory', 'browser', 'redis', 'database'] as const).map((level) => (
              <Button
                key={level}
                variant={selectedLevel === level ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedLevel(level)}
                className="h-8 px-3 capitalize"
                disabled={level !== 'all' && level !== 'memory' && level !== 'browser'}
              >
                {level}
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

          {/* Optimize button */}
          {showOptimizations && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOptimizeCache}
              disabled={isOptimizing}
            >
              {isOptimizing ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                  Optimizing...
                </>
              ) : (
                <>
                  <Optimize className="w-4 h-4 mr-2" />
                  Optimize
                </>
              )}
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={fetchCacheData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.id} className={cn(
              alert.type === 'error' && 'border-red-200 bg-red-50 dark:bg-red-950/20',
              alert.type === 'warning' && 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
              alert.type === 'info' && 'border-blue-200 bg-blue-50 dark:bg-blue-950/20'
            )}>
              {alert.type === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
              {alert.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-600" />}
              {alert.type === 'info' && <CheckCircle className="w-4 h-4 text-blue-600" />}
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.title}</p>
                    <p className="text-sm mt-1">{alert.message}</p>
                  </div>
                  {alert.action && alert.actionLabel && (
                    <Button variant="outline" size="sm" onClick={alert.action}>
                      {alert.actionLabel}
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <CacheMetricsCard
          title="Hit Rate"
          value={`${metrics.hitRate.toFixed(1)}%`}
          icon={Activity}
          color="text-green-600"
          progress={metrics.hitRate}
          description="Cache effectiveness"
        />

        <CacheMetricsCard
          title="Memory Usage"
          value={`${(metrics.memoryUsage.used / (1024 * 1024)).toFixed(1)}MB`}
          icon={HardDrive}
          color="text-blue-600"
          progress={metrics.memoryUsage.utilization}
          description={`${metrics.memoryUsage.utilization.toFixed(1)}% utilized`}
        />

        <CacheMetricsCard
          title="Response Time"
          value={`${metrics.performance.getLatency.toFixed(1)}ms`}
          icon={Clock}
          color="text-purple-600"
          description="Average get latency"
        />

        <CacheMetricsCard
          title="Total Requests"
          value={metrics.totalRequests.toLocaleString()}
          icon={BarChart3}
          color="text-orange-600"
          description={`${metrics.totalHits} hits, ${metrics.totalMisses} misses`}
        />
      </div>

      {/* Cache Level Details */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="w-5 h-5" />
              Cache Level Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(metrics.levelStats).map(([level, stats]) => {
                const isActive = cacheInfo.levels[level as CacheLevel]?.active || false
                if (!isActive && stats.hits === 0 && stats.misses === 0) return null

                const hitRate = stats.hits + stats.misses > 0 
                  ? (stats.hits / (stats.hits + stats.misses)) * 100 
                  : 0

                return (
                  <CacheLevelMonitor
                    key={level}
                    level={level as CacheLevel}
                    stats={stats}
                    hitRate={hitRate}
                    isActive={isActive}
                    onClear={() => handleClearLevel(level as CacheLevel)}
                  />
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Cache Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Gets</p>
                  <p className="text-lg font-medium">{metrics.operations.gets.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Sets</p>
                  <p className="text-lg font-medium">{metrics.operations.sets.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Deletes</p>
                  <p className="text-lg font-medium">{metrics.operations.deletes.toLocaleString()}</p>
                </div>
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Evictions</p>
                  <p className="text-lg font-medium">{metrics.operations.evictions.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Performance Metrics</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Set Latency:</span>
                    <span className="font-medium">{metrics.performance.setLatency.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Delete Latency:</span>
                    <span className="font-medium">{metrics.performance.deleteLatency.toFixed(1)}ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Miss Rate:</span>
                    <span className="font-medium">{metrics.missRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cache Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Cache Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium mb-2">Strategy & Policy</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Strategy:</span>
                  <Badge variant="outline">{cacheInfo.config.strategy}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Eviction:</span>
                  <Badge variant="outline">{cacheInfo.config.evictionPolicy}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Default TTL:</span>
                  <span>{(cacheInfo.config.defaultTTL / 1000 / 60).toFixed(0)}min</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Levels & Features</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Levels:</span>
                  <span>{cacheInfo.config.levels.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compression:</span>
                  <Badge variant={cacheInfo.config.compressionEnabled ? 'default' : 'outline'}>
                    {cacheInfo.config.compressionEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Encryption:</span>
                  <Badge variant={cacheInfo.config.encryptionEnabled ? 'default' : 'outline'}>
                    {cacheInfo.config.encryptionEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Limits & Settings</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Max Memory:</span>
                  <span>{(cacheInfo.config.maxMemorySize / 1024 / 1024).toFixed(0)}MB</span>
                </div>
                <div className="flex justify-between">
                  <span>Metrics:</span>
                  <Badge variant={cacheInfo.config.metricsEnabled ? 'default' : 'outline'}>
                    {cacheInfo.config.metricsEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={() => handleClearCache()}>
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Caches
            </Button>
            <Button variant="outline" size="sm" onClick={fetchCacheData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              View Config
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Cache Metrics Card Component
interface CacheMetricsCardProps {
  title: string
  value: string
  icon: React.ElementType
  color: string
  progress?: number
  description?: string
}

function CacheMetricsCard({
  title,
  value,
  icon: Icon,
  color,
  progress,
  description
}: CacheMetricsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {title}
            </p>
            <p className="text-2xl font-bold mt-2">
              {value}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
            {progress !== undefined && (
              <Progress value={progress} className="mt-3 h-2" />
            )}
          </div>
          
          <div className={cn("w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center ml-4", color)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Cache Level Monitor Component
interface CacheLevelMonitorProps {
  level: CacheLevel
  stats: any
  hitRate: number
  isActive: boolean
  onClear: () => void
}

function CacheLevelMonitor({
  level,
  stats,
  hitRate,
  isActive,
  onClear
}: CacheLevelMonitorProps) {
  const getLevelIcon = (level: CacheLevel) => {
    switch (level) {
      case 'memory': return Cpu
      case 'browser': return Globe
      case 'redis': return Database
      case 'database': return HardDrive
      default: return Monitor
    }
  }

  const getLevelColor = (level: CacheLevel) => {
    switch (level) {
      case 'memory': return 'text-green-600'
      case 'browser': return 'text-blue-600'
      case 'redis': return 'text-red-600'
      case 'database': return 'text-purple-600'
      default: return 'text-gray-600'
    }
  }

  const Icon = getLevelIcon(level)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-white dark:bg-gray-700", getLevelColor(level))}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div>
          <h4 className="font-medium capitalize">{level} Cache</h4>
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Hit Rate: {hitRate.toFixed(1)}%</span>
            <span>Entries: {stats.entries}</span>
            <span>Size: {(stats.size / 1024).toFixed(0)}KB</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Badge variant={isActive ? 'default' : 'outline'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
        
        {hitRate > 0 && (
          <div className="flex items-center gap-1 text-sm">
            {hitRate > 75 ? (
              <TrendingUp className="w-4 h-4 text-green-500" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500" />
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" onClick={onClear} disabled={!isActive}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  )
}

export { CacheMetricsCard, CacheLevelMonitor }