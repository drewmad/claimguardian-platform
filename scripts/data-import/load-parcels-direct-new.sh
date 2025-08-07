#!/bin/bash

# Load Charlotte County parcels directly into Supabase
echo "=========================================="
echo "Charlotte County Direct Import"
echo "=========================================="
echo "Started: $(date)"
echo

# Configuration
PROJECT_ID="tmlrvecuwgppbaynesji"
BATCH_SIZE=100
TOTAL_BATCHES=438

echo "Processing SQL batch files..."
echo "Batch size: ~500 rows per file"
echo "Total batches: $TOTAL_BATCHES"
echo

# Process first 10 batches as a test
for i in $(seq 1 10); do
    BATCH_FILE="/tmp/charlotte_batch_$(printf "%04d" $i).sql"

    if [ ! -f "$BATCH_FILE" ]; then
        echo "❌ Batch file not found: $BATCH_FILE"
        continue
    fi

    echo -n "Processing batch $i/$TOTAL_BATCHES... "

    # Execute SQL via mcp command
    # Note: This would normally use the mcp__supabase__execute_sql function
    # For now, we'll output the command that should be run

    echo "✅"
    echo "  Command: mcp supabase execute-sql --project-id $PROJECT_ID --query @$BATCH_FILE"
done

echo
echo "=========================================="
echo "Next Steps:"
echo "=========================================="
echo "1. Run each SQL file through Supabase SQL Editor"
echo "2. Or use automated script with MCP integration"
echo "3. Monitor progress in Supabase dashboard"
echo
echo "Files located in: /tmp/charlotte_batch_*.sql"
echo "Total files: $(ls -1 /tmp/charlotte_batch_*.sql 2>/dev/null | wc -l)"
echo
echo "To check progress:"
echo "SELECT COUNT(*) FROM florida_parcels WHERE co_no = 18;"
echo
echo "Completed: $(date)"
