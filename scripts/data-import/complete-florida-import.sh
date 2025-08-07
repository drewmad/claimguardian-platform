#!/bin/bash

# Master Script to Complete Florida Import
# Coordinates fixing failed counties and importing remaining ones

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to print banner
print_banner() {
    echo -e "${CYAN}=============================================================================${NC}"
    echo -e "${CYAN}                    FLORIDA PARCELS IMPORT - FINAL PHASE${NC}"
    echo -e "${CYAN}=============================================================================${NC}"
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking prerequisites...${NC}"

    # Check for required scripts
    local REQUIRED_SCRIPTS=(
        "fix-failed-counties.sh"
        "import-remaining-counties.sh"
        "import-large-county-batched.sh"
        "monitor-import-ultimate.sh"
    )

    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if [ ! -f "/Users/madengineering/ClaimGuardian/scripts/$script" ]; then
            echo -e "${RED}❌ Missing required script: $script${NC}"
            exit 1
        fi
    done

    echo -e "${GREEN}✅ All required scripts found${NC}"

    # Check database password
    if [ -z "${DB_PASSWORD:-}" ]; then
        echo -e "${YELLOW}Database password not set in environment${NC}"
        echo "You'll be prompted for the password when running scripts"
    else
        echo -e "${GREEN}✅ Database password configured${NC}"
    fi
}

# Main execution
print_banner

echo -e "${PURPLE}Current Status Summary:${NC}"
echo "- 44/67 counties imported (65%)"
echo "- 4.3 million parcels loaded"
echo "- 5 counties failed (need fixing)"
echo "- 18 counties not yet attempted"
echo

check_prerequisites

echo
echo -e "${YELLOW}This script will:${NC}"
echo "1. Fix 6 failed counties (including Miami-Dade partial import)"
echo "2. Import remaining 18 counties (60-77)"
echo "3. Monitor progress throughout"
echo

read -p "Do you want to proceed? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

# Export password if provided
if [ ! -z "${DB_PASSWORD:-}" ]; then
    export DB_PASSWORD
fi

# Phase 1: Fix failed counties
echo
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 1: Fixing Failed Counties${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo

echo "Starting fix for failed counties (DeSoto, Leon, Marion, Martin, Orange, Miami-Dade)..."
./scripts/fix-failed-counties.sh &
FIX_PID=$!

# Monitor for a bit
sleep 30

echo
echo -e "${YELLOW}Monitoring progress...${NC}"
if [ ! -z "${DB_PASSWORD:-}" ]; then
    timeout 20 ./scripts/monitor-import-ultimate.sh || true
else
    echo "Set DB_PASSWORD to see live monitoring"
fi

# Phase 2: Import remaining counties (can run in parallel)
echo
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 2: Importing Remaining Counties (60-77)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo

echo "Starting import of remaining 18 counties..."
./scripts/import-remaining-counties.sh &
REMAINING_PID=$!

# Wait for both phases to complete
echo
echo -e "${YELLOW}Waiting for all imports to complete...${NC}"
echo "This may take several hours for large counties."
echo "You can monitor progress in another terminal with:"
echo -e "${CYAN}DB_PASSWORD='your-password' ./scripts/monitor-import-ultimate.sh${NC}"

# Wait for fix script
if ps -p $FIX_PID > /dev/null 2>&1; then
    echo "Waiting for failed counties fix to complete..."
    wait $FIX_PID
    echo -e "${GREEN}✅ Failed counties fix completed${NC}"
fi

# Wait for remaining counties
if ps -p $REMAINING_PID > /dev/null 2>&1; then
    echo "Waiting for remaining counties import to complete..."
    wait $REMAINING_PID
    echo -e "${GREEN}✅ Remaining counties import completed${NC}"
fi

# Final verification
echo
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}PHASE 3: Final Verification${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo

# Get final stats
if [ ! -z "${DB_PASSWORD:-}" ]; then
    FINAL_STATS=$(PGPASSWORD="$DB_PASSWORD" psql \
        -h aws-0-us-east-2.pooler.supabase.com \
        -p 6543 \
        -U postgres.tmlrvecuwgppbaynesji \
        -d postgres \
        -t -A \
        -c "SELECT COUNT(*) as total, COUNT(DISTINCT co_no) as counties FROM florida_parcels;" 2>/dev/null)

    if [ $? -eq 0 ]; then
        IFS='|' read -r TOTAL COUNTIES <<< "$FINAL_STATS"
        echo -e "${GREEN}Final Statistics:${NC}"
        echo -e "  Total Parcels: ${GREEN}$(printf "%'d" $TOTAL)${NC}"
        echo -e "  Counties Imported: ${GREEN}$COUNTIES / 67${NC}"

        if [ "$COUNTIES" -eq 67 ]; then
            echo -e "${GREEN}🎉 COMPLETE! All 67 Florida counties have been imported!${NC}"
        else
            echo -e "${YELLOW}⚠️  Import incomplete. $((67 - COUNTIES)) counties still missing.${NC}"
        fi
    fi
else
    echo "Set DB_PASSWORD to see final statistics"
fi

echo
echo -e "${CYAN}=============================================================================${NC}"
echo -e "${GREEN}Florida Parcels Import Process Completed!${NC}"
echo -e "${CYAN}=============================================================================${NC}"
echo
echo "Next steps:"
echo "1. Run full monitoring to see detailed status:"
echo "   ${CYAN}DB_PASSWORD='your-password' ./scripts/monitor-import-ultimate.sh${NC}"
echo "2. Check logs for any issues:"
echo "   ${CYAN}ls -la /tmp/florida_parcels_import/logs/${NC}"
echo "3. Verify data quality with spot checks"
echo

# Create completion report
REPORT_FILE="/Users/madengineering/ClaimGuardian/FLORIDA_IMPORT_COMPLETION_$(date +%Y%m%d_%H%M%S).md"
cat > "$REPORT_FILE" << EOF
# Florida Parcels Import Completion Report

Generated: $(date)

## Process Summary
- Script started: $(date)
- Failed counties fix initiated
- Remaining counties import initiated
- Both processes completed

## Final Status
- Check monitor script for detailed statistics
- Review logs for any errors
- Verify all 67 counties are present

## Commands for Verification
\`\`\`bash
# Check overall status
DB_PASSWORD='your-password' ./scripts/monitor-import-ultimate.sh

# Check specific county
PGPASSWORD='your-password' psql -h aws-0-us-east-2.pooler.supabase.com -p 6543 -U postgres.tmlrvecuwgppbaynesji -d postgres -c "SELECT co_no, COUNT(*) FROM florida_parcels GROUP BY co_no ORDER BY co_no;"

# Check for counties with 0 records
PGPASSWORD='your-password' psql -h aws-0-us-east-2.pooler.supabase.com -p 6543 -U postgres.tmlrvecuwgppbaynesji -d postgres -c "SELECT co_no FROM generate_series(11,77) co_no WHERE co_no NOT IN (SELECT DISTINCT co_no FROM florida_parcels);"
\`\`\`
EOF

echo -e "${GREEN}Completion report saved to: $REPORT_FILE${NC}"
