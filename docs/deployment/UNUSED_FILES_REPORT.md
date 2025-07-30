# Unused Files Report

Generated on: 2025-07-28

## Summary

- **Total files scanned**: 203
- **Used files**: 146
- **Unused files**: 70 (34.5%)

## Unused Files by Category

### 1. Actions (Server Functions) - 8 files
These server action files are not being imported anywhere:

**apps/web/src/actions/**
- `ai-images.ts` - AI image generation actions
- `claims.ts` - Claim management actions
- `debug.ts` - Debug-related actions
- `demo.ts` - Demo data generation

**apps/web/src/actions/inventory/**
- `ai-analysis.ts` - AI inventory analysis
- `batch-import.ts` - Batch import functionality
- `documents.ts` - Document handling
- `index.ts` - Main inventory actions

### 2. Components - 24 files

**Layout Components** (apps/web/src/components/layout/)
- `bottom-nav.tsx` - Mobile bottom navigation
- `footer.tsx` - Layout footer
- `header.tsx` - Layout header
- `sidebar.tsx` - Sidebar navigation

**Modal Components** (apps/web/src/components/modals/)
- `add-asset-wizard.tsx` - Asset creation wizard
- `add-inventory-item-modal.tsx` - Inventory item modal
- `claim-wizard.tsx` - Claim creation wizard
- `profile-modal.tsx` - User profile modal
- `security-questions-modal.tsx` - Security questions
- `session-warning-modal.tsx` - Session timeout warning

**Screen Components** (apps/web/src/components/screens/)
- `asset-detail-screen.tsx` - Asset details view
- `asset-vault-screen.tsx` - Asset vault screen
- `claims-screen.tsx` - Claims management
- `damage-assessment-screen.tsx` - Damage assessment
- `home-screen.tsx` - Home dashboard

**AI Components** (apps/web/src/components/ai/)
- `ai-chat-button.tsx` - AI chat button
- `ai-chat-panel.tsx` - AI chat panel
- `camera-capture.tsx` - Camera capture component

**Other Components**
- `TestCard.tsx` - Test component
- `error-boundary.tsx` - Error boundary wrapper
- `admin/parcel-etl-monitor.tsx` - Parcel ETL monitoring
- `admin/property-scraper.tsx` - Property scraper admin
- `auth/auth-loading.tsx` - Auth loading state
- `auth/client-only-auth.tsx` - Client-only auth wrapper
- `forms/address-autocomplete.tsx` - Address autocomplete
- `ui/quick-settings-button.tsx` - Quick settings
- `ui/video-background.tsx` - Video background

### 3. Hooks - 8 files
Custom React hooks that are not being used:

**apps/web/src/hooks/**
- `use-error-handling.ts` - Error handling utilities
- `use-file-upload.ts` - File upload logic
- `use-form.ts` - Form management
- `use-legal-consent.ts` - Legal consent handling
- `use-modal.ts` - Modal state management
- `use-profile-settings.ts` - Profile settings
- `use-user-preferences.ts` - User preferences
- `use-wizard.ts` - Multi-step wizard logic

### 4. Library/Utilities - 8 files

**apps/web/src/lib/**
- `ai-ui-updater.ts` - AI UI pattern generator
- `supabase.ts` - Supabase client (duplicate?)
- `auth/legal-guard.tsx` - Legal consent guard
- `logger/enhanced-logger.ts` - Enhanced logging
- `logger/index.ts` - Logger utilities

**apps/web/src/utils/**
- `validation.ts` - Validation utilities

**apps/web/src/types/**
- `database-enhancements.ts` - Enhanced DB types

**apps/web/src/scripts/**
- `deploy-property-schema.ts` - Schema deployment
- `run-migration.ts` - Migration runner

### 5. Package Files - 16 files

**Package UI Components** (packages/ui/src/)
- `button.tsx` - Button component (duplicate?)
- `card.tsx` - Card component (duplicate?)
- `checkbox.tsx` - Checkbox component
- `icons.tsx` - Icon components
- `input.tsx` - Input component (duplicate?)
- `label.tsx` - Label component (duplicate?)
- `modal.tsx` - Modal component
- `utils.ts` - UI utilities

**Package Utilities** (packages/utils/src/)
- `format.ts` - Formatting utilities
- `validation.ts` - Validation utilities

**MCP Server Tools** (packages/mcp-server/src/tools/)
- `assessment.ts` - Assessment tools
- `claim.ts` - Claim tools
- `property.ts` - Property tools

**Config Files**
- `packages/ai-config/eslint.config.js`
- `packages/ui/eslint.config.js`
- `packages/utils/eslint.config.js`

**Database Types**
- `packages/db/src/types/database.types.ts` - Generated DB types

### 6. Other Files - 1 file
- `apps/web/src/app/error.tsx` - Global error page

## Recommendations

### High Priority Removals (Safe to Delete)
1. **Test/Demo files**: `TestCard.tsx`, `demo.ts`, `debug.ts`
2. **Duplicate UI components** in packages/ui/src/ that exist in apps/web
3. **Unused ESLint configs** in packages
4. **Unused hooks** that have no references

### Medium Priority (Review Before Removing)
1. **Screen components** - May be planned for future use
2. **Modal components** - Check if they're dynamically imported
3. **MCP server tools** - May be used by the MCP server runtime

### Low Priority (Keep for Now)
1. **Error handling files** - May be needed for production
2. **Auth-related components** - Security features
3. **Admin components** - May be conditionally imported

## Files with Unused Exports

Many files have exports that are never imported. Consider removing these unused exports to reduce bundle size:

- Action files with unused type exports
- Component files with unused prop types
- Utility files with unused helper functions

## Next Steps

1. **Backup first**: Create a branch before removing files
2. **Test thoroughly**: Ensure dynamic imports aren't affected
3. **Check lazy loading**: Some components might be lazy-loaded
4. **Review with team**: Some files might be planned for future features
5. **Update imports**: After removal, update any broken imports

## Command to Remove Files

To remove all unused files (use with caution):

```bash
# Create backup branch first
git checkout -b cleanup/remove-unused-files

# Remove files (example for a few safe ones)
rm apps/web/src/components/TestCard.tsx
rm apps/web/src/actions/demo.ts
rm apps/web/src/actions/debug.ts

# Review changes
git status

# Commit if everything works
git add -A
git commit -m "chore: Remove unused files"
```