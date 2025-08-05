# CLAUDE.md - ClaimGuardian Development Guide

This file provides comprehensive guidance for Claude Code when working with the ClaimGuardian codebase. It serves as a dynamic knowledge base incorporating Agent OS principles for spec-driven development.

## Table of Contents
- [User Preferences](#user-preferences-for-ai-assistant)
- [Claude Learning System](#-claude-learning-system-active---use-immediately)
- [Project Overview](#project-overview)
- [Architecture & Patterns](#architecture--code-patterns)
- [Development Workflow](#development-workflow)
- [Environment & Deployment](#environment-variables)
- [Supabase Architecture](#supabase-architecture--backend-setup)
- [Agent OS Integration](#agent-os-integration-for-spec-driven-workflows)
- [Project Status](#current-project-status--recent-improvements)

## User Preferences for AI Assistant

**Holistic Solution Approach**: 
- Stack multiple improvements together - don't provide single solutions, combine optimizations
- Consider the entire workflow, not just immediate issues  
- Layer optimizations: speed + parallelization + monitoring + verification
- Include automation scripts, progress tracking, and error handling
- Build in resilience with recovery options and clear status reporting

*Example*: For import speed improvements, combine: increased batch size + parallel processing + monitoring dashboard + verification script + one-command automation.

## 🧠 Claude Learning System (ACTIVE - USE IMMEDIATELY)

**IMPORTANT**: Claude Code must use this learning system for ALL significant tasks to improve over time.

### **Core Learning Workflow**

**BEFORE every major task:**
1. Query learning context: `claudeLearningContext.analyzeTask(context)`
2. Review recommendations and warnings
3. Apply suggested approaches from previous learnings

**DURING task execution:**
1. Log errors with full context using `claudeErrorHelpers`
2. Use appropriate helper functions for task type

**AFTER task completion/error resolution:**
1. Mark errors as resolved with `claudeErrorLogger.resolveError()`
2. Record lessons learned for future improvement

### **Mandatory Integration Points**

```typescript
// apps/web/src/lib/claude/claude-error-logger.ts - MAIN ERROR LOGGING
import { claudeErrorHelpers, claudeErrorLogger } from '@/lib/claude/claude-error-logger'

// apps/web/src/lib/claude/claude-learning-context.ts - PRE-TASK ANALYSIS  
import { claudeLearningContext, withLearningContext } from '@/lib/claude/claude-learning-context'
```

### **Required Usage Patterns**

**1. Code Generation Tasks:**
```typescript
// BEFORE: Check for learnings
const analysis = await claudeLearningContext.analyzeTask({
  taskType: 'code-generation',
  description: 'Create React component',
  codeLanguage: 'typescript',
  framework: 'react',
  tools: ['Write', 'Edit'],
  userIntent: 'Build functional component'
})

// Log recommendations
if (analysis.recommendations.length > 0) {
  console.log('🧠 Applying previous learnings:')
  analysis.recommendations.forEach(r => console.log(`- ${r.summary}`))
}

// DURING: If error occurs
try {
  // Code generation
} catch (error) {
  await claudeErrorHelpers.codeGeneration.syntaxError(
    error, filePath, 'typescript', taskDescription
  )
}
```

**2. File Modification Tasks:**
```typescript
// BEFORE: Always check context
const analysis = await claudeLearningContext.analyzeTask({
  taskType: 'file-modification',
  description: 'Edit component props',
  filePath: 'src/components/MyComponent.tsx',
  tools: ['Read', 'Edit'],
  userIntent: 'Fix prop types'
})

// DURING: Log edit failures
try {
  // File editing
} catch (error) {
  await claudeErrorHelpers.fileModification.editError(
    error, filePath, taskDescription, ['Read', 'Edit']
  )
}
```

**3. Analysis Tasks:**
```typescript
// Log analysis mistakes
await claudeErrorHelpers.analysis.misunderstanding(
  'Analyze user requirements',
  'Build correct solution',
  'assumption-based-error'
)
```

### **Error Resolution Protocol**

When fixing any error:
```typescript
await claudeErrorLogger.resolveError(
  errorId,
  'Specific solution that worked',
  'General lesson learned for future tasks'
)
```

### **🔍 Self-Reflection System - AUTOMATIC IMPROVEMENT**

Claude now has advanced self-reflection capabilities that automatically analyze approach efficiency:

**Core Self-Reflection Features:**
- **Efficiency Metrics**: Execution time, tool usage, error rates, resource utilization
- **Approach Analysis**: Identifies inefficiencies, better approaches, wasted steps
- **Learning Insights**: Extracts patterns, confirms/challenges assumptions
- **Automatic Triggers**: Reflects when errors > 2, time > 5min, tools > 5, etc.
- **Meta Learning**: Learns about learning - how to improve improvement

**Required Integration:**
```typescript
// METHOD 1: Complete Learning System (RECOMMENDED)
import { withCompleteLearning } from '@/lib/claude/claude-complete-learning-system'

const smartFunction = withCompleteLearning(
  'code-generation',
  'Create React component',
  'Build functional component',
  'User wants new component',
  { filePath: 'src/components/MyComponent.tsx', codeLanguage: 'typescript' },
  async () => {
    // Your code here
  }
)

// METHOD 2: Manual Reflection
import { claudeSelfReflection } from '@/lib/claude/claude-self-reflection'

const taskId = claudeSelfReflection.startReflection(
  'code-generation',
  'Create component',
  'Build UI',
  'User request',
  'Standard React approach'
)

// ... do work, log steps and errors ...

await claudeSelfReflection.completeReflection(true, 'excellent', 'high')

// METHOD 3: Auto-Reflection Triggers
import { autoReflect } from '@/lib/claude/claude-reflection-triggers'

const autoFunction = autoReflect('debugging', 'complex', originalFunction)
```

**Automatic Reflection Triggers:**
- High error rate (>2 errors)
- Long execution time (>5 minutes)  
- Many tools used (>5 tools)
- Complex task failures
- Excessive file access (>10 files)
- Successful but inefficient tasks

### **Learning Database Schema**

The system uses these database tables (already deployed):
- `claude_errors` - All Claude errors with full context
- `claude_learnings` - Learned patterns and solutions

### **Quick Commands**

```typescript
// Check recent learnings before any task
const learnings = await claudeErrorLogger.getRelevantLearnings({
  taskType: 'code-generation',
  codeLanguage: 'typescript'
})

// Get error patterns to understand common mistakes
const patterns = await claudeErrorLogger.getErrorPatterns('week')

// Wrap functions with automatic learning context
const smartFunction = withLearningContext(taskContext, originalFunction)
```

### **Dashboard Access**

Admin can monitor Claude's learning progress at:
```typescript
import { ClaudeLearningDashboard } from '@/components/admin/claude-learning-dashboard'
```

### **Learning Categories**

- **Task Types**: code-generation, file-modification, debugging, analysis, planning
- **Error Types**: syntax, logic, type, runtime, build, deployment, integration, assumption
- **Severity**: low, medium, high, critical

**⚠️ CRITICAL**: This system must be used for ALL significant Claude operations. Failure to log errors and apply learnings will result in repeated mistakes and reduced efficiency.

## Project Overview

ClaimGuardian is an AI-powered insurance claim advocacy platform for Florida property owners.

**Production**: https://claimguardianai.com | **Status**: Live, All builds passing

### Technology Stack
| Component | Technology | Version |
|-----------|------------|----------|
| **Runtime** | Node.js | 24.3.0 |
| **Package Manager** | pnpm | 10.13.1 |
| **Build System** | Turborepo | 2.5.4 |
| **Frontend** | Next.js (App Router) | 15.3.5 |
| **Language** | TypeScript | 5.8.3 |
| **Database** | PostgreSQL + PostGIS | 17.4.1.064 |
| **Backend** | Supabase (PostgREST, GoTrue, Storage, Realtime) | Latest |
| **AI Integration** | OpenAI, Google Generative AI | 4.73.0, 0.24.1 |
| **Testing** | Jest (web), Vitest (packages) | Latest |
| **Styling** | Tailwind CSS + Radix UI | 3.4.1 |
| **3D Graphics** | React Three Fiber (SSR-safe) | Latest |
| **Monitoring** | Sentry, Web Vitals | 8.46.0, 4.2.4 |

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
├── standards/             # Agent OS standards (NEW)
│   ├── best-practices.md  # Development philosophy
│   ├── code-style.md      # Code formatting rules
│   └── tech-stack.md      # Technology choices
├── .claude/               # Agent configurations (NEW)
│   └── agents/            # Subagent definitions
├── .agent-os/             # Agent OS workspace (generated)
│   ├── product/           # Product docs (mission, roadmap)
│   └── specs/             # Feature specifications
├── learnings.md           # Agent learning log
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

### Core Development Commands
```bash
# Development
pnpm dev                           # Start all apps (port 3000)
pnpm build                         # Build all packages
pnpm test                          # Run all tests (Vitest)
pnpm lint                          # ESLint all packages
pnpm type-check                    # TypeScript validation
pnpm ci:validate                   # Run all checks before commit

# Dependency Management
pnpm deps:check                    # Validate lockfile integrity
pnpm deps:update                   # Update dependencies interactively
pnpm deps:clean                    # Clean reinstall all dependencies
pnpm clean:all                     # Complete cleanup and rebuild

# Git Operations
pnpm cz                            # Commit with conventional format
HUSKY=0 git commit                 # Skip pre-commit hooks (use sparingly)
pnpm prepare                       # Setup git hooks
pnpm lint:smart-fix                # Auto-fix lint issues before commit
pnpm pre-commit:test               # Test pre-commit hooks manually

# Testing
pnpm test                          # All tests (Vitest)
pnpm --filter=web test             # Web app tests only (Jest)
pnpm --filter=web test:watch       # Watch mode
pnpm --filter=ai-services test     # AI services tests (Vitest)
pnpm test path/to/file.test.ts     # Specific test file

# Data & Database Operations
./scripts/data.sh import           # Parallel data import
./scripts/data.sh verify           # Verify import status
./scripts/data.sh clean            # Clean processed data
./scripts/db.sh schema dump        # Export current schema
./scripts/db.sh schema apply       # Apply schema changes
./scripts/db.sh backup             # Create database backup
pnpm db:generate-types             # Generate TypeScript types
```

**Auto-fix Lint System**: Pre-commit hooks automatically fix lint issues, re-stage files, and only fail on unfixable issues.

## Architecture & Code Patterns

### Monorepo Structure
```
/apps/web              # Next.js application
/packages/ui           # Shared React components
/packages/utils        # Shared utilities
/packages/config       # Shared configuration
/packages/ai-config    # AI configurations and prompts
/packages/ai-services  # Unified AI service orchestration
/packages/db           # Database models and Supabase client
/packages/monitoring   # Performance monitoring and analytics
/packages/realtime     # Real-time subscriptions and hooks
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

### AI Services Package (`@claimguardian/ai-services`)
Unified AI orchestration system with:
- **Multi-provider support**: OpenAI, Gemini, with provider switching
- **Cost tracking**: Token usage and expense monitoring
- **Semantic caching**: Redis-based intelligent response caching
- **Service orchestration**: Coordinated AI workflows
- **Monitoring dashboard**: Real-time AI operation visibility

### Main AI Tools Hub
- `/ai-tools/` - Central hub for all AI features
- Status indicators for API key availability
- Categories: analysis, assistance, documentation, communication

### AI Tools Suite
**Central Hub**: `/ai-tools/` with API key status indicators and categorized features

**Analysis Tools**:
- **Damage Analyzer** - Camera capture, image AI analysis
- **Settlement Analyzer** - Offer analysis, market comparisons  
- **3D Model Generator** - AI photogrammetry, React Three Fiber viewer
- **Proactive Claim Optimizer** - Predictive analysis, recommendations

**Assistance Tools**:
- **Policy Chat** - PDF parsing, interactive document chat
- **Claim Assistant** - Step-by-step guidance, progress tracking
- **Communication Helper** - Email templates, tone selection
- **Evidence Organizer** - Drag-and-drop, auto-categorization

**Documentation Tools**:
- **Document Generator** - Template-based AI generation
- **Receipt Scanner** - OCR processing, expense categorization
- **AR Damage Documenter** - AR-enhanced spatial documentation

### Camera Integration
- `CameraCapture` component for vision features
- Handles permissions and stream management
- Supports front/back camera switching

## Environment Variables

Required for development:
```bash
# Supabase Core
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_SECRET=

# AI Features (Server-side Edge Functions)
GEMINI_API_KEY=              # Google Gemini API
OPENAI_API_KEY=              # OpenAI API

# Email Services
RESEND_API_KEY=              # Resend email service
RESEND_FROM_EMAIL=           # Sender email address

# Optional Services
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=    # Google Maps API
SENTRY_AUTH_TOKEN=                   # Error monitoring
NEXT_PUBLIC_SENTRY_DSN=             # Client-side error tracking
```

## Performance Optimizations

### Bundle Analysis
- Run `ANALYZE=true pnpm build` to generate bundle analysis report
- View interactive visualization at http://localhost:8888
- Identifies large dependencies and opportunities for code splitting

### Code Splitting & Lazy Loading
- Heavy components use dynamic imports with lazy loading
- AI tools and feature-specific pages load on demand
- Reduces initial bundle size by ~40%

### Data Management
- React Query (TanStack Query) integrated for caching
- Automatic cache invalidation and background refetching
- Optimistic updates for better perceived performance

### Build Performance
- Bundle analyzer integrated in next.config.js (ANALYZE=true pnpm build)
- Optimized package imports for lucide-react, Radix UI, Framer Motion
- Image optimization with AVIF/WebP formats
- Turborepo caching for incremental builds
- Standalone Next.js output for optimal Vercel deployment

## Common Issues & Solutions

### Build Errors
- Type-check and ESLint enabled in production builds (errors will fail build)
- Progressive error handling in pre-commit hooks (warns but doesn't block)
- Use `HUSKY=0` to bypass pre-commit hooks only when absolutely necessary

### Import Issues
- Always import UI components from `@claimguardian/ui` root
- Local components for CardContent, CardHeader when needed
- Check `packages/ui/src/index.tsx` for available exports
- Fixed: BuildingIcon replaced with Building from lucide-react

### Missing Components
- Create in local `components/ui/` first if not in UI package
- Follow existing patterns (e.g., Label component)

### TypeScript Errors
- Temporary type definitions added to @claimguardian/db
- Database types will be auto-generated once schema stabilizes
- Use type assertions sparingly for rapid development

## Development Workflow

### Development Process

**Setup**: `./scripts/dev.sh setup` → `pnpm dev` → `pnpm type-check` → `pnpm build`

**Workflow Steps**:
1. **Before Changes**: 🧠 Query Claude learning context, check patterns, verify types, apply learnings
2. **During Development**: 🧠 Log errors with `claudeErrorHelpers`, incremental changes, frequent type-checking
3. **Before Committing**: 🧠 Resolve logged errors, validate with `pnpm ci:validate`, use conventional commits

**Key Commands**:
```bash
pnpm clean:all                     # Complete cleanup and rebuild
pnpm fix:all                       # Fix lint issues and rebuild  
pnpm health:check                  # Check lint and type error counts

# Claude Learning System Commands
node -e "import('@/lib/claude/claude-integration-example').then(m => m.showClaudeLearningStats())"
node -e "import('@/lib/claude/claude-integration-example').then(m => m.checkClaudeLearningsBeforeTask('code-generation', {language: 'typescript'}))"
```

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
./scripts/db.sh schema dump

# Apply schema changes
./scripts/db.sh schema apply

# Backup database
./scripts/db.sh backup

# Generate TypeScript types
pnpm db:generate-types
```

#### Database Architecture
- **Project ID**: `tmlrvecuwgppbaynesji` (US East region)
- **Schema Management**: Single `supabase/schema.sql` file (no migrations)
- **Security**: Row Level Security (RLS) for user-based access control
- **Real-time**: WebSocket subscriptions for live updates
- **GIS**: PostGIS extension for Florida parcel processing
- **Search**: Full-text indexing for documents and claims

### Edge Functions Architecture
ClaimGuardian leverages Deno Edge Functions for:

#### AI Processing Functions
1. **`ai-document-extraction`**: Extract data from insurance documents securely
2. **`analyze-damage-with-policy`**: AI-powered damage analysis with policy context
3. **ar-drone-processor`**: AR/drone imagery processing for property damage
4. **`extract-policy-data`**: Extract structured data from insurance policies
5. **`ocr-document`**: OCR processing for document digitization
6. **`policy-chat`**: Interactive chat with insurance policy documents
7. **`property-ai-enrichment`**: Enhance property data with AI insights
8. **`spatial-ai-api`**: Spatial analysis and GIS AI processing

#### Florida-Specific Functions
1. **`floir-extractor`**: Extract data from Florida insurance documents
2. **`floir-rag-search`**: RAG-based search across insurance regulations
3. **`florida-parcel-ingest`**: Process large-scale cadastral data imports
4. **`florida-parcel-monitor`**: Monitor and validate data import status
5. **`scrape-florida-parcels`**: County-specific parcel data scraping

#### ML Operations Functions
1. **`federated-learning`**: Distributed machine learning coordination
2. **`ml-model-management`**: Model versioning and deployment
3. **`environmental-data-sync`**: Environmental data integration
4. **`fetch-disaster-alerts`**: Real-time disaster monitoring
5. **`fetch-tidal-data`**: Coastal flood risk data integration
6. **`model_3d_generation`**: 3D model generation from photogrammetry

#### Security & Compliance Updates
- **Enhanced Input Validation**: All Edge Functions now include comprehensive input sanitization
- **Rate Limiting**: Implemented across all AI processing functions
- **CORS Security**: Strict origin validation for production environment
- **Audit Logging**: All AI operations logged with user context and IP tracking

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

**Service Versions**: Auth (GoTrue) 2.177.0, PostgREST 12.2.12, Postgres 17.4.1.064

### Schema Change Workflow
1. **Development**: Test changes in local environment
2. **Schema Update**: Run `./scripts/db.sh schema dump` to capture changes
3. **Version Control**: Commit updated `schema.sql` file
4. **Type Generation**: Run `pnpm db:generate-types` to update TypeScript definitions
5. **Deployment**: Apply via Supabase Dashboard to production
6. **Verification**: Validate with database lint checks

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
- Progressive lint fixes - Auto-fixes code style issues
- Type checking - Warns about type errors but doesn't block
- Database validation - Checks database state if Supabase is running
- Dependency synchronization - Ensures lockfile is current

## Performance & Monitoring

### Build Optimization
- Uses standalone Next.js output for Vercel deployment
- Type checking and ESLint enabled in production builds
- Incremental builds with Turborepo caching
- Package import optimization (Lucide React, Radix UI, Framer Motion)
- Progressive enhancement with pre-commit hooks

### Error Monitoring & Analytics
- **Sentry Integration**: Full-stack error tracking and performance monitoring
- **Custom Error Logging**: Database-backed error tracking with status management
- **Web Vitals**: Performance metrics collection
- **Security Headers**: HSTS, CSP, X-Frame-Options via Next.js middleware
- **Monitoring Package**: `@claimguardian/monitoring` for centralized analytics

### Deployment & CI/CD
- **Platform**: Vercel with optimized standalone builds
- **Build Command**: `turbo build` (monorepo-aware)
- **Install Strategy**: `pnpm install --no-frozen-lockfile`
- **Environment**: Production domain at claimguardianai.com
- **Database**: Hosted Supabase with connection pooling

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

## Agent OS Integration for Spec-Driven Workflows

Inspired by Agent OS, we use layered context: global standards/ folder, repo-specific .agent-os/product/ (generate via subagents), feature specs in .agent-os/specs/. Subagents query these for context; generate/update them.

- **Standards**: See standards/ folder (global, customizable).
- **Product Docs**: Mission, roadmap, decisions in .agent-os/product/.
- **Specs**: Dated folders in .agent-os/specs/ with SRD, tech spec, tasks.

Refinement: After tasks, subagents suggest updates to standards based on learnings.

### Slash Commands for Agent OS Workflows
```bash
/plan-product      # Generate product docs and roadmap
/create-spec       # Create feature specification
/execute-tasks     # Execute spec tasks with TDD
```

## Enhanced Adaptive Agent System (Claude Code CLI Optimized)

### Claude Code CLI Setup & Extensions
- Install: `pip install claude-code` (Python SDK).
- Config: Set `ANTHROPIC_API_KEY` env var.
- Init: `claude-code init --repo . --hooks` (auto-installs Git hooks).
- Subagents: Defined as native .md files in `.claude/agents/` (project-level).
- Management: Use `/agents` command for create/edit/delete; auto-delegates based on descriptions.
- Agent OS Setup: Run installation scripts from Agent OS repo; customize standards/.

### Centralized Error Log System
ClaimGuardian implements a comprehensive error tracking and learning system:

#### Error Handling Workflow
1. **Error Logging**: Use `/log_error <error_details>` to log errors in `.claude/errors/error_log.md`
2. **Error Analysis**: Use `/analyze_error <error_details>` for root cause analysis and agent learnings
3. **Subagent Integration**: Run `python subagent_error_system.py <agent_name> <task>` to start subagents with error context
4. **Learning Retrieval**: Subagents automatically load relevant learnings at startup

#### Error Log Structure
- **Centralized File**: `.claude/errors/error_log.md` stores all errors with timestamps, stack traces, and analysis
- **Agent-Based Learnings**: Each error includes subagent insights, fix recipes, and optimizations
- **Pattern Recognition**: System tracks error patterns for proactive prevention

#### Available Subagents
- `ui-developer`: Frontend React/TypeScript components
- `api-developer`: Backend API and server actions
- `database-admin`: Supabase schema and migrations
- `ai-developer`: AI features and Edge Functions
- `test-engineer`: Testing and quality assurance

#### Usage Examples
```bash
# Start subagent with error context
python subagent_error_system.py ui-developer "Fix Claims component rendering issue"

# Log an error manually
/log_error TypeError: Cannot read property 'map' of undefined at ClaimsList.tsx:45

# Analyze error with context
/analyze_error TypeError in ClaimsList during claims loading - API returned null
```

### Hooks Integration
Triggers for automation:
- Pre-commit: Invoke plan-orchestrator subagent to validate/optimize changes.
- Post-merge: Spawn data-import for schema sync.
- Error Detection: Auto-log errors during development and testing.

Setup: `claude-code hooks install`  # Adds to .git/hooks

### Local Docs as Dynamic Memory
- Subagents use Read tool to query sections of this file, standards/, and `.claude/errors/error_log.md` for context.
- Error learnings cached and filtered by agent type for relevant context.
- Learnings appended to error log via Write tool; queried on init for adaptation.

### Sub-Agents with Parallelism
- Native delegation: Automatic based on task match; explicit via "Use [name] subagent".
- Parallelism: Chain subagents for non-conflicting tasks.
- Conflict Avoidance: Prompts include checks via Grep/Glob and error log consultation.

### Learning Layer
- Record: Subagents use Write to append {task, mistake, learning} to error log.
- Retrieve: Use Read to query error log at start; adapt behavior based on previous failures.
- Refinement: Suggest updates to standards/ based on error patterns and learnings.

## Claude.md File Maintenance

### Periodic Update System
This main CLAUDE.md file should be updated to synchronize with package-specific claude.md files periodically to maintain consistency and capture latest architectural changes.

#### Update Triggers
- **Weekly**: Review and sync package-specific claude.md files during development cycles
- **After major features**: When significant changes are made to any package architecture
- **Before releases**: Ensure all documentation reflects current state before deployment
- **When tests are updated**: After major test infrastructure changes or new test patterns

#### Package Claude.md Files to Monitor
- `packages/ui/CLAUDE.md` - UI component patterns, design system updates
- `packages/ai-services/CLAUDE.md` - AI orchestration patterns, provider configurations
- `packages/realtime/CLAUDE.md` - Real-time subscription patterns, WebSocket management
- `packages/db/CLAUDE.md` - Database patterns, schema management, migration strategies
- `apps/web/src/app/auth/CLAUDE.md` - Authentication patterns, security practices
- `supabase/functions/CLAUDE.md` - Edge function patterns, deployment strategies

#### Update Process
1. **Scan package claude.md files** for architectural changes or new patterns
2. **Identify inconsistencies** between main file and package-specific documentation
3. **Merge updates** from packages into relevant sections of main CLAUDE.md
4. **Update version references** and dependency information if packages were updated
5. **Refresh examples** to reflect current best practices and patterns
6. **Validate against current codebase** to ensure accuracy

#### Maintenance Commands
```bash
# Check for claude.md files that need syncing
find . -name "CLAUDE.md" -o -name "claude.md" | head -10

# Review recent changes to package documentation
git log --oneline --since="1 week ago" -- "*/CLAUDE.md" "*/claude.md"

# Quick consistency check - look for version mismatches
grep -r "Next.js\|TypeScript\|Node.js" */CLAUDE.md */claude.md | sort | uniq
```

#### Auto-Sync Integration
Consider integrating periodic updates into the development workflow:
- Add claude.md sync check to pre-commit hooks for major changes
- Create monthly maintenance tasks to review and update documentation
- Use subagents to detect when package documentation drifts from main file

## Current Project Status

**Deployment**: ✅ Live at https://claimguardianai.com (Last: Aug 4, 2025)

**Recent Completions (Aug 2025)**:
- ML Operations Infrastructure with federated learning
- AI Services Unification with cost tracking and monitoring  
- 20+ specialized Edge Functions for AI processing
- Single schema.sql approach with automated type generation
- Progressive error handling with smart pre-commit hooks
- Real-time monitoring dashboard for AI operations
- 3D Model Generator with SSR-safe React Three Fiber

**Current Focus**: Type safety enhancement, testing coverage expansion, bundle optimization

**Architecture Highlights**: 8-package monorepo, AI-first design, real-time capabilities, Florida-specific tools

### Known Issues & Solutions

#### React Three Fiber SSR Compatibility
- **Issue**: `TypeError: Cannot read properties of undefined (reading 'ReactCurrentBatchConfig')`
- **Cause**: React Three Fiber components attempt to access browser APIs during SSR
- **Solution**: Use dynamic imports with `{ ssr: false }` for all R3F components
```typescript
const Canvas = dynamic(
  () => import('@react-three/fiber').then((mod) => mod.Canvas),
  { ssr: false }
)
```

#### Metadata Warnings
- **Issue**: "Unsupported metadata viewport/themeColor is configured in metadata export"
- **Cause**: Next.js 15 requires viewport and themeColor in separate viewport export
- **Status**: Non-blocking warnings, low priority fix

## 🧠 Claude Learning System - MANDATORY USAGE

**CRITICAL**: Use Complete Learning System for ALL significant tasks

**Preferred Method**:
```typescript
import { withCompleteLearning } from '@/lib/claude/claude-complete-learning-system'
const result = await withCompleteLearning(
  'code-generation', 'Create component', 'Build UI', 'User request',
  { filePath: 'src/file.tsx', codeLanguage: 'typescript' },
  async () => { /* your work */ }
)()
```

**Manual Method**: 
1. **BEFORE**: Query `claudeLearningContext.analyzeTask(context)`
2. **DURING**: Log errors with `claudeErrorHelpers`  
3. **AFTER**: Resolve with `claudeErrorLogger.resolveError()`
4. **REFLECT**: Use `claudeSelfReflection` or auto-triggers

**Key Files**: `claude-complete-learning-system.ts`, `claude-error-logger.ts`, `claude-learning-context.ts`, `claude-self-reflection.ts`, `claude-reflection-triggers.ts`

## General Instructions
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER proactively create documentation files unless explicitly requested