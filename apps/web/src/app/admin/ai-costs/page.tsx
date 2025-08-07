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
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, DollarSign, AlertCircle, Users, Zap, Clock } from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

interface AIDailySummary {
  date: string
  provider: string
  model: string
  calls: number
  total_tokens: number
  daily_cost: number
  avg_response_time_ms: number
  failed_calls: number
}

interface AIHourlyUsage {
  hour: string
  provider: string
  calls: number
  tokens: number
  cost: number
}

interface UserAISummary {
  user_id: string
  email: string
  days_active: number
  total_calls: number
  total_tokens: number
  total_cost: number
  last_usage: string
}

interface ModelPerformance {
  provider: string
  model: string
  operation_type: string
  total_calls: number
  avg_response_time: number
  median_response_time: number
  p95_response_time: number
  error_rate: number
  avg_tokens_per_call: number
}

interface CostProjection {
  current_month: string
  month_to_date_cost: number
  recent_avg_daily_cost: number
  projected_monthly_cost: number
}

const PROVIDER_COLORS = {
  openai: '#10A37F',
  gemini: '#4285F4',
  anthropic: '#8B5CF6',
  xai: '#1DA1F2'
}

export default function AICostsDashboard() {
  const [dailySummary, setDailySummary] = useState<AIDailySummary[]>([])
  const [hourlyUsage, setHourlyUsage] = useState<AIHourlyUsage[]>([])
  const [topUsers, setTopUsers] = useState<UserAISummary[]>([])
  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([])
  const [costProjection, setCostProjection] = useState<CostProjection | null>(null)
  const [alerts, setAlerts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserSupabaseClient()

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch all dashboard data in parallel
      const [
        dailyData,
        hourlyData,
        userData,
        performanceData,
        projectionData,
        alertData
      ] = await Promise.all([
        supabase.from('ai_usage_summary').select('*').order('date', { ascending: false }).limit(30),
        supabase.from('ai_usage_hourly').select('*').order('hour', { ascending: false }).limit(168), // 7 days
        supabase.from('user_ai_usage_summary').select('*').limit(10),
        supabase.from('ai_model_performance').select('*'),
        supabase.from('ai_cost_projection').select('*').single(),
        supabase.rpc('check_ai_cost_alerts')
      ])

      if (dailyData.error) throw dailyData.error
      if (hourlyData.error) throw hourlyData.error
      if (userData.error) throw userData.error
      if (performanceData.error) throw performanceData.error

      setDailySummary(dailyData.data || [])
      setHourlyUsage(hourlyData.data || [])
      setTopUsers(userData.data || [])
      setModelPerformance(performanceData.data || [])
      setCostProjection(projectionData.data)
      setAlerts(alertData.data || [])

      setError(null)
    } catch (err) {
      console.error('Error loading dashboard data:', err)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
    const interval = setInterval(loadDashboardData, 60000) // Refresh every minute
    return () => clearInterval(interval)
  }, [loadDashboardData])

  // Calculate summary metrics
  const totalCostToday = dailySummary
    .filter(d => d.date === new Date().toISOString().split('T')[0])
    .reduce((sum, d) => sum + (d.daily_cost || 0), 0)

  const totalCallsToday = dailySummary
    .filter(d => d.date === new Date().toISOString().split('T')[0])
    .reduce((sum, d) => sum + (d.calls || 0), 0)

  const providerBreakdown = dailySummary
    .filter(d => d.date === new Date().toISOString().split('T')[0])
    .reduce((acc, d) => {
      const provider = d.provider
      if (!acc[provider]) acc[provider] = 0
      acc[provider] += d.daily_cost || 0
      return acc
    }, {} as Record<string, number>)

  const pieData = Object.entries(providerBreakdown).map(([provider, cost]) => ({
    name: provider.toUpperCase(),
    value: parseFloat(cost.toFixed(2)),
    color: PROVIDER_COLORS[provider as keyof typeof PROVIDER_COLORS] || '#666'
  }))

  // Prepare chart data
  const dailyChartData = dailySummary.reduce((acc, item) => {
    const existing = acc.find((d: Record<string, unknown>) => d.date === item.date)
    if (existing) {
      (existing as Record<string, unknown>)[item.provider] = ((existing as Record<string, unknown>)[item.provider] || 0) as number + item.daily_cost
    } else {
      acc.push({
        date: item.date,
        [item.provider]: item.daily_cost
      })
    }
    return acc
  }, [] as Record<string, unknown>[]).reverse()

  const hourlyChartData = hourlyUsage.reduce((acc, item) => {
    const hourStr = new Date(item.hour).toLocaleTimeString('en-US', { hour: 'numeric' })
    const existing = acc.find((d: Record<string, unknown>) => d.hour === hourStr)
    if (existing) {
      (existing as Record<string, unknown>).calls = (existing as Record<string, unknown>).calls as number + item.calls
    } else {
      acc.push({
        hour: hourStr,
        calls: item.calls
      })
    }
    return acc
  }, [] as Record<string, unknown>[]).slice(-24).reverse()

  if (loading) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading AI cost data...</p>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-white">AI Cost Tracking Dashboard</h1>
            <Badge variant="outline" className="text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              Live Updates
            </Badge>
          </div>

          {error && (
            <Alert className="bg-red-900/20 border-red-900">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {alerts.length > 0 && (
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <Alert key={idx} className="bg-yellow-900/20 border-yellow-900">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{(alert as Record<string, unknown>).alert_message as string}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Today's Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">${totalCostToday.toFixed(2)}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {totalCallsToday} API calls
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Month to Date</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  ${costProjection?.month_to_date_cost?.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Projected: ${costProjection?.projected_monthly_cost?.toFixed(2) || '0.00'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Users</CardTitle>
                <Users className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{topUsers.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  In the last 30 days
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg Response Time</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {modelPerformance.length > 0
                    ? Math.round(modelPerformance.reduce((sum, m) => sum + m.avg_response_time, 0) / modelPerformance.length)
                    : 0}ms
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Across all models
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Cost Trend */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Daily Cost Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis
                      dataKey="date"
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    {Object.keys(PROVIDER_COLORS).map(provider => (
                      <Line
                        key={provider}
                        type="monotone"
                        dataKey={provider}
                        stroke={PROVIDER_COLORS[provider as keyof typeof PROVIDER_COLORS]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Provider Breakdown */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Today's Provider Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Hourly Usage Pattern */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">24-Hour Usage Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="hour" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                    <Bar dataKey="calls" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Model Performance */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {modelPerformance.slice(0, 5).map((model, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {model.provider}
                          </Badge>
                          <span className="text-sm text-gray-300">{model.model}</span>
                        </div>
                        <span className="text-xs text-gray-500">{model.total_calls} calls</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Avg: </span>
                          <span className="text-gray-300">{Math.round(model.avg_response_time)}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">P95: </span>
                          <span className="text-gray-300">{Math.round(model.p95_response_time)}ms</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Error: </span>
                          <span className={model.error_rate > 5 ? 'text-red-400' : 'text-gray-300'}>
                            {model.error_rate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Users Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Top Users by Cost (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">User</th>
                      <th className="text-right py-2 text-gray-400">Days Active</th>
                      <th className="text-right py-2 text-gray-400">Total Calls</th>
                      <th className="text-right py-2 text-gray-400">Total Tokens</th>
                      <th className="text-right py-2 text-gray-400">Total Cost</th>
                      <th className="text-right py-2 text-gray-400">Last Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((user, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-2 text-gray-300">{user.email}</td>
                        <td className="text-right py-2 text-gray-300">{user.days_active}</td>
                        <td className="text-right py-2 text-gray-300">{user.total_calls.toLocaleString()}</td>
                        <td className="text-right py-2 text-gray-300">{user.total_tokens.toLocaleString()}</td>
                        <td className="text-right py-2 text-gray-300">${user.total_cost.toFixed(2)}</td>
                        <td className="text-right py-2 text-gray-300">
                          {new Date(user.last_usage).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
