'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { ImageUploadAnalyzer } from '@/components/ai/image-upload-analyzer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Camera,
  AlertTriangle,
  CheckCircle,
  FileText,
  Download,
  Sparkles,
  Home,
  Droplets,
  Wind,
  Zap,
  Shield,
  AlertCircle
} from 'lucide-react'
import { AIClient } from '@/lib/ai/client'
import { AI_PROMPTS } from '@/lib/ai/config'
import { useSupabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

const SEVERITY_COLORS = {
  minor: 'green',
  moderate: 'yellow',
  severe: 'orange',
  total_loss: 'red',
}

export default function DamageAnalyzerPage() {
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gemini'>('openai')
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const { supabase, user } = useSupabase()
  const aiClient = new AIClient()

  const analyzeImages = async (files: File[]) => {
    try {
      const results: DamageItem[] = []
      const safetyWarnings = new Set<string>()
      const immediateActions = new Set<string>()

      // Analyze each image
      for (let i = 0; i < files.length; i++) {
        toast.loading(`Analyzing image ${i + 1} of ${files.length}...`)

        // Convert to base64
        const base64 = await fileToBase64(files[i])

        const prompt = `${AI_PROMPTS.DAMAGE_ANALYZER.SYSTEM}

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
          const parsed = JSON.parse(response)
          results.push(...parsed.damage_items)
          parsed.safety_warnings?.forEach((w: string) => safetyWarnings.add(w))
          parsed.immediate_actions?.forEach((a: string) => immediateActions.add(a))
        } catch (e) {
          // Fallback parsing if not valid JSON
          results.push({
            id: `damage-${Date.now()}-${i}`,
            type: 'other',
            severity: 'moderate',
            location: `Image ${i + 1}`,
            description: response,
            safety_concerns: [],
            repair_priority: 'standard',
          })
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
        },
      })

      toast.success('Damage analysis complete!')
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze images')
      throw error
    }
  }

  const generateReport = async () => {
    if (!analysisResult) return

    setIsGeneratingReport(true)
    try {
      // TODO: Generate PDF report
      toast.success('Report generated successfully!')
    } catch (error) {
      toast.error('Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Camera className="h-6 w-6 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">AI Damage Analyzer</h1>
              <Badge className="ml-2">Beta</Badge>
            </div>
            <p className="text-gray-600 max-w-3xl">
              Upload photos of property damage for instant AI analysis. Get detailed assessments, 
              severity ratings, and documentation guidance for your insurance claim.
            </p>
          </div>

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
                >
                  GPT-4 Vision
                </Button>
                <Button
                  size="sm"
                  variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                  onClick={() => setSelectedModel('gemini')}
                >
                  Gemini Vision
                </Button>
              </div>
            </div>
          </Card>

          {/* Upload Section */}
          {!analysisResult && (
            <ImageUploadAnalyzer
              onAnalyze={analyzeImages}
              maxFiles={20}
              maxSize={10}
              title="Upload Damage Photos"
              description="Take clear photos of all damaged areas. Include wide shots for context and close-ups for detail."
              className="mb-6"
            />
          )}

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Overall Summary */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold">Analysis Summary</h2>
                  <Badge 
                    variant={analysisResult.overall_severity === 'Critical' ? 'destructive' : 'default'}
                    className="text-base px-3 py-1"
                  >
                    {analysisResult.overall_severity} Damage
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">
                      {analysisResult.total_items}
                    </p>
                    <p className="text-sm text-gray-600">Damage Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-red-600">
                      {analysisResult.damage_items.filter(d => d.severity === 'severe' || d.severity === 'total_loss').length}
                    </p>
                    <p className="text-sm text-gray-600">Severe Items</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-orange-600">
                      {analysisResult.damage_items.filter(d => d.repair_priority === 'immediate').length}
                    </p>
                    <p className="text-sm text-gray-600">Immediate Repairs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">
                      {analysisResult.safety_warnings.length}
                    </p>
                    <p className="text-sm text-gray-600">Safety Concerns</p>
                  </div>
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
              </Card>

              {/* Damage Items */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Detailed Damage Assessment</h2>
                {analysisResult.damage_items.map((item) => {
                  const Icon = DAMAGE_ICONS[item.type as keyof typeof DAMAGE_ICONS] || AlertCircle
                  return (
                    <Card key={item.id} className="p-4">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg bg-${SEVERITY_COLORS[item.severity]}-100`}>
                          <Icon className={`h-5 w-5 text-${SEVERITY_COLORS[item.severity]}-600`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold capitalize">{item.type} Damage</h3>
                            <Badge variant="outline" className="capitalize">
                              {item.severity}
                            </Badge>
                            {item.repair_priority === 'immediate' && (
                              <Badge variant="destructive">Immediate Action</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Location:</strong> {item.location}
                          </p>
                          <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                          {item.estimated_cost_range && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Estimated Cost:</strong> {item.estimated_cost_range}
                            </p>
                          )}
                          {item.safety_concerns.length > 0 && (
                            <div className="mt-2 p-2 bg-red-50 rounded">
                              <p className="text-xs font-semibold text-red-700 mb-1">Safety Concerns:</p>
                              <ul className="text-xs text-red-600 list-disc list-inside">
                                {item.safety_concerns.map((concern, idx) => (
                                  <li key={idx}>{concern}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
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

              {/* Actions */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setAnalysisResult(null)}
                  variant="outline"
                >
                  Analyze More Photos
                </Button>
                <Button
                  onClick={generateReport}
                  disabled={isGeneratingReport}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Report
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}