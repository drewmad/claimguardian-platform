#!/bin/bash

# Ultimate Florida Parcels Import Monitor
# Shows comprehensive status with all details visible

# Security: Use environment variable or secure prompt
DB_PASSWORD="${DB_PASSWORD:-}"
if [ -z "$DB_PASSWORD" ]; then
    echo "Database password required. Set DB_PASSWORD environment variable or enter now:"
    read -sp "Password: " DB_PASSWORD
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
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to format numbers with commas (macOS compatible)
format_number() {
    printf "%'d" $1 2>/dev/null || echo $1
}

while true; do
    clear
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${BLUE}              FLORIDA PARCELS IMPORT MONITOR - COMPREHENSIVE VIEW${NC}"
    echo -e "${BLUE}=============================================================================${NC}"
    echo -e "${CYAN}Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo

    # Get database summary with detailed query
    echo -e "${GREEN}📊 DATABASE STATUS:${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"

    # Get total statistics
    STATS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -A -c "
        SELECT
            COUNT(*) as total,
            COUNT(DISTINCT co_no) as counties,
            MIN(co_no) as min_county,
            MAX(co_no) as max_county
        FROM florida_parcels;" 2>/dev/null)

    if [ $? -eq 0 ]; then
        IFS='|' read -r TOTAL COUNTIES MIN_COUNTY MAX_COUNTY <<< "$STATS"

        echo -e "  ${YELLOW}Total Parcels:${NC} $(format_number $TOTAL)"
        echo -e "  ${YELLOW}Counties Imported:${NC} $COUNTIES / 67"
        echo -e "  ${YELLOW}County Range:${NC} $MIN_COUNTY - $MAX_COUNTY"

        # Progress bar
        PCT=$((COUNTIES * 100 / 67))
        echo -n -e "  ${YELLOW}Progress:${NC} ["
        for i in $(seq 1 50); do
            if [ $i -le $((PCT / 2)) ]; then
                echo -n -e "${GREEN}█${NC}"
            else
                echo -n -e "${BLUE}░${NC}"
            fi
        done
        echo -e "] ${GREEN}$PCT%${NC}"
        echo

        # Detailed county breakdown
        echo -e "${GREEN}📍 COUNTY DETAILS (ALL IMPORTED):${NC}"
        echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"

        # Get all counties with names mapping
        COUNTY_DATA=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -A -c "
            WITH county_names AS (
                SELECT * FROM (VALUES
                    (11, 'ALACHUA'), (12, 'BAKER'), (13, 'BAY'), (14, 'BRADFORD'),
                    (15, 'BREVARD'), (16, 'BROWARD'), (17, 'CALHOUN'), (18, 'CHARLOTTE'),
                    (19, 'CITRUS'), (20, 'CLAY'), (21, 'COLLIER'), (22, 'COLUMBIA'),
                    (23, 'DESOTO'), (24, 'DIXIE'), (25, 'DUVAL'), (26, 'ESCAMBIA'),
                    (27, 'FLAGLER'), (28, 'FRANKLIN'), (29, 'GADSDEN'), (30, 'GILCHRIST'),
                    (31, 'GLADES'), (32, 'GULF'), (33, 'HAMILTON'), (34, 'HARDEE'),
                    (35, 'HENDRY'), (36, 'HERNANDO'), (37, 'HIGHLANDS'), (38, 'HILLSBOROUGH'),
                    (39, 'HOLMES'), (40, 'INDIAN RIVER'), (41, 'JACKSON'), (42, 'JEFFERSON'),
                    (43, 'LAFAYETTE'), (44, 'LAKE'), (45, 'LEE'), (46, 'LEON'),
                    (47, 'LEVY'), (48, 'LIBERTY'), (49, 'MADISON'), (50, 'MANATEE'),
                    (51, 'MARION'), (52, 'MARTIN'), (53, 'MIAMI-DADE'), (54, 'MONROE'),
                    (55, 'NASSAU'), (56, 'OKALOOSA'), (57, 'OKEECHOBEE'), (58, 'ORANGE'),
                    (59, 'OSCEOLA'), (60, 'PALM BEACH'), (61, 'PASCO'), (62, 'PINELLAS'),
                    (63, 'POLK'), (64, 'PUTNAM'), (65, 'ST. JOHNS'), (66, 'ST. LUCIE'),
                    (67, 'SANTA ROSA'), (68, 'SARASOTA'), (69, 'SEMINOLE'), (70, 'SUMTER'),
                    (71, 'SUWANNEE'), (72, 'TAYLOR'), (73, 'UNION'), (74, 'VOLUSIA'),
                    (75, 'WAKULLA'), (76, 'WALTON'), (77, 'WASHINGTON')
                ) AS t(code, name)
            )
            SELECT
                cn.code,
                cn.name,
                COALESCE(fp.count, 0) as count,
                CASE WHEN fp.count > 0 THEN '✅' ELSE '❌' END as status
            FROM county_names cn
            LEFT JOIN (
                SELECT co_no, COUNT(*) as count
                FROM florida_parcels
                GROUP BY co_no
            ) fp ON cn.code = fp.co_no
            ORDER BY cn.code;" 2>/dev/null)

        # Display in columns
        echo "$COUNTY_DATA" | awk -F'|' '
        BEGIN { count = 0 }
        {
            if (NR % 3 == 1) printf "  "
            printf "%-2s %-20s %s %8s  ", $4, substr($2, 1, 20), $4, $3
            if (NR % 3 == 0) printf "\n"
            count++
        }
        END { if (count % 3 != 0) printf "\n" }'

        echo

        # Summary statistics
        echo -e "${GREEN}📈 IMPORT STATISTICS:${NC}"
        echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"

        ZERO_COUNT=$(echo "$COUNTY_DATA" | grep -c '|0|')
        NON_ZERO=$(echo "$COUNTY_DATA" | grep -c -v '|0|')

        echo -e "  ${GREEN}✅ Successfully Imported:${NC} $NON_ZERO counties"
        echo -e "  ${RED}❌ Not Yet Imported:${NC} $ZERO_COUNT counties"

        # Get largest counties
        echo
        echo -e "${GREEN}🏆 TOP 10 LARGEST COUNTIES:${NC}"
        echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"

        TOP_COUNTIES=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d postgres -t -A -c "
            WITH county_names AS (
                SELECT * FROM (VALUES
                    (11, 'ALACHUA'), (12, 'BAKER'), (13, 'BAY'), (14, 'BRADFORD'),
                    (15, 'BREVARD'), (16, 'BROWARD'), (17, 'CALHOUN'), (18, 'CHARLOTTE'),
                    (19, 'CITRUS'), (20, 'CLAY'), (21, 'COLLIER'), (22, 'COLUMBIA'),
                    (23, 'DESOTO'), (24, 'DIXIE'), (25, 'DUVAL'), (26, 'ESCAMBIA'),
                    (27, 'FLAGLER'), (28, 'FRANKLIN'), (29, 'GADSDEN'), (30, 'GILCHRIST'),
                    (31, 'GLADES'), (32, 'GULF'), (33, 'HAMILTON'), (34, 'HARDEE'),
                    (35, 'HENDRY'), (36, 'HERNANDO'), (37, 'HIGHLANDS'), (38, 'HILLSBOROUGH'),
                    (39, 'HOLMES'), (40, 'INDIAN RIVER'), (41, 'JACKSON'), (42, 'JEFFERSON'),
                    (43, 'LAFAYETTE'), (44, 'LAKE'), (45, 'LEE'), (46, 'LEON'),
                    (47, 'LEVY'), (48, 'LIBERTY'), (49, 'MADISON'), (50, 'MANATEE'),
                    (51, 'MARION'), (52, 'MARTIN'), (53, 'MIAMI-DADE'), (54, 'MONROE'),
                    (55, 'NASSAU'), (56, 'OKALOOSA'), (57, 'OKEECHOBEE'), (58, 'ORANGE'),
                    (59, 'OSCEOLA'), (60, 'PALM BEACH'), (61, 'PASCO'), (62, 'PINELLAS'),
                    (63, 'POLK'), (64, 'PUTNAM'), (65, 'ST. JOHNS'), (66, 'ST. LUCIE'),
                    (67, 'SANTA ROSA'), (68, 'SARASOTA'), (69, 'SEMINOLE'), (70, 'SUMTER'),
                    (71, 'SUWANNEE'), (72, 'TAYLOR'), (73, 'UNION'), (74, 'VOLUSIA'),
                    (75, 'WAKULLA'), (76, 'WALTON'), (77, 'WASHINGTON')
                ) AS t(code, name)
            )
            SELECT
                fp.co_no,
                cn.name,
                COUNT(*) as count
            FROM florida_parcels fp
            JOIN county_names cn ON fp.co_no = cn.code
            GROUP BY fp.co_no, cn.name
            ORDER BY count DESC
            LIMIT 10;" 2>/dev/null)

        echo "$TOP_COUNTIES" | awk -F'|' '{
            printf "  %2d. %-20s %10s parcels\n", NR, $2, $3
        }'

    else
        echo -e "${RED}❌ Unable to connect to database${NC}"
    fi

    echo
    echo -e "${YELLOW}🔄 ACTIVE PROCESSES:${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"

    # Check for active ogr2ogr processes
    ACTIVE_PROCS=$(ps aux | grep -E "ogr2ogr.*CADASTRAL_DOR.*CO_NO" | grep -v grep)
    if [ -z "$ACTIVE_PROCS" ]; then
        echo -e "  ${BLUE}No active extractions${NC}"
    else
        echo "$ACTIVE_PROCS" | while read line; do
            COUNTY=$(echo "$line" | grep -oE "CO_NO = [0-9]+" | awk '{print $3}')
            PID=$(echo "$line" | awk '{print $2}')
            CPU=$(echo "$line" | awk '{print $3}')
            TIME=$(echo "$line" | awk '{print $10}')
            if [ ! -z "$COUNTY" ]; then
                echo -e "  ${YELLOW}County $COUNTY${NC} - PID: $PID, CPU: ${GREEN}${CPU}%${NC}, Runtime: $TIME"
            fi
        done
    fi

    # Check for active import processes
    IMPORT_PROCS=$(ps aux | grep -E "process_county|import.*county" | grep -v grep | wc -l)
    echo -e "  ${PURPLE}Total active import processes:${NC} $IMPORT_PROCS"

    echo
    echo -e "${GREEN}📋 RECENT ACTIVITY (Last 15 minutes):${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"

    if [ -d "$LOG_DIR" ]; then
        # Find recent log entries
        find "$LOG_DIR" -name "*.log" -mmin -15 -exec grep -H "✅ Complete" {} \; 2>/dev/null | tail -10 | while IFS=: read file line; do
            COUNTY_INFO=$(basename "$file" | sed 's/county_//' | sed 's/.log//')
            PARCELS=$(echo "$line" | grep -oE "Imported [0-9]+ parcels" | awk '{print $2}')
            if [ ! -z "$PARCELS" ] && [ "$PARCELS" != "0" ]; then
                echo -e "  ${GREEN}✅${NC} County $COUNTY_INFO: $(format_number $PARCELS) parcels"
            else
                echo -e "  ${RED}❌${NC} County $COUNTY_INFO: Import failed (0 parcels)"
            fi
        done
    fi

    echo
    echo -e "${RED}⚠️  ISSUES & RECOMMENDATIONS:${NC}"
    echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"

    # Check for recent timeouts
    if [ -f "/tmp/florida_import_remaining.log" ]; then
        TIMEOUT_COUNT=$(grep -c "timeout\|canceling statement" /tmp/florida_import_remaining.log 2>/dev/null || echo 0)
        if [ "$TIMEOUT_COUNT" -gt 0 ]; then
            echo -e "  ${RED}⏱️  $TIMEOUT_COUNT timeout errors detected${NC}"
            echo -e "  ${YELLOW}→ Use batched import for large counties:${NC}"
            echo -e "    ${CYAN}./scripts/import-large-county-batched.sh <code> <name>${NC}"
        fi
    fi

    # Show counties that need attention
    PROBLEM_COUNTIES=$(echo "$COUNTY_DATA" | grep '|0|' | head -5)
    if [ ! -z "$PROBLEM_COUNTIES" ]; then
        echo -e "  ${RED}Counties needing import:${NC}"
        echo "$PROBLEM_COUNTIES" | awk -F'|' '{
            printf "    • County %2d (%s)\n", $1, $2
        }'
    fi

    echo
    echo -e "${CYAN}───────────────────────────────────────────────────────────────────────${NC}"
    echo -e "Press ${RED}Ctrl+C${NC} to exit | Refreshing every 15 seconds..."
    sleep 15
done
