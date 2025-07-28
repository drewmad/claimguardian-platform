# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## User Preferences for AI Assistant

- **Stack multiple improvements together** - Don't just provide one solution, combine optimizations
- **Holistic problem-solving** - Consider the entire workflow, not just the immediate issue
- **Layer optimizations** - Combine speed + parallelization + monitoring + verification
- **Provide complete solutions** - Include automation scripts, progress tracking, and error handling
- **Build in resilience** - Add recovery options, clear status reporting, and fallback methods
- **Maximize efficiency** - Think beyond quick fixes to comprehensive, production-ready solutions

Example: When asked to speed up imports, don't just make batches bigger. Instead: increase batch size + add parallel processing + create monitoring dashboard + include verification script + provide one-command automation.

## Project Overview

ClaimGuardian is an AI-powered insurance claim advocacy platform for Florida property owners built with:
- Next.js 15.3.5 (App Router)
- TypeScript 5.8.3
- Turborepo monorepo structure
- Supabase for backend
- pnpm 10.13.1 package manager
- Node.js 22+ requirement

## Essential Commands

### Development
```bash
pnpm dev            # Start all apps (port 3000)
pnpm build          # Build all packages
pnpm test           # Run all tests (Jest)
pnpm lint           # ESLint all packages
pnpm type-check     # TypeScript validation
pnpm validate       # Run all checks before commit
```

### Dependency Management
```bash
pnpm deps:check     # Validate lockfile integrity
pnpm deps:update    # Update dependencies interactively
pnpm deps:clean     # Clean reinstall all dependencies
pnpm fix:imports    # Fix @claimguardian/ui and @claimguardian/db imports
```

### Git Operations
```bash
pnpm cz             # Commit with conventional format
HUSKY=0 git commit  # Skip pre-commit hooks (use sparingly)
pnpm prepare        # Setup git hooks
pnpm lint:smart-fix # Auto-fix lint issues before commit
```

### Auto-fix Lint Issues
The pre-commit hook now automatically attempts to fix lint issues before rejecting commits:
1. Runs ESLint auto-fix on all fixable issues
2. Applies targeted fixes for common problems
3. Re-stages fixed files automatically
4. Only fails if unfixable issues remain

To test: `pnpm pre-commit:test`

### Testing
```bash
pnpm test                          # All tests
pnpm --filter=web test             # Web app tests only
pnpm --filter=web test:watch       # Watch mode
pnpm test path/to/file.test.ts     # Specific test file
```

### Data Management
```bash
# Florida Cadastral Data Import
./scripts/run-parallel-import.sh              # Parallel data import
./scripts/verify-import-complete.js           # Verify import status
./scripts/benchmark-import-performance.sh     # Performance testing

# Property Data Processing
python scripts/analyze_cadastral_gdb.py       # Analyze GDB files
node scripts/import_cadastral_gdb.js          # Import cadastral data
```

## Architecture & Code Patterns

### Monorepo Structure
```
/apps/web           # Next.js application
/packages/ui        # Shared React components
/packages/utils     # Shared utilities
/packages/config    # Shared configuration
/packages/ai-config # AI configurations
/packages/db        # Database models and Supabase client
```

### Import Rules
```typescript
// ✅ CORRECT - Always from package root
import { Button, Card } from '@claimguardian/ui'
import { formatDate } from '@claimguardian/utils'

// ❌ WRONG - Never from subpaths
import { Button } from '@claimguardian/ui/button'
```

### File Organization (apps/web)
```
/actions/           # Server actions ('use server' - async only)
/lib/               # Client utilities
  /_utils/          # Pure utility functions
/components/        # React components
/app/               # App Router pages
  /ai-tools/        # AI feature pages
  /ai-augmented/    # Legacy AI pages
```

### Server Actions Pattern
```typescript
// All server actions use object parameters
export async function createClaim({ 
  propertyId, 
  damageType 
}: CreateClaimParams) {
  try {
    // Implementation
    return { data: result, error: null }
  } catch (error) {
    return { data: null, error: error.message }
  }
}
```

### Component Patterns
- Components from `@claimguardian/ui` export from root index
- Use `CardContent, CardHeader` from local components when not in UI package
- Dark theme: bg-gray-800 cards with border-gray-700
- Consistent spacing: p-6 for page containers

## AI Features Architecture

### Main AI Tools Hub
- `/ai-tools/` - Central hub for all AI features
- Status indicators for API key availability
- Categories: analysis, assistance, documentation, communication

### AI Tools Pages
1. **Damage Analyzer** (`/ai-augmented/damage-analyzer/`)
   - Camera capture integration
   - Image upload with AI analysis
   
2. **Policy Chat** (`/ai-augmented/policy-chat/`)
   - PDF parsing
   - Gemini integration

3. **Claim Assistant** (`/ai-tools/claim-assistant/`)
   - Step-by-step guidance
   - Progress tracking

