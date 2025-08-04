import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface PolicyChatRequest {
  messages: ChatMessage[]
  policyDocument?: {
    fileUrl?: string
    content?: string
    type?: string
  }
  userId?: string
}

interface PolicyChatResponse {
  response: string
  citations?: Array<{
    section: string
    content: string
  }>
}

const SYSTEM_PROMPT = `You are an expert insurance policy advisor specializing in Florida property insurance. 
You help homeowners understand their insurance policies, coverage limits, deductibles, and claim procedures.

Key guidelines:
- Provide accurate, specific information based on the policy document when available
- Explain insurance terms in simple language
- Focus on Florida-specific regulations and requirements
- Always cite specific policy sections when referencing the document
- If information is not in the policy, clearly state that and provide general guidance

When analyzing policy documents:
- Look for coverage limits, deductibles, exclusions, and special provisions
- Pay special attention to hurricane, flood, and wind damage coverage
- Note any specific claim filing requirements or timelines
- Identify any Florida-specific endorsements or provisions`

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, policyDocument, userId } = await req.json() as PolicyChatRequest

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured')
    }

    const genAI = new GoogleGenerativeAI(geminiApiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    // Build the conversation history
    const chatHistory: any[] = []

    // Add system prompt
    chatHistory.push({
      role: "user",
      parts: [{ text: SYSTEM_PROMPT }]
    })

    // If we have a policy document, add it to context
    if (policyDocument) {
      let policyContent = ""
      
      if (policyDocument.fileUrl) {
        // Fetch and process the document
        const response = await fetch(policyDocument.fileUrl)
        if (!response.ok) {
          throw new Error('Failed to fetch policy document')
        }

        // For PDFs, we need to extract text
        if (policyDocument.type === 'application/pdf' || policyDocument.fileUrl.endsWith('.pdf')) {
          const arrayBuffer = await response.arrayBuffer()
          const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
          
          // Use Gemini to extract text from PDF
          const extractionResult = await model.generateContent({
            contents: [{
              role: "user",
              parts: [
                { text: "Extract all text content from this PDF document. Preserve the structure and formatting as much as possible." },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64
                  }
                }
              ]
            }]
          })

          policyContent = extractionResult.response.text()
        } else {
          // For text documents, just read the content
          policyContent = await response.text()
        }
      } else if (policyDocument.content) {
        policyContent = policyDocument.content
      }

      if (policyContent) {
        chatHistory.push({
          role: "user",
          parts: [{
            text: `Here is the insurance policy document to reference:\n\n${policyContent}\n\nPlease use this document to answer questions about the policy.`
          }]
        })
        
        chatHistory.push({
          role: "model",
          parts: [{ text: "I've received and analyzed the insurance policy document. I'm ready to answer any questions you have about your coverage, deductibles, claim procedures, or any other aspects of your policy." }]
        })
      }
    }

    // Add the conversation messages
    messages.forEach(msg => {
      chatHistory.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })
    })

    // Generate response
    const chat = model.startChat({
      history: chatHistory.slice(0, -1), // All except the last message
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)
    const responseText = result.response.text()

    // Extract any citations from the response
    const citations: Array<{ section: string; content: string }> = []
    const citationRegex = /\[Section: ([^\]]+)\]/g
    let match
    while ((match = citationRegex.exec(responseText)) !== null) {
      citations.push({
        section: match[1],
        content: match[0]
      })
    }

    // Log usage if we have a user
    if (userId) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      await supabase
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          feature: 'policy_chat',
          provider: 'gemini',
          tokens_used: responseText.length / 4, // Rough estimate
          cost: responseText.length / 4 * 0.000001, // Example cost calculation
          metadata: {
            hasDocument: !!policyDocument,
            messageCount: messages.length
          }
        })
    }

    const response: PolicyChatResponse = {
      response: responseText,
      citations: citations.length > 0 ? citations : undefined
    }

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", message: 'Policy chat error:', error }))
    
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An error occurred processing your request',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})