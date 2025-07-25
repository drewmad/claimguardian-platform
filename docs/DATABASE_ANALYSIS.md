# Database Analysis Report

Generated: $(date)

## Current Database State

### Existing Property-Related Tables

1. **`properties`** - Main properties table (EXISTS)
   - Has basic property information
   - Includes address fields, insurance info
   - Has location (PostGIS geometry)
   - Missing: hierarchical structure for land, structures, systems

2. **`claims`** - Insurance claims (EXISTS)
   - Good structure with proper enums
   - Links to property_id
   - Missing: versioning, history tracking

3. **`claim_communications`** - Claim communications log (EXISTS)
   - Tracks communication with adjusters

4. **`claim_status_history`** - Status change tracking (EXISTS)
   - Basic history for claim status changes

5. **`contractor_license_raw`** - Contractor data (EXISTS)
   - Raw contractor license information

### Missing Tables from Comprehensive Schema

Our new schema includes these tables that don't exist yet:
- ❌ `property_land` - Land-specific information
- ❌ `property_structures` - Individual structures on properties
- ❌ `property_systems` - HVAC, electrical, plumbing systems
- ❌ `property_insurance` - Detailed insurance policies
- ❌ `property_damage` - Damage assessments
- ❌ `property_contractors` - Contractor work records
- ❌ All history tables (`*_history`) for versioning

### Existing Enum Types

Found these relevant enums:
- `claim_status_enum`
- `damage_type_enum`
- `document_type_enum`
- `policy_type_enum`

Missing from our new schema:
- ❌ `property_type`
- ❌ `occupancy_status`
- ❌ `damage_severity`

## Analysis Summary

### Current State
- ✅ Basic property and claims structure exists
- ✅ Some history tracking for claims
- ✅ PostGIS enabled for spatial data
- ❌ No comprehensive versioning system
- ❌ No hierarchical property data model
- ❌ Limited RLS implementation

### Integration Considerations

1. **Properties Table Conflict**
   - Current table has different structure than our schema
   - Need migration strategy to preserve existing data
   - Address field is JSONB vs. our separate fields

2. **Claims Table Integration**
   - Current claims table is compatible
   - Can be enhanced with our versioning system
   - Need to map existing enums

3. **Data Migration Required**
   - Existing properties data needs transformation
   - Address JSONB → separate fields
   - Insurance info → property_insurance table

## Recommended Next Steps

### Option 1: Safe Incremental Approach (RECOMMENDED)

1. **Rename existing tables** (preserve data):
   ```sql
   ALTER TABLE properties RENAME TO properties_legacy;
   ALTER TABLE claims RENAME TO claims_legacy;
   ```

2. **Create new schema** with our comprehensive design

3. **Migrate data** from legacy tables:
   - Transform addresses from JSONB to fields
   - Create property_insurance records
   - Maintain all relationships

4. **Verify and switch over**

### Option 2: Direct Migration

1. **Backup existing data**
2. **Modify existing tables** to match new schema
3. **Add missing tables and relationships**
4. **Risk**: More complex, potential data loss

### Option 3: Parallel Schema

1. **Create new schema** with prefix (e.g., `v2_properties`)
2. **Run both in parallel** during transition
3. **Gradually migrate** functionality
4. **Most conservative** but requires more work

## Migration Script Outline

```sql
-- 1. Backup existing data
CREATE TABLE properties_backup AS SELECT * FROM properties;
CREATE TABLE claims_backup AS SELECT * FROM claims;

-- 2. Create new schema
-- (Run our comprehensive schema)

-- 3. Migrate properties data
INSERT INTO properties_new (
    id, user_id, address, city, state, zip_code, 
    year_built, square_footage, created_at, updated_at
)
SELECT 
    id, 
    user_id,
    COALESCE(street_address, address->>'street', ''),
    COALESCE(city, address->>'city', ''),
    COALESCE(state, address->>'state', 'FL'),
    COALESCE(postal_code, address->>'zip', ''),
    year_built,
    square_feet,
    created_at,
    updated_at
FROM properties;

-- 4. Migrate insurance data
INSERT INTO property_insurance (
    property_id, carrier_name, policy_number, ...
)
SELECT 
    id, insurance_carrier, insurance_policy_number, ...
FROM properties
WHERE insurance_carrier IS NOT NULL;
```

## Decision Points

1. **Data Preservation**: How important is zero downtime?
2. **Backward Compatibility**: Any apps using current schema?
3. **Timeline**: How quickly do we need new features?
4. **Risk Tolerance**: Can we afford brief downtime for migration?