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

### Frontend Stack
- **Next.js 15.3.5**: React framework with App Router for file-based routing
- **TypeScript 5.8.3**: Type safety and enhanced developer experience
- **Turborepo**: Monorepo structure for scalable package management
- **pnpm 10.13.1**: Fast, efficient package manager
- **Node.js 22+**: Modern JavaScript runtime requirement

### Backend Architecture (Supabase)
- **PostgreSQL 17.4.1.064**: Primary database with PostGIS for geographic data
- **PostgREST 12.2.12**: Auto-generated REST API from database schema
- **GoTrue 2.177.0**: Authentication service with JWT and RLS integration
- **Deno Edge Functions**: Serverless functions for AI processing and business logic
- **Storage API**: S3-compatible file storage with PostgreSQL metadata
- **Realtime Engine**: WebSocket-based live updates and multiplayer features

## Repository Structure (Updated)

The repository has been reorganized for better maintainability:

```
ClaimGuardian/
├── apps/web/              # Next.js application
├── packages/              # Shared packages (ui, utils, db, ai-config, config)
├── services/              # External services
│   ├── scraper/           # Data scraping service
│   ├── integrations/      # Third-party integrations
│   └── workers/           # Background workers
├── supabase/              # Database & backend
│   ├── functions/         # Edge Functions (Deno)
│   ├── migrations/        # Active migrations only
│   ├── sql/               # SQL utilities (schema.sql is source of truth)
│   └── config.toml        # Supabase configuration
├── scripts/               # Simplified core scripts
│   ├── dev.sh             # Development utilities
│   ├── build.sh           # Build operations
│   ├── data.sh            # Data management
│   ├── db.sh              # Database operations
│   └── utils/             # Complex internal scripts
├── config/                # Centralized configuration
│   ├── environments/      # Environment-specific configs
│   ├── database/          # Database configurations
│   └── ci/                # CI/CD configurations
├── data/                  # Organized data
│   ├── samples/           # Sample datasets
│   ├── schemas/           # Data schemas
│   └── florida/           # Florida-specific data
├── archives/              # Historical files (gitignored contents)
└── [root configs]         # Essential configuration files only
```

## Essential Commands

### Core Script Operations (New)
```bash
# Development
./scripts/dev.sh setup     # Setup development environment
./scripts/dev.sh clean     # Clean build artifacts
./scripts/dev.sh lint      # Run smart lint fix

# Building
./scripts/build.sh all     # Build all packages
./scripts/build.sh web     # Build web app only
./scripts/build.sh packages # Build packages only

# Data Management
./scripts/data.sh import   # Import data with parallel processing
./scripts/data.sh verify   # Verify import completion
./scripts/data.sh clean    # Clean processed data

# Database Operations
./scripts/db.sh schema     # Manage database schema
./scripts/db.sh backup     # Create database backup
./scripts/db.sh migrate    # Apply migrations
```

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
# Simplified Data Operations (New Structure)
./scripts/data.sh import                       # Parallel data import
./scripts/data.sh verify                       # Verify import status
./scripts/data.sh clean                        # Clean processed data

# Advanced Data Processing (in utils)
./scripts/utils/data-import/run-parallel-import.sh              # Parallel data import
./scripts/utils/data-import/verify-import-complete.js           # Verify import status
./scripts/utils/data-import/benchmark-import-performance.sh     # Performance testing

# Property Data Processing
python ./scripts/utils/data-import/analyze_cadastral_gdb.py     # Analyze GDB files
node ./scripts/utils/data-import/import_cadastral_gdb.js        # Import cadastral data
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

## Supabase Architecture & Backend Setup

### Architecture Overview
ClaimGuardian uses Supabase's open-source architecture with these core components:

#### Core Services
- **PostgreSQL 17.4.1.064**: Primary database with full privileges and Row Level Security (RLS)
- **PostgREST 12.2.12**: Auto-generated RESTful API from database schema
- **GoTrue 2.177.0**: JWT-based authentication with PostgreSQL RLS integration  
- **Storage API**: S3-compatible object storage for property images and documents
- **Edge Functions**: Deno runtime for AI processing and custom business logic
- **Kong Gateway**: API gateway managing all service access

#### Integration Pattern
```typescript
// Next.js app connects via @supabase/supabase-js
import { createClient } from '@supabase/supabase-js'

// Direct PostgreSQL access for complex GIS queries
// Real-time subscriptions for live updates
// Server actions for database operations
```

### Database Management

#### Single Schema File Approach
We use a single `supabase/schema.sql` file instead of migrations to avoid CLI conflicts.

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

#### Key Database Features
- **Row Level Security (RLS)**: User-based data access control
- **Real-time Subscriptions**: Live updates for claims and property changes
- **PostGIS Extension**: Geographic data processing for Florida parcels
- **Full-text Search**: Document and claim content indexing

### Project Configuration
- **Project ID**: `tmlrvecuwgppbaynesji`
- **Schema file**: `supabase/schema.sql` (single source of truth)
- **No migrations folder**: All archived to avoid CLI conflicts
- **Region**: US East (closest to Florida data sources)

### Edge Functions Architecture
ClaimGuardian leverages Deno Edge Functions for:

#### AI Processing Functions
1. **`floir-extractor`**: Extract data from Florida insurance documents
2. **`floir-rag-search`**: RAG-based search across insurance regulations
3. **`property-ai-enrichment`**: Enhance property data with AI insights
4. **`florida-parcel-ingest`**: Process large-scale cadastral data imports
5. **`florida-parcel-monitor`**: Monitor and validate data import status

#### Function Development Pattern
```typescript
// Edge Function structure
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req: Request) => {
  // AI processing logic
  // Database operations via service role
  // Return structured responses
})
```

### Service Versions & Compatibility
- **Auth (GoTrue)**: 2.177.0 - JWT tokens, user management
- **PostgREST**: 12.2.12 - Auto-generated API from schema
- **Postgres**: 17.4.1.064 - Latest with PostGIS for GIS operations
- **Realtime**: Latest - WebSocket connections for live updates
- **Storage**: Latest - File uploads with metadata in Postgres

### Schema Change Workflow
1. **Development**: Test changes in local environment
2. **Schema Update**: Run `./scripts/db-schema.sh dump` to capture changes
3. **Version Control**: Commit updated `schema.sql` file
4. **Deployment**: Apply via Supabase Dashboard to production
5. **Verification**: Validate with `./scripts/db-schema.sh validate`

### Data Architecture Principles
Following Supabase's design philosophy:
- **PostgreSQL as Single Source of Truth**: All data in one ACID-compliant database
- **API Auto-generation**: Schema drives API structure automatically  
- **Real-time by Default**: Live updates without additional infrastructure
- **Security via RLS**: Row-level permissions enforce data access rules
- **Extensibility**: Custom functions for Florida-specific business logic

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