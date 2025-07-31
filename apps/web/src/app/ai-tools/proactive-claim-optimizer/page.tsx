'use client'

import { Shield, CheckCircle, AlertTriangle, XCircle, FileText, TrendingUp, Search, Sparkles, ChevronRight, FileCheck, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'


interface OptimizationItem {
  id: string
  category: 'documentation' | 'evidence' | 'timeline' | 'communication' | 'coverage'
  severity: 'critical' | 'important' | 'suggestion'
  title: string
  description: string
  impact: string
  action: string
  completed: boolean
}

interface ClaimStrength {
  score: number
  category: 'weak' | 'fair' | 'good' | 'strong'
  factors: {
    documentation: number
    evidence: number
    timeline: number
    communication: number
    coverage: number
  }
}

export default function ProactiveClaimOptimizerPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [optimizationItems, setOptimizationItems] = useState<OptimizationItem[]>([])
  const [claimStrength, setClaimStrength] = useState<ClaimStrength | null>(null)
  const [successProbability, setSuccessProbability] = useState<number | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const { } = useAuth()

  // Simulated analysis data
  const mockOptimizationItems: OptimizationItem[] = [
    {
      id: '1',
      category: 'documentation',
      severity: 'critical',
      title: 'Missing Initial Damage Report',
      description: 'No initial damage assessment report found within 72 hours of incident',
      impact: 'Could reduce claim value by 15-20%',
      action: 'Upload initial photos and damage description from incident date',
      completed: false
    },
    {
      id: '2',
      category: 'evidence',
      severity: 'critical',
      title: 'Insufficient Photo Documentation',
      description: 'Only 3 photos provided. Insurance typically requires 10-15 detailed photos',
      impact: 'May lead to partial claim denial',
      action: 'Add wide-angle, close-up, and context photos of all damaged areas',
      completed: false
    },
    {
      id: '3',
      category: 'timeline',
      severity: 'important',
      title: 'Delayed Mitigation Documentation',
      description: 'No evidence of immediate damage mitigation efforts',
      impact: 'Could result in additional damage claims being denied',
      action: 'Document all temporary repairs and mitigation steps taken',
      completed: false
    },
    {
      id: '4',
      category: 'coverage',
      severity: 'important',
      title: 'Policy Coverage Verification Missing',
      description: 'No confirmation that damage type is covered under current policy',
      impact: 'Risk of claim denial if not covered',
      action: 'Review policy and confirm coverage for water damage',
      completed: false
    },
    {
      id: '5',
      category: 'documentation',
      severity: 'suggestion',
      title: 'Professional Assessment Recommended',
      description: 'No third-party professional damage assessment included',
      impact: 'Professional reports increase claim success by 35%',
      action: 'Consider getting contractor or restoration company estimate',
      completed: false
    },
    {
      id: '6',
      category: 'communication',
      severity: 'suggestion',
      title: 'Claim Narrative Enhancement',
      description: 'Current description lacks detail about damage cause and progression',
      impact: 'Clear narratives improve adjuster understanding',
      action: 'Add detailed timeline of events and damage discovery',
      completed: false
    }
  ]

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisComplete(false)

    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000))

    setOptimizationItems(mockOptimizationItems)
    
    // Calculate claim strength
    const strength: ClaimStrength = {
      score: 65,
      category: 'fair',
      factors: {
        documentation: 60,
        evidence: 55,
        timeline: 70,
        communication: 75,
        coverage: 65
      }
    }
    setClaimStrength(strength)
    setSuccessProbability(72)
    
    setIsAnalyzing(false)
    setAnalysisComplete(true)
    
    toast.success('Analysis complete! Found 6 optimization opportunities')
  }

  const toggleItemCompletion = (id: string) => {
    setOptimizationItems(items =>
      items.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
    
    // Recalculate claim strength
    const completedCount = optimizationItems.filter(item => 
      item.id === id ? !optimizationItems.find(i => i.id === id)?.completed : item.completed
    ).length + 1
    
    const newScore = Math.min(95, 65 + (completedCount * 5))
    const newProbability = Math.min(95, 72 + (completedCount * 4))
    
    setClaimStrength(prev => prev ? {
      ...prev,
      score: newScore,
      category: newScore >= 85 ? 'strong' : newScore >= 70 ? 'good' : newScore >= 50 ? 'fair' : 'weak'
    } : null)
    
    setSuccessProbability(newProbability)
    
    toast.success('Progress saved! Claim strength improved')
  }

  const filteredItems = selectedCategory === 'all' 
    ? optimizationItems 
    : optimizationItems.filter(item => item.category === selectedCategory)

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-400" />
      case 'important':
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />
      case 'suggestion':
        return <AlertCircle className="h-5 w-5 text-blue-400" />
      default:
        return null
    }
  }

  const getStrengthColor = (category: string) => {
    switch (category) {
      case 'strong':
        return 'text-green-400'
      case 'good':
        return 'text-blue-400'
      case 'fair':
        return 'text-yellow-400'
      case 'weak':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <Link 
                href="/ai-tools" 
                className="text-blue-400 hover:text-blue-300 text-sm mb-4 inline-block"
              >
                ← Back to AI Tools
              </Link>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 rounded-lg">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Proactive Claim Optimizer</h1>
                <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                  Beta
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                It caught issues I never would have noticed! Pre-submission review with claim strength scoring and optimization recommendations.
              </p>
            </div>

            {/* Quick Start */}
            {!analysisComplete && (
              <Card className="bg-gradient-to-r from-blue-900/20 to-emerald-900/20 border-blue-600/30">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Ready to Optimize Your Claim?</h3>
                      <p className="text-gray-300">
                        Our AI will analyze your claim documents and identify opportunities to strengthen your case before submission.
                      </p>
                    </div>
                    <Button
                      onClick={runAnalysis}
                      disabled={isAnalyzing}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Analyzing Claim...
                        </>
                      ) : (
                        <>
                          <Search className="h-5 w-5 mr-2" />
                          Start Analysis
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
                      <div>
                        <h3 className="text-lg font-semibold text-white">Analyzing Your Claim</h3>
                        <p className="text-sm text-gray-400">This typically takes 10-30 seconds</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Reviewing documentation completeness
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        Analyzing evidence quality
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                        Checking timeline compliance
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-4 h-4" />
                        Evaluating success probability
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results */}
            {analysisComplete && (
              <>
                {/* Claim Strength Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-400" />
                        Claim Strength
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getStrengthColor(claimStrength?.category || '')}`}>
                          {claimStrength?.score}%
                        </div>
                        <Badge className={`mt-2 ${
                          claimStrength?.category === 'strong' ? 'bg-green-600/20 text-green-400' :
                          claimStrength?.category === 'good' ? 'bg-blue-600/20 text-blue-400' :
                          claimStrength?.category === 'fair' ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-red-600/20 text-red-400'
                        }`}>
                          {claimStrength?.category?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-4 space-y-2">
                        {Object.entries(claimStrength?.factors || {}).map(([key, value]) => (
                          <div key={key}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-400 capitalize">{key}</span>
                              <span className="text-gray-300">{value}%</span>
                            </div>
                            <Progress value={value} className="h-1" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                        Success Probability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-blue-400">
                          {successProbability}%
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          Likelihood of full approval
                        </p>
                      </div>
                      <Alert className="mt-4 bg-blue-900/20 border-blue-600/30">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-200 text-sm">
                          Complete critical items to increase success rate to 85%+
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-green-400" />
                        Optimization Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-green-400">
                          {optimizationItems.filter(item => item.completed).length}/{optimizationItems.length}
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          Items completed
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Badge className="bg-red-600/20 text-red-400">
                            {optimizationItems.filter(item => item.severity === 'critical' && !item.completed).length}
                          </Badge>
                          <span className="text-gray-400">Critical items remaining</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Badge className="bg-yellow-600/20 text-yellow-400">
                            {optimizationItems.filter(item => item.severity === 'important' && !item.completed).length}
                          </Badge>
                          <span className="text-gray-400">Important items remaining</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filter Buttons */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('all')}
                    className={selectedCategory === 'all' ? 'bg-blue-600' : 'bg-gray-700'}
                  >
                    All Items ({optimizationItems.length})
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCategory === 'documentation' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('documentation')}
                    className={selectedCategory === 'documentation' ? 'bg-blue-600' : 'bg-gray-700'}
                  >
                    Documentation
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCategory === 'evidence' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('evidence')}
                    className={selectedCategory === 'evidence' ? 'bg-blue-600' : 'bg-gray-700'}
                  >
                    Evidence
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCategory === 'timeline' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('timeline')}
                    className={selectedCategory === 'timeline' ? 'bg-blue-600' : 'bg-gray-700'}
                  >
                    Timeline
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCategory === 'communication' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('communication')}
                    className={selectedCategory === 'communication' ? 'bg-blue-600' : 'bg-gray-700'}
                  >
                    Communication
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedCategory === 'coverage' ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory('coverage')}
                    className={selectedCategory === 'coverage' ? 'bg-blue-600' : 'bg-gray-700'}
                  >
                    Coverage
                  </Button>
                </div>

                {/* Optimization Items */}
                <div className="space-y-4">
                  {filteredItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className={`bg-gray-800 border-gray-700 ${item.completed ? 'opacity-75' : ''}`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            {item.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-400" />
                            ) : (
                              getSeverityIcon(item.severity)
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className={`text-lg font-semibold ${item.completed ? 'text-gray-500 line-through' : 'text-white'}`}>
                                {item.title}
                              </h3>
                              <Badge className={
                                item.severity === 'critical' ? 'bg-red-600/20 text-red-400' :
                                item.severity === 'important' ? 'bg-yellow-600/20 text-yellow-400' :
                                'bg-blue-600/20 text-blue-400'
                              }>
                                {item.severity}
                              </Badge>
                            </div>
                            <p className="text-gray-400 mb-3">{item.description}</p>
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                                <span className="text-yellow-200">Impact: {item.impact}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <ChevronRight className="h-4 w-4 text-blue-400" />
                                <span className="text-blue-200">Action: {item.action}</span>
                              </div>
                            </div>
                            <Button
                              onClick={() => toggleItemCompletion(item.id)}
                              size="sm"
                              variant={item.completed ? 'outline' : 'default'}
                              className={item.completed ? 'bg-gray-700' : 'bg-blue-600'}
                            >
                              {item.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Export Options */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Export Optimization Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="bg-gray-700 hover:bg-gray-600"
                        onClick={() => toast.success('Report exported as PDF')}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Export as PDF
                      </Button>
                      <Button
                        variant="outline"
                        className="bg-gray-700 hover:bg-gray-600"
                        onClick={() => toast.success('Checklist copied to clipboard')}
                      >
                        <FileCheck className="h-4 w-4 mr-2" />
                        Copy Checklist
                      </Button>
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