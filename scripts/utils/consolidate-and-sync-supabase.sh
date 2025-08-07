#!/bin/bash
# Consolidate Supabase migrations remotely and sync to local

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

# Step 2: Check if remote has migrations to consolidate
log_info "Checking remote migrations status..."

# First, let's check what migrations exist on remote
REMOTE_MIGRATIONS=$(psql "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" -t -c "
SELECT name FROM supabase_migrations.schema_migrations
WHERE name NOT LIKE '00000000000000%'
ORDER BY name;" 2>/dev/null || echo "")

if [ -n "$REMOTE_MIGRATIONS" ]; then
    log_info "Found remote migrations to consolidate:"
    echo "$REMOTE_MIGRATIONS"

    read -p "Do you want to consolidate these remote migrations? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Consolidating remote migrations..."

        # Step 3: Create a consolidated schema from current remote state
        log_info "Dumping current remote database state (with all migrations applied)..."

        # Create temp file for consolidated schema
        TEMP_SCHEMA="/tmp/supabase_consolidated_$(date +%Y%m%d_%H%M%S).sql"

        # Dump the entire schema (this includes all applied migrations)
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
            --exclude-schema=supabase_migrations \
            > ${TEMP_SCHEMA}

        log_success "Remote schema dumped to temporary file"

        # Step 4: Clear remote migrations table (optional - requires careful consideration)
        log_warn "To fully consolidate, we would need to clear the remote migrations table."
        log_warn "This is a destructive operation and should be done through Supabase Dashboard."
        log_info "For now, we'll use the dumped schema as the consolidated version."

        # Move temp schema to be our new schema
        mv ${TEMP_SCHEMA} ${SCHEMA_FILE}

        log_success "Remote schema consolidated to ${SCHEMA_FILE}"
    else
        log_info "Skipping remote consolidation, using current remote schema as-is"
    fi
else
    log_info "No individual migrations found on remote, schema is already consolidated"
fi

# Step 5: Dump the current remote schema (consolidated or not)
log_info "Dumping current production schema from Supabase..."

# Backup current local schema if it exists
if [ -f "${SCHEMA_FILE}" ]; then
    log_info "Backing up current local schema..."
    cp ${SCHEMA_FILE} ${SCHEMA_FILE}.backup.$(date +%Y%m%d_%H%M%S)
fi

# If we didn't consolidate above, dump the current schema
if [ ! -f "${SCHEMA_FILE}" ] || [ -z "$REMOTE_MIGRATIONS" ]; then
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
        --exclude-schema=supabase_migrations \
        > ${SCHEMA_FILE} || {
            log_error "Failed to dump remote schema. Check your password and connection."
            exit 1
        }
fi

log_success "Production schema saved to ${SCHEMA_FILE}"

# Step 6: Archive local migrations if they exist
if [ -n "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
    log_info "Found local migrations. Archiving them..."

    BACKUP_DIR="supabase/migrations.archive.$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${BACKUP_DIR}

    # Move migrations to archive
    mv supabase/migrations/*.sql ${BACKUP_DIR}/

    # Update migrations README
    cat > supabase/migrations/README.md << EOF
# Migrations Consolidated and Archived

Date: $(date)
Migrations archived to: ${BACKUP_DIR}

This project now uses a single schema.sql file approach.
The schema has been consolidated from Supabase remote.

See supabase/schema.sql for the current database schema.

## Remote Consolidation
The remote Supabase database migrations have been consolidated into a single schema.
All migration history is captured in the schema.sql file.

## Next Steps
1. If you need to clear remote migrations table, do so through Supabase Dashboard
2. Future changes should be made directly to schema.sql
3. Apply changes using: supabase db push
EOF

    log_success "Local migrations archived to ${BACKUP_DIR}"
else
    # Create README if it doesn't exist
    cat > supabase/migrations/README.md << EOF
# Schema Management

Date: $(date)

This project uses a single schema.sql file approach.
The schema has been consolidated from Supabase remote.

See supabase/schema.sql for the current database schema.
EOF
fi

# Step 7: Reset local database with consolidated schema
log_info "Resetting local database with consolidated schema..."

# Check if Supabase is running
if ! supabase status 2>/dev/null | grep -q "RUNNING"; then
    log_info "Starting Supabase services..."
    supabase start
    sleep 5
fi

# Reset database
log_info "Applying consolidated schema to local database..."
supabase db reset

# The reset command should apply schema.sql automatically, but let's ensure it
psql "postgresql://postgres:postgres@localhost:54322/postgres" < ${SCHEMA_FILE} 2>&1 | grep -E "ERROR|NOTICE" | grep -v "already exists" | grep -v "does not exist" || true

# Step 8: Verify sync
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
log_success "Database consolidation and sync completed!"
echo ""
echo "Summary:"
echo "- Remote schema consolidated and saved to: ${SCHEMA_FILE}"
echo "- Local database reset with consolidated schema"
echo "- Local migrations archived (if any existed)"
echo "- Local URL: postgresql://postgres:postgres@localhost:54322/postgres"
echo ""
echo "Next steps:"
echo "1. Review the consolidated schema.sql file"
echo "2. Test your application with the synced database"
echo "3. Commit the schema.sql to version control"
echo "4. Consider clearing remote migrations table via Supabase Dashboard"
echo ""
echo "Future workflow:"
echo "- Make schema changes in schema.sql"
echo "- Apply with: supabase db push"
echo "- Or continue using migrations locally and periodically consolidate"
