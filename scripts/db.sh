#!/bin/bash
# Database utilities
source scripts/utils/common.sh

check_project_root

case "$1" in
  schema) 
    log_info "Managing database schema..."
    if [ -f "./scripts/utils/db-schema.sh" ]; then
        ./scripts/utils/db-schema.sh "$2"
    else
        log_error "Database schema script not found in utils"
    fi
    ;;
  backup) 
    log_info "Creating database backup..."
    if [ -f "./scripts/utils/db-backup.sh" ]; then
        ./scripts/utils/db-backup.sh
    else
        log_error "Database backup script not found in utils"
    fi
    ;;
  migrate) 
    log_info "Applying migration..."
    if [ -f "./scripts/utils/apply-migration.sh" ]; then
        ./scripts/utils/apply-migration.sh "$2"
    else
        log_error "Migration script not found in utils"
    fi
    ;;
  *) 
    echo "Usage: ./scripts/db.sh {schema|backup|migrate}" 
    ;;
esac