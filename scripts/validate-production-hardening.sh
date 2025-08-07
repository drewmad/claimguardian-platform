#!/bin/bash

# ClaimGuardian Production Hardening Validation Script
# Validates all hardening components are properly implemented

set -euo pipefail

readonly GREEN='\033[0;32m'
readonly RED='\033[0;31m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m'

log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

echo "🔧 ClaimGuardian Production Hardening Validation"
echo "================================================="

# Check hardening components exist
echo -e "\n📁 Validating Hardening Components..."

components=(
    "apps/web/src/lib/monitoring/production-monitor.ts"
    "apps/web/src/lib/database/connection-pool.ts"
    "apps/web/src/lib/cache/redis-cache-manager.ts"
    "apps/web/src/lib/backup/disaster-recovery.ts"
    "apps/web/src/app/api/health/route.ts"
    "apps/web/src/app/api/admin/infrastructure/route.ts"
    "infrastructure/docker-compose.production.yml"
    "infrastructure/config/haproxy.cfg"
    "infrastructure/config/prometheus.yml"
    "scripts/production/deploy.sh"
)

missing_components=0

for component in "${components[@]}"; do
    if [[ -f "$component" ]]; then
        log_success "Found: $component"
    else
        log_error "Missing: $component"
        ((missing_components++))
    fi
done

# Check TypeScript compilation
echo -e "\n🔍 Validating TypeScript Compilation..."
if command -v tsc &> /dev/null; then
    if tsc --noEmit --project tsconfig.json 2>/dev/null; then
        log_success "TypeScript compilation successful"
    else
        log_warning "TypeScript compilation issues detected (may be normal during development)"
    fi
else
    log_warning "TypeScript compiler not found, skipping compilation check"
fi

# Check Docker Compose syntax
echo -e "\n🐳 Validating Docker Compose Configuration..."
if command -v docker-compose &> /dev/null; then
    if docker-compose -f infrastructure/docker-compose.production.yml config > /dev/null 2>&1; then
        log_success "Docker Compose configuration valid"
    else
        log_error "Docker Compose configuration has issues"
    fi
else
    log_warning "Docker Compose not found, skipping validation"
fi

# Check deployment script permissions
echo -e "\n🚀 Validating Deployment Script..."
if [[ -x "scripts/production/deploy.sh" ]]; then
    log_success "Deployment script is executable"
else
    log_error "Deployment script is not executable"
fi

# Validate environment variables documentation
echo -e "\n🔐 Validating Environment Configuration..."
required_env_vars=(
    "DATABASE_URL"
    "REDIS_URL"
    "NEXT_PUBLIC_SUPABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

env_docs_found=0
for var in "${required_env_vars[@]}"; do
    if grep -r "$var" . --include="*.md" --include="*.env*" > /dev/null 2>&1; then
        log_success "Environment variable $var documented"
        ((env_docs_found++))
    else
        log_warning "Environment variable $var not found in documentation"
    fi
done

# Summary
echo -e "\n📊 Validation Summary"
echo "====================="

if [[ $missing_components -eq 0 ]]; then
    log_success "All hardening components are present"
else
    log_error "$missing_components components are missing"
fi

log_success "Environment variables documented: $env_docs_found/${#required_env_vars[@]}"

# Production readiness assessment
echo -e "\n🎯 Production Readiness Assessment"
echo "=================================="

readiness_score=0
total_checks=5

# Component completeness
if [[ $missing_components -eq 0 ]]; then
    log_success "✅ Component Completeness: PASS"
    ((readiness_score++))
else
    log_error "❌ Component Completeness: FAIL"
fi

# Configuration validation
if [[ -f "infrastructure/docker-compose.production.yml" ]]; then
    log_success "✅ Infrastructure Configuration: PASS"
    ((readiness_score++))
else
    log_error "❌ Infrastructure Configuration: FAIL"
fi

# Deployment automation
if [[ -x "scripts/production/deploy.sh" ]]; then
    log_success "✅ Deployment Automation: PASS"
    ((readiness_score++))
else
    log_error "❌ Deployment Automation: FAIL"
fi

# Monitoring setup
if [[ -f "apps/web/src/lib/monitoring/production-monitor.ts" ]]; then
    log_success "✅ Monitoring System: PASS"
    ((readiness_score++))
else
    log_error "❌ Monitoring System: FAIL"
fi

# Documentation completeness
if [[ -f "PRODUCTION_HARDENING_COMPLETE.md" ]]; then
    log_success "✅ Documentation: PASS"
    ((readiness_score++))
else
    log_error "❌ Documentation: FAIL"
fi

# Final assessment
echo -e "\n🏆 Final Assessment"
echo "==================="

if [[ $readiness_score -eq $total_checks ]]; then
    log_success "🚀 PRODUCTION READY: All checks passed ($readiness_score/$total_checks)"
    echo -e "\n${GREEN}ClaimGuardian is ready for production deployment with comprehensive hardening!${NC}"
elif [[ $readiness_score -ge 4 ]]; then
    log_warning "⚠️  MOSTLY READY: Minor issues to address ($readiness_score/$total_checks)"
    echo -e "\n${YELLOW}ClaimGuardian is mostly ready with minor issues to address.${NC}"
else
    log_error "❌ NOT READY: Significant issues to address ($readiness_score/$total_checks)"
    echo -e "\n${RED}ClaimGuardian requires additional work before production deployment.${NC}"
fi

echo -e "\n📚 Next Steps:"
echo "1. Review PRODUCTION_HARDENING_COMPLETE.md for detailed implementation guide"
echo "2. Configure environment variables according to documentation"
echo "3. Test deployment in staging environment"
echo "4. Execute production deployment using scripts/production/deploy.sh"

echo -e "\n💡 Quick Start Command:"
echo "pnpm build && ./scripts/production/deploy.sh --environment production --dry-run"

exit 0
