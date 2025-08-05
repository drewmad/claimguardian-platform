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

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import { Brain, Activity, AlertCircle, Zap, RefreshCw, Download, Upload, Info, Eye } from 'lucide-react'
import { createBrowserSupabaseClient } from '@claimguardian/db'
import { format } from 'date-fns'

interface Model {
  id: string
  name: string
  version: string
  type: 'damage-detection' | 'policy-extraction' | 'claim-prediction' | 'fraud-detection'
  status: 'training' | 'deployed' | 'failed' | 'archived'
  accuracy: number
  f1_score: number
  precision: number
  recall: number
  training_loss: number
  validation_loss: number
  parameters: number
  size_mb: number
  created_at: string
  deployed_at?: string
  last_prediction?: string
}

interface TrainingJob {
  id: string
  model_id: string
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  epoch: number
  total_epochs: number
  loss: number
  accuracy: number
  started_at: string
  eta?: string
  error?: string
}

interface ModelMetrics {
  timestamp: string
  predictions: number
  avg_latency: number
  error_rate: number
  confidence: number
}

interface DatasetInfo {
  name: string
  size: number
  features: number
  samples: number
  last_updated: string
  quality_score: number
}

export function MLOperationsDashboard() {
  const [models, setModels] = useState<Model[]>([])
  const [activeJobs, setActiveJobs] = useState<TrainingJob[]>([])
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [metrics, setMetrics] = useState<ModelMetrics[]>([])
  const [datasets, setDatasets] = useState<DatasetInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d')

  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    loadMLData()
    const interval = setInterval(loadMLData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [timeRange])

  const loadMLData = async () => {
    try {
      setLoading(true)
      
      // Mock data for demonstration
      const mockModels: Model[] = [
        {
          id: '1',
          name: 'DamageDetector',
          version: 'v2.3.1',
          type: 'damage-detection',
          status: 'deployed',
          accuracy: 94.3,
          f1_score: 92.1,
          precision: 93.5,
          recall: 90.8,
          training_loss: 0.0234,
          validation_loss: 0.0289,
          parameters: 12500000,
          size_mb: 48.2,
          created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          deployed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          last_prediction: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: 'PolicyExtractor',
          version: 'v1.8.0',
          type: 'policy-extraction',
          status: 'deployed',
          accuracy: 96.7,
          f1_score: 95.2,
          precision: 96.1,
          recall: 94.3,
          training_loss: 0.0156,
          validation_loss: 0.0198,
          parameters: 8900000,
          size_mb: 34.5,
          created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          deployed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          last_prediction: new Date(Date.now() - 2 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'ClaimPredictor',
          version: 'v3.0.0-beta',
          type: 'claim-prediction',
          status: 'training',
          accuracy: 89.2,
          f1_score: 87.5,
          precision: 88.9,
          recall: 86.1,
          training_loss: 0.0412,
          validation_loss: 0.0523,
          parameters: 25600000,
          size_mb: 98.7,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          name: 'FraudDetector',
          version: 'v1.2.1',
          type: 'fraud-detection',
          status: 'deployed',
          accuracy: 98.1,
          f1_score: 89.3,
          precision: 95.2,
          recall: 84.1,
          training_loss: 0.0089,
          validation_loss: 0.0134,
          parameters: 15300000,
          size_mb: 58.9,
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          deployed_at: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          last_prediction: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        }
      ]

      const mockJobs: TrainingJob[] = [
        {
          id: 'job-1',
          model_id: '3',
          status: 'running',
          progress: 67,
          epoch: 67,
          total_epochs: 100,
          loss: 0.0412,
          accuracy: 89.2,
          started_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          eta: '45 minutes'
        }
      ]

      // Generate mock metrics
      const generateMetrics = (hours: number) => {
        return Array.from({ length: hours }, (_, i) => ({
          timestamp: new Date(Date.now() - (hours - i - 1) * 60 * 60 * 1000).toISOString(),
          predictions: Math.floor(Math.random() * 500) + 100,
          avg_latency: Math.random() * 50 + 20,
          error_rate: Math.random() * 2,
          confidence: Math.random() * 10 + 85
        }))
      }

      const hours = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 720
      setMetrics(generateMetrics(Math.min(hours, 48))) // Limit to 48 points

      const mockDatasets: DatasetInfo[] = [
        {
          name: 'Florida Hurricane Damage 2024',
          size: 2.3,
          features: 128,
          samples: 45000,
          last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          quality_score: 92
        },
        {
          name: 'Insurance Policy Documents',
          size: 1.8,
          features: 64,
          samples: 38000,
          last_updated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          quality_score: 88
        },
        {
          name: 'Historical Claims Data',
          size: 5.1,
          features: 256,
          samples: 125000,
          last_updated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          quality_score: 95
        }
      ]

      setModels(mockModels)
      setActiveJobs(mockJobs)
      setDatasets(mockDatasets)
      setSelectedModel(mockModels[0])
    } catch (error) {
      console.error('Error loading ML data:', error)
    } finally {
      setLoading(false)
    }
  }

  const deployedModels = models.filter(m => m.status === 'deployed')
  const totalPredictions = metrics.reduce((sum, m) => sum + m.predictions, 0)
  const avgLatency = metrics.reduce((sum, m) => sum + m.avg_latency, 0) / metrics.length || 0
  const avgErrorRate = metrics.reduce((sum, m) => sum + m.error_rate, 0) / metrics.length || 0

  const modelTypeColors = {
    'damage-detection': '#3B82F6',
    'policy-extraction': '#10B981',
    'claim-prediction': '#F59E0B',
    'fraud-detection': '#EF4444'
  }

  const performanceData = models.map(model => ({
    name: model.name,
    accuracy: model.accuracy,
    f1_score: model.f1_score,
    precision: model.precision,
    recall: model.recall
  }))

  const modelComparisonData = [
    { metric: 'Accuracy', ...models.reduce((acc, m) => ({ ...acc, [m.name]: m.accuracy }), {}) },
    { metric: 'F1 Score', ...models.reduce((acc, m) => ({ ...acc, [m.name]: m.f1_score }), {}) },
    { metric: 'Precision', ...models.reduce((acc, m) => ({ ...acc, [m.name]: m.precision }), {}) },
    { metric: 'Recall', ...models.reduce((acc, m) => ({ ...acc, [m.name]: m.recall }), {}) }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading ML operations data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">ML Operations</h1>
          <p className="text-gray-400 mt-1">Monitor and manage machine learning models</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={(v: '24h' | '7d' | '30d') => setTimeRange(v)}>
            <SelectTrigger className="w-[120px] bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="border-gray-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Upload className="h-4 w-4 mr-2" />
            Deploy Model
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Deployed Models</CardTitle>
            <Brain className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{deployedModels.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {models.filter(m => m.status === 'training').length} training
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Predictions</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {timeRange} period
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Avg Latency</CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgLatency.toFixed(1)}ms</div>
            <p className="text-xs text-gray-500 mt-1">
              {avgLatency < 50 ? 'Excellent' : avgLatency < 100 ? 'Good' : 'Needs optimization'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{avgErrorRate.toFixed(2)}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {avgErrorRate < 1 ? 'Healthy' : 'Needs attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Training Jobs */}
      {activeJobs.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Active Training Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {activeJobs.map(job => {
              const model = models.find(m => m.id === job.model_id)
              return (
                <div key={job.id} className="space-y-2 p-4 bg-gray-900 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-white">{model?.name}</h4>
                      <p className="text-sm text-gray-400">
                        Epoch {job.epoch}/{job.total_epochs} • Loss: {job.loss.toFixed(4)} • Accuracy: {job.accuracy.toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        {job.status}
                      </Badge>
                      <p className="text-sm text-gray-400 mt-1">ETA: {job.eta}</p>
                    </div>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="datasets">Datasets</TabsTrigger>
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="models" className="space-y-4">
          {/* Models Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {models.map(model => (
              <Card 
                key={model.id} 
                className="bg-gray-800 border-gray-700 cursor-pointer hover:border-gray-600"
                onClick={() => setSelectedModel(model)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{model.name}</CardTitle>
                      <CardDescription>
                        {model.version} • {(model.size_mb).toFixed(1)} MB • {(model.parameters / 1000000).toFixed(1)}M params
                      </CardDescription>
                    </div>
                    <Badge 
                      variant="outline"
                      className={
                        model.status === 'deployed' ? 'border-green-500 text-green-500' :
                        model.status === 'training' ? 'border-blue-500 text-blue-500' :
                        model.status === 'failed' ? 'border-red-500 text-red-500' :
                        'border-gray-500 text-gray-500'
                      }
                    >
                      {model.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Accuracy</p>
                      <p className="text-xl font-bold text-white">{model.accuracy.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-gray-400">F1 Score</p>
                      <p className="text-xl font-bold text-white">{model.f1_score.toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Model Performance</span>
                      <span className="text-gray-400">{model.accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={model.accuracy} className="h-2" />
                  </div>
                  {model.last_prediction && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last prediction: {format(new Date(model.last_prediction), 'MMM d, h:mm a')}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Model Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={modelComparisonData}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" stroke="#9CA3AF" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9CA3AF" />
                    {models.map((model, index) => (
                      <Radar
                        key={model.id}
                        name={model.name}
                        dataKey={model.name}
                        stroke={Object.values(modelTypeColors)[index]}
                        fill={Object.values(modelTypeColors)[index]}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelStyle={{ color: '#9CA3AF' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Inference Latency Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics.slice(-24)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelFormatter={(value) => format(new Date(value), 'MMM d, HH:mm')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="avg_latency" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Model Details */}
          {selectedModel && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>{selectedModel.name} Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Precision</p>
                    <p className="text-2xl font-bold text-white">{selectedModel.precision.toFixed(1)}%</p>
                    <Progress value={selectedModel.precision} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Recall</p>
                    <p className="text-2xl font-bold text-white">{selectedModel.recall.toFixed(1)}%</p>
                    <Progress value={selectedModel.recall} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Training Loss</p>
                    <p className="text-2xl font-bold text-white">{selectedModel.training_loss.toFixed(4)}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Validation Loss</p>
                    <p className="text-2xl font-bold text-white">{selectedModel.validation_loss.toFixed(4)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="datasets" className="space-y-4">
          {/* Datasets */}
          <div className="grid grid-cols-1 gap-4">
            {datasets.map((dataset, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{dataset.name}</CardTitle>
                      <CardDescription>
                        {dataset.samples.toLocaleString()} samples • {dataset.features} features • {dataset.size} GB
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="border-green-500 text-green-500 mb-2">
                        Quality: {dataset.quality_score}%
                      </Badge>
                      <p className="text-xs text-gray-400">
                        Updated {format(new Date(dataset.last_updated), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-gray-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-700">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="border-gray-700">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          {/* Real-time Monitoring */}
          <Alert className="bg-blue-900/20 border-blue-900">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Real-time monitoring shows live model performance across all deployed endpoints
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Prediction Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelFormatter={(value) => format(new Date(value), 'MMM d, HH:mm')}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="predictions" 
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Model Confidence Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      stroke="#9CA3AF"
                      tickFormatter={(value) => format(new Date(value), 'HH:mm')}
                    />
                    <YAxis stroke="#9CA3AF" domain={[80, 100]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelFormatter={(value) => format(new Date(value), 'MMM d, HH:mm')}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="confidence" 
                      stroke="#F59E0B" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}