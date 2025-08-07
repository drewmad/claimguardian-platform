# Google Maps Intelligence Integration Guide

## Overview
This guide covers how to integrate and use the comprehensive Google Maps Intelligence system in ClaimGuardian, including data storage, retrieval, and the execution scheduling strategy.

## 🗄️ Database Schema

### Core Tables Created
- **`maps_api_executions`** - Tracks all API calls with performance metrics
- **`address_intelligence`** - Address validation and property risk data
- **`weather_intelligence`** - Weather data and claims correlation
- **`aerial_intelligence`** - Roof analysis and damage assessment
- **`environmental_intelligence`** - Pollen, air quality, elevation data
- **`street_view_intelligence`** - Ground-level property documentation
- **`solar_intelligence`** - Solar potential and financial analysis
- **`static_maps_intelligence`** - Property mapping and visualization
- **`unified_intelligence_cache`** - Caches combined API results
- **`maps_api_usage_stats`** - Daily usage statistics and cost tracking

### Apply Database Migration
```bash
# Apply the comprehensive schema
supabase db reset --include-migrations
# or apply the specific migration file
psql -h localhost -p 54322 -U postgres -d postgres -f supabase/migrations/create_maps_intelligence_schema.sql
```

## 📦 Package Integration

### Install Dependencies
The Maps Intelligence types and services are included in `@claimguardian/db`:

```typescript
import {
  MapsIntelligenceService,
  type MapsApiType,
  type PropertyIntelligenceSummary,
  type IntelligenceResponse
} from '@claimguardian/db'
```

