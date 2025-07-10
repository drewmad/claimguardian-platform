import { NextRequest, NextResponse } from 'next/server'
import { AIClient } from '@/lib/ai/client'

export async function POST(request: NextRequest) {
  try {
    const { image, prompt, model = 'openai' } = await request.json()

    if (!image || !prompt) {
      return NextResponse.json(
        { error: 'Image and prompt are required' },
        { status: 400 }
      )
    }

    const aiClient = new AIClient()
    const response = await aiClient.analyzeImage({ image, prompt, model })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('AI Image Analysis API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}