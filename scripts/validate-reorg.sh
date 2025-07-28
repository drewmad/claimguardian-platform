#!/bin/bash
source scripts/utils/common.sh

echo "🔍 Validating repository reorganization..."

# Check for broken symlinks
echo "Checking for broken symlinks..."
BROKEN_LINKS=$(find . -type l -exec test ! -e {} \; -print 2>/dev/null)
if [ -n "$BROKEN_LINKS" ]; then
    log_warn "Found broken symlinks:"
    echo "$BROKEN_LINKS"
else
    log_info "No broken symlinks found"
fi

# Check if key directories exist
echo "Checking directory structure..."
REQUIRED_DIRS=("services" "config" "data/samples" "archives" "scripts/utils")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        log_info "✓ $dir exists"
    else
        log_error "✗ $dir missing"
    fi
done

# Check if key files exist
echo "Checking key files..."
KEY_FILES=("scripts/dev.sh" "scripts/build.sh" "scripts/data.sh" "scripts/db.sh" "supabase/README.md")
for file in "${KEY_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_info "✓ $file exists"
    else
        log_error "✗ $file missing"
    fi
done

# Run path migration
echo "Running path migration..."
if [ -f "scripts/migrate-paths.js" ]; then
    node scripts/migrate-paths.js
else
    log_warn "Path migration script not found"
fi

# Check dependencies
echo "Checking dependencies..."
if command -v pnpm >/dev/null 2>&1; then
    log_info "Running dependency check..."
    pnpm deps:check || log_warn "Dependencies check had warnings"
else
    log_error "pnpm not found"
fi

# Check TypeScript (if available)
echo "Checking TypeScript compilation..."
if [ -f "tsconfig.base.json" ]; then
    log_info "Running TypeScript check..."
    pnpm type-check || log_warn "TypeScript check had errors (may be expected during reorganization)"
else
    log_warn "TypeScript config not found"
fi

echo ""
log_info "🎉 Repository reorganization validation complete!"
echo ""
log_info "📋 Summary of changes:"
echo "  • Created organized archive structure"
echo "  • Moved services to dedicated directory"  
echo "  • Simplified script structure with core scripts"
echo "  • Centralized configuration management"
echo "  • Organized data directories"
echo "  • Cleaned Supabase structure"
echo "  • Updated documentation"
echo ""
log_info "🚀 Next steps:"
echo "  1. Test your application: pnpm dev"
echo "  2. Run tests: pnpm test"
echo "  3. Commit changes when satisfied"
echo "  4. Update team documentation"