# Florida Data Platform Documentation

Comprehensive documentation for the Florida Data Platform, including FLOIR (Florida Office of Insurance Regulation) integration and property data systems.

## Overview

The Florida Data Platform provides:
- **Automated regulatory data collection** from FLOIR portals
- **Large-scale property data ingestion** from state and county sources
- **AI-powered analysis** with vector embeddings
- **Spatial intelligence** using PostGIS
- **Real-time monitoring** dashboards

## Documentation

### Setup & Deployment
1. **[ACTION_PLAN.md](./ACTION_PLAN.md)** - Step-by-step implementation plan
2. **[FLORIDA_PLATFORM_SETUP.md](./FLORIDA_PLATFORM_SETUP.md)** - Initial setup guide
3. **[FLOIR_DEPLOYMENT_GUIDE.md](./FLOIR_DEPLOYMENT_GUIDE.md)** - Complete deployment instructions

### Platform Summary
- **[FLORIDA_DATA_PLATFORM_SUMMARY.md](./FLORIDA_DATA_PLATFORM_SUMMARY.md)** - High-level overview of capabilities

## Quick Start

### 1. Database Setup
```bash
# Apply migrations in order
supabase db push --file supabase/migrations/20250726000000_add_floir_data_infrastructure.sql
supabase db push --file supabase/migrations/20250726001000_setup_floir_automation.sql
supabase db push --file supabase/migrations/20250726002000_setup_floir_cron_jobs.sql
supabase db push --file supabase/migrations/20250726003000_add_florida_parcels_infrastructure.sql
supabase db push --file supabase/migrations/20250726004000_add_parcel_processing_functions.sql
```

### 2. Deploy Edge Functions
```bash
# FLOIR functions
supabase functions deploy floir-extractor
supabase functions deploy floir-rag-search

# Parcel functions
supabase functions deploy florida-parcel-ingest
supabase functions deploy florida-parcel-monitor
supabase functions deploy property-ai-enrichment
```

### 3. Configure Environment
```bash
# Required for AI features
OPENAI_API_KEY=your-key
SUPABASE_SERVICE_ROLE_KEY=your-key
```

## Data Sources

### FLOIR Portals (10 sources)
- Catastrophe reports
- Rate filings
- News bulletins
- Professional liability
- Receivership data
- Industry reports
- Financial reports
- Data call reports
- Licensee search
- Surplus lines

### Property Data Sources
- Florida Department of Revenue (statewide)
- County Property Appraisers (67 counties)
- GIS systems (parcels, boundaries)
- Tax roll data

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│   FLOIR Crawlers    │     │  Property Ingesters │
│  (Edge Functions)   │     │   (Edge Functions)  │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           ▼                           ▼
┌─────────────────────────────────────────────────┐
│             PostgreSQL + PostGIS                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │ FLOIR Data  │  │Property Data│  │ Vectors │ │
│  └─────────────┘  └─────────────┘  └─────────┘ │
└─────────────────────────────────────────────────┘
           │                           │
           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐
│   Search Interface  │     │ Monitoring Dashboard│
│  (React Components) │     │  (React Components) │
└─────────────────────┘     └─────────────────────┘
```

## Monitoring

Access real-time monitoring through:
- `/admin/floir` - FLOIR data dashboard
- `/admin/parcels` - Property data dashboard
- `/admin/florida-search` - Unified search interface

## Performance

- Handles 10M+ property records
- Sub-second vector search
- Automated incremental updates
- Zero-downtime data refreshes

## Support

For Florida platform issues:
- Review logs in Supabase dashboard
- Check Edge Function logs
- Contact: florida-data@claimguardianai.com