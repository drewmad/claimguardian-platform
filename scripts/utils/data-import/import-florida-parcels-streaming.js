#!/usr/bin/env node

/**
 * Streaming CSV import for very large Florida parcels files
 * Handles files too large for memory efficiently
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const readline = require('readline');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BATCH_SIZE = 500; // Smaller batches for streaming

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

class CSVStreamer {
  constructor(filePath) {
    this.filePath = filePath;
    this.headers = null;
    this.lineNumber = 0;
    this.batch = [];
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: Date.now()
    };
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  transformRecord(values) {
    const record = {};
    
    this.headers.forEach((header, index) => {
      const value = values[index];
      // Handle empty strings and convert to null
      record[header] = value === '' || value === '""' ? null : value;
    });
    
    return record;
  }

  async processBatch() {
    if (this.batch.length === 0) return;

    try {
      const { error } = await supabase
        .from('florida_parcels_csv_import')
        .insert(this.batch);

      if (error) {
        console.error(`\n❌ Batch error: ${error.message}`);
        this.stats.failed += this.batch.length;
      } else {
        this.stats.successful += this.batch.length;
      }
    } catch (err) {
      console.error(`\n❌ Unexpected error: ${err.message}`);
      this.stats.failed += this.batch.length;
    }

    this.stats.processed += this.batch.length;
    this.batch = [];
    
    // Progress update
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const rate = this.stats.processed / elapsed;
    process.stdout.write(`\r📊 Processed: ${this.stats.processed} | Success: ${this.stats.successful} | Failed: ${this.stats.failed} | Rate: ${rate.toFixed(0)}/sec`);
  }

  async stream() {
    const fileStream = fs.createReadStream(this.filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    console.log(`\n🌊 Streaming: ${path.basename(this.filePath)}`);

    for await (const line of rl) {
      this.lineNumber++;

      if (this.lineNumber === 1) {
        // Parse headers
        this.headers = this.parseCSVLine(line);
        continue;
      }

      const values = this.parseCSVLine(line);
      
      if (values.length !== this.headers.length) {
        console.error(`\n⚠️  Line ${this.lineNumber}: Column count mismatch`);
        this.stats.failed++;
        continue;
      }

      const record = this.transformRecord(values);
      this.batch.push(record);

      if (this.batch.length >= BATCH_SIZE) {
        await this.processBatch();
      }
    }

    // Process remaining batch
    await this.processBatch();
    
    console.log(`\n✅ Streaming complete for ${path.basename(this.filePath)}`);
    return this.stats;
  }
}

async function estimateCosts(totalRecords, totalSizeGB) {
  console.log('\n💰 Supabase Cost Breakdown:');
  console.log('===========================');
  
  // Florida parcels data specifics
  console.log('\n📊 Florida Parcels Dataset:');
  console.log(`   - Total parcels: ~${(totalRecords / 1000000).toFixed(1)}M`);
  console.log(`   - Raw data size: ~${totalSizeGB.toFixed(1)} GB`);
  console.log(`   - Counties: 67 (all Florida counties)`);
  
  // Storage calculation
  const indexMultiplier = 2.5; // Indexes typically 1.5-2.5x data
  const totalDBSize = totalSizeGB * indexMultiplier;
  
  console.log('\n💾 Database Storage:');
  console.log(`   - Base data: ${totalSizeGB.toFixed(1)} GB`);
  console.log(`   - With indexes: ${totalDBSize.toFixed(1)} GB`);
  console.log(`   - Monthly cost: $${(totalDBSize * 0.125).toFixed(2)} ($0.125/GB)`);
  
  // Compute costs (if using Edge Functions)
  console.log('\n⚡ Edge Functions (if used):');
  console.log(`   - Free tier: 500K invocations/month`);
  console.log(`   - Additional: $2 per 1M invocations`);
  
  // Bandwidth
  const avgQuerySizeKB = 50; // Average query returns 50KB
  const monthlyQueries = 100000; // Estimate
  const monthlyBandwidthGB = (monthlyQueries * avgQuerySizeKB) / 1024 / 1024;
  
  console.log('\n🌐 Bandwidth:');
  console.log(`   - Free tier: 50 GB/month`);
  console.log(`   - Estimated usage: ${monthlyBandwidthGB.toFixed(1)} GB/month`);
  console.log(`   - Additional cost: $${Math.max(0, (monthlyBandwidthGB - 50) * 0.09).toFixed(2)} ($0.09/GB)`);
  
  // Total monthly cost
  const storageCost = totalDBSize * 0.125;
  const bandwidthCost = Math.max(0, (monthlyBandwidthGB - 50) * 0.09);
  const totalMonthlyCost = storageCost + bandwidthCost;
  
  console.log('\n💵 Total Monthly Cost:');
  console.log(`   - Storage: $${storageCost.toFixed(2)}`);
  console.log(`   - Bandwidth: $${bandwidthCost.toFixed(2)}`);
  console.log(`   - TOTAL: $${totalMonthlyCost.toFixed(2)}/month`);
  
  // Pro plan considerations
  console.log('\n📋 Plan Recommendations:');
  if (totalDBSize > 8) {
    console.log(`   ⚠️  Database size (${totalDBSize.toFixed(1)} GB) exceeds Free tier (8 GB)`);
    console.log(`   ✅ Recommended: Pro plan ($25/month base + usage)`);
  } else {
    console.log(`   ✅ Free tier sufficient for storage`);
  }
  
  // Performance tips
  console.log('\n🚀 Performance Optimization:');
  console.log('   - Create indexes on: parcel_id, county_fips, own_name');
  console.log('   - Use partial indexes for sale_prc > 0');
  console.log('   - Enable RLS for security');
  console.log('   - Consider partitioning by county for large queries');
}

async function main() {
  const inputPath = process.argv[2];
  
  if (!inputPath) {
    console.log('Usage: node import-florida-parcels-streaming.js <csv-file-or-directory>');
    console.log('\nExample:');
    console.log('  node import-florida-parcels-streaming.js ./florida_parcels.csv');
    console.log('  node import-florida-parcels-streaming.js ./parcels_directory/');
    process.exit(1);
  }

  const stats = fs.statSync(inputPath);
  let files = [];
  let totalSize = 0;

  if (stats.isDirectory()) {
    files = fs.readdirSync(inputPath)
      .filter(f => f.toLowerCase().endsWith('.csv'))
      .map(f => path.join(inputPath, f));
  } else if (stats.isFile() && inputPath.toLowerCase().endsWith('.csv')) {
    files = [inputPath];
  } else {
    console.error('❌ Input must be a CSV file or directory containing CSV files');
    process.exit(1);
  }

  console.log('🚀 Florida Parcels Streaming Import');
  console.log('==================================\n');
  console.log(`📁 Files to process: ${files.length}`);

  let totalRecords = 0;
  const startTime = Date.now();

  for (const file of files) {
    const fileSize = fs.statSync(file).size;
    totalSize += fileSize;
    
    const streamer = new CSVStreamer(file);
    const fileStats = await streamer.stream();
    totalRecords += fileStats.processed;
  }

  // Transfer to main table
  console.log('\n\n🔄 Transferring from staging to main table...');
  try {
    await supabase.rpc('transfer_florida_parcels_staging');
    console.log('✅ Transfer complete!');
  } catch (error) {
    console.error('❌ Transfer failed:', error.message);
  }

  // Final statistics
  const duration = (Date.now() - startTime) / 1000;
  console.log('\n📊 Import Summary');
  console.log('=================');
  console.log(`✅ Total records: ${totalRecords.toLocaleString()}`);
  console.log(`⏱️  Duration: ${(duration / 60).toFixed(2)} minutes`);
  console.log(`⚡ Average speed: ${(totalRecords / duration).toFixed(0)} records/second`);

  // Cost estimation
  const totalSizeGB = totalSize / (1024 * 1024 * 1024);
  await estimateCosts(totalRecords, totalSizeGB);
}

if (require.main === module) {
  main().catch(console.error);
}