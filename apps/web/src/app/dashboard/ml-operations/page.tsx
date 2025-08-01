'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Activity, Brain, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react'
// Inline stub components to resolve TypeScript errors
const ModelMonitoringDashboard = ({ modelId }: { modelId: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>Model Monitoring - {modelId}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">94.2%</p>
              <p className="text-sm text-gray-500">Accuracy</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Latency</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">45ms</p>
              <p className="text-sm text-gray-500">P95</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Throughput</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1.2k</p>
              <p className="text-sm text-gray-500">Requests/min</p>
            </CardContent>
          </Card>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Brain className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Model monitoring dashboard will be implemented here</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

const ExplainabilityDashboard = ({ modelId }: { modelId: string }) => (
  <Card>
    <CardHeader>
      <CardTitle>Model Explainability - {modelId}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Feature Importance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Property Age</span>
                  <span className="text-sm font-medium">0.32</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Location Risk</span>
                  <span className="text-sm font-medium">0.28</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Construction Type</span>
                  <span className="text-sm font-medium">0.19</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">SHAP Values</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4 text-gray-500">
                <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">SHAP analysis visualization</p>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>AI explainability dashboard will be implemented here</p>
        </div>
      </div>
    </CardContent>
  </Card>
)

export default function MLOperationsPage() {
  const [selectedModel, setSelectedModel] = useState('property_risk_v1.2.3')

  // Mock data for overview
  const mlOverview = {
    activeModels: 4,
    totalPredictions24h: 12543,
    avgLatency: 45,
    errorRate: 0.002,
    driftStatus: 'low',
    federatedNodes: 12
  }

  const models = [
    { id: 'property_risk_v1.2.3', name: 'Property Risk Assessment', status: 'active', traffic: 100 },
    { id: 'damage_detection_v2.1.0', name: 'Damage Detection', status: 'active', traffic: 85 },
    { id: 'flood_prediction_v1.0.0', name: 'Flood Risk Prediction', status: 'testing', traffic: 15 },
    { id: 'claim_value_v3.0.0', name: 'Claim Value Estimator', status: 'inactive', traffic: 0 }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">ML Operations Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor and manage AI/ML models in production
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Export Report
          </Button>
          <Button size="sm">
            Deploy New Model
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlOverview.activeModels}</div>
            <p className="text-xs text-gray-500">In production</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Predictions (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlOverview.totalPredictions24h.toLocaleString()}</div>
            <p className="text-xs text-gray-500">+12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlOverview.avgLatency}ms</div>
            <p className="text-xs text-green-500">Within SLA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Error Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(mlOverview.errorRate * 100).toFixed(2)}%</div>
            <p className="text-xs text-gray-500">Last hour</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Drift Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={mlOverview.driftStatus === 'low' ? 'default' : 'destructive'}>
              {mlOverview.driftStatus.toUpperCase()}
            </Badge>
            <p className="text-xs text-gray-500 mt-1">All models</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Fed. Learning Nodes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mlOverview.federatedNodes}</div>
            <p className="text-xs text-gray-500">Active nodes</p>
          </CardContent>
        </Card>
      </div>

      {/* Model Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => setSelectedModel(model.id)}
              >
                <div className="flex items-center gap-4">
                  <Brain className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium">{model.name}</p>
                    <p className="text-sm text-gray-500">{model.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">Traffic: {model.traffic}%</p>
                    <Badge
                      variant={
                        model.status === 'active' ? 'default' :
                        model.status === 'testing' ? 'secondary' : 'outline'
                      }
                    >
                      {model.status}
                    </Badge>
                  </div>
                  {model.status === 'active' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {model.status === 'testing' && <Activity className="h-5 w-5 text-yellow-500" />}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Monitoring Tabs */}
      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          <TabsTrigger value="explainability">Explainability</TabsTrigger>
          <TabsTrigger value="federated">Federated Learning</TabsTrigger>
          <TabsTrigger value="experiments">A/B Tests</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <ModelMonitoringDashboard modelId={selectedModel} />
        </TabsContent>

        <TabsContent value="explainability">
          <ExplainabilityDashboard modelId={selectedModel} />
        </TabsContent>

        <TabsContent value="federated">
          <Card>
            <CardHeader>
              <CardTitle>Federated Learning Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Current Round</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">Round 156</p>
                      <p className="text-sm text-gray-500">8/12 nodes reported</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Avg Trust Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">0.87</p>
                      <p className="text-sm text-gray-500">Across all nodes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Privacy Budget Used</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">62%</p>
                      <p className="text-sm text-gray-500">ε = 0.62 / 1.0</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiments">
          <Card>
            <CardHeader>
              <CardTitle>Active A/B Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">Property Risk v1.2.3 vs v1.3.0</h4>
                      <p className="text-sm text-gray-500">Testing new risk factors</p>
                    </div>
                    <Badge>Running</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Control (v1.2.3)</p>
                      <p className="font-medium">Accuracy: 94.2%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Treatment (v1.3.0)</p>
                      <p className="font-medium">Accuracy: 95.1%</p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" variant="outline">View Details</Button>
                    <Button size="sm">Promote to Production</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div className="flex-1">
                    <p className="font-medium">Moderate drift detected</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Property Risk model showing 0.23 PSI score in Miami-Dade region
                    </p>
                  </div>
                  <Button size="sm" variant="outline">Investigate</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}