#!/bin/bash

# Enhanced Florida Parcels Import Monitor
# Shows comprehensive status including active processes, errors, and detailed progress

# Use environment variable or prompt for password
DB_PASSWORD="${DB_PASSWORD:-}"
if [ -z "$DB_PASSWORD" ]; then
    read -sp "Enter database password: " DB_PASSWORD
    echo
fi

DB_HOST="aws-0-us-east-2.pooler.supabase.com"
DB_PORT="6543"
DB_USER="postgres.tmlrvecuwgppbaynesji"
LOG_DIR="/tmp/florida_parcels_import/logs"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

while true; do
    clear
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}       Florida Parcels Import Monitor - Enhanced View${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo "Time: $(date '+%Y-%m-%d %H:%M:%S')"
    echo
    
    # Get database summary
    STATS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT COUNT(*) as total, COUNT(DISTINCT co_no) as counties FROM florida_parcels;" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        TOTAL=$(echo $STATS | awk '{print $1}')
        COUNTIES=$(echo $STATS | awk '{print $3}')
        
        echo -e "${GREEN}Database Status:${NC}"
        echo "  Total Parcels: $(printf "%'d" $TOTAL)"
        echo "  Counties Imported: $COUNTIES / 67"
        
        # Progress bar
        PCT=$((COUNTIES * 100 / 67))
        echo -n "  Progress: ["
        for i in $(seq 1 50); do
            if [ $i -le $((PCT / 2)) ]; then
                echo -n "="
            else
                echo -n "-"
            fi
        done
        echo "] $PCT%"
        echo
        
        # Get county breakdown
        echo -e "${GREEN}Counties by Status:${NC}"
        COUNTY_LIST=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -c "SELECT co_no, COUNT(*) FROM florida_parcels GROUP BY co_no ORDER BY co_no;" 2>/dev/null | head -10)
        echo "$COUNTY_LIST" | while read co count; do
            if [ ! -z "$co" ] && [ ! -z "$count" ]; then
                # Clean count value to remove any pipe characters
                count=$(echo "$count" | tr -d '|' | xargs)
                if [[ "$count" =~ ^[0-9]+$ ]]; then
                    echo "    County $co: $(printf "%6d" $count) parcels"
                fi
            fi
        done
        echo "    ..."
        echo
    else
        echo -e "${RED}Unable to connect to database${NC}"
    fi
    
    # Active processes
    echo -e "${YELLOW}Active Import Processes:${NC}"
    ACTIVE_PROCS=$(ps aux | grep -E "ogr2ogr.*CADASTRAL_DOR.*CO_NO" | grep -v grep)
    if [ -z "$ACTIVE_PROCS" ]; then
        echo "  No active extractions"
    else
        echo "$ACTIVE_PROCS" | while read line; do
            # Extract county code from the process
            COUNTY=$(echo "$line" | grep -oE "CO_NO = [0-9]+" | awk '{print $3}')
            PID=$(echo "$line" | awk '{print $2}')
            CPU=$(echo "$line" | awk '{print $3}')
            TIME=$(echo "$line" | awk '{print $10}')
            if [ ! -z "$COUNTY" ]; then
                echo "  County $COUNTY - PID: $PID, CPU: ${CPU}%, Runtime: $TIME"
            fi
        done
    fi
    
    # Count total active
    ACTIVE_COUNT=$(ps aux | grep "[p]rocess_county" | wc -l | xargs)
    echo "  Total active processes: $ACTIVE_COUNT"
    echo
    
    # Recent completions
    echo -e "${GREEN}Recent Completions:${NC}"
    if [ -d "$LOG_DIR" ]; then
        # Get recent successful imports
        grep -h "✅ Complete" "$LOG_DIR"/*.log 2>/dev/null | tail -10 | while read line; do
            # Extract timestamp and details
            TIMESTAMP=$(echo "$line" | grep -oE '\[[0-9-]+ [0-9:]+\]' | tr -d '[]' || echo "")
            DETAILS=$(echo "$line" | sed 's/.*✅ Complete! //')
            echo "  $TIMESTAMP - $DETAILS"
        done
    fi
    echo
    
    # Recent errors/timeouts
    echo -e "${RED}Recent Issues:${NC}"
    ISSUES=0
    if [ -d "$LOG_DIR" ]; then
        # Check for counties with 0 imports
        ZERO_IMPORTS=$(grep -h "✅ Complete! Imported 0 parcels" "$LOG_DIR"/*.log 2>/dev/null | tail -5)
        if [ ! -z "$ZERO_IMPORTS" ]; then
            echo "$ZERO_IMPORTS" | while read line; do
                LOG_FILE=$(grep -l "$line" "$LOG_DIR"/*.log | head -1)
                COUNTY_NAME=$(basename "$LOG_FILE" | sed 's/county_//' | sed 's/.log//' | awk -F'_' '{print $2 " (" $1 ")"}')
                echo -e "  ${YELLOW}⚠️  $COUNTY_NAME - Import failed (0 parcels)${NC}"
                ((ISSUES++))
            done
        fi
        
        # Check main log for timeouts
        if [ -f "/tmp/florida_import_remaining.log" ]; then
            TIMEOUTS=$(grep -E "ERROR.*timeout|canceling statement" /tmp/florida_import_remaining.log 2>/dev/null | tail -3)
            if [ ! -z "$TIMEOUTS" ]; then
                echo "$TIMEOUTS" | while read line; do
                    echo -e "  ${RED}❌ Timeout: $(echo "$line" | cut -c1-60)...${NC}"
                    ((ISSUES++))
                done
            fi
        fi
    fi
    
    if [ $ISSUES -eq 0 ]; then
        echo "  No recent issues"
    fi
    echo
    
    # Recommendations
    echo -e "${BLUE}Recommendations:${NC}"
    if [ $ISSUES -gt 0 ]; then
        echo "  • Several counties failed due to timeouts"
        echo "  • Use batched import for large counties:"
        echo "    ./scripts/import-large-county-batched.sh <code> <name>"
    fi
    
    # Show remaining counties
    REMAINING=$((67 - COUNTIES))
    if [ $REMAINING -gt 0 ]; then
        echo "  • $REMAINING counties remaining to import"
    fi
    echo
    
    echo "Press Ctrl+C to exit (refreshing every 10 seconds...)"
    sleep 10
done