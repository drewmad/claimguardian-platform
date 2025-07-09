'use client'

import { useState, useRef } from 'react'
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
  DollarSign,
  Clock,
  BookOpen,
  ChevronRight,
  Upload,
  X,
  FileCheck
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

interface UploadedDocument {
  id: string
  name: string
  content: string
  type: string
  uploadedAt: Date
}

export default function PolicyChatPage() {
  const [selectedModel, setSelectedModel] = useState<'openai' | 'gemini'>('openai')
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedDocs, setSelectedDocs] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { supabase, user } = useSupabase()
  const aiClient = new AIClient()

  const processDocument = async (file: File) => {
    setIsProcessing(true)
    try {
      let content = ''
      
      if (file.type === 'application/pdf') {
        // For PDF files, we'll use a simpler approach for now
        // In production, you'd want to use a proper PDF parsing library or server-side processing
        toast.info('PDF processing: For best results, please convert your PDF to text format')
        content = `[PDF Document: ${file.name}]\n\nNote: Full PDF text extraction requires server-side processing. For now, please use the text version of your policy document for best results.`
      } else if (file.type.startsWith('text/') || file.type === 'application/json') {
        // For text files, read directly
        content = await file.text()
      } else {
        throw new Error('Unsupported file type. Please upload PDF or text files.')
      }

      const doc: UploadedDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        content: content.slice(0, 50000), // Limit to 50k chars
        type: file.type,
        uploadedAt: new Date(),
      }

      setUploadedDocuments(prev => [...prev, doc])
      toast.success(`Document "${file.name}" uploaded successfully!`)

      // Log the upload
      await supabase.from('audit_logs').insert({
        user_id: user?.id,
        action: 'document_upload',
        resource_type: 'policy_document',
        metadata: { 
          filename: file.name,
          file_type: file.type,
          content_length: content.length,
        },
      })
    } catch (error) {
      console.error('Document processing error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process document')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        await processDocument(files[i])
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeDocument = (docId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId))
    setSelectedDocs(prev => prev.filter(id => id !== docId))
    toast.success('Document removed')
  }

  const toggleDocSelection = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    )
  }

  const compareDocuments = () => {
    if (selectedDocs.length < 2) {
      toast.error('Please select at least 2 documents to compare')
      return
    }
    setCompareMode(true)
    toast.success('Comparison mode activated')
  }

  const handleSendMessage = async (message: string, history: Array<{id: string; role: string; content: string; timestamp: Date}>) => {
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
          has_documents: uploadedDocuments.length,
          compare_mode: compareMode,
        },
      })

      // Prepare messages with context
      let systemPrompt = AI_PROMPTS.POLICY_CHAT.SYSTEM

      // Add document context if available
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

              {/* Document Upload */}
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Policy Documents ({uploadedDocuments.length})
                  </span>
                  {uploadedDocuments.length >= 2 && (
                    <Button
                      size="sm"
                      variant={compareMode ? "default" : "outline"}
                      onClick={() => setCompareMode(!compareMode)}
                    >
                      Compare
                    </Button>
                  )}
                </h3>
                
                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                    {uploadedDocuments.map(doc => (
                      <div 
                        key={doc.id} 
                        className={`flex items-start gap-2 p-2 rounded-lg border ${
                          selectedDocs.includes(doc.id) 
                            ? 'bg-blue-50 border-blue-300' 
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        {compareMode && (
                          <input
                            type="checkbox"
                            checked={selectedDocs.includes(doc.id)}
                            onChange={() => toggleDocSelection(doc.id)}
                            className="mt-1"
                          />
                        )}
                        <FileCheck className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{doc.name}</p>
                          <p className="text-xs text-gray-600">
                            {doc.uploadedAt.toLocaleTimeString()}
                          </p>
                        </div>
                        <button
                          onClick={() => removeDocument(doc.id)}
                          className="text-gray-500 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {compareMode && uploadedDocuments.length >= 2 && (
                  <Button
                    size="sm"
                    className="w-full mb-3"
                    onClick={compareDocuments}
                    disabled={selectedDocs.length < 2}
                  >
                    Compare Selected ({selectedDocs.length})
                  </Button>
                )}

                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,.json"
                    onChange={handleFileSelect}
                    className="hidden"
                    multiple
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Add Document
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-gray-600">
                    Upload multiple policies to compare coverage or get comprehensive answers.
                  </p>
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
                welcomeMessage={`Hello! I'm your AI policy advisor. I can help you understand your Florida property insurance policy, including hurricane and flood coverage, deductibles, claim procedures, and more.${
                  uploadedDocuments.length > 0 
                    ? `\n\nI see you've uploaded ${uploadedDocuments.length} document${uploadedDocuments.length > 1 ? 's' : ''}: ${uploadedDocuments.map(d => `"${d.name}"`).join(', ')}. ${compareMode ? "I'm in comparison mode and will highlight differences between your policies." : "I'll use these documents to provide specific answers about your policy."}` 
                    : '\n\nYou can upload policy documents for specific answers or compare multiple policies.'
                } What would you like to know?`}
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