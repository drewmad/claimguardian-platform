#!/bin/bash

# Script to slim down the ClaimGuardian database schema
# This removes non-essential tables and features for a leaner deployment

echo "🔧 Slimming down ClaimGuardian database schema..."

# Connect to Supabase
PROJECT_ID="tmlrvecuwgppbaynesji"

echo "📋 Current schema analysis..."

# Option 1: Remove AI/ML infrastructure (keeps core functionality)
echo "1. Remove AI/ML infrastructure tables"
echo "   - ai_performance_metrics (large time-series data)"
echo "   - ai_performance_benchmarks"
echo "   - ai_anomalies"
echo "   - ai_performance_insights"
echo "   - ai_forecasts"
echo "   - ai_model_configurations"
echo "   - ai_cost_tracking"

# Option 2: Remove Florida parcel data (if not needed)
echo "2. Remove Florida parcel data (200GB+ of GIS data)"
echo "   - florida_parcels (massive table with 14M+ rows)"
echo "   - florida_counties"
echo "   - us_states (keep if needed for multi-state)"

# Option 3: Remove advanced analytics
echo "3. Remove advanced analytics infrastructure"
echo "   - disaster_events"
echo "   - environmental_data"
echo "   - weather_data_cache"
echo "   - predictive_models"
echo "   - market_analysis_data"

# Option 4: Simplify multi-tenant architecture
echo "4. Simplify multi-tenant architecture"
echo "   - Keep core: enterprise_organizations, organization_users"
echo "   - Remove: organization_billing, organization_audit_log"
echo "   - Remove: state_* expansion tables"

# Option 5: Remove Edge Functions data
echo "5. Remove Edge Functions operational data"
echo "   - edge_function_logs"
echo "   - function_performance_metrics"
echo "   - webhook_delivery_logs"

echo ""
echo "🎯 Recommended slim-down approach:"
echo ""

cat << 'EOF'
PHASE 1: Remove AI/ML Infrastructure (saves ~80% of data volume)
- Keep basic AI features, remove analytics/monitoring
- Drop time-series tables with millions of rows
- Keep core AI functionality for features

PHASE 2: Remove Florida Parcels (saves ~200GB storage)
- Only if you don't need property data enrichment
- Keep sample data for development
- Can re-import later if needed

PHASE 3: Simplify Multi-Tenant (optional)
- Keep core tenant isolation
- Remove advanced billing/audit if not needed immediately
- Can add back incrementally

Would you like to proceed with any of these phases? (y/N)
EOF

read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    echo "Which phase would you like to execute?"
    echo "1) Phase 1: Remove AI/ML Infrastructure"
    echo "2) Phase 2: Remove Florida Parcels"
    echo "3) Phase 3: Simplify Multi-Tenant"
    echo "4) All phases (maximum slim-down)"
    echo "5) Custom selection"

    read -r phase_choice

    case $phase_choice in
        1)
            echo "🔄 Executing Phase 1: Removing AI/ML Infrastructure..."
            ./scripts/remove-ai-infrastructure.sql
            ;;
        2)
            echo "🔄 Executing Phase 2: Removing Florida Parcels..."
            ./scripts/remove-parcel-data.sql
            ;;
        3)
            echo "🔄 Executing Phase 3: Simplifying Multi-Tenant..."
            ./scripts/simplify-multitenant.sql
            ;;
        4)
            echo "🔄 Executing All Phases: Maximum slim-down..."
            ./scripts/remove-ai-infrastructure.sql
            ./scripts/remove-parcel-data.sql
            ./scripts/simplify-multitenant.sql
            ;;
        5)
            echo "📝 Creating custom slim-down script..."
            ./scripts/create-custom-slim-script.sh
            ;;
        *)
            echo "❌ Invalid selection"
            exit 1
            ;;
    esac
else
    echo "ℹ️  No changes made. Schema remains as-is."
fi

echo "✅ Schema analysis complete!"
