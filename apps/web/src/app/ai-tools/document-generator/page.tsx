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

import { FileText, Download, Copy, Sparkles, AlertTriangle, FileSearch, Calendar, Shield, Edit, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AIClientService } from '@/lib/ai/client-service'
import { aiModelConfigService } from '@/lib/ai/model-config-service'
import { liquidGlass } from '@/lib/styles/liquid-glass'


interface DocumentTemplate {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  category: 'claim' | 'appeal' | 'communication' | 'legal'
  fields: DocumentField[]
}

interface DocumentField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'number' | 'select'
  placeholder?: string
  required: boolean
  options?: string[]
}

const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'initial-claim',
    title: 'Initial Claim Letter',
    description: 'Formal notification of property damage claim',
    icon: FileText,
    category: 'claim',
    fields: [
      { id: 'policy_number', label: 'Policy Number', type: 'text', required: true },
      { id: 'date_of_loss', label: 'Date of Loss', type: 'date', required: true },
      { id: 'type_of_damage', label: 'Type of Damage', type: 'select', required: true,
        options: ['Hurricane', 'Flood', 'Fire', 'Wind', 'Hail', 'Water Leak', 'Other'] },
      { id: 'damage_description', label: 'Damage Description', type: 'textarea', required: true },
      { id: 'estimated_amount', label: 'Estimated Damage Amount', type: 'number', required: false }
    ]
  },
  {
    id: 'appeal-letter',
    title: 'Claim Appeal Letter',
    description: 'Appeal denied or underpaid insurance claims',
    icon: Shield,
    category: 'appeal',
    fields: [
      { id: 'claim_number', label: 'Claim Number', type: 'text', required: true },
      { id: 'denial_date', label: 'Denial/Decision Date', type: 'date', required: true },
      { id: 'original_amount', label: 'Original Claim Amount', type: 'number', required: true },
      { id: 'offered_amount', label: 'Offered Amount', type: 'number', required: true },
      { id: 'dispute_reasons', label: 'Reasons for Dispute', type: 'textarea', required: true },
      { id: 'supporting_evidence', label: 'Supporting Evidence', type: 'textarea', required: true }
    ]
  },
  {
    id: 'supplemental-claim',
    title: 'Supplemental Claim',
    description: 'Request additional coverage for discovered damage',
    icon: FileSearch,
    category: 'claim',
    fields: [
      { id: 'claim_number', label: 'Original Claim Number', type: 'text', required: true },
      { id: 'new_damage_date', label: 'Date New Damage Discovered', type: 'date', required: true },
      { id: 'new_damage_description', label: 'New Damage Description', type: 'textarea', required: true },
      { id: 'additional_amount', label: 'Additional Amount Requested', type: 'number', required: true },
      { id: 'contractor_assessment', label: 'Contractor Assessment Details', type: 'textarea', required: false }
    ]
  },
  {
    id: 'proof-of-loss',
    title: 'Proof of Loss Statement',
    description: 'Sworn statement of damage and loss details',
    icon: Calendar,
    category: 'legal',
    fields: [
      { id: 'claim_number', label: 'Claim Number', type: 'text', required: true },
      { id: 'property_address', label: 'Property Address', type: 'textarea', required: true },
      { id: 'itemized_losses', label: 'Itemized List of Losses', type: 'textarea', required: true },
      { id: 'total_loss_amount', label: 'Total Loss Amount', type: 'number', required: true },
      { id: 'deductible', label: 'Deductible Amount', type: 'number', required: true }
    ]
  }
]

