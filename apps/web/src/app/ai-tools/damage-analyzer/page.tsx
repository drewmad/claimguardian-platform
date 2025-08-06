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

import {
  Camera,
  CheckCircle,
  FileText,
  Sparkles,
  Wind,
  Droplets,
  Home,
  Zap,
  ChevronRight,
  UploadCloud,
  Loader2,
  Shield,
  X,
  FlaskConical,
  Target,
  ThumbsUp,
  ThumbsDown,
  Star
} from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

import { enhancedAIClient } from '@/lib/ai/enhanced-client'
import { enhancedDocumentExtractor } from '@/lib/services/enhanced-document-extraction'
import { createClient } from '@/lib/supabase/client'

import { ProtectedRoute } from '@/components/auth/protected-route'
import { PermissionGuard } from '@/components/auth/permission-guard'
import { CameraCapture } from '@/components/camera/camera-capture'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { AIBreadcrumb } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { OptimizedImage } from '@/components/ui/optimized-image'
import { Progress } from '@/components/ui/progress'
import { useAuthDebug } from '@/hooks/use-auth-debug'
import { FeatureLimitBadge } from '@/components/subscription/subscription-gate'
import { AI_TOOLS_PERMISSIONS } from '@/types/permissions'
import { useSubscription } from '@/hooks/use-subscription'

// --- MOCK DATA AND TYPES ---

interface Policy {
  id: string
  provider: string
  policy_number: string
  type: 'homeowners' | 'flood' | 'windstorm'
  coverage_details: {
    dwelling: number
    personal_property: number
    deductible: number
    clauses: {
      [key: string]: {
        title: string
        description: string
        covered: boolean
      }
    }
  }
}

interface AnalysisResult {
  damageType: string
  severity: 'Minor' | 'Moderate' | 'Severe'
  description: string
  coverage: {
    isCovered: boolean
    clause: string
    clause_description: string
    policy_provider: string
    policy_number: string
  }
  recommendations: string[]
}

const MOCK_POLICIES: Policy[] = [
  {
    id: 'pol_1',
    provider: 'State Farm',
    policy_number: 'SF-HO-12345',
    type: 'homeowners',
    coverage_details: {
      dwelling: 500000,
      personal_property: 250000,
      deductible: 1000,
      clauses: {
        'water_damage_roof': { title: 'Water Damage (Roof Leaks)', description: 'Covers sudden and accidental water damage from roof leaks.', covered: true },
        'wind_damage_siding': { title: 'Wind Damage (Siding)', description: 'Covers damage to siding caused by high winds.', covered: true },
        'flood_damage': { title: 'Flood Damage', description: 'Flood damage is excluded. Requires separate flood policy.', covered: false },
      }
    }
  },
  {
    id: 'pol_2',
    provider: 'FEMA',
    policy_number: 'FEMA-FL-67890',
    type: 'flood',
    coverage_details: {
      dwelling: 350000,
      personal_property: 100000,
      deductible: 5000,
      clauses: {
        'flood_damage': { title: 'Flood Damage', description: 'Covers damage from rising waters.', covered: true },
      }
    }
  }
]

const MOCK_ANALYSIS: { [key: string]: AnalysisResult } = {
  'roof-leak': {
    damageType: 'Water Damage (Roof)',
    severity: 'Moderate',
    description: 'Visible water stains on the ceiling and wall, indicating a potential roof leak. The damage appears to be recent.',
    coverage: {
      isCovered: true,
      clause: 'Water Damage (Roof Leaks)',
      clause_description: 'Covers sudden and accidental water damage from roof leaks.',
      policy_provider: 'State Farm',
      policy_number: 'SF-HO-12345'
    },
    recommendations: [
      'Place a bucket under the leak to prevent further damage.',
      'Take clear photos of the stained areas and any visible roof damage.',
      'Contact a roofing professional to assess the source of the leak.'
    ]
  },
  'siding-damage': {
    damageType: 'Wind Damage (Siding)',
    severity: 'Severe',
    description: 'Multiple sections of vinyl siding have been detached or cracked, likely due to high winds.',
    coverage: {
      isCovered: true,
      clause: 'Wind Damage (Siding)',
      clause_description: 'Covers damage to siding caused by high winds.',
      policy_provider: 'State Farm',
      policy_number: 'SF-HO-12345'
    },
    recommendations: [
      'Gather any detached siding pieces if it is safe to do so.',
      'Photograph all affected areas of the house exterior.',
      'Get a quote for siding repair from a qualified contractor.'
    ]
  }
}

