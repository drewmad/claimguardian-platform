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

import { Shield, AlertTriangle, Key, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { logger } from "@/lib/logger/production-logger"

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AIClientService } from '@/lib/ai/client-service'

interface APIKeyValidatorProps {
  onValidation: (hasKeys: boolean) => void
  requiredProviders?: ('openai' | 'gemini')[]
  children: React.ReactNode
}

export function APIKeyValidator({ 
  onValidation, 
  requiredProviders = ['openai', 'gemini'], 
  children 
}: APIKeyValidatorProps) {
  const [hasOpenAI, setHasOpenAI] = useState(false)
  const [hasGemini, setHasGemini] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkKeys = async () => {
      try {
        const aiClient = new AIClientService()
        const status = await aiClient.checkKeys()
        setHasOpenAI(status.hasOpenAIKey)
        setHasGemini(status.hasGeminiKey)
        
        const hasRequiredKeys = requiredProviders.some(provider => {
          if (provider === 'openai') return status.hasOpenAIKey
          if (provider === 'gemini') return status.hasGeminiKey
          return false
        })
        
        onValidation(hasRequiredKeys)
      } catch (error) {
        logger.error('Failed to check API keys:', error)
        onValidation(false)
      } finally {
        setLoading(false)
      }
    }

    checkKeys()
  }, [requiredProviders, onValidation])

  const hasAnyKey = hasOpenAI || hasGemini
  const needsOpenAI = requiredProviders.includes('openai')
  const needsGemini = requiredProviders.includes('gemini')

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!hasAnyKey || (needsOpenAI && !hasOpenAI) || (needsGemini && !hasGemini)) {
    return (
      <Card className="bg-amber-900/20 border-amber-600/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-400 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">API Configuration Required</h3>
              <p className="text-amber-200 mb-4">
                This AI tool requires API keys to function. Please configure the required providers:
              </p>
              
              <div className="space-y-2 mb-6">
                {needsOpenAI && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasOpenAI ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-gray-300">
                      OpenAI API Key {hasOpenAI ? '(Configured)' : '(Required)'}
                    </span>
                  </div>
                )}
                {needsGemini && (
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hasGemini ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-gray-300">
                      Google Gemini API Key {hasGemini ? '(Configured)' : '(Required)'}
                    </span>
                  </div>
                )}
              </div>

              <Alert className="bg-blue-900/20 border-blue-600/30 mb-4">
                <Key className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  Configure API keys in your environment variables (.env.local):
                  {needsOpenAI && <div className="mt-1 font-mono text-xs">OPENAI_API_KEY=your_key_here</div>}
                  {needsGemini && <div className="mt-1 font-mono text-xs">GEMINI_API_KEY=your_key_here</div>}
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-amber-300 border-amber-600 hover:bg-amber-900/20"
                  onClick={() => window.location.reload()}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-300 border-blue-600 hover:bg-blue-900/20"
                  onClick={() => window.open('https://docs.anthropic.com/en/docs/claude-code', '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Setup Guide
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return <>{children}</>
}
