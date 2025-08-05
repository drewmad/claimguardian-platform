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

import { Target, FlaskConical, BarChart3, TrendingUp, Users, CheckCircle, Star, ThumbsUp, ThumbsDown, Play, Pause, Settings, Eye, MoreHorizontal } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { liquidGlass } from '@/lib/styles/liquid-glass'

interface ABTest {
  id: string
  name: string
  feature_id: string
  model_a: string
  model_b: string
  status: 'draft' | 'running' | 'paused' | 'completed'
  traffic_split: number
  start_date: string
  end_date?: string
  metrics: {
    model_a: {
      requests: number
      avg_time: number
      success_rate: number
      user_rating: number
    }
    model_b: {
      requests: number
      avg_time: number
      success_rate: number
      user_rating: number
    }
  }
  quality_feedback: {
    total_responses: number
    helpful_percentage: number
    avg_accuracy_rating: number
    variant_a_satisfaction: number
    variant_b_satisfaction: number
  }
}

interface QualityFeedback {
  id: string
  test_id: string
  variant: 'A' | 'B'
  helpful: boolean | null
  accuracy: number | null
  comment: string
  timestamp: string
  feature_id: string
}

// Mock data - replace with real API calls
const MOCK_AB_TESTS: ABTest[] = [
  {
    id: 'test_damage_analyzer_001',
    name: 'Damage Analyzer Model Comparison',
    feature_id: 'damage-analyzer',
    model_a: 'gpt-4-vision',
    model_b: 'gemini-1.5-pro',
    status: 'running',
    traffic_split: 50,
    start_date: '2025-01-15',
    end_date: '2025-02-15',
    metrics: {
      model_a: {
        requests: 1247,
        avg_time: 2.3,
        success_rate: 98.2,
        user_rating: 4.3
      },
      model_b: {
        requests: 1198,
        avg_time: 1.8,
        success_rate: 97.1,
        user_rating: 4.1
      }
    },
    quality_feedback: {
      total_responses: 456,
      helpful_percentage: 87.3,
      avg_accuracy_rating: 4.2,
      variant_a_satisfaction: 4.3,
      variant_b_satisfaction: 4.1
    }
  },
  {
    id: 'test_policy_chat_002',
    name: 'Policy Chat Optimization',
    feature_id: 'policy-chat',
    model_a: 'gpt-4-turbo',
    model_b: 'claude-3-opus',
    status: 'running',
    traffic_split: 50,
    start_date: '2025-01-10',
    end_date: '2025-02-10',
    metrics: {
      model_a: {
        requests: 2341,
        avg_time: 1.5,
        success_rate: 99.1,
        user_rating: 4.5
      },
      model_b: {
        requests: 2287,
        avg_time: 1.9,
        success_rate: 98.8,
        user_rating: 4.4
      }
    },
    quality_feedback: {
      total_responses: 789,
      helpful_percentage: 91.2,
      avg_accuracy_rating: 4.4,
      variant_a_satisfaction: 4.5,
      variant_b_satisfaction: 4.4
    }
  },
  {
    id: 'test_settlement_003',
    name: 'Settlement Analysis Enhancement',
    feature_id: 'settlement-analyzer',
    model_a: 'gpt-4-turbo',
    model_b: 'gemini-1.5-pro',
    status: 'completed',
    traffic_split: 50,
    start_date: '2024-12-01',
    end_date: '2025-01-01',
    metrics: {
      model_a: {
        requests: 567,
        avg_time: 3.1,
        success_rate: 96.8,
        user_rating: 4.0
      },
      model_b: {
        requests: 543,
        avg_time: 2.4,
        success_rate: 98.3,
        user_rating: 4.2
      }
    },
    quality_feedback: {
      total_responses: 234,
      helpful_percentage: 84.6,
      avg_accuracy_rating: 4.1,
      variant_a_satisfaction: 4.0,
      variant_b_satisfaction: 4.2
    }
  }
]

const MOCK_RECENT_FEEDBACK: QualityFeedback[] = [
  {
    id: 'fb_001',
    test_id: 'test_damage_analyzer_001',
    variant: 'A',
    helpful: true,
    accuracy: 5,
    comment: 'Very accurate damage assessment, helped me understand what to expect.',
    timestamp: '2025-01-20T14:30:00Z',
    feature_id: 'damage-analyzer'
  },
  {
    id: 'fb_002',
    test_id: 'test_policy_chat_002',
    variant: 'B',
    helpful: true,
    accuracy: 4,
    comment: 'Good explanations but could be more detailed about exclusions.',
    timestamp: '2025-01-20T13:45:00Z',
    feature_id: 'policy-chat'
  },
  {
    id: 'fb_003',
    test_id: 'test_damage_analyzer_001',
    variant: 'B',
    helpful: false,
    accuracy: 2,
    comment: 'Analysis seemed off - estimated much higher damage than actual.',
    timestamp: '2025-01-20T12:15:00Z',
    feature_id: 'damage-analyzer'
  }
]

