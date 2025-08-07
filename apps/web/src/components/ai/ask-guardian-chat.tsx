/**
 * @fileMetadata
 * @owner ai-team
 * @purpose "Ask Guardian AI chatbot component for insurance and property assistance"
 * @dependencies ["react", "lucide-react"]
 * @status stable
 */
'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Send, Paperclip, Shield, Loader2, Bot, User } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { enhancedAIClient } from '@/lib/ai/enhanced-client'
import { toast } from 'sonner'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: File[]
}

interface AskGuardianChatProps {
  isOpen: boolean
  onClose: () => void
  context?: {
    propertyId?: string
    policyId?: string
    claimId?: string
  }
}

export function AskGuardianChat({ isOpen, onClose, context }: AskGuardianChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const [hasInitialized, setHasInitialized] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: "Hello! I'm Guardian AI. How can I help you today? You can also attach an image.",
        timestamp: new Date()
      }])
      setHasInitialized(true)
    }
  }, [isOpen, hasInitialized])

  const handleSend = async () => {
    if (!input.trim() && !attachedFile) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      attachments: attachedFile ? [attachedFile] : undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // Prepare context for AI
      let systemPrompt = `You are Guardian AI, an expert insurance and property assistant for ClaimGuardian.
      You help users with insurance policies, claims, property management, and disaster preparedness.
      Be helpful, concise, and professional.`

      if (context?.propertyId) {
        systemPrompt += `\nContext: User is viewing property ${context.propertyId}`
      }
      if (context?.policyId) {
        systemPrompt += `\nContext: User is viewing policy ${context.policyId}`
      }
      if (context?.claimId) {
        systemPrompt += `\nContext: User is viewing claim ${context.claimId}`
      }

      // Process image if attached
      let imageData = null
      if (attachedFile && attachedFile.type.startsWith('image/')) {
        const reader = new FileReader()
        imageData = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(attachedFile)
        })
      }

      // Prepare messages with image data if available
      const chatMessages = [
        { role: 'system' as const, content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'system' | 'user' | 'assistant', content: m.content })),
        {
          role: 'user' as const,
          content: imageData
            ? `${input}\n\n[User has attached an image: ${attachedFile?.name}]`
            : input
        }
      ]

      // Get AI response
      const response = await enhancedAIClient.enhancedChat({
        messages: chatMessages,
        featureId: 'ask-guardian'
      })

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
      setAttachedFile(null)
    } catch (error) {
      console.error('Error getting AI response:', error)
      toast.error('Failed to get response. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }
      setAttachedFile(file)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 h-[600px] flex flex-col">
      <Card className="flex-1 bg-gray-900/95 backdrop-blur-xl border-gray-700 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Ask Guardian</h3>
              <p className="text-xs text-gray-400">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs opacity-75">📎 {message.attachments[0].name}</p>
                  </div>
                )}
                <p className="text-xs mt-1 opacity-60">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-gray-300" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-700">
          {attachedFile && (
            <div className="mb-2 p-2 bg-gray-800 rounded-lg flex items-center justify-between">
              <span className="text-xs text-gray-400 truncate">📎 {attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileAttach}
              className="hidden"
            />

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Type or attach an image..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />

            <button
              onClick={handleSend}
              disabled={isLoading || (!input.trim() && !attachedFile)}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

// Floating button to open chat
export function AskGuardianButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center group"
    >
      <Shield className="w-7 h-7 text-white group-hover:scale-110 transition-transform" />
      <span className="absolute -top-8 right-0 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Ask Guardian AI
      </span>
    </button>
  )
}
