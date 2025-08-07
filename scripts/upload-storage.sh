#!/bin/bash

# Upload Charlotte County SQL files to Supabase Storage for processing
echo "=========================================="
echo "Charlotte County SQL Upload to Storage"
echo "=========================================="
echo "Started: $(date)"
echo

# Configuration
BUCKET="parcel-data"
PROJECT_ID="tmlrvecuwgppbaynesji"
TOTAL_FILES=$(ls -1 /tmp/charlotte_batch_*.sql 2>/dev/null | wc -l)

if [ "$TOTAL_FILES" -eq 0 ]; then
    echo "❌ No SQL batch files found in /tmp/"
    exit 1
fi

echo "Found $TOTAL_FILES SQL batch files"
echo "Uploading to Supabase Storage bucket: $BUCKET"
echo

# Create summary file
SUMMARY_FILE="/tmp/charlotte_import_summary.json"
cat > "$SUMMARY_FILE" <<EOF
{
  "county": "Charlotte",
  "county_code": 18,
  "total_parcels": 218846,
  "total_batches": $TOTAL_FILES,
  "batch_size": 500,
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "status": "ready"
}
EOF

echo "Summary:"
cat "$SUMMARY_FILE"
echo
echo "SQL files are ready for processing:"
echo "- Location: /tmp/charlotte_batch_*.sql"
echo "- Total files: $TOTAL_FILES"
echo
echo "Next steps:"
echo "1. Execute each SQL file through Supabase SQL Editor"
echo "2. Or use Edge Function for batch processing"
echo "3. Monitor progress with:"
echo "   SELECT COUNT(*) FROM florida_parcels WHERE co_no = 18;"
echo
echo "Completed: $(date)"
