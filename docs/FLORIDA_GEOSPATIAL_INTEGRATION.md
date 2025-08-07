# Florida Geospatial Open Data Portal Integration

This document outlines the complete implementation of Florida Geospatial Open Data Portal integration into ClaimGuardian, transforming publicly available geographic data into powerful risk assessment and claims processing capabilities.

## Overview

The integration provides:
- **Automated Property Verification**: Link properties to official Florida parcel data
- **Real-time Risk Assessment**: Calculate risk scores based on hazard zones and infrastructure
- **Active Event Monitoring**: Track wildfires, floods, and other hazards near insured properties
- **Portfolio Risk Visualization**: Aggregate risk analytics across all properties

## Architecture

### Database Schema

The implementation uses PostGIS-enabled PostgreSQL with the following schema:

```
geospatial schema
├── parcels                 # Florida property parcels with boundaries
├── hazard_zones           # FEMA flood zones, storm surge areas, etc.
├── critical_facilities    # Fire stations, hospitals, shelters
├── active_events          # Real-time hazard events
├── parcel_risk_assessment # Calculated risk scores
└── [utility functions]    # Spatial calculations and risk scoring
```

### Data Sources

1. **Florida Statewide Parcels**
   - Source: Florida Department of Revenue
   - Update Frequency: Annually
   - Contains: Property boundaries, ownership, tax assessment data

2. **FEMA National Flood Hazard Layer**
   - Source: Federal Emergency Management Agency
   - Update Frequency: Monthly
   - Contains: Flood zones, base flood elevations

3. **SLOSH Storm Surge Zones**
   - Source: NOAA
   - Update Frequency: Annually
   - Contains: Hurricane storm surge predictions by category

4. **Active Wildfires**
   - Source: Florida Forest Service
   - Update Frequency: Every 15 minutes
   - Contains: Active fire perimeters and status

5. **Critical Infrastructure**
   - Source: Florida Division of Emergency Management
   - Update Frequency: Quarterly
   - Contains: Fire stations, hospitals, emergency shelters

## Implementation Components

### 1. Database Setup

```bash
# Apply the geospatial schema
./scripts/apply-geospatial-schema.sh

# Apply database functions
psql $DATABASE_URL -f scripts/geospatial-db-functions.sql
```

### 2. Data Acquisition

```bash
# List available data sources
python scripts/florida-geospatial-data-acquisition.py --list

# Fetch specific data source
python scripts/florida-geospatial-data-acquisition.py florida_parcels

# Fetch all data sources
python scripts/florida-geospatial-data-acquisition.py
```

### 3. ETL Pipeline

```bash
# Run full ETL pipeline
python scripts/geospatial-etl-pipeline.py run

# Run specific operations
python scripts/geospatial-etl-pipeline.py risk    # Calculate risk assessments
python scripts/geospatial-etl-pipeline.py events  # Process active events
python scripts/geospatial-etl-pipeline.py stats   # Generate statistics
```

### 4. Automated Sync Workflows

```bash
# Test the sync workflow
./scripts/geospatial-sync-workflow.sh test

# Run specific sync types
./scripts/geospatial-sync-workflow.sh realtime  # Every 15 minutes
./scripts/geospatial-sync-workflow.sh daily     # Daily at 2 AM
./scripts/geospatial-sync-workflow.sh weekly    # Sundays at 3 AM
./scripts/geospatial-sync-workflow.sh monthly   # 1st of month at 4 AM
```

### 5. Cron Configuration

```bash
# Install cron jobs
sudo cp scripts/geospatial-cron.conf /etc/cron.d/claimguardian-geospatial
sudo chmod 644 /etc/cron.d/claimguardian-geospatial

# Or add to user crontab
crontab -e
# Then paste contents of geospatial-cron.conf
```

## UI Components

### PropertyRiskDashboard

Main dashboard component displaying comprehensive risk assessment:

```tsx
import { PropertyRiskDashboard } from '@/components/risk/PropertyRiskDashboard'

<PropertyRiskDashboard
  propertyId={property.id}
  propertyName={property.name}
  parcelId={property.parcelId}
  address={property.address}
/>
```

### ParcelSearch

Component for finding and linking parcels to properties:

