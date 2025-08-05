#!/bin/bash

# Setup Automated Type Generation Script
# This script configures and tests the automated database type generation

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting Up Automated Type Generation${NC}"
echo -e "${BLUE}======================================${NC}"
echo ""

# Check if we're in the right directory
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}ERROR: Script must be run from project root directory${NC}"
    exit 1
fi

# Step 1: Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}ERROR: Supabase CLI is not installed${NC}"
    echo "Install with: brew install supabase/tap/supabase"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}ERROR: pnpm is not installed${NC}"
    echo "Install with: npm install -g pnpm@10.13.1"
    exit 1
fi

# Check if required environment variables are set
REQUIRED_VARS=(
    "SUPABASE_ACCESS_TOKEN"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var:-}" ]]; then
        MISSING_VARS+=("$var")
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    echo -e "${YELLOW}⚠️  Missing environment variables:${NC}"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    echo ""
    echo "To get your Supabase access token:"
    echo "1. Go to https://app.supabase.com/account/tokens"
    echo "2. Create a new token"
    echo "3. Set it as: export SUPABASE_ACCESS_TOKEN='your-token'"
    echo ""
fi

echo -e "${GREEN}✅ Prerequisites check complete${NC}"

# Step 2: Test type generation locally
echo ""
echo -e "${YELLOW}🧪 Testing type generation locally...${NC}"

cd apps/web

# Check if project is linked
if ! supabase projects list 2>/dev/null | grep -q "tmlrvecuwgppbaynesji"; then
    echo -e "${YELLOW}Linking to Supabase project...${NC}"
    supabase link --project-ref tmlrvecuwgppbaynesji
fi

# Generate types
echo -e "${BLUE}Generating types...${NC}"
if pnpm db:types; then
    echo -e "${GREEN}✅ Type generation successful${NC}"
else
    echo -e "${RED}ERROR: Type generation failed${NC}"
    exit 1
fi

cd ../..

# Step 3: Verify generated types
echo ""
echo -e "${YELLOW}🔍 Verifying generated types...${NC}"

TYPES_FILE="packages/db/src/types/database.types.ts"

if [[ -f "$TYPES_FILE" ]]; then
    echo -e "${GREEN}✅ Types file exists${NC}"
    echo "  Size: $(wc -c < "$TYPES_FILE") bytes"
    echo "  Lines: $(wc -l < "$TYPES_FILE")"
    
    # Check if it contains expected content
    if grep -q "export type Database" "$TYPES_FILE"; then
        echo -e "${GREEN}✅ Types file contains valid TypeScript definitions${NC}"
    else
        echo -e "${RED}ERROR: Types file doesn't contain expected content${NC}"
        exit 1
    fi
else
    echo -e "${RED}ERROR: Types file not found at $TYPES_FILE${NC}"
    exit 1
fi

# Step 4: Test TypeScript compilation
echo ""
echo -e "${YELLOW}🔨 Testing TypeScript compilation...${NC}"

if pnpm --filter @claimguardian/db type-check; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}ERROR: TypeScript compilation failed${NC}"
    echo "This might indicate issues with the generated types"
    exit 1
fi

# Step 5: Setup GitHub Actions secrets reminder
echo ""
echo -e "${YELLOW}📝 GitHub Actions Setup${NC}"
echo ""
echo "To enable automated type generation in GitHub Actions, ensure these secrets are set:"
echo ""
echo "1. SUPABASE_ACCESS_TOKEN"
echo "   - Get from: https://app.supabase.com/account/tokens"
echo "   - Set in: Repository Settings > Secrets and variables > Actions"
echo ""
echo "2. SUPABASE_DB_PASSWORD (optional)"
echo "   - Only needed if using direct database connection"
echo "   - Get from: Supabase project settings"
echo ""

# Step 6: Create local configuration
echo -e "${YELLOW}💾 Creating local configuration...${NC}"

CONFIG_FILE=".github/workflows/.type-generation.local"
cat > "$CONFIG_FILE" << EOF
# Local Type Generation Configuration
# Generated: $(date '+%Y-%m-%d %H:%M:%S')

PROJECT_ID=tmlrvecuwgppbaynesji
SCHEMAS=public,claims,properties
OUTPUT_FILE=packages/db/src/types/database.types.ts

# Run manually with:
# cd apps/web && pnpm db:types

# Run via GitHub Actions:
# gh workflow run generate-database-types.yml
EOF

echo -e "${GREEN}✅ Local configuration saved to $CONFIG_FILE${NC}"

# Step 7: Summary
echo ""
echo -e "${GREEN}✨ Automated Type Generation Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Configuration Summary:${NC}"
echo "  • Project ID: tmlrvecuwgppbaynesji"
echo "  • Schemas: public, claims, properties"
echo "  • Output: $TYPES_FILE"
echo "  • Workflow: .github/workflows/generate-database-types.yml"
echo ""
echo -e "${BLUE}🚀 Next Steps:${NC}"
echo "  1. Commit the new workflow file"
echo "  2. Set SUPABASE_ACCESS_TOKEN in GitHub Secrets"
echo "  3. Push to trigger the workflow"
echo "  4. Monitor Actions tab for execution"
echo ""
echo -e "${BLUE}🔄 Manual Commands:${NC}"
echo "  • Generate types: pnpm db:generate-types"
echo "  • Test workflow: gh workflow run generate-database-types.yml"
echo "  • View logs: gh run list --workflow=generate-database-types.yml"