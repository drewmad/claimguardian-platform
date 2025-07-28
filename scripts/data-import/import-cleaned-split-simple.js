#!/usr/bin/env node

/**
 * Simple CSV import using Supabase's file upload approach
 * Processes files one at a time with minimal overhead
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load env vars
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLEANED_SPLIT_DIR = path.join(process.cwd(), 'CleanedSplit');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

// Simple progress display
function showProgress(current, total, startTime) {
  const percent = ((current / total) * 100).toFixed(1);
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = current / elapsed;
  const eta = (total - current) / rate;
  
  console.log(`\n📊 Progress: ${current}/${total} files (${percent}%)`);
  console.log(`⏱️  Elapsed: ${Math.floor(elapsed / 60)}m ${Math.floor(elapsed % 60)}s`);
  console.log(`⏳ ETA: ${Math.floor(eta / 60)}m ${Math.floor(eta % 60)}s`);
}

// Process single file by reading all data at once
async function processFile(filePath, index, total) {
  const fileName = path.basename(filePath);
  const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
  
  console.log(`\n[${ index}/${total}] Processing ${fileName} (${fileSize} MB)`);
  console.log('─'.repeat(50));
  
  try {
    // Read entire file
    console.log('📖 Reading file...');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.trim().split('\n');
    
    if (lines.length < 2) {
      throw new Error('File has no data');
    }
    
    // Parse CSV
    console.log(`📊 Parsing ${(lines.length - 1).toLocaleString()} records...`);
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const records = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',');
      const record = {};
      
      headers.forEach((header, idx) => {
        let value = values[idx] || '';
        // Remove quotes and convert empty to null
        value = value.replace(/^"|"$/g, '').trim();
        record[header] = value === '' ? null : value;
      });
      
      records.push(record);
    }
    
    // Upload in chunks
    const chunkSize = 5000;
    const chunks = Math.ceil(records.length / chunkSize);
    
    console.log(`📤 Uploading in ${chunks} chunks...`);
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, records.length);
      const chunk = records.slice(start, end);
      
      process.stdout.write(`   Chunk ${i + 1}/${chunks}... `);
      
      const { error } = await supabase
        .from('florida_parcels_csv_import')
        .insert(chunk);
      
      if (error) {
        console.log('❌ Failed');
        throw error;
      }
      
      console.log('✅');
    }
    
    // Transfer to main table
    console.log('🔄 Transferring to main table...');
    const { error: transferError } = await supabase.rpc('transfer_florida_parcels_staging');
    
    if (transferError) {
      throw transferError;
    }
    
    console.log('✅ Success!');
    return true;
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

// Main
async function main() {
  console.log('🚀 Florida Parcels Simple Import');
  console.log('================================\n');
  
  const csvFiles = fs.readdirSync(CLEANED_SPLIT_DIR)
    .filter(file => file.endsWith('.csv'))
    .sort();
  
  console.log(`📁 Found ${csvFiles.length} CSV files in CleanedSplit/\n`);
  
  if (csvFiles.length === 0) {
    console.log('No files to process');
    return;
  }
  
  console.log('Starting in 3 seconds... (Ctrl+C to cancel)\n');
  await new Promise(r => setTimeout(r, 3000));
  
  const startTime = Date.now();
  let successCount = 0;
  
  // Process each file
  for (let i = 0; i < csvFiles.length; i++) {
    const filePath = path.join(CLEANED_SPLIT_DIR, csvFiles[i]);
    
    const success = await processFile(filePath, i + 1, csvFiles.length);
    
    if (success) {
      successCount++;
      
      // Move file
      const importedDir = path.join(process.cwd(), 'CleanedSplit_imported');
      if (!fs.existsSync(importedDir)) {
        fs.mkdirSync(importedDir);
      }
      
      fs.renameSync(filePath, path.join(importedDir, csvFiles[i]));
      console.log(`📦 Moved to CleanedSplit_imported/`);
    } else {
      console.log('❌ File kept due to errors');
    }
    
    // Show progress
    if (i < csvFiles.length - 1) {
      showProgress(i + 1, csvFiles.length, startTime);
    }
  }
  
  // Summary
  const duration = (Date.now() - startTime) / 1000;
  console.log('\n' + '='.repeat(50));
  console.log('📊 COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${successCount}/${csvFiles.length} files`);
  console.log(`⏱️  Duration: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`);
  console.log(`⚡ Average: ${(duration / csvFiles.length).toFixed(1)}s per file`);
  console.log('\n✨ Done!');
}

// Run
main().catch(console.error);