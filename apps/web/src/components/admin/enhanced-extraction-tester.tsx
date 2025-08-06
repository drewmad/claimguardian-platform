'use client'

/**
 * @fileMetadata
 * @purpose "Admin testing interface for enhanced document extraction system"
 * @owner admin-team
 * @dependencies ["@claimguardian/ui", "@/actions/enhanced-ai-extraction", "react"]
 * @exports ["EnhancedExtractionTester"]
 * @complexity medium
 * @tags ["admin", "testing", "ai", "document-extraction"]
 * @status stable
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Button } from '@claimguardian/ui'
import { Badge } from '@claimguardian/ui'
import { Alert, AlertDescription } from '@claimguardian/ui'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@claimguardian/ui'
import { Progress } from '@claimguardian/ui'
import { 
  Upload, TestTube, FileText, CheckCircle, AlertCircle, 
  XCircle, Clock, Database, Zap, BarChart3, Settings
} from 'lucide-react'
import { 
  processEnhancedExtraction, 
  getExtractionStatistics,
  getExtractionQueue
} from '@/actions/enhanced-ai-extraction'

interface TestResult {
  success: boolean
  extractionId?: string
  confidence?: number
  fieldsExtracted?: number
  processingTime?: number
  provider?: string
  error?: string
}

interface ExtractionStats {
  total_extractions: number
  successful_extractions: number
  failed_extractions: number
  average_confidence: number
  average_processing_time_ms: number
  auto_applied_count: number
  review_required_count: number
  total_fields_extracted: number
  most_used_provider: string
  most_used_model: string
}

export function EnhancedExtractionTester() {
  const [isUploading, setIsUploading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [stats, setStats] = useState<ExtractionStats | null>(null)
  const [reviewQueue, setReviewQueue] = useState<any[]>([])
  const [selectedProvider, setSelectedProvider] = useState<'auto' | 'gemini' | 'openai' | 'claude'>('auto')
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setTestResult(null)

    try {
      // For testing, we'll create a mock document record
      // In production, this would upload to Supabase Storage first
      const mockDocumentId = 'test-doc-' + Date.now()
      const mockPropertyId = 'test-prop-' + Date.now()

      const result = await processEnhancedExtraction({
        documentId: mockDocumentId,
        propertyId: mockPropertyId,
        options: {
          apiProvider: selectedProvider,
          useOCR: true,
          confidenceThreshold: 0.7,
          validateAddress: true,
          enrichWithPublicData: true
        }
      })

      if (result.error) {
        setTestResult({
          success: false,
          error: result.error
        })
      } else if (result.data) {
        setTestResult({
          success: true,
          extractionId: result.data.id,
          confidence: result.data.confidence_score,
          fieldsExtracted: result.data.extracted_fields?.length || 0,
          processingTime: result.data.processing_time_ms,
          provider: result.data.provider_used
        })
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsUploading(false)
    }
  }

  const loadStatistics = async () => {
    const result = await getExtractionStatistics(30)
    if (result.data) {
      setStats(result.data)
    }
  }

  const loadReviewQueue = async () => {
    const result = await getExtractionQueue()
    if (result.data) {
      setReviewQueue(result.data)
    }
  }

  const getStatusBadge = (success: boolean) => {
    if (success) {
      return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-3 w-3 mr-1" />Success</Badge>
    } else {
      return <Badge className="bg-red-600 hover:bg-red-700"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.9) {
      return <Badge className="bg-green-600 hover:bg-green-700">High ({(confidence * 100).toFixed(0)}%)</Badge>
    } else if (confidence >= 0.7) {
      return <Badge className="bg-yellow-600 hover:bg-yellow-700">Medium ({(confidence * 100).toFixed(0)}%)</Badge>
    } else {
      return <Badge className="bg-red-600 hover:bg-red-700">Low ({(confidence * 100).toFixed(0)}%)</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Enhanced Document Extraction Tester
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid grid-cols-3 w-full bg-gray-900">
              <TabsTrigger value="test">Test Extraction</TabsTrigger>
              <TabsTrigger value="statistics">Statistics</TabsTrigger>
              <TabsTrigger value="queue">Review Queue</TabsTrigger>
            </TabsList>

            {/* Test Extraction Tab */}
            <TabsContent value="test" className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Upload Test Document</h3>
                  
                  {/* Provider Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      AI Provider
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value as any)}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="auto">Auto (Best Available)</option>
                      <option value="gemini">Google Gemini</option>
                      <option value="openai">OpenAI GPT-4</option>
                      <option value="claude">Anthropic Claude</option>
                    </select>
                  </div>

                  {/* File Upload */}
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <div className="text-white mb-2">
                      Upload insurance policy document
                    </div>
                    <div className="text-sm text-gray-400 mb-4">
                      PDF, PNG, JPEG files supported
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="hidden"
                      id="test-file-upload"
                    />
                    <label htmlFor="test-file-upload">
                      <Button
                        disabled={isUploading}
                        className="cursor-pointer"
                        variant="outline"
                      >
                        {isUploading ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Choose File
                          </>
                        )}
                      </Button>
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Test Results</h3>
                  
                  {testResult && (
                    <div className="space-y-4">
                      <div className="bg-gray-900 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-gray-400">Status</span>
                          {getStatusBadge(testResult.success)}
                        </div>
                        
                        {testResult.success ? (
                          <>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Confidence</span>
                                <div className="mt-1">
                                  {testResult.confidence && getConfidenceBadge(testResult.confidence)}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Provider</span>
                                <div className="text-white mt-1 capitalize">
                                  {testResult.provider || 'Unknown'}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Fields Extracted</span>
                                <div className="text-white mt-1">
                                  {testResult.fieldsExtracted || 0}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-400">Processing Time</span>
                                <div className="text-white mt-1">
                                  {testResult.processingTime ? `${testResult.processingTime}ms` : 'N/A'}
                                </div>
                              </div>
                            </div>
                            
                            {testResult.extractionId && (
                              <div className="mt-3 pt-3 border-t border-gray-700">
                                <span className="text-gray-400 text-xs">Extraction ID</span>
                                <div className="text-white text-xs font-mono mt-1">
                                  {testResult.extractionId}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <Alert className="bg-red-900/20 border-red-800">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <AlertDescription className="text-red-400">
                              {testResult.error}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Statistics Tab */}
            <TabsContent value="statistics" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Extraction Statistics (Last 30 Days)</h3>
                <Button onClick={loadStatistics} variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              {stats && (
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-white">{stats.total_extractions}</div>
                      <div className="text-sm text-gray-400">Total Extractions</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-green-500">{stats.successful_extractions}</div>
                      <div className="text-sm text-gray-400">Successful</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-yellow-500">{stats.review_required_count}</div>
                      <div className="text-sm text-gray-400">Need Review</div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="text-2xl font-bold text-blue-500">{stats.auto_applied_count}</div>
                      <div className="text-sm text-gray-400">Auto-Applied</div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {stats && (
                <div className="grid grid-cols-2 gap-6">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">Performance Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Confidence</span>
                          <span className="text-white">
                            {stats.average_confidence ? `${(stats.average_confidence * 100).toFixed(0)}%` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Avg Processing Time</span>
                          <span className="text-white">
                            {stats.average_processing_time_ms ? `${Math.round(stats.average_processing_time_ms)}ms` : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Fields</span>
                          <span className="text-white">{stats.total_fields_extracted || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-gray-900 border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-white text-sm">AI Provider Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Most Used Provider</span>
                          <span className="text-white capitalize">
                            {stats.most_used_provider || 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Most Used Model</span>
                          <span className="text-white">
                            {stats.most_used_model || 'None'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Review Queue Tab */}
            <TabsContent value="queue" className="mt-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Extraction Review Queue</h3>
                <Button onClick={loadReviewQueue} variant="outline" size="sm">
                  <Database className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
              
              <div className="bg-gray-900 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-gray-400">Document</th>
                        <th className="px-4 py-3 text-gray-400">Policy</th>
                        <th className="px-4 py-3 text-gray-400">Confidence</th>
                        <th className="px-4 py-3 text-gray-400">Status</th>
                        <th className="px-4 py-3 text-gray-400">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reviewQueue.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                            No extractions pending review
                          </td>
                        </tr>
                      ) : (
                        reviewQueue.map((item, idx) => (
                          <tr key={idx} className="border-t border-gray-700">
                            <td className="px-4 py-3 text-white">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                {item.file_name || 'Unknown'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white">
                              {item.policy_number || 'N/A'}
                            </td>
                            <td className="px-4 py-3">
                              {item.confidence_score && getConfidenceBadge(item.confidence_score)}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="capitalize">
                                {item.processing_status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-gray-400">
                              {new Date(item.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}