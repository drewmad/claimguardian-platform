#!/usr/bin/env node
/**
 * Extract Charlotte County (FIPS: 12015) data from existing CSV files
 * For Phase 1 testing with manageable dataset
 */

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createWriteStream } = require('fs');

const CHARLOTTE_FIPS = '12015';
const INPUT_DIR = 'CleanedSplit';
const OUTPUT_DIR = 'data/charlotte_county';

async function extractCharlotteCounty() {
    console.log('🏖️  Extracting Charlotte County data for Phase 1...');

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Get all CSV files
    const csvFiles = fs.readdirSync(INPUT_DIR)
        .filter(f => f.endsWith('.csv'))
        .sort();

    console.log(`📄 Found ${csvFiles.length} CSV files to process`);

    let totalRecords = 0;
    let charlotteRecords = 0;
    const outputFile = path.join(OUTPUT_DIR, 'charlotte_parcels.csv');
    const outputStream = createWriteStream(outputFile);
    let headerWritten = false;

    for (const csvFile of csvFiles) {
        const filePath = path.join(INPUT_DIR, csvFile);
        console.log(`   Processing: ${csvFile}`);

        const records = await new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => {
                    totalRecords++;

                    // Check if this is Charlotte County
                    if (data.CO_NO === CHARLOTTE_FIPS || data.co_no === CHARLOTTE_FIPS) {
                        results.push(data);
                        charlotteRecords++;
                    }
                })
                .on('end', () => resolve(results))
                .on('error', reject);
        });

        // Write Charlotte County records
        if (records.length > 0) {
            if (!headerWritten) {
                // Write header
                const headers = Object.keys(records[0]);
                outputStream.write(headers.join(',') + '\n');
                headerWritten = true;
            }

            // Write data rows
            for (const record of records) {
                const values = Object.values(record).map(val =>
                    typeof val === 'string' && val.includes(',') ? `"${val}"` : val
                );
                outputStream.write(values.join(',') + '\n');
            }

            console.log(`     ✅ Found ${records.length} Charlotte County records`);
        }
    }

    outputStream.end();

    console.log('\n📊 Extraction Summary:');
    console.log(`   Total records processed: ${totalRecords.toLocaleString()}`);
    console.log(`   Charlotte County records: ${charlotteRecords.toLocaleString()}`);
    console.log(`   Output file: ${outputFile}`);
    console.log(`   File size: ${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB`);

    if (charlotteRecords === 0) {
        console.log('\n⚠️  No Charlotte County records found!');
        console.log('   Checking CO_NO values in sample files...');
        await checkCountyValues();
    }

    return charlotteRecords;
}

async function checkCountyValues() {
    const sampleFile = path.join(INPUT_DIR, fs.readdirSync(INPUT_DIR)[0]);
    console.log(`   Sampling: ${sampleFile}`);

    const countyCounts = {};

    return new Promise((resolve) => {
        let count = 0;
        fs.createReadStream(sampleFile)
            .pipe(csv())
            .on('data', (data) => {
                count++;
                const county = data.CO_NO || data.co_no || data.COUNTY_FIPS || data.county_fips;
                if (county) {
                    countyCounts[county] = (countyCounts[county] || 0) + 1;
                }

                // Stop after 1000 records to get a sample
                if (count >= 1000) {
                    return;
                }
            })
            .on('end', () => {
                console.log('   County codes found:');
                Object.entries(countyCounts)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 10)
                    .forEach(([county, count]) => {
                        console.log(`     ${county}: ${count} records`);
                    });
                resolve();
            });
    });
}

// Run extraction
if (require.main === module) {
    extractCharlotteCounty()
        .then((count) => {
            if (count > 0) {
                console.log('\n✅ Charlotte County extraction completed!');
                console.log('📋 Next steps:');
                console.log('   1. Apply database schema: scripts/charlotte-county-schema.sql');
                console.log('   2. Run Phase 1: ./scripts/phased-deployment.sh 1');
            } else {
                console.log('\n❌ No Charlotte County data found');
                console.log('💡 Try running with different county FIPS codes');
            }
        })
        .catch(console.error);
}
