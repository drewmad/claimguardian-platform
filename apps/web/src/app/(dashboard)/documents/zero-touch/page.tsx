'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Brain, Zap, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { EnhancedDocumentUpload } from '@/components/zero-touch/enhanced-document-upload'
import { DocumentConfirmationUI } from '@/components/zero-touch/document-confirmation-ui'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function ZeroTouchDocumentsPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'review'>('upload')
  const [stats, setStats] = useState({
    totalProcessed: 0,
    pendingReview: 0,
    autoConfirmed: 0,
    averageConfidence: 0
  })

  const handleDocumentProcessed = (document: any) => {
    setStats(prev => ({
      ...prev,
      totalProcessed: prev.totalProcessed + 1,
      pendingReview: document.status === 'pending_review' ? prev.pendingReview + 1 : prev.pendingReview,
      autoConfirmed: document.status === 'auto_confirmed' ? prev.autoConfirmed + 1 : prev.autoConfirmed,
      averageConfidence: ((prev.averageConfidence * prev.totalProcessed) + document.confidence) / (prev.totalProcessed + 1)
    }))
    
    // Switch to review tab if document needs review
    if (document.status === 'pending_review') {
      setActiveTab('review')
    }
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-900 p-6">
        {/* Header */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <Sparkles className="w-8 h-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Zero-Touch Evidence Locker
              </h1>
              <p className="text-gray-400">
                AI-powered document processing with intelligent naming, tagging, and metadata extraction
              </p>
            </div>
            <Badge className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-400 border-purple-500/20">
              <Zap className="w-4 h-4 mr-1" />
              Multi-AI Powered
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <FileText className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Processed</p>
                    <p className="text-2xl font-bold text-white">{stats.totalProcessed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pending Review</p>
                    <p className="text-2xl font-bold text-white">{stats.pendingReview}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Auto-Confirmed</p>
                    <p className="text-2xl font-bold text-white">{stats.autoConfirmed}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Avg Confidence</p>
                    <p className="text-2xl font-bold text-white">
                      {Math.round(stats.averageConfidence * 100)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg border border-gray-700 w-fit">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'upload'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Upload & Process
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`px-6 py-3 rounded-md font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'review'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Brain className="w-4 h-4" />
              Review & Confirm
              {stats.pendingReview > 0 && (
                <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                  {stats.pendingReview}
                </Badge>
              )}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'upload' ? (
            <div className="space-y-8">
              <EnhancedDocumentUpload 
                onDocumentProcessed={handleDocumentProcessed}
              />
            </div>
          ) : (
            <div className="space-y-8">
              <DocumentConfirmationUI />
            </div>
          )}
        </div>

        {/* AI Provider Information */}
        <div className="max-w-7xl mx-auto mt-12">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                AI Processing Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="p-3 bg-blue-500/10 rounded-lg w-fit mx-auto mb-3">
                    <Brain className="w-6 h-6 text-blue-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">OpenAI GPT-4 Vision</h4>
                  <p className="text-gray-400 text-sm">General document analysis and OCR</p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 bg-green-500/10 rounded-lg w-fit mx-auto mb-3">
                    <Brain className="w-6 h-6 text-green-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Google Gemini Pro</h4>
                  <p className="text-gray-400 text-sm">Complex multi-page documents</p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 bg-purple-500/10 rounded-lg w-fit mx-auto mb-3">
                    <Brain className="w-6 h-6 text-purple-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">xAI Grok</h4>
                  <p className="text-gray-400 text-sm">Advanced damage assessment & anomaly detection</p>
                </div>
                
                <div className="text-center">
                  <div className="p-3 bg-orange-500/10 rounded-lg w-fit mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-orange-500" />
                  </div>
                  <h4 className="text-white font-medium mb-2">Consensus Engine</h4>
                  <p className="text-gray-400 text-sm">Multi-provider result synthesis</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-gray-900 rounded-lg">
                <h4 className="text-white font-medium mb-2">How it Works:</h4>
                <ol className="text-gray-400 text-sm space-y-1">
                  <li>1. <strong>Parallel Processing:</strong> Multiple AI models analyze your document simultaneously</li>
                  <li>2. <strong>Smart Naming:</strong> Generates descriptive filenames with dates, amounts, and entities</li>
                  <li>3. <strong>Auto-Tagging:</strong> Creates intelligent tags for easy search and organization</li>
                  <li>4. <strong>Florida Enhancement:</strong> Cross-references with Florida property and insurance data</li>
                  <li>5. <strong>Confidence Routing:</strong> High-confidence documents auto-confirm, others need review</li>
                  <li>6. <strong>Continuous Learning:</strong> System improves from every user interaction</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}