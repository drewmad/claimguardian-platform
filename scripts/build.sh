#!/bin/bash
# =============================================================================
# ClaimGuardian Build Script - Production Deployment Support
# =============================================================================
# Purpose: Build and verify ClaimGuardian for production deployment
# Usage: ./scripts/build.sh <command> [options]
# =============================================================================

set -euo pipefail

# Import common utilities
source scripts/utils/common.sh 2>/dev/null || {
    # Fallback if common.sh doesn't exist
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
    log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
    log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
    log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
    check_project_root() { [[ -f "package.json" ]] || { log_error "Run from project root"; exit 1; }; }
}

check_project_root

# Build verification function
verify_build() {
    log_info "🔍 Verifying production build readiness..."

    local verification_failed=false

    # 1. Environment validation
    log_info "Checking environment variables..."
    local required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
    )

    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "Missing required environment variable: $var"
            verification_failed=true
        fi
    done

    # 2. Dependencies check
    log_info "Checking dependencies..."
    if [[ ! -d "node_modules" ]]; then
        log_warn "Dependencies not installed, running install..."
        pnpm install
    fi

    # 3. Type checking
    log_info "Running TypeScript type check..."
    if ! timeout 120s pnpm type-check; then
        log_error "TypeScript compilation failed"
        verification_failed=true
    fi

    # 4. Linting
    log_info "Running code quality checks..."
    if ! timeout 60s pnpm lint; then
        log_error "Linting failed"
        verification_failed=true
    fi

    # 5. Build test
    log_info "Testing build process..."
    local build_start=$(date +%s)
    if ! timeout 300s pnpm build; then
        log_error "Build process failed"
        verification_failed=true
    else
        local build_end=$(date +%s)
        local build_time=$((build_end - build_start))
        log_info "✅ Build completed in ${build_time}s"

        if [[ $build_time -gt 300 ]]; then
            log_warn "Build time exceeds 5 minutes (${build_time}s)"
        fi
    fi

    # 6. Bundle size check
    log_info "Checking bundle sizes..."
    if [[ -d "apps/web/.next" ]]; then
        local bundle_size=$(du -sh apps/web/.next 2>/dev/null | cut -f1 || echo "unknown")
        log_info "Next.js bundle size: $bundle_size"
    fi

    # 7. Security check
    log_info "Running basic security checks..."
    if grep -r "sk-" . --exclude-dir=node_modules --exclude-dir=.git | grep -v ".env.example" | head -1 > /dev/null; then
        log_error "Potential API keys found in code"
        verification_failed=true
    fi

    # 8. Database schema validation
    if [[ -f "scripts/utils/database/db-validate.sh" ]]; then
        log_info "Validating database schema..."
        if ! ./scripts/utils/database/db-validate.sh > /tmp/schema_validation_$$.log 2>&1; then
            log_warn "Database schema validation failed (check /tmp/schema_validation_$$.log)"
        fi
    fi

    # Results
    if [[ "$verification_failed" == "true" ]]; then
        log_error "❌ Build verification FAILED - fix issues before deploying"
        return 1
    else
        log_info "🎉 Build verification PASSED - ready for production deployment!"

        # Display deployment checklist
        cat << EOF

🚀 PRODUCTION DEPLOYMENT CHECKLIST:
=====================================
✅ Build verification passed
✅ TypeScript compilation successful
✅ Code quality checks passed
✅ Bundle generated successfully
✅ Security scan clean

NEXT STEPS:
1. Deploy to production environment
2. Run smoke tests
3. Monitor application metrics
4. Begin beta user onboarding

EOF
        return 0
    fi
}

# Build optimization function
optimize_build() {
    log_info "🚀 Optimizing build for production..."

    # Clean previous builds
    log_info "Cleaning previous builds..."
    rm -rf apps/web/.next
    rm -rf packages/*/dist
    rm -rf .turbo

    # Optimize dependencies
    log_info "Optimizing dependencies..."
    pnpm install --frozen-lockfile --prefer-offline

    # Build with optimizations
    log_info "Building with production optimizations..."
    NODE_ENV=production pnpm build

    # Generate bundle analysis
    if command -v npx &> /dev/null; then
        log_info "Generating bundle analysis..."
        cd apps/web && npx @next/bundle-analyzer || log_warn "Bundle analysis failed"
        cd ../..
    fi

    log_info "✅ Build optimization completed"
}

# Analyze build performance
analyze_build() {
    log_info "📊 Analyzing build performance..."

    # Build timing
    local start_time=$(date +%s)
    pnpm build
    local end_time=$(date +%s)
    local total_time=$((end_time - start_time))

    # Size analysis
    if [[ -d "apps/web/.next" ]]; then
        echo "📦 Bundle Analysis:"
        echo "=================="
        du -sh apps/web/.next/static 2>/dev/null | sed 's/^/Static files: /' || echo "Static files: N/A"
        du -sh apps/web/.next 2>/dev/null | sed 's/^/Total build: /' || echo "Total build: N/A"
    fi

    # Performance metrics
    echo ""
    echo "⏱️  Build Performance:"
    echo "===================="
    echo "Total build time: ${total_time}s"
    echo "Target build time: <300s"

    if [[ $total_time -lt 300 ]]; then
        log_info "✅ Build performance within target"
    else
        log_warn "⚠️  Build time exceeds 5-minute target"
    fi
}

# Usage information
usage() {
    cat << EOF
ClaimGuardian Build Script

USAGE:
    $0 <command> [options]

COMMANDS:
    all         Build all packages and apps
    web         Build web application only
    packages    Build shared packages only
    verify      Verify build readiness for production
    optimize    Build with production optimizations
    analyze     Analyze build performance and size
    clean       Clean all build artifacts

OPTIONS:
    --verbose   Show detailed output
    --profile   Profile build performance

EXAMPLES:
    $0 verify                  # Verify production readiness
    $0 all                     # Standard build
    $0 optimize               # Production-optimized build
    $0 analyze                # Build with performance analysis

EOF
}

# Main command handler
case "${1:-help}" in
    all)
        log_info "Building all packages and apps..."
        pnpm build
        ;;
    web)
        log_info "Building web application..."
        pnpm --filter=web build
        ;;
    packages)
        log_info "Building shared packages..."
        turbo build --filter="./packages/*"
        ;;
    verify)
        verify_build
        ;;
    optimize)
        optimize_build
        ;;
    analyze)
        analyze_build
        ;;
    clean)
        log_info "Cleaning build artifacts..."
        rm -rf apps/web/.next
        rm -rf packages/*/dist
        rm -rf .turbo
        rm -rf node_modules/.cache
        log_info "✅ Build artifacts cleaned"
        ;;
    help|--help)
        usage
        ;;
    *)
        log_error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
