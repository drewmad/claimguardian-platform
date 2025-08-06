/**
 * @fileMetadata
 * @owner admin-team
 * @purpose "Claims Intelligence Dashboard for fraud detection, settlement analysis, and processing efficiency"
 * @dependencies ["@/components", "@/lib", "recharts", "lucide-react"]
 * @status stable
 */
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Shield, 
  AlertTriangle, 
  Clock, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  MapPin,
  Calendar,
  RefreshCw,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface ClaimsOverview {
  total_claims: number
  pending_claims: number
  approved_claims: number
  denied_claims: number
  avg_processing_time: number
  total_payout: number
  avg_payout: number
  fraud_detected: number
}

interface FraudIndicator {
  claim_id: string
  user_email: string
  claim_type: string
  amount_requested: number
  fraud_score: number
  risk_factors: string[]
  submitted_date: string
  status: string
  location: string
  similar_claims: number
}

interface SettlementAnalysis {
  damage_type: string
  avg_claim_amount: number
  avg_settlement: number
  settlement_ratio: number
  processing_days: number
  approval_rate: number
  total_claims: number
}

interface ProcessingMetrics {
  stage: string
  avg_duration_hours: number
  bottleneck_score: number
  completion_rate: number
  volume: number
}

interface GeographicData {
  county: string
  state: string
  claim_count: number
  avg_amount: number
  fraud_rate: number
  approval_rate: number
  avg_processing_time: number
}

interface TimeSeriesData {
  date: string
  claims_submitted: number
  claims_approved: number
  claims_denied: number
  fraud_detected: number
  total_payout: number
}

interface CarrierPerformance {
  carrier_name: string
  total_policies: number
  claims_count: number
  avg_payout: number
  approval_rate: number
  avg_processing_time: number
  customer_satisfaction: number
}

const FRAUD_COLORS = {
  low: '#10B981',
  medium: '#F59E0B', 
  high: '#EF4444',
  critical: '#DC2626'
}

const STATUS_COLORS = {
  draft: '#6B7280',
  submitted: '#3B82F6',
  investigating: '#F59E0B',
  approved: '#10B981',
  denied: '#EF4444',
  settled: '#8B5CF6'
}

