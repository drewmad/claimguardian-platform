'use client'

// Force dynamic rendering to prevent SSG issues with Supabase client
export const dynamic = 'force-dynamic'

import { Shield, FileText, AlertCircle, Sparkles, DollarSign, Clock, BookOpen, ChevronRight } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { LazyAIChatInterface as AIChatInterface } from '@/components/lazy'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AIClientService } from '@/lib/ai/client-service'
import { AI_PROMPTS } from '@/lib/ai/config'
import { aiErrorHelpers, performanceTimer } from '@/lib/error-logger'
import { useSupabase } from '@/lib/supabase/client'
import { aiModelConfigService } from '@/lib/ai/model-config-service'

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
  const [configuredModel, setConfiguredModel] = useState<string>('openai')
  const [fallbackModel, setFallbackModel] = useState<string>('gemini')
  const [isLoadingConfig, setIsLoadingConfig] = useState(true)
  const [selectedTopic] = useState<string | null>(null)
  const [uploadedDocuments] = useState<UploadedDocument[]>([])
  const [compareMode] = useState(false)
  const [selectedDocs] = useState<string[]>([])
  const { supabase } = useSupabase()
  const { user } = useAuth()
  const aiClient = new AIClientService()

  // Load admin-configured model on component mount
  useEffect(() => {
    async function loadModelConfig() {
      try {
        const modelConfig = await aiModelConfigService.getModelForFeature('policy-chat')
        if (modelConfig) {
          setConfiguredModel(modelConfig.model)
          setFallbackModel(modelConfig.fallback)
        }
      } catch (error) {
        console.warn('Failed to load model configuration, using defaults:', error)
      } finally {
        setIsLoadingConfig(false)
      }
    }
    loadModelConfig()
  }, [])

  const handleSendMessage = async (message: string, history: Array<{role: string; content: string}>) => {
    const startTime = Date.now()
    
    try {
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'ai_policy_chat',
        resource_type: 'ai_interaction',
        metadata: { 
          model: configuredModel,
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
        const response = await aiClient.chat(messages, primaryProvider)
        
        // Track successful usage
        const responseTime = Date.now() - startTime
        await aiModelConfigService.trackModelUsage({
          featureId: 'policy-chat',
          model: configuredModel,
          success: true,
          responseTime,
          cost: calculateEstimatedCost(configuredModel, response.length)
        })
        
        return response

      } catch (primaryError) {
        // Try fallback model
        const fallbackProvider = getProviderFromModel(fallbackModel)
        
        try {
          const response = await aiClient.chat(messages, fallbackProvider)
          
          // Track fallback usage
          const responseTime = Date.now() - startTime
          await aiModelConfigService.trackModelUsage({
            featureId: 'policy-chat',
            model: fallbackModel,
            success: true,
            responseTime,
            cost: calculateEstimatedCost(fallbackModel, response.length)
          })
          
          return response

        } catch (fallbackError) {
          throw new Error('Both primary and fallback AI models failed')
        }
      }

    } catch (error) {
      // Track failed usage
      const responseTime = Date.now() - startTime
      await aiModelConfigService.trackModelUsage({
        featureId: 'policy-chat',
        model: configuredModel,
        success: false,
        responseTime
      })
      
      await aiErrorHelpers.policyChat.log(error as Error, 'AI Response')
      toast.error('Failed to get AI response')
      throw error
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
                {isLoadingConfig ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    Loading configuration...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Primary Model</p>
                      <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-3">
                        <p className="text-white font-medium">{configuredModel}</p>
                        <p className="text-blue-300 text-xs">Configured by admin</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Fallback Model</p>
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3">
                        <p className="text-gray-300 text-sm">{fallbackModel}</p>
                        <p className="text-gray-500 text-xs">Used if primary fails</p>
                      </div>
                    </div>
                  </div>
                )}
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