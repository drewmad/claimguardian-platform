#!/bin/bash
# Database schema management script

source scripts/utils/common.sh

PROJECT_REF="tmlrvecuwgppbaynesji"
SCHEMA_FILE="supabase/schema.sql"

case "$1" in
  dump)
    log_info "Dumping production schema..."
    
    # Get connection string from Supabase dashboard
    read -p "Enter Supabase database password: " -s DB_PASSWORD
    echo
    
    pg_dump "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres" \
      --schema-only \
      --no-owner \
      --no-privileges \
      --no-tablespaces \
      --no-unlogged-table-data \
      --exclude-schema=supabase_functions \
      --exclude-schema=storage \
      --exclude-schema=vault \
      > ${SCHEMA_FILE}
    
    log_success "Schema dumped to ${SCHEMA_FILE}"
    ;;
    
  apply)
    log_info "Applying schema to local database..."
    
    # Reset local database
    supabase db reset
    
    # Apply schema
    psql "postgresql://postgres:postgres@localhost:54322/postgres" < ${SCHEMA_FILE}
    
    log_success "Schema applied to local database"
    ;;
    
  diff)
    log_info "Comparing local vs production schema..."
    
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
      > /tmp/local_schema.sql
    
    # Compare
    diff -u ${SCHEMA_FILE} /tmp/local_schema.sql || true
    
    rm /tmp/local_schema.sql
    ;;
    
  consolidate)
    log_info "Consolidating migrations into single schema file..."
    
    # Check if migrations exist
    if [ -z "$(ls -A supabase/migrations/*.sql 2>/dev/null)" ]; then
      log_warn "No migrations found to consolidate"
      exit 0
    fi
    
    # Create backup
    BACKUP_DIR="supabase/migrations.archive.$(date +%Y%m%d_%H%M%S)"
    mkdir -p ${BACKUP_DIR}
    
    # Reset local database
    supabase db reset
    
    # Apply all migrations in order
    for migration in supabase/migrations/*.sql; do
      log_info "Applying $(basename $migration)..."
      psql "postgresql://postgres:postgres@localhost:54322/postgres" < "$migration"
    done
    
    # Dump consolidated schema
    pg_dump "postgresql://postgres:postgres@localhost:54322/postgres" \
      --schema-only \
      --no-owner \
      --no-privileges \
      --no-tablespaces \
      --no-unlogged-table-data \
      --exclude-schema=supabase_functions \
      --exclude-schema=storage \
      --exclude-schema=vault \
      > ${SCHEMA_FILE}
    
    # Archive migrations
    mv supabase/migrations/*.sql ${BACKUP_DIR}/
    
    # Update README
    cat > supabase/migrations/README.md << EOF
# Migrations Consolidated

Date: $(date)
Migrations archived to: ${BACKUP_DIR}

This project now uses a single schema.sql file approach.
All migrations have been consolidated to avoid Supabase CLI conflicts.

See supabase/schema.sql for the current database schema.
EOF
    
    log_success "Migrations consolidated into ${SCHEMA_FILE}"
    log_info "Old migrations archived to ${BACKUP_DIR}"
    ;;
    
  *)
    echo "Usage: $0 {dump|apply|diff|consolidate}"
    echo ""
    echo "Commands:"
    echo "  dump        - Dump production schema to schema.sql"
    echo "  apply       - Apply schema.sql to local database"
    echo "  diff        - Compare local vs production schema"
    echo "  consolidate - Consolidate all migrations into schema.sql"
    ;;
esac