/**
 * @fileMetadata
 * @owner admin-team
 * @purpose "Revenue Analytics Dashboard for subscription tier analysis and financial metrics"
 * @dependencies ["@/components", "@/lib", "recharts", "lucide-react"]
 * @status stable
 */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Calendar,
  CreditCard,
  PieChart,
  BarChart3
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface RevenueMetrics {
  mrr: number
  arr: number
  growth_rate: number
  churn_rate: number
  ltv: number
  cac: number
  total_customers: number
  active_subscriptions: number
}

interface TierMetrics {
  tier: string
  display_name: string
  price_monthly: number
  subscribers: number
  revenue: number
  growth_rate: number
  churn_rate: number
  conversion_rate: number
}

interface ConversionMetrics {
  from_tier: string
  to_tier: string
  conversions: number
  conversion_rate: number
  revenue_impact: number
  month: string
}

interface RevenueTimeSeries {
  date: string
  mrr: number
  new_revenue: number
  churned_revenue: number
  expansion_revenue: number
  contraction_revenue: number
  net_revenue: number
}

interface CustomerSegment {
  segment: string
  count: number
  revenue: number
  avg_ltv: number
  churn_rate: number
}

const TIER_COLORS = {
  free: '#6B7280',
  renter: '#3B82F6',
  essential: '#10B981',
  plus: '#8B5CF6',
  pro: '#F59E0B'
}

