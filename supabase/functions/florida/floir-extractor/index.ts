import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import OpenAI from "https://deno.land/x/openai@v4.24.0/mod.ts"
import { corsHeaders } from "../_shared/cors.ts"
import { validateRequest } from "../_shared/validation.ts"
import { FLOIRCrawler } from "./crawler.ts"
import { parseFlioirData } from "./parsers.ts"
import { FliorDataType, CrawlRequest, CrawlResponse } from "./types.ts"

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
)

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY")!,
})

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request
    const { data_type, query = {}, force_refresh = false } = await req.json() as CrawlRequest

    if (!data_type || !Object.values(FliorDataType).includes(data_type)) {
      throw new Error(`Invalid data_type. Must be one of: ${Object.values(FliorDataType).join(', ')}`)
    }

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Starting crawl for data_type: ${data_type}`
    }));

    // Create crawl run record
    const { data: crawlRun, error: crawlError } = await supabase
      .from('crawl_runs')
      .insert({
        data_type,
        status: 'running',
        metadata: { query, force_refresh }
      })
      .select()
      .single()

    if (crawlError) {
      throw new Error(`Failed to create crawl run: ${crawlError.message}`)
    }

    let totalProcessed = 0
    let totalCreated = 0
    let totalUpdated = 0
    const errors: any[] = []

    try {
      // Initialize crawler
      const crawler = new FLOIRCrawler()

      // Crawl raw data
      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Crawling ${data_type} data...`
      }));
      const rawData = await crawler.crawl(data_type, query)

      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Crawled ${rawData.length} records, processing...`
      }));

      // Process each record
      for (const record of rawData) {
        try {
          totalProcessed++

          // Parse and normalize data
          const parsed = await parseFlioirData(data_type, record, openai)

          // Generate content hash for deduplication
          const contentHash = await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(JSON.stringify(parsed.normalized))
          ).then(buffer =>
            Array.from(new Uint8Array(buffer))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
          )

          // Check if we need to skip due to identical content
          if (!force_refresh) {
            const { data: existing } = await supabase
              .from('floir_data')
              .select('content_hash')
              .eq('data_type', data_type)
              .eq('primary_key', parsed.primary_key)
              .single()

            if (existing?.content_hash === contentHash) {
              console.log(JSON.stringify({
                level: "info",
                timestamp: new Date().toISOString(),
                message: `Skipping duplicate record: ${parsed.primary_key}`
              }));
              continue
            }
          }

          // Generate embedding if we have content
          let embedding = null
          if (parsed.content_for_embedding) {
            try {
              const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-ada-002",
                input: parsed.content_for_embedding
              })
              embedding = embeddingResponse.data[0].embedding
            } catch (embeddingError) {
              console.log(JSON.stringify({
                level: "info",
                timestamp: new Date().toISOString(),
                message: `Failed to generate embedding for ${parsed.primary_key}:`, embeddingError
              }));
              errors.push({
                record_id: parsed.primary_key,
                error: 'Failed to generate embedding',
                details: embeddingError.message
              })
            }
          }

          // Upsert to database
          const { error: upsertError } = await supabase
            .from('floir_data')
            .upsert({
              data_type,
              primary_key: parsed.primary_key,
              raw_data: record,
              normalized_data: parsed.normalized,
              embedding,
              content_hash: contentHash,
              source_url: parsed.source_url,
              pdf_content: parsed.pdf_content || null
            }, {
              onConflict: 'data_type,primary_key'
            })

          if (upsertError) {
            console.log(JSON.stringify({
              level: "info",
              timestamp: new Date().toISOString(),
              message: `Failed to upsert record ${parsed.primary_key}:`, upsertError
            }));
            errors.push({
              record_id: parsed.primary_key,
              error: 'Database upsert failed',
              details: upsertError.message
            })
          } else {
            // Check if this was an insert or update
            const { data: checkRecord } = await supabase
              .from('floir_data')
              .select('created_at, updated_at')
              .eq('data_type', data_type)
              .eq('primary_key', parsed.primary_key)
              .single()

            if (checkRecord) {
              if (checkRecord.created_at === checkRecord.updated_at) {
                totalCreated++
              } else {
                totalUpdated++
              }
            }
          }

        } catch (recordError) {
          console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: `Error processing record:`, recordError
}));
          errors.push({
            record_data: record,
            error: 'Record processing failed',
            details: recordError.message
          })
        }
      }

      // Update crawl run with success
      await supabase
        .from('crawl_runs')
        .update({
          status: 'completed',
          records_processed: totalProcessed,
          records_created: totalCreated,
          records_updated: totalUpdated,
          errors: errors.length > 0 ? errors : null,
          error_count: errors.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', crawlRun.id)

      // Broadcast completion event
      await supabase.realtime.channel(`floir:${data_type}`)
        .send({
          type: 'broadcast',
          event: 'crawl_complete',
          payload: {
            data_type,
            records_processed: totalProcessed,
            records_created: totalCreated,
            records_updated: totalUpdated,
            error_count: errors.length
          }
        })

      const response: CrawlResponse = {
        success: true,
        data_type,
        records_processed: totalProcessed,
        records_created: totalCreated,
        records_updated: totalUpdated,
        errors: errors.length > 0 ? errors : undefined,
        crawl_run_id: crawlRun.id
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })

    } catch (crawlError) {
      // Update crawl run with failure
      await supabase
        .from('crawl_runs')
        .update({
          status: 'failed',
          records_processed: totalProcessed,
          records_created: totalCreated,
          records_updated: totalUpdated,
          errors: [{ error: 'Crawl failed', details: crawlError.message }],
          error_count: 1,
          completed_at: new Date().toISOString()
        })
        .eq('id', crawlRun.id)

      throw crawlError
    }

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'FLOIR extractor error:', error
}));

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
