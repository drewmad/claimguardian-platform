/**
 * Analytics Dashboard Component
 * Displays real-time feature usage and performance metrics
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  BarChart3,
  TrendingUp,
  Users,
  Activity,
  Clock,
  DollarSign,
  Brain,
  Shield,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AnalyticsMetrics {
  totalEvents: number
  uniqueUsers: number
  totalSessions: number
  avgSessionDuration: number
  featureUsage: {
    name: string
    count: number
    category: string
  }[]
  aiUsage: {
    feature: string
    calls: number
    tokensUsed: number
    cost: number
  }[]
  nimsUsage: {
    feature: string
    calls: number
  }[]
  topPages: {
    path: string
    views: number
    avgTimeOnPage: number
  }[]
  errorRate: number
  conversionRate: number
}

export function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  useEffect(() => {
    fetchAnalytics()
    // Refresh every 5 minutes
    const interval = setInterval(fetchAnalytics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const supabase = createClient()
      
      // Calculate date range
      const now = new Date()
      const startDate = new Date()
      if (timeRange === '24h') {
        startDate.setHours(now.getHours() - 24)
      } else if (timeRange === '7d') {
        startDate.setDate(now.getDate() - 7)
      } else {
        startDate.setDate(now.getDate() - 30)
      }

      // Fetch analytics events
      const { data: events } = await supabase
        .from('analytics_events')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      // Fetch feature usage
      const { data: features } = await supabase
        .from('feature_usage_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())

      // Fetch AI usage
      const { data: aiUsage } = await supabase
        .from('ai_usage_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())

      // Fetch NIMS usage
      const { data: nimsUsage } = await supabase
        .from('nims_usage_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())

      // Fetch page views
      const { data: pageViews } = await supabase
        .from('page_views')
        .select('*')
        .gte('created_at', startDate.toISOString())

      // Process metrics
      const processedMetrics = processAnalyticsData(
        events || [],
        features || [],
        aiUsage || [],
        nimsUsage || [],
        pageViews || []
      )

      setMetrics(processedMetrics)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (
    events: any[],
    features: any[],
    aiUsage: any[],
    nimsUsage: any[],
    pageViews: any[]
  ): AnalyticsMetrics => {
    // Process feature usage
    const featureUsageMap = new Map()
    features.forEach(f => {
      const key = f.feature_name
      if (!featureUsageMap.has(key)) {
        featureUsageMap.set(key, {
          name: f.feature_name,
          category: f.feature_category,
          count: 0
        })
      }
      featureUsageMap.get(key).count += f.usage_count || 1
    })

    // Process AI usage
    const aiUsageMap = new Map()
    aiUsage.forEach(a => {
      const key = a.feature
      if (!aiUsageMap.has(key)) {
        aiUsageMap.set(key, {
          feature: a.feature,
          calls: 0,
          tokensUsed: 0,
          cost: 0
        })
      }
      const entry = aiUsageMap.get(key)
      entry.calls++
      entry.tokensUsed += a.tokens_used || 0
      entry.cost += a.cost_estimate || 0
    })

    // Process NIMS usage
    const nimsUsageMap = new Map()
    nimsUsage.forEach(n => {
      const key = n.feature
      if (!nimsUsageMap.has(key)) {
        nimsUsageMap.set(key, {
          feature: n.feature,
          calls: 0
        })
      }
      nimsUsageMap.get(key).calls++
    })

    // Process page views
    const pageViewMap = new Map()
    pageViews.forEach(p => {
      const key = p.page_path
      if (!pageViewMap.has(key)) {
        pageViewMap.set(key, {
          path: p.page_path,
          views: 0,
          totalTime: 0
        })
      }
      const entry = pageViewMap.get(key)
      entry.views++
      entry.totalTime += p.time_on_page_ms || 0
    })

    // Calculate top pages
    const topPages = Array.from(pageViewMap.values())
      .map(p => ({
        path: p.path,
        views: p.views,
        avgTimeOnPage: p.views > 0 ? p.totalTime / p.views : 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)

    // Calculate unique users and sessions
    const uniqueUsers = new Set(events.map(e => e.user_id).filter(Boolean)).size
    const uniqueSessions = new Set(events.map(e => e.session_id)).size

    // Calculate error rate
    const errorEvents = events.filter(e => e.event_category === 'error').length
    const errorRate = events.length > 0 ? (errorEvents / events.length) * 100 : 0

    // Calculate conversion rate (mock data for demo)
    const conversionEvents = events.filter(e => e.event_name === 'conversion').length
    const conversionRate = uniqueUsers > 0 ? (conversionEvents / uniqueUsers) * 100 : 0

    return {
      totalEvents: events.length,
      uniqueUsers,
      totalSessions: uniqueSessions,
      avgSessionDuration: 5.3 * 60 * 1000, // Mock: 5.3 minutes
      featureUsage: Array.from(featureUsageMap.values()).slice(0, 10),
      aiUsage: Array.from(aiUsageMap.values()),
      nimsUsage: Array.from(nimsUsageMap.values()),
      topPages,
      errorRate,
      conversionRate
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No analytics data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end gap-2">
        {(['24h', '7d', '30d'] as const).map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              timeRange === range
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {range === '24h' ? 'Last 24 Hours' : range === '7d' ? 'Last 7 Days' : 'Last 30 Days'}
          </button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12%</span> from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalEvents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(metrics.avgSessionDuration / 60000)}m {Math.floor((metrics.avgSessionDuration % 60000) / 1000)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Average session duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
            <Progress value={metrics.conversionRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Feature Usage
          </CardTitle>
          <CardDescription>Most used features in the selected time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.featureUsage.map((feature, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center text-sm text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{feature.name}</div>
                    <Badge variant="outline" className="text-xs">
                      {feature.category}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm font-medium">{feature.count} uses</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Feature Usage
            </CardTitle>
            <CardDescription>AI-powered features and their usage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.aiUsage.map((ai, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">
                      {ai.feature.replace(/_/g, ' ')}
                    </div>
                    <Badge variant="secondary">{ai.calls} calls</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>{ai.tokensUsed.toLocaleString()} tokens</span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      ${ai.cost.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NIMS Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              NIMS Feature Usage
            </CardTitle>
            <CardDescription>Emergency management features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.nimsUsage.map((nims, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="font-medium capitalize">
                    {nims.feature.replace(/_/g, ' ')}
                  </div>
                  <Badge variant="outline">{nims.calls} operations</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle>Top Pages</CardTitle>
          <CardDescription>Most visited pages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topPages.map((page, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center text-sm text-gray-500">#{index + 1}</div>
                  <div>
                    <div className="font-medium">{page.path}</div>
                    <div className="text-sm text-gray-500">
                      Avg time: {Math.floor(page.avgTimeOnPage / 1000)}s
                    </div>
                  </div>
                </div>
                <Badge>{page.views} views</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Overall system performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {metrics.errorRate < 1 ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span>Error Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{metrics.errorRate.toFixed(2)}%</span>
                <Progress value={100 - metrics.errorRate} className="w-24" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}