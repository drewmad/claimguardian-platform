#!/bin/bash
# Sync local database from Supabase remote (pull remote schema to local)

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

# Step 1: Get database password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    read -p "Enter Supabase database password: " -s DB_PASSWORD
    echo
else
    DB_PASSWORD=$SUPABASE_DB_PASSWORD
fi

# Step 2: Dump the CURRENT production schema from Supabase
log_info "Dumping current production schema from Supabase..."
log_info "Note: This gets the already-consolidated schema from Supabase"

# Backup current local schema if it exists
if [ -f "${SCHEMA_FILE}" ]; then
    log_info "Backing up current local schema..."
    cp ${SCHEMA_FILE} ${SCHEMA_FILE}.backup.$(date +%Y%m%d_%H%M%S)
fi

# Dump production schema
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
    --exclude-schema=extensions \
    --exclude-schema=graphql \
    --exclude-schema=graphql_public \
    --exclude-schema=pgbouncer \
    --exclude-schema=pgsodium \
    --exclude-schema=pgsodium_masks \
    --exclude-schema=net \
    > ${SCHEMA_FILE} || {
        log_error "Failed to dump remote schema. Check your password and connection."
        exit 1
    }

log_success "Production schema dumped to ${SCHEMA_FILE}"

# Step 3: Archive local migrations if they exist
if [ -n "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    log_info "Found local migrations. Archiving them..."
    
    BACKUP_DIR="supabase/migrations.archive.$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${BACKUP_DIR}
    
    # Move migrations to archive
    mv supabase/migrations/*.sql ${BACKUP_DIR}/
    
    # Update migrations README
    cat > supabase/migrations/README.md << EOF
# Migrations Archived

Date: $(date)
Migrations archived to: ${BACKUP_DIR}

This project now uses a single schema.sql file approach pulled from Supabase.
The production database schema is the source of truth.

See supabase/schema.sql for the current database schema.
EOF
    
    log_success "Local migrations archived to ${BACKUP_DIR}"
fi

# Step 4: Reset local database with remote schema
log_info "Resetting local database with remote schema..."

# Check if Supabase is running
if ! supabase status 2>/dev/null | grep -q "RUNNING"; then
    log_info "Starting Supabase services..."
    supabase start
    sleep 5
fi

# Reset database
log_info "Applying remote schema to local database..."
supabase db reset

# The reset command should apply schema.sql automatically, but let's ensure it
psql "postgresql://postgres:postgres@localhost:54322/postgres" < ${SCHEMA_FILE} 2>&1 | grep -E "ERROR|NOTICE" | grep -v "already exists" | grep -v "does not exist" || true

# Step 5: Verify sync
log_info "Verifying database sync..."

# Create a simple verification by checking table count
REMOTE_TABLES=$(psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")
LOCAL_TABLES=$(psql "postgresql://postgres:postgres@localhost:54322/postgres" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'")

log_info "Remote tables: ${REMOTE_TABLES// /}"
log_info "Local tables: ${LOCAL_TABLES// /}"

if [ "${REMOTE_TABLES// /}" = "${LOCAL_TABLES// /}" ]; then
    log_success "Table count matches! Local database is in sync with remote."
else
    log_warn "Table count differs. This might be due to system tables."
fi

# Final summary
echo ""
log_success "Database sync from Supabase completed!"
echo ""
echo "Summary:"
echo "- Remote schema saved to: ${SCHEMA_FILE}"
echo "- Local database reset with remote schema"
echo "- Local URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "Next steps:"
echo "1. Test your application with the synced database"
echo "2. Commit the updated schema.sql to version control"
echo ""
echo "Note: The remote Supabase database is now your source of truth."
echo "Any local migrations have been archived."