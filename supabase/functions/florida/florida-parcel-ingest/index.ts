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

interface IngestRequest {
  data_source: string
  source_url?: string
  file_data?: any[]
  force_refresh?: boolean
  batch_size?: number
  generate_embeddings?: boolean
}

interface IngestResponse {
  success: boolean
  batch_id: string
  total_records: number
  processed_records: number
  valid_records: number
  invalid_records: number
  processing_time_ms: number
  errors?: string[]
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    const {
      data_source,
      source_url,
      file_data,
      force_refresh = false,
      batch_size = 1000,
      generate_embeddings = false
    } = await req.json() as IngestRequest

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Starting parcel ingest for ${data_source}`
    }));

    // Validate input
    if (!data_source) {
      throw new Error('data_source is required')
    }

    if (!source_url && !file_data) {
      throw new Error('Either source_url or file_data must be provided')
    }

    // Create import batch record
    const { data: batchRecord, error: batchError } = await supabase
      .from('parcel_import_batches')
      .insert({
        data_source,
        status: 'downloading',
        source_url,
        total_records: file_data?.length || 0,
        configuration: {
          batch_size,
          generate_embeddings,
          force_refresh
        }
      })
      .select()
      .single()

    if (batchError) {
      throw new Error(`Failed to create batch record: ${batchError.message}`)
    }

    const batchId = batchRecord.id
    let processedRecords = 0
    let validRecords = 0
    let invalidRecords = 0
    const errors: string[] = []

    try {
      // Update batch status
      await supabase
        .from('parcel_import_batches')
        .update({ status: 'validating' })
        .eq('id', batchId)

      // Get data (from file_data or download from source_url)
      let rawData: any[]
      
      if (file_data) {
        rawData = file_data
      } else if (source_url) {
        // Download and process file
        rawData = await downloadAndProcessFile(source_url, data_source)
      } else {
        throw new Error('No data source provided')
      }

      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Processing ${rawData.length} records`
      }));

      // Update batch with total records
      await supabase
        .from('parcel_import_batches')
        .update({ 
          total_records: rawData.length,
          status: 'transforming'
        })
        .eq('id', batchId)

      // Process data in chunks
      const chunks = chunkArray(rawData, batch_size)
      
      for (const chunk of chunks) {
        const chunkResults = await processChunk(
          chunk, 
          data_source, 
          batchId, 
          generate_embeddings
        )
        
        processedRecords += chunkResults.processed
        validRecords += chunkResults.valid
        invalidRecords += chunkResults.invalid
        errors.push(...chunkResults.errors)

        // Update progress
        await supabase
          .from('parcel_import_batches')
          .update({
            processed_records: processedRecords,
            valid_records: validRecords,
            invalid_records: invalidRecords
          })
          .eq('id', batchId)
      }

      // Perform atomic swap if we have valid records
      if (validRecords > 0 && !force_refresh) {
        await supabase
          .from('parcel_import_batches')
          .update({ status: 'importing' })
          .eq('id', batchId)

        // Atomic swap from staging to main table
        const { error: swapError } = await supabase
          .rpc('atomic_swap_property_tables', { backup_existing: true })

        if (swapError) {
          throw new Error(`Atomic swap failed: ${swapError.message}`)
        }
      }

      // Mark batch as completed
      const endTime = Date.now()
      await supabase
        .from('parcel_import_batches')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          duration_seconds: Math.floor((endTime - startTime) / 1000),
          errors: errors.length > 0 ? errors : null
        })
        .eq('id', batchId)

      // Refresh materialized views
      await supabase.rpc('refresh_property_views')

      const response: IngestResponse = {
        success: true,
        batch_id: batchId,
        total_records: rawData.length,
        processed_records: processedRecords,
        valid_records: validRecords,
        invalid_records: invalidRecords,
        processing_time_ms: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })

    } catch (processingError) {
      // Mark batch as failed
      await supabase
        .from('parcel_import_batches')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          errors: [processingError.message]
        })
        .eq('id', batchId)

      throw processingError
    }

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Parcel ingest error:', error
}));
    
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      batch_id: null,
      total_records: 0,
      processed_records: 0,
      valid_records: 0,
      invalid_records: 0,
      processing_time_ms: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

