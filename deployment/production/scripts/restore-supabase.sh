#!/bin/bash

# Supabase Database Restore Script
# ClaimGuardian AI-Powered Insurance Platform

set -e

# Configuration
BACKUP_DIR="/backups"
RESTORE_MODE=${1:-"full"}  # full, schema, data, table
BACKUP_FILE=${2}
TABLE_NAME=${3}

# Supabase connection details
SUPABASE_HOST=${SUPABASE_HOST:-"db.tmlrvecuwgppbaynesji.supabase.co"}
SUPABASE_PORT=${SUPABASE_PORT:-"5432"}
SUPABASE_USER=${SUPABASE_USER:-"postgres"}
SUPABASE_DB=${SUPABASE_DB:-"postgres"}

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${BACKUP_DIR}/restore.log
}

# Usage function
usage() {
    echo "Usage: $0 <mode> <backup_file> [table_name]"
    echo ""
    echo "Modes:"
    echo "  full     - Restore complete database from .backup file"
    echo "  schema   - Restore only schema from .sql file"
    echo "  data     - Restore only data from _data.backup file"
    echo "  table    - Restore single table (requires table_name)"
    echo ""
    echo "Examples:"
    echo "  $0 full claimguardian_backup_20240106_120000.backup"
    echo "  $0 schema claimguardian_backup_20240106_120000_schema.sql"
    echo "  $0 table claimguardian_backup_20240106_120000_users.backup users"
    exit 1
}

# Validate parameters
if [ -z "$BACKUP_FILE" ]; then
    log "ERROR: Backup file not specified"
    usage
fi

if [ "$RESTORE_MODE" == "table" ] && [ -z "$TABLE_NAME" ]; then
    log "ERROR: Table name required for table restore mode"
    usage
fi

# Check if backup file exists
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
if [ ! -f "$BACKUP_PATH" ]; then
    log "ERROR: Backup file not found: $BACKUP_PATH"
    exit 1
fi

log "Starting database restore: $RESTORE_MODE mode"
log "Backup file: $BACKUP_FILE"

# Check if required environment variables are set
if [ -z "$PGPASSWORD" ]; then
    log "ERROR: PGPASSWORD environment variable not set"
    exit 1
fi

# Test database connection
log "Testing database connection..."
if ! pg_isready -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER; then
    log "ERROR: Cannot connect to database"
    exit 1
fi

# Confirmation prompt
read -p "⚠️  WARNING: This will modify the database. Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log "Restore cancelled by user"
    exit 0
fi

# Create pre-restore backup
PRE_RESTORE_BACKUP="pre_restore_$(date +%Y%m%d_%H%M%S)"
log "Creating pre-restore backup: $PRE_RESTORE_BACKUP"

pg_dump \
    -h $SUPABASE_HOST \
    -p $SUPABASE_PORT \
    -U $SUPABASE_USER \
    -d $SUPABASE_DB \
    --verbose \
    --no-owner \
    --no-privileges \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_DIR}/${PRE_RESTORE_BACKUP}.backup"

log "Pre-restore backup completed"

# Perform restore based on mode
case $RESTORE_MODE in
    "full")
        log "Performing full database restore..."

        # Drop existing connections (if needed)
        log "Terminating existing connections..."
        psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d postgres -c \
            "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$SUPABASE_DB' AND pid <> pg_backend_pid();"

        # Restore database
        pg_restore \
            -h $SUPABASE_HOST \
            -p $SUPABASE_PORT \
            -U $SUPABASE_USER \
            -d $SUPABASE_DB \
            --verbose \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --single-transaction \
            "$BACKUP_PATH"
        ;;

    "schema")
        log "Performing schema-only restore..."

        # Restore schema
        psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB \
            --single-transaction \
            --file="$BACKUP_PATH"
        ;;

    "data")
        log "Performing data-only restore..."

        # Restore data only
        pg_restore \
            -h $SUPABASE_HOST \
            -p $SUPABASE_PORT \
            -U $SUPABASE_USER \
            -d $SUPABASE_DB \
            --verbose \
            --data-only \
            --no-owner \
            --no-privileges \
            --single-transaction \
            "$BACKUP_PATH"
        ;;

    "table")
        log "Performing table restore: $TABLE_NAME"

        # Restore specific table
        pg_restore \
            -h $SUPABASE_HOST \
            -p $SUPABASE_PORT \
            -U $SUPABASE_USER \
            -d $SUPABASE_DB \
            --verbose \
            --clean \
            --if-exists \
            --no-owner \
            --no-privileges \
            --single-transaction \
            --table=$TABLE_NAME \
            "$BACKUP_PATH"
        ;;

    *)
        log "ERROR: Invalid restore mode: $RESTORE_MODE"
        usage
        ;;
esac

# Check restore result
if [ $? -eq 0 ]; then
    log "Database restore completed successfully"
else
    log "ERROR: Database restore failed"
    log "Pre-restore backup available: ${PRE_RESTORE_BACKUP}.backup"
    exit 1
fi

# Verify restore by checking table counts
log "Verifying restore - checking table counts..."
CRITICAL_TABLES=(
    "users"
    "user_profiles"
    "properties"
    "claims"
    "policies"
    "ai_usage_tracking"
)

for table in "${CRITICAL_TABLES[@]}"; do
    COUNT=$(psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB -t -c \
        "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
    log "Table $table: $COUNT rows"
done

# Update statistics
log "Updating database statistics..."
psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB -c "ANALYZE;"

# Generate restore report
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
cat > "${BACKUP_DIR}/restore_report_${TIMESTAMP}.txt" << EOF
ClaimGuardian Database Restore Report
Generated: $(date)

Restore Details:
- Mode: ${RESTORE_MODE}
- Source File: ${BACKUP_FILE}
- Target Database: ${SUPABASE_HOST}:${SUPABASE_PORT}/${SUPABASE_DB}
$(if [ "$RESTORE_MODE" == "table" ]; then echo "- Table: ${TABLE_NAME}"; fi)

Pre-restore Backup: ${PRE_RESTORE_BACKUP}.backup

Table Verification:
$(for table in "${CRITICAL_TABLES[@]}"; do
    count=$(psql -h $SUPABASE_HOST -p $SUPABASE_PORT -U $SUPABASE_USER -d $SUPABASE_DB -t -c \
        "SELECT COUNT(*) FROM $table;" 2>/dev/null | tr -d ' ' || echo "ERROR")
    echo "- $table: $count rows"
done)

Status: SUCCESS
EOF

log "Restore completed successfully"
log "Restore report generated: restore_report_${TIMESTAMP}.txt"

# Send notification (if configured)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ ClaimGuardian database restore completed successfully\n**Mode**: ${RESTORE_MODE}\n**File**: ${BACKUP_FILE}\n**Time**: $(date)\"}" \
        $SLACK_WEBHOOK_URL
fi

exit 0
