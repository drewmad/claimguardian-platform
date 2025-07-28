# 🌴 Florida Data Platform - Final Setup Guide

## ✅ **Current Status**
- ✅ **Database Schema**: Successfully deployed with FLOIR and property tables
- ✅ **Edge Functions**: 4 functions deployed and responding
- ⚠️ **Environment Variables**: Need configuration
- ⏳ **Testing**: Ready for testing once env vars are set

## 🔧 **Immediate Next Steps (5 minutes)**

### **1. Configure Supabase Environment Variables**

Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/settings/environment-variables

Add these variables:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

### **2. Get Your API Keys**

Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/settings/api

Copy these values:
```bash
export SUPABASE_URL=https://tmlrvecuwgppbaynesji.supabase.co
export SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
export SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### **3. Test the Platform**

```bash
# Set your environment variables (replace with actual values)
export SUPABASE_ANON_KEY=your_anon_key_here

# Run the test suite
./scripts/test-florida-platform.sh
```

## 🚀 **Quick Test Commands**

### **Test FLOIR News Bulletins (Fastest to test)**
```bash
curl -X POST 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/floir-extractor' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"data_type": "news_bulletins"}'
```

### **Test Vector Search**
```bash
curl -X POST 'https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/floir-rag-search' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"query": "recent insurance regulation updates"}'
```

### **Check Database Tables**
```bash
curl 'https://tmlrvecuwgppbaynesji.supabase.co/rest/v1/floir_data?select=count' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'apikey: YOUR_ANON_KEY'
```

## 📊 **Deployed Components**

### **Database Tables**
- `floir_data` - FLOIR regulation data with vector embeddings
- `crawl_runs` - Crawl job monitoring and status
- `properties` - Florida property data (PostGIS enabled)
- `parcel_import_batches` - Import job tracking

### **Edge Functions**
1. **floir-extractor** - Main data crawling for all 10 FLOIR data types
2. **floir-rag-search** - AI-powered semantic search
3. **florida-parcel-monitor** - Property data monitoring
4. **property-ai-enrichment** - AI analysis and risk scoring

### **Extensions Enabled**
- `vector` - For embeddings and similarity search
- `postgis` - For spatial property data
- `pg_cron` - For scheduled tasks
- `pg_net` - For HTTP requests

## 🎯 **Expected Test Results**

### **Successful Response Examples**

**FLOIR Extractor Success:**
```json
{
  "success": true,
  "data_type": "news_bulletins", 
  "records_processed": 25,
  "records_created": 5,
  "records_updated": 20,
  "crawl_run_id": "uuid-here"
}
```

**RAG Search Success:**
```json
{
  "results": [
    {
      "id": "uuid",
      "data_type": "news_bulletins",
      "title": "Insurance Regulation Update",
      "similarity": 0.85,
      "source_url": "https://floir.com/..."
    }
  ],
  "query": "recent insurance regulation updates"
}
```

## 🔍 **Troubleshooting**

### **Common Issues & Solutions**

**401 Unauthorized:**
- Check that SUPABASE_ANON_KEY is correctly set
- Verify the key is from the correct project

**Function timeout or no response:**
- Check OpenAI API key is set in Supabase Dashboard
- Verify OpenAI account has available credits

**Database connection errors:**
- Verify RLS policies are correctly configured
- Check that public schema access is enabled

**Empty search results:**
- Normal on first run - no data imported yet
- Run FLOIR extractor first to populate data

## 📈 **Next Steps After Testing**

### **Phase 1: FLOIR Data Population**
1. Test news bulletins (fastest)
2. Add catastrophe data (high priority)
3. Import rate filings (business critical)

### **Phase 2: Property Data Integration**
1. Test with Charlotte County (smallest dataset)
2. Verify spatial queries work correctly
3. Scale to larger counties

### **Phase 3: Production Optimization**
1. Set up monitoring alerts
2. Configure automated daily crawls
3. Implement data quality checks

## 📞 **Support**

- **Edge Function Logs**: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/functions
- **Database Query Editor**: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql
- **Real-time Logs**: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/logs

## 🎉 **Success Criteria**

The platform is working correctly when:
- ✅ Test script shows all green checkmarks
- ✅ FLOIR extractor returns processed records > 0
- ✅ RAG search returns relevant results
- ✅ Database queries return data
- ✅ No errors in Edge Function logs

**You're 5 minutes away from a fully functional Florida Data Platform!** 🚀