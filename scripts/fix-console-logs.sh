#!/bin/bash

# Fix console.log statements in production code
# This script replaces console.log/warn/error with proper logging

set -e

echo "🔍 Finding and fixing console statements in production code..."

# Count current console statements
TOTAL_CONSOLE=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -n "console\." | wc -l)
echo "Found $TOTAL_CONSOLE console statements"

# Create backup
echo "📦 Creating backup..."
cp -r apps/web/src apps/web/src.backup.$(date +%Y%m%d_%H%M%S)

# Function to add logger import if not exists
add_logger_import() {
    local file="$1"
    if ! grep -q "import.*logger.*from.*@/lib/logger/production-logger" "$file"; then
        # Find the last import line and add logger import after it
        sed -i '' '/^import/,/^$/{ /^$/i\
import { logger } from "@/lib/logger/production-logger"
}' "$file"
    fi
}

# Function to replace console statements
replace_console_statements() {
    local file="$1"
    echo "Processing: $file"
    
    # Add logger import
    add_logger_import "$file"
    
    # Replace different console methods
    sed -i '' -E '
        # Replace console.log with logger.info
        s/console\.log\(([^)]+)\)/logger.info(\1)/g
        
        # Replace console.warn with logger.warn  
        s/console\.warn\(([^)]+)\)/logger.warn(\1)/g
        
        # Replace console.error with logger.error
        s/console\.error\(([^)]+)\)/logger.error(\1)/g
        
        # Replace console.debug with logger.debug
        s/console\.debug\(([^)]+)\)/logger.debug(\1)/g
        
        # Replace console.info with logger.info
        s/console\.info\(([^)]+)\)/logger.info(\1)/g
    ' "$file"
}

# Process all TypeScript files
echo "🔧 Processing TypeScript files..."
find apps/web/src -name "*.ts" -o -name "*.tsx" | while read -r file; do
    # Skip test files and mock files
    if [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]] || [[ "$file" == *"__tests__"* ]] || [[ "$file" == *"__mocks__"* ]]; then
        continue
    fi
    
    # Check if file contains console statements
    if grep -q "console\." "$file"; then
        replace_console_statements "$file"
    fi
done

# Handle Edge Functions separately (they need different logging)
echo "🌐 Processing Edge Functions..."
find supabase/functions -name "*.ts" | while read -r file; do
    if grep -q "console\." "$file"; then
        echo "Processing Edge Function: $file"
        
        # For Edge Functions, replace console.log with structured logging
        sed -i '' -E '
            # Replace console.log with structured logging
            s/console\.log\(([^)]+)\)/console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "info", message: \1 }))/g
            
            # Replace console.warn with structured logging
            s/console\.warn\(([^)]+)\)/console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "warn", message: \1 }))/g
            
            # Replace console.error with structured logging  
            s/console\.error\(([^)]+)\)/console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: "error", message: \1 }))/g
        ' "$file"
    fi
done

# Count remaining console statements
REMAINING_CONSOLE=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -n "console\." | wc -l || echo "0")
EDGE_REMAINING=$(find supabase/functions -name "*.ts" | xargs grep -n "console\." | wc -l || echo "0")

echo "✅ Console statement cleanup complete!"
echo "📊 Before: $TOTAL_CONSOLE console statements"
echo "📊 After: $REMAINING_CONSOLE in web app, $EDGE_REMAINING in edge functions"
echo "💾 Backup created in apps/web/src.backup.*"

# Verify the changes work by checking imports
echo "🔍 Verifying logger imports..."
LOGGER_IMPORTS=$(find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "from.*@/lib/logger/production-logger" | wc -l)
echo "✅ Added logger imports to $LOGGER_IMPORTS files"

# Check for any remaining problematic console usage
echo "🚨 Checking for any remaining console usage in production files..."
find apps/web/src -name "*.ts" -o -name "*.tsx" | xargs grep -n "console\." | grep -v test | grep -v spec || echo "✅ No problematic console statements found"

echo "🎉 Console log cleanup complete! Remember to:"
echo "   1. Test that logging works in development"
echo "   2. Verify production logging is structured"
echo "   3. Update any remaining console.table, console.dir, etc. manually"
echo "   4. Remove backup folder after verification: rm -rf apps/web/src.backup.*"