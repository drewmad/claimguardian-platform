# Supabase Configuration

## Structure
- `/functions` - Edge Functions (Deno runtime for AI processing and business logic)
- `/migrations` - Active migrations only (historical migrations in /archives/)
- `/sql` - SQL utilities and schema management
  - `schema.sql` - Single source of truth for database schema
  - `/archived` - Historical SQL utilities
- `config.toml` - Supabase project configuration
- `seed.sql` - Initial seed data for development

## Architecture
ClaimGuardian uses Supabase's open-source architecture:
- **PostgreSQL 17.4.1.064** - Primary database with PostGIS for GIS data
- **PostgREST 12.2.12** - Auto-generated REST API from schema
- **GoTrue 2.177.0** - JWT-based authentication with RLS integration
- **Edge Functions** - Deno-based serverless functions for AI processing
- **Storage API** - S3-compatible file storage with PostgreSQL metadata

## Schema Management
We use a single `schema.sql` file approach to avoid CLI migration conflicts.

Use `./scripts/db.sh` for all database operations:
- `./scripts/db.sh schema dump` - Export current schema
- `./scripts/db.sh schema apply` - Apply schema changes
- `./scripts/db.sh backup` - Create database backup

## Edge Functions
Located in `/functions/`, these handle:
- AI processing (property enrichment, document extraction)
- Florida data ingestion and monitoring
- RAG-based search and analysis
- Business logic requiring server-side execution
EOF < /dev/null