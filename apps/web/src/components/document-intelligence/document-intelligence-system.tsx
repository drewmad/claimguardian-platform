'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import {
  FileText,
  Upload,
  Search,
  Brain,
  Sparkles,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Eye,
  Download,
  Filter,
  FolderOpen,
  FileCheck,
  FileX,
  Tags,
  Calendar,
  DollarSign,
  Home,
  Car,
  Heart,
  Briefcase,
  RefreshCw,
  Zap,
  Archive,
  Share2,
  BarChart3
} from 'lucide-react'
// Mock AI model manager for demo - in production would import from ai-services package
const aiModelManager = {
  generateText: async (prompt: string, options?: any) => ({
    content: 'Mock AI response'
  }),
  analyzeImage: async (imageData: string, prompt: string) => ({ description: 'Mock analysis', objects: [], damages: [] })
}
import { createClient } from '@/lib/supabase/client'

interface DocumentAnalysis {
  id: string
  fileName: string
  fileType: string
  fileSize: number
  uploadDate: Date
  status: 'pending' | 'processing' | 'completed' | 'error'
  documentType?: 'policy' | 'claim' | 'invoice' | 'report' | 'correspondence' | 'evidence' | 'other'
  extractedData?: {
    policyNumber?: string
    claimNumber?: string
    effectiveDate?: string
    expirationDate?: string
    insuredName?: string
    propertyAddress?: string
    coverageAmount?: number
    deductible?: number
    premiumAmount?: number
    [key: string]: any
  }
  entities?: Array<{
    type: string
    value: string
    confidence: number
  }>
  keyPhrases?: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  summary?: string
  riskScore?: number
  complianceFlags?: string[]
  relatedDocuments?: string[]
  aiConfidence?: number
  processingTime?: number
}

interface DocumentCategory {
  name: string
  icon: typeof FileText
  color: string
  count: number
}

