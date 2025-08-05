#!/bin/bash

# Import Florida parcels county by county - more efficient approach
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
DB_HOST="db.tmlrvecuwgppbaynesji.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
GDB_PATH="$WORK_DIR/Cadastral_Statewide.gdb"

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     County-by-County Direct Database Import                    ║${NC}"
echo -e "${CYAN}║     Processing Florida Parcels More Efficiently                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check for database password
if [[ -z "${SUPABASE_DB_PASSWORD:-}" ]]; then
    echo -e "${YELLOW}Database password required!${NC}"
    read -s -p "Enter database password: " SUPABASE_DB_PASSWORD
    export SUPABASE_DB_PASSWORD
    echo ""
fi

# Function to get county name
get_county_name() {
    case $1 in
        11) echo "ALACHUA" ;;
        12) echo "BAKER" ;;
        13) echo "BAY" ;;
        14) echo "BRADFORD" ;;
        15) echo "BREVARD" ;;
        16) echo "BROWARD" ;;
        17) echo "CALHOUN" ;;
        18) echo "CHARLOTTE" ;;
        19) echo "CITRUS" ;;
        20) echo "CLAY" ;;
        21) echo "COLLIER" ;;
        22) echo "COLUMBIA" ;;
        23) echo "MIAMI-DADE" ;;
        24) echo "DESOTO" ;;
        25) echo "DIXIE" ;;
        26) echo "DUVAL" ;;
        27) echo "ESCAMBIA" ;;
        28) echo "FLAGLER" ;;
        29) echo "FRANKLIN" ;;
        30) echo "GADSDEN" ;;
        31) echo "GILCHRIST" ;;
        32) echo "GLADES" ;;
        33) echo "GULF" ;;
        34) echo "HAMILTON" ;;
        35) echo "HARDEE" ;;
        36) echo "HENDRY" ;;
        37) echo "HERNANDO" ;;
        38) echo "HIGHLANDS" ;;
        39) echo "HILLSBOROUGH" ;;
        40) echo "HOLMES" ;;
        41) echo "INDIAN_RIVER" ;;
        42) echo "JACKSON" ;;
        43) echo "JEFFERSON" ;;
        44) echo "LAFAYETTE" ;;
        45) echo "LAKE" ;;
        46) echo "LEE" ;;
        47) echo "LEON" ;;
        48) echo "LEVY" ;;
        49) echo "LIBERTY" ;;
        50) echo "MADISON" ;;
        51) echo "MANATEE" ;;
        52) echo "MARION" ;;
        53) echo "MARTIN" ;;
        54) echo "MONROE" ;;
        55) echo "NASSAU" ;;
        56) echo "OKALOOSA" ;;
        57) echo "OKEECHOBEE" ;;
        58) echo "ORANGE" ;;
        59) echo "OSCEOLA" ;;
        60) echo "PALM_BEACH" ;;
        61) echo "PASCO" ;;
        62) echo "PINELLAS" ;;
        63) echo "POLK" ;;
        64) echo "PUTNAM" ;;
        65) echo "ST_JOHNS" ;;
        66) echo "ST_LUCIE" ;;
        67) echo "SANTA_ROSA" ;;
        68) echo "SARASOTA" ;;
        69) echo "SEMINOLE" ;;
        70) echo "SUMTER" ;;
        71) echo "SUWANNEE" ;;
        72) echo "TAYLOR" ;;
        73) echo "UNION" ;;
        74) echo "VOLUSIA" ;;
        75) echo "WAKULLA" ;;
        76) echo "WALTON" ;;
        77) echo "WASHINGTON" ;;
        *) echo "UNKNOWN" ;;
    esac
}

# Create output directory
mkdir -p "$WORK_DIR/csv_by_county"
cd "$WORK_DIR"

# Create the table if it doesn't exist
echo -e "${BLUE}Creating florida_parcels table if needed...${NC}"
PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << 'EOF'
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
    SHAPE_WKT TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_florida_parcels_county ON florida_parcels(CO_NO);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_parcel_id ON florida_parcels(PARCEL_ID);
CREATE INDEX IF NOT EXISTS idx_florida_parcels_owner ON florida_parcels(OWN_NAME);
EOF

echo -e "${GREEN}✓ Table ready${NC}"
echo ""

