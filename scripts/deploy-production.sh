#!/bin/bash

# Production Deployment Script
# Created: 2025-08-05
# Purpose: Deploy database fixes and admin dashboard improvements to production

set -e

echo "🚀 Starting production deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}Warning: You're not on the main branch. Current branch: $CURRENT_BRANCH${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. Apply database migration
echo -e "\n${GREEN}Step 1: Applying database migration...${NC}"
echo "Please apply the migration file manually in Supabase Dashboard:"
echo "1. Go to https://app.supabase.com/project/tmlrvecuwgppbaynesji/sql/new"
echo "2. Copy and paste the contents of: supabase/sql/20250805_production_fixes.sql"
echo "3. Click 'Run' to execute the migration"
echo ""
read -p "Press enter once you've applied the migration..."

# 2. Commit and push changes
echo -e "\n${GREEN}Step 2: Committing and pushing changes...${NC}"
git add -A
git commit -m "feat: Deploy admin dashboard improvements and database fixes

- Improved admin dashboard with sidebar navigation
- Fixed user_profiles RLS policies
- Added missing database tables and views
- Enhanced Claude Learning System
- Added AI cost tracking functionality

Production deployment 2025-08-05" || true

git push origin main

# 3. Trigger Vercel deployment
echo -e "\n${GREEN}Step 3: Deployment triggered on Vercel...${NC}"
echo "Vercel will automatically deploy from the main branch."
echo "Monitor deployment at: https://vercel.com/madengineerings-projects/claimguardian"

# 4. Post-deployment verification checklist
echo -e "\n${GREEN}Step 4: Post-deployment verification checklist:${NC}"
echo ""
echo "Once deployment is complete, verify these features on https://claimguardianai.com:"
echo ""
echo "[ ] 1. Sign in and check if welcome message shows first name"
echo "[ ] 2. Navigate to /admin and verify improved dashboard layout"
echo "[ ] 3. Check AI Cost Tracking tab in admin (may need to generate usage)"
echo "[ ] 4. Test policy document upload on a property"
echo "[ ] 5. Check Claude Learning System tab (test data should be visible)"
echo "[ ] 6. Verify no console errors in browser DevTools"
echo "[ ] 7. Test on mobile to ensure responsive design works"
echo ""
echo -e "${GREEN}✅ Deployment script completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Monitor Vercel deployment progress"
echo "2. Run through the verification checklist above"
echo "3. Check Supabase logs for any database errors"
echo ""
echo "If you encounter issues:"
echo "- Check Vercel build logs"
echo "- Review Supabase logs at: https://app.supabase.com/project/tmlrvecuwgppbaynesji/logs/explorer"
echo "- Roll back if necessary using Vercel's instant rollback feature"
