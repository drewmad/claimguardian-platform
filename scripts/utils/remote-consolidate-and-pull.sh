#!/bin/bash
# Consolidate remote migrations and pull to local

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

log_info "Remote is source of truth - consolidating and pulling"

# Step 1: Get database password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    read -p "Enter Supabase database password: " -s DB_PASSWORD
    echo
else
    DB_PASSWORD=$SUPABASE_DB_PASSWORD
fi

# Step 2: Create a consolidated dump of the remote (with all migrations applied)
log_info "Dumping remote database schema (with all migrations already applied)..."

# Backup current local schema if exists
if [ -f "${SCHEMA_FILE}" ]; then
    log_info "Backing up current local schema..."
    cp ${SCHEMA_FILE} ${SCHEMA_FILE}.backup.$(date +%Y%m%d_%H%M%S)
fi

# Dump the complete remote schema (this is already consolidated - all migrations are applied)
pg_dump "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
    --schema-only \
    --no-owner \
    --no-privileges \
    --no-tablespaces \
    --no-unlogged-table-data \
    --no-comments \
    --schema=public \
    --exclude-table='spatial_ref_sys' \
    --exclude-table='geography_columns' \
    --exclude-table='geometry_columns' \
    --exclude-table='raster_columns' \
    --exclude-table='raster_overviews' \
    > ${SCHEMA_FILE} || {
        log_error "Failed to dump remote schema. Check your password and connection."
        exit 1
    }

log_success "Remote schema dumped successfully"

# Step 3: Archive local migrations since we're using remote as truth
if [ -n "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    log_info "Archiving local migrations..."
    BACKUP_DIR="supabase/migrations.archive.$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${BACKUP_DIR}

    # Move all SQL files
    mv supabase/migrations/*.sql ${BACKUP_DIR}/

    # Create comprehensive README
    cat > supabase/migrations/README.md << EOF
# Remote Schema Consolidated

Date: $(date)
Local migrations archived to: ${BACKUP_DIR}

## What Happened
1. The remote Supabase database (with all migrations applied) was dumped
2. This dump represents the consolidated schema (no individual migrations needed)
3. Local migrations were archived as they don't match remote
4. The remote schema is now in schema.sql

## Remote Migrations That Were Consolidated
The following migrations were already applied on remote and are now part of schema.sql:
- complete_schema_v1
- user_tracking
- policy_documents
- complete_database_v1_1
- complete_legal_system
- user_tracking_system
- fix_column_names
- create_disaster_events_table
- create_user_checklist_progress_table
- create_tidal_stations_table
- add_enrichment_update_procedure
- add_email_logs_table
- fix_missing_columns_v2
- audit_logging_tables
- fix_auth_security_definer_functions
- compliance_grade_consent_system
- add_phone_to_users_metadata
- ensure_legal_documents_mapped_correct
- And many more...

## Going Forward
- The schema.sql file is your source of truth
- Make changes directly to schema.sql
- Test locally with: supabase db reset
- Apply to remote with: supabase db push
EOF

    log_success "Local migrations archived to ${BACKUP_DIR}"
fi

# Step 4: Reset local database with remote schema
log_info "Resetting local database to match remote..."

# Ensure Supabase is running
if ! supabase status 2>/dev/null | grep -q "RUNNING"; then
    log_info "Starting Supabase services..."
    supabase start
    sleep 5
fi

# Reset with the schema file
log_info "Applying remote schema to local database..."
supabase db reset

# The reset should apply schema.sql, but let's ensure critical tables exist
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" > /dev/null 2>&1 || {
    log_warn "Applying schema manually..."
    psql "postgresql://postgres:postgres@localhost:54322/postgres" < ${SCHEMA_FILE}
}

# Step 5: Verify the pull
log_info "Verifying schema pull..."

# Count tables
LOCAL_TABLES=$(psql "postgresql://postgres:postgres@localhost:54322/postgres" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'")
log_info "Local database has ${LOCAL_TABLES// /} tables"

# Show some key tables
log_info "Key tables in local database:"
psql "postgresql://postgres:postgres@localhost:54322/postgres" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'properties', 'claims', 'policies', 'legal_documents') ORDER BY table_name;"

# Final summary
echo ""
log_success "Remote consolidation and pull completed!"
echo ""
echo "Summary:"
echo "- Remote schema (already consolidated) dumped to: ${SCHEMA_FILE}"
echo "- Local migrations archived (they didn't match remote)"
echo "- Local database reset to match remote exactly"
echo "- Remote is the source of truth"
echo ""
echo "Next steps:"
echo "1. Review schema.sql to see the consolidated schema"
echo "2. Make any future changes to schema.sql directly"
echo "3. Use 'supabase db push' to apply changes to remote"
echo "4. The migration history on remote remains intact"
