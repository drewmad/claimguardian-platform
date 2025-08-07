#!/bin/bash

# Import Remaining Counties (60-77)
# Handles the final batch of counties not yet imported

set -euo pipefail

# Security: Use environment variable or secure prompt
DB_PASSWORD="${DB_PASSWORD:-}"
if [ -z "$DB_PASSWORD" ]; then
    echo "Database password required. Set DB_PASSWORD environment variable or enter now:"
    read -sp "Password: " DB_PASSWORD
    echo
fi

# Import the secure parallel import functions
source /Users/madengineering/ClaimGuardian/scripts/import-all-counties-secure.sh

# Remaining counties (60-77 except those already done)
REMAINING_COUNTIES=(
    "60 PALM_BEACH"
    "61 PASCO"
    "62 PINELLAS"
    "63 POLK"
    "64 PUTNAM"
    "65 ST_JOHNS"
    "66 ST_LUCIE"
    "67 SANTA_ROSA"
    "68 SARASOTA"
    "69 SEMINOLE"
    "70 SUMTER"
    "71 SUWANNEE"
    "72 TAYLOR"
    "73 UNION"
    "74 VOLUSIA"
    "75 WAKULLA"
    "76 WALTON"
    "77 WASHINGTON"
)

log "Starting import of remaining counties (60-77)..."
log "Will process in parallel with adaptive batch sizing"

# Check which ones are already imported
for COUNTY in "${REMAINING_COUNTIES[@]}"; do
    IFS=' ' read -r CODE NAME <<< "$COUNTY"

    # Check if already imported
    EXISTING=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d postgres \
        -t -A \
        -c "SELECT COUNT(*) FROM florida_parcels WHERE co_no = $CODE;" 2>/dev/null || echo "0")

    if [ "$EXISTING" -gt 0 ]; then
        log "County $CODE ($NAME) already has $EXISTING parcels - skipping"
    else
        log "County $CODE ($NAME) needs import - adding to queue"

        # Determine if this is a large county that needs batching
        case $CODE in
            60)  # Palm Beach - very large
                log "Scheduling Palm Beach for batched import (expected ~700k parcels)"
                ./scripts/import-large-county-batched.sh "$CODE" "PALM-BEACH" &
                sleep 5  # Stagger starts
                ;;
            62)  # Pinellas - large
                log "Scheduling Pinellas for batched import (expected ~500k parcels)"
                ./scripts/import-large-county-batched.sh "$CODE" "PINELLAS" &
                sleep 5
                ;;
            63)  # Polk - large
                log "Scheduling Polk for batched import (expected ~350k parcels)"
                ./scripts/import-large-county-batched.sh "$CODE" "POLK" &
                sleep 5
                ;;
            74)  # Volusia - large
                log "Scheduling Volusia for batched import (expected ~300k parcels)"
                ./scripts/import-large-county-batched.sh "$CODE" "VOLUSIA" &
                sleep 5
                ;;
            *)  # Regular counties - use standard parallel import
                process_county "$CODE" "$NAME" &
                # Limit parallel jobs
                while [ $(jobs -r | wc -l) -ge 4 ]; do
                    sleep 10
                done
                ;;
        esac
    fi
done

# Wait for all background jobs to complete
log "Waiting for all import jobs to complete..."
wait

success "All remaining counties import process completed!"
log "Run the monitoring script to verify: ./scripts/monitor-import-ultimate.sh"
