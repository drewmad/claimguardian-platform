#!/bin/bash

# Supabase API Examples for ClaimGuardian
# Set your environment variables first

SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTA3NTAzOSwiZXhwIjoyMDY0NjUxMDM5fQ.aIfLJZFqLLucsgSZaGo0P-NwJULB2Zc_z_3jz3a4i3E"

echo "🔥 ClaimGuardian Supabase API Examples"
echo "====================================="

# 1. READ DATA - Get all forms
echo ""
echo "📖 1. Reading Forms Data:"
curl -X GET "${SUPABASE_URL}/rest/v1/forms?select=*&limit=10" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json"

# 2. CREATE DATA - Insert a test form
echo ""
echo "📝 2. Creating Test Form:"
curl -X POST "${SUPABASE_URL}/rest/v1/forms" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "filing_id": "TEST001",
    "form_number": "HO-3",
    "title": "Homeowners Policy Form",
    "company": "ClaimGuardian Insurance"
  }'

# 3. READ WITH FILTERS - Get specific forms
echo ""
echo "🔍 3. Reading with Filters:"
curl -X GET "${SUPABASE_URL}/rest/v1/forms?company=eq.ClaimGuardian Insurance" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}"

# 4. UPDATE DATA - Modify a form
echo ""
echo "✏️ 4. Updating Form (replace FORM_ID):"
echo "curl -X PATCH \"${SUPABASE_URL}/rest/v1/forms?filing_id=eq.TEST001\" \\"
echo "  -H \"apikey: ${SERVICE_KEY}\" \\"
echo "  -H \"Authorization: Bearer ${SERVICE_KEY}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"title\": \"Updated Homeowners Policy Form\"}'"

# 5. SEARCH FUNCTION - Use RPC
echo ""
echo "🔎 5. Search Forms (RPC Function):"
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/search_forms" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"query_text": "homeowners", "limit_results": 5}'

# 6. DELETE DATA - Remove test data
echo ""
echo "🗑️ 6. Deleting Test Form:"
curl -X DELETE "${SUPABASE_URL}/rest/v1/forms?filing_id=eq.TEST001" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}"

echo ""
echo "✅ Done! Check the responses above."