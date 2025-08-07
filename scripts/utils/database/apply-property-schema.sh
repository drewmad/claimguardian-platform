#!/bin/bash

# Apply property schema to Supabase database

set -e

echo "Applying comprehensive property data schema to Supabase..."

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_DB_URL" ]; then
    echo "Error: Required environment variables not set"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_DB_URL are set"
    exit 1
fi

# Apply the migration using psql
if command -v psql &> /dev/null; then
    echo "Using psql to apply migration..."
    psql "$SUPABASE_DB_URL" -f supabase/migrations/20250724_complete_property_schema.sql
else
    echo "psql not found. Trying with docker..."
    docker run --rm -i \
        -e PGPASSWORD="${SUPABASE_DB_PASSWORD}" \
        postgres:15 \
        psql "$SUPABASE_DB_URL" < supabase/migrations/20250724_complete_property_schema.sql
fi

echo "✅ Property schema applied successfully!"
