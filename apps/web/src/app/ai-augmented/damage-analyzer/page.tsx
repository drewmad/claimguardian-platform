'use client'

import {
  Camera,
  AlertTriangle,
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
  X
} from 'lucide-react'
import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { toast } from 'sonner'

import { getPolicies } from '@/actions/policies'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { CameraCapture } from '@/components/camera/camera-capture'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { AIBreadcrumb } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAuthDebug } from '@/hooks/use-auth-debug'

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
  const [step, setStep] = useState<'select_policy' | 'upload' | 'capture' | 'analyzing' | 'result'>('select_policy')
  const [policies, setPolicies] = useState<Policy[]>([])
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch policies on component mount
  useEffect(() => {
    async function loadPolicies() {
      setIsLoading(true)
      try {
        // const result = await getPolicies(); // Real implementation
        // if (result.error) throw new Error(result.error.message);
        // setPolicies(result.data || []);
        setPolicies(MOCK_POLICIES) // Mock implementation
      } catch (error) {
        toast.error('Failed to load insurance policies.')
        console.error(error)
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

  const startAnalysis = (file: File) => {
    setStep('analyzing')
    // Simulate AI analysis
    setTimeout(() => {
      // In a real app, you'd send the image and policy to a backend service.
      // Here, we'll just pick a mock result.
      const mockResultKey = file.name.includes('roof') ? 'roof-leak' : 'siding-damage'
      const result = MOCK_ANALYSIS[mockResultKey]
      if (selectedPolicy) {
        result.coverage.policy_provider = selectedPolicy.provider
        result.coverage.policy_number = selectedPolicy.policy_number
      }
      setAnalysisResult(result)
      setStep('result')
    }, 3000)
  }

  const reset = () => {
    setStep('select_policy')
    setSelectedPolicy(null)
    setUploadedImage(null)
    setAnalysisResult(null)
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
        return <ResultStep result={analysisResult!} onReset={reset} />
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
      {image && <img src={URL.createObjectURL(image)} alt="Damage analysis" className="max-h-64 rounded-lg mx-auto mb-6" />}
      <h2 className="text-2xl font-semibold text-white mb-4">Analyzing Damage...</h2>
      <p className="text-gray-400 mb-6">Our AI is assessing the damage and cross-referencing your policy. This may take a moment.</p>
      <Progress value={50} className="w-full max-w-md mx-auto" />
    </div>
  )
}

function ResultStep({ result, onReset }: { result: AnalysisResult, onReset: () => void }) {
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
        <DamageAnalyzerContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}