#!/bin/bash

# Verify Edge Functions Security
echo "Verifying Edge Function Security..."
echo ""

# Check for wildcard CORS
echo "Checking for wildcard CORS headers..."
grep -r "Access-Control-Allow-Origin.*\*" supabase/functions/*/index.ts | grep -v "_templates" | grep -v "_shared" || echo "✅ No wildcard CORS found"

echo ""
echo "Checking for ALLOWED_ORIGINS..."
for func in ai-document-extraction analyze-damage-with-policy extract-policy-data policy-chat send-email; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "ALLOWED_ORIGINS" "supabase/functions/$func/index.ts"; then
      echo "✅ $func has ALLOWED_ORIGINS"
    else
      echo "❌ $func missing ALLOWED_ORIGINS"
    fi
  fi
done

echo ""
echo "Checking for security headers..."
for func in ai-document-extraction analyze-damage-with-policy extract-policy-data policy-chat send-email; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "X-Frame-Options" "supabase/functions/$func/index.ts"; then
      echo "✅ $func has security headers"
    else
      echo "❌ $func missing security headers"
    fi
  fi
done