export function ClaimsIntelligenceDashboard() {
  const [overview, setOverview] = useState<ClaimsOverview | null>(null)
  const [fraudIndicators, setFraudIndicators] = useState<FraudIndicator[]>([])
  const [settlements, setSettlements] = useState<SettlementAnalysis[]>([])
  const [processing, setProcessing] = useState<ProcessingMetrics[]>([])
  const [geographic, setGeographic] = useState<GeographicData[]>([])
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([])
  const [carriers, setCarriers] = useState<CarrierPerformance[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30')
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    loadClaimsData()
  }, [timeRange])

  const loadClaimsData = async () => {
    try {
      setLoading(true)
      
      // Load all claims intelligence data in parallel
      const [
        overviewData,
        fraudData,
        settlementsData,
        processingData,
        geographicData,
        timeSeriesData,
        carriersData
      ] = await Promise.all([
        supabase.rpc('get_claims_overview', { days: parseInt(timeRange) }),
        supabase.rpc('get_fraud_indicators', { min_score: 60 }),
        supabase.rpc('get_settlement_analysis', { days: parseInt(timeRange) }),
        supabase.rpc('get_processing_metrics'),
        supabase.rpc('get_geographic_claims_data', { days: parseInt(timeRange) }),
        supabase.rpc('get_claims_time_series', { days: parseInt(timeRange) }),
        supabase.rpc('get_carrier_performance', { days: parseInt(timeRange) })
      ])

      if (overviewData.error) throw overviewData.error
      if (fraudData.error) throw fraudData.error
      if (settlementsData.error) throw settlementsData.error
      if (processingData.error) throw processingData.error
      if (geographicData.error) throw geographicData.error
      if (timeSeriesData.error) throw timeSeriesData.error
      if (carriersData.error) throw carriersData.error

      setOverview(overviewData.data?.[0] || null)
      setFraudIndicators(fraudData.data || [])
      setSettlements(settlementsData.data || [])
      setProcessing(processingData.data || [])
      setGeographic(geographicData.data || [])
      setTimeSeries(timeSeriesData.data || [])
      setCarriers(carriersData.data || [])
      
      setError(null)
    } catch (err) {
      console.error('Error loading claims data:', err)
      setError('Failed to load claims intelligence data')
      
      // Mock data for development
      setOverview({
        total_claims: 1247,
        pending_claims: 234,
        approved_claims: 892,
        denied_claims: 89,
        avg_processing_time: 14.5,
        total_payout: 2847500,
        avg_payout: 3190,
        fraud_detected: 32
      })

      const mockFraud: FraudIndicator[] = [
        {
          claim_id: 'CG-2024-001234',
          user_email: 'suspicious@example.com',
          claim_type: 'Water Damage',
          amount_requested: 25000,
          fraud_score: 85,
          risk_factors: ['Multiple similar claims', 'Recent policy change', 'Incomplete documentation'],
          submitted_date: '2024-12-20',
          status: 'investigating',
          location: 'Miami-Dade, FL',
          similar_claims: 3
        },
        {
          claim_id: 'CG-2024-001235',
          user_email: 'risky@example.com',
          claim_type: 'Hurricane Damage',
          amount_requested: 45000,
          fraud_score: 72,
          risk_factors: ['Unusual damage pattern', 'Late reporting'],
          submitted_date: '2024-12-18',
          status: 'investigating',
          location: 'Broward, FL',
          similar_claims: 1
        }
      ]
      setFraudIndicators(mockFraud)

      const mockSettlements: SettlementAnalysis[] = [
        { damage_type: 'Hurricane', avg_claim_amount: 15750, avg_settlement: 12800, settlement_ratio: 0.81, processing_days: 18.5, approval_rate: 87.5, total_claims: 234 },
        { damage_type: 'Water Damage', avg_claim_amount: 8900, avg_settlement: 7200, settlement_ratio: 0.81, processing_days: 12.3, approval_rate: 82.1, total_claims: 456 },
        { damage_type: 'Fire Damage', avg_claim_amount: 22400, avg_settlement: 19800, settlement_ratio: 0.88, processing_days: 21.2, approval_rate: 91.2, total_claims: 89 },
        { damage_type: 'Theft', avg_claim_amount: 3400, avg_settlement: 2900, settlement_ratio: 0.85, processing_days: 8.7, approval_rate: 78.9, total_claims: 167 },
        { damage_type: 'Vandalism', avg_claim_amount: 2100, avg_settlement: 1800, settlement_ratio: 0.86, processing_days: 6.5, approval_rate: 84.3, total_claims: 123 }
      ]
      setSettlements(mockSettlements)

      const mockProcessing: ProcessingMetrics[] = [
        { stage: 'Initial Review', avg_duration_hours: 4.2, bottleneck_score: 25, completion_rate: 98.5, volume: 1247 },
        { stage: 'Documentation Gathering', avg_duration_hours: 72.5, bottleneck_score: 85, completion_rate: 89.2, volume: 1156 },
        { stage: 'Adjuster Assignment', avg_duration_hours: 12.8, bottleneck_score: 45, completion_rate: 95.8, volume: 1031 },
        { stage: 'Property Inspection', avg_duration_hours: 96.3, bottleneck_score: 92, completion_rate: 87.3, volume: 987 },
        { stage: 'Settlement Calculation', avg_duration_hours: 24.7, bottleneck_score: 38, completion_rate: 94.1, volume: 862 },
        { stage: 'Final Approval', avg_duration_hours: 18.5, bottleneck_score: 22, completion_rate: 96.8, volume: 811 }
      ]
      setProcessing(mockProcessing)

      const mockGeographic: GeographicData[] = [
        { county: 'Miami-Dade', state: 'FL', claim_count: 234, avg_amount: 12500, fraud_rate: 4.3, approval_rate: 85.2, avg_processing_time: 16.8 },
        { county: 'Broward', state: 'FL', claim_count: 189, avg_amount: 11200, fraud_rate: 3.7, approval_rate: 87.8, avg_processing_time: 14.2 },
        { county: 'Palm Beach', state: 'FL', claim_count: 156, avg_amount: 13800, fraud_rate: 2.9, approval_rate: 89.1, avg_processing_time: 13.5 },
        { county: 'Orange', state: 'FL', claim_count: 123, avg_amount: 9800, fraud_rate: 3.2, approval_rate: 86.4, avg_processing_time: 15.1 },
        { county: 'Hillsborough', state: 'FL', claim_count: 98, avg_amount: 10500, fraud_rate: 2.1, approval_rate: 91.2, avg_processing_time: 12.7 }
      ]
      setGeographic(mockGeographic)

      // Generate mock time series data
      const mockTimeSeries = Array.from({ length: 30 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        return {
          date: date.toISOString().split('T')[0],
          claims_submitted: 15 + Math.floor(Math.random() * 25),
          claims_approved: 10 + Math.floor(Math.random() * 15),
          claims_denied: Math.floor(Math.random() * 5),
          fraud_detected: Math.floor(Math.random() * 3),
          total_payout: 25000 + Math.floor(Math.random() * 50000)
        }
      })
      setTimeSeries(mockTimeSeries)

      const mockCarriers: CarrierPerformance[] = [
        { carrier_name: 'State Farm', total_policies: 345, claims_count: 234, avg_payout: 8900, approval_rate: 87.5, avg_processing_time: 14.2, customer_satisfaction: 4.2 },
        { carrier_name: 'Allstate', total_policies: 298, claims_count: 189, avg_payout: 9200, approval_rate: 84.1, avg_processing_time: 16.8, customer_satisfaction: 3.9 },
        { carrier_name: 'GEICO', total_policies: 267, claims_count: 156, avg_payout: 7800, approval_rate: 89.3, avg_processing_time: 12.5, customer_satisfaction: 4.1 },
        { carrier_name: 'Progressive', total_policies: 234, claims_count: 134, avg_payout: 8500, approval_rate: 86.7, avg_processing_time: 15.3, customer_satisfaction: 4.0 },
        { carrier_name: 'TypTap', total_policies: 189, claims_count: 98, avg_payout: 11200, approval_rate: 82.4, avg_processing_time: 18.7, customer_satisfaction: 3.7 }
      ]
      setCarriers(mockCarriers)
    } finally {
      setLoading(false)
    }
  }

  const getFraudLevel = (score: number) => {
    if (score >= 80) return 'critical'
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  const getFraudColor = (score: number) => {
    return FRAUD_COLORS[getFraudLevel(score)]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading claims intelligence data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Claims Intelligence Dashboard</h1>
          <p className="text-gray-400 mt-1">Fraud detection, settlement analysis, and processing insights</p>
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
          <Button variant="outline" onClick={loadClaimsData} className="border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-900/20 border-red-900">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Fraud Alerts */}
      {fraudIndicators.filter(f => f.fraud_score >= 80).length > 0 && (
        <Alert className="bg-red-900/20 border-red-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{fraudIndicators.filter(f => f.fraud_score >= 80).length} high-risk fraud cases detected</strong> requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.total_claims.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview?.pending_claims || 0} pending • {overview?.approved_claims || 0} approved
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(overview?.total_payout || 0)}</div>
            <p className="text-xs text-gray-500 mt-1">
              Avg: {formatCurrency(overview?.avg_payout || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.avg_processing_time?.toFixed(1) || '0'} days</div>
            <p className="text-xs text-gray-500 mt-1">
              Industry avg: 21 days
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Fraud Detection</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.fraud_detected || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview ? ((overview.fraud_detected / overview.total_claims) * 100).toFixed(1) : '0'}% fraud rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="fraud" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="settlements">Settlement Analysis</TabsTrigger>
          <TabsTrigger value="processing">Processing Efficiency</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Insights</TabsTrigger>
          <TabsTrigger value="carriers">Insurance Carriers</TabsTrigger>
        </TabsList>

        <TabsContent value="fraud" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Fraud Time Series */}
            <Card className="lg:col-span-2 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fraud Detection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={timeSeries}>
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
                    <Legend />
                    <Bar dataKey="claims_submitted" fill="#3B82F6" name="Claims Submitted" />
                    <Line 
                      type="monotone" 
                      dataKey="fraud_detected" 
                      stroke="#EF4444" 
                      strokeWidth={3}
                      name="Fraud Detected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fraud Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Fraud Risk Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['critical', 'high', 'medium', 'low'].map(level => {
                    const count = fraudIndicators.filter(f => getFraudLevel(f.fraud_score) === level).length
                    const percentage = fraudIndicators.length > 0 ? (count / fraudIndicators.length) * 100 : 0
                    
                    return (
                      <div key={level} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300 capitalize">{level} Risk</span>
                          <span className="text-gray-300">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${percentage}%`, 
                              backgroundColor: FRAUD_COLORS[level as keyof typeof FRAUD_COLORS] 
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Fraud Cases Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">High-Risk Fraud Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Claim ID</th>
                      <th className="text-left py-2 text-gray-400">User</th>
                      <th className="text-left py-2 text-gray-400">Type</th>
                      <th className="text-right py-2 text-gray-400">Amount</th>
                      <th className="text-center py-2 text-gray-400">Risk Score</th>
                      <th className="text-left py-2 text-gray-400">Risk Factors</th>
                      <th className="text-center py-2 text-gray-400">Status</th>
                      <th className="text-center py-2 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fraudIndicators.map((fraud, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300 font-mono text-xs">{fraud.claim_id}</td>
                        <td className="py-3 text-gray-300">{fraud.user_email}</td>
                        <td className="py-3 text-gray-300">{fraud.claim_type}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(fraud.amount_requested)}</td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getFraudColor(fraud.fraud_score) }}
                            />
                            <span className="text-gray-300">{fraud.fraud_score}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {fraud.risk_factors.slice(0, 2).map((factor, fidx) => (
                              <Badge key={fidx} variant="outline" className="text-xs text-gray-400 border-gray-600">
                                {factor}
                              </Badge>
                            ))}
                            {fraud.risk_factors.length > 2 && (
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                +{fraud.risk_factors.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <Badge 
                            variant="outline"
                            style={{ 
                              borderColor: STATUS_COLORS[fraud.status as keyof typeof STATUS_COLORS],
                              color: STATUS_COLORS[fraud.status as keyof typeof STATUS_COLORS]
                            }}
                          >
                            {fraud.status}
                          </Badge>
                        </td>
                        <td className="text-center py-3">
                          <div className="flex justify-center space-x-1">
                            <Button size="sm" variant="outline" className="text-xs">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs text-red-400 border-red-400">
                              Flag
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Settlement Analysis by Damage Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Damage Type</th>
                      <th className="text-right py-2 text-gray-400">Claims</th>
                      <th className="text-right py-2 text-gray-400">Avg Claim</th>
                      <th className="text-right py-2 text-gray-400">Avg Settlement</th>
                      <th className="text-right py-2 text-gray-400">Settlement Ratio</th>
                      <th className="text-right py-2 text-gray-400">Processing Days</th>
                      <th className="text-right py-2 text-gray-400">Approval Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.map((settlement, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300 font-medium">{settlement.damage_type}</td>
                        <td className="text-right py-3 text-gray-300">{settlement.total_claims}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(settlement.avg_claim_amount)}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(settlement.avg_settlement)}</td>
                        <td className="text-right py-3">
                          <span className={settlement.settlement_ratio > 0.85 ? 'text-green-400' : settlement.settlement_ratio > 0.75 ? 'text-yellow-400' : 'text-red-400'}>
                            {(settlement.settlement_ratio * 100).toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 text-gray-300">{settlement.processing_days.toFixed(1)}</td>
                        <td className="text-right py-3">
                          <span className={settlement.approval_rate > 85 ? 'text-green-400' : settlement.approval_rate > 75 ? 'text-yellow-400' : 'text-red-400'}>
                            {settlement.approval_rate.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processing" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Processing Pipeline Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {processing.map((stage, idx) => (
                  <div key={idx} className="p-4 rounded-lg border border-gray-700 bg-gray-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-gray-300 font-medium">{stage.stage}</h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-400">
                          {(stage.avg_duration_hours / 24).toFixed(1)} days avg
                        </span>
                        <Badge 
                          variant="outline"
                          className={stage.bottleneck_score > 70 ? 'border-red-500 text-red-500' : stage.bottleneck_score > 40 ? 'border-yellow-500 text-yellow-500' : 'border-green-500 text-green-500'}
                        >
                          Bottleneck: {stage.bottleneck_score}%
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{stage.volume.toLocaleString()} claims</span>
                      <span>{stage.completion_rate.toFixed(1)}% completion rate</span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stage.completion_rate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Geographic Claims Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">County</th>
                      <th className="text-right py-2 text-gray-400">Claims</th>
                      <th className="text-right py-2 text-gray-400">Avg Amount</th>
                      <th className="text-right py-2 text-gray-400">Fraud Rate</th>
                      <th className="text-right py-2 text-gray-400">Approval Rate</th>
                      <th className="text-right py-2 text-gray-400">Avg Processing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geographic.map((geo, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300 font-medium">{geo.county}, {geo.state}</td>
                        <td className="text-right py-3 text-gray-300">{geo.claim_count}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(geo.avg_amount)}</td>
                        <td className="text-right py-3">
                          <span className={geo.fraud_rate > 4 ? 'text-red-400' : geo.fraud_rate > 2 ? 'text-yellow-400' : 'text-green-400'}>
                            {geo.fraud_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3">
                          <span className={geo.approval_rate > 85 ? 'text-green-400' : geo.approval_rate > 75 ? 'text-yellow-400' : 'text-red-400'}>
                            {geo.approval_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 text-gray-300">{geo.avg_processing_time.toFixed(1)} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="carriers" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Insurance Carrier Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Carrier</th>
                      <th className="text-right py-2 text-gray-400">Policies</th>
                      <th className="text-right py-2 text-gray-400">Claims</th>
                      <th className="text-right py-2 text-gray-400">Avg Payout</th>
                      <th className="text-right py-2 text-gray-400">Approval Rate</th>
                      <th className="text-right py-2 text-gray-400">Processing Time</th>
                      <th className="text-right py-2 text-gray-400">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {carriers.map((carrier, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300 font-medium">{carrier.carrier_name}</td>
                        <td className="text-right py-3 text-gray-300">{carrier.total_policies}</td>
                        <td className="text-right py-3 text-gray-300">{carrier.claims_count}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(carrier.avg_payout)}</td>
                        <td className="text-right py-3">
                          <span className={carrier.approval_rate > 85 ? 'text-green-400' : carrier.approval_rate > 75 ? 'text-yellow-400' : 'text-red-400'}>
                            {carrier.approval_rate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 text-gray-300">{carrier.avg_processing_time.toFixed(1)} days</td>
                        <td className="text-right py-3">
                          <div className="flex items-center justify-end space-x-1">
                            <span className={carrier.customer_satisfaction > 4.0 ? 'text-green-400' : carrier.customer_satisfaction > 3.5 ? 'text-yellow-400' : 'text-red-400'}>
                              {carrier.customer_satisfaction.toFixed(1)}
                            </span>
                            <span className="text-gray-500">⭐</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}