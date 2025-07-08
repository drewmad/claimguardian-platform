# 🚀 Supabase Setup Guide for ClaimGuardian

## ✅ Setup Complete!

Your Supabase connection is now fully configured and working.

### 📋 Configuration Files Created:
- `.env.local` - Environment variables for Next.js
- `supabase/config.toml` - Supabase CLI configuration  
- `scripts/supabase-examples.sh` - API usage examples

### 🔑 Credentials Configured:
- **Project URL**: `https://tmlrvecuwgppbaynesji.supabase.co`
- **Anon Key**: ✅ Configured
- **Service Role Key**: ✅ Configured

## 🛠️ Available Operations

### 1. **Direct API Calls (Recommended)**

```bash
# Read data
curl -X GET "https://tmlrvecuwgppbaynesji.supabase.co/rest/v1/forms" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Create data  
curl -X POST "https://tmlrvecuwgppbaynesji.supabase.co/rest/v1/forms" \
  -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"filing_id": "TEST", "form_number": "HO-3", "company": "Test Company"}'

# Update data
curl -X PATCH "https://tmlrvecuwgppbaynesji.supabase.co/rest/v1/forms?id=eq.RECORD_ID" \
  -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated Title"}'

# Delete data
curl -X DELETE "https://tmlrvecuwgppbaynesji.supabase.co/rest/v1/forms?id=eq.RECORD_ID" \
  -H "apikey: YOUR_SERVICE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_KEY"
```

### 2. **Using JavaScript/TypeScript (In Your App)**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Read data
const { data, error } = await supabase
  .from('forms')
  .select('*')
  .limit(10)

// Create data
const { data, error } = await supabase
  .from('forms')
  .insert([
    { filing_id: 'TEST', form_number: 'HO-3', company: 'Test Company' }
  ])
```

### 3. **Supabase CLI Commands**

```bash
# Check status
supabase status

# Start local development
supabase start

# Generate TypeScript types
supabase gen types typescript --project-id tmlrvecuwgppbaynesji

# Create migration
supabase migration new create_new_table

# Push migration to remote
supabase db push
```

## 📊 Your Database Schema

Your database contains these tables:
- **forms** - Main insurance forms data
- **forms_clauses** - Form sections/clauses
- **forms_embeddings** - AI embeddings for search
- **crawler_logs** - Web crawling activity
- **user_plans** - User subscription management
- **search_logs** - Search analytics

## ✅ Test Results

**Connection**: ✅ Working  
**Authentication**: ✅ Valid  
**Read Operations**: ✅ Tested  
**Write Operations**: ✅ Tested  
**API Schema**: ✅ Loaded  

## 🚨 Security Notes

1. **Never commit** `.env.local` to git (already in .gitignore)
2. **Use anon key** for client-side operations
3. **Use service role key** for server-side operations only
4. **Row Level Security** is available for fine-grained access control

## 🔧 Next Steps

1. **Generate Types**: Run `supabase gen types typescript` for TypeScript definitions
2. **Set up Auth**: Configure authentication in your Next.js app
3. **Add RLS**: Implement Row Level Security policies
4. **Create Functions**: Add custom database functions as needed

## 📞 Need Help?

Run the examples script: `./scripts/supabase-examples.sh`

Your Supabase setup is complete and ready for development! 🎉