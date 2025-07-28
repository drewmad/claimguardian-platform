#!/bin/bash

# Automated ESLint fix script with safety checks
# This script progressively fixes lint issues while preserving functionality

set -e

echo "🔧 Starting automated ESLint fixes..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to fix specific types of issues
fix_category() {
  local category=$1
  local rule=$2
  local description=$3
  
  echo -e "\n${YELLOW}Fixing: ${description}${NC}"
  
  # Count issues before fix
  BEFORE=$(pnpm lint 2>&1 | grep -c "$rule" || true)
  
  if [ "$BEFORE" -eq 0 ]; then
    echo "✅ No issues found for $rule"
    return
  fi
  
  echo "Found $BEFORE issues with $rule"
  
  # Apply targeted fix
  case $category in
    "auto-fixable")
      pnpm eslint . --fix --rule "$rule: error" --no-eslintrc || true
      ;;
    "unused-vars")
      # Special handling for unused vars
      echo "Analyzing unused variables..."
      pnpm eslint . --fix --rule "@typescript-eslint/no-unused-vars: [\"error\", { \"argsIgnorePattern\": \"^_\", \"varsIgnorePattern\": \"^_\" }]" --no-eslintrc || true
      ;;
    "any-types")
      # Can't auto-fix, but can report
      echo "⚠️  'any' types require manual review - generating report..."
      pnpm eslint . --format json --rule "$rule: error" --no-eslintrc > lint-any-types-report.json || true
      ;;
  esac
  
  # Count issues after fix
  AFTER=$(pnpm lint 2>&1 | grep -c "$rule" || true)
  FIXED=$((BEFORE - AFTER))
  
  echo -e "${GREEN}Fixed $FIXED out of $BEFORE issues${NC}"
}

# Backup current state
echo "📦 Creating backup..."
git stash push -m "lint-fix-backup-$(date +%s)"

# Phase 1: Auto-fixable issues
echo -e "\n${GREEN}=== Phase 1: Auto-fixable Issues ===${NC}"
fix_category "auto-fixable" "react/no-unescaped-entities" "Unescaped entities"
fix_category "auto-fixable" "import/order" "Import ordering"
fix_category "auto-fixable" "quotes" "Quote consistency"
fix_category "auto-fixable" "semi" "Semicolon consistency"

# Phase 2: Unused variables (with patterns)
echo -e "\n${GREEN}=== Phase 2: Unused Variables ===${NC}"
fix_category "unused-vars" "@typescript-eslint/no-unused-vars" "Unused variables"

# Phase 3: Report on manual fixes needed
echo -e "\n${GREEN}=== Phase 3: Manual Review Required ===${NC}"
fix_category "any-types" "@typescript-eslint/no-explicit-any" "Explicit 'any' types"

# Run type check to ensure no breaking changes
echo -e "\n${YELLOW}Running type check...${NC}"
if pnpm type-check; then
  echo -e "${GREEN}✅ Type check passed${NC}"
else
  echo -e "${RED}❌ Type check failed - some fixes may have broken types${NC}"
  echo "Run 'git stash pop' to restore backup"
  exit 1
fi

# Generate summary report
echo -e "\n${GREEN}=== Summary Report ===${NC}"
pnpm lint --format compact > lint-report.txt 2>&1 || true

# Count remaining issues
TOTAL_REMAINING=$(grep -c "Error\|Warning" lint-report.txt || echo "0")
echo "Remaining issues: $TOTAL_REMAINING"

# Commit if successful
if [ "$TOTAL_REMAINING" -lt 100 ]; then
  echo -e "${GREEN}Great progress! Remaining issues are manageable.${NC}"
else
  echo -e "${YELLOW}Still many issues remaining. Consider running targeted fixes.${NC}"
fi

echo -e "\n✅ Lint fix complete! Check 'lint-report.txt' for remaining issues."