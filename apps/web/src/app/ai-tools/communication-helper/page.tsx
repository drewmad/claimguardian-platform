'use client'

import { MessageSquare, Copy, RefreshCw, Sparkles, FileText, Phone, Mail, Calendar, AlertTriangle, Edit3, Target, Brain, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"
import { toError } from '@claimguardian/utils'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { AIClientService } from '@/lib/ai/client-service'


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
  const aiClient = useMemo(() => new AIClientService(), [])

  useEffect(() => {
    const checkKeys = async () => {
      try {
        const keysStatus = await aiClient.checkKeys()
        setHasOpenAIKey(keysStatus.hasOpenAIKey)
        setHasGeminiKey(keysStatus.hasGeminiKey)
      } catch (error) {
        logger.error('Failed to check API keys:', toError(error))
      }
    }
    checkKeys()
  }, [aiClient])

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
      logger.error('Error generating message:', toError(error))
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
        <div className="p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Premium Header with Advanced Liquid Glass */}
            <div className="mb-8 relative">
              {/* Premium Background Orb */}
              <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-pink-400/25 via-rose-500/20 to-purple-600/25 rounded-full blur-3xl animate-pulse opacity-40" />
              
              <div className="relative">
                <Link 
                  href="/ai-tools" 
                  className="text-pink-400 hover:text-pink-300 text-sm mb-6 inline-flex items-center gap-2 backdrop-blur-md bg-gray-800/50 px-3 py-2 rounded-lg border border-pink-400/20 shadow-[0_8px_32px_rgba(236,72,153,0.15)] hover:shadow-[0_8px_32px_rgba(236,72,153,0.25)] transition-all duration-300"
                >
                  ← Back to AI Tools
                </Link>
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-gradient-to-br from-pink-600/30 to-purple-600/30 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_60px_rgba(236,72,153,0.3)] hover:shadow-[0_25px_80px_rgba(236,72,153,0.4)] transition-all duration-700">
                    <MessageSquare className="h-8 w-8 text-pink-300 drop-shadow-[0_0_20px_rgba(236,72,153,0.8)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h1 className="text-4xl font-bold text-white drop-shadow-[0_2px_20px_rgba(255,255,255,0.3)]">Communication Helper</h1>
                      <Badge className="bg-gradient-to-r from-yellow-600/30 to-orange-600/30 text-yellow-300 border-yellow-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(245,158,11,0.2)]">
                        Beta
                      </Badge>
                    </div>
                    <p className="text-gray-300 max-w-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]">
                      AI-powered assistance for writing professional emails and messages to insurance companies. Get the right tone and include all necessary information.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Premium Templates */}
              <div className="lg:col-span-1">
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 mb-6 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(236,72,153,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-pink-600/30 to-purple-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(236,72,153,0.2)]">
                        <FileText className="h-5 w-5 text-pink-300 drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
                      </div>
                      Message Templates
                    </CardTitle>
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
                                ? 'bg-pink-600/20 border border-pink-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(236,72,153,0.2)]'
                                : 'hover:bg-gray-700/50 backdrop-blur-md'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${
                                selectedTemplate?.id === template.id
                                  ? 'bg-pink-600/20 backdrop-blur-md border border-white/10'
                                  : 'bg-gray-700/50 backdrop-blur-md'
                              }`}>
                                <Icon className={`h-4 w-4 ${
                                  selectedTemplate?.id === template.id
                                    ? 'text-pink-400 drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]'
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

                {/* Premium Tone Selection */}
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(147,51,234,0.15)] transition-all duration-500">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <div className="p-2 bg-gradient-to-br from-purple-600/30 to-pink-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(147,51,234,0.2)]">
                        <Target className="h-5 w-5 text-purple-300 drop-shadow-[0_0_12px_rgba(147,51,234,0.6)]" />
                      </div>
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
                              ? 'bg-purple-600/20 border border-purple-600/30 backdrop-blur-md shadow-[0_8px_32px_rgba(147,51,234,0.2)]'
                              : 'hover:bg-gray-700/50 backdrop-blur-md'
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

              {/* Premium Message Composer */}
              <div className="lg:col-span-2">
                <Card className="bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(59,130,246,0.15)] transition-all duration-500">
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
                        <div className="p-4 bg-gradient-to-br from-pink-600/30 to-purple-600/20 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_8px_32px_rgba(236,72,153,0.2)] mx-auto mb-4 w-fit">
                          <MessageSquare className="h-12 w-12 text-pink-300 drop-shadow-[0_0_12px_rgba(236,72,153,0.6)]" />
                        </div>
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
                              className="mt-1 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
                            />
                          </div>
                          <div>
                            <Label className="text-gray-300">Claim Number</Label>
                            <Input
                              value={claimNumber}
                              onChange={(e) => setClaimNumber(e.target.value)}
                              placeholder="CLM-123456"
                              className="mt-1 bg-gray-700/50 border-gray-600/50 text-white placeholder-gray-400 backdrop-blur-md"
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
                          className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-[0_8px_32px_rgba(236,72,153,0.3)] hover:shadow-[0_12px_40px_rgba(236,72,153,0.4)] transition-all duration-300 backdrop-blur-md border-0"
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

                {/* Premium Generated Message */}
                {generatedMessage && (
                  <Card className="mt-6 bg-gray-800/70 backdrop-blur-xl border-gray-700/50 shadow-[0_12px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(34,197,94,0.15)] transition-all duration-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white">Generated Message</CardTitle>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={regenerate}
                            className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 border-gray-600/50 backdrop-blur-md"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate
                          </Button>
                          <Button
                            size="sm"
                            onClick={copyToClipboard}
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-[0_8px_32px_rgba(34,197,94,0.3)] backdrop-blur-md border-0"
                          >
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-900/70 border border-gray-700/50 rounded-lg p-6 backdrop-blur-md">
                        <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans">
                          {generatedMessage}
                        </pre>
                      </div>
                      
                      {/* Premium AI Analysis */}
                      <div className="mt-4 p-4 bg-gradient-to-br from-blue-900/30 to-cyan-900/20 border border-blue-600/30 rounded-lg backdrop-blur-md shadow-[0_8px_32px_rgba(59,130,246,0.2)]">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-gradient-to-br from-blue-600/30 to-cyan-600/20 backdrop-blur-md rounded-lg border border-white/10 shadow-[0_8px_32px_rgba(59,130,246,0.2)] flex-shrink-0 mt-0.5">
                            <Brain className="h-4 w-4 text-cyan-300 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-cyan-300 mb-1">AI Analysis</h4>
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

            {/* Premium Communication Tips */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/20 backdrop-blur-xl border-purple-600/40 shadow-[0_20px_60px_rgba(147,51,234,0.2)] hover:shadow-[0_25px_80px_rgba(147,51,234,0.3)] transition-all duration-500">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-600/30 to-pink-600/20 backdrop-blur-md rounded-xl border border-white/10 shadow-[0_8px_32px_rgba(147,51,234,0.3)] flex-shrink-0">
                    <Edit3 className="h-6 w-6 text-purple-300 drop-shadow-[0_0_12px_rgba(147,51,234,0.7)]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Communication Best Practices</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                      <ul className="space-y-1">
                        <li>• Always keep records of all communications</li>
                        <li>• Send important messages via certified mail</li>
                        <li>• Include dates, times, and reference numbers</li>
                        <li>• Be specific about what you&apos;re requesting</li>
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