### Initialize Service
```typescript
import { MapsIntelligenceService } from '@claimguardian/db'

const mapsService = new MapsIntelligenceService(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

## 🔄 Basic Usage Patterns

### 1. Property Onboarding (Run Once)
```typescript
async function onboardProperty(propertyId: string, address: string) {
  // Create execution tracking
  const addressExecution = await mapsService.createApiExecution({
    property_id: propertyId,
    api_type: 'address_validation',
    execution_trigger: 'onboarding',
    request_payload: { address }
  })

  // Call Address Validation Edge Function
  const { data } = await supabase.functions.invoke('address-validation-intelligence', {
    body: {
      address,
      options: {
        includeRiskAssessment: true,
        includePropertyIntelligence: true,
        validateForInsurance: true
      }
    }
  })

  // Store results
  if (data.success && addressExecution.data) {
    await mapsService.storeAddressIntelligence({
      property_id: propertyId,
      execution_id: addressExecution.data.id,
      is_valid: data.data.validation.isValid,
      confidence_score: data.data.validation.confidence,
      formatted_address: data.data.standardizedAddress?.formattedAddress,
      hurricane_risk: data.data.riskAssessment?.hurricaneRisk,
      flood_zone: data.data.riskAssessment?.floodZone,
      // ... other fields
    })

    // Update execution status
    await mapsService.updateApiExecution(addressExecution.data.id, {
      status: 'completed',
      response_payload: data,
      execution_time_ms: 1500,
      api_cost_usd: 0.005
    })
  }
}
```

### 2. Regular Monitoring (Scheduled)
```typescript
async function weeklyWeatherMonitoring(propertyId: string) {
  // Check if recent data exists
  const recentWeather = await mapsService.getWeatherIntelligence(propertyId, {
    latest: true
  })

  // Skip if data is less than 7 days old
  if (recentWeather.data &&
      new Date(recentWeather.data.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    return recentWeather.data
  }

  // Create new execution
  const execution = await mapsService.createApiExecution({
    property_id: propertyId,
    api_type: 'weather_claims',
    execution_trigger: 'scheduled'
  })

  // Call Weather Intelligence Edge Function
  const { data } = await supabase.functions.invoke('weather-claims-intelligence', {
    body: {
      location: { lat: 25.7617, lng: -80.1918 },
      analysisType: 'risk-assessment'
    }
  })

  // Store results
  if (data.success && execution.data) {
    await mapsService.storeWeatherIntelligence({
      property_id: propertyId,
      execution_id: execution.data.id,
      current_weather: data.data.current,
      flood_risk_score: data.data.riskAssessment?.floodRisk,
      hurricane_risk_score: data.data.riskAssessment?.hurricaneRisk,
      seasonal_factors: data.data.riskAssessment?.seasonalFactors
    })
  }
}
```

### 3. Event-Driven (Storm Response)
```typescript
async function postStormDamageAssessment(propertyId: string, stormDate: string) {
  // Create execution for aerial assessment
  const execution = await mapsService.createApiExecution({
    property_id: propertyId,
    api_type: 'aerial_roof',
    execution_trigger: 'storm_event',
    request_payload: { stormDate }
  })

  // Call Aerial Intelligence Edge Function
  const { data } = await supabase.functions.invoke('aerial-roof-intelligence', {
    body: {
      location: { lat: 25.7617, lng: -80.1918 },
      analysisType: 'damage-assessment',
      damageReportDate: stormDate
    }
  })

  // Store damage assessment results
  if (data.success && execution.data) {
    await mapsService.storeAerialIntelligence({
      property_id: propertyId,
      execution_id: execution.data.id,
      analysis_type: 'damage-assessment',
      damage_percentage: data.data.damageAssessment?.damagePercentage,
      damage_types: data.data.damageAssessment?.damageType,
      repair_estimate_min: data.data.damageAssessment?.repairEstimate.min,
      repair_estimate_max: data.data.damageAssessment?.repairEstimate.max,
      insurance_recommendation: data.data.damageAssessment?.insuranceRecommendation
    })
  }
}
```

## 🔍 Data Retrieval Patterns

### Get Property Intelligence Summary
```typescript
async function getPropertyOverview(propertyId: string) {
  const summary = await mapsService.getPropertyIntelligenceSummary(propertyId)

  if (summary.success) {
    console.log('Available intelligence types:', summary.data.intelligence_types)
    /*
    {
      address_validation: true,
      weather_analysis: true,
      aerial_analysis: false,
      environmental_data: true,
      // ... etc
    }
    */
  }
}
```

### Retrieve Specific Intelligence Data
```typescript
// Get latest address validation
const addressData = await mapsService.getAddressIntelligence(propertyId, true)

// Get weather data for specific claim
const weatherData = await mapsService.getWeatherIntelligence(propertyId, {
  claim_date: '2024-08-15',
  latest: true
})

// Get all aerial assessments
const aerialData = await mapsService.getAerialIntelligence(propertyId, undefined, false)
```

## 💾 Caching Strategy

### Unified Intelligence Cache
```typescript
async function getCachedPropertyIntelligence(propertyId: string) {
  const cacheKey = `property_${propertyId}_complete_intelligence`

  // Check cache first
  const cached = await mapsService.getCachedIntelligence(cacheKey)
  if (cached.data) {
    return cached.data.unified_data
  }

  // Generate new intelligence if not cached
  const intelligence = await generateCompleteIntelligence(propertyId)

  // Cache for 24 hours
  await mapsService.setCachedIntelligence({
    property_id: propertyId,
    cache_key: cacheKey,
    cache_type: 'complete_intelligence',
    apis_included: ['address_validation', 'weather_claims', 'aerial_roof'],
    unified_data: intelligence,
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  })

  return intelligence
}
```

## 📊 Usage Analytics

### Track API Usage
```typescript
async function trackApiUsage(data: {
  propertyId: string
  apiType: MapsApiType
  costUsd: number
  executionTimeMs: number
  cacheHit: boolean
}) {
  await mapsService.recordApiUsage({
    property_id: data.propertyId,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    api_type: data.apiType,
    cost_usd: data.costUsd,
    execution_time_ms: data.executionTimeMs,
    cache_hit: data.cacheHit
  })
}
```

### Get Usage Statistics
```typescript
// Get monthly usage for a property
const monthlyStats = await mapsService.getUsageStats({
  property_id: propertyId,
  date_range: {
    start: '2024-08-01',
    end: '2024-08-31'
  }
})

// Get usage by API type
const weatherUsage = await mapsService.getUsageStats({
  user_id: userId,
  api_type: 'weather_claims',
  date_range: {
    start: '2024-08-01',
    end: '2024-08-31'
  }
})
```

## 🔧 Maintenance Operations

### Cleanup Expired Cache
```typescript
// Run periodically (e.g., daily cron job)
async function dailyMaintenance() {
  const cleanup = await mapsService.cleanupExpiredCache()
  console.log(`Cleaned up ${cleanup.data?.deleted_count} expired cache entries`)

  const maintenance = await mapsService.performMaintenance()
  console.log('Maintenance summary:', maintenance.data?.summary)
}
```

## 🚀 Integration with Existing ClaimGuardian Features

### Property Setup Page Integration
```typescript
// In property setup form submission
async function handlePropertySubmit(formData: PropertyFormData) {
  // Create property in database
  const property = await createProperty(formData)

  // Trigger onboarding intelligence gathering
  await Promise.all([
    onboardProperty(property.id, formData.address),
    // Trigger solar analysis for property value
    callSolarIntelligence(property.id),
    // Generate baseline street view documentation
    callStreetViewIntelligence(property.id)
  ])

  // Redirect to dashboard with intelligence loading
  router.push(`/dashboard?property=${property.id}&gathering=true`)
}
```

### Claims Filing Integration
```typescript
// When filing a claim, gather relevant intelligence
async function fileClaimWithIntelligence(claimData: ClaimData) {
  const claimDate = claimData.incident_date

  // Gather storm correlation data
  const weatherCorrelation = await supabase.functions.invoke('weather-claims-intelligence', {
    body: {
      location: claimData.property_location,
      claimDate,
      analysisType: 'claim-correlation'
    }
  })

  // Get post-incident aerial assessment
  const aerialAssessment = await supabase.functions.invoke('aerial-roof-intelligence', {
    body: {
      location: claimData.property_location,
      analysisType: 'damage-assessment',
      damageReportDate: claimDate
    }
  })

  // Create claim with supporting intelligence
  return await createClaimWithEvidence({
    ...claimData,
    weather_correlation: weatherCorrelation.data,
    aerial_evidence: aerialAssessment.data
  })
}
```

## 🔒 Security & Permissions

### Row Level Security
All intelligence tables inherit RLS policies from the properties table:
- Users can only access intelligence for properties they own
- System-level access for automated processes
- Service role access for Edge Functions

### API Key Management
```typescript
// Edge Functions use environment variables
const GOOGLE_MAPS_API_KEY = Deno.env.get('NEXT_PUBLIC_GOOGLE_MAPS_API_KEY')

// Client-side access restricted by domain
// Server-side access via service role key
```

## 📈 Performance Considerations

### Batch Processing
```typescript
// Process multiple properties efficiently
const batchRequest: BatchIntelligenceRequest = {
  property_ids: propertyIds,
  api_types: ['weather_claims', 'environmental'],
  execution_trigger: 'scheduled',
  options: {
    max_concurrent: 5,
    timeout_ms: 30000
  }
}

const batchResults = await mapsService.batchCreateExecutions(
  batchRequest.property_ids.flatMap(propertyId =>
    batchRequest.api_types.map(apiType => ({
      property_id: propertyId,
      api_type: apiType,
      execution_trigger: batchRequest.execution_trigger
    }))
  )
)
```

### Query Optimization
```typescript
// Use indexes effectively
const recentExecutions = await supabase
  .from('maps_api_executions')
  .select('*')
  .eq('property_id', propertyId)           // Uses idx_api_executions_property_id
  .eq('api_type', 'weather_claims')        // Uses idx_api_executions_api_type
  .eq('status', 'completed')               // Uses idx_api_executions_status
  .order('executed_at', { ascending: false })
  .limit(10)
```

This comprehensive integration provides ClaimGuardian with powerful property intelligence capabilities while maintaining efficient data storage, retrieval, and cost management!
