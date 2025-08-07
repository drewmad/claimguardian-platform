/**
 * @fileMetadata
 * @owner @ai-team
 * @purpose "Evidence Curator Dashboard - AI-powered evidence management with gap detection"
 * @dependencies ["react", "date-fns", "lucide-react", "@/lib/services/evidence-curator"]
 * @status stable
 * @ai-integration evidence-analysis
 * @insurance-context evidence-management
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  FileText,
  Upload,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Camera,
  Search,
  Filter,
  Download,
  Star,
  Zap,
  Brain,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Workflow,
  Archive,
  FolderOpen,
  FileCheck,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Plus
} from 'lucide-react'
import { format } from 'date-fns'
import {
  evidenceCuratorService,
  type EvidenceItem,
  type EvidenceWorkflow,
  type EvidenceGap,
  type EvidenceAnalytics,
  type EvidenceCategory
} from '@/lib/services/evidence-curator'
import { toast } from 'sonner'

interface FileUpload {
  file: File
  preview?: string
  uploading: boolean
  analyzed: boolean
}

export function EvidenceWorkflowDashboard() {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([])
  const [workflows, setWorkflows] = useState<EvidenceWorkflow[]>([])
  const [gaps, setGaps] = useState<EvidenceGap[]>([])
  const [analytics, setAnalytics] = useState<EvidenceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<EvidenceCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([])

  // Mock claim ID - replace with actual claim context
  const claimId = 'claim-2024-001'

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [evidenceData, workflowData, gapsData, analyticsData] = await Promise.all([
        evidenceCuratorService.getClaimEvidence(claimId),
        evidenceCuratorService.getClaimWorkflow(claimId),
        evidenceCuratorService.identifyEvidenceGaps(claimId),
        evidenceCuratorService.getEvidenceAnalytics()
      ])

      setEvidence(evidenceData)
      setWorkflows(workflowData ? [workflowData] : [])
      setGaps(gapsData)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error loading evidence data:', error)
      toast.error('Failed to load evidence data')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = useCallback(async (files: FileList) => {
    const newUploads: FileUpload[] = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
      uploading: true,
      analyzed: false
    }))

    setFileUploads(prev => [...prev, ...newUploads])

    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i]
      try {
        const evidenceItem = await evidenceCuratorService.analyzeEvidence(upload.file, claimId)

        setFileUploads(prev => prev.map(u =>
          u.file === upload.file
            ? { ...u, uploading: false, analyzed: true }
            : u
        ))

        if (evidenceItem) {
          setEvidence(prev => [evidenceItem, ...prev])
          toast.success(`Evidence analyzed: ${evidenceItem.file_name}`)
        } else {
          toast.error(`Failed to analyze: ${upload.file.name}`)
        }
      } catch (error) {
        console.error('Error uploading file:', error)
        setFileUploads(prev => prev.map(u =>
          u.file === upload.file
            ? { ...u, uploading: false, analyzed: false }
            : u
        ))
        toast.error(`Error uploading: ${upload.file.name}`)
      }
    }

    // Clean up completed uploads after a delay
    setTimeout(() => {
      setFileUploads(prev => prev.filter(u => u.uploading || !u.analyzed))
    }, 3000)

    // Reload data to get updated gaps and workflows
    await loadData()
  }, [claimId])

  const createWorkflow = async (claimType: string = 'hurricane') => {
    try {
      const workflow = await evidenceCuratorService.createEvidenceWorkflow(claimId, claimType)
      if (workflow) {
        setWorkflows([workflow])
        toast.success('Evidence workflow created')
      } else {
        toast.error('Failed to create workflow')
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      toast.error('Error creating evidence workflow')
    }
  }

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-400 bg-green-900/20'
    if (score >= 80) return 'text-blue-400 bg-blue-900/20'
    if (score >= 70) return 'text-yellow-400 bg-yellow-900/20'
    return 'text-red-400 bg-red-900/20'
  }

  const getGapSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-orange-500 text-white'
      case 'low': return 'bg-yellow-500 text-black'
      default: return 'bg-gray-500 text-white'
    }
  }

  const filteredEvidence = evidence.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const matchesSearch = searchQuery === '' ||
      item.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ai_description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const categoryCounts = evidence.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1
    return acc
  }, {} as Record<EvidenceCategory, number>)

  const criticalGaps = gaps.filter(g => g.severity === 'critical').length
  const completionPercentage = workflows.length > 0
    ? workflows[0].completion_percentage
    : evidence.length > 0 ? 65 : 0

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
          <div className="p-2 bg-emerald-600/20 rounded-lg">
            <Archive className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Evidence Curator</h1>
            <p className="text-gray-400">AI-powered evidence management with automated gap detection</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30">
            <Brain className="h-3 w-3 mr-1" />
            AI-Powered
          </Badge>
          <Button
            onClick={() => createWorkflow()}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Workflow className="h-4 w-4 mr-1" />
            Create Workflow
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
                  <p className="text-sm text-gray-400">Total Evidence</p>
                  <p className="text-2xl font-bold text-white">{analytics.total_items}</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Avg Quality</p>
                  <p className="text-2xl font-bold text-blue-400">{analytics.average_quality_score.toFixed(1)}</p>
                </div>
                <Star className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Completion</p>
                  <p className="text-2xl font-bold text-green-400">{analytics.completion_percentage}%</p>
                </div>
                <Target className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Critical Gaps</p>
                  <p className="text-2xl font-bold text-red-400">{criticalGaps}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* File Upload Zone */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Upload Evidence</CardTitle>
          <CardDescription>
            Drag and drop files or click to upload. AI will automatically analyze and categorize your evidence.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors"
            onDrop={(e) => {
              e.preventDefault()
              const files = e.dataTransfer.files
              if (files.length > 0) {
                handleFileUpload(files)
              }
            }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.multiple = true
              input.accept = 'image/*,application/pdf,.doc,.docx'
              input.onchange = (e) => {
                const target = e.target as HTMLInputElement
                if (target.files && target.files.length > 0) {
                  handleFileUpload(target.files)
                }
              }
              input.click()
            }}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-white mb-2">Drop files here or click to upload</p>
            <p className="text-gray-400">Supports images, PDFs, and documents</p>
          </div>

          {/* Upload Progress */}
          {fileUploads.length > 0 && (
            <div className="mt-4 space-y-2">
              {fileUploads.map((upload, index) => (
                <div key={index} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded">
                  <FileText className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-white flex-1">{upload.file.name}</span>
                  {upload.uploading && <RefreshCw className="h-4 w-4 text-blue-400 animate-spin" />}
                  {upload.analyzed && <CheckCircle className="h-4 w-4 text-green-400" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="evidence" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="evidence">Evidence</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="gaps">Gaps & Issues</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="evidence" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search evidence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as EvidenceCategory | 'all')}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Categories</option>
                <option value="damage_photos">Damage Photos</option>
                <option value="property_photos">Property Photos</option>
                <option value="receipts_invoices">Receipts & Invoices</option>
                <option value="estimates_quotes">Estimates & Quotes</option>
                <option value="insurance_documents">Insurance Documents</option>
                <option value="legal_documents">Legal Documents</option>
                <option value="weather_reports">Weather Reports</option>
                <option value="expert_reports">Expert Reports</option>
              </select>
            </div>

            <div className="text-sm text-gray-400">
              {filteredEvidence.length} of {evidence.length} items
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence.map(item => (
              <Card key={item.id} className="bg-gray-800 border-gray-700 hover:border-emerald-500/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 text-xs">
                      {item.category.replace('_', ' ')}
                    </Badge>
                    <Badge className={getQualityColor(item.quality_score)} variant="outline">
                      {item.quality_score}/100
                    </Badge>
                  </div>
                  <CardTitle className="text-sm text-white">{item.file_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.ai_description}</p>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Quality</span>
                      <Progress value={item.quality_score} className="w-16 h-1" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Completeness</span>
                      <Progress value={item.completeness_score} className="w-16 h-1" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Relevance</span>
                      <Progress value={item.relevance_score} className="w-16 h-1" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" className="text-emerald-400">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-blue-400">
                      <Download className="h-3 w-3" />
                    </Button>
                    <div className="flex-1"></div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(item.upload_date), 'MMM d')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvidence.length === 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <FolderOpen className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Evidence Found</h3>
                <p className="text-gray-400 mb-4">
                  {evidence.length === 0
                    ? 'Upload your first evidence files to get started with AI analysis'
                    : 'No evidence matches your current filters'
                  }
                </p>
                {evidence.length === 0 && (
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Evidence
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="workflows" className="space-y-4">
          {workflows.length > 0 ? (
            workflows.map(workflow => (
              <Card key={workflow.id} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-white">{workflow.workflow_name}</CardTitle>
                      <CardDescription>
                        {workflow.steps.length} steps • {workflow.completion_percentage}% complete
                      </CardDescription>
                    </div>
                    <Badge className={workflow.status === 'completed' ? 'bg-green-600/20 text-green-400' : 'bg-blue-600/20 text-blue-400'}>
                      {workflow.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <Progress value={workflow.completion_percentage} className="h-2 mb-2" />
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Progress</span>
                      <span>{workflow.completion_percentage}%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {workflow.steps.map((step, index) => (
                      <div key={step.id} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded-lg">
                        <div className={`p-1 rounded-full ${
                          step.status === 'completed' ? 'bg-green-600' :
                          step.status === 'in_progress' ? 'bg-blue-600' : 'bg-gray-600'
                        }`}>
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-white" />
                          ) : step.status === 'in_progress' ? (
                            <Clock className="h-4 w-4 text-white" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{step.step_name}</h4>
                          <p className="text-sm text-gray-400">{step.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{step.ai_guidance}</p>
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.estimated_time}m
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <Workflow className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Workflows Created</h3>
                <p className="text-gray-400 mb-4">
                  Create an evidence workflow to get AI-guided step-by-step assistance
                </p>
                <Button
                  onClick={() => createWorkflow()}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Evidence Workflow
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="gaps" className="space-y-4">
          {gaps.length > 0 ? (
            <div className="space-y-4">
              {gaps.map((gap, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-400" />
                        <div>
                          <CardTitle className="text-white">Missing {gap.category.replace('_', ' ')}</CardTitle>
                          <CardDescription>{gap.gap_type.replace('_', ' ')}</CardDescription>
                        </div>
                      </div>
                      <Badge className={getGapSeverityColor(gap.severity)}>
                        {gap.severity}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{gap.description}</p>

                    <div className="bg-red-900/10 border border-red-800/20 rounded-lg p-3 mb-4">
                      <p className="text-sm text-red-400 font-medium mb-2">Impact on Claim:</p>
                      <p className="text-sm text-red-300">{gap.impact_on_claim}</p>
                      <p className="text-xs text-red-400 mt-2">
                        Estimated value impact: ${gap.estimated_value_impact.toLocaleString()}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-400 font-medium mb-2">Suggested Actions:</p>
                      <ul className="space-y-1">
                        {gap.suggested_actions.map((action, actionIndex) => (
                          <li key={actionIndex} className="flex items-start gap-2 text-sm text-gray-300">
                            <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No Evidence Gaps Detected</h3>
                <p className="text-gray-400">
                  Your evidence collection appears complete for this claim type
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Evidence by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(analytics.by_category).map(([category, count]) => (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-gray-300 capitalize">
                          {category.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-2">
                          <Progress value={(count / analytics.total_items) * 100} className="w-24 h-2 bg-gray-700" />
                          <span className="text-white font-medium w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">AI Accuracy Rate</span>
                      <span className="text-green-400 font-medium">
                        {Math.round(analytics.ai_accuracy_rate * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Workflow Completion</span>
                      <span className="text-blue-400 font-medium">
                        {Math.round(analytics.workflow_completion_rate * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Avg Processing Time</span>
                      <span className="text-purple-400 font-medium">
                        {analytics.processing_time_avg.toFixed(1)}m
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Critical Gaps</span>
                      <span className="text-red-400 font-medium">
                        {analytics.critical_gaps}
                      </span>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-400 mb-1">A-</p>
                        <p className="text-sm text-gray-400">Overall Grade</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
