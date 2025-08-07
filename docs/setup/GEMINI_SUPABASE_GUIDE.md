# 🤖 Gemini CLI Supabase Connection Guide

## Overview
This guide provides detailed instructions for connecting Gemini CLI to the ClaimGuardian Supabase database.

## Project Details
- **Project ID**: `tmlrvecuwgppbaynesji`
- **Project URL**: `https://tmlrvecuwgppbaynesji.supabase.co`
- **Region**: US East
- **Database**: PostgreSQL 15

## Prerequisites

### 1. Install Required Tools
```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Install jq for JSON parsing
brew install jq

# Verify installations
supabase --version
jq --version
```

### 2. Obtain Credentials
You'll need:
- **Supabase Access Token**: Personal access token from Supabase dashboard
- **Anon Key**: Public API key (safe for client-side)
- **Service Role Key**: Admin API key (server-side only)

## Connection Methods

### Method 1: Direct API Access (Recommended for Gemini)

```bash
#!/bin/bash
# gemini-supabase.sh - Supabase connection script for Gemini

# Configuration
export SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
export SUPABASE_ANON_KEY="<your-anon-key>"
export SUPABASE_SERVICE_KEY="<your-service-role-key>"

# Function to query data
query_supabase() {
    local table=$1
    local query=$2

    curl -s -X GET "${SUPABASE_URL}/rest/v1/${table}?${query}" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" | jq '.'
}

# Function to insert data
insert_supabase() {
    local table=$1
    local data=$2

    curl -s -X POST "${SUPABASE_URL}/rest/v1/${table}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "${data}" | jq '.'
}

# Function to update data
update_supabase() {
    local table=$1
    local filter=$2
    local data=$3

    curl -s -X PATCH "${SUPABASE_URL}/rest/v1/${table}?${filter}" \
        -H "apikey: ${SUPABASE_SERVICE_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=representation" \
        -d "${data}" | jq '.'
}

# Example usage
echo "🔍 Querying properties..."
query_supabase "properties" "limit=5&select=*"

echo "➕ Creating a test property..."
insert_supabase "properties" '{
    "name": "Gemini Test Property",
    "type": "Single Family Home",
    "address": {
        "street1": "123 Test St",
        "city": "Miami",
        "state": "FL",
        "zip": "33139"
    }
}'
```

### Method 2: Supabase CLI Integration

```bash
# 1. Set up environment
export SUPABASE_ACCESS_TOKEN="<your-access-token>"

# 2. Login to Supabase
supabase login --token "$SUPABASE_ACCESS_TOKEN"

# 3. Link to project
supabase link --project-ref tmlrvecuwgppbaynesji

# 4. Verify connection
supabase status

# 5. Run SQL queries
supabase db execute --sql "SELECT * FROM properties LIMIT 5"

# 6. Generate TypeScript types
supabase gen types typescript --project-id tmlrvecuwgppbaynesji
```

### Method 3: Python Integration for Gemini

```python
# gemini_supabase_client.py
import os
import requests
from typing import Dict, List, Optional
import json

class GeminiSupabaseClient:
    """Supabase client optimized for Gemini CLI operations"""

    def __init__(self):
        self.url = "https://tmlrvecuwgppbaynesji.supabase.co"
        self.anon_key = os.environ.get("SUPABASE_ANON_KEY")
        self.service_key = os.environ.get("SUPABASE_SERVICE_KEY")

        if not self.anon_key:
            raise ValueError("SUPABASE_ANON_KEY not set in environment")

        self.headers = {
            "apikey": self.anon_key,
            "Authorization": f"Bearer {self.anon_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

        self.admin_headers = {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }

    def query(self, table: str, select: str = "*", filters: Dict = None, limit: int = None) -> List[Dict]:
        """Query data from a table"""
        url = f"{self.url}/rest/v1/{table}"
        params = {"select": select}

        if filters:
            for key, value in filters.items():
                params[key] = value

        if limit:
            params["limit"] = limit

        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def insert(self, table: str, data: Dict, use_admin: bool = False) -> Dict:
        """Insert data into a table"""
        url = f"{self.url}/rest/v1/{table}"
        headers = self.admin_headers if use_admin else self.headers

        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()

    def update(self, table: str, id: str, data: Dict, use_admin: bool = False) -> Dict:
        """Update a record by ID"""
        url = f"{self.url}/rest/v1/{table}?id=eq.{id}"
        headers = self.admin_headers if use_admin else self.headers

        response = requests.patch(url, headers=headers, json=data)
        response.raise_for_status()
        return response.json()

    def delete(self, table: str, id: str, use_admin: bool = True) -> bool:
        """Delete a record by ID"""
        url = f"{self.url}/rest/v1/{table}?id=eq.{id}"
        headers = self.admin_headers if use_admin else self.headers

        response = requests.delete(url, headers=headers)
        response.raise_for_status()
        return response.status_code == 204

    def rpc(self, function_name: str, params: Dict = None) -> any:
        """Call a database function"""
        url = f"{self.url}/rest/v1/rpc/{function_name}"

        response = requests.post(url, headers=self.headers, json=params or {})
        response.raise_for_status()
        return response.json()

# Example usage
if __name__ == "__main__":
    # Initialize client
    client = GeminiSupabaseClient()

    # Query properties
    properties = client.query("properties", limit=5)
    print(f"Found {len(properties)} properties")

    # Create a new property
    new_property = client.insert("properties", {
        "name": "Gemini Test Property",
        "type": "Single Family Home",
        "address": {
            "street1": "456 Gemini Ave",
            "city": "Orlando",
            "state": "FL",
            "zip": "32801"
        }
    }, use_admin=True)
    print(f"Created property: {new_property}")
```

