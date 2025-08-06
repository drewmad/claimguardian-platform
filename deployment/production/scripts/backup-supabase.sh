#!/bin/bash

# Supabase Database Backup Script
# ClaimGuardian AI-Powered Insurance Platform

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="claimguardian_backup_${TIMESTAMP}"

# Supabase connection details
SUPABASE_HOST=${SUPABASE_HOST:-"db.tmlrvecuwgppbaynesji.supabase.co"}
SUPABASE_PORT=${SUPABASE_PORT:-"5432"}
SUPABASE_USER=${SUPABASE_USER:-"postgres"}
SUPABASE_DB=${SUPABASE_DB:-"postgres"}

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a ${BACKUP_DIR}/backup.log
}

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

log "Starting Supabase backup: ${BACKUP_NAME}"

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

# Create full database backup
log "Creating full database backup..."
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
    --file="${BACKUP_DIR}/${BACKUP_NAME}.backup"

if [ $? -eq 0 ]; then
    log "Full database backup completed successfully"
else
    log "ERROR: Full database backup failed"
    exit 1
fi

# Create schema-only backup (for faster restores)
log "Creating schema-only backup..."
pg_dump \
    -h $SUPABASE_HOST \
    -p $SUPABASE_PORT \
    -U $SUPABASE_USER \
    -d $SUPABASE_DB \
    --verbose \
    --no-owner \
    --no-privileges \
    --schema-only \
    --format=plain \
    --file="${BACKUP_DIR}/${BACKUP_NAME}_schema.sql"

if [ $? -eq 0 ]; then
    log "Schema backup completed successfully"
else
    log "ERROR: Schema backup failed"
    exit 1
fi

# Create data-only backup (for data recovery)
log "Creating data-only backup..."
pg_dump \
    -h $SUPABASE_HOST \
    -p $SUPABASE_PORT \
    -U $SUPABASE_USER \
    -d $SUPABASE_DB \
    --verbose \
    --no-owner \
    --no-privileges \
    --data-only \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_DIR}/${BACKUP_NAME}_data.backup"

if [ $? -eq 0 ]; then
    log "Data backup completed successfully"
else
    log "ERROR: Data backup failed"
    exit 1
fi

# Create critical tables backup (smaller, faster recovery)
log "Creating critical tables backup..."
CRITICAL_TABLES=(
    "users"
    "user_profiles"
    "properties"
    "claims"
    "policies"
    "ai_usage_tracking"
    "ai_cost_budgets"
    "subscription_tiers"
    "user_subscriptions"
)

for table in "${CRITICAL_TABLES[@]}"; do
    log "Backing up table: $table"
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
        --table=$table \
        --file="${BACKUP_DIR}/${BACKUP_NAME}_${table}.backup"
done

# Compress backups
log "Compressing backups..."
cd $BACKUP_DIR
tar -czf "${BACKUP_NAME}_complete.tar.gz" \
    "${BACKUP_NAME}.backup" \
    "${BACKUP_NAME}_schema.sql" \
    "${BACKUP_NAME}_data.backup" \
    ${BACKUP_NAME}_*.backup

# Calculate backup sizes
FULL_SIZE=$(du -h "${BACKUP_NAME}.backup" | cut -f1)
COMPRESSED_SIZE=$(du -h "${BACKUP_NAME}_complete.tar.gz" | cut -f1)

log "Backup sizes - Full: ${FULL_SIZE}, Compressed: ${COMPRESSED_SIZE}"

# Upload to S3 (if configured)
if [ ! -z "$BACKUP_S3_BUCKET" ] && [ ! -z "$BACKUP_AWS_ACCESS_KEY_ID" ]; then
    log "Uploading backup to S3..."
    
    # Install AWS CLI if not present
    if ! command -v aws &> /dev/null; then
        apk add --no-cache aws-cli
    fi
    
    # Configure AWS CLI
    export AWS_ACCESS_KEY_ID=$BACKUP_AWS_ACCESS_KEY_ID
    export AWS_SECRET_ACCESS_KEY=$BACKUP_AWS_SECRET_ACCESS_KEY
    export AWS_DEFAULT_REGION=${BACKUP_S3_REGION:-"us-east-1"}
    
    # Upload compressed backup
    aws s3 cp "${BACKUP_NAME}_complete.tar.gz" \
        "s3://${BACKUP_S3_BUCKET}/claimguardian/database/$(date +%Y)/$(date +%m)/${BACKUP_NAME}_complete.tar.gz" \
        --storage-class STANDARD_IA
    
    if [ $? -eq 0 ]; then
        log "Backup uploaded to S3 successfully"
    else
        log "ERROR: S3 upload failed"
    fi
fi

# Clean up old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -name "claimguardian_backup_*" -type f -mtime +${RETENTION_DAYS} -delete

# Generate backup report
BACKUP_COUNT=$(ls -1 ${BACKUP_DIR}/claimguardian_backup_*.tar.gz 2>/dev/null | wc -l)
DISK_USAGE=$(du -sh ${BACKUP_DIR} | cut -f1)

cat > "${BACKUP_DIR}/backup_report_${TIMESTAMP}.txt" << EOF
ClaimGuardian Database Backup Report
Generated: $(date)

Backup Details:
- Name: ${BACKUP_NAME}
- Full Size: ${FULL_SIZE}
- Compressed Size: ${COMPRESSED_SIZE}
- Location: ${BACKUP_DIR}

Statistics:
- Total Backups: ${BACKUP_COUNT}
- Total Disk Usage: ${DISK_USAGE}
- Retention Period: ${RETENTION_DAYS} days

Tables Backed Up:
$(for table in "${CRITICAL_TABLES[@]}"; do echo "- $table"; done)

Status: SUCCESS
EOF

log "Backup completed successfully: ${BACKUP_NAME}"
log "Backup report generated: backup_report_${TIMESTAMP}.txt"

# Send notification (if configured)
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"✅ ClaimGuardian database backup completed successfully\n**Backup**: ${BACKUP_NAME}\n**Size**: ${COMPRESSED_SIZE}\n**Time**: $(date)\"}" \
        $SLACK_WEBHOOK_URL
fi

exit 0