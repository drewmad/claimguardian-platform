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
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export async function GET() {
  try {
    // WARNING: API key moved to server-side - use /api/ai endpoint instead
    // WARNING: API key moved to server-side - use /api/ai endpoint instead
    
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasGeminiKey = !!process.env.GEMINI_API_KEY
    const hasClaudeKey = !!process.env.ANTHROPIC_API_KEY
    const hasGrokKey = !!process.env.XAI_API_KEY

    return NextResponse.json({
      hasOpenAIKey,
      hasGeminiKey,
      hasClaudeKey,
      hasGrokKey,
      hasAnyKey: hasOpenAIKey || hasGeminiKey || hasClaudeKey || hasGrokKey
    })
  } catch (error) {
    logger.error('API Keys check error', {}, error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}