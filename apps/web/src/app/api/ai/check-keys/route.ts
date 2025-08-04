import { NextResponse } from 'next/server'
import { logger } from "@/lib/logger/production-logger"

export async function GET() {
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasGeminiKey = !!process.env.GEMINI_API_KEY

    return NextResponse.json({
      hasOpenAIKey,
      hasGeminiKey,
      hasAnyKey: hasOpenAIKey || hasGeminiKey
    })
  } catch (error) {
    logger.error('API Keys check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}