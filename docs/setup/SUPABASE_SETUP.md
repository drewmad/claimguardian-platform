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
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Read data
const { data, error } = await supabase.from("forms").select("*").limit(10);

// Create data
const { data, error } = await supabase
  .from("forms")
  .insert([
    { filing_id: "TEST", form_number: "HO-3", company: "Test Company" },
  ]);
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

## 🤖 Connecting with Gemini CLI

### Prerequisites

1. **Install Supabase CLI**:

   ```bash
   brew install supabase/tap/supabase
   ```

2. **Set Environment Variables**:
   ```bash
   export SUPABASE_ACCESS_TOKEN="your-access-token"
   export SUPABASE_PROJECT_REF="tmlrvecuwgppbaynesji"
   ```

### Connection Steps for Gemini CLI

1. **Login to Supabase**:

   ```bash
   supabase login --token "$SUPABASE_ACCESS_TOKEN"
   ```

2. **Link to Project**:

   ```bash
   supabase link --project-ref tmlrvecuwgppbaynesji
   ```

3. **Verify Connection**:
   ```bash
   supabase status
   ```

### Using Supabase in Gemini Scripts

```bash
#!/bin/bash
# Example: Query data via Gemini CLI

# Set up credentials
PROJECT_URL="https://tmlrvecuwgppbaynesji.supabase.co"
ANON_KEY="your-anon-key"

# Query forms table
curl -X GET "$PROJECT_URL/rest/v1/forms?limit=10" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" | jq '.'

# Insert data
curl -X POST "$PROJECT_URL/rest/v1/forms" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filing_id": "GEMINI-001",
    "form_number": "HO-3",
    "company": "Test Insurance Co"
  }'
```

### Gemini CLI Integration Pattern

```python
# Example: Python script for Gemini to interact with Supabase
import os
import requests

class SupabaseGeminiClient:
    def __init__(self):
        self.url = "https://tmlrvecuwgppbaynesji.supabase.co"
        self.key = os.environ.get("SUPABASE_ANON_KEY")
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json"
        }

    def query_forms(self, limit=10):
        response = requests.get(
            f"{self.url}/rest/v1/forms?limit={limit}",
            headers=self.headers
        )
        return response.json()

    def create_form(self, data):
        response = requests.post(
            f"{self.url}/rest/v1/forms",
            headers=self.headers,
            json=data
        )
        return response.json()

# Usage
client = SupabaseGeminiClient()
forms = client.query_forms()
print(f"Found {len(forms)} forms")
```

### Database Migration via Gemini

```bash
# Pull current schema
supabase db pull

# Create new migration
supabase migration new add_gemini_features

# Edit the migration file in supabase/migrations/
# Then push to production
supabase db push

# Generate updated TypeScript types
supabase gen types typescript --project-id tmlrvecuwgppbaynesji > types/supabase.ts
```

### Environment Setup for Gemini

Create a `.gemini.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://tmlrvecuwgppbaynesji.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_PROJECT_REF=tmlrvecuwgppbaynesji

# Load in Gemini scripts
source .gemini.env
```

## 🔧 Next Steps

1. **Generate Types**: Run `supabase gen types typescript` for TypeScript definitions
2. **Set up Auth**: Configure authentication in your Next.js app
3. **Add RLS**: Implement Row Level Security policies
4. **Create Functions**: Add custom database functions as needed
5. **Configure Gemini**: Set up environment variables for Gemini CLI access

## 📞 Need Help?

- Run the examples script: `./scripts/supabase-examples.sh`
- Check Gemini connection: `supabase status`
- View logs: `supabase db logs`

Your Supabase setup is complete and ready for development! 🎉
