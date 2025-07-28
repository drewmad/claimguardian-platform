'use client'

import { useState, useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MessageSquare, Send, Copy, RefreshCw, Sparkles, FileText, Phone, Mail, Calendar, AlertTriangle, Edit3, Target, Brain, Loader2 } from 'lucide-react'
import { AIClientService } from '@/lib/ai/client-service'
import { useAuth } from '@/components/auth/auth-provider'
import { toast } from 'sonner'

interface CommunicationTemplate {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'formal' | 'professional' | 'assertive' | 'friendly'
  context: string
}

const TEMPLATES: CommunicationTemplate[] = [
  {
    id: 'first-notice',
    title: 'First Notice of Loss',
    description: 'Initial claim notification to insurance company',
    icon: AlertTriangle,
    tone: 'professional',
    context: 'Notifying insurance company of new damage claim'
  },
  {
    id: 'follow-up',
    title: 'Claim Follow-Up',
    description: 'Check status of pending claim',
    icon: Calendar,
    tone: 'professional',
    context: 'Following up on claim that has no response'
  },
  {
    id: 'dispute',
    title: 'Dispute Settlement',
    description: 'Challenge low settlement offer',
    icon: FileText,
    tone: 'assertive',
    context: 'Disputing inadequate settlement amount'
  },
  {
    id: 'request-info',
    title: 'Request Information',
    description: 'Ask for claim details or documents',
    icon: Mail,
    tone: 'professional',
    context: 'Requesting specific information about claim'
  },
  {
    id: 'escalation',
    title: 'Escalate to Supervisor',
    description: 'Request supervisor intervention',
    icon: Phone,
    tone: 'formal',
    context: 'Escalating unresolved claim issues'
  }
]

