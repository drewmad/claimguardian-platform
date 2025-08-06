'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  DollarSign,
  Users,
  FileText,
  Clock,
  Target,
  Zap,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Radar as RadarIcon,
  Download,
  Calendar,
  Filter,
  Search,
  Eye,
  Settings,
  Database,
  Cpu,
  Globe,
  MapPin,
  Home,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface PredictiveMetric {
  id: string
  name: string
  value: number
  change: number
  trend: 'up' | 'down' | 'stable'
  prediction: number
  confidence: number
  category: 'claims' | 'fraud' | 'customer' | 'financial' | 'operational'
  impact: 'high' | 'medium' | 'low'
}

interface ClaimPrediction {
  month: string
  predicted: number
  actual?: number
  confidence: number
  factors: string[]
}

interface FraudAlert {
  id: string
  claimId: string
  riskScore: number
  indicators: string[]
  status: 'active' | 'investigating' | 'resolved' | 'false_positive'
  createdAt: Date
  priority: 'high' | 'medium' | 'low'
}

interface CustomerSegment {
  segment: string
  count: number
  avgClaimValue: number
  churnProbability: number
  lifetimeValue: number
  satisfaction: number
}

interface ModelPerformance {
  modelName: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  lastTrained: Date
  predictions: number
  errors: number
}

