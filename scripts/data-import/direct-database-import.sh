#!/bin/bash

# Direct database import approach - bypasses Edge Function limits
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║    Direct Database Import - No Edge Function Limits            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}This approach bypasses Edge Function limits by:${NC}"
echo "1. Using Supabase's SQL Editor or pg_dump/restore"
echo "2. Processing data directly in PostgreSQL"
echo "3. No memory/timeout restrictions"
echo ""

# Option 1: CSV Import via Dashboard
echo -e "${BLUE}Option 1: CSV Import (Easiest)${NC}"
echo "1. Convert GDB to CSV format:"
echo "   ogr2ogr -f CSV florida_parcels.csv Cadastral_Statewide.gdb CADASTRAL_DOR"
echo ""
echo "2. Split large CSV if needed:"
echo "   split -l 1000000 florida_parcels.csv county_part_"
echo ""
echo "3. Upload via Supabase Dashboard:"
echo "   - Table Editor > florida_parcels > Import Data"
echo "   - Supports files up to 150MB each"
echo "   - Can import multiple files sequentially"
echo ""

# Option 2: Direct SQL with COPY
echo -e "${BLUE}Option 2: SQL COPY Command${NC}"
cat > import-via-copy.sql << 'EOF'
-- Create staging table if needed
CREATE TABLE IF NOT EXISTS florida_parcels_staging (LIKE florida_parcels INCLUDING ALL);

-- Import CSV data directly
-- Run this from psql or Supabase SQL Editor
COPY florida_parcels_staging FROM '/path/to/florida_parcels.csv'
WITH (FORMAT csv, HEADER true, DELIMITER ',');

-- Move to production table
INSERT INTO florida_parcels
SELECT * FROM florida_parcels_staging
ON CONFLICT (parcel_id) DO UPDATE SET
  updated_at = EXCLUDED.updated_at;

-- Clean up
DROP TABLE florida_parcels_staging;
EOF

echo "Created: import-via-copy.sql"
echo ""

# Option 3: pg_restore approach
echo -e "${BLUE}Option 3: pg_dump/pg_restore (For large datasets)${NC}"
cat > direct-restore.sh << 'EOF'
#!/bin/bash
# Direct database restore for large datasets

# Database connection details
DB_HOST="db.tmlrvecuwgppbaynesji.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASS="${SUPABASE_DB_PASSWORD}"  # Set this env variable

# Convert and prepare data
echo "Converting GDB to PostgreSQL format..."
ogr2ogr -f "PostgreSQL" \
  PG:"host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASS" \
  Cadastral_Statewide.gdb \
  -nln florida_parcels_import \
  -progress \
  -overwrite \
  CADASTRAL_DOR

echo "Import complete!"
EOF

chmod +x direct-restore.sh
echo "Created: direct-restore.sh"
echo ""

# Option 4: Streaming with pg_bulkload
echo -e "${BLUE}Option 4: High-Performance Streaming${NC}"
cat > stream-import.py << 'EOF'
import psycopg2
import csv
from psycopg2.extras import execute_values

# Database connection
conn = psycopg2.connect(
    host="db.tmlrvecuwgppbaynesji.supabase.co",
    port=5432,
    database="postgres",
    user="postgres",
    password=os.environ.get("SUPABASE_DB_PASSWORD")
)

def stream_parcels(csv_file):
    """Stream parcels in batches"""
    cur = conn.cursor()
    batch = []
    batch_size = 10000

    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            batch.append(row)

            if len(batch) >= batch_size:
                execute_values(
                    cur,
                    "INSERT INTO florida_parcels VALUES %s",
                    batch,
                    template="(%(CO_NO)s, %(PARCEL_ID)s, ...)"
                )
                conn.commit()
                batch = []
                print(f"Inserted {batch_size} records")

    # Insert remaining
    if batch:
        execute_values(cur, "INSERT INTO florida_parcels VALUES %s", batch)
        conn.commit()

    cur.close()
    conn.close()

if __name__ == "__main__":
    stream_parcels("florida_parcels.csv")
EOF

echo "Created: stream-import.py"
echo ""

echo -e "${GREEN}Advantages of Direct Database Import:${NC}"
echo "✓ No Edge Function limits"
echo "✓ Can handle 4.1GB+ files"
echo "✓ Faster processing"
echo "✓ Lower cost (no function invocations)"
echo "✓ Built-in transaction support"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Download the ZIP from Storage (if not local)"
echo "2. Extract and convert to CSV or PostgreSQL format"
echo "3. Use one of the methods above to import"
echo "4. Monitor via SQL queries instead of Edge Functions"
echo ""

echo -e "${CYAN}To get your database password:${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/settings/database"
echo "2. Click 'Reset database password' if you don't have it"
echo "3. Export as: export SUPABASE_DB_PASSWORD='your-password'"
