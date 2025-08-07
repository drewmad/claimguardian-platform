#\!/bin/bash

# Charlotte County batch loading script
set -euo pipefail

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
DATA_FILE="./data/florida/charlotte_parcels_2024.geojson"
BATCH_SIZE=1000
START_BATCH=${1:-0}
END_BATCH=${2:-10}  # Process 10 batches at a time

echo -e "${GREEN}=== Charlotte County Batch Import ===${NC}"
echo -e "${BLUE}Data file:${NC} ${DATA_FILE}"
echo -e "${BLUE}Batch size:${NC} ${BATCH_SIZE} records"
echo -e "${BLUE}Processing batches:${NC} ${START_BATCH} to ${END_BATCH}"
echo ""

# Check if file exists
if [ \! -f "$DATA_FILE" ]; then
    echo -e "${RED}Error: Data file not found\!${NC}"
    exit 1
fi

# Create batch extraction script
cat > /tmp/process-batch.cjs << 'EOJS'
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://tmlrvecuwgppbaynesji.supabase.co';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '1000');
const START_BATCH = parseInt(process.env.START_BATCH || '0');
const END_BATCH = parseInt(process.env.END_BATCH || '10');

// Get service key
function getServiceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }

  try {
    const { execSync } = require('child_process');
    const key = execSync('security find-generic-password -s "ClaimGuardian-Supabase" -a "service-role-key" -w', {
      encoding: 'utf8'
    }).trim();
    if (key) return key;
  } catch (e) {
    // Ignore
  }

  throw new Error('Could not find service role key');
}

// Initialize Supabase
const supabase = createClient(SUPABASE_URL, getServiceKey(), {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function processBatches() {
  console.log('Processing batches', START_BATCH, 'to', END_BATCH);

  // Use jq to extract specific batches
  const { execSync } = require('child_process');

  for (let batchNum = START_BATCH; batchNum <= END_BATCH; batchNum++) {
    const startIdx = batchNum * BATCH_SIZE;
    const endIdx = (batchNum + 1) * BATCH_SIZE;

    console.log(`\nBatch ${batchNum + 1}: Extracting records ${startIdx + 1} to ${endIdx}...`);

    try {
      // Extract batch using jq
      const batchJson = execSync(
        `jq '.features[${startIdx}:${endIdx}]' "${process.env.DATA_FILE}"`,
        { encoding: 'utf8', maxBuffer: 100 * 1024 * 1024 }
      );

      const features = JSON.parse(batchJson);

      if (features.length === 0) {
        console.log('No more features to process');
        break;
      }

      // Transform to database records
      const records = features.map(feature => {
        const props = feature.properties;
        const geom = feature.geometry;

        // Create WKT
        let wkt = null;
        if (geom && geom.type === 'Polygon' && geom.coordinates) {
          const rings = geom.coordinates.map(ring =>
            ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')
          ).join('),(');
          wkt = `SRID=4326;POLYGON((${rings}))`;
        } else if (geom && geom.type === 'MultiPolygon' && geom.coordinates) {
          const polygons = geom.coordinates.map(polygon => {
            const rings = polygon.map(ring =>
              ring.map(coord => `${coord[0]} ${coord[1]}`).join(',')
            ).join('),(');
            return `((${rings}))`;
          }).join(',');
          wkt = `SRID=4326;MULTIPOLYGON(${polygons})`;
        }

        return {
          CO_NO: 15,
          PARCEL_ID: props.PARCEL_ID,
          county_fips: '12015',

          // Core fields
          FILE_T: props.FILE_T,
          ASMNT_YR: props.ASMNT_YR ? parseInt(props.ASMNT_YR) : null,
          DOR_UC: props.DOR_UC,
          PA_UC: props.PA_UC,

          // Values
          JV: props.JV ? parseFloat(props.JV) : null,
          JV_HMSTD: props.JV_HMSTD ? parseFloat(props.JV_HMSTD) : null,
          AV_HMSTD: props.AV_HMSTD ? parseFloat(props.AV_HMSTD) : null,
          LND_VAL: props.LND_VAL ? parseFloat(props.LND_VAL) : null,
          LND_SQFOOT: props.LND_SQFOOT ? parseFloat(props.LND_SQFOOT) : null,
          IMP_VAL: props.IMP_VAL ? parseFloat(props.IMP_VAL) : null,

          // Building info
          TOT_LVG_AR: props.TOT_LVG_AR ? parseFloat(props.TOT_LVG_AR) : null,
          NO_BULDNG: props.NO_BULDNG ? parseInt(props.NO_BULDNG) : null,
          NO_RES_UNT: props.NO_RES_UNT ? parseInt(props.NO_RES_UNT) : null,
          EFF_YR_BLT: props.EFF_YR_BLT ? parseInt(props.EFF_YR_BLT) : null,
          ACT_YR_BLT: props.ACT_YR_BLT ? parseInt(props.ACT_YR_BLT) : null,

          // Owner info
          OWN_NAME: props.OWN_NAME || null,
          OWN_ADDR1: props.OWN_ADDR1 || null,
          OWN_CITY: props.OWN_CITY || null,
          OWN_STATE: props.OWN_STATE || null,
          OWN_ZIPCD: props.OWN_ZIPCD || null,

          // Property address
          PHY_ADDR1: props.PHY_ADDR1 || null,
          PHY_CITY: props.PHY_CITY || null,
          PHY_ZIPCD: props.PHY_ZIPCD || null,

          // Legal
          S_LEGAL: props.S_LEGAL || null,

          // Geometry
          geom: wkt,

          // Metadata
          data_source: 'FLORIDA_DOR_2024',
          import_batch: `charlotte_batch_${batchNum}`,
          source_file: 'charlotte_parcels_2024.geojson',
          data_version: '2024.0'
        };
      });

      // Insert to database
      const { error } = await supabase
        .from('florida_parcels')
        .upsert(records, {
          onConflict: 'CO_NO,PARCEL_ID',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`Batch ${batchNum + 1} error:`, error.message);
      } else {
        console.log(`✅ Batch ${batchNum + 1} complete (${records.length} records)`);
      }

    } catch (err) {
      console.error(`Error processing batch ${batchNum + 1}:`, err.message);
    }
  }

  // Verify total count
  const { count, error } = await supabase
    .from('florida_parcels')
    .select('*', { count: 'exact', head: true })
    .eq('CO_NO', 15);

  if (\!error) {
    console.log(`\nTotal Charlotte County parcels in database: ${count}`);
  }
}

processBatches().catch(console.error);
EOJS

# Copy to current directory
cp /tmp/process-batch.cjs ./process-batch-temp.cjs

# Run the batch processor
BATCH_SIZE=$BATCH_SIZE \
START_BATCH=$START_BATCH \
END_BATCH=$END_BATCH \
DATA_FILE="$DATA_FILE" \
node ./process-batch-temp.cjs

# Clean up
rm -f ./process-batch-temp.cjs /tmp/process-batch.cjs

echo ""
echo -e "${GREEN}Batch processing complete\!${NC}"
echo ""
echo "To continue with next batches, run:"
echo "./scripts/load-charlotte-batch.sh $((END_BATCH + 1)) $((END_BATCH + 10))"
