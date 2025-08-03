# Supabase Edge Functions - Claude.md

## Overview
ClaimGuardian uses Supabase Edge Functions (Deno runtime) for AI processing, data enrichment, and serverless business logic that requires server-side execution.

## Architecture
- **Runtime**: Deno with TypeScript support
- **Deployment**: Serverless edge computing
- **Security**: Service role access to database
- **Performance**: Global edge deployment
- **Cost**: Pay-per-execution model

## Function Categories

### AI Processing Functions
1. **`ai-document-extraction`** - Extract structured data from insurance documents
2. **`analyze-damage-with-policy`** - AI damage analysis with policy context
3. **`ar-drone-processor`** - Process AR/drone imagery for damage assessment
4. **`ocr-document`** - OCR processing for document digitization
5. **`policy-chat`** - Interactive chat with insurance policy documents
6. **`property-ai-enrichment`** - Enhance property data with AI insights
7. **`spatial-ai-api`** - Spatial analysis and GIS AI processing

### Florida-Specific Functions
1. **`floir-extractor`** - Extract data from Florida insurance documents
2. **`floir-rag-search`** - RAG-based search across insurance regulations
3. **`florida-parcel-ingest`** - Process large-scale cadastral data imports
4. **`florida-parcel-monitor`** - Monitor and validate data import status
5. **`scrape-florida-parcels`** - County-specific parcel data scraping

### ML Operations Functions
1. **`federated-learning`** - Distributed machine learning coordination
2. **`ml-model-management`** - Model versioning and deployment
3. **`environmental-data-sync`** - Environmental data integration
4. **`fetch-disaster-alerts`** - Real-time disaster monitoring
5. **`fetch-tidal-data`** - Coastal flood risk data integration

### Utility Functions
1. **`create-demo-user`** - Generate demo user accounts
2. **`send-email`** - Email sending service
3. **`test-connectivity`** - Connection testing
4. **`scrape-proxy`** - Web scraping proxy service

## Function Structure Pattern

### Basic Function Template
```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface RequestBody {
  // Define your request structure
  propertyId: string
  userId: string
  data?: Record<string, unknown>
}

interface ResponseData {
  // Define your response structure
  success: boolean
  data?: any
  error?: string
}

Deno.serve(async (req: Request): Promise<Response> => {
  // CORS headers for browser requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const body: RequestBody = await req.json()
    
    // Validate required fields
    if (!body.propertyId || !body.userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Your function logic here
    const result = await processRequest(body)
    
    // Return success response
    const response: ResponseData = {
      success: true,
      data: result
    }

    return new Response(
      JSON.stringify(response),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    const errorResponse: ResponseData = {
      success: false,
      error: error.message || 'Internal server error'
    }

    return new Response(
      JSON.stringify(errorResponse),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function processRequest(body: RequestBody) {
  // Implement your business logic
  return { processed: true, timestamp: new Date().toISOString() }
}
```

### Database Access Pattern
```typescript
import { createClient } from 'jsr:@supabase/supabase-js@2'

// Initialize Supabase client with service role
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

async function updateProperty(propertyId: string, data: Record<string, unknown>) {
  const { data: property, error } = await supabase
    .from('properties')
    .update(data)
    .eq('id', propertyId)
    .select()
    .single()

  if (error) {
    throw new Error(`Database error: ${error.message}`)
  }

  return property
}
```

### AI Service Integration
```typescript
// OpenAI integration
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')

async function analyzeWithOpenAI(prompt: string, imageBase64?: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...(imageBase64 ? [{ 
              type: 'image_url', 
              image_url: { url: `data:image/jpeg;base64,${imageBase64}` }
            }] : [])
          ]
        }
      ],
      max_tokens: 1000
    })
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const result = await response.json()
  return result.choices[0].message.content
}
```

## Function Deployment

### Environment Variables
```bash
# Set secrets for Edge Functions
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set GEMINI_API_KEY=your_gemini_key
supabase secrets set RESEND_API_KEY=your_resend_key

# Supabase credentials are automatically available
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
```

### Deploy Single Function
```bash
# Deploy specific function
supabase functions deploy ai-document-extraction

# Deploy with custom import map
supabase functions deploy policy-chat --import-map import_map.json

# Deploy all functions
supabase functions deploy
```

### Local Development
```bash
# Start local development server
supabase functions serve

# Test function locally
curl -X POST 'http://localhost:54321/functions/v1/ai-document-extraction' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{"propertyId": "123", "userId": "456"}'
```

## Function Invocation Patterns

### From Next.js Application
```typescript
import { createBrowserSupabaseClient } from '@claimguardian/db'

const supabase = createBrowserSupabaseClient()

async function analyzeDocument(documentData: any) {
  const { data, error } = await supabase.functions.invoke('ai-document-extraction', {
    body: {
      documentData,
      propertyId: currentProperty.id,
      userId: user.id
    }
  })

  if (error) {
    throw new Error(`Function error: ${error.message}`)
  }

  return data
}
```

