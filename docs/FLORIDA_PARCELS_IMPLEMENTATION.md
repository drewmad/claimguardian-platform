# Florida Parcels Implementation Guide

## Overview

The Florida Parcels system implements the complete 138-column Florida Department of Revenue (DOR) Name-Address-Legal (NAL) format for property parcel data. This system supports spatial queries, full-text search, and high-performance imports of millions of parcels.

## Architecture

### Database Schema
- **Table**: `florida_parcels` - 138 DOR standard columns plus ClaimGuardian enhancements
- **Extensions**: PostGIS for spatial data, pg_trgm for fuzzy text search
- **Indexes**: 40+ indexes optimized for common query patterns
- **Triggers**: Automatic geometry processing, land use categorization, timestamp updates

### Key Features
1. **Full DOR Compliance**: All 138 standard Florida DOR columns
2. **Spatial Support**: PostGIS geometry with automatic centroid calculation
3. **Full-Text Search**: Fuzzy owner name search using trigram matching
4. **Import Tracking**: Status monitoring for large-scale data imports
5. **Performance**: Parallel import processing, optimized indexes

## Implementation Steps

### 1. Apply Database Schema

```bash
# Apply the complete florida_parcels schema
./scripts/apply-florida-parcels-schema.sh
```

This creates:
- `florida_parcels` table with 138 DOR columns
- PostGIS spatial indexes
- Full-text search indexes
- Import status tracking table
- Helper functions and views

### 2. Test Import Process

```bash
# Run test with sample data
./scripts/test-parcels-import.sh

# This will:
# - Verify schema exists
# - Test with 10 sample records
# - Show dry run results
```

### 3. Import Charlotte County Data (Pilot)

```bash
# Import full Charlotte County dataset (~200k records)
./scripts/import-florida-parcels.sh \
    --county charlotte \
    --batch 5000 \
    --jobs 8

# Monitor progress
watch -n 5 "psql -c 'SELECT COUNT(*) FROM florida_parcels WHERE CO_NO = 15'"
```

### 4. Verify Import

```sql
-- Check import status
SELECT * FROM florida_parcels_import_status
WHERE county_no = 15
ORDER BY created_at DESC;

-- Verify data quality
SELECT
    COUNT(*) as total_parcels,
    COUNT(DISTINCT OWN_NAME) as unique_owners,
    COUNT(DISTINCT PHY_CITY) as cities,
    AVG(JV) as avg_just_value,
    COUNT(*) FILTER (WHERE geom IS NOT NULL) as with_geometry
FROM florida_parcels
WHERE CO_NO = 15;

-- Test owner search
SELECT * FROM search_parcels_by_owner('SMITH', 15, 10);
```

## Data Import Process

### Parallel Import Architecture
```
CSV File → Split into chunks → Parallel Node.js workers → Supabase bulk insert
         ↓                    ↓                         ↓
    1000 rows/chunk      4-8 concurrent jobs      100 rows/transaction
```

### Import Options
- `--county`: County name or number (charlotte/15, lee/36, etc.)
- `--file`: Input CSV file path
- `--batch`: Records per chunk (default: 1000)
- `--jobs`: Parallel workers (default: 4)
- `--dry-run`: Test without inserting

### Performance Guidelines
- **Small imports (<10k)**: Use batch=1000, jobs=2
- **Medium imports (10k-100k)**: Use batch=5000, jobs=4
- **Large imports (>100k)**: Use batch=10000, jobs=8

## Column Mapping

### Primary Identifiers
- `CO_NO`: County number (1-67)
- `PARCEL_ID`: Unique parcel ID within county
- `county_fips`: Federal county code

### Owner Information
- `OWN_NAME`: Owner name
- `OWN_ADDR1/2`: Owner mailing address
- `OWN_CITY`, `OWN_STATE`, `OWN_ZIPCD`: Owner location

### Property Location
- `PHY_ADDR1/2`: Physical street address
- `PHY_CITY`, `PHY_ZIPCD`: Property location
- `LATITUDE`, `LONGITUDE`: Coordinates
- `geometry_wkt`: Well-known text boundary

### Valuation
- `JV`: Just value (market value)
- `LND_VAL`: Land value
- `IMP_VAL`: Improvement value
- `SALE_PRC1`: Last sale price
- `SALE_YR1`: Last sale year

### Property Characteristics
- `DOR_UC`: Department of Revenue use code
- `ACT_YR_BLT`: Year built
- `TOT_LVG_AR`: Total living area
- `LND_SQFOOT`: Land square footage

## Query Examples

### Find Properties by Owner
```sql
-- Fuzzy search by owner name
SELECT * FROM search_parcels_by_owner('John Smith', 15, 50);

-- Exact match
SELECT * FROM florida_parcels
WHERE UPPER(OWN_NAME) = 'JOHN SMITH'
AND CO_NO = 15;
```

### Spatial Queries
```sql
-- Find parcels within 1 mile of a point
SELECT PARCEL_ID, OWN_NAME, PHY_ADDR1
FROM florida_parcels
WHERE ST_DWithin(
    geom::geography,
    ST_MakePoint(-82.0105, 26.9406)::geography,
    1609.34  -- 1 mile in meters
);

-- Find parcels in flood zones
SELECT COUNT(*), flood_zone_type
FROM florida_parcels
WHERE CO_NO = 15
GROUP BY flood_zone_type;
```

### Value Analysis
```sql
-- High-value properties
SELECT * FROM v_florida_parcels_high_value
WHERE CO_NO = 15
LIMIT 100;

-- County statistics
SELECT * FROM v_florida_parcels_summary
WHERE county_number = 15;
```

## Troubleshooting

### Common Issues

1. **Import fails with "column does not exist"**
   - Ensure schema is applied: `./scripts/apply-florida-parcels-schema.sh`

2. **Slow imports**
   - Increase batch size and parallel jobs
   - Check database connection pooling
   - Monitor with: `SELECT * FROM pg_stat_activity`

3. **Geometry errors**
   - Invalid WKT is logged but doesn't fail import
   - Check warnings in import logs
   - Validate with: `SELECT COUNT(*) FROM florida_parcels WHERE geom IS NULL AND geometry_wkt IS NOT NULL`

4. **Duplicate key errors**
   - Uses UPSERT logic, updates existing records
   - Check for data quality issues in source CSV

### Performance Optimization

1. **Vacuum after large imports**
   ```sql
   VACUUM ANALYZE florida_parcels;
   ```

2. **Update statistics**
   ```sql
   ANALYZE florida_parcels;
   ```

3. **Check index usage**
   ```sql
   SELECT schemaname, tablename, indexname, idx_scan
   FROM pg_stat_user_indexes
   WHERE tablename = 'florida_parcels'
   ORDER BY idx_scan DESC;
   ```

## Next Steps

1. **Additional Counties**: Prepare import scripts for Lee, Collier, Sarasota
2. **Data Quality**: Implement validation and cleansing routines
3. **API Integration**: Create REST endpoints for parcel queries
4. **UI Components**: Build property search and mapping interfaces
5. **ML Features**: Train models on property valuations and risks

## Resources

- [Florida DOR Property Data](https://floridarevenue.com/property/Pages/DataPortal.aspx)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Supabase Spatial Features](https://supabase.com/docs/guides/database/extensions/postgis)
