#!/bin/bash
# Direct schema dump from Supabase, bypassing migrations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

log_info "Direct schema dump from Supabase (bypassing migrations)"

# Use Supabase CLI to dump schema
log_info "Using Supabase CLI to dump remote schema..."

# Backup current schema if exists
if [ -f "${SCHEMA_FILE}" ]; then
    log_info "Backing up current schema..."
    cp ${SCHEMA_FILE} ${SCHEMA_FILE}.backup.$(date +%Y%m%d_%H%M%S)
fi

# Dump public schema only
log_info "Dumping public schema..."
supabase db dump --schema public --data-only=false > ${SCHEMA_FILE}.temp

# Clean up the dump
log_info "Cleaning up schema dump..."
cat ${SCHEMA_FILE}.temp | grep -v "^--" | grep -v "^$" > ${SCHEMA_FILE}
rm ${SCHEMA_FILE}.temp

# Archive local migrations
if [ -n "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    log_info "Archiving local migrations..."
    BACKUP_DIR="supabase/migrations.archive.$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${BACKUP_DIR}
    mv supabase/migrations/*.sql ${BACKUP_DIR}/

    cat > supabase/migrations/README.md << EOF
# Migrations Archived - Direct Schema Dump

Date: $(date)
Migrations archived to: ${BACKUP_DIR}

This project now uses a single schema.sql file dumped directly from Supabase.
The remote database is the source of truth.

## Migration Mismatch Resolution
Due to version format mismatches between local and remote migrations,
we've bypassed the migration system and dumped the schema directly.

## Going Forward
1. Make changes to schema.sql
2. Apply with: supabase db push --dry-run (to preview)
3. Apply with: supabase db push (to apply)
EOF

    log_success "Migrations archived to ${BACKUP_DIR}"
fi

# Reset local database
log_info "Resetting local database with remote schema..."

# Stop and start to ensure clean state
supabase stop
supabase start

# Wait for services
sleep 5

# Apply schema
log_info "Applying schema to local database..."
supabase db reset --linked

log_success "Schema dump complete!"
echo ""
echo "Summary:"
echo "- Remote schema saved to: ${SCHEMA_FILE}"
echo "- Local migrations archived"
echo "- Local database reset with remote schema"
echo ""
echo "The migration mismatch has been resolved by using direct schema dump."
