#!/bin/bash

##############################################################################
# PHASED FLORIDA PARCEL DATA DEPLOYMENT
# Optimized approach for large-scale geo-data with AI features
##############################################################################

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly LOG_DIR="$PROJECT_ROOT/deployment_logs"

# Colors
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

# Create log directory
mkdir -p "$LOG_DIR"

log() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_DIR/deployment.log"
}

warn() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_DIR/deployment.log"
}

error() {
    echo -e "${RED}[$(date '+%H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_DIR/deployment.log"
}

##############################################################################
# PHASE 1: FOUNDATION + SAMPLE DATA
##############################################################################
phase1_foundation() {
    log "🏗️  PHASE 1: Foundation + Sample Data"
    echo "======================================"
    
    # 1. Database schema setup
    log "Setting up database schema..."
    if command -v psql >/dev/null 2>&1; then
        psql "$DATABASE_URL" -f "$SCRIPT_DIR/enhanced-database-schema.sql" || {
            error "Database schema setup failed"
            return 1
        }
    else
        warn "psql not found - apply schema manually via Supabase dashboard"
    fi
    
    # 2. Sample counties (Charlotte County for testing)
    local sample_counties=("12015")  # Charlotte County - ideal size for testing
    
    for county in "${sample_counties[@]}"; do
        log "Processing sample county: $county"
        
        if [ -d "data/county_$county" ]; then
            node "$SCRIPT_DIR/geo-data-transformer.js" "$county" "data/county_$county" || {
                warn "County $county processing failed - continuing..."
                continue
            }
        else
            warn "Data directory for county $county not found - skipping"
        fi
    done
    
    # 3. Test AI features on sample
    log "Testing AI features on sample data..."
    node "$SCRIPT_DIR/ai-embeddings.js" generate --limit 5000 || {
        warn "Sample AI processing failed - check OpenAI API key"
    }
    
    # 4. Basic spatial analysis
    log "Running basic spatial analysis..."
    node "$SCRIPT_DIR/spatial-analyzer.js" functions
    node "$SCRIPT_DIR/spatial-analyzer.js" analyze --limit 5000
    
    log "✅ Phase 1 completed successfully"
    log "📊 Review sample data before proceeding to Phase 2"
}

##############################################################################
# PHASE 2: BULK DATA LOAD
##############################################################################
phase2_bulk_load() {
    log "📦 PHASE 2: Bulk Data Load (No AI)"
    echo "==================================="
    
    # Confirm continuation
    read -p "Continue with full Florida data load? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Phase 2 cancelled by user"
        return 0
    fi
    
    # 1. Full state load without AI processing
    log "Starting full Florida parcel data load..."
    
    export SKIP_EMBEDDINGS=true
    export SKIP_SPATIAL_ANALYSIS=true
    
    # Use existing optimized import
    if [ -f "$SCRIPT_DIR/run-parallel-import.sh" ]; then
        "$SCRIPT_DIR/run-parallel-import.sh" || {
            error "Bulk import failed"
            return 1
        }
    else
        # Fallback to new orchestrator
        node "$SCRIPT_DIR/enhanced-automation-pipeline.js" || {
            error "Bulk import failed"
            return 1
        }
    fi
    
    # 2. Data integrity verification
    log "Verifying data integrity..."
    if [ -f "$SCRIPT_DIR/verify-import-complete.js" ]; then
        node "$SCRIPT_DIR/verify-import-complete.js" || {
            warn "Data verification had issues - check logs"
        }
    fi
    
    # 3. Create essential spatial functions
    log "Creating spatial analysis functions..."
    node "$SCRIPT_DIR/spatial-analyzer.js" functions
    
    # 4. Generate summary statistics
    log "Generating import summary..."
    cat << EOF > "$LOG_DIR/phase2_summary.txt"
Phase 2 Bulk Load Summary
========================
Completed: $(date)
Total Records: $(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM properties;" 2>/dev/null || echo "Unknown")
Storage Used: $(psql "$DATABASE_URL" -t -c "SELECT pg_size_pretty(pg_total_relation_size('properties'));" 2>/dev/null || echo "Unknown")

Next Steps:
- Review data quality in Supabase dashboard
- Plan AI processing strategy for Phase 3
- Consider geographic priorities for embeddings
EOF
    
    log "✅ Phase 2 completed successfully"
    log "📋 Summary saved to: $LOG_DIR/phase2_summary.txt"
}

##############################################################################
# PHASE 3: AI OPTIMIZATION
##############################################################################
phase3_ai_optimization() {
    log "🤖 PHASE 3: AI Optimization"
    echo "==========================="
    
    # Cost estimation
    local total_properties
    total_properties=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM properties WHERE feature_vector IS NULL;" 2>/dev/null || echo "0")
    local estimated_cost
    estimated_cost=$(echo "scale=2; $total_properties * 0.00001" | bc 2>/dev/null || echo "50-200")
    
    log "📊 Properties needing embeddings: $total_properties"
    log "💰 Estimated OpenAI cost: \$${estimated_cost}"
    
    read -p "Proceed with AI optimization? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Phase 3 cancelled by user"
        return 0
    fi
    
    # 1. High-value properties first
    log "Processing high-value properties first..."
    node "$SCRIPT_DIR/ai-embeddings.js" generate \
        --filter "property_value > 500000" \
        --batch-size 100 || {
        warn "High-value property processing had issues"
    }
    
    # 2. Major metropolitan areas
    log "Processing major metropolitan areas..."
    local metro_counties=("12086" "12095" "12103" "12057" "12031")
    for county in "${metro_counties[@]}"; do
        log "Generating embeddings for county: $county"
        node "$SCRIPT_DIR/ai-embeddings.js" generate \
            --filter "county_fips = '$county'" \
            --batch-size 50 \
            --delay 1000 || {
            warn "County $county AI processing had issues"
        }
    done
    
    # 3. Spatial relationship analysis
    log "Computing spatial relationships..."
    node "$SCRIPT_DIR/spatial-analyzer.js" analyze || {
        warn "Spatial analysis had issues"
    }
    
    # 4. Create AI search indexes
    log "Creating AI similarity search indexes..."
    node "$SCRIPT_DIR/ai-embeddings.js" index
    
    # 5. Background processing for remaining properties
    log "Starting background processing for remaining properties..."
    nohup node "$SCRIPT_DIR/ai-embeddings.js" generate \
        --batch-size 25 \
        --delay 2000 \
        --continue true > "$LOG_DIR/background_ai.log" 2>&1 &
    
    local bg_pid=$!
    log "🔄 Background AI processing started (PID: $bg_pid)"
    log "📋 Monitor progress: tail -f $LOG_DIR/background_ai.log"
    
    log "✅ Phase 3 initiated successfully"
}

##############################################################################
# UTILITY FUNCTIONS
##############################################################################
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        error "Node.js not found"
        return 1
    fi
    
    # Check environment variables
    if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then
        error "Missing Supabase environment variables"
        return 1
    fi
    
    # Check OpenAI API key (for Phase 3)
    if [ -z "${OPENAI_API_KEY:-}" ]; then
        warn "OpenAI API key not set - Phase 3 will be limited"
    fi
    
    # Check data directory
    if [ ! -d "data" ]; then
        warn "Data directory not found - ensure you have parcel data downloaded"
    fi
    
    log "✅ Prerequisites checked"
}

