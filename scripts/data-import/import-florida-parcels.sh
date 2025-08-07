#!/bin/bash

# Florida Parcels Import Script
# Handles large-scale parcel data imports with parallel processing

set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
PROJECT_ID="tmlrvecuwgppbaynesji"
DEFAULT_BATCH_SIZE=1000
DEFAULT_PARALLEL_JOBS=4
MAX_RETRIES=3

# Usage function
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -c, --county COUNTY    County name or number (default: charlotte/15)"
    echo "  -f, --file FILE        Input CSV file path"
    echo "  -b, --batch SIZE       Batch size for imports (default: $DEFAULT_BATCH_SIZE)"
    echo "  -j, --jobs NUM         Number of parallel jobs (default: $DEFAULT_PARALLEL_JOBS)"
    echo "  -d, --dry-run          Test import without inserting data"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --county charlotte --file data.csv"
    echo "  $0 -c 15 -f parcels.csv -b 5000 -j 8"
    exit 1
}

# Parse arguments
COUNTY="charlotte"
COUNTY_NO=15
INPUT_FILE=""
BATCH_SIZE=$DEFAULT_BATCH_SIZE
PARALLEL_JOBS=$DEFAULT_PARALLEL_JOBS
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -c|--county)
            COUNTY="$2"
            shift 2
            ;;
        -f|--file)
            INPUT_FILE="$2"
            shift 2
            ;;
        -b|--batch)
            BATCH_SIZE="$2"
            shift 2
            ;;
        -j|--jobs)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            ;;
    esac
done

# Map county names to numbers
case "${COUNTY,,}" in
    charlotte|15)
        COUNTY="Charlotte"
        COUNTY_NO=15
        ;;
    lee|36)
        COUNTY="Lee"
        COUNTY_NO=36
        ;;
    collier|11)
        COUNTY="Collier"
        COUNTY_NO=11
        ;;
    sarasota|58)
        COUNTY="Sarasota"
        COUNTY_NO=58
        ;;
    *)
        echo -e "${RED}Unknown county: $COUNTY${NC}"
        echo "Supported counties: Charlotte (15), Lee (36), Collier (11), Sarasota (58)"
        exit 1
        ;;
esac

# Default file if not specified
if [ -z "$INPUT_FILE" ]; then
    INPUT_FILE="data-platform/raw/florida/samples/charlotte_county/charlotte_parcels.csv"
fi

# Check if file exists
if [ ! -f "$INPUT_FILE" ]; then
    echo -e "${RED}Error: Input file not found: $INPUT_FILE${NC}"
    exit 1
fi

echo "========================================"
echo -e "${BLUE}🏘️  FLORIDA PARCELS IMPORT${NC}"
echo "========================================"
echo ""
echo "Configuration:"
echo "  County: $COUNTY (CO_NO: $COUNTY_NO)"
echo "  Input file: $INPUT_FILE"
echo "  Batch size: $BATCH_SIZE"
echo "  Parallel jobs: $PARALLEL_JOBS"
echo "  Dry run: $DRY_RUN"
echo ""

# Check file size and estimate time
FILE_SIZE=$(wc -l < "$INPUT_FILE")
ESTIMATED_BATCHES=$((($FILE_SIZE + $BATCH_SIZE - 1) / $BATCH_SIZE))
echo -e "${BLUE}File statistics:${NC}"
echo "  Total rows: $FILE_SIZE"
echo "  Estimated batches: $ESTIMATED_BATCHES"
echo "  Estimated time: $(($ESTIMATED_BATCHES * 2 / $PARALLEL_JOBS)) minutes"
echo ""

if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}DRY RUN MODE - No data will be inserted${NC}"
    echo ""
fi

# Create import batch ID
IMPORT_BATCH="$(date +%Y%m%d_%H%M%S)_${COUNTY,,}_import"
echo "Import batch ID: $IMPORT_BATCH"
echo ""

# Create temporary directory for split files
TEMP_DIR="/tmp/parcels_import_$$"
mkdir -p "$TEMP_DIR"

