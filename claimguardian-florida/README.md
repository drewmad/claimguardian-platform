# ClaimGuardian Florida Data Platform

**Migration-ready architecture that runs on your current Vercel + Supabase stack, with clean paths to move later to dedicated Postgres, object storage, and alternate runtimes.**

## What this repository provides
- **Normalized Postgres + PostGIS schema** for 20M+ parcels with SCD2 and RLS
- **Deterministic ETL and orchestration** with Python workers and Temporal workflows  
- **Geographic intelligence engine** for address normalization and geocoding
- **Hurricane pattern analysis** and parcel impact correlation
- **Insurance carrier behavior** facts and predictors
- **API contracts and handlers** that fit Vercel serverless limits
- **Edge functions** for hot path lookups
- **Caching and MVT tiles** for maps with CDN
- **Monitoring, load testing, and cost controls**

## Run on Vercel + Supabase now, migrate later without churn
- Data and services are decoupled behind stable interfaces
- Storage access goes through a thin adapter so you can swap Supabase Storage with S3 or GCS
- Message bus adapters support NATS or Redpanda  
- Vector tiles can be served by the API or by pg_tileserv later
- Environment keys and connection strings are read from `.env` with the same names across platforms

---

## Prerequisites on macOS Apple Silicon
- **macOS 15**
- **Xcode Command Line Tools** - `xcode-select --install`  
- **Homebrew** - Install from brew.sh if not present
- **Required tools**
  ```bash
  brew install pnpm redis deno
  brew install supabase/tap/supabase
  # Docker Desktop recommended for containers
  ```
- **Optional tools** for parity  
  ```bash
  brew install nats-server
  ```

You can use either Supabase CLI local stack or our Docker Compose stack. **Do not run both at once.**

### Option A: Supabase CLI local stack
```bash
supabase start
```
This starts a local Postgres with PostGIS. Configure `.env` POSTGRES_URL to the printed connection string.

### Option B: Docker Compose stack (provided in infra/docker-compose.dev.yml)
```bash
docker compose -f infra/docker-compose.dev.yml up -d
```

## First setup

1. **Clone the repo**
   ```bash
   git clone <your-repo-url> && cd claimguardian-florida
   ```

2. **Copy env file and fill values**
   ```bash
   cp .env.example .env
   ```

3. **Install workspace deps**
   ```bash
   pnpm install
   ```

4. **Start infrastructure**
   - If using Supabase CLI: `supabase start`
   - If using Docker Compose: `docker compose -f infra/docker-compose.dev.yml up -d`

5. **Initialize the database**
   ```bash
   # Ensure Postgres is up, then apply SQL in order
   psql "$POSTGRES_URL" -f db/sql/000_init_extensions.sql
   psql "$POSTGRES_URL" -f db/sql/010_security_rls.sql  
   psql "$POSTGRES_URL" -f db/sql/020_core_entities.sql
   psql "$POSTGRES_URL" -f db/sql/030_partitions_indexes.sql
   psql "$POSTGRES_URL" -f db/sql/040_geospatial_functions.sql
   psql "$POSTGRES_URL" -f db/sql/050_mvt_tiles.sql
   psql "$POSTGRES_URL" -f db/sql/060_pii_encryption.sql
   psql "$POSTGRES_URL" -f db/sql/070_dp_policies.sql
   psql "$POSTGRES_URL" -f db/sql/080_seed_reference.sql
   ```

6. **Start services**
   ```bash
   # Starts orchestrator worker and API in parallel using Turbo
   pnpm dev
   ```

## Smoke tests

**Validate PostGIS is available**
```bash
psql "$POSTGRES_URL" -c "SELECT PostGIS_Full_Version();"
```

**Validate RLS is active on parcels**
```bash
psql "$POSTGRES_URL" -c "\\d+ parcels"
```
Confirm "Row security" shows "ON".

**API health checks** (after API service is running)
```bash
curl -i "http://localhost:3000/api/parcels/lookup?address=123%20Main%20St%20Port%20Charlotte%20FL"
curl -I "http://localhost:3000/api/tiles/parcels/10/171/396.mvt"
```

**Edge function hot path test** (Supabase)
```bash
supabase functions serve parcel-risk
```

## Project scripts

All packages use pnpm. Global scripts run across workspaces with Turbo.

