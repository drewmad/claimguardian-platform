'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { AIBreadcrumb } from '@/components/ui/breadcrumb'
import { ImageAnalysisLoading, SkeletonCard } from '@/components/ui/loading-states'
import { 
  Camera,
  AlertTriangle,
  CheckCircle,
  FileText,
  Sparkles,
  Home,
  Droplets,
  Wind,
  Zap,
  AlertCircle,
  MapPin,
  DollarSign,
  Clock,
  Shield,
  Settings,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Wifi,
  WifiOff
} from 'lucide-react'
import { AIClientService } from '@/lib/ai/client-service'
import { AI_PROMPTS } from '@/lib/ai/config'
import { useSupabase } from '@/lib/supabase/client'
import { useAuth } from '@/components/auth/auth-provider'
import { useAuthDebug } from '@/hooks/use-auth-debug'
import { toast } from 'sonner'
import { useAIKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { useRealTimeStatus, useFallbackStatus } from '@/lib/real-time-status'
import { useErrorRecovery, useNetworkStatus } from '@/lib/error-recovery'
import { compressImage, useRequestCache, useLazyLoad, performanceMonitor, useBatchProcessor } from '@/lib/performance-utils'
import { LazyImageUploadAnalyzer as ImageUploadAnalyzer, LazyReportGenerator as ReportGenerator } from '@/components/lazy'

interface DamageItem {
  id: string
  type: string
  severity: 'minor' | 'moderate' | 'severe' | 'total_loss'
  location: string
  description: string
  safety_concerns: string[]
  repair_priority: 'immediate' | 'urgent' | 'standard' | 'low'
  estimated_cost_range?: string
}

interface AnalysisResult {
  overall_severity: string
  total_items: number
  damage_items: DamageItem[]
  immediate_actions: string[]
  documentation_tips: string[]
  safety_warnings: string[]
}

const DAMAGE_ICONS = {
  water: Droplets,
  wind: Wind,
  structural: Home,
  electrical: Zap,
  other: AlertCircle,
}


function DamageAnalyzerContent() {
  // State for API keys (will be loaded dynamically)
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [hasAnyKey, setHasAnyKey] = useState(false)
  const [keysLoaded, setKeysLoaded] = useState(false)
  
  // Set default model to the first available one
  const defaultModel = hasOpenAIKey ? 'openai' : hasGeminiKey ? 'gemini' : 'openai'
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gemini'>(defaultModel)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [customPrompt, setCustomPrompt] = useState<string>(AI_PROMPTS.DAMAGE_ANALYZER.SYSTEM)
  const [isPromptEditorOpen, setIsPromptEditorOpen] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [totalImages, setTotalImages] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const aiClient = useMemo(() => new AIClientService(), [])
  
  // Load API key status on mount
  useEffect(() => {
    const checkKeys = async () => {
      try {
        const keysStatus = await aiClient.checkKeys()
        setHasOpenAIKey(keysStatus.hasOpenAIKey)
        setHasGeminiKey(keysStatus.hasGeminiKey)
        setHasAnyKey(keysStatus.hasAnyKey)
        
        // Update selected model based on available keys
        if (keysStatus.hasOpenAIKey) {
          setSelectedModel('openai')
        } else if (keysStatus.hasGeminiKey) {
          setSelectedModel('gemini')
        }
      } catch (error) {
        console.error('Failed to check API keys:', error)
        toast.error('Failed to check AI service availability')
      } finally {
        setKeysLoaded(true)
      }
    }
    
    checkKeys()
  }, [aiClient])
  
  // Enhanced hooks
  const { isOnline } = useNetworkStatus()
  const { executeWithRetry, isRetrying, retryState } = useErrorRecovery()
  const { cachedRequest } = useRequestCache()
  const { elementRef: lazyRef, isVisible: isLazyVisible } = useLazyLoad()
  
  // Real-time status (fallback if WebSocket not available)
  const fallbackStatus = useFallbackStatus()
  const realTimeStatus = useRealTimeStatus()
  const { systemStatus, sendStatusUpdate } = process.env.NODE_ENV === 'development' 
    ? fallbackStatus 
    : realTimeStatus
  
  // Batch processor for multiple images
  const { clearQueue } = useBatchProcessor(
    async (files: File[]) => {
      const results = []
      for (const file of files) {
        const result = await processImageWithRetry(file)
        results.push(result)
      }
      return results
    },
    3, // Process 3 images at a time
    500 // 500ms delay between batches
  )
  
  // Debug logging
  useAuthDebug('DamageAnalyzerContent')
  
  // Keyboard shortcuts
  const { showShortcutsHelp } = useAIKeyboardShortcuts({
    onUpload: () => fileInputRef.current?.click(),
    onSubmit: () => {/* Will be implemented in upload handler */},
    onEscape: () => {
      setIsPromptEditorOpen(false)
      setAnalysisResult(null)
    },
    onShowHelp: () => showShortcutsHelp(),
    uploadDisabled: !hasAnyKey || isAnalyzing,
    submitDisabled: !hasAnyKey || isAnalyzing
  })

  const processImageWithRetry = async (file: File) => {
    const timer = performanceMonitor.startTimer('image_analysis')
    
    try {
      // Compress image for better performance
      const compressedFile = await compressImage(file, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 0.8,
        format: 'jpeg'
      })

      // Convert to base64
      const base64 = await fileToBase64(compressedFile)
      
      // Create cache key
      const cacheKey = `analysis-${selectedModel}-${file.name}-${file.size}-${file.lastModified}`
      
      // Try to get from cache first
      const cachedResult = await cachedRequest(
        cacheKey,
        async () => {
          const prompt = `${customPrompt}

Analyze this image and provide a detailed damage assessment in the following JSON format:
{
  "damage_items": [
    {
      "type": "water|wind|structural|electrical|other",
      "severity": "minor|moderate|severe|total_loss",
      "location": "specific location in the property",
      "description": "detailed description of the damage",
      "safety_concerns": ["list of safety issues"],
      "repair_priority": "immediate|urgent|standard|low",
      "estimated_cost_range": "e.g., $500-$1,500"
    }
  ],
  "immediate_actions": ["list of actions to take now"],
  "safety_warnings": ["critical safety concerns"]
}`

          const response = await aiClient.analyzeImage({
            image: base64,
            prompt,
            model: selectedModel,
          })

          try {
            return JSON.parse(response)
          } catch {
            // Fallback parsing if not valid JSON
            return {
              damage_items: [{
                id: `damage-${Date.now()}`,
                type: 'other',
                severity: 'moderate',
                location: `Image analysis`,
                description: response,
                safety_concerns: [],
                repair_priority: 'standard',
              }],
              immediate_actions: [],
              safety_warnings: []
            }
          }
        },
        10 * 60 * 1000 // 10 minutes cache
      )

      timer()
      return cachedResult
    } catch (error) {
      timer()
      throw error
    }
  }

  const analyzeImages = async (files: File[]) => {
    // Check if the selected model has an API key
    if (selectedModel === 'openai' && !hasOpenAIKey) {
      toast.error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment.')
      return
    }
    if (selectedModel === 'gemini' && !hasGeminiKey) {
      toast.error('Gemini API key not configured. Please set GEMINI_API_KEY in your environment.')
      return
    }

    if (!isOnline) {
      toast.error('No internet connection. Please check your network and try again.')
      return
    }

    setIsAnalyzing(true)
    setTotalImages(files.length)
    setCurrentImageIndex(0)
    clearQueue()

    sendStatusUpdate({
      type: 'info',
      message: `Starting analysis of ${files.length} images`,
      metadata: { model: selectedModel, imageCount: files.length }
    })

    try {
      const results: DamageItem[] = []
      const safetyWarnings = new Set<string>()
      const immediateActions = new Set<string>()

      // Process images with retry logic
      for (let i = 0; i < files.length; i++) {
        setCurrentImageIndex(i + 1)
        
        const analysisResult = await executeWithRetry(
          () => processImageWithRetry(files[i])
        )

        if (analysisResult) {
          results.push(...analysisResult.damage_items)
          analysisResult.safety_warnings?.forEach((w: string) => safetyWarnings.add(w))
          analysisResult.immediate_actions?.forEach((a: string) => immediateActions.add(a))
        }
      }

      // Calculate overall severity
      const severityScores = {
        minor: 1,
        moderate: 2,
        severe: 3,
        total_loss: 4,
      }
      const avgScore = results.reduce((acc, item) => 
        acc + severityScores[item.severity], 0
      ) / results.length

      const overallSeverity = 
        avgScore >= 3.5 ? 'Critical' :
        avgScore >= 2.5 ? 'Severe' :
        avgScore >= 1.5 ? 'Moderate' : 'Minor'

      const analysisResult: AnalysisResult = {
        overall_severity: overallSeverity,
        total_items: results.length,
        damage_items: results.map((item, idx) => ({
          ...item,
          id: item.id || `damage-${Date.now()}-${idx}`,
        })),
        immediate_actions: Array.from(immediateActions),
        documentation_tips: [
          'Take wide-angle photos showing full context',
          'Include close-up shots of specific damage',
          'Use a measuring tape or object for scale reference',
          'Photograph serial numbers of damaged appliances',
          'Document water lines and stain patterns',
        ],
        safety_warnings: Array.from(safetyWarnings),
      }

      setAnalysisResult(analysisResult)

      // Log the analysis
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'ai_damage_analysis',
        resource_type: 'damage_assessment',
        metadata: {
          model: selectedModel,
          images_analyzed: files.length,
          overall_severity: overallSeverity,
          damage_items_found: results.length,
          retry_count: retryState.retryCount,
        },
      })

      sendStatusUpdate({
        type: 'success',
        message: `Analysis complete! Found ${results.length} damage items with ${overallSeverity.toLowerCase()} severity`,
        metadata: { results: results.length, severity: overallSeverity }
      })

      toast.success('Damage analysis complete!')
    } catch (error) {
      console.error('Analysis error:', error)
      sendStatusUpdate({
        type: 'error',
        message: 'Failed to analyze images',
        metadata: { error: (error as Error).message }
      })
      toast.error('Failed to analyze images')
      throw error
    } finally {
      setIsAnalyzing(false)
    }
  }


  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
    })
  }

  const calculateTotalCostRange = (items: DamageItem[]) => {
    const costs = items
      .filter(item => item.estimated_cost_range)
      .map(item => {
        const range = item.estimated_cost_range!
        const numbers = range.match(/\d+/g)
        if (numbers && numbers.length >= 2) {
          return {
            min: parseInt(numbers[0]),
            max: parseInt(numbers[1])
          }
        }
        return null
      })
      .filter(Boolean) as { min: number; max: number }[]

    if (costs.length === 0) return 'To be determined'

    const totalMin = costs.reduce((sum, cost) => sum + cost.min, 0)
    const totalMax = costs.reduce((sum, cost) => sum + cost.max, 0)

    return `$${totalMin.toLocaleString()} - $${totalMax.toLocaleString()}`
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <AIBreadcrumb 
          section="Analysis" 
          page="Damage Analyzer" 
          className="mb-4" 
        />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <Camera className="h-6 w-6 text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">AI Damage Analyzer</h1>
            <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">Beta</Badge>
            {!isOnline && (
              <Badge variant="destructive" className="ml-2">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
            {isRetrying && (
              <Badge variant="secondary" className="ml-2">
                Retrying... ({retryState.retryCount}/{3})
              </Badge>
            )}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-gray-400 max-w-3xl">
              Upload photos of property damage for instant AI analysis. Get detailed assessments, 
              severity ratings, and documentation guidance for your insurance claim.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showShortcutsHelp()}
              className="text-gray-400 hover:text-white"
            >
              <HelpCircle className="h-4 w-4 mr-1" />
              Shortcuts
            </Button>
          </div>
        </div>
        
        {/* System Status */}
        {systemStatus && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    systemStatus.ai_services.openai === 'online' ? 'bg-green-400' : 
                    systemStatus.ai_services.openai === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-gray-400">OpenAI: {systemStatus.ai_services.openai}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    systemStatus.ai_services.gemini === 'online' ? 'bg-green-400' : 
                    systemStatus.ai_services.gemini === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  }`} />
                  <span className="text-gray-400">Gemini: {systemStatus.ai_services.gemini}</span>
                </div>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Wifi className="h-4 w-4 text-green-400" />
                  ) : (
                    <WifiOff className="h-4 w-4 text-red-400" />
                  )}
                  <span className="text-gray-400">Network: {isOnline ? 'Connected' : 'Disconnected'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

          {/* Model Selection */}
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">AI Model:</span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={selectedModel === 'openai' ? 'default' : 'outline'}
                  onClick={() => setSelectedModel('openai')}
                  disabled={!hasOpenAIKey}
                >
                  GPT-4 Vision
                  {!hasOpenAIKey && ' (Key Required)'}
                </Button>
                <Button
                  size="sm"
                  variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                  onClick={() => setSelectedModel('gemini')}
                  disabled={!hasGeminiKey}
                >
                  Gemini Vision
                  {!hasGeminiKey && ' (Key Required)'}
                </Button>
              </div>
            </div>
            {!keysLoaded ? (
              <Alert className="mt-4">
                <Sparkles className="h-4 w-4 animate-pulse" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Checking AI Service Availability...</p>
                  <p className="text-sm">Please wait while we verify the AI services.</p>
                </AlertDescription>
              </Alert>
            ) : !hasAnyKey && (
              <Alert className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">AI API Keys Required</p>
                  <p className="text-sm mb-2">
                    To use the damage analyzer, you need to configure at least one AI API key:
                  </p>
                  <ul className="text-sm space-y-1 list-disc list-inside">
                    <li>For OpenAI: Add <code>OPENAI_API_KEY</code> to your environment</li>
                    <li>For Gemini: Add <code>GEMINI_API_KEY</code> to your environment</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </Card>

          {/* Prompt Editor */}
          {hasAnyKey && (
            <Card className="mb-6">
              <div className="p-4">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-2"
                  onClick={() => setIsPromptEditorOpen(!isPromptEditorOpen)}
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    <span className="font-semibold">Customize Analysis Prompt</span>
                    <Badge variant="outline">Testing</Badge>
                    {customPrompt !== AI_PROMPTS.DAMAGE_ANALYZER.SYSTEM && (
                      <Badge variant="default">Custom</Badge>
                    )}
                  </div>
                  {isPromptEditorOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                
                {isPromptEditorOpen && (
                  <div className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">
                        Customize the system prompt used for damage analysis. The prompt will be combined with specific instructions for JSON output format.
                      </p>
                      <Textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="Enter your custom prompt..."
                        className="min-h-[120px] font-mono text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCustomPrompt(AI_PROMPTS.DAMAGE_ANALYZER.SYSTEM)}
                      >
                        Reset to Default
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setIsPromptEditorOpen(false)}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Loading State */}
          {isAnalyzing && (
            <ImageAnalysisLoading 
              currentImage={currentImageIndex}
              totalImages={totalImages}
              className="mb-6"
            />
          )}

          {/* Upload Section */}
          {!analysisResult && keysLoaded && hasAnyKey && !isAnalyzing && (
            <div ref={lazyRef}>
              {isLazyVisible ? (
                <ImageUploadAnalyzer
                  onAnalyze={analyzeImages}
                  maxFiles={20}
                  maxSize={10}
                  title="Upload Damage Photos"
                  description="Take clear photos of all damaged areas. Include wide shots for context and close-ups for detail."
                  className="mb-6"
                />
              ) : (
                <SkeletonCard className="mb-6 h-64" />
              )}
            </div>
          )}
          
          {/* Hidden file input for keyboard shortcut */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files || [])
              if (files.length > 0) {
                analyzeImages(files)
              }
            }}
          />

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Overall Summary */}
              <Card className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">Analysis Summary</CardTitle>
                    <Badge 
                      variant={analysisResult.overall_severity === 'Critical' ? 'destructive' : 'secondary'}
                      className="text-base px-4 py-2"
                    >
                      {analysisResult.overall_severity} Damage
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="text-center p-4 bg-gray-50 border-0">
                      <Home className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-gray-900">
                        {analysisResult.total_items}
                      </p>
                      <p className="text-sm text-gray-600">Damage Items</p>
                    </Card>
                    <Card className="text-center p-4 bg-red-50 border-0">
                      <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-red-600">
                        {analysisResult.damage_items.filter(d => d.severity === 'severe' || d.severity === 'total_loss').length}
                      </p>
                      <p className="text-sm text-gray-600">Severe Items</p>
                    </Card>
                    <Card className="text-center p-4 bg-orange-50 border-0">
                      <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-orange-600">
                        {analysisResult.damage_items.filter(d => d.repair_priority === 'immediate').length}
                      </p>
                      <p className="text-sm text-gray-600">Immediate Repairs</p>
                    </Card>
                    <Card className="text-center p-4 bg-blue-50 border-0">
                      <Shield className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-blue-600">
                        {analysisResult.safety_warnings.length}
                      </p>
                      <p className="text-sm text-gray-600">Safety Concerns</p>
                    </Card>
                  </div>

                  {/* Severity Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Overall Damage Severity</span>
                      <span className="text-gray-600">{analysisResult.overall_severity}</span>
                    </div>
                    <Progress 
                      value={
                        analysisResult.overall_severity === 'Critical' ? 100 :
                        analysisResult.overall_severity === 'Severe' ? 75 :
                        analysisResult.overall_severity === 'Moderate' ? 50 : 25
                      }
                      className="h-3"
                    />
                  </div>

                {/* Safety Warnings */}
                {analysisResult.safety_warnings.length > 0 && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">Safety Warnings:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {analysisResult.safety_warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Immediate Actions */}
                {analysisResult.immediate_actions.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Immediate Actions Required:</h3>
                    <ul className="space-y-1">
                      {analysisResult.immediate_actions.map((action, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-blue-800">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </CardContent>
              </Card>

              {/* Damage Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Detailed Damage Assessment</h2>
                  <Badge variant="outline">
                    {analysisResult.damage_items.length} Items Found
                  </Badge>
                </div>
                {analysisResult.damage_items.map((item) => {
                  const Icon = DAMAGE_ICONS[item.type as keyof typeof DAMAGE_ICONS] || AlertCircle
                  const severityColors = {
                    minor: 'green',
                    moderate: 'yellow',
                    severe: 'orange',
                    total_loss: 'red',
                  }
                  const color = severityColors[item.severity]
                  
                  return (
                    <Card 
                      key={item.id} 
                      className={`overflow-hidden border-l-4 border-l-${color}-500`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full bg-${color}-100`}>
                            <Icon className={`h-6 w-6 text-${color}-600`} />
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-lg capitalize">{item.type} Damage</h3>
                              <Badge 
                                variant={item.severity === 'total_loss' ? 'destructive' : 'secondary'}
                                className="capitalize"
                              >
                                {item.severity.replace('_', ' ')}
                              </Badge>
                              {item.repair_priority === 'immediate' && (
                                <Badge variant="destructive">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Immediate Action
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                                <div>
                                  <p className="text-xs text-gray-500">Location</p>
                                  <p className="text-sm font-medium">{item.location}</p>
                                </div>
                              </div>
                              {item.estimated_cost_range && (
                                <div className="flex items-start gap-2">
                                  <DollarSign className="h-4 w-4 text-gray-500 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500">Estimated Cost</p>
                                    <p className="text-sm font-medium">{item.estimated_cost_range}</p>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-700">{item.description}</p>
                            
                            {item.safety_concerns.length > 0 && (
                              <Alert variant="destructive" className="mt-3">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  <p className="font-semibold mb-1">Safety Concerns:</p>
                                  <ul className="text-sm list-disc list-inside">
                                    {item.safety_concerns.map((concern, idx) => (
                                      <li key={idx}>{concern}</li>
                                    ))}
                                  </ul>
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Documentation Tips */}
              <Card className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documentation Tips
                </h3>
                <ul className="space-y-2">
                  {analysisResult.documentation_tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{tip}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Report Generator */}
              <ReportGenerator
                title="Property Damage Assessment Report"
                subtitle={`Generated for ${analysisResult.damage_items.length} damage items`}
                metadata={{
                  generatedBy: user?.email || 'ClaimGuardian User',
                  date: new Date(),
                  referenceNumber: `DMG-${Date.now().toString().slice(-8)}`,
                  status: analysisResult.overall_severity,
                }}
                sections={[
                  {
                    title: 'Executive Summary',
                    content: `This assessment identifies ${analysisResult.overall_severity.toLowerCase()} damage across ${analysisResult.total_items} items. ${analysisResult.damage_items.filter(d => d.repair_priority === 'immediate').length} items require immediate attention. Total estimated repair costs range from ${calculateTotalCostRange(analysisResult.damage_items)}.`,
                  },
                  {
                    title: 'Safety Warnings',
                    content: analysisResult.safety_warnings.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {analysisResult.safety_warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    ) : 'No critical safety concerns identified.',
                  },
                  {
                    title: 'Immediate Actions Required',
                    content: analysisResult.immediate_actions.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {analysisResult.immediate_actions.map((action, idx) => (
                          <li key={idx}>{action}</li>
                        ))}
                      </ul>
                    ) : 'No immediate actions required.',
                  },
                  {
                    title: 'Detailed Damage Inventory',
                    content: (
                      <div className="space-y-4">
                        {analysisResult.damage_items.map((item, idx) => (
                          <div key={idx} className="border-b pb-3 last:border-0">
                            <h4 className="font-semibold">{idx + 1}. {item.type} Damage - {item.location}</h4>
                            <p className="text-sm mt-1">{item.description}</p>
                            <div className="flex gap-4 text-xs mt-2 text-gray-600">
                              <span>Severity: {item.severity}</span>
                              <span>Priority: {item.repair_priority}</span>
                              {item.estimated_cost_range && <span>Est. Cost: {item.estimated_cost_range}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ),
                  },
                  {
                    title: 'Documentation Recommendations',
                    content: (
                      <ul className="list-disc list-inside space-y-1">
                        {analysisResult.documentation_tips.map((tip, idx) => (
                          <li key={idx}>{tip}</li>
                        ))}
                      </ul>
                    ),
                  },
                ]}
              />

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setAnalysisResult(null)}
                  variant="outline"
                  size="lg"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Analyze More Photos
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
  )
}

export default function DamageAnalyzerPage() {
  useAuthDebug('DamageAnalyzerPage')
  
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DamageAnalyzerContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}