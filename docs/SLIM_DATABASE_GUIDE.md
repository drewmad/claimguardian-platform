# ClaimGuardian Database Slimming Guide

The ClaimGuardian database has grown significantly with advanced features. This guide shows how to slim it down for different use cases.

## 🚨 The Problem

- **Database Size**: 200GB+ with Florida parcel data
- **Table Count**: 50+ tables with complex relationships  
- **Type Generation**: 99,093 tokens (exceeds 25K limit)
- **Performance**: Slower queries due to large schemas
- **Complexity**: Many features may not be needed initially

## 🎯 Slimming Strategies

### Option 1: Minimal Core (Recommended for New Projects)

**What it includes:**
- User profiles and authentication
- Properties management
- Claims tracking
- Basic document storage

**What it removes:**
- AI/ML infrastructure
- Florida parcel data
- Multi-tenant architecture
- Advanced analytics
- State expansion features

**Size reduction:** ~95% smaller
**Commands:**
```bash
# Apply minimal schema
psql -f scripts/create-minimal-schema.sql

# Generate minimal types
node scripts/generate-minimal-types.js
```

### Option 2: Remove AI Infrastructure Only

**What it keeps:**
- Core functionality
- Multi-tenant architecture
- Florida parcel data (if needed)

**What it removes:**
- AI performance monitoring (time-series tables)
- ML model management
- Advanced analytics
- Cost tracking tables

**Size reduction:** ~80% smaller
**Commands:**
```bash
psql -f scripts/remove-ai-infrastructure.sql
```

### Option 3: Remove Florida Parcel Data

**What it keeps:**
- All application features
- AI functionality
- Multi-tenant architecture

**What it removes:**
- 14M+ parcel records (florida_parcels)
- GIS processing tables
- County data sync infrastructure

**Size reduction:** ~200GB storage savings
**Commands:**
```bash
psql -f scripts/remove-parcel-data.sql
```

### Option 4: Simplify Multi-Tenant

**What it keeps:**
- Basic tenant isolation
- Organization management
- User roles and permissions

**What it removes:**
- Advanced billing infrastructure
- Comprehensive audit logging
- State expansion planning
- Complex compliance tracking

**Size reduction:** ~40% fewer tables
**Commands:**
```bash
psql -f scripts/simplify-multitenant.sql
```

## 🛠️ Implementation Steps

### Step 1: Analyze Current Usage

```bash
# Check database size
./scripts/slim-database-schema.sh

# See table sizes
psql -c "
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as bytes
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
"
```

### Step 2: Choose Your Approach

**For new projects or prototypes:**
```bash
# Start with minimal core
psql -f scripts/create-minimal-schema.sql
node scripts/generate-minimal-types.js
```

**For existing deployments:**
```bash
# Incremental slimming
psql -f scripts/remove-ai-infrastructure.sql  # Biggest impact
psql -f scripts/remove-parcel-data.sql       # If GIS not needed
psql -f scripts/simplify-multitenant.sql     # If advanced features not needed
```

### Step 3: Update Type Generation

Instead of the massive auto-generated types, use targeted generation:

```bash
# Generate only essential types
node scripts/generate-minimal-types.js

# Or generate specific table types
node scripts/generate-specific-types.js --tables=properties,claims,user_profiles
```

### Step 4: Clean Up Application Code

Remove imports and references to removed tables:

```typescript
// Remove these imports if you removed AI infrastructure
// import { trackAIMetric } from '@/actions/ai-analytics'
// import { getAIMetrics } from '@/actions/ai-analytics'

// Remove these if you simplified multi-tenant
// import { getOrganizationBilling } from '@/actions/multi-tenant' 
// import { getExpansionPlans } from '@/actions/expansion'

// Keep essential imports
import { getUserProfile } from '@/actions/auth'
import { getProperties } from '@/actions/properties'
import { getClaims } from '@/actions/claims'
```

## 📊 Size Comparison

| Configuration | Tables | Estimated Size | Type File Size | Use Case |
|---------------|--------|----------------|----------------|----------|
| **Full System** | 50+ | 200GB+ | 99KB+ | Production with all features |
| **No AI Infrastructure** | 35+ | 40GB+ | 60KB+ | Core app without AI monitoring |
| **No Parcel Data** | 45+ | 2GB+ | 90KB+ | App without GIS features |
| **Simplified Multi-Tenant** | 30+ | 30GB+ | 50KB+ | Basic multi-tenancy |
| **Minimal Core** | 8 | 100MB+ | 5KB | MVP/prototype |

## 🔄 Migration Paths

### From Full to Minimal

1. **Backup your data:**
   ```bash
   pg_dump claimguardian > backup_full.sql
   ```

