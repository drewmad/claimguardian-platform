#!/usr/bin/env node
/**
 * Simple Charlotte County Import - Works with existing florida_parcels table
 */

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load environment
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function importCharlotteCounty() {
    console.log('🏖️  Charlotte County Simple Import');
    console.log('=================================');
    
    const csvPath = 'data/charlotte_county/charlotte_parcels.csv';
    
    if (!fs.existsSync(csvPath)) {
        throw new Error(`Charlotte County data not found at: ${csvPath}`);
    }
    
    // Read and parse CSV
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    console.log(`📊 Found ${lines.length - 1} records to process`);
    
    // Process first 50 records for Phase 1 testing
    const maxRecords = Math.min(51, lines.length); // 50 data records + header
    let successCount = 0;
    let errorCount = 0;
    
    console.log(`🎯 Processing first ${maxRecords - 1} records for Phase 1...`);
    
    for (let i = 1; i < maxRecords; i++) {
        const values = lines[i].split(',');
        const record = {};
        
        // Parse CSV row
        headers.forEach((header, index) => {
            let value = values[index] || null;
            if (value) {
                value = value.replace(/^"|"$/g, '').trim();
                if (value === '') value = null;
            }
            record[header] = value;
        });
        
        // Transform to match existing schema (using uppercase columns)
        const transformedRecord = {};
        
        // Map common fields - use the exact column names from your CSV
        Object.keys(record).forEach(key => {
            // Keep the original column names as they appear in the CSV
            transformedRecord[key] = record[key];
        });
        
        try {
            // Insert directly to florida_parcels table
            const { error } = await supabase
                .from('florida_parcels')
                .insert([transformedRecord])
                .select();
            
            if (error) {
                console.error(`❌ Record ${i} error:`, error.message);
                errorCount++;
            } else {
                successCount++;
                if (successCount % 10 === 0) {
                    console.log(`   ✅ Imported ${successCount} records...`);
                }
            }
            
        } catch (err) {
            console.error(`❌ Unexpected error for record ${i}:`, err.message);
            errorCount++;
        }
        
        // Small delay to avoid rate limiting
        if (i % 5 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    
    console.log('\n📊 Import Summary:');
    console.log(`   ✅ Successfully imported: ${successCount} records`);
    console.log(`   ❌ Failed: ${errorCount} records`);
    
    // Verify import
    if (successCount > 0) {
        console.log('\n🔍 Verifying import...');
        
        const { data: charlotteRecords, error: verifyError } = await supabase
            .from('florida_parcels')
            .select('PARCEL_ID, PHY_ADDR1, OWN_NAME, LATITUDE, LONGITUDE')
            .eq('CO_NO', '15')
            .limit(5);
        
        if (!verifyError && charlotteRecords?.length > 0) {
            console.log(`✅ Found ${charlotteRecords.length} Charlotte County records:`);
            charlotteRecords.forEach((record, index) => {
                console.log(`   ${index + 1}. ${record.PARCEL_ID} - ${record.PHY_ADDR1}`);
            });
        } else {
            console.log('⚠️  No Charlotte County records found in verification');
        }
        
        // Get total count
        const { count } = await supabase
            .from('florida_parcels')
            .select('*', { count: 'exact', head: true })
            .eq('CO_NO', '15');
        
        console.log(`📈 Total Charlotte County records in database: ${count || 0}`);
    }
    
    console.log('\n🎉 Phase 1 Charlotte County Import Complete!');
    console.log('\n🔗 Next Steps:');
    console.log('   1. Review data in Supabase dashboard');
    console.log('   2. Test queries on Charlotte County data');
    console.log('   3. Scale to full dataset when ready');
    console.log('\n🔗 Dashboard: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji');
    
    return { successCount, errorCount, totalRecords: successCount };
}

// Execute
importCharlotteCounty().catch(console.error);