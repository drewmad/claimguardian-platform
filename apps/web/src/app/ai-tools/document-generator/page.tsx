'use client'

import { FileText, Download, Copy, Sparkles, AlertTriangle, FileSearch, Calendar, Shield, Edit, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'

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
  const { user } = useAuth()
  const aiClient = useMemo(() => new AIClientService(), [])

  useEffect(() => {
    const checkKeys = async () => {
      try {
        const keysStatus = await aiClient.checkKeys()
        setHasOpenAIKey(keysStatus.hasOpenAIKey)
        setHasGeminiKey(keysStatus.hasGeminiKey)
      } catch (error) {
        console.error('Failed to check API keys:', error)
      }
    }
    checkKeys()
  }, [aiClient])

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  const generateDocument = async () => {
    if (!selectedTemplate || !hasOpenAIKey && !hasGeminiKey) return

    setIsGenerating(true)
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

      const response = await aiClient.chat([
        { role: 'system', content: 'You are an expert insurance claim documentation specialist with deep knowledge of Florida property insurance laws and regulations.' },
        { role: 'user', content: prompt }
      ], hasOpenAIKey ? 'openai' : 'gemini')

      setGeneratedDocument(response)
      setShowPreview(true)
      toast.success('Document generated successfully!')
    } catch (error) {
      console.error('Error generating document:', error)
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
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/25 via-purple-500/20 to-blue-600/25 rounded-full blur-3xl animate-pulse opacity-40" />
              
              <div className="relative">
                <Link 
                  href="/ai-tools" 
                  className="text-indigo-400 hover:text-indigo-300 text-sm mb-6 inline-flex items-center gap-2 backdrop-blur-md bg-gray-800/50 px-3 py-2 rounded-lg border border-indigo-400/20 shadow-[0_8px_32px_rgba(99,102,241,0.15)] hover:shadow-[0_8px_32px_rgba(99,102,241,0.25)] transition-all duration-300"
                >
                  ← Back to AI Tools
                </Link>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-indigo-600/30 to-purple-600/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(99,102,241,0.3)] hover:shadow-[0_25px_80px_rgba(99,102,241,0.4)] transition-all duration-700">
                    <FileSearch className="h-8 w-8 text-indigo-300 drop-shadow-[0_0_20px_rgba(99,102,241,0.8)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]">Document Generator</h1>
                      <Badge className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-300 border-yellow-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(245,158,11,0.2)]">
                        Beta
                      </Badge>
                    </div>
                    <p className="text-gray-300 max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                      Generate professional insurance claim documents, appeals, and correspondence. Our AI ensures proper formatting, legal language, and Florida-specific requirements.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium API Key Check */}
            {!hasOpenAIKey && !hasGeminiKey && (
              <Alert className="bg-red-900/20 border-red-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(220,38,38,0.2)]">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  AI API keys required. Please configure OpenAI or Gemini API keys to use this tool.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Premium Template Selection */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(99,102,241,0.2)]">
                        <FileText className="h-5 w-5 text-indigo-300 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
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
                                ? 'bg-indigo-600/20 border border-indigo-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(99,102,241,0.2)]'
                                : 'hover:bg-gray-700/50 backdrop-blur-md'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                selectedTemplate?.id === template.id
                                  ? 'bg-indigo-600/20 backdrop-blur-md border border-white/10'
                                  : 'bg-gray-700/50 backdrop-blur-md'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  selectedTemplate?.id === template.id
                                    ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]'
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
                  <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)]">
                    <CardContent className="p-12 text-center">
                      <div className="p-4 bg-gradient-to-br from-indigo-600/30 to-purple-600/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(99,102,241,0.2)] mx-auto mb-4 w-fit">
                        <FileText className="h-12 w-12 text-indigo-300 drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]" />
                      </div>
                      <p className="text-gray-400">
                        Select a document template to get started
                      </p>
                    </CardContent>
                  </Card>
                ) : showPreview ? (
                  <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(34,197,94,0.15)] transition-all duration-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Document Preview</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(false)}
                            className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 backdrop-blur-md"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={copyToClipboard}
                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)] backdrop-blur-md border-0"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            onClick={downloadDocument}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-[0_8px_32px_rgba(34,197,94,0.3)] backdrop-blur-md border-0"
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
                  <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(99,102,241,0.15)] transition-all duration-500">
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
                                className="mt-1 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                                rows={4}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                required={field.required}
                                className="mt-1 w-full bg-gray-700/50 border-gray-600/50 text-white rounded-md px-3 py-2 backdrop-blur-md"
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
                                className="mt-1 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                              />
                            )}
                          </div>
                        ))}

                        <div className="pt-4">
                          <Button
                            type="submit"
                            disabled={!isFormValid || isGenerating || (!hasOpenAIKey && !hasGeminiKey)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-[0_8px_32px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.4)] transition-all duration-300 backdrop-blur-md border-0 disabled:opacity-50"
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
            <Card className="bg-gradient-to-br from-blue-900/30 to-indigo-900/20 backdrop-blur-xl border-blue-600/40 shadow-[0_20px_60px_rgba(59,130,246,0.2)] hover:shadow-[0_25px_80px_rgba(59,130,246,0.3)] transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-600/30 to-indigo-600/20 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(59,130,246,0.3)] flex-shrink-0 mt-0.5">
                    <Shield className="h-6 w-6 text-blue-300 drop-shadow-[0_0_12px_rgba(59,130,246,0.7)]" />
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