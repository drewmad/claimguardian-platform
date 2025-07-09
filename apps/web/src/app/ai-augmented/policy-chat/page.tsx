'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { AIChatInterface } from '@/components/ai/ai-chat-interface'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Shield, 
  FileText, 
  AlertCircle, 
  Sparkles,
  Home,
  DollarSign,
  Clock,
  BookOpen,
  ChevronRight
} from 'lucide-react'
import { AIClient } from '@/lib/ai/client'
import { AI_PROMPTS } from '@/lib/ai/config'
import { useSupabase } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

const POLICY_TOPICS = [
  { label: 'Wind Coverage', color: 'blue' },
  { label: 'Flood Insurance', color: 'cyan' },
  { label: 'Additional Living Expenses', color: 'green' },
  { label: 'Personal Property', color: 'purple' },
  { label: 'Liability Protection', color: 'orange' },
  { label: 'Loss Assessment', color: 'pink' },
]

export default function PolicyChatPage() {
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gemini'>('openai')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const { supabase, user } = useSupabase()
  const aiClient = new AIClient()

  const handleSendMessage = async (message: string, history: any[]) => {
    try {
      // Log the interaction
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'ai_policy_chat',
        resource_type: 'ai_interaction',
        metadata: { 
          model: selectedModel,
          topic: selectedTopic,
          message_length: message.length,
        },
      })

      // Prepare messages with context
      const messages = [
        { role: 'system' as const, content: AI_PROMPTS.POLICY_CHAT.SYSTEM },
        ...history.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user' as const, content: message },
      ]

      // Add topic context if selected
      if (selectedTopic) {
        messages[0].content += `\n\nThe user is specifically asking about: ${selectedTopic}`
      }

      const response = await aiClient.chat(messages, selectedModel)
      return response
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to get AI response')
      throw error
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">AI Policy Advisor</h1>
              <Badge className="ml-2">Beta</Badge>
            </div>
            <p className="text-gray-600 max-w-3xl">
              Get instant answers about your insurance policy, coverage details, and claim procedures. 
              Our AI specializes in Florida property insurance and hurricane-related coverage.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Sidebar */}
            <div className="space-y-6">
              {/* Model Selection */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Model
                </h3>
                <div className="space-y-2">
                  <Button
                    variant={selectedModel === 'openai' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedModel('openai')}
                  >
                    GPT-4 (OpenAI)
                  </Button>
                  <Button
                    variant={selectedModel === 'gemini' ? 'default' : 'outline'}
                    className="w-full justify-start"
                    onClick={() => setSelectedModel('gemini')}
                  >
                    Gemini Pro (Google)
                  </Button>
                </div>
              </Card>

              {/* Quick Questions */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Quick Questions
                </h3>
                <div className="space-y-2">
                  {QUICK_QUESTIONS.map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                      onClick={() => {
                        const input = document.querySelector('textarea') as HTMLTextAreaElement
                        if (input) {
                          input.value = item.question
                          input.dispatchEvent(new Event('input', { bubbles: true }))
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">{item.label}</span>
                        <ChevronRight className="h-4 w-4 ml-auto text-gray-400 group-hover:text-gray-600" />
                      </div>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Policy Topics */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3">Policy Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {POLICY_TOPICS.map((topic, index) => (
                    <Badge
                      key={index}
                      variant={selectedTopic === topic.label ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedTopic(
                        selectedTopic === topic.label ? null : topic.label
                      )}
                    >
                      {topic.label}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            {/* Main Chat Interface */}
            <div className="lg:col-span-2">
              <AIChatInterface
                systemPrompt={AI_PROMPTS.POLICY_CHAT.SYSTEM}
                placeholder="Ask about your insurance policy, coverage, deductibles, or claim procedures..."
                welcomeMessage="Hello! I'm your AI policy advisor. I can help you understand your Florida property insurance policy, including hurricane and flood coverage, deductibles, claim procedures, and more. What would you like to know?"
                onSendMessage={handleSendMessage}
                className="h-[600px]"
              />

              {/* Disclaimer */}
              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
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
    </ProtectedRoute>
  )
}