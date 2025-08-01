#!/bin/bash
# Consolidates, purges, and syncs the local database schema.
# This script is intended to be run manually at logical checkpoints.

# Source common utilities
if [ -f "$(dirname "$0")/utils/common.sh" ]; then
    source "$(dirname "$0")/utils/common.sh"
else
    echo "Error: common.sh not found in utils directory."
    exit 1
fi

check_project_root

log_info "Starting database sync process..."
log_info "This will dump the current schema, reset the local database, and apply the new schema."
read -p "Are you sure you want to continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    log_info "Sync process aborted by user."
    exit 1
fi

# 1. Consolidate Migrations into schema.sql
log_info "Dumping current schema to supabase/schema.sql..."
if ! ./scripts/db.sh schema dump; then
    log_error "Failed to dump schema. Aborting sync."
    exit 1
fi
log_success "Schema dumped successfully."

# 2. Reset the Local Database
log_info "Resetting local database..."
if ! supabase db reset; then
    log_error "Failed to reset local database. Aborting sync."
    exit 1
fi
log_success "Local database reset successfully."

# 3. Apply the Consolidated Schema
log_info "Applying consolidated schema to local database..."
if ! ./scripts/db.sh schema apply; then
    log_error "Failed to apply schema. Please check supabase/schema.sql."
    exit 1
fi
log_success "Schema applied successfully."

log_info "Database sync process completed."
echo "Your local database is now in sync with the latest schema.sql."
