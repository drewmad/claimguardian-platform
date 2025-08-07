#!/bin/bash

# Fix all remaining logger.error calls where Error is passed as string parameter
# The production logger expects: error(message: string, error?: Error | string | unknown, component?: string)

echo "Fixing all remaining logger.error calls in AI tools and API routes..."

# Fix AI tools pages
files=(
  "src/app/ai-tools/ar-damage-documenter/page.tsx"
  "src/app/ai-tools/claim-assistant/page.tsx"
  "src/app/ai-tools/communication-helper/page.tsx"
  "src/app/ai-tools/damage-analyzer/page.tsx"
  "src/app/ai-tools/document-generator/page.tsx"
  "src/app/ai-tools/inventory-scanner/page.tsx"
  "src/app/ai-tools/page-analyzer/page.tsx"
  "src/app/ai-tools/page.tsx"
  "src/app/ai-tools/settlement-analyzer/page.tsx"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    # Fix pattern: logger.error("message", error) -> logger.error("message", error.message)
    sed -i '' -E 's/logger\.error\(([^,]+), (error|e|err)\)/logger.error(\1, \2.message || String(\2))/g' "$file"
  fi
done

# Fix API routes
api_files=(
  "src/app/api/admin/ai-models/performance/route.ts"
  "src/app/api/admin/ai-models/route.ts"
  "src/app/api/admin/infrastructure/route.ts"
  "src/app/api/ai/chat/route.ts"
  "src/app/api/ai/track-usage/route.ts"
  "src/app/api/auth/clear-all-cookies/route.ts"
  "src/app/api/auth/debug/route.ts"
  "src/app/api/auth/fix-session/route.ts"
  "src/app/api/auth/session/route.ts"
  "src/app/api/auth/test-signin/route.ts"
  "src/app/api/create-test-account/route.ts"
  "src/app/api/debug/signup-test/route.ts"
  "src/app/api/health/route.ts"
  "src/app/api/legal/static/route.ts"
  "src/app/api/proxy/route.ts"
  "src/app/api/test-consent-flow/route.ts"
  "src/app/api/test-legal-docs/route.ts"
  "src/app/api/test-signup-flow/route.ts"
)

for file in "${api_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    sed -i '' -E 's/logger\.error\(([^,]+), (error|e|err)\)/logger.error(\1, \2.message || String(\2))/g' "$file"
  fi
done

# Fix auth components
auth_files=(
  "src/app/auth/signin/sign-in-form.tsx"
  "src/app/auth/signin/simple-sign-in-form.tsx"
  "src/app/auth/signup/multi-step-signup-form.tsx"
  "src/app/auth/social-connect/page.tsx"
)

for file in "${auth_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    sed -i '' -E 's/logger\.error\(([^,]+), (error|e|err)\)/logger.error(\1, \2.message || String(\2))/g' "$file"
  fi
done

# Fix dashboard pages
dashboard_files=(
  "src/app/dashboard/page.tsx"
  "src/app/dashboard/properties/[id]/page.tsx"
  "src/app/dashboard/property/[id]/page.tsx"
  "src/app/dashboard/property/page.tsx"
)

for file in "${dashboard_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    sed -i '' -E 's/logger\.error\(([^,]+), (error|e|err)\)/logger.error(\1, \2.message || String(\2))/g' "$file"
  fi
done

# Fix other pages
other_files=(
  "src/app/debug/page.tsx"
  "src/app/onboarding/property-setup/page.tsx"
)

for file in "${other_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    sed -i '' -E 's/logger\.error\(([^,]+), (error|e|err)\)/logger.error(\1, \2.message || String(\2))/g' "$file"
  fi
done

# Fix components
component_files=(
  "src/components/admin/enrichment-monitor.tsx"
  "src/components/admin/error-dashboard.tsx"
  "src/components/ai/ai-chat-interface.tsx"
  "src/components/ai/api-key-validator.tsx"
  "src/components/ai/camera-capture.tsx"
  "src/components/ai/enhanced-damage-analyzer.tsx"
  "src/components/auth/sign-out-button.tsx"
  "src/components/auth/simple-auth-provider.tsx"
  "src/components/camera/camera-capture.tsx"
  "src/components/claims/claim-creation-wizard.tsx"
  "src/components/claims/claim-timeline.tsx"
  "src/components/claims/evidence-manager.tsx"
  "src/components/compliance/florida-disclosures-modal.tsx"
  "src/components/damage/damage-analyzer-enhanced.tsx"
  "src/components/documents/document-extraction-review.tsx"
  "src/components/error/async-error-handler.tsx"
  "src/components/floir/FLOIRDashboard.tsx"
  "src/components/floir/FLOIRSearch.tsx"
  "src/components/florida/UnifiedFloridaSearch.tsx"
  "src/components/forms/AccountWizard.tsx"
  "src/components/forms/florida-address-form.tsx"
  "src/components/landing/pricing.tsx"
  "src/components/learning/learning-widget.tsx"
  "src/components/ocr/ocr-scanner.tsx"
  "src/components/onboarding/onboarding-flow.tsx"
)

for file in "${component_files[@]}"; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    sed -i '' -E 's/logger\.error\(([^,]+), (error|e|err)\)/logger.error(\1, \2.message || String(\2))/g' "$file"
  fi
done

echo "All logger.error calls have been fixed!"