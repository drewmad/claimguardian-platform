# Florida Data Platform Deployment Guide

This comprehensive guide covers the deployment of both FLOIR (Florida Office of Insurance Regulation) data capture and Florida parcel data ingestion systems into ClaimGuardian.

## 🚀 Overview

The Florida Data Platform provides:

### FLOIR System
- **Automated data crawling** from 10 Florida insurance regulation portals
- **AI-powered normalization** and embedding generation
- **Semantic search** across all regulatory data
- **Real-time monitoring** dashboard

### Parcel System  
- **Large-scale property data ingestion** from Florida DOR and county sources
- **PostGIS spatial processing** with AI feature extraction
- **Incremental updates** with zero-downtime atomic swaps
- **Risk assessment** and spatial relationship computation
- **Vector embeddings** for AI-powered property search

### Unified Platform
- **Cross-domain search** across both regulation and property data
- **Integrated monitoring** dashboard
- **AI-powered insights** combining regulatory and spatial data

## 📋 Prerequisites

1. **Supabase Project**: Active Supabase project with admin access
2. **OpenAI API Key**: For embeddings and AI normalization
3. **Required Extensions**: 
   - `vector` extension for embeddings
   - `postgis` extension for spatial operations
   - `pg_cron` for scheduling
   - `pgmq` for job queues (optional)
4. **Edge Functions**: Enabled on Supabase project
5. **Storage**: Adequate storage for ~10M property records (~50GB estimated)

## 🗄️ Database Setup

### Step 1: Apply Migrations

Run the following migrations in order:

```bash
# 1. Core FLOIR infrastructure
supabase db push --db-url "your-database-url" --file supabase/migrations/20250726000000_add_floir_data_infrastructure.sql

# 2. FLOIR automation functions  
supabase db push --db-url "your-database-url" --file supabase/migrations/20250726001000_setup_floir_automation.sql

# 3. FLOIR cron job schedules
supabase db push --db-url "your-database-url" --file supabase/migrations/20250726002000_setup_floir_cron_jobs.sql

# 4. Florida parcels infrastructure (PostGIS + property data)
supabase db push --db-url "your-database-url" --file supabase/migrations/20250726003000_add_florida_parcels_infrastructure.sql

# 5. Parcel processing functions
supabase db push --db-url "your-database-url" --file supabase/migrations/20250726004000_add_parcel_processing_functions.sql
```

### Step 2: Enable Extensions

In your Supabase SQL editor, run:

```sql
-- Enable vector extension for embeddings
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Enable PostGIS for spatial operations
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Enable pg_cron for scheduling  
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

-- Enable pg_net for HTTP requests (usually already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
```

### Step 3: Configure Environment Variables

Add to your Supabase project settings:

```bash
# Required for Edge Functions
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## ⚡ Edge Functions Deployment

### Step 1: Deploy FLOIR Functions

```bash
# FLOIR data extractor
supabase functions deploy floir-extractor --project-ref tmlrvecuwgppbaynesji

# FLOIR RAG search
supabase functions deploy floir-rag-search --project-ref tmlrvecuwgppbaynesji
```

### Step 2: Deploy Parcel Functions

```bash
# Florida parcel data ingestion
supabase functions deploy florida-parcel-ingest --project-ref tmlrvecuwgppbaynesji

# Parcel monitoring and source management
supabase functions deploy florida-parcel-monitor --project-ref tmlrvecuwgppbaynesji

# Property AI enrichment
supabase functions deploy property-ai-enrichment --project-ref tmlrvecuwgppbaynesji
```

### Step 3: Test Functions

```bash
# Test FLOIR extractor
curl -X POST 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/floir-extractor' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"data_type": "news_bulletins", "force_refresh": false}'

# Test FLOIR RAG search
curl -X POST 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/floir-rag-search' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"query": "hurricane claims data", "limit": 5}'

# Test parcel monitor
curl -X POST 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcel-monitor' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"action": "health_check"}'

# Test property enrichment
curl -X POST 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/property-ai-enrichment' \\
  -H 'Authorization: Bearer YOUR_ANON_KEY' \\
  -H 'Content-Type: application/json' \\
  -d '{"action": "batch_enrich", "batch_size": 10}'
```

## 🔧 Frontend Integration

### Step 1: Install Dependencies

The components use existing ClaimGuardian UI components, so no additional dependencies are needed.

### Step 2: Add Route

The unified Florida data hub page is available at:
```
/ai-tools/floir-insights  # Now renamed to Florida Data Hub
```

### Step 3: Update Navigation

Add to your AI tools navigation:

```typescript
{
  name: 'Florida Data Hub',
  href: '/ai-tools/floir-insights',
  description: 'Comprehensive Florida insurance regulation and property data analysis',
  icon: DatabaseIcon
}
```

### Step 4: Available Features

The integrated platform provides:

- **Unified Search**: Cross-domain search across regulation and property data
- **FLOIR Data**: Insurance regulation data with AI-powered search
- **Parcel Data**: Property information with spatial analysis
- **System Status**: Monitoring for both data systems

## 📊 Monitoring Setup

### Dashboard Access

Visit `/ai-tools/floir-insights` to access:
- **AI Search Tab**: Semantic search across all FLOIR data
- **Dashboard Tab**: Real-time crawl status and statistics

### Key Metrics to Monitor

1. **Crawl Success Rate**: % of successful vs failed crawls
2. **Data Freshness**: Time since last successful crawl per data type
3. **Error Rate**: Number of errors per crawl run
4. **Performance**: Average crawl duration per data type

### Alerts Setup

Monitor these conditions:
- Failed crawls > 2 consecutive attempts
- No successful crawl in 24+ hours for critical data types
- Error rate > 10% for any data type
- Crawl duration > 5 minutes (performance degradation)

## 🔄 Automation Schedule

The system automatically crawls data on these schedules:

### High Priority (Business Critical)
- **Catastrophe Reports**: Every 6 hours
- **Rate Filings**: Every 4 hours  
- **News Bulletins**: Every 2 hours

### Medium Priority
- **Receivership**: Every 8 hours
- **Professional Liability**: Daily at 2 AM EST
- **Data Call Reports**: Daily at 4 AM EST

### Low Priority  
- **Industry Reports**: Weekly (Mondays)
- **Financial Reports**: Weekly (Wednesdays)
- **Surplus Lines**: Weekly (Fridays)
- **Licensee Search**: Weekly (Saturdays)

### Maintenance
- **Cleanup Job**: Daily at 11 PM EST
- **Health Check**: Every 15 minutes

## 🛠️ Manual Operations

### Trigger Manual Crawl

```sql
-- Crawl specific data type
SELECT public.trigger_floir_crawl('catastrophe', false);

