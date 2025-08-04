'use client'

import { Camera, Upload, ArrowLeftRight, FileText, AlertTriangle, CheckCircle, Brain, Zap, Shield, ArrowRight, Download, Share } from 'lucide-react'
import { useState, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { CameraCapture } from '@/components/camera/camera-capture'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { logger } from "@/lib/logger/production-logger"

interface AnalysisImage {
  id: string
  file: File
  dataUrl: string
  type: 'before' | 'after' | 'current'
  timestamp: string
}

interface AIAnalysisResult {
  damageAssessment: {
    type: string
    severity: 'Minor' | 'Moderate' | 'Severe' | 'Critical'
    confidence: number
    affectedArea: number // square feet
    description: string
    causes: string[]
  }
  policyComparison: {
    isCovered: boolean
    coverageType: string
    policyClause: string
    deductible: number
    estimatedPayout: number
    explanation: string
  }
  beforeAfterAnalysis?: {
    progressionSeverity: 'Improved' | 'Worsened' | 'Unchanged'
    changes: string[]
    timelineEstimate: string
  }
  recommendations: {
    immediate: string[]
    shortTerm: string[]
    longTerm: string[]
  }
  documentation: {
    reportUrl: string
    photos: string[]
    estimateId: string
  }
}

interface EnhancedDamageAnalyzerProps {
  onAnalysisComplete?: (result: AIAnalysisResult) => void
  propertyId?: string
  policyData?: Record<string, unknown>
}

export function EnhancedDamageAnalyzer({ 
  onAnalysisComplete 
}: EnhancedDamageAnalyzerProps) {
  // State management
  const [images, setImages] = useState<AnalysisImage[]>([])
  const [currentStep, setCurrentStep] = useState<'upload' | 'analyze' | 'results'>('upload')
  const [, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [showCameraCapture, setShowCameraCapture] = useState(false)
  const [selectedImageType, setSelectedImageType] = useState<'before' | 'after' | 'current'>('current')
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedAIModel, setSelectedAIModel] = useState<'gpt4-vision' | 'gemini-vision'>('gpt4-vision')
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Image handling
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })

    const newImage: AnalysisImage = {
      id: Date.now().toString(),
      file,
      dataUrl,
      type: selectedImageType,
      timestamp: new Date().toISOString()
    }

    setImages(prev => [...prev, newImage])
    toast.success(`${selectedImageType.charAt(0).toUpperCase() + selectedImageType.slice(1)} image added`)
  }, [selectedImageType])

  const handleCameraCapture = useCallback(async (file: File) => {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.readAsDataURL(file)
    })

    const newImage: AnalysisImage = {
      id: Date.now().toString(),
      file,
      dataUrl,
      type: selectedImageType,
      timestamp: new Date().toISOString()
    }

    setImages(prev => [...prev, newImage])
    setShowCameraCapture(false)
    toast.success(`${selectedImageType.charAt(0).toUpperCase() + selectedImageType.slice(1)} image captured`)
  }, [selectedImageType])

  // AI Analysis
  const startAnalysis = async () => {
    if (images.length === 0) {
      toast.error('Please upload at least one image')
      return
    }

    setIsAnalyzing(true)
    setCurrentStep('analyze')
    setAnalysisProgress(0)

    try {
      // Progress simulation
      const progressSteps = [
        { step: 10, message: 'Processing images...' },
        { step: 30, message: 'Detecting damage patterns...' },
        { step: 50, message: 'Analyzing severity...' },
        { step: 70, message: 'Comparing with policy...' },
        { step: 90, message: 'Generating recommendations...' },
        { step: 100, message: 'Analysis complete!' }
      ]

      for (const { step, message } of progressSteps) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setAnalysisProgress(step)
        toast.info(message)
      }

      // Mock analysis result - in production, this would call your AI service
      const mockResult: AIAnalysisResult = {
        damageAssessment: {
          type: 'Water Damage',
          severity: 'Moderate',
          confidence: 94.5,
          affectedArea: 24.5,
          description: 'Water staining and potential mold growth detected on ceiling and upper wall areas. Damage appears recent with active moisture infiltration.',
          causes: ['Roof leak', 'Compromised flashing', 'Recent storm damage']
        },
        policyComparison: {
          isCovered: true,
          coverageType: 'Dwelling Coverage A',
          policyClause: 'Sudden and Accidental Water Damage',
          deductible: 1000,
          estimatedPayout: 3500,
          explanation: 'Roof leak damage is covered under your homeowners policy, minus the deductible.'
        },
        beforeAfterAnalysis: images.some(img => img.type === 'before') && images.some(img => img.type === 'after') ? {
          progressionSeverity: 'Worsened',
          changes: ['Staining area increased by 40%', 'New moisture intrusion detected', 'Potential mold growth beginning'],
          timelineEstimate: 'Damage progression over approximately 2-3 weeks'
        } : undefined,
        recommendations: {
          immediate: [
            'Place buckets to catch any dripping water',
            'Move valuable items away from affected area',
            'Take additional photos for documentation'
          ],
          shortTerm: [
            'Contact roofing contractor for emergency repair',
            'Set up dehumidifiers to prevent mold growth',
            'File insurance claim within 48 hours'
          ],
          longTerm: [
            'Complete roof repair and weatherproofing',
            'Monitor for mold growth over next 30 days',
            'Consider upgrading to impact-resistant roofing'
          ]
        },
        documentation: {
          reportUrl: '/reports/damage-analysis-' + Date.now(),
          photos: images.map(img => img.id),
          estimateId: 'EST-' + Date.now()
        }
      }

      setAnalysisResult(mockResult)
      setCurrentStep('results')
      onAnalysisComplete?.(mockResult)
      
    } catch (error) {
      logger.error('Analysis error:', error)
      toast.error('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const resetAnalysis = () => {
    setImages([])
    setCurrentStep('upload')
    setAnalysisProgress(0)
    setAnalysisResult(null)
  }

  const beforeImage = images.find(img => img.type === 'before')
  const afterImage = images.find(img => img.type === 'after')
  // const currentImage = images.find(img => img.type === 'current')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Enhanced AI Damage Analyzer</h2>
        <p className="text-gray-400">
          Upload photos for instant AI analysis with policy comparison and before/after tracking
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div className={`flex items-center ${currentStep === 'upload' ? 'text-blue-400' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            currentStep === 'upload' ? 'border-blue-400' : 'border-gray-400'
          }`}>
            1
          </div>
          <span className="ml-2">Upload</span>
        </div>
        <ArrowRight className="text-gray-400" />
        <div className={`flex items-center ${currentStep === 'analyze' ? 'text-blue-400' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            currentStep === 'analyze' ? 'border-blue-400' : 'border-gray-400'
          }`}>
            2
          </div>
          <span className="ml-2">Analyze</span>
        </div>
        <ArrowRight className="text-gray-400" />
        <div className={`flex items-center ${currentStep === 'results' ? 'text-blue-400' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
            currentStep === 'results' ? 'border-blue-400' : 'border-gray-400'
          }`}>
            3
          </div>
          <span className="ml-2">Results</span>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Upload Damage Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Image Type Selection */}
            <div className="space-y-2">
              <Label className="text-white">Photo Type</Label>
              <Select value={selectedImageType} onValueChange={(value: 'before' | 'after' | 'current') => setSelectedImageType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="before">Before Damage</SelectItem>
                  <SelectItem value="current">Current Damage</SelectItem>
                  <SelectItem value="after">After Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Upload Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setShowCameraCapture(true)}
                className="h-24 bg-blue-600 hover:bg-blue-700"
              >
                <div className="text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2" />
                  <span>Use Camera</span>
                </div>
              </Button>
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-24 bg-gray-700 hover:bg-gray-600"
              >
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <span>Upload File</span>
                </div>
              </Button>
            </div>

            {/* Uploaded Images */}
            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-white font-medium">Uploaded Images ({images.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {images.map((image) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.dataUrl}
                        alt={`${image.type} damage photo`}
                        className="w-full h-32 object-cover rounded border"
                      />
                      <Badge 
                        className={`absolute top-2 left-2 ${
                          image.type === 'before' ? 'bg-blue-600/80' :
                          image.type === 'after' ? 'bg-green-600/80' :
                          'bg-yellow-600/80'
                        }`}
                      >
                        {image.type}
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70"
                        onClick={() => setImages(images.filter(img => img.id !== image.id))}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Model Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">AI Model</Label>
                <Select value={selectedAIModel} onValueChange={(value: 'gpt4-vision' | 'gemini-vision') => setSelectedAIModel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt4-vision">GPT-4 Vision (Recommended)</SelectItem>
                    <SelectItem value="gemini-vision">Gemini Vision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Custom Analysis Prompt (Optional)</Label>
                <Textarea
                  placeholder="Add specific instructions for the AI analysis..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>

            {/* Analysis Button */}
            <Button
              onClick={startAnalysis}
              disabled={images.length === 0}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
              size="lg"
            >
              <Brain className="h-5 w-5 mr-2" />
              Start AI Analysis
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              multiple
            />
          </CardContent>
        </Card>
      )}

      {/* Analysis Progress */}
      {currentStep === 'analyze' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="py-12">
            <div className="text-center space-y-6">
              <div className="animate-pulse">
                <Brain className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
              </div>
              <h3 className="text-xl font-semibold text-white">AI Analysis in Progress</h3>
              <p className="text-gray-400">
                Analyzing {images.length} image{images.length !== 1 ? 's' : ''} with {selectedAIModel === 'gpt4-vision' ? 'GPT-4 Vision' : 'Gemini Vision'}
              </p>
              <div className="max-w-md mx-auto">
                <Progress value={analysisProgress} className="h-3" />
                <p className="text-sm text-gray-400 mt-2">{analysisProgress}% complete</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {currentStep === 'results' && analysisResult && (
        <div className="space-y-6">
          {/* Before/After Comparison */}
          {beforeImage && afterImage && analysisResult.beforeAfterAnalysis && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ArrowLeftRight className="h-5 w-5 text-cyan-400" />
                  Before/After Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="text-white font-medium mb-2">Before</h4>
                    <img
                      src={beforeImage.dataUrl}
                      alt="Before damage photo"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">After</h4>
                    <img
                      src={afterImage.dataUrl}
                      alt="After damage photo"
                      className="w-full h-48 object-cover rounded"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={`${
                      analysisResult.beforeAfterAnalysis.progressionSeverity === 'Improved' ? 'bg-green-600/20 text-green-400' :
                      analysisResult.beforeAfterAnalysis.progressionSeverity === 'Worsened' ? 'bg-red-600/20 text-red-400' :
                      'bg-yellow-600/20 text-yellow-400'
                    }`}>
                      {analysisResult.beforeAfterAnalysis.progressionSeverity}
                    </Badge>
                    <span className="text-gray-400">{analysisResult.beforeAfterAnalysis.timelineEstimate}</span>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-medium mb-2">Detected Changes</h4>
                    <ul className="space-y-1">
                      {analysisResult.beforeAfterAnalysis.changes.map((change, index) => (
                        <li key={index} className="text-gray-300 text-sm">• {change}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="assessment" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="assessment">Assessment</TabsTrigger>
              <TabsTrigger value="coverage">Coverage</TabsTrigger>
              <TabsTrigger value="recommendations">Actions</TabsTrigger>
              <TabsTrigger value="documentation">Export</TabsTrigger>
            </TabsList>

            <TabsContent value="assessment">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    AI Damage Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400">Damage Type</p>
                        <p className="text-lg font-semibold text-white">{analysisResult.damageAssessment.type}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Severity</p>
                        <Badge className={`${
                          analysisResult.damageAssessment.severity === 'Critical' ? 'bg-red-600/20 text-red-400' :
                          analysisResult.damageAssessment.severity === 'Severe' ? 'bg-orange-600/20 text-orange-400' :
                          analysisResult.damageAssessment.severity === 'Moderate' ? 'bg-yellow-600/20 text-yellow-400' :
                          'bg-green-600/20 text-green-400'
                        } text-lg px-3 py-1`}>
                          {analysisResult.damageAssessment.severity}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">AI Confidence</p>
                        <div className="flex items-center gap-2">
                          <Progress value={analysisResult.damageAssessment.confidence} className="flex-1" />
                          <span className="text-white font-medium">{analysisResult.damageAssessment.confidence}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-400">Affected Area</p>
                        <p className="text-lg font-semibold text-white">{analysisResult.damageAssessment.affectedArea} sq ft</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Likely Causes</p>
                        <ul className="space-y-1">
                          {analysisResult.damageAssessment.causes.map((cause, index) => (
                            <li key={index} className="text-white text-sm">• {cause}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Description</p>
                    <p className="text-white">{analysisResult.damageAssessment.description}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="coverage">
              <Card className={`border-2 ${analysisResult.policyComparison.isCovered ? 'border-green-500 bg-green-900/10' : 'border-red-500 bg-red-900/10'}`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-cyan-400" />
                    Insurance Coverage Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    {analysisResult.policyComparison.isCovered ? (
                      <CheckCircle className="h-6 w-6 text-green-400" />
                    ) : (
                      <AlertTriangle className="h-6 w-6 text-red-400" />
                    )}
                    <span className={`text-lg font-semibold ${
                      analysisResult.policyComparison.isCovered ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {analysisResult.policyComparison.isCovered ? 'Damage is Covered' : 'Damage Not Covered'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Coverage Type</p>
                        <p className="text-white font-medium">{analysisResult.policyComparison.coverageType}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Policy Clause</p>
                        <p className="text-white font-medium">{analysisResult.policyComparison.policyClause}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-400">Deductible</p>
                        <p className="text-white font-medium">${analysisResult.policyComparison.deductible.toLocaleString()}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-400">Estimated Payout</p>
                        <p className="text-2xl font-bold text-cyan-400">${analysisResult.policyComparison.estimatedPayout.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-700/50 p-4 rounded">
                    <p className="text-white">{analysisResult.policyComparison.explanation}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-400" />
                    Recommended Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="text-red-400 font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Immediate Actions (Next 24 hours)
                    </h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.immediate.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span>•</span>
                          <span className="text-gray-300">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-yellow-400 font-medium mb-3">Short-term Actions (This week)</h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.shortTerm.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span>•</span>
                          <span className="text-gray-300">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-green-400 font-medium mb-3">Long-term Actions (Next month)</h4>
                    <ul className="space-y-2">
                      {analysisResult.recommendations.longTerm.map((action, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span>•</span>
                          <span className="text-gray-300">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documentation">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Download className="h-5 w-5 text-blue-400" />
                    Export & Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button className="h-16 bg-blue-600 hover:bg-blue-700">
                      <div className="text-center">
                        <FileText className="h-6 w-6 mx-auto mb-1" />
                        <span>Download PDF Report</span>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="h-16 bg-gray-700 hover:bg-gray-600">
                      <div className="text-center">
                        <Share className="h-6 w-6 mx-auto mb-1" />
                        <span>Share with Insurance</span>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="h-16 bg-gray-700 hover:bg-gray-600">
                      <div className="text-center">
                        <Download className="h-6 w-6 mx-auto mb-1" />
                        <span>Export All Images</span>
                      </div>
                    </Button>
                    
                    <Button variant="outline" className="h-16 bg-gray-700 hover:bg-gray-600">
                      <div className="text-center">
                        <FileText className="h-6 w-6 mx-auto mb-1" />
                        <span>Generate Estimate</span>
                      </div>
                    </Button>
                  </div>
                  
                  <div className="bg-gray-700/50 p-4 rounded">
                    <h4 className="text-white font-medium mb-2">Analysis Summary</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>Report ID: {analysisResult.documentation.estimateId}</p>
                      <p>Images analyzed: {images.length}</p>
                      <p>Generated: {new Date().toLocaleString()}</p>
                      <p>AI Model: {selectedAIModel === 'gpt4-vision' ? 'GPT-4 Vision' : 'Gemini Vision'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center">
            <Button
              onClick={resetAnalysis}
              variant="outline"
              className="bg-gray-700 hover:bg-gray-600"
            >
              Start New Analysis
            </Button>
          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <CameraCapture
          onClose={() => setShowCameraCapture(false)}
          onCapture={handleCameraCapture}
        />
      )}
    </div>
  )
}