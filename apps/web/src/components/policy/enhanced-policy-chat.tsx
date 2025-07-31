'use client'

import { FileText, Shield, Upload, X } from 'lucide-react'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AIClientService } from '@/lib/ai/client-service'
import { createBrowserSupabaseClient } from '@claimguardian/db'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  citations?: Array<{
    section: string
    content: string
  }>
}

interface EnhancedPolicyChatProps {
  userId: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
}

export function EnhancedPolicyChat({ userId, messages, onSendMessage }: EnhancedPolicyChatProps) {
  const [uploadedPolicy, setUploadedPolicy] = useState<{ url: string; name: string } | null>(null)
  const [uploading, setUploading] = useState(false)
  const supabase = createBrowserSupabaseClient()
  const aiClient = new AIClientService()

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF or TXT file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB')
      return
    }

    setUploading(true)
    try {
      // Upload to Supabase Storage
      const fileName = `${userId}/policy-chat/${Date.now()}-${file.name}`
      const { data, error } = await supabase.storage
        .from('policy-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('policy-documents')
        .getPublicUrl(data.path)

      setUploadedPolicy({ url: publicUrl, name: file.name })
      toast.success('Policy document uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload policy document')
    } finally {
      setUploading(false)
    }
  }, [userId, supabase])

  const removePolicy = useCallback(() => {
    setUploadedPolicy(null)
  }, [])

  const handleSendMessageWithPolicy = useCallback(async (message: string) => {
    try {
      // Convert messages to the format expected by the Edge Function
      const formattedMessages = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }))

      formattedMessages.push({
        role: 'user' as const,
        content: message
      })

      const response = await aiClient.chatWithPolicy({
        messages: formattedMessages,
        policyDocument: uploadedPolicy ? {
          fileUrl: uploadedPolicy.url,
          type: 'application/pdf'
        } : undefined
      })

      // Add the response to the chat
      await onSendMessage(response.response)

      // If there are citations, you could display them separately
      if (response.citations && response.citations.length > 0) {
        console.log('Policy citations:', response.citations)
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to send message')
    }
  }, [messages, uploadedPolicy, aiClient, onSendMessage])

  return (
    <div className="space-y-4">
      {/* Policy Upload Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          {!uploadedPolicy ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-white">Upload Policy Document</p>
                  <p className="text-sm text-gray-400">Add your policy for personalized answers</p>
                </div>
              </div>
              <label htmlFor="policy-upload">
                <input
                  id="policy-upload"
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="sr-only"
                  disabled={uploading}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={uploading}
                  className="cursor-pointer"
                  asChild
                >
                  <span>{uploading ? 'Uploading...' : 'Select File'}</span>
                </Button>
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="font-medium text-white">{uploadedPolicy.name}</p>
                  <p className="text-sm text-gray-400">Policy document loaded</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={removePolicy}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Indicator */}
      {uploadedPolicy && (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <Shield className="w-4 h-4" />
          <span>AI is now using your policy document to provide accurate answers</span>
        </div>
      )}
    </div>
  )
}