export function RevenueAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null)
  const [tierMetrics, setTierMetrics] = useState<TierMetrics[]>([])
  const [conversions, setConversions] = useState<ConversionMetrics[]>([])
  const [timeSeries, setTimeSeries] = useState<RevenueTimeSeries[]>([])
  const [segments, setSegments] = useState<CustomerSegment[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    loadRevenueData()
  }, [timeRange])

  const loadRevenueData = async () => {
    try {
      setLoading(true)

      // Load all revenue data in parallel
      const [
        metricsData,
        tiersData,
        conversionsData,
        timeSeriesData,
        segmentsData
      ] = await Promise.all([
        supabase.rpc('get_revenue_metrics'),
        supabase.rpc('get_tier_metrics'),
        supabase.rpc('get_conversion_metrics', { days: parseInt(timeRange) }),
        supabase.rpc('get_revenue_time_series', { days: parseInt(timeRange) }),
        supabase.rpc('get_customer_segments')
      ])

      if (metricsData.error) throw metricsData.error
      if (tiersData.error) throw tiersData.error
      if (conversionsData.error) throw conversionsData.error
      if (timeSeriesData.error) throw timeSeriesData.error
      if (segmentsData.error) throw segmentsData.error

      setMetrics(metricsData.data?.[0] || null)
      setTierMetrics(tiersData.data || [])
      setConversions(conversionsData.data || [])
      setTimeSeries(timeSeriesData.data || [])
      setSegments(segmentsData.data || [])

      setError(null)
    } catch (err) {
      console.error('Error loading revenue data:', err)
      setError('Failed to load revenue data')

      // Mock data for development
      setMetrics({
        mrr: 12450.00,
        arr: 149400.00,
        growth_rate: 23.5,
        churn_rate: 5.2,
        ltv: 2840.00,
        cac: 185.00,
        total_customers: 1247,
        active_subscriptions: 891
      })

      setTierMetrics([
        { tier: 'free', display_name: 'Free', price_monthly: 0, subscribers: 2341, revenue: 0, growth_rate: 15.2, churn_rate: 45.0, conversion_rate: 12.3 },
        { tier: 'essential', display_name: 'Essential', price_monthly: 29, subscribers: 567, revenue: 16443, growth_rate: 28.4, churn_rate: 8.5, conversion_rate: 0 },
        { tier: 'plus', display_name: 'Plus', price_monthly: 49, subscribers: 234, revenue: 11466, growth_rate: 18.7, churn_rate: 6.2, conversion_rate: 15.8 },
        { tier: 'pro', display_name: 'Pro', price_monthly: 199, subscribers: 90, revenue: 17910, growth_rate: 45.2, churn_rate: 3.1, conversion_rate: 22.1 }
      ])

      setConversions([
        { from_tier: 'free', to_tier: 'essential', conversions: 142, conversion_rate: 6.1, revenue_impact: 4118, month: '2025-01' },
        { from_tier: 'essential', to_tier: 'plus', conversions: 37, conversion_rate: 6.5, revenue_impact: 740, month: '2025-01' },
        { from_tier: 'plus', to_tier: 'pro', conversions: 12, conversion_rate: 5.1, revenue_impact: 1800, month: '2025-01' }
      ])

      // Generate mock time series data
      const mockTimeSeries = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          mrr: 12000 + (i * 15) + Math.random() * 500,
          new_revenue: 200 + Math.random() * 300,
          churned_revenue: -(50 + Math.random() * 100),
          expansion_revenue: 100 + Math.random() * 200,
          contraction_revenue: -(20 + Math.random() * 50),
          net_revenue: 230 + Math.random() * 150
        }
      })
      setTimeSeries(mockTimeSeries)

      setSegments([
        { segment: 'Individual Homeowners', count: 642, revenue: 18618, avg_ltv: 2890, churn_rate: 7.8 },
        { segment: 'Small Landlords (2-5 properties)', count: 189, revenue: 15113, avg_ltv: 4200, churn_rate: 4.2 },
        { segment: 'Property Managers', count: 34, revenue: 6766, avg_ltv: 8900, churn_rate: 2.1 },
        { segment: 'Insurance Professionals', count: 26, revenue: 5173, avg_ltv: 12400, churn_rate: 1.8 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading revenue data...</p>
        </div>
      </div>
    )
  }

  const tierPieData = tierMetrics
    .filter(t => t.revenue > 0)
    .map(tier => ({
      name: tier.display_name,
      value: tier.revenue,
      count: tier.subscribers,
      color: TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] || '#6B7280'
    }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Revenue Analytics</h1>
          <p className="text-gray-400 mt-1">Subscription metrics and financial performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadRevenueData} className="border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Card className="bg-red-900/20 border-red-900">
          <CardContent className="p-4">
            <p className="text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Monthly Recurring Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics?.mrr || 0)}</div>
            <div className="flex items-center text-xs mt-1">
              {metrics && metrics.growth_rate >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={metrics && metrics.growth_rate >= 0 ? 'text-green-500' : 'text-red-500'}>
                {formatPercent(metrics?.growth_rate || 0)}
              </span>
              <span className="text-gray-500 ml-1">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Annual Recurring Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics?.arr || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.active_subscriptions || 0} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Customer Lifetime Value</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics?.ltv || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">
              CAC: {formatCurrency(metrics?.cac || 0)} | Ratio: {metrics ? (metrics.ltv / metrics.cac).toFixed(1) : '0'}x
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Churn Rate</CardTitle>
            <Users className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{metrics?.churn_rate?.toFixed(1) || '0.0'}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {metrics?.total_customers || 0} total customers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR Trend */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">MRR Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={timeSeries}>
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
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  stroke="#3B82F6"
                  fill="url(#mrrGradient)"
                  strokeWidth={2}
                />
                <Bar dataKey="new_revenue" fill="#10B981" />
                <Bar dataKey="churned_revenue" fill="#EF4444" />
                <defs>
                  <linearGradient id="mrrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Tier */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={tierPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {tierPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                  formatter={(value: number, name, props) => [
                    `${formatCurrency(value)} (${props.payload.count} subscribers)`,
                    name
                  ]}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tier Performance Table */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Subscription Tier Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 text-gray-400">Tier</th>
                  <th className="text-right py-2 text-gray-400">Price</th>
                  <th className="text-right py-2 text-gray-400">Subscribers</th>
                  <th className="text-right py-2 text-gray-400">Revenue</th>
                  <th className="text-right py-2 text-gray-400">Growth</th>
                  <th className="text-right py-2 text-gray-400">Churn</th>
                  <th className="text-right py-2 text-gray-400">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {tierMetrics.map((tier) => (
                  <tr key={tier.tier} className="border-b border-gray-700/50">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: TIER_COLORS[tier.tier as keyof typeof TIER_COLORS] }}
                        />
                        <span className="text-gray-300 font-medium">{tier.display_name}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 text-gray-300">
                      {tier.price_monthly > 0 ? formatCurrency(tier.price_monthly) : 'Free'}
                    </td>
                    <td className="text-right py-3 text-gray-300">
                      {tier.subscribers.toLocaleString()}
                    </td>
                    <td className="text-right py-3 text-gray-300">
                      {formatCurrency(tier.revenue)}
                    </td>
                    <td className="text-right py-3">
                      <span className={tier.growth_rate >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatPercent(tier.growth_rate)}
                      </span>
                    </td>
                    <td className="text-right py-3">
                      <span className={tier.churn_rate > 10 ? 'text-red-400' : tier.churn_rate > 5 ? 'text-yellow-400' : 'text-green-400'}>
                        {tier.churn_rate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-right py-3">
                      {tier.conversion_rate > 0 ? (
                        <span className="text-blue-400">{tier.conversion_rate.toFixed(1)}%</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Segments */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {segments.map((segment, idx) => (
              <div key={idx} className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                <h3 className="text-sm font-medium text-gray-300 mb-2">{segment.segment}</h3>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Customers:</span>
                    <span className="text-gray-300">{segment.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Revenue:</span>
                    <span className="text-gray-300">{formatCurrency(segment.revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Avg LTV:</span>
                    <span className="text-gray-300">{formatCurrency(segment.avg_ltv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Churn:</span>
                    <span className={segment.churn_rate > 5 ? 'text-red-400' : 'text-green-400'}>
                      {segment.churn_rate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