export function ABTestDashboard() {
  const [abTests, setAbTests] = useState<ABTest[]>([])
  const [recentFeedback, setRecentFeedback] = useState<QualityFeedback[]>([])
  const [selectedTest, setSelectedTest] = useState<ABTest | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load A/B tests from API
    const loadABTests = async () => {
      try {
        setLoading(true)
        // In production, this would be:
        // const response = await fetch('/api/admin/ab-tests')
        // const data = await response.json()
        // setAbTests(data.tests)
        
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, 500))
        setAbTests(MOCK_AB_TESTS)
        setRecentFeedback(MOCK_RECENT_FEEDBACK)
      } catch (error) {
        toast.error('Failed to load A/B tests')
      } finally {
        setLoading(false)
      }
    }

    loadABTests()
  }, [])

  const getStatusBadge = (status: ABTest['status']) => {
    const configs = {
      draft: { color: 'bg-gray-600/20 text-gray-400 border-gray-600/30', icon: Settings },
      running: { color: 'bg-green-600/20 text-green-400 border-green-600/30', icon: Play },
      paused: { color: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30', icon: Pause },
      completed: { color: 'bg-blue-600/20 text-blue-400 border-blue-600/30', icon: CheckCircle }
    }
    
    const config = configs[status]
    const Icon = config.icon
    
    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const calculateWinner = (test: ABTest) => {
    const { model_a, model_b } = test.metrics
    const scoreA = (model_a.success_rate * 0.4) + (model_a.user_rating * 20) + ((3000 - model_a.avg_time * 1000) / 30)
    const scoreB = (model_b.success_rate * 0.4) + (model_b.user_rating * 20) + ((3000 - model_b.avg_time * 1000) / 30)
    
    if (Math.abs(scoreA - scoreB) < 5) return 'tie'
    return scoreA > scoreB ? 'A' : 'B'
  }

  const runningTests = abTests.filter(test => test.status === 'running')
  const completedTests = abTests.filter(test => test.status === 'completed')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <FlaskConical className="h-7 w-7 text-purple-400" />
            A/B Test Monitoring
          </h2>
          <p className="text-gray-400">Monitor and analyze AI model performance tests</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            <BarChart3 className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button size="sm">
            <Target className="mr-2 h-4 w-4" />
            Create Test
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className={liquidGlass.cards.default}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tests</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningTests.length}</div>
            <p className="text-xs text-muted-foreground">
              {abTests.filter(t => t.status === 'draft').length} draft
            </p>
          </CardContent>
        </Card>

        <Card className={liquidGlass.cards.default}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {abTests.reduce((sum, test) => sum + test.metrics.model_a.requests + test.metrics.model_b.requests, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className={liquidGlass.cards.default}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Feedback Responses</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {abTests.reduce((sum, test) => sum + test.quality_feedback.total_responses, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(abTests.reduce((sum, test) => sum + test.quality_feedback.helpful_percentage, 0) / abTests.length).toFixed(1)}% helpful
            </p>
          </CardContent>
        </Card>

        <Card className={liquidGlass.cards.default}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Quality Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(abTests.reduce((sum, test) => sum + test.quality_feedback.avg_accuracy_rating, 0) / abTests.length).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0 stars</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="active">Active Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed Tests</TabsTrigger>
          <TabsTrigger value="feedback">Quality Feedback</TabsTrigger>
        </TabsList>

        {/* Active Tests */}
        <TabsContent value="active" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {runningTests.map((test) => (
              <Card key={test.id} className={liquidGlass.cards.default}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                      <CardDescription>Feature: {test.feature_id}</CardDescription>
                    </div>
                    {getStatusBadge(test.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Model Comparison */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-green-300">Variant A</span>
                        <Badge variant="outline" className="text-xs">{test.model_a}</Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Requests:</span>
                          <span className="text-white">{test.metrics.model_a.requests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Success:</span>
                          <span className="text-white">{test.metrics.model_a.success_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rating:</span>
                          <span className="text-white">{test.metrics.model_a.user_rating}/5</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-900/20 border border-purple-600/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-purple-300">Variant B</span>
                        <Badge variant="outline" className="text-xs">{test.model_b}</Badge>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Requests:</span>
                          <span className="text-white">{test.metrics.model_b.requests}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Success:</span>
                          <span className="text-white">{test.metrics.model_b.success_rate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rating:</span>
                          <span className="text-white">{test.metrics.model_b.user_rating}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress and Actions */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Test Progress</span>
                      <span className="text-white">
                        {Math.round(((new Date().getTime() - new Date(test.start_date).getTime()) / 
                        (new Date(test.end_date!).getTime() - new Date(test.start_date).getTime())) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={Math.round(((new Date().getTime() - new Date(test.start_date).getTime()) / 
                      (new Date(test.end_date!).getTime() - new Date(test.start_date).getTime())) * 100)} 
                      className="h-2" 
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button variant="outline" size="sm">
                      <Pause className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Completed Tests */}
        <TabsContent value="completed" className="space-y-6">
          <div className="space-y-4">
            {completedTests.map((test) => {
              const winner = calculateWinner(test)
              return (
                <Card key={test.id} className={liquidGlass.cards.default}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{test.name}</h3>
                        <p className="text-sm text-gray-400">
                          {test.start_date} → {test.end_date} • Feature: {test.feature_id}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {winner !== 'tie' && (
                          <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                            <Target className="w-3 h-3 mr-1" />
                            Variant {winner} Winner
                          </Badge>
                        )}
                        {getStatusBadge(test.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Results Summary */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-white">Results Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Total Requests:</span>
                            <span className="text-white">
                              {(test.metrics.model_a.requests + test.metrics.model_b.requests).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Feedback Rate:</span>
                            <span className="text-white">
                              {((test.quality_feedback.total_responses / (test.metrics.model_a.requests + test.metrics.model_b.requests)) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Avg Quality:</span>
                            <span className="text-white">{test.quality_feedback.avg_accuracy_rating}/5</span>
                          </div>
                        </div>
                      </div>

                      {/* Variant A Results */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-green-300">Variant A ({test.model_a})</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Success Rate:</span>
                            <span className="text-white">{test.metrics.model_a.success_rate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Avg Response:</span>
                            <span className="text-white">{test.metrics.model_a.avg_time}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">User Rating:</span>
                            <span className="text-white">{test.metrics.model_a.user_rating}/5</span>
                          </div>
                        </div>
                      </div>

                      {/* Variant B Results */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-purple-300">Variant B ({test.model_b})</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Success Rate:</span>
                            <span className="text-white">{test.metrics.model_b.success_rate}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Avg Response:</span>
                            <span className="text-white">{test.metrics.model_b.avg_time}s</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">User Rating:</span>
                            <span className="text-white">{test.metrics.model_b.user_rating}/5</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Quality Feedback */}
        <TabsContent value="feedback" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feedback Overview */}
            <Card className={liquidGlass.cards.default}>
              <CardHeader>
                <CardTitle>Feedback Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Total Responses</span>
                    <span className="font-semibold text-white">
                      {abTests.reduce((sum, test) => sum + test.quality_feedback.total_responses, 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Helpful Rate</span>
                    <span className="font-semibold text-green-400">
                      {(abTests.reduce((sum, test) => sum + test.quality_feedback.helpful_percentage, 0) / abTests.length).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Avg Accuracy</span>
                    <span className="font-semibold text-yellow-400">
                      {(abTests.reduce((sum, test) => sum + test.quality_feedback.avg_accuracy_rating, 0) / abTests.length).toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <div className="lg:col-span-2">
              <Card className={liquidGlass.cards.default}>
                <CardHeader>
                  <CardTitle>Recent Feedback</CardTitle>
                  <CardDescription>Latest quality feedback from users</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentFeedback.map((feedback) => (
                      <div key={feedback.id} className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge className={`text-xs ${
                              feedback.variant === 'A' 
                                ? 'bg-green-600/20 text-green-300 border-green-600/30' 
                                : 'bg-purple-600/20 text-purple-300 border-purple-600/30'
                            }`}>
                              Variant {feedback.variant}
                            </Badge>
                            <span className="text-sm text-gray-400">{feedback.feature_id}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {feedback.helpful ? (
                              <ThumbsUp className="w-4 h-4 text-green-400" />
                            ) : (
                              <ThumbsDown className="w-4 h-4 text-red-400" />
                            )}
                            {feedback.accuracy && (
                              <div className="flex items-center gap-1 ml-2">
                                <Star className="w-4 h-4 text-yellow-400" />
                                <span className="text-sm text-white">{feedback.accuracy}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {feedback.comment && (
                          <p className="text-sm text-gray-300 mb-2">"{feedback.comment}"</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(feedback.timestamp).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}