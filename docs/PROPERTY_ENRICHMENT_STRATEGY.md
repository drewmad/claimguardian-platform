# Property Data Enrichment Strategy

## Overview

This document outlines ClaimGuardian's approach to enriching property data using Google APIs for comprehensive insurance risk assessment and documentation.

## Current Approach (All Users - Phase 1)

All users receive full property enrichment upon address confirmation during onboarding.

### APIs Used for Residential Properties

1. **Geocoding API** - Additional location metadata
   - Neighborhood boundaries
   - Census tract (for demographic risk data)
   - Plus codes for precise location
   - Administrative areas

2. **Elevation API** - Flood risk assessment
   - Elevation above sea level
   - Critical for Florida flood insurance

3. **Street View Static API** - Property documentation
   - 4 directional photos (N/S/E/W)
   - Street-level property condition
   - "Before" documentation for claims

4. **Maps Static API** - Aerial view
   - Satellite imagery of property
   - Roof condition assessment
   - Property boundaries visualization
   - Surrounding area context

5. **Places Nearby Search** - Emergency services only
   - Fire stations (response time affects premiums)
   - Hospitals (emergency preparedness)
   - Police stations (security rating)
   - Fire hydrants (critical for fire insurance)

### Data Captured

```typescript
interface EnrichedPropertyData {
  // Geocoding Data
  plus_code: string;
  neighborhood: string;
  census_tract: string;
  county: string;
  state: string;
  country: string;
  formatted_address: string;
  address_components: AddressComponent[];
  
  // Elevation Data
  elevation_meters: number;
  elevation_resolution: number;
  flood_zone: string; // Derived from elevation
  
  // Visual Documentation
  street_view_images: {
    north: string; // URL to image
    south: string;
    east: string;
    west: string;
    metadata: {
      date: string;
      pano_id: string;
    }
  };
  
  aerial_view_images: {
    zoom_15: string; // Neighborhood view
    zoom_18: string; // Property view  
    zoom_20: string; // Detailed roof view
  };
  
  // Emergency Services
  fire_protection: {
    nearest_station: {
      name: string;
      distance_meters: number;
      drive_time_seconds: number;
    };
    nearest_hydrant: {
      distance_meters: number;
    };
    protection_class: number; // 1-10 rating
  };
  
  medical_services: {
    nearest_hospital: {
      name: string;
      distance_meters: number;
      trauma_center: boolean;
    };
  };
  
  // Risk Factors
  distance_to_coast_meters: number;
  hurricane_evacuation_zone: string;
  
  // Metadata
  enrichment_version: string;
  enriched_at: string;
  data_sources: {
    google_apis_version: string;
    costs: {
      geocoding: number;
      elevation: number;
      street_view: number;
      maps_static: number;
      places_nearby: number;
      total: number;
    };
  };
}
```

## Database Schema

```sql
-- Main enrichment table with versioning
CREATE TABLE property_enrichments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_current BOOLEAN DEFAULT true,
  
  -- Location Data
  plus_code TEXT,
  neighborhood TEXT,
  census_tract TEXT,
  county TEXT NOT NULL,
  
  -- Elevation & Flood Risk
  elevation_meters DECIMAL(8,2),
  elevation_resolution DECIMAL(5,2),
  flood_zone VARCHAR(10),
  flood_risk_score INTEGER, -- 1-10
  
  -- Visual Documentation
  street_view_data JSONB, -- Contains URLs, pano_ids, dates
  aerial_view_data JSONB, -- Multiple zoom levels
  
  -- Emergency Services
  fire_protection JSONB,
  medical_services JSONB,
  police_services JSONB,
  
  -- Risk Assessment
  distance_to_coast_meters INTEGER,
  hurricane_zone VARCHAR(10),
  storm_surge_zone VARCHAR(10),
  
  -- Insurance Factors
  insurance_risk_factors JSONB, -- Computed scores
  
  -- Metadata
  source_apis JSONB, -- Which APIs were called
  api_costs JSONB, -- Cost breakdown
  enriched_at TIMESTAMPTZ DEFAULT NOW(),
  enriched_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  UNIQUE(property_id, version)
);

-- Index for current records
CREATE INDEX idx_current_enrichments ON property_enrichments(property_id) WHERE is_current = true;

-- Audit trail for changes
CREATE TABLE enrichment_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  action VARCHAR(50), -- 'created', 'updated', 'reprocessed'
  previous_version INTEGER,
  new_version INTEGER,
  changes JSONB,
  reason TEXT,
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID REFERENCES auth.users(id)
);
```

## Cost Structure

### Current Costs (Full Enrichment)
- Geocoding API: $0.005 per property
- Elevation API: $0.005 per property  
- Street View (4 images): $0.028 per property
- Maps Static (3 zoom levels): $0.021 per property
- Places Nearby (emergency only): $0.005 per property
- **Total: $0.064 per property**

### Future Tiered Approach

#### Free Tier (Basic)
- Elevation data only ($0.005)
- Basic flood risk assessment
- Stored in local database after first lookup

#### Standard Tier ($9.99/month)
- Everything in Free
- Street view images (4 directions)
- Emergency services distances
- Total cost: $0.038 per property

