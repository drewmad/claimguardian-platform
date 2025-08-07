#!/bin/bash

# Execute migration via Supabase Management API

set -e

echo "🚀 Executing property schema migration..."

# Check for required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "❌ Error: SUPABASE_ACCESS_TOKEN not set"
    exit 1
fi

PROJECT_ID="tmlrvecuwgppbaynesji"
MIGRATION_FILE="supabase/migrations/20250724_property_schema_migration.sql"

if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Error: Migration file not found: $MIGRATION_FILE"
    exit 1
fi

# Read migration content
MIGRATION_SQL=$(cat "$MIGRATION_FILE")

echo "📄 Migration file size: $(wc -c < "$MIGRATION_FILE") bytes"

# Execute via Management API
echo "🔄 Executing migration via Supabase Management API..."

curl -X POST \
  "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "query": $(echo "$MIGRATION_SQL" | jq -Rs .)
}
EOF

echo -e "\n✅ Migration request sent!"
echo "Check Supabase dashboard for results."
