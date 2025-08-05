#!/bin/bash

# Batch loader for Charlotte County parcels
set -euo pipefail

echo "🔐 Charlotte County Batch Parcel Loader"
echo "======================================"
echo ""

# Configuration
SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtbHJ2ZWN1d2dwcGJheW5lc2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzUwMzksImV4cCI6MjA2NDY1MTAzOX0.P69j3GyOQ9NeGXeLul_ZyhWOvuyepL9FskjYAK-CDMU"
EDGE_FUNCTION="load-charlotte-simple"

# Parameters
MAX_RECORDS="${1:-1000}"
BATCH_SIZE="${2:-100}"
SLEEP_BETWEEN_BATCHES="${3:-2}"

echo "Configuration:"
echo "  Max records to load: $MAX_RECORDS"
echo "  Batch size: $BATCH_SIZE"
echo "  Sleep between batches: ${SLEEP_BETWEEN_BATCHES}s"
echo ""

# Initialize counters
OFFSET=0
TOTAL_PROCESSED=0
TOTAL_ERRORS=0
BATCH_COUNT=0

echo "Starting batch load process..."
echo ""

while [ $TOTAL_PROCESSED -lt $MAX_RECORDS ]; do
    BATCH_COUNT=$((BATCH_COUNT + 1))
    echo "📦 Batch $BATCH_COUNT (offset: $OFFSET, limit: $BATCH_SIZE)"
    
    # Call Edge Function
    RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/${EDGE_FUNCTION}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"offset\": $OFFSET, \"limit\": $BATCH_SIZE}")
    
    # Parse response
    SUCCESS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "False")
    PROCESSED=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('processed', 0))" 2>/dev/null || echo "0")
    ERRORS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('errors', 0))" 2>/dev/null || echo "0")
    HAS_MORE=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('hasMore', False))" 2>/dev/null || echo "False")
    
    if [ "$SUCCESS" = "True" ]; then
        echo "  ✅ Processed: $PROCESSED, Errors: $ERRORS"
        TOTAL_PROCESSED=$((TOTAL_PROCESSED + PROCESSED))
        TOTAL_ERRORS=$((TOTAL_ERRORS + ERRORS))
        
        if [ "$HAS_MORE" = "False" ] || [ "$PROCESSED" -eq 0 ]; then
            echo ""
            echo "📍 No more records to process"
            break
        fi
        
        OFFSET=$((OFFSET + BATCH_SIZE))
    else
        echo "  ❌ Batch failed!"
        echo "  Response: $RESPONSE"
        break
    fi
    
    # Rate limiting
    if [ "$HAS_MORE" = "True" ] && [ $TOTAL_PROCESSED -lt $MAX_RECORDS ]; then
        echo "  💤 Sleeping ${SLEEP_BETWEEN_BATCHES}s..."
        sleep $SLEEP_BETWEEN_BATCHES
    fi
    
    echo ""
done

echo "========================================="
echo "📊 Final Results:"
echo "  Total batches: $BATCH_COUNT"
echo "  Total processed: $TOTAL_PROCESSED"
echo "  Total errors: $TOTAL_ERRORS"
echo "  Success rate: $(( TOTAL_PROCESSED * 100 / (TOTAL_PROCESSED + TOTAL_ERRORS) ))%"
echo ""

# Verify in database
echo "🔍 Verifying in database..."
QUERY="SELECT COUNT(*) as count FROM parcels WHERE county_name = 'CHARLOTTE'"
DB_COUNT=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rpc/execute_sql" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    -d "{\"query\": \"$QUERY\"}" 2>/dev/null || echo "Unable to verify")

echo "  Charlotte County parcels in database: Check via SQL Editor"
echo ""
echo "✨ Done!"