# Function to import a single county
import_county() {
    local county_code=$1
    local county_name=$2
    
    echo -e "${BLUE}Processing $county_name County (Code: $county_code)...${NC}"
    
    # Export to CSV with WHERE clause for this county
    echo "  Converting to CSV..."
    ogr2ogr -f CSV \
        "$WORK_DIR/csv_by_county/county_${county_code}_${county_name}.csv" \
        "$GDB_PATH" \
        CADASTRAL_DOR \
        -where "CO_NO = $county_code" \
        -lco GEOMETRY=AS_WKT \
        -progress
    
    # Check if CSV was created and has data
    if [[ -f "$WORK_DIR/csv_by_county/county_${county_code}_${county_name}.csv" ]]; then
        local row_count=$(wc -l < "$WORK_DIR/csv_by_county/county_${county_code}_${county_name}.csv")
        if [[ $row_count -gt 1 ]]; then
            echo "  CSV created with $((row_count-1)) parcels"
            
            # Import to database using COPY
            echo "  Importing to database..."
            PGPASSWORD="$SUPABASE_DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" << EOF
\\copy florida_parcels (CO_NO, PARCEL_ID, FILE_NO, ASMNT_YR, BAS_STRT, PHY_ADDR1, PHY_ADDR2, PHY_CITY, PHY_ZIPCD, SITE_ADDR, SITE_CITY, SITE_ZIP, OWN_NAME, OWN_ADDR1, OWN_ADDR2, OWN_CITY, OWN_STATE, OWN_ZIPCD, OWN_STATE_DOM, VI_CD, EXMPT_CD, WDPRES_CD, DPV_CD, SUBDIVISION, BLOCK, LOT, SHAPE_WKT) FROM '$WORK_DIR/csv_by_county/county_${county_code}_${county_name}.csv' WITH CSV HEADER;
EOF
            
            echo -e "  ${GREEN}✓ $county_name County imported successfully${NC}"
            
            # Clean up CSV to save space
            rm "$WORK_DIR/csv_by_county/county_${county_code}_${county_name}.csv"
        else
            echo -e "  ${YELLOW}⚠ No data for $county_name County${NC}"
        fi
    else
        echo -e "  ${RED}✗ Failed to create CSV for $county_name County${NC}"
    fi
    
    echo ""
}

# Process options
echo -e "${YELLOW}Select processing option:${NC}"
echo "1) Import all counties"
echo "2) Import priority counties (Miami-Dade, Broward, Palm Beach, etc.)"
echo "3) Import specific county"
echo "4) Resume from specific county"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo -e "${BLUE}Importing all counties...${NC}"
        for county_code in {11..77}; do
            county_name=$(get_county_name $county_code)
            if [[ "$county_name" != "UNKNOWN" ]]; then
                import_county "$county_code" "$county_name"
            fi
        done
        ;;
    
    2)
        echo -e "${BLUE}Importing priority counties...${NC}"
        # Priority counties by population
        for county_code in 23 16 60 39 58 62 52 63 15 46; do
            county_name=$(get_county_name $county_code)
            if [[ "$county_name" != "UNKNOWN" ]]; then
                import_county "$county_code" "$county_name"
            fi
        done
        ;;
    
    3)
        read -p "Enter county code (11-77): " county_code
        county_name=$(get_county_name $county_code)
        if [[ "$county_name" != "UNKNOWN" ]]; then
            import_county "$county_code" "$county_name"
        else
            echo -e "${RED}Invalid county code${NC}"
        fi
        ;;
    
    4)
        read -p "Enter county code to resume from (11-77): " start_code
        for county_code in {11..77}; do
            if [[ $county_code -ge $start_code ]]; then
                county_name=$(get_county_name $county_code)
                if [[ "$county_name" != "UNKNOWN" ]]; then
                    import_county "$county_code" "$county_name"
                fi
            fi
        done
        ;;
esac

echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Import process complete!${NC}"
echo ""
echo -e "${YELLOW}To monitor the import:${NC}"
echo "1. Run: ./scripts/monitor-db-import.sh"
echo "2. Or query directly:"
echo "   PGPASSWORD='$SUPABASE_DB_PASSWORD' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c 'SELECT CO_NO, COUNT(*) FROM florida_parcels GROUP BY CO_NO ORDER BY CO_NO;'"
echo ""