### From Server Actions
```typescript
import { createClient } from '@/lib/supabase/server'

export async function processProperty(propertyId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.functions.invoke('property-ai-enrichment', {
    body: {
      propertyId,
      timestamp: new Date().toISOString()
    }
  })

  if (error) {
    console.error('Function invocation error:', error)
    return { success: false, error: error.message }
  }

  return { success: true, data }
}
```

### From Other Edge Functions
```typescript
// Call one function from another
async function callOtherFunction(data: any) {
  const response = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/functions/v1/other-function`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    }
  )

  if (!response.ok) {
    throw new Error(`Function call failed: ${response.statusText}`)
  }

  return await response.json()
}
```

## Error Handling & Logging

### Structured Logging
```typescript
function log(level: 'info' | 'warn' | 'error', message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    function: 'ai-document-extraction',
    data
  }
  console.log(JSON.stringify(logEntry))
}

// Usage
log('info', 'Processing document', { documentId: 'doc-123' })
log('error', 'API call failed', { error: error.message, stack: error.stack })
```

### Error Response Standards
```typescript
interface ErrorResponse {
  success: false
  error: string
  code?: string
  details?: any
}

function createErrorResponse(error: Error, code?: string): Response {
  const errorResponse: ErrorResponse = {
    success: false,
    error: error.message,
    code,
    details: error.stack // Include in development only
  }

  return new Response(
    JSON.stringify(errorResponse),
    { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}
```

## Performance Optimization

### Cold Start Mitigation
```typescript
// Keep connections warm
let cachedDbConnection: any = null

async function getDbConnection() {
  if (!cachedDbConnection) {
    cachedDbConnection = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
  }
  return cachedDbConnection
}
```

### Streaming Responses
```typescript
// For large data processing
Deno.serve(async (req: Request) => {
  const stream = new ReadableStream({
    start(controller) {
      // Process data in chunks
      processDataStream(controller)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/json',
      'Transfer-Encoding': 'chunked'
    }
  })
})
```

## Security Best Practices

### Input Validation
```typescript
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts'

const RequestSchema = z.object({
  propertyId: z.string().uuid(),
  userId: z.string().uuid(),
  data: z.record(z.unknown()).optional()
})

async function validateRequest(req: Request) {
  const body = await req.json()
  
  try {
    return RequestSchema.parse(body)
  } catch (error) {
    throw new Error(`Invalid request: ${error.message}`)
  }
}
```

### Rate Limiting
```typescript
const rateLimiter = new Map<string, { count: number, timestamp: number }>()

function checkRateLimit(userId: string, maxRequests = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const userLimit = rateLimiter.get(userId)

  if (!userLimit || now - userLimit.timestamp > windowMs) {
    rateLimiter.set(userId, { count: 1, timestamp: now })
    return true
  }

  if (userLimit.count >= maxRequests) {
    return false
  }

  userLimit.count++
  return true
}
```

## Testing Edge Functions

### Unit Testing
```typescript
// test/ai-document-extraction.test.ts
import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts'

Deno.test('should extract document data', async () => {
  const mockRequest = new Request('http://localhost:54321/functions/v1/ai-document-extraction', {
    method: 'POST',
    body: JSON.stringify({
      propertyId: 'test-id',
      userId: 'user-id',
      documentData: 'base64-encoded-doc'
    })
  })

  // Test your function logic
  const response = await handleRequest(mockRequest)
  const data = await response.json()

  assertEquals(data.success, true)
})
```

### Integration Testing
```bash
# Run tests with Deno
deno test --allow-net --allow-env functions/tests/

# Test against local development server
curl -X POST 'http://localhost:54321/functions/v1/test-function' \
  -H 'Authorization: Bearer eyJ...' \
  -H 'Content-Type: application/json' \
  -d '{"test": "data"}'
```

## Monitoring & Observability

### Function Logs
```bash
# View function logs
supabase functions logs ai-document-extraction

# Follow logs in real-time
supabase functions logs ai-document-extraction --follow
```

### Metrics Collection
```typescript
// Track function performance
const startTime = Date.now()

try {
  const result = await processRequest(body)
  
  // Log success metrics
  log('info', 'Function completed successfully', {
    duration: Date.now() - startTime,
    resultSize: JSON.stringify(result).length
  })
  
  return result
} catch (error) {
  // Log error metrics
  log('error', 'Function failed', {
    duration: Date.now() - startTime,
    error: error.message
  })
  
  throw error
}
```

## Common Issues & Solutions

### Import Resolution
- **Issue**: Module not found errors
- **Fix**: Use JSR imports, check import_map.json

### Cold Starts  
- **Issue**: Slow first request
- **Fix**: Cache connections, optimize imports

### Memory Limits
- **Issue**: Function timeout or memory errors
- **Fix**: Process data in chunks, use streaming

### CORS Issues
- **Issue**: Browser requests blocked
- **Fix**: Include proper CORS headers, handle OPTIONS

## Deployment Checklist
1. Test function locally with `supabase functions serve`
2. Validate environment variables are set
3. Check import map configuration
4. Test CORS headers for browser requests  
5. Deploy with `supabase functions deploy`
6. Monitor logs for errors after deployment
7. Test function invocation from application