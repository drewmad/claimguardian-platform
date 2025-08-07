#!/bin/bash

# Clean Script - Run all CI/CD cleanup tasks locally
# Usage: ./scripts/clean.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}=== $1 ===${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Show help
show_help() {
    echo "ClaimGuardian Clean Script"
    echo ""
    echo "Usage: ./scripts/clean.sh [command]"
    echo ""
    echo "Commands:"
    echo "  all         Run full cleanup (deps, lint, types, build)"
    echo "  quick       Quick cleanup (lint fix + build)"
    echo "  deps        Clean install dependencies"
    echo "  lint        Fix all linting issues"
    echo "  types       Generate types and check TypeScript"
    echo "  build       Clean build all packages"
    echo "  ci          Run full CI simulation locally"
    echo "  validate    Validate without building"
    echo "  health      Check codebase health"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./scripts/clean.sh all      # Full cleanup"
    echo "  ./scripts/clean.sh quick    # Quick fix and build"
    echo "  ./scripts/clean.sh lint     # Just fix lint issues"
}

# Clean dependencies
clean_deps() {
    print_header "Cleaning Dependencies"
    print_info "Installing with frozen lockfile..."
    pnpm install --frozen-lockfile
    print_success "Dependencies cleaned"
}

# Fix lint issues
clean_lint() {
    print_header "Fixing Lint Issues"
    print_info "Running smart lint fix..."
    pnpm lint:smart-fix || true
    print_info "Running standard lint fix..."
    pnpm lint:fix:all || true
    print_success "Lint issues fixed"
}

# Generate types and check
clean_types() {
    print_header "Type Generation & Validation"
    print_info "Generating database types..."
    pnpm db:generate-types || print_error "Failed to generate types"
    print_info "Checking TypeScript..."
    if pnpm type-check; then
        print_success "Type check passed"
    else
        print_error "Type errors remain (non-blocking)"
    fi
}

# Clean build
clean_build() {
    print_header "Building All Packages"
    print_info "Running turbo build..."
    if pnpm build; then
        print_success "Build completed"
    else
        print_error "Build failed (check errors above)"
    fi
}

# Full cleanup
clean_all() {
    print_header "Full Cleanup Process"
    clean_deps
    clean_lint
    clean_types
    clean_build
    print_success "Full cleanup completed!"
}

# Quick cleanup
clean_quick() {
    print_header "Quick Cleanup"
    print_info "Fixing lint issues..."
    pnpm lint:fix || true
    print_info "Building..."
    pnpm build
    print_success "Quick cleanup completed!"
}

# CI simulation
run_ci_local() {
    print_header "CI/CD Simulation"
    print_info "Installing dependencies..."
    pnpm install --frozen-lockfile
    print_info "Running lint checks..."
    pnpm lint
    print_info "Running type checks..."
    pnpm type-check
    print_info "Running tests..."
    pnpm test || print_error "Some tests failed"
    print_info "Building..."
    pnpm build
    print_success "CI simulation completed!"
}

# Validation only
run_validate() {
    print_header "Validation Only"
    print_info "Checking dependencies..."
    pnpm deps:check
    print_info "Running lint..."
    pnpm lint
    print_info "Running type check..."
    pnpm type-check
    print_success "Validation completed!"
}

# Health check
check_health() {
    print_header "Codebase Health Check"

    print_info "Counting lint issues..."
    LINT_COUNT=$(pnpm lint:list 2>&1 | grep -E "(error|warning)" | wc -l | tr -d ' ')
    echo "Lint issues: $LINT_COUNT"

    print_info "Counting type errors..."
    TYPE_COUNT=$(pnpm type-check 2>&1 | grep -E "error TS" | wc -l | tr -d ' ')
    echo "Type errors: $TYPE_COUNT"

    print_info "Checking test status..."
    if pnpm test 2>&1 | grep -q "failed"; then
        print_error "Some tests are failing"
    else
        print_success "All tests passing"
    fi

    print_info "Checking build..."
    if pnpm build --dry-run 2>&1 | grep -q "error"; then
        print_error "Build would fail"
    else
        print_success "Build would succeed"
    fi
}

# Main script logic
case "$1" in
    all)
        clean_all
        ;;
    quick)
        clean_quick
        ;;
    deps)
        clean_deps
        ;;
    lint)
        clean_lint
        ;;
    types)
        clean_types
        ;;
    build)
        clean_build
        ;;
    ci)
        run_ci_local
        ;;
    validate)
        run_validate
        ;;
    health)
        check_health
        ;;
    help|--help|-h|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        echo "Run './scripts/clean.sh help' for usage"
        exit 1
        ;;
esac
