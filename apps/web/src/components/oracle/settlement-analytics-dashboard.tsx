/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Oracle Settlement Analytics Dashboard - ML-powered settlement predictions"
 * @dependencies ["react", "date-fns", "lucide-react", "@/lib/services/predictive-settlement-analytics"]
 * @status stable
 * @ai-integration settlement-prediction
 * @insurance-context settlement-analytics
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  TrendingUp,
  DollarSign,
  Calendar,
  Target,
  Brain,
  BarChart3,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Zap,
  Gem,
  TrendingDown,
  Activity,
  Award,
  Shield
} from 'lucide-react'
import { format, addDays } from 'date-fns'
import {
  predictiveSettlementAnalyticsService,
  type SettlementPrediction,
  type PredictionRequest,
  type SettlementAnalytics
} from '@/lib/services/predictive-settlement-analytics'
import { toast } from 'sonner'

interface NewPredictionForm {
  claim_id: string
  damage_type: string
  property_type: string
  county: string
  state: string
  zip_code: string
  estimated_damage: number
  date_of_loss: string
  cause_of_loss: string
  policy_limits: number
  deductible: number
  documentation_quality: 'excellent' | 'good' | 'fair' | 'poor'
  legal_representation: boolean
  insurance_carrier: string
}

export function SettlementAnalyticsDashboard() {
  const [predictions, setPredictions] = useState<SettlementPrediction[]>([])
  const [selectedPrediction, setSelectedPrediction] = useState<SettlementPrediction | null>(null)
  const [analytics, setAnalytics] = useState<SettlementAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showNewPrediction, setShowNewPrediction] = useState(false)

  const [newPrediction, setNewPrediction] = useState<NewPredictionForm>({
    claim_id: '',
    damage_type: 'hurricane',
    property_type: 'single_family',
    county: 'Miami-Dade',
    state: 'FL',
    zip_code: '',
    estimated_damage: 0,
    date_of_loss: '',
    cause_of_loss: '',
    policy_limits: 500000,
    deductible: 2500,
    documentation_quality: 'good',
    legal_representation: false,
    insurance_carrier: 'Citizens Property Insurance'
  })

  useEffect(() => {
    loadPredictions()
    loadAnalytics()
  }, [])

  const loadPredictions = async () => {
    try {
      // Mock predictions for demo - replace with actual data fetching
      const mockPredictions: SettlementPrediction[] = [
        {
          id: 'pred-001',
          claim_id: 'claim-2024-001',
          user_id: 'user-123',
          predicted_amount: 87500,
          confidence_score: 0.91,
          amount_range: { low: 75000, high: 98000, expected: 87500 },
          timeline_prediction: {
            estimated_days: 42,
            probability_by_timeframe: {
              '30_days': 0.25,
              '60_days': 0.85,
              '90_days': 0.95,
              '180_days': 0.98
            }
          },
          success_factors: [
            {
              factor: 'Excellent Documentation',
              impact_score: 85,
              description: 'Comprehensive photos and professional assessment',
              category: 'documentation'
            },
            {
              factor: 'Legal Representation',
              impact_score: 78,
              description: 'Experienced insurance attorney on retainer',
              category: 'legal'
            }
          ],
          risk_factors: [
            {
              risk: 'Policy Limits',
              severity: 'medium',
              impact_on_amount: -5,
              mitigation_strategy: 'Review additional coverages',
              category: 'coverage'
            }
          ],
          market_trends: [
            {
              trend_type: 'settlement_amounts',
              direction: 'increasing',
              impact: 5.2,
              timeframe: 'Last 6 months',
              confidence: 0.87,
              source: 'Florida OIR data'
            }
          ],
          comparable_claims: [],
          recommendations: [
            'Continue maintaining excellent documentation quality',
            'Leverage legal representation for negotiations',
            'Monitor market conditions for optimal timing'
          ],
          methodology: 'hybrid',
          data_sources: ['historical_claims', 'market_data', 'ai_analysis'],
          last_updated: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
      ]

      setPredictions(mockPredictions)
    } catch (error) {
      console.error('Error loading predictions:', error)
      toast.error('Failed to load settlement predictions')
    } finally {
      setLoading(false)
    }
  }

  const loadAnalytics = async () => {
    try {
      const analyticsData = await predictiveSettlementAnalyticsService.getSettlementAnalytics()
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading analytics:', error)
    }
  }

  const generatePrediction = async () => {
    if (!newPrediction.claim_id || !newPrediction.estimated_damage || !newPrediction.date_of_loss) {
      toast.error('Please fill in all required fields')
      return
    }

    setGenerating(true)

    try {
      const request: PredictionRequest = {
        claim_id: newPrediction.claim_id,
        damage_type: newPrediction.damage_type,
        property_type: newPrediction.property_type,
        location: {
          county: newPrediction.county,
          state: newPrediction.state,
          zip_code: newPrediction.zip_code
        },
        claim_details: {
          estimated_damage: newPrediction.estimated_damage,
          date_of_loss: newPrediction.date_of_loss,
          cause_of_loss: newPrediction.cause_of_loss,
          policy_limits: newPrediction.policy_limits,
          deductible: newPrediction.deductible
        },
        documentation_quality: newPrediction.documentation_quality,
        legal_representation: newPrediction.legal_representation,
        insurance_carrier: newPrediction.insurance_carrier
      }

      const prediction = await predictiveSettlementAnalyticsService.generatePrediction(request)

      if (prediction) {
        toast.success('Settlement prediction generated successfully')
        setSelectedPrediction(prediction)
        await loadPredictions()
        setShowNewPrediction(false)

        // Reset form
        setNewPrediction({
          ...newPrediction,
          claim_id: '',
          estimated_damage: 0,
          date_of_loss: '',
          cause_of_loss: '',
          zip_code: ''
        })
      } else {
        toast.error('Failed to generate prediction')
      }
    } catch (error) {
      console.error('Error generating prediction:', error)
      toast.error('Error generating settlement prediction')
    } finally {
      setGenerating(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-400 bg-green-900/20'
    if (confidence >= 0.8) return 'text-blue-400 bg-blue-900/20'
    if (confidence >= 0.7) return 'text-yellow-400 bg-yellow-900/20'
    return 'text-red-400 bg-red-900/20'
  }

  const getImpactColor = (impact: number) => {
    if (impact >= 80) return 'text-green-400'
    if (impact >= 60) return 'text-blue-400'
    if (impact >= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-gray-800 rounded-lg"></div>
        <div className="h-64 bg-gray-800 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 rounded-lg">
            <Gem className="h-6 w-6 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Oracle Settlement Analytics</h1>
            <p className="text-gray-400">ML-powered settlement prediction with market trend analysis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Button
            onClick={() => setShowNewPrediction(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Zap className="h-4 w-4 mr-1" />
            Generate Prediction
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Total Predictions</p>
                  <p className="text-2xl font-bold text-white">{analytics.total_predictions.toLocaleString()}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Accuracy Rate</p>
                  <p className="text-2xl font-bold text-green-400">{Math.round(analytics.accuracy_rate * 100)}%</p>
                </div>
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Predicted</p>
                  <p className="text-2xl font-bold text-blue-400">${(analytics.average_predicted_amount / 1000).toFixed(0)}K</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Market Trend</p>
                  <p className={`text-2xl font-bold flex items-center gap-1 ${analytics.market_performance.trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
                    {analytics.market_performance.trend === 'up' ? (
                      <TrendingUp className="h-6 w-6" />
                    ) : (
                      <TrendingDown className="h-6 w-6" />
                    )}
                    {analytics.market_performance.trend === 'up' ? '+' : ''}
                    {(((analytics.market_performance.this_month - analytics.market_performance.last_month) / analytics.market_performance.last_month) * 100).toFixed(1)}%
                  </p>
                </div>
                <Activity className="h-8 w-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="predictions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="analytics">Market Analytics</TabsTrigger>
          <TabsTrigger value="generate">Generate New</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Predictions List */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Recent Predictions</CardTitle>
                <CardDescription>
                  {predictions.length} settlement prediction{predictions.length !== 1 ? 's' : ''} generated
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {predictions.map(prediction => (
                    <div
                      key={prediction.id}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedPrediction?.id === prediction.id
                          ? 'bg-purple-900/20 border-purple-700'
                          : 'bg-gray-700/30 border-gray-700/50 hover:bg-gray-700/50'
                      }`}
                      onClick={() => setSelectedPrediction(prediction)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-white">Claim: {prediction.claim_id}</h4>
                        <Badge className={getConfidenceColor(prediction.confidence_score)}>
                          {Math.round(prediction.confidence_score * 100)}% confident
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">
                          Predicted: <span className="text-green-400 font-medium">
                            ${prediction.predicted_amount.toLocaleString()}
                          </span>
                        </span>
                        <span className="text-gray-400">
                          ~{prediction.timeline_prediction.estimated_days} days
                        </span>
                      </div>

                      <div className="mt-2 text-xs text-gray-500">
                        Range: ${prediction.amount_range.low.toLocaleString()} - ${prediction.amount_range.high.toLocaleString()}
                      </div>
                    </div>
                  ))}

                  {predictions.length === 0 && (
                    <div className="text-center py-8">
                      <Gem className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                      <p className="text-gray-400">No predictions generated yet</p>
                      <p className="text-sm text-gray-500">Create your first settlement prediction</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Prediction Details */}
            {selectedPrediction ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="h-5 w-5 text-purple-400" />
                    Prediction Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount Prediction */}
                  <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-700/30">
                    <p className="text-sm text-gray-400 mb-1">Predicted Settlement</p>
                    <p className="text-3xl font-bold text-green-400">
                      ${selectedPrediction.predicted_amount.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      Range: ${selectedPrediction.amount_range.low.toLocaleString()} - ${selectedPrediction.amount_range.high.toLocaleString()}
                    </p>
                    <Badge className={getConfidenceColor(selectedPrediction.confidence_score)} variant="outline">
                      {Math.round(selectedPrediction.confidence_score * 100)}% Confidence
                    </Badge>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expected Timeline
                    </h4>
                    <p className="text-gray-300 mb-3">
                      Estimated completion: <span className="text-blue-400 font-medium">
                        {selectedPrediction.timeline_prediction.estimated_days} days
                      </span>
                    </p>

                    <div className="space-y-2">
                      {Object.entries(selectedPrediction.timeline_prediction.probability_by_timeframe).map(([timeframe, probability]) => (
                        <div key={timeframe} className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">{timeframe.replace('_', ' ')}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={probability * 100} className="w-20 h-2 bg-gray-700" />
                            <span className="text-gray-300 w-10">{Math.round(probability * 100)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Success Factors */}
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      Success Factors
                    </h4>
                    <div className="space-y-2">
                      {selectedPrediction.success_factors.map((factor, index) => (
                        <div key={index} className="p-2 bg-green-900/10 border border-green-900/20 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-green-400 font-medium text-sm">{factor.factor}</span>
                            <Badge className="bg-green-900/20 text-green-400 border-green-600/30 text-xs">
                              +{factor.impact_score}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-400">{factor.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Risk Factors */}
                  {selectedPrediction.risk_factors.length > 0 && (
                    <div>
                      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                        Risk Factors
                      </h4>
                      <div className="space-y-2">
                        {selectedPrediction.risk_factors.map((risk, index) => (
                          <div key={index} className="p-2 bg-orange-900/10 border border-orange-900/20 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-orange-400 font-medium text-sm">{risk.risk}</span>
                              <Badge className={`text-xs ${
                                risk.severity === 'high' ? 'bg-red-900/20 text-red-400 border-red-600/30' :
                                risk.severity === 'medium' ? 'bg-orange-900/20 text-orange-400 border-orange-600/30' :
                                'bg-yellow-900/20 text-yellow-400 border-yellow-600/30'
                              }`}>
                                {risk.impact_on_amount}%
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400">{risk.mitigation_strategy}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-blue-400" />
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {selectedPrediction.recommendations.map((rec, index) => (
                        <div key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="text-center py-12">
                  <Gem className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Prediction Selected</h3>
                  <p className="text-gray-400">Select a prediction from the list to view detailed analysis</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Market Trends & Performance Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Success Rate by Factor</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-3">
                    {Object.entries(analytics.success_rate_by_factor).map(([factor, rate]) => (
                      <div key={factor} className="flex items-center justify-between">
                        <span className="text-gray-300 capitalize">
                          {factor.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={rate * 100} className="w-24 h-2 bg-gray-700" />
                          <span className="text-white font-medium w-12">
                            {Math.round(rate * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Model Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Prediction Accuracy</span>
                      <span className="text-green-400 font-medium">
                        {Math.round(analytics.accuracy_rate * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Average Variance</span>
                      <span className="text-blue-400 font-medium">
                        {Math.round(analytics.prediction_variance * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Predicted vs Actual</span>
                      <span className="text-purple-400 font-medium">
                        ${(analytics.average_predicted_amount / 1000).toFixed(0)}K vs ${(analytics.average_actual_amount / 1000).toFixed(0)}K
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white mb-1">A+</p>
                        <p className="text-sm text-gray-400">Model Grade</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          {/* New Prediction Form */}
          <Card className="bg-gray-800 border-gray-700 max-w-4xl">
            <CardHeader>
              <CardTitle className="text-white">Generate Settlement Prediction</CardTitle>
              <CardDescription>
                Provide claim details to generate an AI-powered settlement prediction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Claim ID *</Label>
                    <Input
                      value={newPrediction.claim_id}
                      onChange={(e) => setNewPrediction({...newPrediction, claim_id: e.target.value})}
                      placeholder="CLAIM-2024-001"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Damage Type</Label>
                    <Select
                      value={newPrediction.damage_type}
                      onValueChange={(value) => setNewPrediction({...newPrediction, damage_type: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="hurricane">Hurricane</SelectItem>
                        <SelectItem value="flood">Flood</SelectItem>
                        <SelectItem value="fire">Fire</SelectItem>
                        <SelectItem value="theft">Theft</SelectItem>
                        <SelectItem value="vandalism">Vandalism</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">Property Type</Label>
                    <Select
                      value={newPrediction.property_type}
                      onValueChange={(value) => setNewPrediction({...newPrediction, property_type: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="single_family">Single Family Home</SelectItem>
                        <SelectItem value="condo">Condominium</SelectItem>
                        <SelectItem value="townhome">Townhome</SelectItem>
                        <SelectItem value="mobile_home">Mobile Home</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-gray-300">County</Label>
                    <Select
                      value={newPrediction.county}
                      onValueChange={(value) => setNewPrediction({...newPrediction, county: value})}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="Miami-Dade">Miami-Dade</SelectItem>
                        <SelectItem value="Broward">Broward</SelectItem>
                        <SelectItem value="Palm Beach">Palm Beach</SelectItem>
                        <SelectItem value="Orange">Orange</SelectItem>
                        <SelectItem value="Hillsborough">Hillsborough</SelectItem>
                        <SelectItem value="Pinellas">Pinellas</SelectItem>
                        <SelectItem value="Duval">Duval</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Estimated Damage *</Label>
                    <Input
                      type="number"
                      value={newPrediction.estimated_damage || ''}
                      onChange={(e) => setNewPrediction({...newPrediction, estimated_damage: parseInt(e.target.value) || 0})}
                      placeholder="75000"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Policy Limits</Label>
                    <Input
                      type="number"
                      value={newPrediction.policy_limits || ''}
                      onChange={(e) => setNewPrediction({...newPrediction, policy_limits: parseInt(e.target.value) || 0})}
                      placeholder="500000"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Deductible</Label>
                    <Input
                      type="number"
                      value={newPrediction.deductible || ''}
                      onChange={(e) => setNewPrediction({...newPrediction, deductible: parseInt(e.target.value) || 0})}
                      placeholder="2500"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300">Date of Loss *</Label>
                    <Input
                      type="date"
                      value={newPrediction.date_of_loss}
                      onChange={(e) => setNewPrediction({...newPrediction, date_of_loss: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-gray-300">Documentation Quality</Label>
                  <Select
                    value={newPrediction.documentation_quality}
                    onValueChange={(value: 'excellent' | 'good' | 'fair' | 'poor') =>
                      setNewPrediction({...newPrediction, documentation_quality: value})
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <input
                    type="checkbox"
                    id="legal-rep"
                    checked={newPrediction.legal_representation}
                    onChange={(e) => setNewPrediction({...newPrediction, legal_representation: e.target.checked})}
                    className="rounded border-gray-600 bg-gray-700"
                  />
                  <Label htmlFor="legal-rep" className="text-gray-300">
                    Legal Representation
                  </Label>
                </div>

                <div>
                  <Label className="text-gray-300">Insurance Carrier</Label>
                  <Input
                    value={newPrediction.insurance_carrier}
                    onChange={(e) => setNewPrediction({...newPrediction, insurance_carrier: e.target.value})}
                    placeholder="Citizens Property Insurance"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={generatePrediction}
                disabled={generating || !newPrediction.claim_id || !newPrediction.estimated_damage}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generating ? (
                  <>
                    <Activity className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Market Data & Generating Prediction...
                  </>
                ) : (
                  <>
                    <Gem className="h-4 w-4 mr-2" />
                    Generate Settlement Prediction
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
