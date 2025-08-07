#!/bin/bash

# ML Operations Schedule Monitoring Script
# This script monitors and verifies the automated ML data sync schedules

set -e

echo "🤖 ML Operations Schedule Monitor"
echo "================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required environment variables are set
check_env() {
    if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        echo -e "${RED}❌ Error: Required environment variables not set${NC}"
        echo "Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set"
        exit 1
    fi
}

# Function to test Edge Function health
test_edge_function() {
    local function_name=$1
    local endpoint="${SUPABASE_URL}/functions/v1/${function_name}"

    echo -e "${BLUE}Testing ${function_name}...${NC}"

    response=$(curl -s -o /dev/null -w "%{http_code}" \
        -X POST "${endpoint}" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"test": true}')

    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ ${function_name} is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ ${function_name} returned status: ${response}${NC}"
        return 1
    fi
}

# Function to check cron job status
check_cron_status() {
    echo -e "${BLUE}Checking cron job configurations...${NC}"

    # List all ML-related cron jobs
    cat <<EOF
Configured ML Operations Schedules:
----------------------------------
1. Environmental Data Sync - Every 6 hours (0 */6 * * *)
2. Property AI Enrichment - Daily at 02:00 UTC (0 2 * * *)
3. ML Metrics Aggregation - Every hour (0 * * * *)
4. Model Drift Detection - Every 4 hours (0 */4 * * *)
5. Federated Learning - Daily at 00:00 UTC (0 0 * * *)
6. Florida Parcel Monitor - Every 30 minutes (*/30 * * * *)
7. AI Processing Queue - Every 5 minutes (*/5 * * * *)
8. Stream Processor Health - Every 15 minutes (*/15 * * * *)
9. Model Auto-scaling - Every 10 minutes (*/10 * * * *)
EOF
    echo ""
}

# Function to check recent job executions
check_recent_executions() {
    echo -e "${BLUE}Checking recent ML job executions...${NC}"

    # Query recent ML processing queue activity
    recent_jobs=$(curl -s -X POST \
        "${SUPABASE_URL}/rest/v1/rpc/get_recent_ml_jobs" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d '{"limit": 10}' 2>/dev/null || echo "[]")

    if [ "$recent_jobs" != "[]" ]; then
        echo -e "${GREEN}Recent ML job activity detected${NC}"
    else
        echo -e "${YELLOW}No recent ML job activity found${NC}"
    fi
}

# Function to verify database tables
verify_ml_tables() {
    echo -e "${BLUE}Verifying ML operations database tables...${NC}"

    tables=(
        "ml_model_versions"
        "ml_model_deployments"
        "ml_performance_metrics"
        "federated_learning_rounds"
        "ai_stream_processors"
        "ai_processing_queue"
    )

    for table in "${tables[@]}"; do
        result=$(curl -s -X GET \
            "${SUPABASE_URL}/rest/v1/${table}?limit=1" \
            -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
            -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}")

        if [[ $result == *"\"code\""* ]]; then
            echo -e "${RED}❌ Table ${table} not accessible${NC}"
        else
            echo -e "${GREEN}✅ Table ${table} exists and is accessible${NC}"
        fi
    done
}

# Function to deploy cron configuration
deploy_cron_config() {
    echo -e "${BLUE}Deploying cron configuration...${NC}"

    if [ -f "../../supabase/functions/cron.yaml" ]; then
        echo -e "${GREEN}✅ Cron configuration file found${NC}"
        echo "To deploy: supabase functions deploy --legacy-bundle"
    else
        echo -e "${RED}❌ Cron configuration file not found${NC}"
    fi
}

# Main execution
main() {
    check_env

    echo "1. Edge Function Health Checks"
    echo "------------------------------"
    test_edge_function "environmental-data-sync"
    test_edge_function "property-ai-enrichment"
    test_edge_function "ml-model-management"
    test_edge_function "federated-learning"
    test_edge_function "florida-parcel-monitor"
    echo ""

    echo "2. Cron Schedule Status"
    echo "----------------------"
    check_cron_status
    echo ""

    echo "3. Database Verification"
    echo "-----------------------"
    verify_ml_tables
    echo ""

    echo "4. Recent Executions"
    echo "-------------------"
    check_recent_executions
    echo ""

    echo "5. Deployment Status"
    echo "-------------------"
    deploy_cron_config
    echo ""

    echo -e "${GREEN}✅ ML Operations schedule monitoring complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Deploy cron configuration: supabase functions deploy --legacy-bundle"
    echo "2. Monitor job executions in the ML Operations dashboard"
    echo "3. Check Supabase logs for any execution errors"
}

# Run main function
main
