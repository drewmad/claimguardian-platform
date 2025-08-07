#!/bin/bash

# Verify all Edge Functions are working correctly
set -euo pipefail

echo "🔍 Verifying all Edge Functions..."
echo "================================="
echo ""

cd /Users/madengineering/ClaimGuardian/supabase/functions

# Find all Edge Functions
FUNCTIONS=$(find . -name "index.ts" -type f | grep -v node_modules | sed 's|./||' | sed 's|/index.ts||' | sort)

TOTAL=0
PASSING=0
FAILING=0

echo "📋 Edge Functions Status:"
echo ""

for func in $FUNCTIONS; do
    TOTAL=$((TOTAL + 1))
    echo -n "  $func... "

    if deno check --no-lock "$func/index.ts" >/dev/null 2>&1; then
        echo "✅"
        PASSING=$((PASSING + 1))
    else
        echo "❌"
        FAILING=$((FAILING + 1))

        # Show first few lines of error
        echo "    Error: $(deno check --no-lock "$func/index.ts" 2>&1 | head -1 | sed 's/.*ERROR]: //')"
    fi
done

echo ""
echo "📊 Summary:"
echo "  Total functions: $TOTAL"
echo "  Passing: $PASSING"
echo "  Failing: $FAILING"

if [ $FAILING -eq 0 ]; then
    echo ""
    echo "🎉 All Edge Functions are passing TypeScript validation!"
else
    echo ""
    echo "⚠️  $FAILING functions still have TypeScript errors"
fi
