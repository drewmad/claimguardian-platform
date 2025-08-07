#!/bin/bash

# Geospatial Data Sync Workflow for ClaimGuardian
# This script orchestrates the complete data sync process

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="/var/log/claimguardian"
LOG_FILE="$LOG_DIR/geospatial-sync-$(date +%Y%m%d).log"
LOCK_FILE="/tmp/claimguardian-geospatial-sync.lock"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Error handling
error_exit() {
    log "ERROR: $1"
    rm -f "$LOCK_FILE"
    exit 1
}

# Check for lock file to prevent concurrent runs
if [ -f "$LOCK_FILE" ]; then
    log "Another sync process is already running. Exiting."
    exit 0
fi

# Create lock file
touch "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

log "========================================="
log "Starting Geospatial Data Sync Workflow"
log "========================================="

# Load environment variables
if [ -f "$SCRIPT_DIR/../.env.local" ]; then
    export $(cat "$SCRIPT_DIR/../.env.local" | grep -v '^#' | xargs)
else
    error_exit "Environment file not found"
fi

# Function to check service health
check_service_health() {
    local service=$1
    case $service in
        "database")
            if psql "$DATABASE_URL" -c "SELECT 1" > /dev/null 2>&1; then
                log "✅ Database connection healthy"
                return 0
            else
                log "❌ Database connection failed"
                return 1
            fi
            ;;
        "python")
            if python3 --version > /dev/null 2>&1; then
                log "✅ Python environment healthy"
                return 0
            else
                log "❌ Python not available"
                return 1
            fi
            ;;
    esac
}

# Pre-flight checks
log "Running pre-flight checks..."
check_service_health "database" || error_exit "Database is not accessible"
check_service_health "python" || error_exit "Python environment is not ready"

# Step 1: Data Acquisition
run_data_acquisition() {
    local source=$1
    log "Running data acquisition for: $source"

    cd "$SCRIPT_DIR"
    if python3 florida-geospatial-data-acquisition.py "$source" >> "$LOG_FILE" 2>&1; then
        log "✅ Data acquisition completed for $source"
        return 0
    else
        log "❌ Data acquisition failed for $source"
        return 1
    fi
}

# Step 2: ETL Pipeline
run_etl_pipeline() {
    local operation=$1
    log "Running ETL pipeline: $operation"

    cd "$SCRIPT_DIR"
    if python3 geospatial-etl-pipeline.py "$operation" >> "$LOG_FILE" 2>&1; then
        log "✅ ETL pipeline completed: $operation"
        return 0
    else
        log "❌ ETL pipeline failed: $operation"
        return 1
    fi
}

# Step 3: Send notifications
send_notification() {
    local status=$1
    local message=$2

    # In production, integrate with notification service
    log "NOTIFICATION [$status]: $message"

    # Log to database
    psql "$DATABASE_URL" -c "
        INSERT INTO public.system_logs (level, message, context, created_at)
        VALUES ('$status', 'Geospatial Sync: $message',
                '{\"workflow\": \"geospatial-sync\", \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}',
                CURRENT_TIMESTAMP)
    " > /dev/null 2>&1 || true
}

# Main workflow based on schedule
case "${1:-daily}" in
    "realtime")
        # Real-time sync for active events (every 15 minutes)
        log "Starting real-time sync..."

        # Update active wildfire data
        run_data_acquisition "active_wildfires" || send_notification "error" "Failed to update wildfire data"

        # Check for property impacts
        run_etl_pipeline "events" || send_notification "error" "Failed to process active events"

        log "Real-time sync completed"
        ;;

    "daily")
        # Daily sync for semi-static data
        log "Starting daily sync..."

        # Update hazard zones if available
        for source in "fema_flood_zones" "storm_surge_zones"; do
            run_data_acquisition "$source" || log "Skipping $source - may not have updates"
        done

        # Run full risk assessment update
        run_etl_pipeline "risk" || send_notification "error" "Failed to update risk assessments"

        # Generate statistics
        run_etl_pipeline "stats" || send_notification "error" "Failed to generate statistics"

        send_notification "info" "Daily sync completed successfully"
        log "Daily sync completed"
        ;;

    "weekly")
        # Weekly sync for infrastructure data
        log "Starting weekly sync..."

        # Update infrastructure data
        run_data_acquisition "fire_stations" || log "Skipping fire stations - may not have updates"

        # Run full pipeline
        run_etl_pipeline "run" || send_notification "error" "Failed to run full pipeline"

        # Cleanup old data
        log "Cleaning up old data..."
        psql "$DATABASE_URL" -c "
            DELETE FROM geospatial.active_events
            WHERE status != 'active'
            AND updated_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
        " >> "$LOG_FILE" 2>&1

        send_notification "info" "Weekly sync completed successfully"
        log "Weekly sync completed"
        ;;

    "monthly")
        # Monthly sync for parcel data
        log "Starting monthly sync..."

        # This would typically run a more comprehensive parcel update
        # For now, we'll just verify data integrity

        log "Verifying data integrity..."
        INTEGRITY_CHECK=$(psql "$DATABASE_URL" -t -c "
            SELECT json_build_object(
                'total_parcels', COUNT(*) FROM geospatial.parcels,
                'parcels_with_risk', COUNT(*) FROM geospatial.parcel_risk_assessment,
                'active_hazard_zones', COUNT(*) FROM geospatial.hazard_zones,
                'linked_properties', COUNT(*) FROM public.properties WHERE parcel_id IS NOT NULL
            )
        ")

        log "Data integrity check: $INTEGRITY_CHECK"
        send_notification "info" "Monthly sync completed: $INTEGRITY_CHECK"
        log "Monthly sync completed"
        ;;

    "test")
        # Test mode - run minimal sync
        log "Starting test sync..."

        # Just check connections and run statistics
        check_service_health "database"
        run_etl_pipeline "stats"

        log "Test sync completed"
        ;;

    *)
        log "Unknown sync type: $1"
        echo "Usage: $0 [realtime|daily|weekly|monthly|test]"
        exit 1
        ;;
esac

# Cleanup
rm -f "$LOCK_FILE"

# Log rotation (keep last 30 days)
find "$LOG_DIR" -name "geospatial-sync-*.log" -mtime +30 -delete

log "Workflow completed successfully"
exit 0
