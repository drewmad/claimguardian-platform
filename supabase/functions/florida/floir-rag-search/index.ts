import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts"
import { corsHeaders } from "../_shared/cors.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
})

interface SearchRequest {
  query: string
  data_types?: string[]
  limit?: number
  threshold?: number
  include_context?: boolean
}

interface SearchResult {
  id: string
  data_type: string
  primary_key: string
  normalized_data: any
  source_url: string
  similarity: number
  content_snippet?: string
}

interface RAGResponse {
  query: string
  results: SearchResult[]
  context: string
  answer?: string
  total_results: number
  search_time_ms: number
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    const { 
      query, 
      data_types = null, 
      limit = 10, 
      threshold = 0.5,
      include_context = true 
    } = await req.json() as SearchRequest

    if (!query?.trim()) {
      throw new Error('Query is required')
    }

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `FLOIR RAG search: "${query}"`
    }));

    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query
    })

    const queryEmbedding = embeddingResponse.data[0].embedding

    // Search FLOIR data using vector similarity
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_floir_data', {
        query_embedding: queryEmbedding,
        data_types: data_types,
        match_threshold: threshold,
        match_count: limit
      })

    if (searchError) {
      throw new Error(`Search failed: ${searchError.message}`)
    }

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Found ${searchResults?.length || 0} matching results`
    }));

    // Format results and create context
    const results: SearchResult[] = (searchResults || []).map((result: any) => ({
      id: result.id,
      data_type: result.data_type,
      primary_key: result.primary_key,
      normalized_data: result.normalized_data,
      source_url: result.source_url,
      similarity: result.similarity,
      content_snippet: createContentSnippet(result.data_type, result.normalized_data)
    }))

    // Create context for RAG
    const context = createRAGContext(results)
    
    let answer: string | undefined = undefined

    // Generate AI answer if context is requested
    if (include_context && results.length > 0) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert assistant for Florida insurance regulation data. Use the provided FLOIR data to answer questions about:
- Insurance regulation and compliance
- Catastrophe losses and claims
- Rate filings and company information  
- Professional liability tracking
- Industry reports and trends
- Receivership and financial oversight
- News and regulatory updates

Provide accurate, helpful answers based only on the provided data. If the data doesn't contain enough information, say so clearly.`
            },
            {
              role: "user",
              content: `Question: ${query}

FLOIR Data Context:
${context}

Please provide a comprehensive answer based on the Florida insurance regulation data above.`
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })

        answer = completion.choices[0].message.content || undefined
      } catch (aiError) {
        console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Failed to generate AI answer:', aiError
}));
        // Continue without AI answer if embedding search succeeded
      }
    }

    const response: RAGResponse = {
      query,
      results,
      context,
      answer,
      total_results: results.length,
      search_time_ms: Date.now() - startTime
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'FLOIR RAG search error:', error
}));
    
    return new Response(JSON.stringify({
      error: error.message,
      query: '',
      results: [],
      context: '',
      total_results: 0,
      search_time_ms: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

function createContentSnippet(dataType: string, normalizedData: any): string {
  const snippetLength = 150
  
  switch (dataType) {
    case 'catastrophe':
      return `Event: ${normalizedData.Event || 'N/A'} | Claims: ${normalizedData.Claims || 'N/A'} | Losses: ${normalizedData.Losses || 'N/A'}`
    
    case 'rate_filings':
      return `Company: ${normalizedData.CompanyName || normalizedData.Company || 'N/A'} | Status: ${normalizedData.FilingStatus || normalizedData.Status || 'N/A'} | Filed: ${normalizedData.ReceivedDate || 'N/A'}`
    
    case 'professional_liability':
      return `Case: ${normalizedData.CaseNo || 'N/A'} | Paid: ${normalizedData.Paid || 'N/A'} | Closed: ${normalizedData.CloseDate || 'N/A'}`
    
    case 'news_bulletins':
      return `${normalizedData.Title || 'N/A'} | ${normalizedData.Summary || 'N/A'}`.substring(0, snippetLength) + '...'
    
    case 'receivership':
      return `Company: ${normalizedData.CompanyName || 'N/A'} | Status: ${normalizedData.Status || 'N/A'} | Date: ${normalizedData.DateReceived || 'N/A'}`
    
    case 'industry_reports':
      return `Year: ${normalizedData.Year || 'N/A'} | Report: ${normalizedData.Title || 'N/A'}`
    
    case 'financial_reports':
      return `NAIC: ${normalizedData.NAICCode || 'N/A'} | Company: ${normalizedData.CompanyName || 'N/A'}`
    
    default:
      // Generic snippet for other types
      const text = Object.entries(normalizedData)
        .filter(([key, value]) => !key.startsWith('_') && typeof value === 'string')
        .map(([key, value]) => `${key}: ${value}`)
        .join(' | ')
      
      return text.substring(0, snippetLength) + (text.length > snippetLength ? '...' : '')
  }
}

function createRAGContext(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No relevant FLOIR data found for this query."
  }

  const contextParts = results.map((result, index) => {
    const dataTypeFormatted = result.data_type.replace(/_/g, ' ').toUpperCase()
    
    return `
[${index + 1}] ${dataTypeFormatted} (Similarity: ${(result.similarity * 100).toFixed(1)}%)
Source: ${result.source_url || 'N/A'}
Data: ${result.content_snippet}
Details: ${JSON.stringify(result.normalized_data, null, 2)}
`
  })

  return `FLORIDA INSURANCE REGULATION DATA (${results.length} results):
${contextParts.join('\n---\n')}`
}