const TONE_OPTIONS = [
  { value: 'formal', label: 'Formal', description: 'Official and highly professional' },
  { value: 'professional', label: 'Professional', description: 'Business-appropriate and clear' },
  { value: 'assertive', label: 'Assertive', description: 'Firm but respectful' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and conversational' }
]

export default function CommunicationHelperPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<CommunicationTemplate | null>(null)
  const [tone, setTone] = useState<string>('professional')
  const [recipientName, setRecipientName] = useState('')
  const [claimNumber, setClaimNumber] = useState('')
  const [keyPoints, setKeyPoints] = useState('')
  const [generatedMessage, setGeneratedMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasOpenAIKey, setHasOpenAIKey] = useState(false)
  const [hasGeminiKey, setHasGeminiKey] = useState(false)
  const { user } = useAuth()
  const aiClient = new AIClientService()

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
  }, [])

  const generateMessage = async () => {
    if (!selectedTemplate || !keyPoints.trim() || (!hasOpenAIKey && !hasGeminiKey)) return

    setIsGenerating(true)
    try {
      const prompt = `Write a ${tone} email for the following situation:

Context: ${selectedTemplate.context}
Recipient: ${recipientName || 'Insurance Company Representative'}
Claim Number: ${claimNumber || '[CLAIM NUMBER]'}
Sender: ${user?.user_metadata?.firstName} ${user?.user_metadata?.lastName}

Key points to address:
${keyPoints}

Guidelines:
- Use ${tone} tone throughout
- Be clear and concise
- Include all relevant claim details
- Request specific actions or responses
- Include appropriate greeting and sign-off
- Maintain professional boundaries
- Reference Florida insurance regulations if relevant

Format as a complete email ready to send.`

      const response = await aiClient.chat([
        { role: 'system', content: 'You are an expert insurance communication specialist who helps policyholders communicate effectively with insurance companies.' },
        { role: 'user', content: prompt }
      ], hasOpenAIKey ? 'openai' : 'gemini')

      setGeneratedMessage(response)
      toast.success('Message generated successfully!')
    } catch (error) {
      console.error('Error generating message:', error)
      toast.error('Failed to generate message')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedMessage)
    toast.success('Message copied to clipboard!')
  }

  const regenerate = () => {
    generateMessage()
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-600/20 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-pink-400" />
                </div>
                <h1 className="text-3xl font-bold text-white">Communication Helper</h1>
                <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">
                  AI Powered
                </Badge>
              </div>
              <p className="text-gray-400 max-w-3xl">
                AI-powered assistance for writing professional emails and messages to insurance companies. Get the right tone and include all necessary information.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Templates */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800 border-gray-700 mb-6">
                  <CardHeader>
                    <CardTitle className="text-white">Message Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {TEMPLATES.map((template) => {
                        const Icon = template.icon
                        return (
                          <button
                            key={template.id}
                            onClick={() => {
                              setSelectedTemplate(template)
                              setTone(template.tone)
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
                              <div>
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
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Tone Selection */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Message Tone
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {TONE_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTone(option.value)}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            tone === option.value
                              ? 'bg-purple-600/20 border border-purple-600/30'
                              : 'hover:bg-gray-700'
                          }`}
                        >
                          <h4 className={`font-medium ${
                            tone === option.value ? 'text-white' : 'text-gray-300'
                          }`}>
                            {option.label}
                          </h4>
                          <p className="text-xs text-gray-400 mt-1">
                            {option.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Message Composer */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">
                      {selectedTemplate ? selectedTemplate.title : 'Compose Message'}
                    </CardTitle>
                    {selectedTemplate && (
                      <p className="text-sm text-gray-400">{selectedTemplate.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {!selectedTemplate ? (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-400">
                          Select a message template to get started
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-gray-300">Recipient Name</Label>
                            <Input
                              value={recipientName}
                              onChange={(e) => setRecipientName(e.target.value)}
                              placeholder="Claims Department"
                              className="mt-1 bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300">Claim Number</Label>
                            <Input
                              value={claimNumber}
                              onChange={(e) => setClaimNumber(e.target.value)}
                              placeholder="CLM-123456"
                              className="mt-1 bg-gray-700 border-gray-600 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-gray-300">
                            Key Points to Address <span className="text-red-400">*</span>
                          </Label>
                          <Textarea
                            value={keyPoints}
                            onChange={(e) => setKeyPoints(e.target.value)}
                            placeholder="List the main points you want to communicate..."
                            className="mt-1 bg-gray-700 border-gray-600 text-white"
                            rows={6}
                          />
                        </div>

                        <Button
                          onClick={generateMessage}
                          disabled={!keyPoints.trim() || isGenerating || (!hasOpenAIKey && !hasGeminiKey)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isGenerating ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Message
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Generated Message */}
                {generatedMessage && (
                  <Card className="mt-6 bg-gray-800 border-gray-700">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Generated Message</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={regenerate}
                            className="bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          <Button
                            size="sm"
                            onClick={copyToClipboard}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans">
                          {generatedMessage}
                        </pre>
                      </div>
                      
                      {/* AI Analysis */}
                      <div className="mt-4 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Brain className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-blue-300 mb-1">AI Analysis</h4>
                            <p className="text-sm text-gray-300">
                              This message uses a {tone} tone and includes all key points. 
                              Remember to review and personalize before sending.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {/* Tips */}
            <Card className="bg-purple-900/20 border-purple-600/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Edit3 className="h-6 w-6 text-purple-400 flex-shrink-0" />
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Communication Best Practices</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <ul className="space-y-1">
                        <li>• Always keep records of all communications</li>
                        <li>• Send important messages via certified mail</li>
                        <li>• Include dates, times, and reference numbers</li>
                        <li>• Be specific about what you're requesting</li>
                      </ul>
                      <ul className="space-y-1">
                        <li>• Remain professional even when frustrated</li>
                        <li>• Set clear deadlines for responses</li>
                        <li>• CC relevant parties when appropriate</li>
                        <li>• Follow up if no response within 10 days</li>
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