## Available Tables

### Core Tables
- **properties**: Property information and details
- **claims**: Insurance claims data
- **damage_assessments**: Damage documentation
- **ai_analyses**: AI-generated insights

### Legacy Tables (from previous system)
- **forms**: Insurance form templates
- **forms_clauses**: Form sections and clauses
- **forms_embeddings**: AI embeddings for search
- **crawler_logs**: Web scraping activity
- **user_plans**: Subscription management
- **search_logs**: Search analytics

## Common Queries for Gemini

### 1. Get Florida Properties
```sql
SELECT * FROM properties
WHERE address->>'state' = 'FL'
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Find Properties by ZIP Code
```sql
SELECT * FROM properties
WHERE address->>'zip' = '33948';
```

### 3. Get Properties with Claims
```sql
SELECT
    p.*,
    COUNT(c.id) as claim_count
FROM properties p
LEFT JOIN claims c ON c.property_id = p.id
GROUP BY p.id
HAVING COUNT(c.id) > 0;
```

### 4. Search Properties by Insurance Carrier
```sql
SELECT * FROM properties
WHERE details->>'insurance_carrier' ILIKE '%Citizens%';
```

## Security Best Practices

1. **Environment Variables**
   - Never hardcode credentials
   - Use `.env` files locally
   - Set environment variables in production

2. **Key Usage**
   - Use `anon_key` for read operations
   - Use `service_key` only for write/admin operations
   - Never expose `service_key` in client-side code

3. **Row Level Security (RLS)**
   - Enable RLS on sensitive tables
   - Use JWT claims for user-specific access

## Troubleshooting

### Connection Issues
```bash
# Test connection
curl -I "${SUPABASE_URL}/rest/v1/" \
    -H "apikey: ${SUPABASE_ANON_KEY}"

# Check status
supabase status

# View logs
supabase db logs --tail 100
```

### Common Errors

1. **401 Unauthorized**
   - Check API key is correct
   - Ensure Authorization header is set

2. **403 Forbidden**
   - Check RLS policies
   - Use service role key for admin operations

3. **404 Not Found**
   - Verify table name
   - Check URL structure

## Integration Examples

### Gemini Script for Property Analysis
```bash
#!/bin/bash
# analyze-properties.sh

# Load environment
source .gemini.env

# Get all Florida properties
properties=$(curl -s -X GET \
    "${SUPABASE_URL}/rest/v1/properties?address->state=eq.FL" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

# Process with jq
echo "$properties" | jq -r '.[] | "\(.name) - \(.address.city), \(.address.state)"'

# Count by type
echo "$properties" | jq -r 'group_by(.type) | map({type: .[0].type, count: length})'
```

### Batch Operations
```python
# batch_operations.py
import asyncio
import aiohttp
from typing import List, Dict

async def batch_insert_properties(properties: List[Dict]):
    """Insert multiple properties efficiently"""
    async with aiohttp.ClientSession() as session:
        tasks = []
        for prop in properties:
            task = insert_property_async(session, prop)
            tasks.append(task)

        results = await asyncio.gather(*tasks)
        return results

async def insert_property_async(session, property_data):
    url = f"{SUPABASE_URL}/rest/v1/properties"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    async with session.post(url, headers=headers, json=property_data) as response:
        return await response.json()
```

## Support

- **Documentation**: https://supabase.com/docs
- **Project Dashboard**: https://app.supabase.com/project/tmlrvecuwgppbaynesji
- **API Reference**: https://tmlrvecuwgppbaynesji.supabase.co/rest/v1/

Remember to always handle errors gracefully and log operations for debugging!
