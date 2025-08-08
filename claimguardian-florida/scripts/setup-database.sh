#!/bin/bash

set -e

echo "🗄️  Setting up ClaimGuardian Florida Database"
echo "=============================================="

# Check if POSTGRES_URL is set
if [ -z "$POSTGRES_URL" ]; then
  echo "❌ POSTGRES_URL environment variable is not set"
  echo "Please set it in your .env file or environment"
  exit 1
fi

# Test database connection
echo "📡 Testing database connection..."
psql "$POSTGRES_URL" -c "SELECT version();" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Database connection successful"
else
  echo "❌ Cannot connect to database"
  echo "Please check your POSTGRES_URL and ensure the database is running"
  exit 1
fi

# Apply SQL files in order
SQL_DIR="$(dirname "$0")/../db/sql"
echo "📂 SQL files directory: $SQL_DIR"

SQL_FILES=(
  "000_init_extensions.sql"
  "010_security_rls.sql"
  "020_core_entities.sql"
  "030_to_080_complete.sql"
)

for sql_file in "${SQL_FILES[@]}"; do
  sql_path="$SQL_DIR/$sql_file"
  if [ -f "$sql_path" ]; then
    echo "🔧 Applying $sql_file..."
    psql "$POSTGRES_URL" -f "$sql_path"
    if [ $? -eq 0 ]; then
      echo "✅ $sql_file applied successfully"
    else
      echo "❌ Failed to apply $sql_file"
      exit 1
    fi
  else
    echo "⚠️  SQL file not found: $sql_path"
  fi
done

# Verify extensions
echo "🔍 Verifying PostGIS installation..."
POSTGIS_VERSION=$(psql "$POSTGRES_URL" -t -c "SELECT PostGIS_Version();")
if [ $? -eq 0 ]; then
  echo "✅ PostGIS is installed: $POSTGIS_VERSION"
else
  echo "❌ PostGIS verification failed"
  exit 1
fi

# Verify schemas
echo "🔍 Verifying schema creation..."
SCHEMAS=$(psql "$POSTGRES_URL" -t -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'cg%' ORDER BY schema_name;")
echo "📋 Created schemas: $SCHEMAS"

# Verify key tables
echo "🔍 Verifying core tables..."
CORE_TABLES=$(psql "$POSTGRES_URL" -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'cg' ORDER BY table_name;")
echo "📋 Created tables: $CORE_TABLES"

# Check RLS status
echo "🔐 Verifying Row Level Security..."
RLS_STATUS=$(psql "$POSTGRES_URL" -t -c "SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'cg' AND rowsecurity = true;")
if [ -n "$RLS_STATUS" ]; then
  echo "✅ RLS enabled on tables: $RLS_STATUS"
else
  echo "⚠️  No RLS policies found - this may be expected for initial setup"
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Run 'pnpm dev' to start the API and orchestrator services"
echo "2. Use the quick-setup.sh script to create remaining directories"
echo "3. Check the README.md for smoke tests and validation"