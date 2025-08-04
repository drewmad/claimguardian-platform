import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

interface DroneImageProcessingRequest {
  propertyId: string
  imageUrls: string[]
  droneMetadata: {
    model: string
    flightPath: Array<{
      lat: number
      lng: number
      altitude: number
      timestamp: string
    }>
    cameraSettings: Record<string, unknown>
  }
  processingOptions: {
    generate3DModel: boolean
    damageDetection: boolean
    materialAnalysis: boolean
    vegetationAnalysis: boolean
  }
}

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    const request: DroneImageProcessingRequest = await req.json()
    const { propertyId, imageUrls, droneMetadata, processingOptions } = request

    // Process each image with AI analysis
    const imageAnalysisResults = []
    
    for (const imageUrl of imageUrls) {
      // Mock image analysis
      const imageAnalysis = {
        embedding: new Array(2048).fill(0).map(() => Math.random()),
        objects: [
          { class: 'roof', confidence: 0.95, bbox: [100, 100, 200, 200] },
          { class: 'damage', confidence: 0.87, bbox: [150, 120, 180, 160] }
        ],
        damage: {
          overall_condition: 'moderate_damage',
          damage_categories: { roof: 0.3, siding: 0.1 },
          estimated_repair_cost: 15000,
          urgency_level: 'medium'
        },
        materials: { shingle: 0.8, metal: 0.2 },
        quality: { technical_quality: 0.9, coverage_completeness: 0.85 },
        confidence: 0.88
      }
      
      // Store in ai_enhanced_imagery table
      const { error } = await supabase
        .from('ai_enhanced_imagery')
        .insert({
          property_id: propertyId,
          image_url: imageUrl,
          image_type: 'aerial',
          capture_method: 'drone',
          drone_model: droneMetadata.model,
          camera_parameters: droneMetadata.cameraSettings,
          flight_parameters: {
            flightPath: droneMetadata.flightPath,
            processingOptions
          },
          // AI analysis results
          visual_embedding: imageAnalysis.embedding,
          detected_objects: imageAnalysis.objects,
          damage_assessment: imageAnalysis.damage,
          material_detection: imageAnalysis.materials,
          technical_quality: imageAnalysis.quality,
          processing_confidence: imageAnalysis.confidence,
          validation_status: 'ai_processed'
        })

      if (error) {
        console.log(JSON.stringify({
  level: "error",
  timestamp: new Date().toISOString(),
  message: 'Error storing image analysis:', error
}));
      }
      
      imageAnalysisResults.push(imageAnalysis)
    }

    // Generate 3D model if requested
    let model3D = null
    if (processingOptions.generate3DModel && imageUrls.length >= 10) {
      // Mock 3D model generation
      model3D = {
        modelUrl: `https://storage.example.com/models/${propertyId}_model.gltf`,
        pointCloudUrl: `https://storage.example.com/models/${propertyId}_points.las`,
        embedding: new Array(512).fill(0).map(() => Math.random()),
        geometry: { volume: 2500, surface_area: 1800 },
        dimensions: { length: 45, width: 32, height: 28 },
        confidence: 0.82
      }
      
      // Store 3D model data
      await supabase
        .from('ai_3d_reconstructions')
        .insert({
          property_id: propertyId,
          model_url: model3D.modelUrl,
          point_cloud_url: model3D.pointCloudUrl,
          source_imagery_count: imageUrls.length,
          processing_method: 'photogrammetry',
          structural_embedding: model3D.embedding,
          geometric_features: model3D.geometry,
          building_dimensions: model3D.dimensions,
          model_confidence: model3D.confidence
        })
    }

    // Update property digital twin with new analysis
    await supabase
      .from('property_digital_twins')
      .update({
        last_ai_analysis: new Date().toISOString(),
        ai_confidence_score: model3D ? 0.9 : 0.8,
        ai_property_features: {
          imageAnalysisResults,
          model3D,
          processingTimestamp: new Date().toISOString()
        }
      })
      .eq('property_id', propertyId)

    return new Response(JSON.stringify({
      success: true,
      data: {
        processedImages: imageAnalysisResults.length,
        model3DGenerated: !!model3D,
        analysisResults: imageAnalysisResults,
        model3D
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})