export default function DocumentGeneratorPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [generatedDocument, setGeneratedDocument] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const [configuredModel, setConfiguredModel] = useState<string>('openai')
  const [fallbackModel, setFallbackModel] = useState<string>('gemini')
  const { user } = useAuth()
  const aiClient = useMemo(() => new AIClientService(), [])

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        // Load model configuration
        const modelConfig = await aiModelConfigService.getModelForFeature('document-generator')
        if (modelConfig) {
          setConfiguredModel(modelConfig.model)
          setFallbackModel(modelConfig.fallback)
        }

        // Check API keys
        const keysStatus = await aiClient.checkKeys()
        setHasOpenAIKey(keysStatus.hasOpenAIKey)
        setHasGeminiKey(keysStatus.hasGeminiKey)
      } catch (error) {
        logger.error('Failed to initialize document generator:', toError(error))
      }
    }
    initializeComponent()
  }, [aiClient])

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const generateDocument = async () => {
    if (!selectedTemplate || !hasOpenAIKey && !hasGeminiKey) return

    setIsGenerating(true)
    const startTime = Date.now()

    try {
      // Add user info to form data
      const completeData = {
        ...formData,
        sender_name: user?.user_metadata?.firstName + ' ' + user?.user_metadata?.lastName || 'Policyholder',
        sender_email: user?.email || '',
        current_date: new Date().toLocaleDateString()
      }

      const prompt = `Generate a professional ${selectedTemplate.title} for an insurance claim with the following details:

${Object.entries(completeData).map(([key, value]) =>
  `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${value}`
).join('\n')}

Important guidelines:
- Use formal business letter format
- Include relevant Florida insurance law references where applicable
- Be clear, concise, and professional
- Include all necessary legal language
- Format for easy reading with proper paragraphs
- End with appropriate signature block

The letter should be ready to send after adding the recipient's information.`

      // Helper to get provider from model name
      const getProviderFromModel = (modelName: string): 'openai' | 'gemini' | 'claude' | 'grok' => {
        if (modelName.includes('gpt') || modelName.includes('openai')) return 'openai'
        if (modelName.includes('gemini') || modelName.includes('google')) return 'gemini'
        if (modelName.includes('claude') || modelName.includes('anthropic')) return 'claude'
        if (modelName.includes('grok')) return 'grok'
        return 'openai' // default fallback
      }

      // Helper to calculate estimated cost
      const calculateEstimatedCost = (model: string, responseLength: number): number => {
        const costPer1K: Record<string, number> = {
          'gpt-4-turbo': 0.01,
          'gpt-4': 0.03,
          'gemini-1.5-pro': 0.005,
          'claude-3-opus': 0.015,
          'claude-3-sonnet': 0.003,
          'grok-beta': 0.002
        }

        const tokens = Math.ceil(responseLength / 4) // Rough token estimate
        const cost = (tokens / 1000) * (costPer1K[model] || 0.01)
        return parseFloat(cost.toFixed(6))
      }

      const primaryProvider = getProviderFromModel(configuredModel)

      try {
        // Try primary model
        const response = await aiClient.chat([
          { role: 'system', content: 'You are an expert insurance claim documentation specialist with deep knowledge of Florida property insurance laws and regulations.' },
          { role: 'user', content: prompt }
        ], primaryProvider as 'openai' | 'gemini')

        // Track successful usage
        const responseTime = Date.now() - startTime
        await aiModelConfigService.trackModelUsage({
          featureId: 'document-generator',
          model: configuredModel,
          success: true,
          responseTime,
          cost: calculateEstimatedCost(configuredModel, response.length)
        })

        setGeneratedDocument(response)
        setShowPreview(true)
        toast.success('Document generated successfully!')

      } catch (primaryError) {
        // Try fallback model
        const fallbackProvider = getProviderFromModel(fallbackModel)

        try {
          const response = await aiClient.chat([
            { role: 'system', content: 'You are an expert insurance claim documentation specialist with deep knowledge of Florida property insurance laws and regulations.' },
            { role: 'user', content: prompt }
          ], fallbackProvider as 'openai' | 'gemini')

          // Track fallback usage
          const responseTime = Date.now() - startTime
          await aiModelConfigService.trackModelUsage({
            featureId: 'document-generator',
            model: fallbackModel,
            success: true,
            responseTime,
            cost: calculateEstimatedCost(fallbackModel, response.length)
          })

          setGeneratedDocument(response)
          setShowPreview(true)
          toast.success('Document generated successfully (using fallback model)!')

        } catch (fallbackError) {
          throw new Error('Both primary and fallback AI models failed')
        }
      }

    } catch (error) {
      // Track failed usage
      const responseTime = Date.now() - startTime
      await aiModelConfigService.trackModelUsage({
        featureId: 'document-generator',
        model: configuredModel,
        success: false,
        responseTime
      })

      logger.error('Error generating document:', toError(error))
      toast.error('Failed to generate document')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedDocument)
    toast.success('Document copied to clipboard!')
  }

  const downloadDocument = () => {
    const blob = new Blob([generatedDocument], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedTemplate?.id}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Document downloaded!')
  }

  const isFormValid = selectedTemplate?.fields.every(
    field => !field.required || formData[field.id]
  )

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Premium Header with Advanced Liquid Glass */}
            <div className="mb-8 relative">
              {/* Premium Background Orb */}
              <div className={liquidGlass.orbs.header} />

              <div className="relative">
                <Link
                  href="/ai-tools"
                  className={liquidGlass.links.button}
                >
                  ← Back to AI Tools
                </Link>
                <div className="flex items-center gap-4 mb-6">
                  <div className={liquidGlass.iconContainers.large}>
                    <FileSearch className={`h-8 w-8 text-indigo-300 ${liquidGlass.text.glowPrimary}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className={`text-4xl font-bold text-white ${liquidGlass.text.shadowLight}`}>Document Generator</h1>
                      <Badge className={liquidGlass.badges.warning}>
                        Beta
                      </Badge>
                    </div>
                    <p className={`text-gray-300 max-w-3xl ${liquidGlass.text.shadowDark}`}>
                      Generate professional insurance claim documents, appeals, and correspondence. Our AI ensures proper formatting, legal language, and Florida-specific requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium API Key Check */}
            {!hasOpenAIKey && !hasGeminiKey && (
              <Alert className={liquidGlass.cards.error}>
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  AI API keys required. Please configure OpenAI or Gemini API keys to use this tool.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Premium Template Selection */}
              <div className="lg:col-span-1">
                <Card className={liquidGlass.cards.default}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className={liquidGlass.iconContainers.small}>
                        <FileText className={`h-5 w-5 text-indigo-300 ${liquidGlass.text.glowSecondary}`} />
                      </div>
                      Document Templates
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {DOCUMENT_TEMPLATES.map((template) => {
                        const Icon = template.icon
                        return (
                          <button
                            key={template.id}
                            onClick={() => {
                              setSelectedTemplate(template)
                              setFormData({})
                              setShowPreview(false)
                            }}
                            className={`w-full text-left p-3 rounded-lg transition-all ${
                              selectedTemplate?.id === template.id
                                ? liquidGlass.backgrounds.accent
                                : 'hover:bg-gray-700/50 backdrop-blur-md'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                selectedTemplate?.id === template.id
                                  ? liquidGlass.iconContainers.small
                                  : 'bg-gray-700/50 backdrop-blur-md'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  selectedTemplate?.id === template.id
                                    ? `text-indigo-400 ${liquidGlass.text.glowSubtle}`
                                    : 'text-gray-400'
                                }`} />
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-semibold ${
                                  selectedTemplate?.id === template.id
                                    ? 'text-white'
                                    : 'text-gray-300'
                                }`}>
                                  {template.title}
                                </h4>
                                <p className="text-xs text-gray-400 mt-1">
                                  {template.description}
                                </p>
                                <Badge
                                  variant="outline"
                                  className="mt-2 text-xs capitalize text-gray-400 border-gray-600"
                                >
                                  {template.category}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Premium Form/Preview */}
              <div className="lg:col-span-2">
                {!selectedTemplate ? (
                  <Card className={liquidGlass.cards.default}>
                    <CardContent className="p-12 text-center">
                      <div className={`${liquidGlass.iconContainers.large} mx-auto mb-4 w-fit`}>
                        <FileText className={`h-12 w-12 text-indigo-300 ${liquidGlass.text.glowSecondary}`} />
                      </div>
                      <p className="text-gray-400">
                        Select a document template to get started
                      </p>
                    </CardContent>
                  </Card>
                ) : showPreview ? (
                  <Card className={liquidGlass.cards.success}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Document Preview</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(false)}
                            className={liquidGlass.buttons.secondary}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={copyToClipboard}
                            className={liquidGlass.buttons.info}
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            onClick={downloadDocument}
                            className={liquidGlass.buttons.success}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg p-6 backdrop-blur-md">
                        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono">
                          {generatedDocument}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className={liquidGlass.cards.default}>
                    <CardHeader>
                      <CardTitle className="text-white">{selectedTemplate.title}</CardTitle>
                      <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-4" onSubmit={(e) => {
                        e.preventDefault()
                        generateDocument()
                      }}>
                        {selectedTemplate.fields.map((field) => (
                          <div key={field.id}>
                            <Label className="text-gray-300">
                              {field.label}
                              {field.required && <span className="text-red-400 ml-1">*</span>}
                            </Label>
                            {field.type === 'textarea' ? (
                              <Textarea
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                                className={`mt-1 ${liquidGlass.inputs.default}`}
                                rows={4}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                required={field.required}
                                className={`mt-1 w-full ${liquidGlass.inputs.default} rounded-md px-3 py-2`}
                              >
                                <option value="">Select {field.label}</option>
                                {field.options?.map(option => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : (
                              <Input
                                type={field.type}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                placeholder={field.placeholder}
                                required={field.required}
                                className={`mt-1 ${liquidGlass.inputs.default}`}
                              />
                            )}
                          </div>
                        ))}

                        <div className="pt-4">
                          <Button
                            type="submit"
                            disabled={!isFormValid || isGenerating || (!hasOpenAIKey && !hasGeminiKey)}
                            className={`w-full ${liquidGlass.buttons.primary} disabled:opacity-50`}
                          >
                            {isGenerating ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-4 w-4 mr-2" />
                                Generate Document
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Premium Document Tips */}
            <Card className={liquidGlass.cards.info}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`${liquidGlass.iconContainers.medium} flex-shrink-0 mt-0.5`}>
                    <Shield className={`h-6 w-6 text-blue-300 ${liquidGlass.text.glowSecondary}`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Document Tips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <ul className="space-y-1">
                        <li>• Always review generated documents before sending</li>
                        <li>• Add specific details and evidence references</li>
                        <li>• Keep copies of all correspondence</li>
                      </ul>
                      <ul className="space-y-1">
                        <li>• Send important documents via certified mail</li>
                        <li>• Follow up if no response within 10 days</li>
                        <li>• Consult an attorney for complex disputes</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
