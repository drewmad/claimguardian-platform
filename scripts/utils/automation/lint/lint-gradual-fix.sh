#!/bin/bash

# Gradual lint fixing strategy
# Fixes issues file by file to avoid overwhelming changes

set -e

echo "🎯 Starting gradual lint fixes..."

# Configuration
MAX_FILES_PER_RUN=5
TARGET_PATTERN="${1:-apps/web/src/**/*.tsx}"

# Find files with most lint errors
echo "📊 Analyzing files with most lint issues..."

# Run ESLint and capture output
pnpm eslint "$TARGET_PATTERN" --format json > lint-analysis.json 2>/dev/null || true

# Parse results and find top offenders
node -e "
const results = require('./lint-analysis.json');
const fileErrors = results
  .filter(f => f.errorCount > 0 || f.warningCount > 0)
  .map(f => ({
    file: f.filePath,
    errors: f.errorCount,
    warnings: f.warningCount,
    total: f.errorCount + f.warningCount
  }))
  .sort((a, b) => b.total - a.total)
  .slice(0, $MAX_FILES_PER_RUN);

console.log('\\nTop $MAX_FILES_PER_RUN files with issues:');
fileErrors.forEach((f, i) => {
  console.log(\`\${i + 1}. \${f.file.split('/').pop()} - \${f.errors} errors, \${f.warnings} warnings\`);
});

// Write files to process
require('fs').writeFileSync(
  'files-to-fix.txt',
  fileErrors.map(f => f.file).join('\\n')
);
"

# Process each file
echo -e "\n🔧 Fixing files..."

while IFS= read -r file; do
  echo -e "\n📄 Processing: $(basename "$file")"

  # Count issues before
  BEFORE=$(pnpm eslint "$file" --format compact 2>&1 | grep -c ":" || echo "0")

  # Apply fixes in order of safety

  # 1. Safe auto-fixes
  pnpm eslint "$file" --fix \
    --rule "react/no-unescaped-entities: error" \
    --rule "quotes: error" \
    --rule "semi: error" \
    --rule "comma-dangle: error" \
    --rule "import/order: error" \
    2>/dev/null || true

  # 2. Handle unused vars by prefixing with underscore
  pnpm eslint "$file" --fix \
    --rule "@typescript-eslint/no-unused-vars: error" \
    2>/dev/null || true

  # 3. Add type annotations for common patterns
  if grep -q "any" "$file"; then
    echo "  ⚠️  Found 'any' types - requires manual review"
    # Create a TODO comment for manual fixes
    sed -i '' 's/: any/: any \/\/ TODO: Replace with proper type/g' "$file" 2>/dev/null || \
    sed -i 's/: any/: any \/\/ TODO: Replace with proper type/g' "$file"
  fi

  # Count issues after
  AFTER=$(pnpm eslint "$file" --format compact 2>&1 | grep -c ":" || echo "0")

  echo "  ✅ Fixed $((BEFORE - AFTER)) issues ($(basename "$file"))"

done < files-to-fix.txt

# Type check changed files
echo -e "\n🔍 Type checking modified files..."
if git diff --name-only | xargs -I {} pnpm tsc --noEmit {} 2>/dev/null; then
  echo "✅ Type check passed"
else
  echo "⚠️  Some type errors - review changes carefully"
fi

# Summary
echo -e "\n📊 Summary:"
echo "- Files processed: $MAX_FILES_PER_RUN"
echo "- Changes made: $(git diff --numstat | wc -l) files"
echo -e "\nRun 'git diff' to review changes"
echo "Run 'pnpm lint:report' for detailed remaining issues"

# Cleanup
rm -f lint-analysis.json files-to-fix.txt