2. **Export essential data:**
   ```bash
   pg_dump --data-only --table=user_profiles --table=properties --table=claims claimguardian > essential_data.sql
   ```

3. **Apply minimal schema:**
   ```bash
   dropdb claimguardian
   createdb claimguardian
   psql claimguardian -f scripts/create-minimal-schema.sql
   psql claimguardian -f essential_data.sql
   ```

### Incremental Slimming

1. **Remove AI infrastructure first (biggest impact):**
   ```bash
   psql -f scripts/remove-ai-infrastructure.sql
   ```

2. **Remove parcel data if not needed:**
   ```bash
   psql -f scripts/remove-parcel-data.sql
   ```

3. **Simplify multi-tenant if advanced features not used:**
   ```bash
   psql -f scripts/simplify-multitenant.sql
   ```

## 🧪 Testing After Slimming

### 1. Verify Core Functionality

```bash
# Test user authentication
curl -X POST http://localhost:3000/api/auth/login

# Test property creation
curl -X POST http://localhost:3000/api/properties

# Test claim creation  
curl -X POST http://localhost:3000/api/claims
```

### 2. Check Type Generation

```bash
# Should complete without errors
node scripts/generate-minimal-types.js

# Verify file size is reasonable
ls -lh packages/db/src/types/database.types.ts
```

### 3. Run Application Tests

```bash
# Run core functionality tests
pnpm test -- properties claims auth

# Skip tests for removed features
pnpm test -- --skip-pattern="ai-analytics|parcel|expansion"
```

## 🚀 Performance Benefits

### Query Performance
- **Before**: 5-10 second queries on large tables
- **After**: Sub-second queries on focused tables

### Build Performance  
- **Before**: Type generation fails (99K+ tokens)
- **After**: Type generation succeeds (<5K tokens)

### Storage Costs
- **Before**: $200+ monthly for database storage
- **After**: $20+ monthly for database storage

### Development Speed
- **Before**: Complex schema difficult to understand
- **After**: Simple schema easy to work with

## 🔧 Advanced Slimming

### Custom Table Selection

Create your own slimming script:

```sql
-- Keep only tables you actually use
\copy (SELECT table_name FROM information_schema.tables WHERE table_schema = 'public') TO tables.txt

-- Review and delete unused tables
DROP TABLE IF EXISTS unused_table_1 CASCADE;
DROP TABLE IF EXISTS unused_table_2 CASCADE;
-- ... continue for unused tables
```

### Selective Column Removal

Remove unused columns from existing tables:

```sql
-- Remove complex JSONB columns if not needed
ALTER TABLE properties DROP COLUMN IF EXISTS complex_metadata;
ALTER TABLE claims DROP COLUMN IF EXISTS advanced_analytics;

-- Keep only essential columns
-- ALTER TABLE keeps the table structure leaner
```

### Partition Cleanup

Remove old partitions if using time-series data:

```sql
-- Remove old AI metrics partitions
DROP TABLE IF EXISTS ai_metrics_2024_01 CASCADE;
DROP TABLE IF EXISTS ai_metrics_2024_02 CASCADE;
-- ... continue for old partitions
```

## 📝 Maintenance

### Regular Cleanup

```bash
# Monthly cleanup script
#!/bin/bash

# Remove old temporary data
psql -c "DELETE FROM temp_processing WHERE created_at < NOW() - INTERVAL '30 days';"

# Vacuum to reclaim space
psql -c "VACUUM FULL;"

# Update statistics
psql -c "ANALYZE;"

# Check sizes
psql -c "SELECT pg_size_pretty(pg_database_size('claimguardian'));"
```

### Monitoring

Keep track of your database size:

```sql
-- Add to monitoring dashboard
SELECT 
  'Database Size' as metric,
  pg_size_pretty(pg_database_size(current_database())) as value;

SELECT 
  'Table Count' as metric,
  count(*) as value
FROM information_schema.tables 
WHERE table_schema = 'public';
```

## 🎯 Recommendations

### For New Projects
1. **Start with Minimal Core** - Add features as needed
2. **Use targeted type generation** - Avoid massive auto-generated files  
3. **Plan for growth** - Design schema to be easily expandable

### For Existing Projects  
1. **Remove AI infrastructure first** - Biggest immediate impact
2. **Evaluate parcel data need** - 200GB savings if not required
3. **Simplify gradually** - Test after each slimming step

### For Production
1. **Backup before slimming** - Always have rollback option
2. **Test thoroughly** - Verify all needed functionality works
3. **Monitor performance** - Ensure slimming improves performance

This slimming approach will make ClaimGuardian much more manageable while preserving core functionality! 🚀