#### Premium Tier ($19.99/month)
- Everything in Standard  
- Aerial imagery (3 zoom levels)
- Advanced risk scoring
- Quarterly updates
- Total cost: $0.064 per property

## Implementation

### Edge Function: enrich-property-data

```typescript
import { createClient } from '@supabase/supabase-js';

const GOOGLE_MAPS_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

export async function enrichPropertyData(
  propertyId: string,
  latitude: number,
  longitude: number,
  address: string
) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Check if we need to create new version
  const { data: currentEnrichment } = await supabase
    .from('property_enrichments')
    .select('version')
    .eq('property_id', propertyId)
    .eq('is_current', true)
    .single();

  const newVersion = currentEnrichment ? currentEnrichment.version + 1 : 1;

  // Parallel API calls for efficiency
  const [
    geocodeData,
    elevationData,
    streetViewData,
    aerialViewData,
    nearbyData
  ] = await Promise.all([
    fetchGeocodeData(latitude, longitude),
    fetchElevation(latitude, longitude),
    fetchStreetViewImages(latitude, longitude),
    fetchAerialImages(latitude, longitude),
    fetchNearbyEmergencyServices(latitude, longitude)
  ]);

  // Calculate derived fields
  const floodRisk = calculateFloodRisk(elevationData.elevation);
  const insuranceFactors = calculateInsuranceFactors({
    elevation: elevationData,
    fireProtection: nearbyData.fireStations,
    coastalDistance: nearbyData.coastDistance
  });

  // Prepare enrichment record
  const enrichmentData = {
    property_id: propertyId,
    version: newVersion,
    is_current: true,
    
    // All captured data...
    plus_code: geocodeData.plus_code,
    neighborhood: geocodeData.neighborhood,
    census_tract: geocodeData.census_tract,
    
    // ... rest of fields
    
    source_apis: {
      geocoding: 'v1',
      elevation: 'v1',
      street_view: 'v1',
      maps_static: 'v1',
      places: 'v3'
    },
    
    api_costs: {
      geocoding: 0.005,
      elevation: 0.005,
      street_view: 0.028,
      maps_static: 0.021,
      places_nearby: 0.005,
      total: 0.064
    }
  };

  // Update previous version if exists
  if (currentEnrichment) {
    await supabase
      .from('property_enrichments')
      .update({ is_current: false })
      .eq('property_id', propertyId)
      .eq('version', currentEnrichment.version);
  }

  // Insert new enrichment
  const { data, error } = await supabase
    .from('property_enrichments')
    .insert(enrichmentData)
    .select()
    .single();

  // Log the enrichment
  await supabase
    .from('enrichment_audit_log')
    .insert({
      property_id: propertyId,
      action: newVersion === 1 ? 'created' : 'updated',
      previous_version: currentEnrichment?.version || null,
      new_version: newVersion,
      reason: 'Initial enrichment from onboarding'
    });

  return { success: true, data, cost: 0.064 };
}
```

## Future Optimizations

### Local Database Caching (Phase 2)
1. **Census Data**: Store locally after first fetch
2. **Neighborhood Boundaries**: Cache in PostGIS
3. **Fire Station Locations**: Update quarterly
4. **Flood Maps**: Store FEMA flood zones locally

### Batch Processing (Phase 3)
1. Process multiple properties in single API calls where possible
2. Use Google's batch endpoints
3. Queue enrichments during off-peak hours

### Progressive Enhancement (Phase 4)
1. Start with free/cheap data
2. Add premium data based on user tier
3. Update only changed data points

## Monitoring & Alerts

1. **Cost Monitoring**
   - Alert at 80% of budget
   - Daily cost reports
   - Per-user cost tracking

2. **Data Quality**
   - Flag properties with incomplete data
   - Alert on API failures
   - Track enrichment success rates

3. **Performance**
   - Monitor API response times
   - Track enrichment duration
   - Queue depth monitoring

## Integration with Onboarding

Property enrichment is automatically triggered when users complete onboarding:

1. User enters and verifies property address via Google Places Autocomplete
2. Latitude, longitude, and place_id are captured
3. When onboarding completes, a property record is created
4. The `enrich-property-data` Edge Function is invoked automatically
5. All enrichment data is stored with versioning support
6. Images URLs are stored for future retrieval

### Manual Enrichment

Properties can also be enriched manually using the server action:

```typescript
import { enrichPropertyData } from '@/actions/property-enrichment'

const result = await enrichPropertyData({
  propertyId: 'uuid-here',
  latitude: 25.7617,
  longitude: -80.1918,
  address: '123 Main St, Miami, FL',
  placeId: 'ChIJ...' // Optional
})
```

### Checking Enrichment Status

```typescript
import { getPropertyEnrichmentStatus } from '@/actions/property-enrichment'

const status = await getPropertyEnrichmentStatus(propertyId)
// Returns: { enriched, version, enrichedAt, expiresAt, daysUntilExpiry, totalCost }
```

## Required Environment Variables

Make sure these are set in your Edge Functions environment:

```bash
GOOGLE_MAPS_API_KEY=your-api-key-here
SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```