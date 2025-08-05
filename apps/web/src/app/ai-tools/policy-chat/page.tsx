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

// Force dynamic rendering to prevent SSG issues with Supabase client
export const dynamic = 'force-dynamic'

import { Shield, FileText, AlertCircle, Sparkles, DollarSign, Clock, BookOpen, ChevronRight, FlaskConical, Target, ThumbsUp, ThumbsDown, Star, CheckCircle } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { enhancedAIClient } from '@/lib/ai/enhanced-client'
import { AI_PROMPTS } from '@/lib/ai/config'
import { aiErrorHelpers } from '@/lib/error-logger'
import { useSupabase } from '@/lib/supabase/client'

const QUICK_QUESTIONS = [
  {
    icon: Shield,
    label: 'Coverage Limits',
    question: 'What are my current coverage limits for hurricane damage?',
  },
  {
    icon: DollarSign,
    label: 'Deductibles',
    question: 'How do hurricane deductibles work in Florida?',
  },
  {
    icon: FileText,
    label: 'Filing a Claim',
    question: 'What documents do I need to file a hurricane damage claim?',
  },
  {
    icon: Clock,
    label: 'Claim Timeline',
    question: 'How long do I have to file a claim after hurricane damage?',
  },
]

interface UploadedDocument {
  id: string
  name: string
  url?: string
  content?: string
  type: string
  uploadedAt: Date
}

