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
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { logger } from "@/lib/logger/production-logger"

import { AIClientService } from '@/lib/ai/client-service'

const aiClient = new AIClientService()

// AI Image Analysis
export function useAIImageAnalysis() {
  return useMutation({
    mutationFn: async ({ 
      image, 
      prompt, 
      model = 'openai' 
    }: { 
      image: string; 
      prompt: string; 
      model?: 'openai' | 'gemini' 
    }) => {
      return aiClient.analyzeImage({ image, prompt, model })
    },
    onError: (error) => {
      toast.error('Failed to analyze image')
      logger.error('AI image analysis error:', error)
    },
  })
}

// AI Chat
export function useAIChat() {
  return useMutation({
    mutationFn: async ({ 
      messages, 
      model = 'openai',
      systemPrompt
    }: { 
      messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
      model?: 'openai' | 'gemini';
      systemPrompt?: string;
    }) => {
      // If systemPrompt is provided, prepend it as a system message
      const allMessages = systemPrompt 
        ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
        : messages;
      
      return aiClient.chat(allMessages, model)
    },
    onError: (error) => {
      toast.error('Failed to get AI response')
      logger.error('AI chat error:', error)
    },
  })
}

// AI Document Analysis
export function useAIDocumentAnalysis() {
  return useMutation({
    mutationFn: async ({ 
      documentId, 
      analysisType 
    }: { 
      documentId: string; 
      analysisType: 'policy' | 'estimate' | 'correspondence' 
    }) => {
      // This would call a server action that handles document analysis
      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, analysisType }),
      })
      
      if (!response.ok) {
        throw new Error('Document analysis failed')
      }
      
      return response.json()
    },
    onError: (error) => {
      toast.error('Failed to analyze document')
      logger.error('AI document analysis error:', error)
    },
  })
}

// AI Bulk Analysis (for multiple items)
export function useAIBulkAnalysis<T, R = unknown>() {
  return useMutation({
    mutationFn: async ({ 
      items, 
      processor,
      batchSize = 5,
      onProgress
    }: { 
      items: T[];
      processor: (item: T) => Promise<R>;
      batchSize?: number;
      onProgress?: (completed: number, total: number) => void;
    }) => {
      const results = []
      
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize)
        const batchResults = await Promise.all(
          batch.map(item => processor(item).catch(error => ({ error, item })))
        )
        results.push(...batchResults)
        
        if (onProgress) {
          onProgress(Math.min(i + batchSize, items.length), items.length)
        }
      }
      
      return results
    },
    onError: (error) => {
      toast.error('Bulk analysis failed')
      logger.error('AI bulk analysis error:', error)
    },
  })
}
