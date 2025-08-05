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

import { Calculator, TrendingUp, Users, Shield, BarChart3, Eye, EyeOff, Filter, Calendar, Info, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamically import privacy analytics to avoid SSR issues
const PrivacyPreservingAnalytics = dynamic(
  () => import('@/components/community/privacy-preserving-analytics').then(mod => ({ default: mod.PrivacyPreservingAnalytics })),
  { ssr: false }
)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { toast } from 'sonner'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'


interface ClaimInsight {
  id: string
  damageType: string
  averageSettlement: number
  medianSettlement: number
  sampleSize: number
  averageTimeToSettle: number
  successRate: number
  trend: 'increasing' | 'decreasing' | 'stable'
}

interface MarketData {
  month: string
  settlements: number
  averageAmount: number
}

const mockInsights: ClaimInsight[] = [
  {
    id: '1',
    damageType: 'Water Damage - Roof Leak',
    averageSettlement: 18500,
    medianSettlement: 15000,
    sampleSize: 234,
    averageTimeToSettle: 45,
    successRate: 78,
    trend: 'increasing'
  },
  {
    id: '2',
    damageType: 'Hurricane Damage - Windows',
    averageSettlement: 12000,
    medianSettlement: 10500,
    sampleSize: 156,
    averageTimeToSettle: 60,
    successRate: 82,
    trend: 'stable'
  },
  {
    id: '3',
    damageType: 'Flood - Interior',
    averageSettlement: 25000,
    medianSettlement: 22000,
    sampleSize: 89,
    averageTimeToSettle: 90,
    successRate: 65,
    trend: 'decreasing'
  }
]

const marketTrendData: MarketData[] = [
  { month: 'Jan', settlements: 145, averageAmount: 16000 },
  { month: 'Feb', settlements: 168, averageAmount: 17500 },
  { month: 'Mar', settlements: 190, averageAmount: 18200 },
  { month: 'Apr', settlements: 175, averageAmount: 17800 },
  { month: 'May', settlements: 210, averageAmount: 19500 },
  { month: 'Jun', settlements: 225, averageAmount: 20000 }
]

const damageTypeDistribution = [
  { name: 'Water Damage', value: 35, color: '#3B82F6' },
  { name: 'Wind/Hurricane', value: 30, color: '#10B981' },
  { name: 'Flood', value: 20, color: '#F59E0B' },
  { name: 'Other', value: 15, color: '#6B7280' }
]

export default function CommunityIntelligencePage() {
  const [selectedDamageType, setSelectedDamageType] = useState<string>('all')
  const [selectedCounty, setSelectedCounty] = useState<string>('all')
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('6months')
  const [privacyMode, setPrivacyMode] = useState(true)
  const [isContributing, setIsContributing] = useState(false)
  const [showRealAnalytics, setShowRealAnalytics] = useState(false)
  const [realInsights, setRealInsights] = useState<ClaimInsight[]>([])

  const contributeData = async () => {
    setIsContributing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsContributing(false)
    toast.success('Thank you for contributing! Your data helps the community while maintaining your privacy.')
  }

  const handleInsightsUpdate = (insights: ClaimInsight[]) => {
    setRealInsights(insights)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/ai-tools" 
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to AI Tools
              </Link>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-violet-600/20 to-blue-600/20 rounded-lg">
                    <Calculator className="h-6 w-6 text-violet-400" />
                  </div>
                  <h1 className="text-3xl font-bold text-white">Community Intelligence System</h1>
                  <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                    Beta
                  </Badge>
                </div>
                <button 
                  onClick={() => setShowRealAnalytics(!showRealAnalytics)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {showRealAnalytics ? 'Show Mock Data' : 'Real Analytics'}
                </button>
              </div>
              <p className="text-gray-400 max-w-3xl">
                I know what others in my situation received! Aggregate insights from Florida claims with privacy-preserving analytics.
              </p>
            </div>

            {/* Privacy Notice */}
            <Alert className="bg-violet-900/20 border-violet-600/30">
              <Shield className="h-4 w-4 text-violet-400" />
              <AlertDescription className="text-violet-200">
                <div className="flex items-center justify-between">
                  <span>
                    All data is anonymized and aggregated. No personal information is ever shared or exposed.
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPrivacyMode(!privacyMode)}
                    className="ml-4"
                  >
                    {privacyMode ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Enhanced Privacy On
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Enhanced Privacy Off
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            {/* Real Analytics Section - Temporarily disabled for deployment */}
            {showRealAnalytics && (
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
                <div className="text-center">
                  <span className="text-gray-400">Privacy-preserving analytics temporarily disabled for deployment.</span>
                </div>
              </div>
            )}

            {/* Mock Data Section (Original) */}
            {!showRealAnalytics && (
              <>
                {/* Filters */}
                <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Filter className="h-5 w-5 text-blue-400" />
                  Filter Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select value={selectedDamageType} onValueChange={setSelectedDamageType}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Damage Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Damage Types</SelectItem>
                      <SelectItem value="water">Water Damage</SelectItem>
                      <SelectItem value="wind">Wind/Hurricane</SelectItem>
                      <SelectItem value="flood">Flood</SelectItem>
                      <SelectItem value="mold">Mold</SelectItem>
                      <SelectItem value="fire">Fire/Smoke</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedCounty} onValueChange={setSelectedCounty}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="County" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Florida Counties</SelectItem>
                      <SelectItem value="miami-dade">Miami-Dade</SelectItem>
                      <SelectItem value="broward">Broward</SelectItem>
                      <SelectItem value="palm-beach">Palm Beach</SelectItem>
                      <SelectItem value="hillsborough">Hillsborough</SelectItem>
                      <SelectItem value="orange">Orange</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Timeframe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1month">Last Month</SelectItem>
                      <SelectItem value="3months">Last 3 Months</SelectItem>
                      <SelectItem value="6months">Last 6 Months</SelectItem>
                      <SelectItem value="1year">Last Year</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Average Settlement</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">
                    {privacyMode ? '$18,500' : formatCurrency(18500)}
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-green-400">+12% vs last period</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">78%</div>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-sm text-gray-400">Claims approved</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Avg. Time to Settle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">45 days</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-blue-400">-5 days improvement</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Data Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">1,234</div>
                  <div className="flex items-center gap-1 mt-2">
                    <Users className="h-4 w-4 text-violet-400" />
                    <span className="text-sm text-violet-400">Community contributors</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Settlement Trends */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Settlement Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={marketTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                        labelStyle={{ color: '#9CA3AF' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="averageAmount"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={{ fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Damage Type Distribution */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Claim Type Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={damageTypeDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {damageTypeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Insights */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Detailed Claim Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockInsights.map((insight) => (
                    <div key={insight.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{insight.damageType}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {insight.sampleSize} claims
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {insight.averageTimeToSettle} days avg
                            </span>
                            <span className="flex items-center gap-1">
                              <BarChart3 className="h-3 w-3" />
                              {insight.successRate}% success
                            </span>
                          </div>
                        </div>
                        <Badge className={
                          insight.trend === 'increasing' ? 'bg-green-600/20 text-green-400' :
                          insight.trend === 'decreasing' ? 'bg-red-600/20 text-red-400' :
                          'bg-gray-600/20 text-gray-400'
                        }>
                          {insight.trend === 'increasing' ? '↑' : insight.trend === 'decreasing' ? '↓' : '→'} {insight.trend}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-400">Average Settlement</p>
                          <p className="text-lg font-semibold text-white">
                            {privacyMode ? '$XX,XXX' : formatCurrency(insight.averageSettlement)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Median Settlement</p>
                          <p className="text-lg font-semibold text-white">
                            {privacyMode ? '$XX,XXX' : formatCurrency(insight.medianSettlement)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Success Rate</p>
                          <div className="flex items-center gap-2">
                            <Progress value={insight.successRate} className="h-2 flex-1" />
                            <span className="text-sm text-white">{insight.successRate}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400">Time to Settle</p>
                          <p className="text-lg font-semibold text-white">{insight.averageTimeToSettle} days</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contribution CTA */}
            <Card className="bg-gradient-to-r from-violet-900/20 to-blue-900/20 border-violet-600/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Help the Community</h3>
                    <p className="text-gray-300">
                      Share your anonymized claim outcome to help others understand fair settlements. Your privacy is always protected.
                    </p>
                  </div>
                  <Button
                    onClick={contributeData}
                    disabled={isContributing}
                    size="lg"
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {isContributing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Contributing...
                      </>
                    ) : (
                      <>
                        <Users className="h-5 w-5 mr-2" />
                        Share My Data
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info Section */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-400" />
                  How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Privacy First</h4>
                    <p className="text-gray-400">
                      All data is anonymized using differential privacy techniques. No personal information, addresses, or identifiable details are ever collected or shared.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Community Powered</h4>
                    <p className="text-gray-400">
                      Insights are generated from real claim outcomes shared by Florida property owners. More data means better insights for everyone.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-200 mb-2">Market Intelligence</h4>
                    <p className="text-gray-400">
                      Understand trends, fair settlements, and success rates specific to your damage type and location. Make informed decisions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
              </>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}