export function PredictiveAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // Mock data - in production would come from AI models and database
  const [metrics, setMetrics] = useState<PredictiveMetric[]>([
    {
      id: '1',
      name: 'Claim Volume',
      value: 1247,
      change: 12.5,
      trend: 'up',
      prediction: 1389,
      confidence: 87,
      category: 'claims',
      impact: 'high'
    },
    {
      id: '2',
      name: 'Fraud Detection Rate',
      value: 3.2,
      change: -0.8,
      trend: 'down',
      prediction: 2.9,
      confidence: 92,
      category: 'fraud',
      impact: 'high'
    },
    {
      id: '3',
      name: 'Customer Satisfaction',
      value: 8.4,
      change: 0.3,
      trend: 'up',
      prediction: 8.6,
      confidence: 78,
      category: 'customer',
      impact: 'medium'
    },
    {
      id: '4',
      name: 'Processing Time',
      value: 4.2,
      change: -0.7,
      trend: 'down',
      prediction: 3.8,
      confidence: 85,
      category: 'operational',
      impact: 'medium'
    },
    {
      id: '5',
      name: 'Settlement Accuracy',
      value: 94.2,
      change: 2.1,
      trend: 'up',
      prediction: 95.8,
      confidence: 91,
      category: 'financial',
      impact: 'high'
    }
  ])

  const [claimPredictions, setClaimPredictions] = useState<ClaimPrediction[]>([
    { month: 'Jan', predicted: 1200, actual: 1185, confidence: 89, factors: ['Weather', 'Seasonality'] },
    { month: 'Feb', predicted: 1150, actual: 1162, confidence: 87, factors: ['Historical trend'] },
    { month: 'Mar', predicted: 1300, actual: 1289, confidence: 91, factors: ['Spring storms'] },
    { month: 'Apr', predicted: 1350, actual: 1347, confidence: 88, factors: ['Severe weather'] },
    { month: 'May', predicted: 1400, confidence: 85, factors: ['Hurricane prep'] },
    { month: 'Jun', predicted: 1550, confidence: 82, factors: ['Hurricane season'] }
  ])

  const [fraudAlerts, setFraudAlerts] = useState<FraudAlert[]>([
    {
      id: '1',
      claimId: 'CLM-2024-001234',
      riskScore: 87,
      indicators: ['Suspicious timing', 'Multiple claims', 'High claim amount'],
      status: 'active',
      createdAt: new Date(),
      priority: 'high'
    },
    {
      id: '2', 
      claimId: 'CLM-2024-001235',
      riskScore: 73,
      indicators: ['Document anomalies', 'Network connections'],
      status: 'investigating',
      createdAt: new Date(Date.now() - 3600000),
      priority: 'medium'
    }
  ])

  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([
    { segment: 'High Value', count: 342, avgClaimValue: 45000, churnProbability: 0.05, lifetimeValue: 125000, satisfaction: 9.2 },
    { segment: 'Standard', count: 1847, avgClaimValue: 18000, churnProbability: 0.12, lifetimeValue: 45000, satisfaction: 8.1 },
    { segment: 'At Risk', count: 234, avgClaimValue: 12000, churnProbability: 0.35, lifetimeValue: 15000, satisfaction: 6.8 },
    { segment: 'New Customer', count: 156, avgClaimValue: 22000, churnProbability: 0.18, lifetimeValue: 35000, satisfaction: 7.9 }
  ])

  const [modelPerformance, setModelPerformance] = useState<ModelPerformance[]>([
    { modelName: 'Fraud Detection', accuracy: 94.2, precision: 89.1, recall: 87.3, f1Score: 88.2, lastTrained: new Date(), predictions: 15432, errors: 896 },
    { modelName: 'Claim Predictor', accuracy: 91.7, precision: 88.9, recall: 92.1, f1Score: 90.5, lastTrained: new Date(Date.now() - 86400000), predictions: 8765, errors: 726 },
    { modelName: 'Sentiment Analyzer', accuracy: 87.3, precision: 84.2, recall: 89.7, f1Score: 86.9, lastTrained: new Date(Date.now() - 172800000), predictions: 23456, errors: 2987 }
  ])

  const supabase = createClient()

  const refreshData = async () => {
    setRefreshing(true)
    try {
      // Simulate API calls to refresh predictive data
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update metrics with new predictions
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + (Math.random() - 0.5) * 10,
        change: (Math.random() - 0.5) * 5,
        prediction: metric.prediction + (Math.random() - 0.5) * 15,
        confidence: Math.max(70, Math.min(98, metric.confidence + (Math.random() - 0.5) * 10))
      })))

      toast.success('Predictive models refreshed')
    } catch (error) {
      toast.error('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const exportReport = () => {
    const report = {
      generated: new Date().toISOString(),
      timeRange,
      metrics,
      claimPredictions,
      fraudAlerts: fraudAlerts.filter(a => a.status === 'active'),
      modelPerformance
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `predictive-analytics-${timeRange}-${Date.now()}.json`
    a.click()
    
    toast.success('Analytics report exported')
  }

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'claims': return FileText
      case 'fraud': return Shield
      case 'customer': return Users
      case 'financial': return DollarSign
      case 'operational': return Activity
      default: return BarChart3
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-500'
      case 'down': return 'text-red-500'
      default: return 'text-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return TrendingUp
      case 'down': return TrendingDown
      default: return Activity
    }
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>Predictive Analytics Dashboard</span>
            <Badge variant="outline" className="ml-2">Admin Only</Badge>
          </h2>
          <p className="text-gray-600">AI-powered insights and predictions for business intelligence</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 days</SelectItem>
              <SelectItem value="30d">30 days</SelectItem>
              <SelectItem value="90d">90 days</SelectItem>
              <SelectItem value="1y">1 year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={refreshData} disabled={refreshing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={exportReport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const Icon = getMetricIcon(metric.category)
          const TrendIcon = getTrendIcon(metric.trend)
          
          return (
            <Card key={metric.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5 text-gray-500" />
                  <Badge variant={metric.impact === 'high' ? 'destructive' : metric.impact === 'medium' ? 'secondary' : 'outline'}>
                    {metric.impact} impact
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold">{metric.value.toLocaleString()}</p>
                    <div className={`flex items-center ${getTrendColor(metric.trend)}`}>
                      <TrendIcon className="h-4 w-4" />
                      <span className="text-sm font-medium ml-1">
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500">{metric.name}</p>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Prediction: {metric.prediction.toLocaleString()}</span>
                      <span>{metric.confidence}% confidence</span>
                    </div>
                    <Progress value={metric.confidence} className="h-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="fraud">Fraud Detection</TabsTrigger>
          <TabsTrigger value="customers">Customer Analytics</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="alerts">Alert Center</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Claim Volume Predictions</CardTitle>
                <CardDescription>
                  AI predictions vs actual claim volumes with confidence intervals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={claimPredictions}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="predicted" 
                      stroke="#8884d8" 
                      strokeWidth={3}
                      name="Predicted"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="actual" 
                      stroke="#82ca9d" 
                      strokeWidth={2}
                      name="Actual"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Prediction Accuracy</CardTitle>
                  <CardDescription>Model accuracy across different prediction types</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Claim Volume</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={94} className="w-20" />
                        <span className="text-sm">94%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Settlement Amount</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={87} className="w-20" />
                        <span className="text-sm">87%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Time</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={91} className="w-20" />
                        <span className="text-sm">91%</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span>Customer Satisfaction</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={78} className="w-20" />
                        <span className="text-sm">78%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Prediction Factors</CardTitle>
                  <CardDescription>Key factors influencing current predictions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Hurricane Season Impact</span>
                      <Badge variant="destructive">High</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Economic Conditions</span>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Historical Patterns</span>
                      <Badge variant="outline">Low</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Regulatory Changes</span>
                      <Badge variant="secondary">Medium</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fraud">
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Shield className="h-8 w-8 text-red-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">{fraudAlerts.filter(a => a.status === 'active').length}</p>
                      <p className="text-sm text-gray-500">Active Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <Eye className="h-8 w-8 text-orange-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">{fraudAlerts.filter(a => a.status === 'investigating').length}</p>
                      <p className="text-sm text-gray-500">Under Investigation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">3.2%</p>
                      <p className="text-sm text-gray-500">Detection Rate</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Fraud Alerts</CardTitle>
                <CardDescription>AI-detected potential fraud cases requiring review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {fraudAlerts.map((alert) => (
                    <div key={alert.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold">{alert.claimId}</h4>
                          <p className="text-sm text-gray-500">
                            Risk Score: {alert.riskScore}% • {alert.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Badge variant={
                            alert.priority === 'high' ? 'destructive' :
                            alert.priority === 'medium' ? 'secondary' : 'outline'
                          }>
                            {alert.priority} priority
                          </Badge>
                          
                          <Badge variant={
                            alert.status === 'active' ? 'destructive' :
                            alert.status === 'investigating' ? 'secondary' :
                            alert.status === 'resolved' ? 'default' : 'outline'
                          }>
                            {alert.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-1">Fraud Indicators:</p>
                        <div className="flex flex-wrap gap-1">
                          {alert.indicators.map((indicator, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="h-3 w-3 mr-1" />
                          Investigate
                        </Button>
                        <Button size="sm" variant="outline">
                          <XCircle className="h-3 w-3 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Segmentation</CardTitle>
                <CardDescription>AI-powered customer analysis and lifetime value predictions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {customerSegments.map((segment) => (
                    <div key={segment.segment} className="border rounded-lg p-4">
                      <div className="grid grid-cols-6 gap-4 items-center">
                        <div>
                          <h4 className="font-semibold">{segment.segment}</h4>
                          <p className="text-sm text-gray-500">{segment.count} customers</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Avg Claim</p>
                          <p className="font-medium">${segment.avgClaimValue.toLocaleString()}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Churn Risk</p>
                          <p className="font-medium">{(segment.churnProbability * 100).toFixed(1)}%</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Lifetime Value</p>
                          <p className="font-medium">${segment.lifetimeValue.toLocaleString()}</p>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Satisfaction</p>
                          <p className="font-medium">{segment.satisfaction}/10</p>
                        </div>
                        
                        <div>
                          <Button size="sm" variant="outline">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Churn Prediction</CardTitle>
                  <CardDescription>Customers at risk of leaving</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={customerSegments}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="count"
                        nameKey="segment"
                      >
                        {customerSegments.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Customer Lifetime Value</CardTitle>
                  <CardDescription>Predicted value by segment</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={customerSegments}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="segment" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="lifetimeValue" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Performance</CardTitle>
              <CardDescription>Performance metrics for all deployed AI models</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {modelPerformance.map((model) => (
                  <div key={model.modelName} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="font-semibold">{model.modelName}</h4>
                        <p className="text-sm text-gray-500">
                          Last trained: {model.lastTrained.toLocaleDateString()} • 
                          {model.predictions.toLocaleString()} predictions • 
                          {model.errors.toLocaleString()} errors
                        </p>
                      </div>
                      
                      <Badge variant={model.accuracy > 90 ? 'default' : model.accuracy > 80 ? 'secondary' : 'destructive'}>
                        {model.accuracy}% accuracy
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Precision</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={model.precision} className="flex-1" />
                          <span className="text-sm font-medium">{model.precision}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">Recall</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={model.recall} className="flex-1" />
                          <span className="text-sm font-medium">{model.recall}%</span>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-500">F1 Score</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={model.f1Score} className="flex-1" />
                          <span className="text-sm font-medium">{model.f1Score}%</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline">
                          <Settings className="h-3 w-3 mr-1" />
                          Retrain
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="space-y-6">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Key AI Insights</AlertTitle>
              <AlertDescription>
                Based on predictive analytics from the last {timeRange}
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Claim Processing Efficiency</h4>
                      <p className="text-sm text-gray-600">
                        AI automation has reduced processing time by 32% while maintaining 94% accuracy. 
                        Recommend scaling AI-assisted reviews to handle predicted 15% increase in Q2 claims.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Shield className="h-5 w-5 text-red-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Fraud Detection Optimization</h4>
                      <p className="text-sm text-gray-600">
                        Current fraud model shows signs of drift. Recommend retraining with recent data to 
                        improve detection of emerging fraud patterns. Potential savings: $2.3M annually.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Users className="h-5 w-5 text-blue-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Customer Retention Opportunity</h4>
                      <p className="text-sm text-gray-600">
                        234 customers predicted to churn in next 90 days. Proactive engagement could 
                        retain 65-70% based on historical intervention success rates.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <Zap className="h-5 w-5 text-yellow-500 mt-1" />
                    <div>
                      <h4 className="font-semibold">Seasonal Pattern Alert</h4>
                      <p className="text-sm text-gray-600">
                        Hurricane season predictions suggest 40% higher claim volume than last year. 
                        Consider scaling customer service and adjustor capacity by early June.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </div>
            </div>
        </TabsContent>

        <TabsContent value="alerts">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">7</p>
                      <p className="text-sm text-gray-500">Critical Alerts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <AlertTriangle className="h-8 w-8 text-orange-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">23</p>
                      <p className="text-sm text-gray-500">Warnings</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <div className="text-right">
                      <p className="text-2xl font-bold">156</p>
                      <p className="text-sm text-gray-500">Resolved Today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active System Alerts</CardTitle>
                <CardDescription>Real-time alerts from AI monitoring systems</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Model Drift Detected</AlertTitle>
                    <AlertDescription>
                      Fraud detection model accuracy dropped below 90%. Immediate retraining recommended.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>High Processing Load</AlertTitle>
                    <AlertDescription>
                      Document intelligence system processing 300% above normal capacity. 
                      Consider scaling resources.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Anomalous Pattern Detected</AlertTitle>
                    <AlertDescription>
                      Unusual spike in claims from Miami-Dade county. Investigating potential weather event correlation.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}