# Function to clean up on exit
cleanup() {
    echo -e "${BLUE}Cleaning up temporary files...${NC}"
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# Split the CSV file into chunks
echo -e "${BLUE}Splitting CSV into chunks...${NC}"
# Keep header for each chunk
HEADER=$(head -1 "$INPUT_FILE")
tail -n +2 "$INPUT_FILE" | split -l $BATCH_SIZE - "$TEMP_DIR/chunk_"

# Add header to each chunk
for chunk in "$TEMP_DIR"/chunk_*; do
    echo "$HEADER" > "$chunk.csv"
    cat "$chunk" >> "$chunk.csv"
    rm "$chunk"
done

TOTAL_CHUNKS=$(ls -1 "$TEMP_DIR"/*.csv | wc -l)
echo -e "${GREEN}Created $TOTAL_CHUNKS chunks${NC}"
echo ""

# Create Node.js import script
cat > "$TEMP_DIR/import_chunk.js" << 'EOF'
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse/sync');
const path = require('path');

// Get arguments
const [,, chunkFile, importBatch, countyNo, dryRun] = process.argv;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importChunk() {
    const chunkName = path.basename(chunkFile);
    console.log(`Processing ${chunkName}...`);

    try {
        // Read CSV file
        const fileContent = fs.readFileSync(chunkFile, 'utf-8');
        const records = csv.parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            cast: true,
            cast_date: false
        });

        // Transform records for database
        const parcels = records.map(record => ({
            // Map CSV columns to database columns
            county_fips: record.county_fips,
            CO_NO: parseInt(countyNo),
            PARCEL_ID: record.PARCEL_ID,
            FILE_T: record.FILE_T,
            ASMNT_YR: record.ASMNT_YR,
            BAS_STRT: record.BAS_STRT,
            ATV_STRT: record.ATV_STRT,
            GRP_NO: record.GRP_NO,
            DOR_UC: record.DOR_UC,
            PA_UC: record.PA_UC,
            SPASS_CD: record.SPASS_CD,
            JV: parseFloat(record.JV) || null,
            JV_CHNG: parseFloat(record.JV_CHNG) || null,
            TV_NSD: parseFloat(record.TV_NSD) || null,
            SALE_PRC1: parseFloat(record.SALE_PRC1) || null,
            SALE_YR1: parseInt(record.SALE_YR1) || null,
            SALE_MO1: parseInt(record.SALE_MO1) || null,
            OR_BOOK1: record.OR_BOOK1,
            OR_PAGE1: record.OR_PAGE1,
            CLERK_NO1: record.CLERK_NO1,
            VI_CD1: record.VI_CD1,
            QUAL_CD1: record.QUAL_CD1,
            SALE_PRC2: parseFloat(record.SALE_PRC2) || null,
            SALE_YR2: parseInt(record.SALE_YR2) || null,
            SALE_MO2: parseInt(record.SALE_MO2) || null,
            OR_BOOK2: record.OR_BOOK2,
            OR_PAGE2: record.OR_PAGE2,
            CLERK_NO2: record.CLERK_NO2,
            VI_CD2: record.VI_CD2,
            QUAL_CD2: record.QUAL_CD2,
            OWN_NAME: record.OWN_NAME,
            OWN_ADDR1: record.OWN_ADDR1,
            OWN_ADDR2: record.OWN_ADDR2,
            OWN_CITY: record.OWN_CITY,
            OWN_STATE: record.OWN_STATE,
            OWN_ZIPCD: record.OWN_ZIPCD,
            OWN_STATE2: record.OWN_STATE2,
            OWN_ZIPCDA: record.OWN_ZIPCDA,
            FIDU_NAME: record.FIDU_NAME,
            FIDU_ADDR1: record.FIDU_ADDR1,
            FIDU_ADDR2: record.FIDU_ADDR2,
            FIDU_CITY: record.FIDU_CITY,
            FIDU_STATE: record.FIDU_STATE,
            FIDU_ZIPCD: record.FIDU_ZIPCD,
            FIDU_CD: record.FIDU_CD,
            S_LEGAL: record.S_LEGAL,
            APP_STAT: record.APP_STAT,
            CO_APP_STA: record.CO_APP_STA,
            MKT_AR: record.MKT_AR,
            NBRHD_CD: record.NBRHD_CD,
            NBRHD_CD1: record.NBRHD_CD1,
            NBRHD_CD2: record.NBRHD_CD2,
            NBRHD_CD3: record.NBRHD_CD3,
            NBRHD_CD4: record.NBRHD_CD4,
            TAX_AUTH_C: record.TAX_AUTH_C,
            DOR_CD1: record.DOR_CD1,
            DOR_CD2: record.DOR_CD2,
            DOR_CD3: record.DOR_CD3,
            DOR_CD4: record.DOR_CD4,
            LND_VAL: parseFloat(record.LND_VAL) || null,
            AG_VAL: parseFloat(record.AG_VAL) || null,
            LND_SQFOOT: parseFloat(record.LND_SQFOOT) || null,
            IMP_QUAL: record.IMP_QUAL,
            CONST_CLAS: record.CONST_CLAS,
            EFF_YR_BLT: parseInt(record.EFF_YR_BLT) || null,
            ACT_YR_BLT: parseInt(record.ACT_YR_BLT) || null,
            TOT_LVG_AR: parseFloat(record.TOT_LVG_AR) || null,
            NO_BULDNG: parseInt(record.NO_BULDNG) || null,
            NO_RES_UNT: parseInt(record.NO_RES_UNT) || null,
            SPEC_FEAT_: record.SPEC_FEAT_,
            M_PAR_SAL1: record.M_PAR_SAL1,
            QUAL_CD2_: record.QUAL_CD2_,
            VI_CD2_: record.VI_CD2_,
            SALE_PRC2_: parseFloat(record.SALE_PRC2_) || null,
            SALE_YR2_: parseInt(record.SALE_YR2_) || null,
            SALE_MO2_: parseInt(record.SALE_MO2_) || null,
            OR_BOOK2_: record.OR_BOOK2_,
            OR_PAGE2_: record.OR_PAGE2_,
            CLERK_N_2: record.CLERK_N_2,
            M_PAR_SAL2: record.M_PAR_SAL2,
            IMP_VAL: parseFloat(record.IMP_VAL) || null,
            NCONST_VAL: parseFloat(record.NCONST_VAL) || null,
            CONST_VAL: parseFloat(record.CONST_VAL) || null,
            PUBLIC_LND: record.PUBLIC_LND,
            DISTR_CD: record.DISTR_CD,
            DISTR_YR: parseInt(record.DISTR_YR) || null,
            DISTR_NO: record.DISTR_NO,
            FRONT: parseFloat(record.FRONT) || null,
            DEPTH: parseFloat(record.DEPTH) || null,
            CAP: record.CAP,
            CENSUS_BK: record.CENSUS_BK,
            PHY_ADDR1: record.PHY_ADDR1,
            PHY_ADDR2: record.PHY_ADDR2,
            PHY_CITY: record.PHY_CITY,
            PHY_ZIPCD: record.PHY_ZIPCD,
            CAPE_SHPA: record.CAPE_SHPA,
            LATITUDE: parseFloat(record.LATITUDE) || null,
            LONGITUDE: parseFloat(record.LONGITUDE) || null,
            PARCEL_ID_: record.PARCEL_ID_,
            YR_VAL_TRN: parseInt(record.YR_VAL_TRN) || null,
            SEQ_NO: parseInt(record.SEQ_NO) || null,
            RS_ID: record.RS_ID,
            MP_ID: record.MP_ID,
            STATE_PAR_: record.STATE_PAR_,
            SPC_CIR_CD: record.SPC_CIR_CD,
            SPC_CIR_YR: parseInt(record.SPC_CIR_YR) || null,
            SPC_CIR_TX: parseFloat(record.SPC_CIR_TX) || null,
            S_CHNG_CD1: record.S_CHNG_CD1,
            S_CHNG_CD2: record.S_CHNG_CD2,
            PIN_1: record.PIN_1,
            PIN_2: record.PIN_2,
            HALF_CD: record.HALF_CD,
            TWP: record.TWP,
            RNG: record.RNG,
            SEC: record.SEC,
            SUB: record.SUB,
            BLK: record.BLK,
            LOT: record.LOT,
            PLAT_BOOK: record.PLAT_BOOK,
            PLAT_PAGE: record.PLAT_PAGE,
            geometry_wkt: record.geometry_wkt,
            import_batch: importBatch,
            data_source: 'FL_DOR_CSV'
        }));

        if (dryRun === 'true') {
            console.log(`DRY RUN: Would insert ${parcels.length} records`);
            console.log('Sample record:', JSON.stringify(parcels[0], null, 2).substring(0, 500) + '...');
            return { success: parcels.length, failed: 0 };
        }

        // Insert in smaller sub-batches to avoid timeouts
        const subBatchSize = 100;
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < parcels.length; i += subBatchSize) {
            const batch = parcels.slice(i, i + subBatchSize);

            const { data, error } = await supabase
                .from('florida_parcels')
                .upsert(batch, {
                    onConflict: 'CO_NO,PARCEL_ID',
                    ignoreDuplicates: false
                });

            if (error) {
                console.error(`Error inserting batch ${i}-${i + batch.length}:`, error.message);
                failedCount += batch.length;
            } else {
                successCount += batch.length;
            }
        }

        console.log(`${chunkName}: Inserted ${successCount}, Failed ${failedCount}`);
        return { success: successCount, failed: failedCount };

    } catch (error) {
        console.error(`Error processing ${chunkName}:`, error.message);
        return { success: 0, failed: records.length };
    }
}

// Run import
importChunk().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
}).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
EOF

# Install required Node packages if not present
if [ ! -d "node_modules/@supabase/supabase-js" ]; then
    echo -e "${BLUE}Installing required packages...${NC}"
    npm install --no-save @supabase/supabase-js csv-parse
fi

# Start import status tracking
echo -e "${BLUE}Recording import status...${NC}"
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data, error } = await supabase
        .from('florida_parcels_import_status')
        .insert({
            county_no: ${COUNTY_NO},
            county_name: '${COUNTY}',
            import_batch: '${IMPORT_BATCH}',
            total_records: ${FILE_SIZE},
            status: 'running'
        });

    if (error) console.error('Error recording import status:', error);
    else console.log('Import status recorded');
})();
"

# Process chunks in parallel
echo -e "${BLUE}Starting parallel import with $PARALLEL_JOBS workers...${NC}"
echo ""

# Export environment for parallel jobs
export -f cleanup
export SUPABASE_URL="${SUPABASE_URL:-$NEXT_PUBLIC_SUPABASE_URL}"
export SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-$SUPABASE_SERVICE_ROLE_KEY}"

# Create progress tracking
COMPLETED=0
FAILED=0

# Process chunks with progress
for chunk in "$TEMP_DIR"/*.csv; do
    while [ $(jobs -r | wc -l) -ge $PARALLEL_JOBS ]; do
        sleep 0.1
    done

    {
        node "$TEMP_DIR/import_chunk.js" "$chunk" "$IMPORT_BATCH" "$COUNTY_NO" "$DRY_RUN"
        if [ $? -eq 0 ]; then
            echo "SUCCESS: $(basename $chunk)"
        else
            echo "FAILED: $(basename $chunk)"
        fi
    } &
done

# Wait for all jobs to complete
wait

echo ""
echo -e "${GREEN}✅ Import completed!${NC}"
echo ""

# Update import status
echo -e "${BLUE}Updating import status...${NC}"
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { count } = await supabase
        .from('florida_parcels')
        .select('*', { count: 'exact', head: true })
        .eq('CO_NO', ${COUNTY_NO})
        .eq('import_batch', '${IMPORT_BATCH}');

    const { error } = await supabase
        .from('florida_parcels_import_status')
        .update({
            end_time: new Date().toISOString(),
            successful_records: count || 0,
            failed_records: ${FILE_SIZE} - (count || 0),
            status: 'completed'
        })
        .eq('import_batch', '${IMPORT_BATCH}');

    if (error) console.error('Error updating import status:', error);
    else console.log(\`Import complete: \${count || 0} records imported\`);
})();
"

echo ""
echo "Summary:"
echo "  County: $COUNTY"
echo "  Import batch: $IMPORT_BATCH"
echo "  Total chunks: $TOTAL_CHUNKS"
echo ""
echo "Verify import:"
echo "  SELECT COUNT(*) FROM florida_parcels WHERE CO_NO = $COUNTY_NO;"
echo "  SELECT * FROM florida_parcels_import_status WHERE import_batch = '$IMPORT_BATCH';"
