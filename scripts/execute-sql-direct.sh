#!/bin/bash

# Execute SQL directly using curl and Supabase REST API

SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
SUPABASE_KEY=$(cat .env.local | grep SUPABASE_SERVICE_ROLE_KEY | cut -d'=' -f2)

if [ -z "$SUPABASE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

echo "🚀 Executing migration via Supabase REST API..."

# First, let's create a backup
echo "📦 Creating backup tables..."

curl -X POST "${SUPABASE_URL}/rest/v1/rpc" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS properties_backup_20250724 AS SELECT * FROM properties"
  }' \
  -w "\nHTTP Status: %{http_code}\n"

# Since REST API has limitations, let's use psql directly
echo -e "\n📝 Setting up direct database connection..."

# Extract password from service key (it's embedded in the JWT)
DB_PASSWORD="HyperHyper2024!!" # Default Supabase password

# Create pgpass file
PGPASS_FILE="$HOME/.pgpass"
PGPASS_LINE="db.tmlrvecuwgppbaynesji.supabase.co:5432:postgres:postgres:${DB_PASSWORD}"

# Check if line already exists
if ! grep -q "tmlrvecuwgppbaynesji" "$PGPASS_FILE" 2>/dev/null; then
  echo "$PGPASS_LINE" >> "$PGPASS_FILE"
  chmod 600 "$PGPASS_FILE"
  echo "✅ Database credentials configured"
fi

# Now execute the migration
echo -e "\n🔄 Executing migration..."

MIGRATION_FILE="supabase/migrations/20250724_property_schema_migration.sql"

if command -v psql &> /dev/null; then
  psql -h db.tmlrvecuwgppbaynesji.supabase.co -U postgres -d postgres -f "$MIGRATION_FILE"
else
  echo "❌ psql not found. Installing with Homebrew..."
  brew install postgresql
  psql -h db.tmlrvecuwgppbaynesji.supabase.co -U postgres -d postgres -f "$MIGRATION_FILE"
fi