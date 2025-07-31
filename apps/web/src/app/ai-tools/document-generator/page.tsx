'use client'

import { FileText, Download, Copy, Sparkles, AlertTriangle, FileSearch, Calendar, Shield, Edit, Loader2 } from 'lucide-react'
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
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-600/20 rounded-lg">
                  <FileSearch className="h-6 w-6 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Document Generator</h1>
                <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">
                  AI Powered
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                Generate professional insurance claim documents, appeals, and correspondence. Our AI ensures proper formatting, legal language, and Florida-specific requirements.
              </p>
            </div>

            {/* API Key Check */}
            {!hasOpenAIKey && !hasGeminiKey && (
              <Alert className="bg-red-900/20 border-red-600/30">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  AI API keys required. Please configure OpenAI or Gemini API keys to use this tool.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Template Selection */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Document Templates</CardTitle>
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
                                ? 'bg-blue-600/20 border border-blue-600/30'
                                : 'hover:bg-gray-700'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                selectedTemplate?.id === template.id
                                  ? 'bg-blue-600/20'
                                  : 'bg-gray-700'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  selectedTemplate?.id === template.id
                                    ? 'text-blue-400'
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

              {/* Form/Preview */}
              <div className="lg:col-span-2">
                {!selectedTemplate ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardContent className="p-12 text-center">
                      <FileText className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">
                        Select a document template to get started
                      </p>
                    </CardContent>
                  </Card>
                ) : showPreview ? (
                  <Card className="bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Document Preview</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPreview(false)}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={copyToClipboard}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            onClick={downloadDocument}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-mono">
                          {generatedDocument}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gray-800 border-gray-700">
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
                                className="mt-1 bg-gray-700 border-gray-600 text-white"
                                rows={4}
                              />
                            ) : field.type === 'select' ? (
                              <select
                                value={formData[field.id] || ''}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                required={field.required}
                                className="mt-1 w-full bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2"
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
                                className="mt-1 bg-gray-700 border-gray-600 text-white"
                              />
                            )}
                          </div>
                        ))}

                        <div className="pt-4">
                          <Button
                            type="submit"
                            disabled={!isFormValid || isGenerating || (!hasOpenAIKey && !hasGeminiKey)}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
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

            {/* Tips */}
            <Card className="bg-blue-900/20 border-blue-600/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Shield className="h-6 w-6 text-blue-400 flex-shrink-0 mt-0.5" />
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