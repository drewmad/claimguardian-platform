#!/usr/bin/env node
/**
 * Phase 1: Charlotte County Import using existing database structure
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkExistingStructure() {
    console.log('🔍 Checking existing database structure...');

    try {
        // Check what tables exist
        const { data: tables, error: tablesError } = await supabase
            .rpc('get_table_info');

        if (tablesError) {
            // Fallback: try to query known tables
            console.log('📋 Checking for existing tables...');

            // Try florida_parcels table
            const { data: floridaParcels, error: fpError } = await supabase
                .from('florida_parcels')
                .select('*')
                .limit(1);

            if (!fpError) {
                console.log('✅ Found florida_parcels table');
                return 'florida_parcels';
            }

            // Try stg_florida_parcels
            const { data: stagingParcels, error: spError } = await supabase
                .from('stg_florida_parcels')
                .select('*')
                .limit(1);

            if (!spError) {
                console.log('✅ Found stg_florida_parcels table');
                return 'stg_florida_parcels';
            }

            // Try properties table from our new schema
            const { data: properties, error: pError } = await supabase
                .from('properties')
                .select('*')
                .limit(1);

            if (!pError) {
                console.log('✅ Found properties table');
                return 'properties';
            }

            console.log('❌ No suitable properties table found');
            return null;
        }

        return tables;

    } catch (error) {
        console.error('Error checking structure:', error);
        return null;
    }
}

async function importCharlotteData(targetTable) {
    console.log(`🏖️  Importing Charlotte County data to ${targetTable}...`);

    const csvPath = 'data/charlotte_county/charlotte_parcels.csv';

    if (!fs.existsSync(csvPath)) {
        throw new Error(`Charlotte County data not found at: ${csvPath}`);
    }

    // Read CSV file
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');

    console.log(`📊 Found ${lines.length - 1} records to import`);
    console.log(`📋 CSV Headers: ${headers.slice(0, 5).join(', ')}...`);

    // Process records in batches
    const batchSize = 50; // Smaller batches for initial testing
    let successCount = 0;
    let errorCount = 0;

    for (let i = 1; i < Math.min(101, lines.length); i += batchSize) { // Limit to first 100 for testing
        const batch = [];

        for (let j = i; j < Math.min(i + batchSize, Math.min(101, lines.length)); j++) {
            const values = lines[j].split(',');
            const record = {};

            headers.forEach((header, index) => {
                let value = values[index] || null;
                if (value) {
                    value = value.replace(/^"|"$/g, '').trim();
                    if (value === '') value = null;
                }
                record[header] = value;
            });

            // Transform based on target table
            let transformedRecord;

            if (targetTable === 'properties') {
                // New schema format
                transformedRecord = {
                    parcel_id: record.PARCEL_ID,
                    county_fips: '12015', // Charlotte County
                    coordinates: record.LATITUDE && record.LONGITUDE ? {
                        lat: parseFloat(record.LATITUDE),
                        lng: parseFloat(record.LONGITUDE)
                    } : {},
                    bbox: {},
                    area_sqft: parseFloat(record.LND_SQFOOT) || null,
                    area_acres: record.LND_SQFOOT ? (parseFloat(record.LND_SQFOOT) / 43560) : null,
                    address: [record.PHY_ADDR1, record.PHY_CITY].filter(Boolean).join(', '),
                    owner_name: record.OWN_NAME,
                    owner_address: {
                        street: record.OWN_ADDR1,
                        city: record.OWN_CITY,
                        state: record.OWN_STATE,
                        zip: record.OWN_ZIPCD
                    },
                    property_value: parseFloat(record.TV_NSD) || null,
                    assessed_value: parseFloat(record.TV_NSD) || null,
                    year_built: parseInt(record.ACT_YR_BLT) || null,
                    spatial_features: {
                        coastal: true,
                        county_name: 'Charlotte'
                    },
                    risk_factors: {
                        hurricane: 0.7,
                        flood: 0.5
                    },
                    property_features: {
                        square_feet: parseFloat(record.TOT_LVG_AR) || null,
                        buildings: parseInt(record.NO_BULDNG) || null
                    },
                    source_file: 'charlotte_parcels.csv',
                    data_vintage: '2024-01-01'
                };
            } else {
                // Existing schema - use original CSV structure
                transformedRecord = {
                    ...record,
                    CO_NO: '15', // Ensure Charlotte County
                    county_fips: '15'
                };
            }

            // Only add records with valid data
            if (transformedRecord.parcel_id || transformedRecord.PARCEL_ID) {
                batch.push(transformedRecord);
            }
        }

        if (batch.length > 0) {
            try {
                const { error } = await supabase
                    .from(targetTable)
                    .insert(batch);

                if (error) {
                    console.error(`❌ Batch ${Math.floor(i/batchSize) + 1} error:`, error.message);
                    errorCount += batch.length;
                } else {
                    successCount += batch.length;
                    console.log(`   ✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} records imported`);
                }
            } catch (err) {
                console.error(`❌ Unexpected error:`, err.message);
                errorCount += batch.length;
            }
        }
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`   Successfully imported: ${successCount} records`);
    console.log(`   Errors: ${errorCount} records`);

    return { successCount, errorCount };
}

async function verifyImport(targetTable) {
    console.log(`🔍 Verifying import in ${targetTable}...`);

    try {
        // Check Charlotte County records
        const { data: properties, error } = await supabase
            .from(targetTable)
            .select('*')
            .or('county_fips.eq.12015,CO_NO.eq.15')
            .limit(5);

        if (error) throw error;

        console.log(`📊 Verification Results:`);
        console.log(`   Charlotte County records found: ${properties.length} (showing first 5)`);

        if (properties.length > 0) {
            const sample = properties[0];
            console.log(`   Sample record:`);
            console.log(`     Parcel ID: ${sample.parcel_id || sample.PARCEL_ID}`);
            console.log(`     Address: ${sample.address || sample.PHY_ADDR1}`);
            console.log(`     Coordinates: ${sample.coordinates?.lat || sample.LATITUDE}, ${sample.coordinates?.lng || sample.LONGITUDE}`);
            console.log(`     Property Value: $${(sample.property_value || sample.TV_NSD)?.toLocaleString() || 'N/A'}`);
        }

        // Check total count
        const { count } = await supabase
            .from(targetTable)
            .select('*', { count: 'exact', head: true })
            .or('county_fips.eq.12015,CO_NO.eq.15');

        console.log(`   Total Charlotte County records: ${count}`);

        return count;

    } catch (error) {
        console.error('❌ Verification failed:', error);
        return 0;
    }
}

async function main() {
    console.log('🏖️  PHASE 1: Charlotte County Foundation (Existing Schema)');
    console.log('=======================================================');

    try {
        // Step 1: Check existing structure
        const targetTable = await checkExistingStructure();

        if (!targetTable) {
            throw new Error('No suitable table found for import');
        }

        console.log(`🎯 Using table: ${targetTable}`);

        // Step 2: Import data
        const results = await importCharlotteData(targetTable);

        if (results.successCount === 0) {
            throw new Error('No records were successfully imported');
        }

        // Step 3: Verify import
        const totalCount = await verifyImport(targetTable);

        console.log('');
        console.log('🎉 Phase 1 Complete!');
        console.log('');
        console.log('📋 Summary:');
        console.log(`   ✅ Table used: ${targetTable}`);
        console.log(`   ✅ Records imported: ${results.successCount}`);
        console.log(`   ✅ Total Charlotte County records: ${totalCount}`);
        console.log('');
        console.log('🔗 Next Steps:');
        console.log('   1. Review data in Supabase dashboard');
        console.log('   2. Test spatial queries if using PostGIS');
        console.log('   3. When ready, proceed to Phase 2 with full dataset');
        console.log('');
        console.log('🔗 Useful URLs:');
        console.log('   Dashboard: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji');
        console.log('   Table Editor: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor');

    } catch (error) {
        console.error('❌ Phase 1 failed:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}
