#!/bin/bash
# Validates that the running local Supabase database schema matches the official schema.sql.
# This script is intended to be run as part of a pre-commit hook.

# Source common utilities
if [ -f "$(dirname "$0")/common.sh" ]; then
    source "$(dirname "$0")/common.sh"
else
    echo "Error: common.sh not found."
    exit 1
fi

check_project_root

SCHEMA_FILE="supabase/schema.sql"
TEMP_SCHEMA_FILE=$(mktemp)

# Ensure the temp file is cleaned up on exit
trap 'rm -f "$TEMP_SCHEMA_FILE"' EXIT

log_info "Validating local database schema against ${SCHEMA_FILE}..."

# 1. Dump the schema of the running local database
log_info "Dumping local database schema to a temporary file..."
if ! supabase db dump --schema-only > "$TEMP_SCHEMA_FILE"; then
    log_error "Failed to dump local database schema. Is Supabase running locally?"
    exit 1
fi

# 2. Compare the temporary schema with the official schema.sql
log_info "Comparing schemas..."
if diff -q "$SCHEMA_FILE" "$TEMP_SCHEMA_FILE" >/dev/null; then
    log_success "Schema is in sync. Validation passed."
    exit 0
else
    log_error "Schema drift detected!"
    echo "Your local database schema is out of sync with ${SCHEMA_FILE}."
    echo "This usually means you have made local database changes that have not been consolidated."
    echo ""
    echo "To fix this, run the following script to update your schema.sql file:"
    echo "  ./scripts/db-sync.sh"
    echo ""
    exit 1
fi
