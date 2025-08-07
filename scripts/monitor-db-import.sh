#!/bin/bash

# Monitor database import progress
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Database configuration
DB_HOST="db.tmlrvecuwgppbaynesji.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║            Florida Parcels Import Monitor                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for database password
if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo -e "${YELLOW}Database password required!${NC}"
    read -s -p "Enter database password: " SUPABASE_DB_PASSWORD
    export SUPABASE_DB_PASSWORD
    echo ""
fi

# Function to run SQL query
run_query() {
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null || echo "0"
}

# Monitor loop
while true; do
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║            Florida Parcels Import Monitor                      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Get total count
    TOTAL_COUNT=$(run_query "SELECT COUNT(*) FROM florida_parcels;" | xargs)

    # Get county breakdown
    echo -e "${BLUE}Import Progress:${NC}"
    echo -e "Total Parcels: ${GREEN}$(printf "%'d" $TOTAL_COUNT)${NC}"
    echo ""

    # Get per-county stats
    echo -e "${BLUE}Counties Imported:${NC}"
    PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
SELECT
    CO_NO as "County Code",
    COUNT(*) as "Parcels",
    CASE CO_NO
        WHEN 11 THEN 'ALACHUA'
        WHEN 12 THEN 'BAKER'
        WHEN 13 THEN 'BAY'
        WHEN 14 THEN 'BRADFORD'
        WHEN 15 THEN 'BREVARD'
        WHEN 16 THEN 'BROWARD'
        WHEN 17 THEN 'CALHOUN'
        WHEN 18 THEN 'CHARLOTTE'
        WHEN 19 THEN 'CITRUS'
        WHEN 20 THEN 'CLAY'
        WHEN 21 THEN 'COLLIER'
        WHEN 22 THEN 'COLUMBIA'
        WHEN 23 THEN 'MIAMI-DADE'
        WHEN 24 THEN 'DESOTO'
        WHEN 25 THEN 'DIXIE'
        WHEN 26 THEN 'DUVAL'
        WHEN 27 THEN 'ESCAMBIA'
        WHEN 28 THEN 'FLAGLER'
        WHEN 29 THEN 'FRANKLIN'
        WHEN 30 THEN 'GADSDEN'
        WHEN 31 THEN 'GILCHRIST'
        WHEN 32 THEN 'GLADES'
        WHEN 33 THEN 'GULF'
        WHEN 34 THEN 'HAMILTON'
        WHEN 35 THEN 'HARDEE'
        WHEN 36 THEN 'HENDRY'
        WHEN 37 THEN 'HERNANDO'
        WHEN 38 THEN 'HIGHLANDS'
        WHEN 39 THEN 'HILLSBOROUGH'
        WHEN 40 THEN 'HOLMES'
        WHEN 41 THEN 'INDIAN RIVER'
        WHEN 42 THEN 'JACKSON'
        WHEN 43 THEN 'JEFFERSON'
        WHEN 44 THEN 'LAFAYETTE'
        WHEN 45 THEN 'LAKE'
        WHEN 46 THEN 'LEE'
        WHEN 47 THEN 'LEON'
        WHEN 48 THEN 'LEVY'
        WHEN 49 THEN 'LIBERTY'
        WHEN 50 THEN 'MADISON'
        WHEN 51 THEN 'MANATEE'
        WHEN 52 THEN 'MARION'
        WHEN 53 THEN 'MARTIN'
        WHEN 54 THEN 'MONROE'
        WHEN 55 THEN 'NASSAU'
        WHEN 56 THEN 'OKALOOSA'
        WHEN 57 THEN 'OKEECHOBEE'
        WHEN 58 THEN 'ORANGE'
        WHEN 59 THEN 'OSCEOLA'
        WHEN 60 THEN 'PALM BEACH'
        WHEN 61 THEN 'PASCO'
        WHEN 62 THEN 'PINELLAS'
        WHEN 63 THEN 'POLK'
        WHEN 64 THEN 'PUTNAM'
        WHEN 65 THEN 'ST JOHNS'
        WHEN 66 THEN 'ST LUCIE'
        WHEN 67 THEN 'SANTA ROSA'
        WHEN 68 THEN 'SARASOTA'
        WHEN 69 THEN 'SEMINOLE'
        WHEN 70 THEN 'SUMTER'
        WHEN 71 THEN 'SUWANNEE'
        WHEN 72 THEN 'TAYLOR'
        WHEN 73 THEN 'UNION'
        WHEN 74 THEN 'VOLUSIA'
        WHEN 75 THEN 'WAKULLA'
        WHEN 76 THEN 'WALTON'
        WHEN 77 THEN 'WASHINGTON'
        ELSE 'UNKNOWN'
    END as "County Name"
FROM florida_parcels
GROUP BY CO_NO
ORDER BY COUNT(*) DESC
LIMIT 20;
EOF

    echo ""
    echo -e "${YELLOW}Press Ctrl+C to exit${NC}"
    echo -e "Refreshing in 10 seconds..."

    sleep 10
done
