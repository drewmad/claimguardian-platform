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

interface EnrichmentRequest {
  action: 'batch_enrich' | 'enrich_property' | 'generate_embeddings' | 'compute_relationships'
  property_id?: string
  data_source?: string
  batch_size?: number
  include_embeddings?: boolean
  include_relationships?: boolean
}

interface EnrichmentResponse {
  success: boolean
  processed_count: number
  success_count: number
  error_count: number
  processing_time_ms: number
  details?: any
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const startTime = Date.now()
    const {
      action,
      property_id,
      data_source,
      batch_size = 1000,
      include_embeddings = true,
      include_relationships = false
    } = await req.json() as EnrichmentRequest

    console.log(JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      message: `Property AI enrichment action: ${action}`
    }));

    let result: any

    switch (action) {
      case 'batch_enrich':
        result = await batchEnrichProperties(data_source, batch_size, include_embeddings, include_relationships)
        break
      
      case 'enrich_property':
        if (!property_id) throw new Error('property_id required for enrich_property')
        result = await enrichSingleProperty(property_id, include_embeddings, include_relationships)
        break
      
      case 'generate_embeddings':
        result = await generateEmbeddings(data_source, batch_size)
        break
      
      case 'compute_relationships':
        result = await computeSpatialRelationships(data_source, batch_size)
        break
      
      default:
        throw new Error(`Unknown action: ${action}`)
    }

    const response: EnrichmentResponse = {
      success: true,
      processing_time_ms: Date.now() - startTime,
      ...result
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Property AI enrichment error:', error
}));
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      processed_count: 0,
      success_count: 0,
      error_count: 1,
      processing_time_ms: 0
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})

async function batchEnrichProperties(
  dataSource?: string,
  batchSize = 1000,
  includeEmbeddings = true,
  includeRelationships = false
) {
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Batch enriching properties: ${dataSource || 'all sources'}, batch size: ${batchSize}`
  }));

  // Call the database function for batch enrichment
  const { data: enrichmentResult, error } = await supabase
    .rpc('batch_enrich_properties', {
      batch_size: batchSize,
      data_source_filter: dataSource || null
    })

  if (error) {
    throw new Error(`Batch enrichment failed: ${error.message}`)
  }

  let embeddingResults = { processed: 0, success: 0, errors: 0 }
  let relationshipResults = { processed: 0, success: 0, errors: 0 }

  // Generate embeddings if requested
  if (includeEmbeddings) {
    embeddingResults = await generateEmbeddings(dataSource, batchSize)
  }

  // Compute relationships if requested
  if (includeRelationships) {
    relationshipResults = await computeSpatialRelationships(dataSource, batchSize)
  }

  return {
    processed_count: enrichmentResult[0].processed_count,
    success_count: enrichmentResult[0].success_count,
    error_count: enrichmentResult[0].error_count,
    embedding_results: embeddingResults,
    relationship_results: relationshipResults,
    details: {
      spatial_features_computed: enrichmentResult[0].success_count,
      embeddings_generated: embeddingResults.success,
      relationships_computed: relationshipResults.success
    }
  }
}

async function enrichSingleProperty(
  propertyId: string,
  includeEmbeddings = true,
  includeRelationships = false
) {
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Enriching single property: ${propertyId}`
  }));

  try {
    // Call the database function for single property enrichment
    const { error: enrichError } = await supabase
      .rpc('enrich_property_data', {
        property_id: propertyId
      })

    if (enrichError) {
      throw new Error(`Property enrichment failed: ${enrichError.message}`)
    }

    // Generate embedding if requested
    if (includeEmbeddings) {
      await generatePropertyEmbedding(propertyId)
    }

    // Compute relationships if requested
    if (includeRelationships) {
      await computePropertyRelationships(propertyId)
    }

    return {
      processed_count: 1,
      success_count: 1,
      error_count: 0,
      details: {
        property_id: propertyId,
        enrichment_complete: true,
        embedding_generated: includeEmbeddings,
        relationships_computed: includeRelationships
      }
    }

  } catch (error) {
    return {
      processed_count: 1,
      success_count: 0,
      error_count: 1,
      details: {
        property_id: propertyId,
        error: error.message
      }
    }
  }
}

