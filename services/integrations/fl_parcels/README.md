# Florida Parcels ETL Pipeline

This directory contains the ETL (Extract, Transform, Load) pipeline for ingesting Florida parcel data from multiple sources into Supabase.

## Overview

The pipeline pulls parcel data from four primary sources:

- **FGIO** (Florida Geographic Information Office) - Quarterly statewide updates
- **FDOT** (Florida Department of Transportation) - Weekly delta updates
- **FGDL** (Florida Geographic Data Library) - Yearly archives
- **DOR** (Department of Revenue) - Annual tax roll shapes

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    FGIO     │     │    FDOT     │     │    FGDL     │     │     DOR     │
│  Quarterly  │     │   Weekly    │     │   Yearly    │     │   Annual    │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Edge Functions (Deno)                            │
├─────────────┬──────────────┬─────────────────┬────────────────────────┤
│ fgio_sync   │ fdot_delta   │   zip_ingest    │    zip_ingest          │
└─────────────┴──────────────┴─────────────────┴────────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │ external.fl_parcels_raw│
                        │    (Staging Table)     │
                        └───────────────────────┘
                                    │
                                    ▼
                        ┌───────────────────────┐
                        │   public.parcels      │
                        │ (Materialized View)   │
                        └───────────────────────┘
```

## Data Sources

### FGIO (Quarterly)

- **URL**: https://www.arcgis.com/home/item.html?id=efa909d6b1c841d298b0a649e7f71cf2
- **Schedule**: 1st day of Jan, Apr, Jul, Oct at 02:00 UTC
- **Type**: Full sync of statewide parcels
- **Format**: ArcGIS FeatureServer (GeoJSON)

### FDOT (Weekly)

- **URL**: https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer
- **Schedule**: Every Sunday at 03:00 UTC
- **Type**: Delta sync (only new ObjectIDs)
- **Format**: 67 county-specific layers

### FGDL (Yearly)

- **URL**: https://fgdl.org/explore-data/
- **Schedule**: March 1st at 04:00 UTC
- **Type**: Full yearly archive
- **Format**: ZIP containing shapefiles

### DOR (Annual)

- **URL**: https://floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx
- **Schedule**: August 1st at 05:00 UTC
- **Type**: Official tax roll shapes
- **Format**: ZIP containing shapefiles (requires manual URL)

## Setup

### 1. Database Migration

```bash
# Run the migration to create tables and functions
pnpm db:migrate
```

### 2. Deploy Edge Functions

```bash
# Make the deploy script executable
chmod +x ./deploy.sh

# Deploy all edge functions
./deploy.sh
```

### 3. Environment Variables

Ensure these are set in your Supabase project:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Manual Operations

### Trigger Manual Sync

```bash
# FGIO quarterly sync
supabase functions invoke fgio-sync

# FDOT delta sync
supabase functions invoke fdot-delta

# FGDL ZIP ingest
supabase functions invoke zip-ingest \
  --body '{"url":"https://fgdl.org/ftp/parcels_2023.zip","source":"fgdl"}'

# DOR ZIP ingest (requires manual URL from DOR portal)
supabase functions invoke zip-ingest \
  --body '{"url":"<DOR_ZIP_URL>","source":"dor"}'
```

### Refresh Materialized View

```bash
supabase db query 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.parcels;'
```

### Monitor Logs

```bash
# Follow function logs
supabase functions logs --tail fgio-sync
supabase functions logs --tail fdot-delta
supabase functions logs --tail zip-ingest

# Check ingest events
supabase db query 'SELECT * FROM external.fl_parcel_ingest_events ORDER BY started_at DESC LIMIT 10;'
```

## Database Schema

### Tables

#### `external.fl_parcels_raw`

Raw staging table for all parcel data:

- `pk` - Primary key (UUID)
- `source` - Data source (fgio/fdot/fgdl/dor)
- `source_url` - Original data URL
- `download_ts` - Download timestamp
- `county_fips` - 3-digit county FIPS code
- `parcel_id` - Unique parcel identifier
- `geom` - Polygon geometry (EPSG:4326)
- `attrs` - JSONB with all attributes
- `ingest_batch_id` - Links to ingest event

#### `external.fl_parcel_ingest_events`

Tracks ETL pipeline runs:

- `id` - Event ID
- `ingest_batch_id` - Unique batch identifier
- `source` - Data source
- `status` - started/completed/failed
- `record_count` - Records processed
- `error_message` - Error details if failed
- `started_at` - Start timestamp
- `completed_at` - Completion timestamp
- `metadata` - Additional run metadata

### Views

#### `public.parcels`

Materialized view with common attributes:

- `parcel_id` - Unique identifier
- `county_fips` - County code
- `situs_address` - Property address
- `landuse_code` - Land use classification
- `just_value` - Assessed value
- `year_built` - Construction year
- `owner_name` - Property owner
- `living_area` - Living square footage
- `total_area` - Total square footage
- `bedroom_count` - Number of bedrooms
- `bathroom_count` - Number of bathrooms
- `geom` - Geometry
- `source` - Data source
- `download_ts` - Last update

## Performance Considerations

1. **Batch Processing**: Data is processed in chunks to avoid memory issues
2. **Indexes**: Spatial and JSONB indexes for fast queries
3. **Materialized View**: Pre-computed view refreshed daily
4. **Concurrent Refresh**: View can be refreshed without blocking reads
5. **RLS**: Row-level security enabled on public view

## Monitoring

Use the included ParcelETLMonitor component to track:

- Total parcels by source and county
- Recent ingest events and status
- Manual sync triggers
- Materialized view refresh

## Troubleshooting

### Common Issues

1. **Rate Limiting**: Add delays between requests if seeing 429 errors
2. **Memory Issues**: Reduce batch sizes in config.ts
3. **Timeout Errors**: Increase timeout in REQUEST_CONFIG
4. **Geometry Errors**: Ensure valid polygons with proper SRID

### Debug Commands

```bash
# Check for failed ingests
supabase db query "SELECT * FROM external.fl_parcel_ingest_events WHERE status = 'failed';"

# Verify parcel counts by source
supabase db query "SELECT source, COUNT(*) FROM external.fl_parcels_raw GROUP BY source;"

# Check for duplicate parcels
supabase db query "SELECT parcel_id, COUNT(*) as cnt FROM external.fl_parcels_raw GROUP BY parcel_id HAVING COUNT(*) > 1;"
```

## Security

- Edge functions use service role key (keep secure)
- Read-only RLS policy on public view
- No PII exposed in public view (DOR data filtered)
- All requests logged in ingest events

## Future Enhancements

1. **Embedding Integration**: Auto-generate embeddings for address/landuse search
2. **Change Detection**: Track parcel boundary/attribute changes over time
3. **Data Quality**: Automated validation and anomaly detection
4. **API Gateway**: REST API for parcel queries
5. **Webhooks**: Notify downstream systems of updates
