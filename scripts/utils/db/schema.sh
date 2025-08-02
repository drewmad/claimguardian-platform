#!/bin/bash
#
# Schema Management Script
# Handles schema dump, apply, diff, and validation for CI/CD
#

set -e
source "$(dirname "$0")/../common.sh"

# Schema file path
SCHEMA_FILE="supabase/schema.sql"

schema_dump() {
    log_info "Dumping current schema from database..."
    
    # Use supabase db dump to get the schema
    if command -v supabase &> /dev/null; then
        supabase db dump --file "$SCHEMA_FILE" --schema public,auth,storage
        log_success "Schema dumped to $SCHEMA_FILE"
    else
        log_error "Supabase CLI not found. Please install it first."
        exit 1
    fi
}

schema_apply() {
    log_info "Applying schema.sql to database..."
    
    if [ ! -f "$SCHEMA_FILE" ]; then
        log_error "Schema file not found: $SCHEMA_FILE"
        exit 1
    fi
    
    # Apply the schema
    if command -v supabase &> /dev/null; then
        supabase db push < "$SCHEMA_FILE"
        log_success "Schema applied successfully"
    else
        log_error "Supabase CLI not found. Please install it first."
        exit 1
    fi
}

schema_diff() {
    local base_file="$1"
    local new_file="$2"
    
    if [ -z "$base_file" ] || [ -z "$new_file" ]; then
        log_error "Usage: ./scripts/db.sh schema diff <base_file> <new_file>"
        exit 1
    fi
    
    if [ ! -f "$base_file" ]; then
        log_error "Base schema file not found: $base_file"
        exit 1
    fi
    
    if [ ! -f "$new_file" ]; then
        log_error "New schema file not found: $new_file"
        exit 1
    fi
    
    log_info "Comparing schemas..."
    diff -u "$base_file" "$new_file" || true
}

schema_validate() {
    local env="${1:-development}"
    log_info "Validating schema for environment: $env"
    
    # Create a temporary database for validation
    log_info "Creating temporary PostgreSQL instance..."
    
    # Use Docker for isolated validation
    docker run -d --name schema-validate-$$ \
        -e POSTGRES_PASSWORD=postgres \
        -p 54321:5432 \
        postgres:17-alpine
    
    # Wait for postgres to be ready
    sleep 5
    
    # Apply schema to test database
    PGPASSWORD=postgres psql -h localhost -p 54321 -U postgres -d postgres < "$SCHEMA_FILE" 2>&1 | tee validation.log
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        log_success "Schema validation passed"
        
        # Run additional checks
        log_info "Running best practice checks..."
        
        # Check for tables without RLS
        PGPASSWORD=postgres psql -h localhost -p 54321 -U postgres -d postgres << EOF
SELECT 'Tables without RLS:' as check_type, tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename NOT IN (
    SELECT DISTINCT tablename FROM pg_policies
)
AND tablename NOT LIKE '%_view';
EOF
        
    else
        log_error "Schema validation failed. Check validation.log for details"
        cat validation.log
        docker stop schema-validate-$$ && docker rm schema-validate-$$
        exit 1
    fi
    
    # Cleanup
    docker stop schema-validate-$$ && docker rm schema-validate-$$
    rm -f validation.log
}

# Main command router
case "$1" in
    dump)
        schema_dump
        ;;
    apply)
        schema_apply
        ;;
    diff)
        schema_diff "$2" "$3"
        ;;
    validate)
        schema_validate "$2"
        ;;
    *)
        log_error "Invalid schema command. Use: dump, apply, diff, or validate"
        exit 1
        ;;
esac