async function generateEmbeddings(dataSource?: string, batchSize = 100) {
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Generating embeddings for properties: ${dataSource || 'all sources'}`
  }));

  let query = supabase
    .from('properties')
    .select('id, parcel_id, address, city, county, owner_name, property_type, property_value, spatial_features, risk_factors')
    .is('feature_vector', null)
    .order('created_at', { ascending: false })
    .limit(batchSize)

  if (dataSource) {
    query = query.eq('data_source', dataSource)
  }

  const { data: properties, error } = await query

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`)
  }

  if (!properties || properties.length === 0) {
    return { processed: 0, success: 0, errors: 0 }
  }

  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Processing ${properties.length} properties for embeddings`
  }));

  let processed = 0
  let success = 0
  let errors = 0

  // Process in smaller chunks to avoid API rate limits
  const chunkSize = 10
  for (let i = 0; i < properties.length; i += chunkSize) {
    const chunk = properties.slice(i, i + chunkSize)
    
    for (const property of chunk) {
      try {
        processed++
        await generatePropertyEmbedding(property.id)
        success++
      } catch (error) {
        errors++
        console.log(JSON.stringify({
          level: "info",
          timestamp: new Date().toISOString(),
          message: `Failed to generate embedding for property ${property.id}:`, error
        }));
      }
    }

    // Small delay between chunks
    if (i + chunkSize < properties.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return { processed, success, errors }
}

async function generatePropertyEmbedding(propertyId: string) {
  // Get property data
  const { data: property, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', propertyId)
    .single()

  if (error || !property) {
    throw new Error(`Property not found: ${propertyId}`)
  }

  // Generate embedding content using the database function
  const { data: contentResult, error: contentError } = await supabase
    .rpc('generate_embedding_content', { property_row: property })

  if (contentError) {
    throw new Error(`Failed to generate content: ${contentError.message}`)
  }

  const embeddingContent = contentResult

  // Generate embedding using OpenAI
  const embeddingResponse = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: embeddingContent
  })

  const embedding = embeddingResponse.data[0].embedding

  // Update property with embedding
  const { error: updateError } = await supabase
    .from('properties')
    .update({
      feature_vector: embedding,
      updated_at: new Date().toISOString()
    })
    .eq('id', propertyId)

  if (updateError) {
    throw new Error(`Failed to update property with embedding: ${updateError.message}`)
  }

  // Store AI features
  await supabase
    .from('property_ai_features')
    .upsert({
      property_id: propertyId,
      embedding_model: 'text-embedding-ada-002',
      feature_metadata: {
        content_used: embeddingContent,
        generated_at: new Date().toISOString()
      },
      last_updated: new Date().toISOString()
    }, {
      onConflict: 'property_id'
    })
}

async function computeSpatialRelationships(dataSource?: string, batchSize = 500) {
  console.log(JSON.stringify({
    level: "info",
    timestamp: new Date().toISOString(),
    message: `Computing spatial relationships: ${dataSource || 'all sources'}`
  }));

  let query = supabase
    .from('properties')
    .select('id, parcel_id, centroid, spatial_features')
    .not('centroid', 'is', null)
    .order('created_at', { ascending: false })
    .limit(batchSize)

  if (dataSource) {
    query = query.eq('data_source', dataSource)
  }

  const { data: properties, error } = await query

  if (error) {
    throw new Error(`Failed to fetch properties: ${error.message}`)
  }

  if (!properties || properties.length === 0) {
    return { processed: 0, success: 0, errors: 0 }
  }

  let processed = 0
  let success = 0
  let errors = 0

  for (const property of properties) {
    try {
      processed++
      await computePropertyRelationships(property.id)
      success++
    } catch (error) {
      errors++
      console.log(JSON.stringify({
        level: "info",
        timestamp: new Date().toISOString(),
        message: `Failed to compute relationships for property ${property.id}:`, error
      }));
    }
  }

  return { processed, success, errors }
}

async function computePropertyRelationships(propertyId: string) {
  // Get property data
  const { data: property, error } = await supabase
    .from('properties')
    .select('id, centroid, spatial_features, risk_factors')
    .eq('id', propertyId)
    .single()

  if (error || !property) {
    throw new Error(`Property not found: ${propertyId}`)
  }

  if (!property.centroid) {
    throw new Error(`Property ${propertyId} has no centroid`)
  }

  const relationships = []

  // Find nearest hospital (mock - would use actual hospital data)
  relationships.push({
    property_id: propertyId,
    relationship_type: 'nearest_hospital',
    related_feature: {
      name: 'Regional Medical Center',
      type: 'hospital',
      coordinates: [-82.0, 27.5] // Mock coordinates
    },
    distance_miles: 2.5, // Mock distance
    confidence_score: 0.8
  })

  // Find flood zone (based on spatial features)
  if (property.spatial_features?.near_water) {
    relationships.push({
      property_id: propertyId,
      relationship_type: 'flood_zone',
      related_feature: {
        zone: 'AE',
        description: 'Areas with a 1% annual chance of flooding'
      },
      distance_miles: 0,
      confidence_score: 0.9
    })
  }

  // Find evacuation route (mock)
  relationships.push({
    property_id: propertyId,
    relationship_type: 'evacuation_route',
    related_feature: {
      route: 'Interstate 75',
      direction: 'North',
      type: 'highway'
    },
    distance_miles: 1.2,
    confidence_score: 0.7
  })

  // Insert relationships
  if (relationships.length > 0) {
    const { error: insertError } = await supabase
      .from('spatial_relationships')
      .upsert(relationships, {
        onConflict: 'property_id,relationship_type'
      })

    if (insertError) {
      throw new Error(`Failed to insert relationships: ${insertError.message}`)
    }
  }
}