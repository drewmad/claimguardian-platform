import { useMutation } from '@tanstack/react-query'
import { AIClientService } from '@/lib/ai/client-service'
import { toast } from 'sonner'

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
      console.error('AI image analysis error:', error)
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
      messages: Array<{ role: string; content: string }>;
      model?: 'openai' | 'gemini';
      systemPrompt?: string;
    }) => {
      return aiClient.chat({ messages, model, systemPrompt })
    },
    onError: (error) => {
      toast.error('Failed to get AI response')
      console.error('AI chat error:', error)
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
      console.error('AI document analysis error:', error)
    },
  })
}

// AI Bulk Analysis (for multiple items)
export function useAIBulkAnalysis<T>() {
  return useMutation({
    mutationFn: async ({ 
      items, 
      processor,
      batchSize = 5,
      onProgress
    }: { 
      items: T[];
      processor: (item: T) => Promise<any>;
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
      console.error('AI bulk analysis error:', error)
    },
  })
}