```tsx
import { ParcelSearch } from '@/components/risk/ParcelSearch'

<ParcelSearch
  propertyId={property.id}
  currentParcelId={property.parcelId}
  onParcelLinked={(parcelId) => handleParcelLinked(parcelId)}
/>
```

### Risk Score Components

- `RiskScoreCard`: Individual risk category display
- `HazardZonesList`: List of all hazard zones affecting a property
- `ActiveEventsMap`: Real-time hazard events near properties

## Server Actions API

### Search Parcels
```typescript
const { data, error } = await searchParcels({
  query: "123 Main St",
  county: "Miami-Dade",
  limit: 10
})
```

### Get Risk Assessment
```typescript
const { data, error } = await getParcelRiskAssessment({
  parcelId: "12345-67890"
})
```

### Get Hazard Zones
```typescript
const { data, error } = await getPropertyHazardZones({
  propertyId: "uuid-here"
})
```

### Get Active Events
```typescript
const { data, error } = await getActiveEventsNearProperty({
  propertyId: "uuid-here",
  radiusMiles: 10
})
```

### Link Property to Parcel
```typescript
const { data, error } = await linkPropertyToParcel({
  propertyId: "uuid-here",
  parcelId: "12345-67890"
})
```

### Get Portfolio Risk Summary
```typescript
const { data, error } = await getPortfolioRiskSummary()
```

## Risk Scoring Algorithm

The composite risk score is calculated as a weighted average:

- **Flood Risk**: 30% weight
- **Wind Risk**: 25% weight
- **Storm Surge Risk**: 25% weight
- **Wildfire Risk**: 20% weight

Additional factors:
- Distance to nearest fire station
- Distance to nearest hospital
- Number of overlapping hazard zones

## Monitoring & Maintenance

### Health Checks

```sql
-- Check data freshness
SELECT
    'parcels' as dataset,
    COUNT(*) as record_count,
    MAX(last_updated) as last_update
FROM geospatial.parcels
UNION ALL
SELECT
    'active_events',
    COUNT(*),
    MAX(updated_at)
FROM geospatial.active_events
WHERE status = 'active';
```

### Performance Optimization

1. **Spatial Indexes**: All geometry columns have GIST indexes
2. **Materialized Views**: Pre-computed risk assessments for fast access
3. **Batch Processing**: ETL processes data in configurable batch sizes
4. **Connection Pooling**: Supabase handles connection pooling automatically

### Error Handling

- All scripts log to `/var/log/claimguardian/`
- Database errors are logged to `system_logs` table
- Failed notifications are retried with exponential backoff
- Lock files prevent concurrent sync processes

## Security Considerations

1. **Row Level Security**: All geospatial tables have RLS policies
2. **API Access**: Service role key required for data imports
3. **User Access**: Users can only see risk data for their own properties
4. **Data Validation**: All imported data is validated before insertion

## Future Enhancements

1. **Additional Data Sources**
   - Historical hurricane tracks
   - Sea level rise projections
   - Building code compliance data
   - Insurance claim history by area

2. **Advanced Analytics**
   - Machine learning risk prediction
   - Temporal risk analysis
   - Climate change impact modeling
   - Catastrophe modeling integration

3. **Real-time Features**
   - WebSocket updates for active events
   - Push notifications for property alerts
   - Live evacuation route planning
   - Emergency resource allocation

## Troubleshooting

### Common Issues

1. **Import Failures**
   ```bash
   # Check logs
   tail -f /var/log/claimguardian/geospatial-sync-*.log

   # Verify database connection
   psql $DATABASE_URL -c "SELECT 1"
   ```

2. **Missing Dependencies**
   ```bash
   # Install Python dependencies
   pip install geopandas sqlalchemy psycopg2-binary requests
   ```

3. **Spatial Query Errors**
   ```sql
   -- Ensure PostGIS is enabled
   CREATE EXTENSION IF NOT EXISTS postgis;
   ```

### Support

For issues or questions:
1. Check logs in `/var/log/claimguardian/`
2. Review `system_logs` table for errors
3. Verify all environment variables are set
4. Ensure proper database permissions

## Conclusion

This geospatial integration transforms ClaimGuardian into a data-driven platform capable of:
- Instant risk assessment for any Florida property
- Proactive hazard monitoring and alerts
- Portfolio-level risk analytics
- Automated claims triage based on event data

The system is designed to scale with additional data sources and can be extended to other states as needed.