function PolicyChatContent() {
  const [selectedTopic] = useState<string | null>(null)
  const [uploadedDocuments] = useState<UploadedDocument[]>([])
  const [compareMode] = useState(false)
  const [selectedDocs] = useState<string[]>([])
  const [lastAbTestInfo, setLastAbTestInfo] = useState<{
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
  const { supabase } = useSupabase()
  const { user } = useAuth()

  const handleSendMessage = async (message: string, history: Array<{role: string; content: string}>) => {
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'ai_policy_chat',
        resource_type: 'ai_interaction',
        metadata: { 
          topic: selectedTopic,
          message_length: message.length,
          has_documents: uploadedDocuments.length,
          compare_mode: compareMode,
        },
      })

      let systemPrompt = AI_PROMPTS.POLICY_CHAT.SYSTEM

      if (uploadedDocuments.length > 0) {
        if (compareMode && selectedDocs.length >= 2) {
          systemPrompt += '\n\nThe user wants to compare the following policy documents:\n'
          selectedDocs.forEach(docId => {
            const doc = uploadedDocuments.find(d => d.id === docId)
            if (doc) {
              systemPrompt += `\n\nDocument: "${doc.name}"\n${doc.content}\n`
            }
          })
          systemPrompt += '\n\nWhen answering questions, compare and contrast these documents, highlighting differences in coverage, limits, deductibles, and exclusions.'
        } else {
          uploadedDocuments.forEach(doc => {
            systemPrompt += `\n\nDocument: "${doc.name}"\n${doc.content}\n`
          })
          systemPrompt += '\n\nUse these documents to provide specific answers based on the actual policy details when relevant.'
        }
      }

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...history.map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user' as const, content: message },
      ]

      if (selectedTopic) {
        messages[0].content += `\n\nThe user is specifically asking about: ${selectedTopic}`
      }

      // Use enhanced AI client with automatic model selection and A/B testing
      const response = await enhancedAIClient.enhancedChat({
        messages,
        featureId: 'policy-chat'
      })

      // Mock A/B test information (in production, this would come from the enhanced client)
      const mockAbTestInfo = {
        testId: `test_${Date.now()}`,
        variant: Math.random() > 0.5 ? 'A' as const : 'B' as const,
        modelUsed: Math.random() > 0.5 ? 'gpt-4-turbo' : 'gemini-1.5-pro'
      }
      
      setLastAbTestInfo(mockAbTestInfo)
      
      // Reset feedback state for new conversation
      setQualityFeedback({ helpful: null, accuracy: null, comment: '' })
      setFeedbackSubmitted(false)
      
      return response

    } catch (error) {
      await aiErrorHelpers.policyChat.log(error as Error, 'AI Response')
      toast.error('Failed to get AI response')
      throw error
    }
  }

  const handleQualityFeedback = async (type: 'helpful' | 'accuracy', value: boolean | number) => {
    setQualityFeedback(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const submitQualityFeedback = async () => {
    if (!lastAbTestInfo) return

    try {
      // In production, this would submit to the A/B testing API
      const feedbackData = {
        testId: lastAbTestInfo.testId,
        variant: lastAbTestInfo.variant,
        modelUsed: lastAbTestInfo.modelUsed,
        featureId: 'policy-chat',
        feedback: qualityFeedback,
        timestamp: new Date().toISOString()
      }

      // Log feedback submission
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'ai_quality_feedback',
        resource_type: 'ai_interaction',
        metadata: feedbackData
      })
      
      // Mock API call - in production, would call actual endpoint
      // await fetch('/api/admin/quality-feedback', {
      //   method: 'POST',
      //   body: JSON.stringify(feedbackData)
      // })

      setFeedbackSubmitted(true)
      toast.success('Thank you for your feedback!')
    } catch (error) {
      await aiErrorHelpers.policyChat.log(error as Error, 'Quality Feedback')
      toast.error('Failed to submit feedback')
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Shield className="h-6 w-6 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">AI Policy Advisor</h1>
            <Badge variant="outline" className="ml-2 text-gray-400 border-gray-600">Beta</Badge>
          </div>
          <p className="text-gray-400 max-w-3xl">
            Get instant answers about your insurance policy, coverage details, and claim procedures. 
            Our AI specializes in Florida property insurance and hurricane-related coverage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  AI Model Configuration
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Model Selection</p>
                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-white font-medium">Database-Driven</p>
                      <p className="text-blue-300 text-xs">Automatic A/B testing & optimization</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Features</p>
                    <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                      <div className="space-y-1">
                        <p className="text-gray-300 text-xs">✓ Automatic model selection</p>
                        <p className="text-gray-300 text-xs">✓ A/B testing integration</p>
                        <p className="text-gray-300 text-xs">✓ Custom prompts & fallbacks</p>
                        <p className="text-gray-300 text-xs">✓ Usage tracking & analytics</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2 text-white">
                  <BookOpen className="h-4 w-4 text-cyan-400" />
                  Quick Questions
                </h3>
                <div className="space-y-2">
                  {QUICK_QUESTIONS.map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-700 transition-colors group"
                      onClick={() => {
                        const input = document.querySelector('textarea') as HTMLTextAreaElement
                        if (input) {
                          input.value = item.question
                          input.dispatchEvent(new Event('input', { bubbles: true }))
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-300">{item.label}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-gray-300" />
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <AIChatInterface
              systemPrompt={AI_PROMPTS.POLICY_CHAT.SYSTEM}
              placeholder="Ask about your insurance policy, coverage, deductibles, or claim procedures..."
              welcomeMessage={`Hello! I'm your AI policy advisor. I can help you understand your Florida property insurance policy, including hurricane and flood coverage, deductibles, claim procedures, and more.${
                uploadedDocuments.length > 0 
                  ? `\n\nI see you've uploaded ${uploadedDocuments.length} document${uploadedDocuments.length > 1 ? 's' : ''}: ${uploadedDocuments.map(d => `"${d.name}"`).join(', ')}. ${compareMode ? "I'm in comparison mode and will highlight differences between your policies." : "I'll use these documents to provide specific answers about your policy."}` 
                  : '\n\nYou can upload policy documents for specific answers or compare multiple policies.'
              } What would you like to know?`}
              onSendMessage={handleSendMessage}
              className="h-[600px]"
            />

            {/* A/B Testing Information and Quality Feedback */}
            {lastAbTestInfo && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* A/B Testing Information */}
                <Card className="bg-blue-900/20 border-blue-600/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <FlaskConical className="w-5 h-5 text-blue-300" />
                      <h3 className="text-blue-300 font-semibold text-sm">A/B Test Information</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Test Variant:</span>
                        <Badge className={`text-xs ${lastAbTestInfo.variant === 'A' ? 'bg-green-600/20 text-green-300 border-green-600/30' : 'bg-purple-600/20 text-purple-300 border-purple-600/30'}`}>
                          <Target className="w-3 h-3 mr-1" />
                          Variant {lastAbTestInfo.variant}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Model Used:</span>
                        <span className="text-xs text-white font-medium">{lastAbTestInfo.modelUsed}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">Test ID:</span>
                        <span className="text-xs text-gray-500 font-mono">{lastAbTestInfo.testId.slice(-8)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quality Feedback */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-5 h-5 text-yellow-400" />
                      <h3 className="text-white font-semibold text-sm">Quality Feedback</h3>
                    </div>
                    <div className="space-y-3">
                      {/* Helpfulness */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Was this response helpful?</p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={qualityFeedback.helpful === true ? "default" : "outline"}
                            onClick={() => handleQualityFeedback('helpful', true)}
                            disabled={feedbackSubmitted}
                            className={`text-xs px-2 py-1 h-7 ${qualityFeedback.helpful === true ? "bg-green-600 hover:bg-green-700" : ""}`}
                          >
                            <ThumbsUp className="w-3 h-3 mr-1" />
                            Yes
                          </Button>
                          <Button
                            size="sm"
                            variant={qualityFeedback.helpful === false ? "default" : "outline"}
                            onClick={() => handleQualityFeedback('helpful', false)}
                            disabled={feedbackSubmitted}
                            className={`text-xs px-2 py-1 h-7 ${qualityFeedback.helpful === false ? "bg-red-600 hover:bg-red-700" : ""}`}
                          >
                            <ThumbsDown className="w-3 h-3 mr-1" />
                            No
                          </Button>
                        </div>
                      </div>

                      {/* Accuracy Rating */}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Rate accuracy (1-5 stars):</p>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <Button
                              key={rating}
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQualityFeedback('accuracy', rating)}
                              disabled={feedbackSubmitted}
                              className="p-0 h-6 w-6"
                            >
                              <Star 
                                className={`w-3 h-3 ${
                                  qualityFeedback.accuracy && rating <= qualityFeedback.accuracy
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-400'
                                }`}
                              />
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Submit Button */}
                      <Button
                        onClick={submitQualityFeedback}
                        disabled={feedbackSubmitted || (!qualityFeedback.helpful && !qualityFeedback.accuracy)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-xs py-1 h-6"
                        size="sm"
                      >
                        {feedbackSubmitted ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Submitted
                          </>
                        ) : (
                          <>
                            <Star className="w-3 h-3 mr-1" />
                            Submit
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="mt-4 p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-200">
                  <p className="font-semibold mb-1">Important Disclaimer</p>
                  <p>
                    This AI assistant provides general information about insurance policies. 
                    Always consult your actual policy documents and insurance agent for specific 
                    coverage details and binding information.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PolicyChatPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <PolicyChatContent />
      </DashboardLayout>
    </ProtectedRoute>
  )
}