show_status() {
    log "📊 Current Deployment Status"
    echo "============================"
    
    # Database stats
    if command -v psql >/dev/null 2>&1; then
        log "Database Status:"
        psql "$DATABASE_URL" -c "
            SELECT 
                'Properties' as table_name,
                COUNT(*) as record_count,
                COUNT(*) FILTER (WHERE feature_vector IS NOT NULL) as with_embeddings,
                pg_size_pretty(pg_total_relation_size('properties')) as size
            FROM properties
            UNION ALL
            SELECT 
                'Spatial Relationships' as table_name,
                COUNT(*) as record_count,
                NULL as with_embeddings,
                pg_size_pretty(pg_total_relation_size('spatial_relationships')) as size
            FROM spatial_relationships;
        " 2>/dev/null || warn "Could not fetch database status"
    fi
    
    # Recent logs
    if [ -f "$LOG_DIR/deployment.log" ]; then
        log "Recent Activity:"
        tail -5 "$LOG_DIR/deployment.log"
    fi
}

##############################################################################
# MAIN EXECUTION
##############################################################################
main() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                    FLORIDA PARCEL DATA DEPLOYMENT                ║"
    echo "║                      Phased Approach Strategy                    ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    case "${1:-}" in
        "1"|"phase1"|"foundation")
            check_prerequisites && phase1_foundation
            ;;
        "2"|"phase2"|"bulk")
            check_prerequisites && phase2_bulk_load
            ;;
        "3"|"phase3"|"ai")
            check_prerequisites && phase3_ai_optimization
            ;;
        "status")
            show_status
            ;;
        "all")
            check_prerequisites || exit 1
            phase1_foundation || exit 1
            phase2_bulk_load || exit 1
            phase3_ai_optimization || exit 1
            ;;
        *)
            echo "Usage: $0 {1|2|3|all|status}"
            echo ""
            echo "Phases:"
            echo "  1, phase1, foundation  - Setup + sample data (1-2 counties)"
            echo "  2, phase2, bulk        - Full Florida data load (no AI)"
            echo "  3, phase3, ai          - AI embeddings + optimization"
            echo "  all                    - Run all phases sequentially"
            echo "  status                 - Show current deployment status"
            echo ""
            echo "Examples:"
            echo "  $0 1              # Start with foundation phase"
            echo "  $0 phase2         # Run bulk data load"
            echo "  $0 status         # Check current status"
            exit 1
            ;;
    esac
}

# Execute main function
main "$@"