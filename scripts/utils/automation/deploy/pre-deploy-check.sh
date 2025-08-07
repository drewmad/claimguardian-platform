#!/bin/bash

# Pre-deployment checks to prevent common deployment failures
# This script ensures the codebase is deployment-ready

set -e

echo "🚀 Running pre-deployment checks..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check a condition
check() {
  local description=$1
  local command=$2

  echo -ne "${BLUE}Checking ${description}...${NC} "

  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC}"
    return 0
  else
    echo -e "${RED}✗${NC}"
    return 1
  fi
}

# Track failures
FAILED=0

# 1. Check lockfile is in sync
if ! check "lockfile synchronization" "node scripts/sync-lockfile.js --check"; then
  echo -e "${YELLOW}  → Run 'pnpm lockfile:sync' to fix${NC}"
  FAILED=1
fi

# 2. Check dependencies are installed
if ! check "dependencies installed" "pnpm list --depth 0"; then
  echo -e "${YELLOW}  → Run 'pnpm install' to fix${NC}"
  FAILED=1
fi

# 3. Check build succeeds
if ! check "build succeeds" "pnpm build"; then
  echo -e "${YELLOW}  → Fix build errors before deploying${NC}"
  FAILED=1
fi

# 4. Check for uncommitted changes
if ! check "no uncommitted changes" "git diff --quiet && git diff --cached --quiet"; then
  echo -e "${YELLOW}  → Commit or stash changes before deploying${NC}"
  FAILED=1
fi

# 5. Check environment variables
echo -ne "${BLUE}Checking environment variables...${NC} "
MISSING_VARS=()

# Required vars for deployment
REQUIRED_VARS=(
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    MISSING_VARS+=("$var")
  fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
  echo -e "${GREEN}✓${NC}"
else
  echo -e "${RED}✗${NC}"
  echo -e "${YELLOW}  → Missing: ${MISSING_VARS[*]}${NC}"
  FAILED=1
fi

# 6. Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 22 ]; then
  echo -e "${RED}Node.js version must be 22 or higher (current: $(node -v))${NC}"
  FAILED=1
fi

# Summary
echo ""
if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All deployment checks passed!${NC}"
  echo -e "${BLUE}Ready to deploy to production.${NC}"
  exit 0
else
  echo -e "${RED}❌ Deployment checks failed!${NC}"
  echo -e "${YELLOW}Please fix the issues above before deploying.${NC}"
  exit 1
fi