// --- UI COMPONENTS ---

function DamageAnalyzerContent() {
  const subscription = useSubscription()
  const [step, setStep] = useState<'select_policy' | 'upload' | 'capture' | 'analyzing' | 'result'>('select_policy')
  const [policies, setPolicies] = useState<Policy[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
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

  // Fetch policies on component mount
  useEffect(() => {
    async function loadPolicies() {
      setIsLoading(true)
      try {
        // Load real policies from Supabase
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('User not authenticated')
        }

        const { data: policiesData, error } = await supabase
          .from('policies')
          .select(`
            id,
            policy_number,
            carrier_name,
            policy_type,
            coverage_limits,
            deductible_amount,
            wind_deductible,
            hurricane_deductible,
            effective_date,
            expiration_date,
            properties (
              id,
              name,
              address
            )
          `)
          .eq('user_id', user.id)
          .eq('status', 'active')

        if (error) throw error

        // Convert to expected format
        const formattedPolicies: Policy[] = policiesData?.map(policy => ({
          id: policy.id,
          provider: policy.carrier_name || 'Unknown Provider',
          policy_number: policy.policy_number || 'Unknown',
          type: policy.policy_type === 'flood' ? 'flood' : 
                policy.policy_type === 'windstorm' ? 'windstorm' : 'homeowners',
          coverage_details: {
            dwelling: policy.coverage_limits?.dwelling || 0,
            personal_property: policy.coverage_limits?.personal_property || 0,
            deductible: policy.deductible_amount || 0,
            clauses: {
              'water_damage_roof': { 
                title: 'Water Damage (Roof Leaks)', 
                description: 'Covers sudden and accidental water damage from roof leaks.', 
                covered: true 
              },
              'wind_damage_siding': { 
                title: 'Wind Damage (Siding)', 
                description: 'Covers damage to siding caused by high winds.', 
                covered: true 
              },
              'flood_damage': { 
                title: 'Flood Damage', 
                description: policy.policy_type === 'flood' 
                  ? 'Covers damage from rising waters.' 
                  : 'Flood damage is excluded. Requires separate flood policy.', 
                covered: policy.policy_type === 'flood' 
              }
            }
          }
        })) || []

        // Fallback to mock data if no real policies found for demo purposes
        setPolicies(formattedPolicies.length > 0 ? formattedPolicies : MOCK_POLICIES)
      } catch (error) {
        toast.error('Failed to load insurance policies.')
        logger.error('Failed to load policies:', toError(error))
        // Fallback to mock data on error
        setPolicies(MOCK_POLICIES)
      } finally {
        setIsLoading(false)
      }
    }
    loadPolicies()
  }, [])

  const handlePolicySelect = (policy: Policy) => {
    setSelectedPolicy(policy)
    setStep('upload')
  }

  const handleImageUpload = (files: File[]) => {
    if (files && files.length > 0) {
      setUploadedImage(files[0])
      startAnalysis(files[0])
    }
  }

  const handleCapture = (imageFile: File) => {
    setUploadedImage(imageFile)
    setStep('analyzing')
    startAnalysis(imageFile)
  }

  const startAnalysis = async (file: File) => {
    // Check subscription limits before analyzing
    const access = subscription.checkFeatureAccess('aiRequests', 1)
    if (!access.allowed) {
      toast.error(access.message || 'AI request limit reached')
      return
    }
    
    setStep('analyzing')
    try {
      // Convert file to base64 for AI analysis
      const base64 = await fileToBase64(file)
      
      logger.info('Starting damage analysis with enhanced AI client')

      // Use enhanced AI client with database-driven model selection
      const response = await enhancedAIClient.enhancedImageAnalysis({
        image: base64,
        prompt: `Analyze this property damage image and provide a detailed damage assessment in the following JSON format:
{
  "damage": {
    "type": "specific damage type (e.g., roof damage, siding damage, water damage)",
    "severity": "Minor" | "Moderate" | "Severe" | "Critical",
    "confidence": "confidence score 0-100",
    "description": "detailed description of the damage"
  },
  "coverage": {
    "likely_covered": boolean,
    "estimated_payout": number,
    "policy_considerations": "explanation of coverage factors",
    "policy_provider": "${selectedPolicy?.provider || 'Not specified'}",
    "policy_number": "${selectedPolicy?.policy_number || 'Not provided'}"
  },
  "recommendations": {
    "immediate": ["immediate action items"],
    "short_term": ["short term recommendations"],
    "long_term": ["long term recommendations"]
  }
}

Please analyze the damage carefully, considering the policy context provided.`,
        featureId: 'damage-analyzer'
      })

      // Parse AI response
      const analysisResult = JSON.parse(response)

      // Mock A/B test information (in production, this would come from the enhanced client)
      const mockAbTestInfo = {
        testId: `test_${Date.now()}`,
        variant: Math.random() > 0.5 ? 'A' as const : 'B' as const,
        modelUsed: Math.random() > 0.5 ? 'gpt-4-vision' : 'gemini-1.5-pro'
      }
      
      setAbTestInfo(mockAbTestInfo)
      setAnalysisResult(analysisResult)
      setStep('result')
      
      // Reset feedback state for new analysis
      setQualityFeedback({ helpful: null, accuracy: null, comment: '' })
      setFeedbackSubmitted(false)
      
      // Refresh subscription usage after successful analysis
      await subscription.refresh()
      
      logger.info('Damage analysis completed successfully with enhanced AI client', { abTest: mockAbTestInfo })

    } catch (error) {
      const errorObj = toError(error)
      
      logger.error('Analysis failed:', errorObj)
      toast.error(errorObj.message)
      setStep('upload')
    }
  }

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        const base64 = result.split(',')[1] // Remove data:image/jpeg;base64, prefix
        resolve(base64)
      }
      reader.onerror = error => reject(error)
    })
  }


  const reset = () => {
    setStep('select_policy')
    setSelectedPolicy(null)
    setUploadedImage(null)
    setAnalysisResult(null)
    setAbTestInfo(null)
    setQualityFeedback({ helpful: null, accuracy: null, comment: '' })
    setFeedbackSubmitted(false)
  }

  const handleQualityFeedback = async (type: 'helpful' | 'accuracy' | 'comment', value: boolean | number | string) => {
    setQualityFeedback(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const submitQualityFeedback = async () => {
    if (!abTestInfo) return

    try {
      // In production, this would submit to the A/B testing API
      const feedbackData = {
        testId: abTestInfo.testId,
        variant: abTestInfo.variant,
        modelUsed: abTestInfo.modelUsed,
        featureId: 'damage-analyzer',
        feedback: qualityFeedback,
        timestamp: new Date().toISOString()
      }

      logger.info('Quality feedback submitted', feedbackData)
      
      // Mock API call - in production, would call actual endpoint
      // await fetch('/api/admin/quality-feedback', {
      //   method: 'POST',
      //   body: JSON.stringify(feedbackData)
      // })

      setFeedbackSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch (error) {
      logger.error('Failed to submit quality feedback:', toError(error))
      toast.error('Failed to submit feedback')
    }
  }

  const renderContent = () => {
    switch (step) {
      case 'select_policy':
        return <PolicySelector policies={policies} onSelect={handlePolicySelect} isLoading={isLoading} />
      case 'upload':
        return <UploadStep onUpload={handleImageUpload} onSwitchToCamera={() => setStep('capture')} />
      case 'capture':
        return <CameraCapture onCapture={handleCapture} onClose={() => setStep('upload')} />
      case 'analyzing':
        return <AnalyzingStep image={uploadedImage} />
      case 'result':
        return (
          <ResultStep 
            result={analysisResult!} 
            onReset={reset}
            abTestInfo={abTestInfo}
            qualityFeedback={qualityFeedback}
            feedbackSubmitted={feedbackSubmitted}
            onQualityFeedback={handleQualityFeedback}
            onSubmitFeedback={submitQualityFeedback}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <AIBreadcrumb section="AI Tools" page="Damage Analyzer" className="mb-4" />
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">AI Damage Analyzer</h1>
          <p className="text-lg text-gray-400 mt-2 max-w-3xl mx-auto">
            Upload a photo of property damage for an instant AI analysis, including severity, description, and coverage details from your policy.
          </p>
          <div className="mt-4">
            <FeatureLimitBadge feature="aiRequests" className="text-gray-400" />
          </div>
        </div>
        <Card className="bg-gray-800/50 border border-gray-700 shadow-2xl">
          <CardContent className="p-8">
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PolicySelector({ policies, onSelect, isLoading }: { policies: Policy[], onSelect: (policy: Policy) => void, isLoading: boolean }) {
  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>
  }
  return (
    <div>
      <h2 className="text-2xl font-semibold text-center text-white mb-6">Select a Policy to Analyze Against</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map(policy => (
          <button key={policy.id} onClick={() => onSelect(policy)} className="p-6 rounded-lg border-2 border-gray-700 hover:border-cyan-400 hover:bg-gray-800 transition text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-cyan-400" />
                <div>
                  <p className="font-bold text-lg text-white">{policy.provider}</p>
                  <p className="text-sm text-gray-400">{policy.policy_number}</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6 text-gray-500" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function UploadStep({ onUpload, onSwitchToCamera }: { onUpload: (files: File[]) => void, onSwitchToCamera: () => void }) {
  const onDrop = useCallback(onUpload, [onUpload])
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, multiple: false })

  return (
    <div className="text-center">
      <div {...getRootProps()} className={`p-12 border-2 border-dashed rounded-lg cursor-pointer transition ${isDragActive ? 'border-cyan-400 bg-gray-800' : 'border-gray-600 hover:border-cyan-500'}`}>
        <input {...getInputProps()} />
        <UploadCloud className="w-16 h-16 mx-auto text-gray-500 mb-4" />
        <p className="text-xl font-semibold text-white">Drag & drop a photo here, or click to select</p>
        <p className="text-gray-400 mt-2">Please upload one image at a time for the most accurate analysis.</p>
      </div>
      <div className="my-4 text-gray-500 font-semibold">OR</div>
      <Button onClick={onSwitchToCamera} size="lg" variant="outline">
        <Camera className="w-5 h-5 mr-2" />
        Use Camera
      </Button>
    </div>
  )
}

function AnalyzingStep({ image }: { image: File | null }) {
  return (
    <div className="text-center">
      {image && (
        <div className="max-h-64 rounded-lg mx-auto mb-6 relative">
          <OptimizedImage
            src={URL.createObjectURL(image)}
            alt="Damage analysis in progress"
            width={400}
            height={300}
            className="rounded-lg"
            priority={true}
          />
        </div>
      )}
      <h2 className="text-2xl font-semibold text-white mb-4">Analyzing Damage...</h2>
      <p className="text-gray-400 mb-6">Our AI is assessing the damage and cross-referencing your policy. This may take a moment.</p>
      <Progress value={50} className="w-full max-w-md mx-auto" />
    </div>
  )
}

function ResultStep({ 
  result, 
  onReset,
  abTestInfo,
  qualityFeedback,
  feedbackSubmitted,
  onQualityFeedback,
  onSubmitFeedback
}: { 
  result: AnalysisResult
  onReset: () => void
  abTestInfo: { testId: string; variant: 'A' | 'B'; modelUsed: string } | null
  qualityFeedback: { helpful: boolean | null; accuracy: number | null; comment: string }
  feedbackSubmitted: boolean
  onQualityFeedback: (type: 'helpful' | 'accuracy' | 'comment', value: boolean | number | string) => void
  onSubmitFeedback: () => void
}) {
  const getSeverityColor = (severity: string) => {
    if (severity === 'Severe') return 'text-red-400'
    if (severity === 'Moderate') return 'text-yellow-400'
    return 'text-green-400'
  }

  const getDamageIcon = (damageType: string) => {
    if (damageType.toLowerCase().includes('water')) return <Droplets className="w-6 h-6" />
    if (damageType.toLowerCase().includes('wind')) return <Wind className="w-6 h-6" />
    if (damageType.toLowerCase().includes('struct')) return <Home className="w-6 h-6" />
    if (damageType.toLowerCase().includes('electric')) return <Zap className="w-6 h-6" />
    return <Sparkles className="w-6 h-6" />
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Damage Details */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span className={getSeverityColor(result.severity)}>{getDamageIcon(result.damageType)}</span>
              <span className="text-white">Damage Assessment</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Damage Type</p>
                <p className="text-lg font-semibold text-white">{result.damageType}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Severity</p>
                <p className={`text-lg font-semibold ${getSeverityColor(result.severity)}`}>{result.severity}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Description</p>
                <p className="text-white">{result.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Coverage Details */}
        <Card className={`border-2 ${result.coverage.isCovered ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {result.coverage.isCovered ? <CheckCircle className="w-6 h-6 text-green-400" /> : <X className="w-6 h-6 text-red-400" />}
              <span className="text-white">Insurance Coverage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Policy</p>
                <p className="text-lg font-semibold text-white">{result.coverage.policy_provider} - {result.coverage.policy_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Relevant Clause</p>
                <p className="text-lg font-semibold text-white">{result.coverage.clause}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Clause Details</p>
                <p className="text-white">{result.coverage.clause_description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-white">
            <FileText className="w-6 h-6" />
            Recommended Next Steps
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-3">
                <ChevronRight className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <span className="text-white">{rec}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* A/B Testing Information and Quality Feedback */}
      {abTestInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* A/B Testing Information */}
          <Card className="bg-blue-900/20 border-blue-600/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-blue-300 text-base">
                <FlaskConical className="w-5 h-5" />
                A/B Test Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Test Variant:</span>
                  <Badge className={`${abTestInfo.variant === 'A' ? 'bg-green-600/20 text-green-300 border-green-600/30' : 'bg-purple-600/20 text-purple-300 border-purple-600/30'}`}>
                    <Target className="w-3 h-3 mr-1" />
                    Variant {abTestInfo.variant}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Model Used:</span>
                  <span className="text-sm text-white font-medium">{abTestInfo.modelUsed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Test ID:</span>
                  <span className="text-xs text-gray-500 font-mono">{abTestInfo.testId}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quality Feedback */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white text-base">
                <Star className="w-5 h-5 text-yellow-400" />
                Quality Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Helpfulness */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Was this analysis helpful?</p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={qualityFeedback.helpful === true ? "default" : "outline"}
                      onClick={() => onQualityFeedback('helpful', true)}
                      disabled={feedbackSubmitted}
                      className={qualityFeedback.helpful === true ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Yes
                    </Button>
                    <Button
                      size="sm"
                      variant={qualityFeedback.helpful === false ? "default" : "outline"}
                      onClick={() => onQualityFeedback('helpful', false)}
                      disabled={feedbackSubmitted}
                      className={qualityFeedback.helpful === false ? "bg-red-600 hover:bg-red-700" : ""}
                    >
                      <ThumbsDown className="w-4 h-4 mr-1" />
                      No
                    </Button>
                  </div>
                </div>

                {/* Accuracy Rating */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Rate the accuracy (1-5 stars):</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Button
                        key={rating}
                        size="sm"
                        variant="ghost"
                        onClick={() => onQualityFeedback('accuracy', rating)}
                        disabled={feedbackSubmitted}
                        className="p-1 h-8 w-8"
                      >
                        <Star 
                          className={`w-4 h-4 ${
                            qualityFeedback.accuracy && rating <= qualityFeedback.accuracy
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-400'
                          }`}
                        />
                      </Button>
                    ))}
                  </div>
                  {qualityFeedback.accuracy && (
                    <p className="text-xs text-gray-500 mt-1">
                      {qualityFeedback.accuracy} out of 5 stars
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <p className="text-sm text-gray-400 mb-2">Additional feedback (optional):</p>
                  <textarea
                    value={qualityFeedback.comment}
                    onChange={(e) => onQualityFeedback('comment', e.target.value)}
                    placeholder="Any additional thoughts on the analysis quality..."
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2 text-sm resize-none"
                    rows={2}
                    disabled={feedbackSubmitted}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  onClick={onSubmitFeedback}
                  disabled={feedbackSubmitted || (!qualityFeedback.helpful && !qualityFeedback.accuracy)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  {feedbackSubmitted ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Feedback Submitted
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 mr-2" />
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="text-center pt-6">
        <Button onClick={onReset} size="lg" variant="outline">
          <Sparkles className="w-5 h-5 mr-2" />
          Start New Analysis
        </Button>
      </div>
    </div>
  )
}

export default function DamageAnalyzerPage() {
  useAuthDebug('DamageAnalyzerPage')
  
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PermissionGuard 
          permission={AI_TOOLS_PERMISSIONS.DAMAGE_ANALYZER}
          featureName="AI Damage Analyzer"
        >
          <DamageAnalyzerContent />
        </PermissionGuard>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
