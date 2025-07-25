-- Fix validation function and create comprehensive column analysis
-- ================================================================

-- Drop the function if it exists with error
DROP FUNCTION IF EXISTS validate_parcel_data(VARCHAR);

-- Create validation function
CREATE OR REPLACE FUNCTION validate_parcel_data(p_parcel_id VARCHAR)
RETURNS TABLE (
    field_name TEXT,
    issue TEXT
) AS $$
BEGIN
    -- Check for missing required data
    IF NOT EXISTS (SELECT 1 FROM florida_parcels WHERE "PARCEL_ID" = p_parcel_id) THEN
        RETURN QUERY SELECT 'PARCEL_ID'::TEXT, 'Parcel not found'::TEXT;
        RETURN;
    END IF;
    
    -- Check for data quality issues
    RETURN QUERY
    WITH parcel AS (
        SELECT * FROM florida_parcels WHERE "PARCEL_ID" = p_parcel_id
    )
    SELECT 'JV'::TEXT, 'Just Value is zero or null'::TEXT
    FROM parcel WHERE "JV" IS NULL OR "JV" = 0
    UNION ALL
    SELECT 'OWN_NAME'::TEXT, 'Owner name is missing'::TEXT
    FROM parcel WHERE "OWN_NAME" IS NULL OR "OWN_NAME" = ''
    UNION ALL
    SELECT 'PHY_ADDR1'::TEXT, 'Physical address is missing'::TEXT
    FROM parcel WHERE "PHY_ADDR1" IS NULL OR "PHY_ADDR1" = ''
    UNION ALL
    SELECT 'SALE_YR1'::TEXT, 'Sale year is in the future'::TEXT
    FROM parcel WHERE "SALE_YR1" > EXTRACT(YEAR FROM CURRENT_DATE)
    UNION ALL
    SELECT 'ACT_YR_BLT'::TEXT, 'Year built is in the future'::TEXT
    FROM parcel WHERE "ACT_YR_BLT" > EXTRACT(YEAR FROM CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_parcel_data(VARCHAR) TO anon, authenticated;

-- Create a comprehensive column analysis view
CREATE OR REPLACE VIEW florida_parcels_column_analysis AS
WITH column_info AS (
    SELECT 
        a.attname as column_name,
        pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
        a.attnotnull as not_null,
        col_description(pgc.oid, a.attnum) as description,
        CASE 
            WHEN a.attname LIKE '%YR%' OR a.attname IN ('ASMNT_YR', 'DISTR_YR', 'ACT_YR_BLT', 'EFF_YR_BLT') THEN 'Year'
            WHEN a.attname LIKE '%VAL%' OR a.attname LIKE '%PRC%' OR a.attname LIKE 'JV%' OR a.attname LIKE 'AV%' OR a.attname LIKE 'TV%' THEN 'Financial'
            WHEN a.attname LIKE '%ADDR%' OR a.attname LIKE '%CITY%' OR a.attname LIKE '%STATE%' OR a.attname LIKE '%ZIP%' THEN 'Address'
            WHEN a.attname LIKE 'OWN_%' OR a.attname LIKE 'FIDU_%' THEN 'Owner'
            WHEN a.attname LIKE 'SALE_%' OR a.attname LIKE 'OR_%' OR a.attname LIKE 'CLERK%' THEN 'Sales'
            WHEN a.attname LIKE '%CD' OR a.attname LIKE '%UC' OR a.attname LIKE '%STAT%' THEN 'Code'
            WHEN a.attname IN ('TWN', 'RNG', 'SEC', 'Shape_Length', 'Shape_Area', 'geometry_wkt') THEN 'Geographic'
            WHEN a.attname IN ('id', 'created_at', 'updated_at', 'county_id', 'county_fips') THEN 'System'
            ELSE 'Other'
        END as category,
        CASE 
            WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) = 'double precision' THEN 'Numeric - Decimal'
            WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) LIKE 'character varying%' THEN 'Text - Variable'
            WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) = 'text' THEN 'Text - Unlimited'
            WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) = 'bigint' THEN 'Numeric - Large Integer'
            WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) = 'integer' THEN 'Numeric - Integer'
            WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) LIKE 'timestamp%' THEN 'Date/Time'
            WHEN pg_catalog.format_type(a.atttypid, a.atttypmod) = 'uuid' THEN 'Unique Identifier'
            ELSE pg_catalog.format_type(a.atttypid, a.atttypmod)
        END as type_category
    FROM pg_attribute a
    JOIN pg_class pgc ON pgc.oid = a.attrelid
    WHERE pgc.relname = 'florida_parcels'
    AND a.attnum > 0
    AND NOT a.attisdropped
)
SELECT 
    column_name,
    data_type,
    type_category,
    category,
    not_null,
    description
FROM column_info
ORDER BY 
    CASE category
        WHEN 'System' THEN 1
        WHEN 'Financial' THEN 2
        WHEN 'Owner' THEN 3
        WHEN 'Address' THEN 4
        WHEN 'Sales' THEN 5
        WHEN 'Geographic' THEN 6
        WHEN 'Code' THEN 7
        ELSE 8
    END,
    column_name;

-- Create a function to get column statistics
CREATE OR REPLACE FUNCTION get_parcels_column_stats()
RETURNS TABLE (
    category TEXT,
    column_count BIGINT,
    example_columns TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        category,
        COUNT(*) as column_count,
        STRING_AGG(column_name, ', ' ORDER BY column_name) 
            FILTER (WHERE row_num <= 3) as example_columns
    FROM (
        SELECT 
            category,
            column_name,
            ROW_NUMBER() OVER (PARTITION BY category ORDER BY column_name) as row_num
        FROM florida_parcels_column_analysis
    ) t
    GROUP BY category
    ORDER BY column_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Create a function to suggest data type optimizations
CREATE OR REPLACE FUNCTION suggest_type_optimizations()
RETURNS TABLE (
    column_name TEXT,
    current_type TEXT,
    suggested_type TEXT,
    reason TEXT
) AS $$
BEGIN
    RETURN QUERY
    -- Year columns that are FLOAT but should be INTEGER
    SELECT 
        a.attname::TEXT,
        'FLOAT'::TEXT as current_type,
        'INTEGER'::TEXT as suggested_type,
        'Year values should be whole numbers'::TEXT as reason
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'florida_parcels'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND pg_catalog.format_type(a.atttypid, a.atttypmod) = 'double precision'
    AND (a.attname LIKE '%YR%' OR a.attname LIKE '%_MO%' OR 
         a.attname IN ('CO_NO', 'NO_BULDNG', 'NO_RES_UNT', 'SEC'))
    
    UNION ALL
    
    -- ZIP code columns that are FLOAT but should be VARCHAR
    SELECT 
        a.attname::TEXT,
        'FLOAT'::TEXT,
        'VARCHAR(10)'::TEXT,
        'ZIP codes should be text to preserve leading zeros'::TEXT
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    WHERE c.relname = 'florida_parcels'
    AND a.attnum > 0
    AND NOT a.attisdropped
    AND pg_catalog.format_type(a.atttypid, a.atttypmod) = 'double precision'
    AND a.attname LIKE '%ZIPCD%'
    
    ORDER BY column_name;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON florida_parcels_column_analysis TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_parcels_column_stats() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION suggest_type_optimizations() TO anon, authenticated;