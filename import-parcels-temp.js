const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://tmlrvecuwgppbaynesji.supabase.co';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '1000');

// Get service key
function getServiceKey() {
  // Try environment variable first
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  
  // Try keychain
  try {
    const { execSync } = require('child_process');
    const key = execSync('security find-generic-password -s "ClaimGuardian-Supabase" -a "service-role-key" -w', {
      encoding: 'utf8'
    }).trim();
    if (key) return key;
  } catch (e) {
    // Ignore
  }
  
  // Try .env.local
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/);
    if (match) return match[1].trim();
  } catch (e) {
    // Ignore
  }
  
  throw new Error('Could not find service role key');
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, getServiceKey(), {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function importParcels() {
  console.log('Loading GeoJSON file...');
  const data = JSON.parse(fs.readFileSync('./data/florida/charlotte_parcels_2024.geojson', 'utf8'));
  const features = data.features;
  
  console.log(`Total features: ${features.length}`);
  console.log(`Processing in batches of ${BATCH_SIZE}...`);
  console.log('');
  
  let successCount = 0;
  let errorCount = 0;
  
  // Process in batches
  for (let i = 0; i < features.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(features.length / BATCH_SIZE);
    const batch = features.slice(i, i + BATCH_SIZE);
    
    console.log(`\nBatch ${batchNum}/${totalBatches} (${batch.length} records)...`);
    
    // Transform features to database records
    const records = batch.map(feature => {
      const props = feature.properties;
      const geom = feature.geometry;
      
      // Create WKT from geometry
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
        
        // Property details
        FILE_T: props.FILE_T,
        ASMNT_YR: props.ASMNT_YR ? parseInt(props.ASMNT_YR) : null,
        DOR_UC: props.DOR_UC,
        PA_UC: props.PA_UC,
        
        // Values (ensure numeric)
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
        import_batch: `charlotte_${new Date().toISOString().split('T')[0]}`,
        source_file: 'charlotte_parcels_2024.geojson',
        data_version: '2024.0'
      };
    });
    
    // Insert with retry logic
    let retries = 0;
    let success = false;
    
    while (retries < 3 && !success) {
      try {
        const { error } = await supabase
          .from('florida_parcels')
          .upsert(records, {
            onConflict: 'CO_NO,PARCEL_ID',
            ignoreDuplicates: false
          });
          
        if (error) {
          throw error;
        }
        
        successCount += records.length;
        success = true;
        console.log(`✅ Batch ${batchNum} complete`);
        
      } catch (error) {
        retries++;
        if (retries < 3) {
          console.log(`⚠️  Retry ${retries}/3 for batch ${batchNum}...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * retries));
        } else {
          console.error(`❌ Batch ${batchNum} failed after 3 retries:`, error.message);
          errorCount += records.length;
        }
      }
    }
    
    // Progress update
    const progress = Math.round((i + batch.length) / features.length * 100);
    const remaining = totalBatches - batchNum;
    console.log(`Progress: ${progress}% - ${remaining} batches remaining`);
  }
  
  console.log('\n=== Import Summary ===');
  console.log(`✅ Success: ${successCount} records`);
  console.log(`❌ Errors: ${errorCount} records`);
  console.log(`📊 Total: ${features.length} records`);
  
  // Verify count
  const { count, error } = await supabase
    .from('florida_parcels')
    .select('*', { count: 'exact', head: true })
    .eq('CO_NO', 15);
    
  if (!error) {
    console.log(`\n📈 Charlotte County parcels in database: ${count}`);
  }
}

// Run import
importParcels().catch(console.error);
