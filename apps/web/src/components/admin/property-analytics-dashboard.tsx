/**
 * @fileMetadata
 * @owner admin-team
 * @purpose "Property Analytics Dashboard with geographic insights and risk assessment using Florida parcel data"
 * @dependencies ["@/components", "@/lib", "recharts", "lucide-react", "mapbox-gl"]
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
  Home, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  AlertTriangle,
  Shield,
  Wind,
  Droplets,
  Flame,
  Eye,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart,
  Activity
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
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ComposedChart
} from 'recharts'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface PropertyOverview {
  total_properties: number
  avg_property_value: number
  total_insured_value: number
  avg_insurance_premium: number
  properties_at_risk: number
  hurricane_zone_properties: number
  flood_zone_properties: number
  underinsured_properties: number
}

interface PropertyTrend {
  month: string
  properties_added: number
  avg_value: number
  total_value: number
  insurance_coverage: number
}

interface RiskAssessment {
  property_id: string
  address: string
  county: string
  risk_score: number
  risk_factors: string[]
  property_value: number
  insurance_coverage: number
  coverage_gap: number
  last_claim: string | null
  hurricane_zone: string
  flood_zone: string
}

interface GeographicDistribution {
  county: string
  property_count: number
  avg_value: number
  total_value: number
  avg_insurance: number
  risk_score: number
  hurricane_properties: number
  flood_properties: number
}

interface PropertyType {
  type: string
  count: number
  avg_value: number
  avg_insurance: number
  risk_level: string
}

interface MarketAnalysis {
  county: string
  year: number
  avg_sale_price: number
  price_change_pct: number
  inventory_months: number
  market_trend: string
}

interface InsuranceGap {
  property_id: string
  address: string
  county: string
  property_value: number
  insurance_coverage: number
  gap_amount: number
  gap_percentage: number
  recommended_coverage: number
  annual_premium_impact: number
}

const RISK_COLORS = {
  low: '#10B981',
  medium: '#F59E0B',
  high: '#EF4444',
  critical: '#DC2626'
}

const PROPERTY_TYPE_COLORS = {
  'Single Family': '#3B82F6',
  'Townhome': '#10B981',
  'Condo': '#F59E0B', 
  'Mobile Home': '#EF4444',
  'Multi-Family': '#8B5CF6',
  'Commercial': '#06B6D4'
}

const HURRICANE_ZONE_COLORS = {
  'A': '#DC2626', // Highest risk
  'AE': '#EF4444', 
  'AH': '#F59E0B',
  'AO': '#FCD34D',
  'X': '#10B981', // Moderate/Low risk
  'Unknown': '#6B7280'
}

export function PropertyAnalyticsDashboard() {
  const [overview, setOverview] = useState<PropertyOverview | null>(null)
  const [trends, setTrends] = useState<PropertyTrend[]>([])
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([])
  const [geographic, setGeographic] = useState<GeographicDistribution[]>([])
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([])
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysis[]>([])
  const [insuranceGaps, setInsuranceGaps] = useState<InsuranceGap[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('365')
  const [selectedCounty, setSelectedCounty] = useState('all')
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    loadPropertyData()
  }, [timeRange, selectedCounty])

  const loadPropertyData = async () => {
    try {
      setLoading(true)
      
      // Load all property analytics data in parallel
      const [
        overviewData,
        trendsData,
        riskData,
        geographicData,
        typesData,
        marketData,
        gapsData
      ] = await Promise.all([
        supabase.rpc('get_property_overview', { 
          days: parseInt(timeRange),
          county_filter: selectedCounty === 'all' ? null : selectedCounty
        }),
        supabase.rpc('get_property_trends', { 
          days: parseInt(timeRange),
          county_filter: selectedCounty === 'all' ? null : selectedCounty
        }),
        supabase.rpc('get_property_risk_assessment', {
          min_risk_score: 70,
          county_filter: selectedCounty === 'all' ? null : selectedCounty
        }),
        supabase.rpc('get_geographic_distribution', {
          county_filter: selectedCounty === 'all' ? null : selectedCounty
        }),
        supabase.rpc('get_property_types_analysis'),
        supabase.rpc('get_market_analysis', { 
          county_filter: selectedCounty === 'all' ? null : selectedCounty
        }),
        supabase.rpc('get_insurance_gaps', {
          min_gap_percentage: 10,
          county_filter: selectedCounty === 'all' ? null : selectedCounty
        })
      ])

      if (overviewData.error) throw overviewData.error
      if (trendsData.error) throw trendsData.error
      if (riskData.error) throw riskData.error
      if (geographicData.error) throw geographicData.error
      if (typesData.error) throw typesData.error
      if (marketData.error) throw marketData.error
      if (gapsData.error) throw gapsData.error

      setOverview(overviewData.data?.[0] || null)
      setTrends(trendsData.data || [])
      setRiskAssessments(riskData.data || [])
      setGeographic(geographicData.data || [])
      setPropertyTypes(typesData.data || [])
      setMarketAnalysis(marketData.data || [])
      setInsuranceGaps(gapsData.data || [])
      
      setError(null)
    } catch (err) {
      console.error('Error loading property data:', err)
      setError('Failed to load property analytics data')
      
      // Mock data for development using real Florida property scenarios
      setOverview({
        total_properties: 4567,
        avg_property_value: 285000,
        total_insured_value: 1150000000,
        avg_insurance_premium: 1850,
        properties_at_risk: 342,
        hurricane_zone_properties: 1234,
        flood_zone_properties: 890,
        underinsured_properties: 156
      })

      // Generate mock trends data
      const mockTrends = Array.from({ length: 12 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (11 - i))
        return {
          month: date.toISOString().slice(0, 7),
          properties_added: 25 + Math.floor(Math.random() * 50),
          avg_value: 280000 + (i * 2000) + Math.floor(Math.random() * 20000),
          total_value: (25 + Math.floor(Math.random() * 50)) * (280000 + (i * 2000)),
          insurance_coverage: 0.82 + (Math.random() * 0.15)
        }
      })
      setTrends(mockTrends)

      const mockRiskAssessments: RiskAssessment[] = [
        {
          property_id: 'PROP-2024-001',
          address: '123 Ocean Drive, Miami Beach, FL 33139',
          county: 'Miami-Dade',
          risk_score: 85,
          risk_factors: ['Hurricane Zone A', 'Coastal flood risk', 'Historic claims'],
          property_value: 750000,
          insurance_coverage: 400000,
          coverage_gap: 350000,
          last_claim: '2023-09-15',
          hurricane_zone: 'A',
          flood_zone: 'AE'
        },
        {
          property_id: 'PROP-2024-002', 
          address: '456 Bayshore Blvd, Tampa, FL 33606',
          county: 'Hillsborough',
          risk_score: 78,
          risk_factors: ['Hurricane Zone AE', 'Age of construction', 'Proximity to water'],
          property_value: 425000,
          insurance_coverage: 300000,
          coverage_gap: 125000,
          last_claim: null,
          hurricane_zone: 'AE',
          flood_zone: 'AH'
        },
        {
          property_id: 'PROP-2024-003',
          address: '789 Gulf Coast Dr, Naples, FL 34102',
          county: 'Collier',
          risk_score: 91,
          risk_factors: ['Critical hurricane zone', 'Storm surge risk', 'Multiple recent claims'],
          property_value: 1200000,
          insurance_coverage: 600000,
          coverage_gap: 600000,
          last_claim: '2024-10-09',
          hurricane_zone: 'A',
          flood_zone: 'AE'
        }
      ]
      setRiskAssessments(mockRiskAssessments)

      const mockGeographic: GeographicDistribution[] = [
        { county: 'Miami-Dade', property_count: 1234, avg_value: 425000, total_value: 524550000, avg_insurance: 2150, risk_score: 75, hurricane_properties: 892, flood_properties: 567 },
        { county: 'Broward', property_count: 987, avg_value: 385000, total_value: 379995000, avg_insurance: 1950, risk_score: 72, hurricane_properties: 654, flood_properties: 432 },
        { county: 'Palm Beach', property_count: 756, avg_value: 515000, total_value: 389340000, avg_insurance: 2350, risk_score: 68, hurricane_properties: 423, flood_properties: 289 },
        { county: 'Orange', property_count: 543, avg_value: 275000, total_value: 149325000, avg_insurance: 1450, risk_score: 45, hurricane_properties: 123, flood_properties: 87 },
        { county: 'Hillsborough', property_count: 432, avg_value: 315000, total_value: 136080000, avg_insurance: 1650, risk_score: 58, hurricane_properties: 234, flood_properties: 156 },
        { county: 'Lee', property_count: 389, avg_value: 395000, total_value: 153755000, avg_insurance: 1850, risk_score: 82, hurricane_properties: 345, flood_properties: 267 },
        { county: 'Collier', property_count: 226, avg_value: 685000, total_value: 154810000, avg_insurance: 2750, risk_score: 79, hurricane_properties: 198, flood_properties: 134 }
      ]
      setGeographic(mockGeographic)

      const mockPropertyTypes: PropertyType[] = [
        { type: 'Single Family', count: 2345, avg_value: 315000, avg_insurance: 1750, risk_level: 'medium' },
        { type: 'Townhome', count: 876, avg_value: 275000, avg_insurance: 1450, risk_level: 'low' },
        { type: 'Condo', count: 654, avg_value: 425000, avg_insurance: 2150, risk_level: 'medium' },
        { type: 'Mobile Home', count: 234, avg_value: 85000, avg_insurance: 950, risk_level: 'high' },
        { type: 'Multi-Family', count: 189, avg_value: 685000, avg_insurance: 2850, risk_level: 'medium' },
        { type: 'Commercial', count: 123, avg_value: 1250000, avg_insurance: 4500, risk_level: 'high' }
      ]
      setPropertyTypes(mockPropertyTypes)

      const mockMarketAnalysis: MarketAnalysis[] = [
        { county: 'Miami-Dade', year: 2024, avg_sale_price: 425000, price_change_pct: 8.5, inventory_months: 3.2, market_trend: 'appreciating' },
        { county: 'Broward', year: 2024, avg_sale_price: 385000, price_change_pct: 6.2, inventory_months: 3.8, market_trend: 'stable' },
        { county: 'Palm Beach', year: 2024, avg_sale_price: 515000, price_change_pct: 12.1, inventory_months: 2.9, market_trend: 'appreciating' },
        { county: 'Orange', year: 2024, avg_sale_price: 275000, price_change_pct: 4.3, inventory_months: 4.5, market_trend: 'stable' },
        { county: 'Lee', year: 2024, avg_sale_price: 395000, price_change_pct: -2.1, inventory_months: 5.2, market_trend: 'declining' }
      ]
      setMarketAnalysis(mockMarketAnalysis)

      const mockInsuranceGaps: InsuranceGap[] = [
        {
          property_id: 'PROP-2024-001',
          address: '123 Ocean Drive, Miami Beach, FL 33139',
          county: 'Miami-Dade',
          property_value: 750000,
          insurance_coverage: 400000,
          gap_amount: 350000,
          gap_percentage: 46.7,
          recommended_coverage: 675000,
          annual_premium_impact: 425
        },
        {
          property_id: 'PROP-2024-002',
          address: '456 Bayshore Blvd, Tampa, FL 33606', 
          county: 'Hillsborough',
          property_value: 425000,
          insurance_coverage: 300000,
          gap_amount: 125000,
          gap_percentage: 29.4,
          recommended_coverage: 382500,
          annual_premium_impact: 195
        }
      ]
      setInsuranceGaps(mockInsuranceGaps)
    } finally {
      setLoading(false)
    }
  }

  const getRiskLevel = (score: number) => {
    if (score >= 80) return 'critical'
    if (score >= 70) return 'high'
    if (score >= 50) return 'medium'
    return 'low'
  }

  const getRiskColor = (score: number) => {
    return RISK_COLORS[getRiskLevel(score)]
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getMarketTrendIcon = (trend: string) => {
    switch (trend) {
      case 'appreciating': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-gray-500" />
    }
  }

  const getMarketTrendColor = (trend: string) => {
    switch (trend) {
      case 'appreciating': return 'text-green-400'
      case 'declining': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading property analytics data...</p>
        </div>
      </div>
    )
  }

  // Calculate county options from geographic data
  const counties = ['all', ...geographic.map(g => g.county)]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Property Analytics Dashboard</h1>
          <p className="text-gray-400 mt-1">Geographic insights, risk assessment, and market analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-[150px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Counties</SelectItem>
              {counties.filter(c => c !== 'all').map(county => (
                <SelectItem key={county} value={county}>{county}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={loadPropertyData} className="border-gray-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-900/20 border-red-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* High Risk Alerts */}
      {riskAssessments.filter(r => r.risk_score >= 85).length > 0 && (
        <Alert className="bg-red-900/20 border-red-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{riskAssessments.filter(r => r.risk_score >= 85).length} properties with critical risk scores</strong> requiring immediate attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Properties</CardTitle>
            <Home className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.total_properties.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-500 mt-1">
              Avg value: {formatCurrency(overview?.avg_property_value || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Insured Value</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {formatCurrency(overview?.total_insured_value || 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Avg premium: {formatCurrency(overview?.avg_insurance_premium || 0)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Hurricane Risk</CardTitle>
            <Wind className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.hurricane_zone_properties.toLocaleString() || '0'}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview ? ((overview.hurricane_zone_properties / overview.total_properties) * 100).toFixed(1) : '0'}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Underinsured</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{overview?.underinsured_properties || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {overview ? ((overview.underinsured_properties / overview.total_properties) * 100).toFixed(1) : '0'}% coverage gaps
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview">Portfolio Overview</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="geographic">Geographic Analysis</TabsTrigger>
          <TabsTrigger value="market">Market Insights</TabsTrigger>
          <TabsTrigger value="insurance">Insurance Gaps</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Value Trends */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Property Value Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#9CA3AF"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => new Date(value + '-01').toLocaleDateString('en-US', { month: 'short' })}
                    />
                    <YAxis yAxisId="left" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                      formatter={(value: number, name) => [
                        name === 'avg_value' ? formatCurrency(value) : value,
                        name === 'avg_value' ? 'Avg Value' : 'Properties Added'
                      ]}
                    />
                    <Legend />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="avg_value"
                      stroke="#3B82F6"
                      fill="url(#valueGradient)"
                      strokeWidth={2}
                      name="Avg Property Value"
                    />
                    <Bar 
                      yAxisId="right" 
                      dataKey="properties_added" 
                      fill="#10B981" 
                      name="Properties Added"
                    />
                    <defs>
                      <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Property Types Distribution */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Property Types Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={propertyTypes}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, percent }) => `${type} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {propertyTypes.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PROPERTY_TYPE_COLORS[entry.type as keyof typeof PROPERTY_TYPE_COLORS] || '#6B7280'} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      formatter={(value: number, name, props) => [
                        `${value} properties (${formatCurrency(props.payload.avg_value)} avg)`,
                        name
                      ]}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Property Types Table */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Property Types Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Property Type</th>
                      <th className="text-right py-2 text-gray-400">Count</th>
                      <th className="text-right py-2 text-gray-400">Avg Value</th>
                      <th className="text-right py-2 text-gray-400">Avg Insurance</th>
                      <th className="text-center py-2 text-gray-400">Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {propertyTypes.map((type, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: PROPERTY_TYPE_COLORS[type.type as keyof typeof PROPERTY_TYPE_COLORS] || '#6B7280' }}
                            />
                            <span className="text-gray-300 font-medium">{type.type}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 text-gray-300">{type.count.toLocaleString()}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(type.avg_value)}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(type.avg_insurance)}</td>
                        <td className="text-center py-3">
                          <Badge 
                            variant="outline"
                            className={type.risk_level === 'high' ? 'border-red-500 text-red-500' : type.risk_level === 'medium' ? 'border-yellow-500 text-yellow-500' : 'border-green-500 text-green-500'}
                          >
                            {type.risk_level}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">High-Risk Property Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Property</th>
                      <th className="text-left py-2 text-gray-400">County</th>
                      <th className="text-center py-2 text-gray-400">Risk Score</th>
                      <th className="text-right py-2 text-gray-400">Property Value</th>
                      <th className="text-right py-2 text-gray-400">Coverage Gap</th>
                      <th className="text-left py-2 text-gray-400">Risk Factors</th>
                      <th className="text-center py-2 text-gray-400">Hurricane Zone</th>
                      <th className="text-center py-2 text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskAssessments.map((property, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3">
                          <div>
                            <div className="text-gray-300 font-medium text-xs">{property.property_id}</div>
                            <div className="text-gray-500 text-xs">{property.address}</div>
                          </div>
                        </td>
                        <td className="py-3 text-gray-300">{property.county}</td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getRiskColor(property.risk_score) }}
                            />
                            <span className="text-gray-300">{property.risk_score}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(property.property_value)}</td>
                        <td className="text-right py-3">
                          <span className={property.coverage_gap > 100000 ? 'text-red-400' : property.coverage_gap > 50000 ? 'text-yellow-400' : 'text-gray-300'}>
                            {formatCurrency(property.coverage_gap)}
                          </span>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1">
                            {property.risk_factors.slice(0, 2).map((factor, fidx) => (
                              <Badge key={fidx} variant="outline" className="text-xs text-gray-400 border-gray-600">
                                {factor}
                              </Badge>
                            ))}
                            {property.risk_factors.length > 2 && (
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                +{property.risk_factors.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="text-center py-3">
                          <Badge 
                            variant="outline"
                            style={{
                              borderColor: HURRICANE_ZONE_COLORS[property.hurricane_zone as keyof typeof HURRICANE_ZONE_COLORS],
                              color: HURRICANE_ZONE_COLORS[property.hurricane_zone as keyof typeof HURRICANE_ZONE_COLORS]
                            }}
                          >
                            {property.hurricane_zone}
                          </Badge>
                        </td>
                        <td className="text-center py-3">
                          <div className="flex justify-center space-x-1">
                            <Button size="sm" variant="outline" className="text-xs">
                              <Eye className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-xs text-orange-400 border-orange-400">
                              Review
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

        <TabsContent value="geographic" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Geographic Distribution Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">County</th>
                      <th className="text-right py-2 text-gray-400">Properties</th>
                      <th className="text-right py-2 text-gray-400">Avg Value</th>
                      <th className="text-right py-2 text-gray-400">Total Value</th>
                      <th className="text-right py-2 text-gray-400">Avg Insurance</th>
                      <th className="text-center py-2 text-gray-400">Risk Score</th>
                      <th className="text-right py-2 text-gray-400">Hurricane Risk</th>
                      <th className="text-right py-2 text-gray-400">Flood Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {geographic.map((geo, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-300 font-medium">{geo.county}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 text-gray-300">{geo.property_count.toLocaleString()}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(geo.avg_value)}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(geo.total_value)}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(geo.avg_insurance)}</td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: getRiskColor(geo.risk_score) }}
                            />
                            <span className="text-gray-300">{geo.risk_score}</span>
                          </div>
                        </td>
                        <td className="text-right py-3">
                          <span className={geo.hurricane_properties > geo.property_count * 0.5 ? 'text-red-400' : geo.hurricane_properties > geo.property_count * 0.25 ? 'text-yellow-400' : 'text-gray-300'}>
                            {geo.hurricane_properties} ({((geo.hurricane_properties / geo.property_count) * 100).toFixed(1)}%)
                          </span>
                        </td>
                        <td className="text-right py-3">
                          <span className={geo.flood_properties > geo.property_count * 0.3 ? 'text-blue-400' : 'text-gray-300'}>
                            {geo.flood_properties} ({((geo.flood_properties / geo.property_count) * 100).toFixed(1)}%)
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

        <TabsContent value="market" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Market Analysis by County</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">County</th>
                      <th className="text-right py-2 text-gray-400">Avg Sale Price</th>
                      <th className="text-center py-2 text-gray-400">Price Change</th>
                      <th className="text-right py-2 text-gray-400">Inventory (Months)</th>
                      <th className="text-center py-2 text-gray-400">Market Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketAnalysis.map((market, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3 text-gray-300 font-medium">{market.county}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(market.avg_sale_price)}</td>
                        <td className="text-center py-3">
                          <span className={market.price_change_pct >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {market.price_change_pct >= 0 ? '+' : ''}{market.price_change_pct.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 text-gray-300">{market.inventory_months.toFixed(1)}</td>
                        <td className="text-center py-3">
                          <div className="flex items-center justify-center space-x-2">
                            {getMarketTrendIcon(market.market_trend)}
                            <span className={getMarketTrendColor(market.market_trend)}>
                              {market.market_trend}
                            </span>
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

        <TabsContent value="insurance" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Insurance Coverage Gaps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-2 text-gray-400">Property</th>
                      <th className="text-left py-2 text-gray-400">County</th>
                      <th className="text-right py-2 text-gray-400">Property Value</th>
                      <th className="text-right py-2 text-gray-400">Current Coverage</th>
                      <th className="text-right py-2 text-gray-400">Coverage Gap</th>
                      <th className="text-center py-2 text-gray-400">Gap %</th>
                      <th className="text-right py-2 text-gray-400">Recommended</th>
                      <th className="text-right py-2 text-gray-400">Premium Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insuranceGaps.map((gap, idx) => (
                      <tr key={idx} className="border-b border-gray-700/50">
                        <td className="py-3">
                          <div>
                            <div className="text-gray-300 font-medium text-xs">{gap.property_id}</div>
                            <div className="text-gray-500 text-xs">{gap.address}</div>
                          </div>
                        </td>
                        <td className="py-3 text-gray-300">{gap.county}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(gap.property_value)}</td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(gap.insurance_coverage)}</td>
                        <td className="text-right py-3">
                          <span className={gap.gap_percentage > 40 ? 'text-red-400' : gap.gap_percentage > 25 ? 'text-yellow-400' : 'text-gray-300'}>
                            {formatCurrency(gap.gap_amount)}
                          </span>
                        </td>
                        <td className="text-center py-3">
                          <span className={gap.gap_percentage > 40 ? 'text-red-400' : gap.gap_percentage > 25 ? 'text-yellow-400' : 'text-gray-300'}>
                            {gap.gap_percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="text-right py-3 text-gray-300">{formatCurrency(gap.recommended_coverage)}</td>
                        <td className="text-right py-3 text-gray-300">+{formatCurrency(gap.annual_premium_impact)}/yr</td>
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