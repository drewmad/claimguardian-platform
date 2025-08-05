#!/bin/bash

# ================================================================
# ClaimGuardian Schema Migration Application Script
# ================================================================
# This script applies the three-phase migration to transform the
# ClaimGuardian database into a digital twin platform.

set -e  # Exit on any error

# Configuration
PROJECT_ID="tmlrvecuwgppbaynesji"
MIGRATION_DIR="supabase/migrations"
LOG_FILE="migration_$(date +%Y%m%d_%H%M%S).log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to check if Supabase CLI is available
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        error "Supabase CLI not found. Please install it first."
        echo "Install with: npm install -g supabase"
        exit 1
    fi
    
    log "Supabase CLI found: $(supabase --version)"
}

# Function to verify database connection
verify_connection() {
    log "Verifying database connection..."
    
    if supabase db ping --project-ref "$PROJECT_ID" > /dev/null 2>&1; then
        success "Database connection verified"
    else
        error "Cannot connect to database. Please check your connection and project ID."
        exit 1
    fi
}

# Function to create backup
create_backup() {
    log "Creating database backup before migration..."
    
    BACKUP_FILE="backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql"
    
    if supabase db dump --project-ref "$PROJECT_ID" --file "$BACKUP_FILE"; then
        success "Backup created: $BACKUP_FILE"
    else
        error "Failed to create backup. Aborting migration."
        exit 1
    fi
}

# Function to apply a migration file
apply_migration() {
    local migration_file="$1"
    local phase_name="$2"
    
    log "Applying $phase_name migration: $migration_file"
    
    if [ ! -f "$migration_file" ]; then
        error "Migration file not found: $migration_file"
        return 1
    fi
    
    # Apply the migration using psql through Supabase
    if supabase db reset --project-ref "$PROJECT_ID" --file "$migration_file"; then
        success "$phase_name migration applied successfully"
        return 0
    else
        error "$phase_name migration failed"
        return 1
    fi
}

# Function to run verification
run_verification() {
    local phase="$1"
    
    log "Running Phase $phase verification..."
    
    case $phase in
        1)
            supabase db exec --project-ref "$PROJECT_ID" --query "SELECT * FROM core.verify_phase1_migration();"
            ;;
        2)
            supabase db exec --project-ref "$PROJECT_ID" --query "SELECT * FROM core.verify_phase2_migration();"
            ;;
        3)
            supabase db exec --project-ref "$PROJECT_ID" --query "SELECT * FROM core.verify_phase3_migration();"
            ;;
    esac
}

# Function to run ETL for Florida parcels
run_parcel_etl() {
    log "Starting Florida parcels ETL process..."
    
    # This will process the 9.5M records in batches
    supabase db exec --project-ref "$PROJECT_ID" --query "SELECT * FROM reference.etl_florida_parcels_to_reference();"
    
    if [ $? -eq 0 ]; then
        success "Florida parcels ETL completed"
    else
        warning "Florida parcels ETL encountered issues - check logs"
    fi
}

# Function to update application references
update_app_references() {
    log "Updating application foreign key references..."
    
    supabase db exec --project-ref "$PROJECT_ID" --query "SELECT core.update_property_references();"
    
    if [ $? -eq 0 ]; then
        success "Application references updated"
    else
        error "Failed to update application references"
        return 1
    fi
}

# Function to initialize default structures
initialize_default_data() {
    log "Initializing default structures for existing properties..."
    
    supabase db exec --project-ref "$PROJECT_ID" --query "SELECT core.create_default_structures();"
    
    log "Refreshing materialized views..."
    supabase db exec --project-ref "$PROJECT_ID" --query "SELECT core.refresh_current_properties();"
    
    success "Default data initialization completed"
}

# Main migration process
main() {
    log "Starting ClaimGuardian Schema Migration"
    log "========================================="
    
    # Pre-flight checks
    check_supabase_cli
    verify_connection
    
    # Create backup
    create_backup
    
    echo
    log "PHASE 1: Schema Unification & Cleanup"
    log "======================================"
    
    if apply_migration "$MIGRATION_DIR/20250805_phase1_schema_unification.sql" "Phase 1"; then
        run_verification 1
        update_app_references
        
        # Run ETL for Florida parcels (this may take a while)
        warning "Florida parcels ETL will process 9.5M records - this may take 30-60 minutes"
        read -p "Continue with ETL? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_parcel_etl
        else
            warning "Skipping Florida parcels ETL - you can run it later with: SELECT * FROM reference.etl_florida_parcels_to_reference();"
        fi
    else
        error "Phase 1 migration failed. Aborting."
        exit 1
    fi
    
    echo
    log "PHASE 2: Temporal Data Enablement"
    log "================================="
    
    if apply_migration "$MIGRATION_DIR/20250805_phase2_temporal_enablement.sql" "Phase 2"; then
        run_verification 2
    else
        error "Phase 2 migration failed. Database is in partial state."
        exit 1
    fi
    
    echo
    log "PHASE 3: Digital Twin Schema Extension"
    log "====================================="
    
    if apply_migration "$MIGRATION_DIR/20250805_phase3_digital_twin_schema.sql" "Phase 3"; then
        run_verification 3
        initialize_default_data
    else
        error "Phase 3 migration failed. Database is in partial state."
        exit 1
    fi
    
    echo
    success "========================================="
    success "MIGRATION COMPLETED SUCCESSFULLY!"
    success "========================================="
    
    log "Migration summary:"
    log "- Created unified core.properties table"
    log "- Added temporal tracking (SCD Type 2)"
    log "- Implemented digital twin schema (structures, spaces, scans, models)"
    log "- Updated all foreign key references"
    log "- Applied row-level security policies"
    log "- Created helper functions and views"
    
    echo
    log "Next steps:"
    log "1. Update application code to use core.properties instead of public.properties"
    log "2. Test the temporal update functions"
    log "3. Begin AR scanning integration"
    log "4. Monitor the Florida parcels ETL if still running"
    
    echo
    log "Migration log saved to: $LOG_FILE"
}

# Handle script arguments
case "${1:-}" in
    --dry-run)
        log "DRY RUN MODE - No changes will be made"
        log "Migration files found:"
        ls -la "$MIGRATION_DIR"/20250805_*.sql 2>/dev/null || echo "No migration files found"
        exit 0
        ;;
    --help|-h)
        echo "ClaimGuardian Schema Migration Script"
        echo
        echo "Usage: $0 [options]"
        echo
        echo "Options:"
        echo "  --dry-run    Show what would be done without making changes"
        echo "  --help, -h   Show this help message"
        echo
        echo "This script will:"
        echo "1. Create a database backup"
        echo "2. Apply Phase 1: Schema unification"
        echo "3. Apply Phase 2: Temporal enablement"
        echo "4. Apply Phase 3: Digital twin schema"
        echo "5. Run verification tests"
        echo "6. Initialize default data"
        exit 0
        ;;
    *)
        main
        ;;
esac