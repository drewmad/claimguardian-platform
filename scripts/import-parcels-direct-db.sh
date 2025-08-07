#!/bin/bash

# Direct database import for Florida parcels - bypasses Edge Function limits
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
WORK_DIR="/Users/madengineering/ClaimGuardian/data/florida"
ZIP_URL="https://tmlrvecuwgppbaynesji.supabase.co/storage/v1/object/public/parcels/Cadastral_Statewide.zip"
DB_HOST="db.tmlrvecuwgppbaynesji.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Direct Database Import for Florida Parcels                 ║${NC}"
echo -e "${CYAN}║     No Edge Function Limits - Straight to PostgreSQL           ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for database password
if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo -e "${YELLOW}Database password required!${NC}"
    echo ""
    echo "To get your database password:"
    echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/settings/database"
    echo "2. Copy your database password"
    echo "3. Run: export SUPABASE_DB_PASSWORD='your-password-here'"
    echo ""
    read -s -p "Enter database password: " SUPABASE_DB_PASSWORD
    export SUPABASE_DB_PASSWORD
    echo ""
fi

# Create working directory
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# Step 1: Download ZIP if needed
if [[ ! -f "Cadastral_Statewide.zip" ]]; then
    echo -e "${BLUE}Step 1: Downloading ZIP from Supabase Storage...${NC}"
    echo "This is a 4.1GB file - it may take a while..."

    if curl -L --progress-bar -o "Cadastral_Statewide.zip" "$ZIP_URL"; then
        echo -e "${GREEN}✓ Download complete!${NC}"
    else
        echo -e "${RED}✗ Download failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}ZIP file already exists locally, skipping download${NC}"
fi

# Step 2: Extract ZIP
if [[ ! -d "Cadastral_Statewide.gdb" ]]; then
    echo ""
    echo -e "${BLUE}Step 2: Extracting ZIP file...${NC}"

    if unzip -q "Cadastral_Statewide.zip"; then
        echo -e "${GREEN}✓ Extraction complete!${NC}"
    else
        echo -e "${RED}✗ Extraction failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}GDB already extracted, skipping extraction${NC}"
fi

# Step 3: Convert to CSV for easier import
echo ""
echo -e "${BLUE}Step 3: Converting to CSV format...${NC}"

# Create CSV directory
mkdir -p csv_output

# Convert GDB to CSV (all counties at once)
echo "Converting all parcels to CSV format..."
ogr2ogr -f CSV \
    "csv_output/florida_parcels_all.csv" \
    "Cadastral_Statewide.gdb" \
    CADASTRAL_DOR \
    -progress \
    -lco GEOMETRY=AS_WKT

# Check file size
CSV_SIZE=$(du -h "csv_output/florida_parcels_all.csv" | cut -f1)
echo -e "${GREEN}✓ CSV conversion complete! Size: $CSV_SIZE${NC}"

# Step 4: Split CSV if too large
echo ""
echo -e "${BLUE}Step 4: Preparing CSV files for import...${NC}"

cd csv_output

# Check if we need to split (150MB limit for dashboard import)
FILE_SIZE_MB=$(du -m "florida_parcels_all.csv" | cut -f1)

if [[ $FILE_SIZE_MB -gt 150 ]]; then
    echo "CSV is ${FILE_SIZE_MB}MB - splitting into smaller chunks..."

    # Get header
    head -1 florida_parcels_all.csv > header.csv

    # Split file (1 million rows per file)
    tail -n +2 florida_parcels_all.csv | split -l 1000000 - parcels_part_

    # Add header to each part
    for file in parcels_part_*; do
        cat header.csv "$file" > "${file}.csv"
        rm "$file"
    done

    rm header.csv
    echo -e "${GREEN}✓ Split into $(ls parcels_part_*.csv | wc -l) files${NC}"
else
    echo "CSV is small enough for single import"
    mv florida_parcels_all.csv parcels_part_aa.csv
fi

# Step 5: Create import script
echo ""
echo -e "${BLUE}Step 5: Creating database import scripts...${NC}"

