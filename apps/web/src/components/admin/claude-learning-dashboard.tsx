/**
 * @fileMetadata
 * @purpose Admin dashboard for monitoring Claude's learning and error patterns
 * @owner ai-team
 * @dependencies ["@/lib/claude/claude-error-logger", "recharts", "lucide-react"]
 * @exports ["ClaudeLearningDashboard"]
 * @complexity high
 * @tags ["claude", "dashboard", "admin", "analytics", "learning"]
 * @status active
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  Clock,
  Target,
  Zap
} from 'lucide-react'
import { claudeErrorLogger } from '@/lib/claude/claude-error-logger'

interface ErrorPattern {
  pattern: string
  count: number
  resolved: number
  severity: { low: number; medium: number; high: number; critical: number }
}

interface Learning {
  id: string
  pattern_name: string
  mistake_pattern: string
  solution_pattern: string
  confidence_score: number
  usage_count: number
  success_rate: number
}

interface ClaudeStats {
  totalErrors: number
  resolvedErrors: number
  resolutionRate: number
  learningsCount: number
  averageConfidence: number
  topPatterns: ErrorPattern[]
  recentLearnings: Learning[]
}

export function ClaudeLearningDashboard() {
  const [stats, setStats] = useState<ClaudeStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week')

  useEffect(() => {
    loadClaudeStats()
  }, [timeRange])

  const loadClaudeStats = async () => {
    setLoading(true)
    try {
      // Get error patterns
      const patterns = await claudeErrorLogger.getErrorPatterns(timeRange)
      
      // Get recent learnings (mock for now - would need API endpoint)
      const learnings = await claudeErrorLogger.getRelevantLearnings({})
      
      // Calculate stats
      const totalErrors = patterns.reduce((sum, p) => sum + p.count, 0)
      const resolvedErrors = patterns.reduce((sum, p) => sum + p.resolved, 0)
      const resolutionRate = totalErrors > 0 ? (resolvedErrors / totalErrors) * 100 : 0
      
      setStats({
        totalErrors,
        resolvedErrors,
        resolutionRate,
        learningsCount: learnings.length,
        averageConfidence: learnings.length > 0 
          ? learnings.reduce((sum, l) => sum + l.confidence_score, 0) / learnings.length 
          : 0,
        topPatterns: patterns.slice(0, 10),
        recentLearnings: learnings.slice(0, 5)
      })
    } catch (error) {
      console.error('Failed to load Claude stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getResolutionRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Claude Learning Dashboard</h1>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Unable to Load Claude Stats</h2>
        <p className="text-gray-600 mb-4">There was an error loading the learning dashboard.</p>
        <Button onClick={loadClaudeStats}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Claude Learning Dashboard</h1>
          <Badge variant="secondary">AI Improvement Tracking</Badge>
        </div>
        
        <div className="flex space-x-2">
          {(['day', 'week', 'month'] as const).map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalErrors}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Last {timeRange === 'day' ? '24 hours' : timeRange === 'week' ? '7 days' : '30 days'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolution Rate</p>
                <p className={`text-2xl font-bold ${getResolutionRateColor(stats.resolutionRate)}`}>
                  {stats.resolutionRate.toFixed(1)}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats.resolvedErrors} of {stats.totalErrors} resolved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Learnings</p>
                <p className="text-2xl font-bold text-blue-600">{stats.learningsCount}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Patterns learned and applied
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(stats.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <Zap className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Learning confidence score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Error Patterns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Top Error Patterns</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.topPatterns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No errors in the selected time range!</p>
                <p className="text-sm">Claude is performing perfectly.</p>
              </div>
            ) : (
              stats.topPatterns.map((pattern, index) => (
                <div key={pattern.pattern} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <h4 className="font-medium text-sm">{pattern.pattern}</h4>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                      <span>{pattern.count} occurrences</span>
                      <span className={getResolutionRateColor((pattern.resolved / pattern.count) * 100)}>
                        {pattern.resolved} resolved
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1">
                    {Object.entries(pattern.severity).map(([level, count]) => 
                      count > 0 && (
                        <Badge key={level} variant="secondary" className={`${getSeverityColor(level)} text-xs`}>
                          {level}: {count}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Learnings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Learnings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.recentLearnings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Brain className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                <p>No learnings recorded yet.</p>
                <p className="text-sm">Learnings will appear as Claude resolves errors.</p>
              </div>
            ) : (
              stats.recentLearnings.map((learning) => (
                <div key={learning.id} className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-blue-900">{learning.pattern_name}</h4>
                      <p className="text-xs text-blue-700 mt-1 line-clamp-2">
                        {learning.solution_pattern}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-1 ml-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                        {(learning.confidence_score * 100).toFixed(0)}%
                      </Badge>
                      <span className="text-xs text-blue-600">
                        Used {learning.usage_count}x
                      </span>
                    </div>
                  </div>
                  
                  {learning.success_rate < 1.0 && (
                    <div className="mt-2 flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs text-yellow-700">
                        {(learning.success_rate * 100).toFixed(0)}% success rate - needs refinement
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2">Most Improved Areas</h4>
              {stats.topPatterns
                .filter(p => (p.resolved / p.count) > 0.8)
                .slice(0, 3)
                .map(p => (
                  <div key={p.pattern} className="text-sm text-green-700 mb-1">
                    • {p.pattern} ({((p.resolved / p.count) * 100).toFixed(0)}% resolved)
                  </div>
                ))}
              {stats.topPatterns.filter(p => (p.resolved / p.count) > 0.8).length === 0 && (
                <p className="text-sm text-green-700">Keep working on error resolution!</p>
              )}
            </div>

            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2">Needs Attention</h4>
              {stats.topPatterns
                .filter(p => (p.resolved / p.count) < 0.5)
                .slice(0, 3)
                .map(p => (
                  <div key={p.pattern} className="text-sm text-yellow-700 mb-1">
                    • {p.pattern} ({((p.resolved / p.count) * 100).toFixed(0)}% resolved)
                  </div>
                ))}
              {stats.topPatterns.filter(p => (p.resolved / p.count) < 0.5).length === 0 && (
                <p className="text-sm text-yellow-700">Great! No patterns need immediate attention.</p>
              )}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">Learning Progress</h4>
              <div className="space-y-1 text-sm text-blue-700">
                <div>• {stats.learningsCount} active learning patterns</div>
                <div>• {(stats.averageConfidence * 100).toFixed(0)}% average confidence</div>
                <div>• {stats.resolutionRate.toFixed(0)}% overall resolution rate</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}