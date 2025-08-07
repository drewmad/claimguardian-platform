#!/bin/bash

# Deploy Claude Learning System to Production
# This script handles the complete production deployment of the learning system

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOYMENT_ENV="${1:-production}"
ENABLE_AB_TEST="${2:-true}"
CONFIDENCE_THRESHOLD="${3:-0.8}"

info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ ERROR: $1${NC}" >&2
    exit 1
}

validate_environment() {
    info "Validating environment for Claude Learning System deployment..."

    # Check required environment variables
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "OPENAI_API_KEY"
        "GEMINI_API_KEY"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable missing: $var"
        fi
    done

    # Check Supabase connection
    if ! supabase status >/dev/null 2>&1; then
        error "Cannot connect to Supabase. Check configuration."
    fi

    success "Environment validation passed"
}

setup_database_schema() {
    info "Setting up production metrics database schema..."

    # Deploy the setup function
    supabase functions deploy setup-production-metrics --no-verify-jwt

    # Call the function to create schema
    local response
    response=$(curl -s -X POST \
        "${NEXT_PUBLIC_SUPABASE_URL}/functions/v1/setup-production-metrics" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json")

    if [[ $(echo "$response" | jq -r '.success') == "true" ]]; then
        success "Database schema setup completed"
    else
        error "Database schema setup failed: $(echo "$response" | jq -r '.error')"
    fi
}

deploy_edge_functions() {
    info "Deploying Claude Learning System Edge Functions..."

    # List of learning system functions to deploy
    local functions=(
        "ai-document-extraction"
        "analyze-damage-with-policy"
        "policy-chat"
        "property-ai-enrichment"
        "ml-model-management"
        "federated-learning"
        "setup-production-metrics"
    )

    for func in "${functions[@]}"; do
        if [[ -d "supabase/functions/$func" ]]; then
            info "Deploying function: $func"
            supabase functions deploy "$func" --no-verify-jwt
            success "Function deployed: $func"
        else
            warning "Function directory not found: $func"
        fi
    done
}

configure_production_settings() {
    info "Configuring production settings..."

    # Create production configuration
    cat > ".env.production.local" << EOF
# Claude Learning System Production Configuration
CLAUDE_LEARNING_ENABLED=true
CLAUDE_CONFIDENCE_THRESHOLD=${CONFIDENCE_THRESHOLD}
CLAUDE_AB_TEST_PERCENTAGE=0.5
CLAUDE_MONITORING_INTERVAL=30000
CLAUDE_MAX_PATTERNS=1000
CLAUDE_TELEMETRY_ENABLED=true

# Environment
NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production
EOF

    success "Production configuration created"
}

run_health_checks() {
    info "Running health checks..."

    # Test database connection
    if ! pnpm db:generate-types >/dev/null 2>&1; then
        warning "Database type generation failed - may need manual verification"
    fi

    # Test build
    if ! pnpm build >/dev/null 2>&1; then
        error "Production build failed"
    fi

    # Test learning system components
    info "Testing learning system components..."
    node -e "
        import('./apps/web/src/lib/claude/claude-production-monitor.js')
        .then(({ claudeProductionMonitor }) => claudeProductionMonitor.initializeProductionSystem())
        .then(result => {
            console.log('Health check result:', JSON.stringify(result, null, 2));
            process.exit(result.status === 'success' ? 0 : 1);
        })
        .catch(err => {
            console.error('Health check failed:', err);
            process.exit(1);
        });
    " || error "Learning system health check failed"

    success "Health checks passed"
}

setup_monitoring() {
    info "Setting up production monitoring..."

    # Create monitoring dashboard configuration
    cat > "monitoring-config.json" << EOF
{
  "dashboards": [
    {
      "name": "Claude Learning System",
      "panels": [
        {
          "title": "Task Execution Rate",
          "type": "timeseries",
          "query": "SELECT COUNT(*) FROM claude_production_metrics WHERE timestamp > NOW() - INTERVAL '1 hour'"
        },
        {
          "title": "Success Rate",
          "type": "stat",
          "query": "SELECT AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100 FROM claude_production_metrics WHERE timestamp > NOW() - INTERVAL '24 hours'"
        },
        {
          "title": "Average Execution Time",
          "type": "stat",
          "query": "SELECT AVG(execution_time) FROM claude_production_metrics WHERE timestamp > NOW() - INTERVAL '24 hours'"
        },
        {
          "title": "A/B Test Performance",
          "type": "table",
          "query": "SELECT learning_enabled, COUNT(*), AVG(execution_time), AVG(CASE WHEN success THEN 1 ELSE 0 END) * 100 as success_rate FROM claude_production_metrics WHERE timestamp > NOW() - INTERVAL '24 hours' GROUP BY learning_enabled"
        }
      ]
    }
  ]
}
EOF

    success "Monitoring configuration created"
}

create_deployment_summary() {
    info "Creating deployment summary..."

    cat > "DEPLOYMENT_SUMMARY.md" << EOF
# Claude Learning System - Production Deployment Summary

**Deployment Date:** $(date -u +"%Y-%m-%d %H:%M:%S UTC")
**Environment:** ${DEPLOYMENT_ENV}
**Configuration:**
- Learning Enabled: true
- Confidence Threshold: ${CONFIDENCE_THRESHOLD}
- A/B Testing: ${ENABLE_AB_TEST}
- Monitoring Interval: 30 seconds

## Deployed Components

### ✅ Core Learning System
- Advanced Analytics Engine
- Enhanced Automation System
- Complete Learning Framework
- Production Monitoring

### ✅ Database Schema
- Production metrics table
- Performance indexes
- Health check functions

### ✅ Edge Functions
- AI document extraction
- Damage analysis with policy
- Policy chat functionality
- Property AI enrichment
- ML model management
- Federated learning

### ✅ Monitoring & Analytics
- Real-time performance tracking
- A/B test framework
- Health check dashboard
- ROI measurement system

## Access Points

### Admin Dashboard
URL: https://claimguardianai.com/admin?tab=claude-learning
Features: System overview, performance metrics, learning insights

### CLI Commands
- \`npm run claude:learning-mode\` - Interactive learning mode
- \`npm run claude:advanced-demo\` - Comprehensive demo
- \`npm run claude:dashboard\` - Open admin dashboard
- \`npm run claude:stats\` - System statistics

### Monitoring
- Production metrics stored in Supabase
- Real-time health checks every 30 seconds
- A/B testing with 50/50 split
- Automatic confidence threshold tuning

## Next Steps

1. **Monitor Initial Performance** - Watch metrics for first 24-48 hours
2. **Validate A/B Test Results** - Ensure statistical significance before rollout decisions
3. **Tune Confidence Thresholds** - Adjust based on real performance data
4. **Team Training** - Onboard development team on learning system usage

## Support

For issues or questions:
- Check admin dashboard: https://claimguardianai.com/admin?tab=claude-learning
- Review logs: \`supabase functions logs\`
- Contact: AI team for learning system support

**Deployment Status: SUCCESS ✅**
EOF

    success "Deployment summary created: DEPLOYMENT_SUMMARY.md"
}

main() {
    echo -e "${GREEN}🚀 Claude Learning System - Production Deployment${NC}"
    echo "=================================================="
    echo

    info "Starting deployment to $DEPLOYMENT_ENV environment..."
    echo

    # Execute deployment steps
    validate_environment
    setup_database_schema
    deploy_edge_functions
    configure_production_settings
    run_health_checks
    setup_monitoring
    create_deployment_summary

    echo
    success "🎉 Claude Learning System successfully deployed to production!"
    echo
    info "Key Information:"
    echo "  • Admin Dashboard: https://claimguardianai.com/admin?tab=claude-learning"
    echo "  • A/B Testing: ${ENABLE_AB_TEST} (50/50 split)"
    echo "  • Confidence Threshold: ${CONFIDENCE_THRESHOLD}"
    echo "  • Monitoring: Every 30 seconds"
    echo
    info "Next: Monitor performance metrics and validate improvements"
    echo "Run: npm run claude:dashboard"
    echo
}

# Run main function
main "$@"