4. **Document Generator** (`/ai-tools/document-generator/`)
   - Template-based generation
   - AI content assistance

5. **Communication Helper** (`/ai-tools/communication-helper/`)
   - Email/message templates
   - Tone selection

6. **Settlement Analyzer** (`/ai-tools/settlement-analyzer/`)
   - Offer analysis
   - Market comparisons

7. **Evidence Organizer** (`/ai-tools/evidence-organizer/`)
   - Drag-and-drop upload
   - Auto-categorization

8. **3D Model Generator** (`/ai-augmented/3d-model-generator/`)
   - Photogrammetry simulation
   - Multi-image processing

### Camera Integration
- `CameraCapture` component for vision features
- Handles permissions and stream management
- Supports front/back camera switching

## Environment Variables

Required for development:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Features (Optional)
NEXT_PUBLIC_GEMINI_API_KEY=
NEXT_PUBLIC_OPENAI_API_KEY=

# Google Maps API (Optional - for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# Monitoring (Optional)
SENTRY_AUTH_TOKEN=
NEXT_PUBLIC_SENTRY_DSN=
```

## Common Issues & Solutions

### Build Errors
- Type-check is disabled in web app build
- Tests may have type errors but build succeeds
- Use `HUSKY=0` to bypass pre-commit if build passes but lint has warnings

### Import Issues
- Always import UI components from `@claimguardian/ui` root
- Local components for CardContent, CardHeader when needed
- Check `packages/ui/src/index.tsx` for available exports

### Missing Components
- Create in local `components/ui/` first if not in UI package
- Follow existing patterns (e.g., Label component)

## Development Workflow

1. **Before Making Changes**
   - Check existing patterns in similar files
   - Verify function signatures before modifying calls
   - Read actual type definitions, don't assume

2. **During Development**
   - Make incremental changes
   - Run `pnpm type-check` frequently
   - Test with `pnpm dev` to see changes

3. **Before Committing**
   - Run `pnpm validate` to check all validations
   - Run `pnpm lint` and fix issues
   - Ensure `pnpm build` succeeds
   - Use `pnpm cz` for conventional commits
   - Use `HUSKY=0` only if build passes but lint has minor warnings

## Domain Context

ClaimGuardian helps Florida property owners with insurance claims:
- **Properties**: Digital twins of physical properties
- **Claims**: Insurance claim tracking
- **Damage Assessments**: Photo documentation
- **AI Tools**: Automated assistance for claim processes

Focus areas:
- Hurricane and flood damage documentation
- Florida-specific insurance regulations
- Property damage assessment and documentation
- Claims negotiation support

## Supabase Connection & Database Setup

### Single Schema File Approach
We use a single `supabase/schema.sql` file instead of migrations to avoid CLI conflicts.

### Database Management
```bash
# View current schema
cat supabase/schema.sql

# Update schema from production
./scripts/db-schema.sh dump

# Apply schema (opens dashboard and copies to clipboard)
./scripts/db-schema.sh apply

# Compare local vs production
./scripts/db-schema.sh diff

# Validate schema file
./scripts/db-schema.sh validate
```

### Project Reference
- Project ID: `tmlrvecuwgppbaynesji`
- Schema file: `supabase/schema.sql` (single source of truth)
- No migrations folder - all archived

### Service Versions
- **Auth**: 2.177.0
- **PostgREST**: 12.2.12
- **Postgres**: 17.4.1.064 (Latest)

### Making Schema Changes
1. Test changes in development/staging
2. Dump updated schema: `./scripts/db-schema.sh dump`
3. Commit the updated `schema.sql` file
4. Apply to other environments via dashboard

## Pre-commit Hooks

Husky runs these checks automatically:
- `pnpm deps:check` - Validates lockfile integrity
- `pnpm lint` - ESLint checks
- `pnpm type-check` - TypeScript validation

## Performance & Monitoring

### Build Optimization
- Uses standalone Next.js output for Vercel deployment
- Type checking disabled during build for speed
- Incremental builds with Turborepo caching
- Package import optimization (Lucide React)

### Error Monitoring
- Sentry integration for error tracking and performance
- Audit logging middleware (currently disabled)
- Security headers via Next.js middleware
- Rate limiting implementation

## Code Documentation

Add JSDoc-style `@fileMetadata` headers to new/modified files:
```typescript
/**
 * @fileMetadata
 * @purpose Brief description of file purpose
 * @owner team-name
 * @status active|deprecated
 */
```

## Data Processing Pipeline

### Florida-Specific Data Integration
- **Cadastral Data**: Large-scale GIS dataset processing with parallel imports
- **Property Scraping**: Automated collection of Florida property information
- **Performance Monitoring**: Benchmarking tools for import operations
- **Verification Scripts**: Automated validation of data completeness

### Processing Patterns
- Batch processing with configurable chunk sizes
- Parallel execution for large datasets
- Progress tracking and status reporting
- Error recovery and retry mechanisms