- `pnpm dev` - run API and orchestrator in watch mode
- `pnpm build` - build all packages  
- `pnpm lint` - lint with ESLint and Prettier
- `pnpm typecheck` - TypeScript checks
- `pnpm test` - run tests across API and orchestrator

## Environment variables

`.env` keys used across the system:

- `POSTGRES_URL` - main Postgres + PostGIS connection
- `SUPABASE_DB_URL` - same as POSTGRES_URL or a Supabase connection
- `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` - for RLS-aware API routes
- `REDIS_URL` - caching and rate limiting  
- `TEMPORAL_ADDRESS` - workflows and activities
- `OBJECT_STORAGE_BUCKET` - parcel attachments and tiles
- `KMS_KEY_ID` - encryption
- `RATE_LIMIT_REDIS_PREFIX` - prevent key collisions
- `TILE_DATASET_VERSION` - cache busting and versioned tiles

## Migration plan at a glance

You can start on Vercel + Supabase today and move later with simple changes.

**Postgres**
- Start with Supabase Postgres.
- Migrate to dedicated Postgres by changing POSTGRES_URL.
- Schema and RLS remain the same.

**Object storage**  
- Start with Supabase Storage.
- Switch to S3 or GCS by updating the storage adapter configuration.
- Paths and object keys do not change.

**API hosting**
- Start on Vercel serverless.
- Move to a container host when long running routes or streaming tiles need dedicated resources.
- The HTTP contracts and handlers remain the same.

**Message bus**
- Start without an external bus if not needed.
- Enable NATS JetStream by setting NATS_URL and enabling the orchestrator publisher.

**Tiles**
- Start with dynamic ST_AsMVT and Redis cache.
- Add materialized tiles and pg_tileserv later.
- CDN keys include TILE_DATASET_VERSION for instant invalidation.

## Cost and performance levers

Tune without code changes.

**Partitions**
- Number of hash partitions for parcels and parcel_versions.
- Match to CPU cores on primary DB node.

**MVT generalization**
- Simplification tolerance increases at lower zoom levels.
- Balances tile size and visual quality.

**Redis TTLs**
- Hot parcel detail: 10 to 20 minutes
- Risk tiles near landfall: 1 to 5 minutes  
- Static reference tiles: 1 day

**Pre-warm scope**
- Pre-warm tiles and parcel caches for counties in the forecast cone.

**Index classes**
- BRIN on large append-only time series
- BTREE for lookup keys
- GIST for geometry

**Autovacuum**
- Lower cost delay and scale factors for heavy write tables.
- Schedule VACUUM (ANALYZE) after nightly ETL.

**ETL batch sizes**
- Batch inserts 10k to 50k rows.
- Parallelism limited by DB IOPS and CPU.

## Security and compliance

- **SOC 2 Type II** aligned controls documented in the repo
- **Column level encryption** for PII using pgcrypto
- **Row level security** policies across user facing tables
- **Differential privacy** for community metrics
- **KMS backed keys** for backups and object encryption

## Architecture assumptions and defaults

- **KMS provider:** AWS KMS
- **Bus:** NATS JetStream  
- **Address service:** libpostal locally with optional vendor hook
- **CDN:** Cloudflare
- **Tile strategy:** hybrid. Low zoom materialized, mid and high zoom dynamic with cache
- **Pilot counties:** Charlotte 12015, Sarasota 12115, Miami-Dade 12086

## Evaluation Rubric

- **Performance:** P95 latency and throughput targets met
- **Accuracy:** Geo validation above 99.9 percent
- **Automation:** No manual per-county scripts required  
- **Intelligence:** Risk and carrier insights are actionable and validated
- **Scalability:** 10x growth with no major re-architecture
- **Cost:** At least 50 percent reduction from baseline through partitioning and caching

---

## Strategic Context

This platform directly enables ClaimGuardian's unique value proposition:
- **7.5M Florida property owners** served with AI-driven claim optimization
- **$4M+ annual revenue** target through property intelligence
- **580% ROI** in Year 1 from dual consumer + government markets  
- **Only platform** combining insurance advocacy + emergency management

The Florida data pipeline transforms ClaimGuardian from a basic insurance tool into the comprehensive property intelligence system that powers your competitive advantage and financial projections.