import { NextRequest, NextResponse } from 'next/server'
import { AIClient } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { messages, model = 'openai' } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      )
    }

    const aiClient = new AIClient()
    const response = await aiClient.chat(messages, model)

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI Chat API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}