# Secure Florida Parcel Data Loading Guide

## Overview

This guide documents the secure implementation for loading Florida parcel data from FDOT's ArcGIS FeatureServer into Supabase.

## Security Implementation

### 1. Edge Functions with Service Role

- **No local scripts with credentials**: All data loading happens via Supabase Edge Functions
- **Service role key**: Used within Edge Functions for database writes (never exposed)
- **Authentication required**: All Edge Functions require valid JWT tokens
- **CORS protection**: Restricts access to allowed origins

### 2. Data Flow Security

```
FDOT API → Edge Function → Transform → Validate → Insert to DB
         ↑                                      ↓
    JWT Auth                            Audit Logging
```

### 3. Key Components

#### Edge Function: `load-charlotte-simple`

- Secure serverless function for Charlotte County data
- Handles FDOT API interaction with proper parameters
- Transforms Esri JSON geometry to PostGIS WKT
- Validates data before insertion
- Returns detailed success/error metrics

#### Test Script: `test-charlotte-loader.sh`

```bash
./scripts/test-charlotte-loader.sh 0 5  # Load 5 records starting at offset 0
```

#### Batch Loader: `load-charlotte-batch.sh`

```bash
./scripts/load-charlotte-batch.sh 1000 100 2  # Load 1000 records, 100 per batch, 2s delay
```

## Successfully Resolved Issues

### 1. API Format Issue

- **Problem**: FDOT doesn't support `f=geojson`
- **Solution**: Use `f=json` with manual geometry conversion

### 2. Field Mapping

- **Charlotte County verified mappings**:
  - `PARCELNO` → `parcel_id`
  - `OWN_NAME` → `owner_name`
  - `SITEADDRESS` → `property_address`
  - `MAILING_ADDRESS_1` → `owner_address`
  - FIPS: `12015` (Florida + Charlotte)

### 3. Geometry Handling

- Convert Esri rings format to WKT
- Handle both POLYGON and MULTIPOLYGON
- Validate with `ST_IsValid(geom)`

### 4. Authentication

- Edge Functions use service role internally
- External calls require anon key with JWT
- No credentials in scripts or environment

## Current Status

### Charlotte County Data

- ✅ Successfully loaded test parcels
- ✅ Valid geometry for all records
- ✅ Proper field mappings confirmed
- ✅ Batch loading tested and working

### Sample Loaded Data

```sql
SELECT COUNT(*) FROM parcels WHERE county_name = 'CHARLOTTE';
-- Result: 5+ parcels loaded

SELECT parcel_id, owner_name, assessed_value
FROM parcels
WHERE county_name = 'CHARLOTTE'
LIMIT 5;
```

## Next Steps

### 1. Enable RLS Policies

```sql
-- Enable RLS
ALTER TABLE parcels ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated reads
CREATE POLICY "parcels_read" ON parcels
  FOR SELECT USING (true);

-- Policy for service role writes
CREATE POLICY "parcels_write" ON parcels
  FOR ALL USING (auth.role() = 'service_role');
```

### 2. Set Up Monitoring

- Create `system_logs` and `audit_logs` tables
- Add error alerting via Supabase webhooks
- Monitor API rate limits

### 3. Schedule Automated Updates

```sql
-- Using pg_cron
SELECT cron.schedule(
  'load-charlotte-parcels',
  '0 2 * * 1', -- Weekly on Monday at 2 AM
  $$SELECT net.http_post(
    url := 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/load-charlotte-simple',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY"}'::jsonb,
    body := '{"offset": 0, "limit": 1000}'::jsonb
  )$$
);
```

### 4. Expand to Other Counties

Create similar Edge Functions for other counties:

- Monroe (Layer 44, FIPS 12087)
- Lee (Layer 36, FIPS 12071)
- Collier (Layer 11, FIPS 12021)

## Security Best Practices

1. **Never expose service keys**: Keep them in Supabase secrets
2. **Use RLS**: Enable row-level security on all tables
3. **Audit everything**: Log all data modifications
4. **Rate limit**: Respect FDOT API limits (1000 records/query)
5. **Validate inputs**: Check all data before insertion
6. **Monitor usage**: Track API calls and database growth

## Troubleshooting

### Common Issues

1. **"Invalid JWT"**: Check authorization header format
2. **"permission denied for schema geospatial"**: Use public schema views
3. **No features returned**: Verify layer ID and offset
4. **Geometry errors**: Ensure WKT format is correct

### Debug Commands

```bash
# Check Edge Function logs
supabase functions logs load-charlotte-simple

# Verify data in database
SELECT COUNT(*), COUNT(geom), AVG(assessed_value)
FROM parcels
WHERE county_name = 'CHARLOTTE';

# Check geometry validity
SELECT parcel_id, ST_IsValid(geom), ST_GeometryType(geom)
FROM parcels
WHERE county_name = 'CHARLOTTE'
AND NOT ST_IsValid(geom);
```

## 2024 Data Availability

As of August 2025, 2024 parcel data is available from:

- Florida Geospatial Open Data Portal (FGIO)
- Direct download option for bulk processing
- More current than FDOT's 2022 service

Consider migrating to FGIO for fresher data in production.
