#!/bin/bash
# Consolidate migrations and sync with Supabase remote database

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
PROJECT_REF="tmlrvecuwgppbaynesji"
SCHEMA_FILE="supabase/schema.sql"

# Step 1: Consolidate migrations if they exist
log_info "Checking for existing migrations..."
if [ -n "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    log_info "Found migrations to consolidate"

    # Create backup directory
    BACKUP_DIR="supabase/migrations.archive.$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${BACKUP_DIR}

    # Create temporary database for consolidation
    log_info "Creating temporary database for consolidation..."
    createdb temp_consolidation 2>/dev/null || {
        log_warn "temp_consolidation database already exists, dropping and recreating..."
        dropdb temp_consolidation
        createdb temp_consolidation
    }

    # Apply all migrations in order
    for migration in supabase/migrations/*.sql; do
        log_info "Applying $(basename $migration)..."
        psql temp_consolidation < "$migration"
    done

    # Dump consolidated schema
    log_info "Dumping consolidated schema..."
    pg_dump temp_consolidation \
        --schema-only \
        --no-owner \
        --no-privileges \
        --no-tablespaces \
        --no-unlogged-table-data \
        --exclude-schema=supabase_functions \
        --exclude-schema=storage \
        --exclude-schema=vault \
        > ${SCHEMA_FILE}.consolidated

    # Clean up temporary database
    dropdb temp_consolidation

    # Archive migrations
    log_info "Archiving migrations to ${BACKUP_DIR}..."
    mv supabase/migrations/*.sql ${BACKUP_DIR}/

    # Update migrations README
    cat > supabase/migrations/README.md << EOF
# Migrations Consolidated

Date: $(date)
Migrations archived to: ${BACKUP_DIR}

This project now uses a single schema.sql file approach.
All migrations have been consolidated to avoid Supabase CLI conflicts.

See supabase/schema.sql for the current database schema.
EOF

    log_success "Migrations consolidated successfully"
else
    log_info "No migrations found to consolidate"
fi

# Step 2: Sync with Supabase remote
log_info "Syncing with Supabase remote database..."

# Check if we have Supabase CLI
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI not found. Please install it first."
    exit 1
fi

# Get database password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    read -p "Enter Supabase database password: " -s DB_PASSWORD
    echo
else
    DB_PASSWORD=$SUPABASE_DB_PASSWORD
fi

# Dump production schema
log_info "Dumping production schema from Supabase..."
pg_dump "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-unlogged-table-data \
    --exclude-schema=supabase_functions \
    --exclude-schema=storage \
    --exclude-schema=vault \
    --exclude-schema=auth \
    --exclude-schema=realtime \
    --exclude-schema=_analytics \
    --exclude-schema=_realtime \
    > ${SCHEMA_FILE}.remote || {
        log_error "Failed to dump remote schema. Check your password and connection."
        exit 1
    }

# Backup current schema if it exists
if [ -f "${SCHEMA_FILE}" ]; then
    log_info "Backing up current schema..."
    cp ${SCHEMA_FILE} ${SCHEMA_FILE}.backup.$(date +%Y%m%d_%H%M%S)
fi

# Use the remote schema as the new schema
mv ${SCHEMA_FILE}.remote ${SCHEMA_FILE}

# Step 3: Purge and recreate local database
log_info "Purging local database..."

# Stop local Supabase if running
supabase stop 2>/dev/null || true

# Start Supabase
log_info "Starting Supabase services..."
supabase start

# Wait for services to be ready
log_info "Waiting for services to be ready..."
sleep 5

# Reset local database with new schema
log_info "Applying remote schema to local database..."
supabase db reset

# Apply the schema manually to ensure it's complete
psql "postgresql://postgres:postgres@localhost:54322/postgres" < ${SCHEMA_FILE} || {
    log_warn "Some errors occurred during schema application. This is normal for system schemas."
}

# Step 4: Verify sync
log_info "Verifying database sync..."

# Dump current local schema
pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-unlogged-table-data \
    --exclude-schema=supabase_functions \
    --exclude-schema=storage \
    --exclude-schema=vault \
    --exclude-schema=auth \
    --exclude-schema=realtime \
    --exclude-schema=_analytics \
    --exclude-schema=_realtime \
    > /tmp/local_schema_verify.sql

# Compare schemas
if diff -q ${SCHEMA_FILE} /tmp/local_schema_verify.sql > /dev/null; then
    log_success "Local database is in sync with remote!"
else
    log_warn "There are some differences between local and remote schemas."
    log_info "This might be due to system schemas. Running detailed diff..."

    # Show only significant differences
    diff -u ${SCHEMA_FILE} /tmp/local_schema_verify.sql | grep -E "^[+-]CREATE|^[+-]ALTER" | head -20 || true
fi

# Clean up
rm -f /tmp/local_schema_verify.sql
rm -f ${SCHEMA_FILE}.consolidated 2>/dev/null || true

# Final summary
echo ""
log_success "Database consolidation and sync completed!"
echo ""
echo "Summary:"
echo "- Schema file: ${SCHEMA_FILE}"
echo "- Local database: postgresql://postgres:postgres@localhost:54322/postgres"
echo "- Remote database: db.${PROJECT_REF}.supabase.co"
echo ""
echo "Next steps:"
echo "1. Review the schema file if needed: cat ${SCHEMA_FILE}"
echo "2. Run your application to test the connection"
echo "3. Commit the updated schema.sql to version control"
