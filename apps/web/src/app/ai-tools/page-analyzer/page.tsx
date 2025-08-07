/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose AI-powered webpage analysis tool for SEO, accessibility, and content quality
 * @dependencies ["react", "lucide-react", "sonner", "@claimguardian/ui", "@claimguardian/utils"]
 * @status active
 * @ai-integration multi-provider
 * @insurance-context general
 * @supabase-integration edge-functions
 */
'use client'

import { Globe, Search, CheckCircle, Sparkles, FileText, Download, Loader2, Accessibility, Zap, Target, ThumbsUp, ThumbsDown, Star, ExternalLink, FlaskConical } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

import { createClient } from '@/lib/supabase/client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { AIBreadcrumb } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FeatureLimitBadge } from '@/components/subscription/subscription-gate'
import { useSubscription } from '@/hooks/use-subscription'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// --- TYPES ---

interface AnalysisResult {
  seo: {
    score: number
    title: string
    description: string
    headings: { h1: number; h2: number; h3: number }
    keywords: string[]
    issues: string[]
    recommendations: string[]
  }
  accessibility: {
    score: number
    issues: string[]
    recommendations: string[]
  }
  performance: {
    score: number
    loadTime: number
    pageSize: string
    issues: string[]
    recommendations: string[]
  }
  content: {
    wordCount: number
    readabilityScore: number
    language: string
    summary: string
    mainTopics: string[]
  }
  insurance?: {
    relevantTopics: string[]
    insuranceTerms: string[]
    claimRelated: boolean
  }
}

// --- UI COMPONENTS ---