# Create SQL import script
cat > import_parcels.sql << 'EOF'
-- Create florida_parcels table if it doesn't exist
CREATE TABLE IF NOT EXISTS florida_parcels (
    id BIGSERIAL PRIMARY KEY,
    CO_NO INTEGER,
    PARCEL_ID TEXT,
    FILE_NO TEXT,
    ASMNT_YR INTEGER,
    BAS_STRT TEXT,
    PHY_ADDR1 TEXT,
    PHY_ADDR2 TEXT,
    PHY_CITY TEXT,
    PHY_ZIPCD TEXT,
    SITE_ADDR TEXT,
    SITE_CITY TEXT,
    SITE_ZIP TEXT,
    OWN_NAME TEXT,
    OWN_ADDR1 TEXT,
    OWN_ADDR2 TEXT,
    OWN_CITY TEXT,
    OWN_STATE TEXT,
    OWN_ZIPCD TEXT,
    OWN_STATE_DOM TEXT,
    VI_CD TEXT,
    EXMPT_CD TEXT,
    WDPRES_CD TEXT,
    DPV_CD TEXT,
    SUBDIVISION TEXT,
    BLOCK TEXT,
    LOT TEXT,
    PLAT_BOOK TEXT,
    PLAT_PAGE TEXT,
    CENSUS_BK TEXT,
    PHY_QTR TEXT,
    PHY_QTR_QTR TEXT,
    HOUSE_NO TEXT,
    HOUSE_NO2 TEXT,
    PFX_DIR TEXT,
    PFX_TYP TEXT,
    STREET TEXT,
    SFX_DIR TEXT,
    SFX_TYP TEXT,
    UNIT_TYP TEXT,
    UNIT_NO TEXT,
    STR_COMP TEXT,
    NBRHD_CD TEXT,
    DOR_UC INTEGER,
    PA_UC INTEGER,
    ZN_TYP TEXT,
    ZN_CD TEXT,
    MUNI_NM TEXT,
    MUNI_NO TEXT,
    PA_IND TEXT,
    GRP_NO TEXT,
    SALE_MO1 INTEGER,
    SALE_DA1 INTEGER,
    SALE_YR1 INTEGER,
    OR_BOOK1 TEXT,
    OR_PAGE1 TEXT,
    CLERK_NO1 TEXT,
    S_CHNG_CD1 INTEGER,
    QUAL_CD1 TEXT,
    VI_CD1 TEXT,
    SALE_PRC1 NUMERIC,
    SALE_MO2 INTEGER,
    SALE_DA2 INTEGER,
    SALE_YR2 INTEGER,
    OR_BOOK2 TEXT,
    OR_PAGE2 TEXT,
    CLERK_NO2 TEXT,
    S_CHNG_CD2 TEXT,
    QUAL_CD2 TEXT,
    VI_CD2 TEXT,
    SALE_PRC2 NUMERIC,
    YR_BLT INTEGER,
    NO_BLDNG INTEGER,
    TOT_LVG_AREA INTEGER,
    ACT_YR_BLT INTEGER,
    EFF_YR_BLT INTEGER,
    BA_SQFT INTEGER,
    ADJ_SQFT INTEGER,
    NO_RES_UNTS INTEGER,
    LND_SQFOOT INTEGER,
    DT_LAST_INSPT INTEGER,
    IMP_QUAL TEXT,
    CONST_TYP TEXT,
    NO_ADDL INTEGER,
    LND_VAL NUMERIC,
    BLD_VAL NUMERIC,
    XF_VAL NUMERIC,
    MKT_VAL NUMERIC,
    ASS_VAL NUMERIC,
    LND_APPR_VAL_ASMNT_YR NUMERIC,
    IMP_APPR_VAL_ASMNT_YR NUMERIC,
    CAP_APPR_VAL_ASMNT_YR NUMERIC,
    JV NUMERIC,
    JV_CHNG INTEGER,
    JV_CHNG_CD TEXT,
    CAP_QLTY TEXT,
    BLD_NUM TEXT,
    STATE_PAR_ID TEXT,
    SPC_CIR_CD INTEGER,
    SPC_CIR_YR INTEGER,
    SPC_CIR_TXT TEXT,
    FLUCCS_CD TEXT,
    FLUCCS_DESC TEXT,
    FL_ASSESS TEXT,
    CO_APP_STAT TEXT,
    LAT_LON TEXT,
    X_COORD NUMERIC,
    Y_COORD NUMERIC,
    SHAPE_WKT TEXT,
    county_fips TEXT,
    county_id INTEGER,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_florida_parcels_county ON florida_parcels(CO_NO);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_parcel_id ON florida_parcels(PARCEL_ID);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_owner ON florida_parcels(OWN_NAME);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_county_fips ON florida_parcels(county_fips);

-- Enable Row Level Security
ALTER TABLE florida_parcels ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (adjust as needed)
CREATE POLICY "Public read access" ON florida_parcels
    FOR SELECT USING (true);
EOF

echo -e "${GREEN}✓ Created import_parcels.sql${NC}"

# Create Python import script for programmatic import
cat > import_parcels.py << 'EOF'
#!/usr/bin/env python3
import os
import csv
import psycopg2
from psycopg2.extras import execute_batch
import sys
from datetime import datetime

# Database connection
DB_CONFIG = {
    "host": "db.tmlrvecuwgppbaynesji.supabase.co",
    "port": 5432,
    "database": "postgres",
    "user": "postgres",
    "password": os.environ.get("SUPABASE_DB_PASSWORD")
}

def import_csv_file(filename):
    """Import a single CSV file to the database"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()

    print(f"Importing {filename}...")
    start_time = datetime.now()

    with open(filename, 'r', encoding='utf-8') as f:
        # Skip header
        next(f)

        # Use COPY for fastest import
        cur.copy_expert(
            sql="""COPY florida_parcels (
                CO_NO, PARCEL_ID, FILE_NO, ASMNT_YR, BAS_STRT,
                PHY_ADDR1, PHY_ADDR2, PHY_CITY, PHY_ZIPCD,
                SITE_ADDR, SITE_CITY, SITE_ZIP,
                OWN_NAME, OWN_ADDR1, OWN_ADDR2, OWN_CITY, OWN_STATE, OWN_ZIPCD,
                -- ... add all columns here ...
                SHAPE_WKT
            ) FROM STDIN WITH CSV""",
            file=f
        )

    conn.commit()
    cur.close()
    conn.close()

    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"✓ Imported {filename} in {elapsed:.2f} seconds")

if __name__ == "__main__":
    # Import all CSV files
    csv_files = sorted([f for f in os.listdir('.') if f.startswith('parcels_part_') and f.endswith('.csv')])

    print(f"Found {len(csv_files)} CSV files to import")

    for i, csv_file in enumerate(csv_files, 1):
        print(f"\n[{i}/{len(csv_files)}] ", end="")
        try:
            import_csv_file(csv_file)
        except Exception as e:
            print(f"✗ Error importing {csv_file}: {e}")
            sys.exit(1)

    print("\n✅ All files imported successfully!")
EOF

chmod +x import_parcels.py

echo -e "${GREEN}✓ Created import_parcels.py${NC}"

# Step 6: Provide import instructions
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Preparation complete!${NC}"
echo ""
echo -e "${YELLOW}Now you have 3 options to import the data:${NC}"
echo ""
echo -e "${BLUE}Option 1: Supabase Dashboard (Easiest)${NC}"
echo "1. Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor"
echo "2. Run the SQL in: $WORK_DIR/csv_output/import_parcels.sql"
echo "3. Go to Table Editor > florida_parcels"
echo "4. Click 'Import data from CSV'"
echo "5. Upload each parcels_part_*.csv file (one at a time)"
echo ""
echo -e "${BLUE}Option 2: Command Line with psql${NC}"
echo "1. Install psql if needed: brew install postgresql"
echo "2. Run: cd $WORK_DIR/csv_output"
echo "3. For each CSV file:"
echo "   PGPASSWORD='$SUPABASE_DB_PASSWORD' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c \"\\copy florida_parcels FROM 'parcels_part_aa.csv' CSV HEADER\""
echo ""
echo -e "${BLUE}Option 3: Python Script (Automated)${NC}"
echo "1. Install psycopg2: pip install psycopg2-binary"
echo "2. Run: cd $WORK_DIR/csv_output"
echo "3. Run: python import_parcels.py"
echo ""
echo -e "${CYAN}Files prepared in: $WORK_DIR/csv_output${NC}"
echo -e "${CYAN}Total CSV files: $(ls $WORK_DIR/csv_output/parcels_part_*.csv 2>/dev/null | wc -l)${NC}"