export function DocumentIntelligenceSystem() {
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([])
  const [processing, setProcessing] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<DocumentAnalysis | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const supabase = createClient()

  const categories: DocumentCategory[] = [
    { name: 'Policies', icon: Shield, color: 'text-blue-500', count: documents.filter(d => d.documentType === 'policy').length },
    { name: 'Claims', icon: FileCheck, color: 'text-green-500', count: documents.filter(d => d.documentType === 'claim').length },
    { name: 'Invoices', icon: DollarSign, color: 'text-yellow-500', count: documents.filter(d => d.documentType === 'invoice').length },
    { name: 'Reports', icon: BarChart3, color: 'text-purple-500', count: documents.filter(d => d.documentType === 'report').length },
    { name: 'Evidence', icon: Eye, color: 'text-red-500', count: documents.filter(d => d.documentType === 'evidence').length },
    { name: 'Other', icon: FolderOpen, color: 'text-gray-500', count: documents.filter(d => d.documentType === 'other').length }
  ]

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setProcessing(true)

    for (const file of acceptedFiles) {
      const newDoc: DocumentAnalysis = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date(),
        status: 'processing'
      }

      setDocuments(prev => [...prev, newDoc])

      try {
        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`intelligence/${newDoc.id}/${file.name}`, file)

        if (uploadError) throw uploadError

        // Process with AI
        const analysis = await analyzeDocument(file, newDoc.id)
        
        setDocuments(prev => prev.map(doc => 
          doc.id === newDoc.id 
            ? { ...doc, ...analysis, status: 'completed' }
            : doc
        ))

        toast.success(`Successfully analyzed ${file.name}`)
      } catch (error: any) {
        console.error('Document processing error:', error)
        
        setDocuments(prev => prev.map(doc => 
          doc.id === newDoc.id 
            ? { ...doc, status: 'error' }
            : doc
        ))

        toast.error(`Failed to process ${file.name}: ${error.message}`)
      }
    }

    setProcessing(false)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'text/*': ['.txt', '.csv'],
      'application/msword': ['.doc', '.docx']
    },
    multiple: true
  })

  const analyzeDocument = async (file: File, docId: string): Promise<Partial<DocumentAnalysis>> => {
    const startTime = Date.now()
    
    // Convert file to base64 for AI processing
    const base64 = await fileToBase64(file)
    
    // Determine document type based on content
    const typePrompt = `Analyze this document and determine its type. Categories: policy, claim, invoice, report, correspondence, evidence, other. Also extract key information like policy numbers, dates, amounts, names, and addresses. Return as JSON.`

    try {
      const response = await aiModelManager.generateText(typePrompt, {
        systemPrompt: 'You are a document analysis expert specializing in insurance documents.',
        temperature: 0.3
      })

      let extractedInfo: any = {}
      try {
        extractedInfo = JSON.parse(response.content)
      } catch {
        // Fallback parsing
        extractedInfo = {
          documentType: 'other',
          summary: response.content
        }
      }

      // Generate document summary
      const summaryPrompt = 'Provide a brief 2-3 sentence summary of this document\'s key points.'
      const summaryResponse = await aiModelManager.generateText(summaryPrompt)

      // Calculate risk score (mock implementation)
      const riskScore = Math.random() * 100

      // Identify compliance flags
      const complianceFlags: string[] = []
      if (extractedInfo.documentType === 'policy' && !extractedInfo.effectiveDate) {
        complianceFlags.push('Missing effective date')
      }
      if (extractedInfo.documentType === 'claim' && !extractedInfo.claimNumber) {
        complianceFlags.push('Missing claim number')
      }

      return {
        documentType: extractedInfo.documentType || 'other',
        extractedData: extractedInfo,
        entities: extractEntities(response.content),
        keyPhrases: extractKeyPhrases(response.content),
        sentiment: analyzeSentiment(response.content),
        summary: summaryResponse.content,
        riskScore,
        complianceFlags,
        aiConfidence: 85 + Math.random() * 15,
        processingTime: Date.now() - startTime
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      
      // Fallback analysis
      return {
        documentType: guessDocumentType(file.name),
        summary: 'Unable to analyze document with AI. Manual review required.',
        riskScore: 50,
        aiConfidence: 0,
        processingTime: Date.now() - startTime
      }
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = error => reject(error)
    })
  }

  const guessDocumentType = (fileName: string): DocumentAnalysis['documentType'] => {
    const lower = fileName.toLowerCase()
    if (lower.includes('policy')) return 'policy'
    if (lower.includes('claim')) return 'claim'
    if (lower.includes('invoice') || lower.includes('bill')) return 'invoice'
    if (lower.includes('report')) return 'report'
    if (lower.includes('letter') || lower.includes('email')) return 'correspondence'
    if (lower.includes('photo') || lower.includes('image')) return 'evidence'
    return 'other'
  }

  const extractEntities = (text: string): DocumentAnalysis['entities'] => {
    const entities: DocumentAnalysis['entities'] = []
    
    // Extract dates
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g
    const dates = text.match(dateRegex) || []
    dates.forEach(date => {
      entities.push({ type: 'date', value: date, confidence: 0.9 })
    })

    // Extract money amounts
    const moneyRegex = /\$[\d,]+\.?\d*/g
    const amounts = text.match(moneyRegex) || []
    amounts.forEach(amount => {
      entities.push({ type: 'money', value: amount, confidence: 0.95 })
    })

    // Extract policy/claim numbers
    const numberRegex = /\b[A-Z]{2,3}-?\d{6,10}\b/g
    const numbers = text.match(numberRegex) || []
    numbers.forEach(num => {
      entities.push({ type: 'reference_number', value: num, confidence: 0.85 })
    })

    return entities
  }

  const extractKeyPhrases = (text: string): string[] => {
    const phrases = [
      'coverage limit', 'deductible', 'premium', 'effective date',
      'claim amount', 'property damage', 'liability', 'hurricane',
      'flood damage', 'wind damage', 'replacement cost', 'actual cash value'
    ]
    
    return phrases.filter(phrase => 
      text.toLowerCase().includes(phrase.toLowerCase())
    )
  }

  const analyzeSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
    const positive = ['approved', 'covered', 'accepted', 'confirmed', 'valid']
    const negative = ['denied', 'rejected', 'excluded', 'invalid', 'expired']
    
    const positiveCount = positive.filter(word => text.toLowerCase().includes(word)).length
    const negativeCount = negative.filter(word => text.toLowerCase().includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.summary?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterType === 'all' || doc.documentType === filterType
    
    return matchesSearch && matchesFilter
  })

  const exportAnalysis = (doc: DocumentAnalysis) => {
    const data = JSON.stringify(doc, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.fileName}-analysis.json`
    a.click()
    toast.success('Analysis exported')
  }

  const runBulkAnalysis = async () => {
    const pendingDocs = documents.filter(d => d.status === 'pending')
    if (pendingDocs.length === 0) {
      toast.info('No pending documents to analyze')
      return
    }

    setProcessing(true)
    
    for (const doc of pendingDocs) {
      // Simulate processing each document
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setDocuments(prev => prev.map(d => 
        d.id === doc.id 
          ? { ...d, status: 'completed', aiConfidence: 90 + Math.random() * 10 }
          : d
      ))
    }

    setProcessing(false)
    toast.success(`Analyzed ${pendingDocs.length} documents`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Brain className="h-6 w-6" />
            <span>Document Intelligence System</span>
          </h2>
          <p className="text-gray-600">AI-powered document analysis and extraction</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={runBulkAnalysis} disabled={processing} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
            Bulk Analyze
          </Button>
          <Button>
            <Archive className="h-4 w-4 mr-2" />
            Archive Old
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <Badge variant="outline">Total</Badge>
            </div>
            <p className="text-2xl font-bold">{documents.length}</p>
            <p className="text-sm text-gray-500">Documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Brain className="h-5 w-5 text-green-500" />
              <Badge variant="outline">AI</Badge>
            </div>
            <p className="text-2xl font-bold">
              {documents.filter(d => d.status === 'completed').length}
            </p>
            <p className="text-sm text-gray-500">Analyzed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <Badge variant="outline">Queue</Badge>
            </div>
            <p className="text-2xl font-bold">
              {documents.filter(d => d.status === 'pending' || d.status === 'processing').length}
            </p>
            <p className="text-sm text-gray-500">Processing</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <Badge variant="outline">Risk</Badge>
            </div>
            <p className="text-2xl font-bold">
              {documents.filter(d => (d.riskScore || 0) > 70).length}
            </p>
            <p className="text-sm text-gray-500">High Risk</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <Badge variant="outline">Issues</Badge>
            </div>
            <p className="text-2xl font-bold">
              {documents.filter(d => d.complianceFlags && d.complianceFlags.length > 0).length}
            </p>
            <p className="text-sm text-gray-500">Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* Document Categories */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {categories.map(category => (
          <Button
            key={category.name}
            variant={filterType === category.name.toLowerCase() ? 'default' : 'outline'}
            onClick={() => setFilterType(category.name.toLowerCase())}
            className="justify-start"
          >
            <category.icon className={`h-4 w-4 mr-2 ${category.color}`} />
            {category.name}
            <Badge variant="secondary" className="ml-auto">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="library">Document Library</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle>Upload Documents</CardTitle>
              <CardDescription>
                Drag and drop or click to upload documents for AI analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
                  ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                {isDragActive ? (
                  <p className="text-lg font-medium">Drop documents here...</p>
                ) : (
                  <>
                    <p className="text-lg font-medium mb-2">
                      Drag & drop documents here, or click to select
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports PDF, Images, Word documents, and text files
                    </p>
                  </>
                )}
              </div>

              {processing && (
                <Alert className="mt-4">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <AlertTitle>Processing Documents</AlertTitle>
                  <AlertDescription>
                    AI is analyzing your documents. This may take a few moments...
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="library">
          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>
                Browse and manage all uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="flex gap-2 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Document List */}
              <div className="space-y-2">
                {filteredDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedDocument(doc)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <FileText className="h-5 w-5 text-gray-400 mt-1" />
                        <div>
                          <h4 className="font-medium">{doc.fileName}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(doc.uploadDate).toLocaleDateString()} • 
                            {(doc.fileSize / 1024).toFixed(1)}KB
                          </p>
                          {doc.summary && (
                            <p className="text-sm text-gray-600 mt-1">{doc.summary}</p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {doc.documentType && (
                              <Badge variant="outline">{doc.documentType}</Badge>
                            )}
                            {doc.sentiment && (
                              <Badge variant={
                                doc.sentiment === 'positive' ? 'default' :
                                doc.sentiment === 'negative' ? 'destructive' : 'secondary'
                              }>
                                {doc.sentiment}
                              </Badge>
                            )}
                            {doc.riskScore && doc.riskScore > 70 && (
                              <Badge variant="destructive">High Risk</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={
                          doc.status === 'completed' ? 'default' :
                          doc.status === 'processing' ? 'secondary' :
                          doc.status === 'error' ? 'destructive' : 'outline'
                        }>
                          {doc.status}
                        </Badge>
                        {doc.aiConfidence && (
                          <p className="text-xs text-gray-500 mt-1">
                            {doc.aiConfidence.toFixed(0)}% confidence
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis">
          <Card>
            <CardHeader>
              <CardTitle>Document Analysis</CardTitle>
              <CardDescription>
                Detailed AI analysis of selected document
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedDocument ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold">{selectedDocument.fileName}</h3>
                      <p className="text-sm text-gray-500">
                        Analyzed on {new Date(selectedDocument.uploadDate).toLocaleString()}
                      </p>
                    </div>
                    <Button onClick={() => exportAnalysis(selectedDocument)} size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>

                  {selectedDocument.extractedData && (
                    <div>
                      <h4 className="font-medium mb-2">Extracted Information</h4>
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        {Object.entries(selectedDocument.extractedData).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-sm text-gray-500">{key.replace(/_/g, ' ')}</p>
                            <p className="font-medium">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDocument.entities && selectedDocument.entities.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Detected Entities</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.entities.map((entity, idx) => (
                          <Badge key={idx} variant="outline">
                            {entity.type}: {entity.value}
                            <span className="ml-1 text-xs">({(entity.confidence * 100).toFixed(0)}%)</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDocument.keyPhrases && selectedDocument.keyPhrases.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Phrases</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedDocument.keyPhrases.map((phrase, idx) => (
                          <Badge key={idx} variant="secondary">
                            {phrase}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDocument.complianceFlags && selectedDocument.complianceFlags.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Compliance Issues</AlertTitle>
                      <AlertDescription>
                        <ul className="list-disc list-inside mt-2">
                          {selectedDocument.complianceFlags.map((flag, idx) => (
                            <li key={idx}>{flag}</li>
                          ))}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}

                  {selectedDocument.processingTime && (
                    <p className="text-sm text-gray-500">
                      Processing time: {(selectedDocument.processingTime / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Select a document from the library to view detailed analysis
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card>
            <CardHeader>
              <CardTitle>Document Insights</CardTitle>
              <CardDescription>
                Aggregate insights from all analyzed documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                      Coverage Trends
                    </h4>
                    <p className="text-sm text-gray-600">
                      Average coverage amount: $
                      {documents
                        .filter(d => d.extractedData?.coverageAmount)
                        .reduce((sum, d) => sum + (d.extractedData?.coverageAmount || 0), 0) / 
                        Math.max(documents.filter(d => d.extractedData?.coverageAmount).length, 1)
                      }
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                      Compliance Rate
                    </h4>
                    <p className="text-sm text-gray-600">
                      {(((documents.length - documents.filter(d => d.complianceFlags && d.complianceFlags.length > 0).length) / 
                        Math.max(documents.length, 1)) * 100).toFixed(0)}% compliant
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Document Type Distribution</h4>
                  <div className="space-y-2">
                    {categories.map(cat => (
                      <div key={cat.name} className="flex items-center">
                        <cat.icon className={`h-4 w-4 mr-2 ${cat.color}`} />
                        <span className="text-sm flex-1">{cat.name}</span>
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${(cat.count / Math.max(documents.length, 1)) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm ml-2">{cat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>AI Insights</AlertTitle>
                  <AlertDescription>
                    Based on analyzed documents, consider reviewing policies with expiration dates in the next 30 days
                    and addressing high-risk compliance issues first.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}