-- Crawl all data types
SELECT public.schedule_all_floir_crawls();

-- Force refresh (ignore cache)
SELECT public.trigger_floir_crawl('rate_filings', true);
```

### Check System Status

```sql
-- Get crawl statistics
SELECT * FROM public.get_floir_crawl_stats();

-- View recent crawl runs
SELECT * FROM public.crawl_runs 
ORDER BY started_at DESC 
LIMIT 10;

-- Check cron job status
SELECT * FROM public.floir_cron_status;
```

### Maintenance Mode

```sql
-- Disable all FLOIR cron jobs
SELECT public.disable_floir_cron_jobs();

-- Clear failed jobs
DELETE FROM public.floir_crawl_jobs WHERE status = 'failed';

-- Manual cleanup
SELECT public.cleanup_old_floir_data();
```

## 🚨 Troubleshooting

### Common Issues

1. **Crawl Failures**
   - Check OPENAI_API_KEY is valid
   - Verify target sites are accessible
   - Review rate limiting settings

2. **Missing Embeddings**
   - Ensure vector extension is enabled
   - Check OpenAI API quota and billing
   - Verify embedding model is available

3. **Cron Jobs Not Running**
   - Confirm pg_cron extension is enabled
   - Check database permissions for service role
   - Verify cron job schedules are active

4. **Search Not Working**
   - Test floir-rag-search function directly
   - Check if embeddings exist in database
   - Verify similarity threshold settings

### Debug Queries

```sql
-- Check data volume by type
SELECT data_type, COUNT(*), MAX(extracted_at) as last_update
FROM floir_data 
GROUP BY data_type;

-- Find recent errors
SELECT data_type, errors, started_at 
FROM crawl_runs 
WHERE status = 'failed' 
ORDER BY started_at DESC;

-- Check embedding coverage
SELECT data_type, 
       COUNT(*) as total,
       COUNT(embedding) as with_embeddings,
       ROUND(COUNT(embedding) * 100.0 / COUNT(*), 2) as coverage_pct
FROM floir_data 
GROUP BY data_type;
```

## 📈 Performance Optimization

### Database Indexes

The migrations create optimized indexes, but monitor these queries:

```sql
-- Monitor slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
WHERE query LIKE '%floir%' 
ORDER BY mean_exec_time DESC;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes 
WHERE tablename IN ('floir_data', 'crawl_runs');
```

### Rate Limiting Tuning

Adjust crawl frequencies in `/config.ts` if sites start blocking:

```typescript
// Reduce rate limits if needed
rateLimit: 0.5, // requests per second (was 1.0)
delays: { min: 3000, max: 8000 } // increase delays
```

## 🔒 Security Considerations

1. **API Keys**: Store securely in Supabase secrets
2. **Rate Limiting**: Respect target site ToS and robots.txt
3. **Data Access**: RLS policies allow public read, service role write
4. **User Agent**: Use descriptive, respectful user agent strings
5. **Error Handling**: Don't expose internal system details

## 📚 Data Types Reference

| Data Type | Source | Update Frequency | Priority |
|-----------|--------|------------------|----------|
| `catastrophe` | floir.com/catastrophe-reporting | 6 hours | High |
| `rate_filings` | irfssearch.fldfs.com | 4 hours | High |
| `news_bulletins` | floir.com/newsroom | 2 hours | High |
| `receivership` | myfloridacfo.com/receiver | 8 hours | Medium |
| `professional_liability` | floir.com/professional-liability | Daily | Medium |
| `data_call` | floir.com/data-call-reporting | Daily | Medium |
| `industry_reports` | floir.com/industry-reports | Weekly | Low |
| `financial_reports` | floir.com/financial-oversight | Weekly | Low |
| `surplus_lines` | floir.com/surplus-lines-search | Weekly | Low |
| `licensee_search` | licenseesearch.fldfs.com | Weekly | Low |

## 🎯 Success Metrics

Track these KPIs after deployment:

1. **Data Coverage**: 90%+ of expected records captured
2. **Uptime**: 95%+ successful crawl rate
3. **Freshness**: Average data age < 24 hours for critical types
4. **Search Quality**: 80%+ user satisfaction with search results
5. **Performance**: Search response time < 2 seconds

---

## Support

For technical issues:
1. Check the troubleshooting section above
2. Review Supabase function logs
3. Monitor database performance metrics
4. Contact the development team with specific error messages

This deployment integrates seamlessly with ClaimGuardian's existing architecture while providing powerful new regulatory data capabilities.