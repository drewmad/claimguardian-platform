#!/bin/bash

# Script to start processing Florida parcels from uploaded ZIP file
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Florida Parcels Processing - Start Script            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

# Function to check orchestrator status
check_status() {
    echo -e "${BLUE}Checking current processing status...${NC}"

    curl -s -X POST \
        https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-orchestrator \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"action": "status"}' | jq '.'
}

# Function to start processing
start_processing() {
    local mode=$1
    echo -e "${GREEN}Starting processing in ${mode} mode...${NC}"

    local body='{"action": "start", "mode": "'${mode}'", "batch_size": 1000, "parallel_counties": 2}'

    if [ "$mode" == "specific" ]; then
        # For testing, let's start with Charlotte County (8)
        body='{"action": "start", "mode": "specific", "counties": [8], "batch_size": 1000}'
    fi

    curl -s -X POST \
        https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-orchestrator \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "$body" | jq '.'
}

# Function to monitor progress
monitor_progress() {
    echo -e "${BLUE}Getting processing dashboard...${NC}"

    curl -s -X POST \
        https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-monitor \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"view": "dashboard"}' | jq '.summary'
}

# Main menu
echo -e "${YELLOW}What would you like to do?${NC}"
echo "1) Check current status"
echo "2) Start processing Charlotte County (test)"
echo "3) Start processing priority counties (20 largest)"
echo "4) Start processing all counties (67 total)"
echo "5) Monitor progress"
echo "6) Stop all processing"
echo ""
read -p "Enter your choice (1-6): " choice

case $choice in
    1)
        check_status
        ;;
    2)
        echo -e "${YELLOW}Starting with Charlotte County as a test...${NC}"
        start_processing "specific"
        echo ""
        echo -e "${GREEN}Processing started! Monitor progress at:${NC}"
        echo "http://localhost:3000/admin/florida-parcels"
        ;;
    3)
        echo -e "${YELLOW}Starting priority counties (20 largest by population)...${NC}"
        start_processing "priority"
        echo ""
        echo -e "${GREEN}Processing started! Monitor progress at:${NC}"
        echo "http://localhost:3000/admin/florida-parcels"
        ;;
    4)
        echo -e "${YELLOW}Starting all 67 Florida counties...${NC}"
        echo -e "${RED}Warning: This will process ~10 million parcels and take several hours!${NC}"
        read -p "Are you sure? (y/n): " confirm
        if [ "$confirm" == "y" ]; then
            start_processing "all"
            echo ""
            echo -e "${GREEN}Processing started! Monitor progress at:${NC}"
            echo "http://localhost:3000/admin/florida-parcels"
        else
            echo "Cancelled"
        fi
        ;;
    5)
        monitor_progress
        ;;
    6)
        echo -e "${RED}Stopping all processing...${NC}"
        curl -s -X POST \
            https://tmlrvecuwgppbaynesji.supabase.co/functions/v1/florida-parcels-orchestrator \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
            -H "Content-Type: application/json" \
            -d '{"action": "stop"}' | jq '.'
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}Dashboard URL:${NC} http://localhost:3000/admin/florida-parcels"
echo -e "${BLUE}Production URL:${NC} https://claimguardianai.com/admin/florida-parcels"
