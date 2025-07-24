# ClaimGuardian Data Sources Master List

Last Updated: July 23, 2025

## 1. Florida Property & Parcel Data

### 1.1 Statewide Sources

| Source | URL | Update Frequency | Schedule | Purpose |
|--------|-----|------------------|----------|---------|
| **FGIO** (Florida Geographic Information Office) | `https://services.arcgis.com/KTcxiTD9dsQw4r7Z/ArcGIS/rest/services/Florida_Statewide_Parcels/FeatureServer/0` | Quarterly | 1st day of Jan, Apr, Jul, Oct at 2:00 AM UTC | Statewide parcel boundaries and basic attributes |
| **FDOT** (Florida Department of Transportation) | `https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer` | Weekly | Every Sunday at 3:00 AM UTC | Delta updates from 67 county layers |
| **FGDL** (Florida Geographic Data Library) | `https://fgdl.org/metadataexplorer/explorer/zip/` | Yearly | March 1st at 4:00 AM UTC | Historical parcel archives |
| **DOR** (Department of Revenue) | `https://floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx` | Annually | August 1st at 5:00 AM UTC | Official tax roll shapes |
| **Florida Statewide Cadastral** | `https://services9.arcgis.com/Gh9awoU677aKree0/arcgis/rest/services/Florida_Statewide_Cadastral/FeatureServer/0` | As needed | Manual trigger | Additional cadastral data |

### 1.2 County-Specific Sources

| County | URL | Update Frequency | Schedule | Notes |
|--------|-----|------------------|----------|--------|
| **Charlotte County** | `https://ccgis.charlottecountyfl.gov/arcgis/rest/services/WEB_Parcels/MapServer/0` | Daily | 3:00 AM UTC | Primary test county |
| **Lee County** | `https://maps.leepa.org/arcgis/rest/services/Leegis/SecureParcels/MapServer/0` | Daily | 4:00 AM UTC | Requires authentication |
| **Sarasota County** | `https://gis.sc-pa.com/server/rest/services/Parcel/ParcelData/MapServer/1` | Daily | 5:00 AM UTC | Public access |

## 2. Contractor & License Data

| Source | URL | Update Frequency | Schedule | Purpose |
|--------|-----|------------------|----------|---------|
| **Florida DBPR Licenses** | `https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_certified.csv` | Weekly | Sunday nights | Licensed contractor data |
| **Contractor Connection API** | Environment variable: `CONTRACTOR_CONN_API_BASE_URL` | Real-time | Webhook-based | Contractor profiles, documents, compliance |

## 3. AI & Machine Learning APIs

| Service | Base URL | Purpose | Key Variable |
|---------|----------|---------|--------------|
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent` | Damage analysis, document extraction | `NEXT_PUBLIC_GEMINI_API_KEY` |
| **OpenAI** | `https://api.openai.com/v1/` | Alternative AI provider (configured) | `NEXT_PUBLIC_OPENAI_API_KEY` |

## 4. Google Services

| Service | Endpoint | Purpose | Key Variable |
|---------|----------|---------|--------------|
| **Places API** | `https://maps.googleapis.com/maps/api/place/autocomplete/json` | Address autocomplete | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` |
| **Geocoding API** | `https://maps.googleapis.com/maps/api/geocode/json` | Address to coordinates | Same key |
| **Elevation API** | `https://maps.googleapis.com/maps/api/elevation/json` | Property elevation data | Same key |

## 5. Monitoring & Infrastructure

| Service | Purpose | Configuration |
|---------|---------|---------------|
| **Sentry** | Error tracking & performance | `SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT` |
| **External Scraper API** | Property data proxy | `EXTERNAL_SCRAPER_API`, `SCRAPER_API_KEY` |

## 6. Scheduled Data Collection Jobs

### 6.1 Database Jobs (pg_cron)

| Job Name | Schedule | Purpose |
|----------|----------|---------|
| Florida Property Scraper | Every hour (0 * * * *) | General property updates |
| Staged Data Processor | Every 5 minutes (*/5 * * * *) | Process staged data |
| Database Scraper | Daily at 2:00 AM (0 2 * * *) | Full database sync |
| Charlotte County Scrape | Daily at 3:00 AM (0 3 * * *) | County-specific update |
| Lee County Scrape | Daily at 4:00 AM (0 4 * * *) | County-specific update |
| Sarasota County Scrape | Daily at 5:00 AM (0 5 * * *) | County-specific update |

### 6.2 Edge Function Jobs

| Function | Schedule | Purpose |
|----------|----------|---------|
| fgio-sync | Quarterly (0 2 1 1,4,7,10 *) | FGIO quarterly sync |
| fdot-delta | Weekly (0 3 * * 0) | FDOT delta updates |
| zip-ingest | Yearly (0 4 1 3 *) | FGDL archive ingestion |
| dor-sync | Yearly (0 5 1 8 *) | DOR tax roll sync |
| refresh-parcels-view | Daily (0 6 * * *) | Materialized view refresh |

## 7. Insurance Carrier Data

### Static Data (50+ carriers)
- **Citizens Property Insurance**: State-backed insurer
- **Major Carriers**: State Farm, Universal, Heritage, American Integrity
- **Regional Carriers**: Florida Peninsula, Federated National, Southern Fidelity
- **Surplus Lines**: Lloyd's of London, Scottsdale, Lexington

## 8. Future/Planned Integrations

| Source | Purpose | Status |
|--------|---------|--------|
| **NOAA/NWS API** | Weather data, storm tracking | Planned |
| **USGS Water Data** | Flood sensors, water levels | Planned |
| **FEMA Flood Maps** | Flood zone determination | Planned |
| **NHC Hurricane Data** | Hurricane tracking & history | Planned |
| **Insurance Commissioner Data** | Carrier ratings, complaints | Planned |

## 9. Data Collection Best Practices

### Rate Limits
- FGIO: Max 2000 records per request
- FDOT: 1000 records per page
- General timeout: 5 minutes (300000ms)
- Retry attempts: 3 with 5-second delays

### Storage Strategy
1. **Raw Storage**: `external.fl_parcels_raw` (staging)
2. **Processed Data**: `public.florida_parcels` (production)
3. **Optimized View**: `public.parcels` (materialized view)

### Security Considerations
- All external APIs use service role authentication
- PII filtered from public views
- Row-level security on all user data
- Webhook validation with shared secrets

## 10. Manual Trigger Commands

```bash
# FGIO quarterly sync
supabase functions invoke fgio-sync

# FDOT delta sync
supabase functions invoke fdot-delta

# FGDL ZIP ingest
supabase functions invoke zip-ingest \
  --body '{"url":"https://fgdl.org/ftp/parcels_2023.zip","source":"fgdl"}'

# Refresh materialized view
supabase db query 'REFRESH MATERIALIZED VIEW CONCURRENTLY public.parcels;'
```

## 11. Monitoring Commands

```bash
# Check recent ingests
supabase db query 'SELECT * FROM external.fl_parcel_ingest_events ORDER BY started_at DESC LIMIT 10;'

# Verify parcel counts
supabase db query 'SELECT source, COUNT(*) FROM external.fl_parcels_raw GROUP BY source;'

# Monitor function logs
supabase functions logs --tail fgio-sync
```