function PageAnalyzerContent() {
  const subscription = useSubscription()
  const supabase = createClient()

  const [step, setStep] = useState<'input' | 'analyzing' | 'result'>('input')
  const [url, setUrl] = useState('')
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'seo' | 'accessibility' | 'performance'>('comprehensive')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)

  // A/B Testing and Quality Feedback state
  const [abTestInfo, setAbTestInfo] = useState<{
    testId: string
    variant: 'A' | 'B'
    modelUsed: string
  } | null>(null)
  const [qualityFeedback, setQualityFeedback] = useState<{
    helpful: boolean | null
    accuracy: number | null
    comment: string
  }>({ helpful: null, accuracy: null, comment: '' })
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  const progressSteps = [
    { step: 10, message: 'Fetching webpage content...' },
    { step: 30, message: 'Analyzing page structure...' },
    { step: 50, message: 'Evaluating SEO metrics...' },
    { step: 70, message: 'Checking accessibility...' },
    { step: 90, message: 'Generating recommendations...' },
    { step: 100, message: 'Analysis complete!' }
  ]

  const validateUrl = (inputUrl: string): boolean => {
    try {
      const urlObj = new URL(inputUrl)
      return ['http:', 'https:'].includes(urlObj.protocol)
    } catch {
      return false
    }
  }

  const handleAnalyze = async () => {
    if (!validateUrl(url)) {
      toast.error('Please enter a valid URL')
      return
    }

    setIsLoading(true)
    setStep('analyzing')
    setAnalysisProgress(0)

    try {
      // Simulate progress
      for (const { step, message } of progressSteps) {
        setAnalysisProgress(step)
        logger.info(message)
        if (step < 100) {
          await new Promise(resolve => setTimeout(resolve, 800))
        }
      }

      // Call edge function for page analysis
      const { data, error } = await supabase.functions.invoke('page-analyzer', {
        body: {
          url,
          analysisType
        }
      })

      if (error) {
        throw error
      }

      setAnalysisResult(data.analysis)
      setAbTestInfo(data.abTestInfo)
      setStep('result')
      toast.success('Page analysis completed!')

    } catch (error) {
      logger.error('Page analysis failed:', toError(error))
      toast.error('Failed to analyze page. Please try again.')
      setStep('input')
    } finally {
      setIsLoading(false)
      setAnalysisProgress(0)
    }
  }

  const handleExportResults = () => {
    if (!analysisResult) return

    const exportData = {
      url,
      timestamp: new Date().toISOString(),
      analysisType,
      results: analysisResult
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const downloadUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `page-analysis-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(downloadUrl)

    toast.success('Analysis results exported!')
  }

  const submitQualityFeedback = async () => {
    if (!abTestInfo || feedbackSubmitted) return

    try {
      await fetch('/api/ai/quality-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_id: 'page-analyzer',
          test_id: abTestInfo.testId,
          variant: abTestInfo.variant,
          model_used: abTestInfo.modelUsed,
          helpful: qualityFeedback.helpful,
          accuracy: qualityFeedback.accuracy,
          comment: qualityFeedback.comment,
          user_id: null
        })
      })

      setFeedbackSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch (error) {
      logger.error('Failed to submit quality feedback:', toError(error))
      toast.error('Failed to submit feedback')
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <div className="mb-8">
        <AIBreadcrumb
          section="AI Tools"
          page="Page Analyzer"
        />

        <div className="flex items-center justify-between mt-4">
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
              <Globe className="h-10 w-10 text-purple-400" />
              AI Page Analyzer
            </h1>
            <p className="text-gray-400 mt-2">
              Analyze any webpage for SEO, accessibility, performance, and content quality
            </p>
          </div>
          <FeatureLimitBadge feature="aiRequests" />
        </div>
      </div>

      {/* Input Step */}
      {step === 'input' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter URL to Analyze
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url" className="text-gray-300">Website URL</Label>
              <div className="flex gap-2">
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="bg-gray-700 border-gray-600 text-white flex-1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(url, '_blank')}
                  disabled={!validateUrl(url)}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="analysis-type" className="text-gray-300">Analysis Type</Label>
              <Select value={analysisType} onValueChange={(value: typeof analysisType) => setAnalysisType(value)}>
                <SelectTrigger id="analysis-type" className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                  <SelectItem value="seo">SEO Focus</SelectItem>
                  <SelectItem value="accessibility">Accessibility Focus</SelectItem>
                  <SelectItem value="performance">Performance Focus</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Search className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">SEO Analysis</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Accessibility className="h-8 w-8 text-green-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Accessibility</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Performance</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <FileText className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                <p className="text-sm text-gray-300">Content Quality</p>
              </div>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={!url || isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Analyze Page
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Analyzing Step */}
      {step === 'analyzing' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Analyzing Page
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={analysisProgress} className="h-3" />
            <p className="text-center text-gray-400">
              {progressSteps.find(s => s.step >= analysisProgress)?.message || 'Starting analysis...'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Results Step */}
      {step === 'result' && analysisResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* SEO Score */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Search className="h-8 w-8 text-blue-400" />
                  <span className="text-3xl font-bold text-white">{analysisResult.seo.score}%</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">SEO Score</h3>
                <p className="text-sm text-gray-400">{analysisResult.seo.issues.length} issues found</p>
              </CardContent>
            </Card>

            {/* Accessibility Score */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Accessibility className="h-8 w-8 text-green-400" />
                  <span className="text-3xl font-bold text-white">{analysisResult.accessibility.score}%</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Accessibility</h3>
                <p className="text-sm text-gray-400">{analysisResult.accessibility.issues.length} issues found</p>
              </CardContent>
            </Card>

            {/* Performance Score */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Zap className="h-8 w-8 text-yellow-400" />
                  <span className="text-3xl font-bold text-white">{analysisResult.performance.score}%</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Performance</h3>
                <p className="text-sm text-gray-400">{analysisResult.performance.loadTime}s load time</p>
              </CardContent>
            </Card>

            {/* Content Quality */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <FileText className="h-8 w-8 text-purple-400" />
                  <span className="text-3xl font-bold text-white">{analysisResult.content.readabilityScore}%</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Readability</h3>
                <p className="text-sm text-gray-400">{analysisResult.content.wordCount} words</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SEO Details */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  SEO Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Page Title</p>
                  <p className="text-white">{analysisResult.seo.title || 'No title found'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-1">Meta Description</p>
                  <p className="text-white text-sm">{analysisResult.seo.description || 'No description found'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Heading Structure</p>
                  <div className="flex gap-4 text-sm">
                    <Badge variant="secondary">H1: {analysisResult.seo.headings.h1}</Badge>
                    <Badge variant="secondary">H2: {analysisResult.seo.headings.h2}</Badge>
                    <Badge variant="secondary">H3: {analysisResult.seo.headings.h3}</Badge>
                  </div>
                </div>
                {analysisResult.seo.recommendations.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Recommendations</p>
                    <ul className="space-y-1">
                      {analysisResult.seo.recommendations.slice(0, 3).map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Summary */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400 mb-1">Summary</p>
                  <p className="text-white text-sm">{analysisResult.content.summary}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Main Topics</p>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.content.mainTopics.map((topic, idx) => (
                      <Badge key={idx} variant="secondary">{topic}</Badge>
                    ))}
                  </div>
                </div>
                {analysisResult.insurance && analysisResult.insurance.relevantTopics.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Insurance-Related Content</p>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.insurance.relevantTopics.map((topic, idx) => (
                        <Badge key={idx} className="bg-blue-600 text-white">{topic}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quality Feedback Section */}
          {abTestInfo && !feedbackSubmitted && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Help Us Improve
                  <Badge variant="secondary" className="ml-2">
                    <FlaskConical className="h-3 w-3 mr-1" />
                    A/B Test
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-400">Was this analysis helpful?</span>
                  <div className="flex gap-2">
                    <Button
                      variant={qualityFeedback.helpful === true ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQualityFeedback(prev => ({ ...prev, helpful: true }))}
                    >
                      <ThumbsUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={qualityFeedback.helpful === false ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQualityFeedback(prev => ({ ...prev, helpful: false }))}
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <span className="text-sm text-gray-400 block mb-2">Rate the accuracy:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        variant={qualityFeedback.accuracy === rating ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQualityFeedback(prev => ({ ...prev, accuracy: rating }))}
                      >
                        <Star className={`h-4 w-4 ${qualityFeedback.accuracy && qualityFeedback.accuracy >= rating ? 'fill-current' : ''}`} />
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={submitQualityFeedback}
                  disabled={qualityFeedback.helpful === null || qualityFeedback.accuracy === null}
                  className="w-full"
                >
                  Submit Feedback
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={() => {
                setStep('input')
                setAnalysisResult(null)
                setQualityFeedback({ helpful: null, accuracy: null, comment: '' })
                setFeedbackSubmitted(false)
              }}
              variant="outline"
              className="flex-1"
            >
              Analyze Another Page
            </Button>
            <Button
              onClick={handleExportResults}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Results
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

export default function PageAnalyzerPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PageAnalyzerContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
