import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// Test configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'http://localhost:54321'
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

// Edge Function URLs
const ML_MODEL_MGMT_URL = `${SUPABASE_URL}/functions/v1/ml-model-management`
const FEDERATED_LEARNING_URL = `${SUPABASE_URL}/functions/v1/federated-learning`
const SPATIAL_AI_URL = `${SUPABASE_URL}/functions/v1/spatial-ai-api`
const AR_DRONE_URL = `${SUPABASE_URL}/functions/v1/ar-drone-processor`
const ENV_DATA_SYNC_URL = `${SUPABASE_URL}/functions/v1/environmental-data-sync`

// Create Supabase clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Helper function to make authenticated requests
async function makeAuthenticatedRequest(url: string, body: any, useServiceKey = false) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${useServiceKey ? SUPABASE_SERVICE_KEY : SUPABASE_ANON_KEY}`
  }
  
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })
  
  return response
}

// Test Suite: ML Model Management
Deno.test("ML Model Management - Deploy Model", async () => {
  const request = {
    action: 'deploy',
    data: {
      modelFamily: 'property_risk',
      version: '1.0.0',
      deploymentEnv: 'staging',
      config: {
        maxBatchSize: 32,
        timeout: 5000
      }
    }
  }
  
  const response = await makeAuthenticatedRequest(ML_MODEL_MGMT_URL, request, true)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertExists(result.deploymentId)
  assertEquals(result.success, true)
})

Deno.test("ML Model Management - Monitor Model", async () => {
  const request = {
    action: 'monitor',
    data: {
      deploymentId: 'test-deployment-id',
      window: '1hour'
    }
  }
  
  const response = await makeAuthenticatedRequest(ML_MODEL_MGMT_URL, request, true)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertExists(result.metrics)
  assertExists(result.metrics.accuracy)
  assertExists(result.metrics.latency)
})

Deno.test("ML Model Management - Drift Detection", async () => {
  const request = {
    action: 'drift_check',
    data: {
      deploymentId: 'test-deployment-id',
      windowHours: 24
    }
  }
  
  const response = await makeAuthenticatedRequest(ML_MODEL_MGMT_URL, request, true)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertExists(result.driftReport)
  assertExists(result.driftReport.severity)
  assertExists(result.driftReport.recommendation)
})

// Test Suite: Federated Learning
Deno.test("Federated Learning - Register Node", async () => {
  const request = {
    action: 'register_node',
    data: {
      nodeIdentifier: `test-node-${Date.now()}`,
      computeCapacity: {
        cpu: 8,
        memory: 16,
        gpu: 1
      },
      dataCharacteristics: {
        sampleCount: 10000,
        dataTypes: ['property', 'damage']
      }
    }
  }
  
  const response = await makeAuthenticatedRequest(FEDERATED_LEARNING_URL, request, true)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertExists(result.nodeId)
  assertEquals(result.status, 'registered')
})

Deno.test("Federated Learning - Start Round", async () => {
  const request = {
    action: 'start_round',
    data: {
      modelFamily: 'damage_detection',
      minParticipants: 3,
      aggregationStrategy: 'fedavg',
      differentialPrivacy: {
        epsilon: 1.0,
        delta: 0.00001
      }
    }
  }
  
  const response = await makeAuthenticatedRequest(FEDERATED_LEARNING_URL, request, true)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertExists(result.roundId)
  assertExists(result.roundNumber)
})

// Test Suite: Spatial AI API
Deno.test("Spatial AI - Analyze Property", async () => {
  const request = {
    action: 'analyze_property',
    data: {
      propertyId: 'test-property-123',
      imageUrls: ['https://example.com/image1.jpg'],
      gisData: {
        parcelId: 'FL-001-2024',
        coordinates: [-80.1918, 25.7617]
      }
    }
  }
  
  const response = await makeAuthenticatedRequest(SPATIAL_AI_URL, request)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertExists(result.data.imageAnalysis)
  assertExists(result.data.environmental3D)
  assertExists(result.data.riskAssessment)
})

Deno.test("Spatial AI - Generate Embeddings", async () => {
  const request = {
    action: 'generate_embeddings',
    data: {
      propertyId: 'test-property-123',
      includeTypes: ['spatial', 'risk', 'visual']
    }
  }
  
  const response = await makeAuthenticatedRequest(SPATIAL_AI_URL, request)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertExists(result.data.embeddings)
  assertExists(result.data.embeddings.spatial)
  assertEquals(result.data.embeddings.spatial.length, 512)
})

// Test Suite: AR Drone Processing
Deno.test("AR Drone - Process Imagery", async () => {
  const request = {
    propertyId: 'test-property-123',
    imageUrls: [
      'https://example.com/drone1.jpg',
      'https://example.com/drone2.jpg'
    ],
    droneMetadata: {
      model: 'DJI Mavic 3',
      flightPath: [
        { lat: 25.7617, lng: -80.1918, altitude: 100, timestamp: new Date().toISOString() }
      ],
      cameraSettings: { iso: 100, aperture: 2.8 }
    },
    processingOptions: {
      generate3DModel: false,
      damageDetection: true,
      materialAnalysis: true,
      vegetationAnalysis: false
    }
  }
  
  const response = await makeAuthenticatedRequest(AR_DRONE_URL, request, true)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertEquals(result.success, true)
  assertExists(result.data.processedImages)
  assertExists(result.data.analysisResults)
})

// Test Suite: Environmental Data Sync
Deno.test("Environmental Data Sync - Trigger Sync", async () => {
  const response = await makeAuthenticatedRequest(ENV_DATA_SYNC_URL, {}, true)
  assertEquals(response.status, 200)
  
  const result = await response.json()
  assertEquals(result.success, true)
  assertExists(result.data.counties)
  assertExists(result.data.hazardsUpdated)
  assertExists(result.data.sensorsUpdated)
})

// Test Suite: End-to-End ML Pipeline
Deno.test("ML Pipeline - Property Risk Assessment E2E", async () => {
  // Step 1: Sync environmental data
  const syncResponse = await makeAuthenticatedRequest(ENV_DATA_SYNC_URL, {}, true)
  assertEquals(syncResponse.status, 200)
  
  // Step 2: Analyze property with spatial AI
  const analyzeRequest = {
    action: 'analyze_property',
    data: {
      propertyId: 'e2e-test-property',
      imageUrls: ['https://example.com/property.jpg'],
      gisData: {
        parcelId: 'FL-E2E-2024',
        coordinates: [-80.1918, 25.7617]
      }
    }
  }
  
  const analyzeResponse = await makeAuthenticatedRequest(SPATIAL_AI_URL, analyzeRequest)
  assertEquals(analyzeResponse.status, 200)
  const analysisResult = await analyzeResponse.json()
  
  // Step 3: Generate embeddings
  const embeddingRequest = {
    action: 'generate_embeddings',
    data: {
      propertyId: 'e2e-test-property',
      includeTypes: ['spatial', 'risk', 'visual', 'structural']
    }
  }
  
  const embeddingResponse = await makeAuthenticatedRequest(SPATIAL_AI_URL, embeddingRequest)
  assertEquals(embeddingResponse.status, 200)
  
  // Step 4: Risk assessment
  const riskRequest = {
    action: 'assess_risk',
    data: {
      propertyId: 'e2e-test-property'
    }
  }
  
  const riskResponse = await makeAuthenticatedRequest(SPATIAL_AI_URL, riskRequest)
  assertEquals(riskResponse.status, 200)
  const riskResult = await riskResponse.json()
  
  // Verify complete pipeline results
  assertExists(riskResult.data.overallRisk)
  assertExists(riskResult.data.riskFactors)
  assertExists(riskResult.data.recommendations)
})

// Test Suite: Database Schema Validation
Deno.test("Database - ML Operations Tables Exist", async () => {
  // Check ml_model_versions table
  const { data: modelVersions, error: mvError } = await supabaseService
    .from('ml_model_versions')
    .select('id')
    .limit(1)
  
  assertEquals(mvError, null)
  assertExists(modelVersions)
  
  // Check ml_model_deployments table
  const { data: deployments, error: depError } = await supabaseService
    .from('ml_model_deployments')
    .select('id')
    .limit(1)
  
  assertEquals(depError, null)
  assertExists(deployments)
  
  // Check federated_learning_rounds table
  const { data: fedRounds, error: fedError } = await supabaseService
    .from('federated_learning_rounds')
    .select('id')
    .limit(1)
  
  assertEquals(fedError, null)
  assertExists(fedRounds)
  
  // Check ai_explanations table
  const { data: explanations, error: expError } = await supabaseService
    .from('ai_explanations')
    .select('id')
    .limit(1)
  
  assertEquals(expError, null)
  assertExists(explanations)
})

// Run tests
if (import.meta.main) {
  console.log(JSON.stringify({
  level: "info",
  timestamp: new Date().toISOString(),
  message: "Running ML Pipeline Integration Tests..."
}));
}