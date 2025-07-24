# Florida Parcels CSV Import Guide

This guide explains how to import Florida parcel data CSV files into the `florida_parcels` table.

## Problem: Uppercase CSV Headers

The CSV files from Florida's parcel data sources have UPPERCASE column headers (e.g., `PARCEL_ID`, `OWN_NAME`), while our database table uses lowercase column names (e.g., `parcel_id`, `own_name`).

## Solution Options

### Option 1: Use the Import Script (Recommended for Large Files)

We've created a Node.js script that handles the column mapping automatically.

```bash
# Install dependencies if needed
cd /path/to/ClaimGuardian
pnpm install

# Run the import script
node scripts/import-florida-parcels-csv.js /path/to/your/parcels.csv --batch-size=500 --skip-errors

# Test mode (no actual inserts)
node scripts/import-florida-parcels-csv.js /path/to/your/parcels.csv --test --limit=10
```

**Script Features:**
- Automatically maps uppercase CSV headers to lowercase database columns
- Derives `county_fips` from `CO_NO` field
- Batch processing for performance
- Error handling with retry logic
- Progress tracking
- Upsert support (updates existing records)

### Option 2: Use Temporary Table in Supabase (Good for Dashboard Import)

1. **Create a temporary import table** with uppercase columns:

```sql
-- Run this in Supabase SQL Editor
-- This creates a table that matches your CSV headers exactly
CREATE TABLE florida_parcels_import_temp (
    CO_NO FLOAT,
    PARCEL_ID VARCHAR(50),
    -- ... all other columns with UPPERCASE names
    geometry_wkt TEXT
);
```

2. **Import your CSV** using Supabase Dashboard:
   - Go to Table Editor
   - Select `florida_parcels_import_temp`
   - Click "Import data from CSV"
   - Upload your file

3. **Transfer data to main table**:

```sql
-- This function handles the column name mapping
SELECT * FROM import_parcels_from_temp(1000);
```

4. **Clean up**:

```sql
DROP TABLE florida_parcels_import_temp;
```

### Option 3: Pre-process Your CSV

Convert column headers to lowercase before importing:

```bash
# Using sed on Mac/Linux
head -1 your_file.csv | tr '[:upper:]' '[:lower:]' > processed_file.csv
tail -n +2 your_file.csv >> processed_file.csv

# Or using Python
python -c "
import csv
with open('input.csv', 'r') as f_in, open('output.csv', 'w') as f_out:
    reader = csv.DictReader(f_in)
    fieldnames = [name.lower() for name in reader.fieldnames]
    writer = csv.DictWriter(f_out, fieldnames=fieldnames)
    writer.writeheader()
    for row in reader:
        writer.writerow({k.lower(): v for k, v in row.items()})
"
```

## Column Mappings

| CSV Header (Uppercase) | Database Column (Lowercase) | Description |
|------------------------|----------------------------|-------------|
| CO_NO | co_no | County number (1-67) |
| PARCEL_ID | parcel_id | Unique parcel identifier |
| JV | jv | Just Value (Market Value) |
| LND_VAL | lnd_val | Land Value |
| OWN_NAME | own_name | Owner Name |
| PHY_ADDR1 | phy_addr1 | Physical Address |
| ... | ... | ... |

## Special Handling

### County FIPS Code
The `county_fips` field is automatically derived from `CO_NO`:
- CO_NO 1 → county_fips 12001 (Alachua)
- CO_NO 2 → county_fips 12003 (Baker)
- etc.

### Data Types
- Numeric fields are automatically converted from strings
- Empty values are converted to NULL
- Text fields are trimmed of whitespace

## Verification

After import, verify your data:

```sql
-- Check import summary
SELECT 
    county_fips,
    COUNT(*) as parcels,
    COUNT(DISTINCT own_name) as owners,
    SUM(jv) as total_value
FROM florida_parcels
GROUP BY county_fips
ORDER BY county_fips;

-- Check specific county
SELECT * FROM search_parcels_by_owner('SMITH', 12015, 10);

-- Get statistics
SELECT * FROM get_parcel_stats_by_county();
```

## Performance Tips

1. **Batch Size**: Use 500-1000 records per batch for optimal performance
2. **Indexes**: All necessary indexes are already created
3. **Large Files**: For files > 1GB, consider splitting:
   ```bash
   split -l 100000 large_file.csv chunk_
   ```

## Troubleshooting

### "Duplicate key" errors
The import uses UPSERT logic - existing parcels will be updated. This is normal.

### Memory issues
Reduce batch size or split large files.

### Missing county_fips
Check that CO_NO values are between 1-67. Invalid values result in NULL county_fips.

## Example Import Command

```bash
# Import Charlotte County parcels
node scripts/import-florida-parcels-csv.js \
  ~/Downloads/charlotte_parcels.csv \
  --batch-size=1000 \
  --skip-errors

# Import with limit for testing
node scripts/import-florida-parcels-csv.js \
  ~/Downloads/all_florida_parcels.csv \
  --limit=1000 \
  --test
```