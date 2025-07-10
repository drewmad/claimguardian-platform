import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const hasOpenAIKey = !!process.env.OPENAI_API_KEY
    const hasGeminiKey = !!process.env.GEMINI_API_KEY

    return NextResponse.json({
      hasOpenAIKey,
      hasGeminiKey,
      hasAnyKey: hasOpenAIKey || hasGeminiKey
    })
  } catch (error) {
    console.error('API Keys check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}