async function downloadAndProcessFile(sourceUrl: string, dataSource: string): Promise<any[]> {
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Downloading file from: ${sourceUrl}`
  }));
  
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || ''
  
  if (contentType.includes('application/json')) {
    const data = await response.json()
    return Array.isArray(data) ? data : data.features || [data]
  } else if (contentType.includes('text/csv')) {
    const text = await response.text()
    return parseCSV(text)
  } else {
    // Try to parse as JSON by default
    const data = await response.json()
    return Array.isArray(data) ? data : data.features || [data]
  }
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  const records = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    const record: any = {}
    
    headers.forEach((header, index) => {
      record[header] = values[index] || null
    })
    
    records.push(record)
  }
  
  return records
}

function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

async function processChunk(
  chunk: any[], 
  dataSource: string, 
  batchId: string, 
  generateEmbeddings: boolean
): Promise<{
  processed: number
  valid: number
  invalid: number
  errors: string[]
}> {
  let processed = 0
  let valid = 0
  let invalid = 0
  const errors: string[] = []

  const stagingRecords = []

  for (const rawRecord of chunk) {
    try {
      processed++
      
      // Transform raw record to property format
      const propertyRecord = await transformRecord(rawRecord, dataSource, batchId)
      
      // Validate record
      const { data: validationResult } = await supabase
        .rpc('validate_property_data', { property_data: propertyRecord })

      if (!validationResult[0].is_valid) {
        invalid++
        errors.push(`Invalid record ${propertyRecord.parcel_id}: ${validationResult[0].errors.join(', ')}`)
        continue
      }

      // Generate embedding if requested
      if (generateEmbeddings && propertyRecord.geometry) {
        try {
          const embeddingContent = generateEmbeddingContent(propertyRecord)
          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-ada-002",
            input: embeddingContent
          })
          propertyRecord.feature_vector = embeddingResponse.data[0].embedding
        } catch (embeddingError) {
          console.log(JSON.stringify({
            level: "info",
            timestamp: new Date().toISOString(),
            message: `Failed to generate embedding for ${propertyRecord.parcel_id}:`, embeddingError
          }));
          // Continue without embedding
        }
      }

      stagingRecords.push(propertyRecord)
      valid++

    } catch (recordError) {
      invalid++
      errors.push(`Failed to process record: ${recordError.message}`)
    }
  }

  // Batch insert to staging table
  if (stagingRecords.length > 0) {
    const { error: insertError } = await supabase
      .from('stg_properties')
      .upsert(stagingRecords, { onConflict: 'parcel_id' })

    if (insertError) {
      errors.push(`Batch insert failed: ${insertError.message}`)
    }
  }

  return { processed, valid, invalid, errors }
}

async function transformRecord(rawRecord: any, dataSource: string, batchId: string): Promise<any> {
  // This is a generic transformer - would need specific logic for each data source
  const transformed: any = {
    parcel_id: rawRecord.parcel_id || rawRecord.PARCEL_ID || rawRecord.id,
    data_source: dataSource,
    import_batch_id: batchId,
    address: rawRecord.address || rawRecord.ADDRESS || rawRecord.SITE_ADDR,
    owner_name: rawRecord.owner_name || rawRecord.OWNER_NAME || rawRecord.owner,
    property_value: parseFloat(rawRecord.property_value || rawRecord.PROPERTY_VALUE || rawRecord.value || '0'),
    property_type: rawRecord.property_type || rawRecord.PROPERTY_TYPE || rawRecord.use_code,
    county: rawRecord.county || rawRecord.COUNTY || extractCountyFromSource(dataSource),
    city: rawRecord.city || rawRecord.CITY,
    zip_code: rawRecord.zip_code || rawRecord.ZIP_CODE || rawRecord.zip,
    area_sqft: parseFloat(rawRecord.area_sqft || rawRecord.AREA_SQFT || '0'),
    data_vintage: new Date().toISOString().split('T')[0] // Default to today
  }

  // Handle geometry
  if (rawRecord.geometry) {
    transformed.geometry = rawRecord.geometry
    transformed.geojson = rawRecord.geometry
  } else if (rawRecord.lat && rawRecord.lng) {
    // Create point geometry from coordinates
    transformed.coordinates = {
      lat: parseFloat(rawRecord.lat),
      lng: parseFloat(rawRecord.lng)
    }
    transformed.geometry = {
      type: 'Point',
      coordinates: [parseFloat(rawRecord.lng), parseFloat(rawRecord.lat)]
    }
  }

  return transformed
}

function generateEmbeddingContent(propertyRecord: any): string {
  const parts = [
    `Florida property parcel ${propertyRecord.parcel_id}`,
    `Located at ${propertyRecord.address || 'unknown address'}`,
    `In ${propertyRecord.city || 'unknown city'}, ${propertyRecord.county || 'unknown county'} County`,
    `Owned by ${propertyRecord.owner_name || 'unknown owner'}`,
    `Property type: ${propertyRecord.property_type || 'unknown'}`,
    `Value: $${propertyRecord.property_value || 0}`
  ]
  
  if (propertyRecord.area_acres) {
    parts.push(`Area: ${propertyRecord.area_acres} acres`)
  }
  
  return parts.join('. ') + '.'
}

function extractCountyFromSource(dataSource: string): string | null {
  const countyMatch = dataSource.match(/fl_county_(.+)/)
  if (countyMatch) {
    return countyMatch[1].replace(/_/g, ' ')
  }
  return null
}