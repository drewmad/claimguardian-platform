#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('Missing .env.local file');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value.length) {
    env[key.trim()] = value.join('=').trim().replace(/^["']|["']$/g, '');
  }
});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Extract project ref
const projectRef = SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];
if (!projectRef) {
  console.error('Invalid Supabase URL format');
  process.exit(1);
}

console.log('🚀 Applying Florida Parcels Columns Migration\n');
console.log('Project:', projectRef);

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250725_add_missing_florida_parcels_columns.sql');
const sqlContent = fs.readFileSync(migrationPath, 'utf8');

// Since we can't execute DDL via REST API, let's provide instructions
console.log('\n📋 Migration content has been prepared.\n');

// Copy to clipboard if on macOS
if (process.platform === 'darwin') {
  const { execSync } = await import('child_process');
  try {
    execSync('pbcopy', { input: sqlContent });
    console.log('✅ Migration SQL copied to clipboard!\n');
  } catch (e) {
    console.log('⚠️  Could not copy to clipboard\n');
  }
}

// Open Supabase SQL editor
const dashboardUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
console.log('📝 To apply the migration:\n');
console.log('1. Opening Supabase SQL Editor...');
console.log(`   ${dashboardUrl}\n`);

if (process.platform === 'darwin') {
  const { exec } = await import('child_process');
  exec(`open "${dashboardUrl}"`);
}

console.log('2. Paste the migration SQL (already copied to clipboard)');
console.log('3. Click "Run" to execute\n');

console.log('The migration will add these missing columns:');
console.log('  - OWN_STATE2, OWN_ZIPCDA');
console.log('  - NBRHD_CD1-4, DOR_CD1-4');
console.log('  - AG_VAL, IMP_VAL, CONST_VAL');
console.log('  - LATITUDE, LONGITUDE');
console.log('  - PIN_1, PIN_2');
console.log('  - And 20+ more columns...\n');

console.log('After applying, your CSV imports will work with all Florida DOR headers.');

// Save a verification script
const verifyScript = `
-- Verify all columns were added
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'florida_parcels'
    AND column_name IN (
        'own_state2', 'own_zipcda', 'nbrhd_cd1', 'nbrhd_cd2', 
        'nbrhd_cd3', 'nbrhd_cd4', 'dor_cd1', 'dor_cd2', 
        'dor_cd3', 'dor_cd4', 'ag_val', 'qual_cd2_', 
        'vi_cd2_', 'sale_prc2_', 'sale_yr2_', 'sale_mo2_', 
        'or_book2_', 'or_page2_', 'clerk_n_2', 'imp_val', 
        'const_val', 'distr_no', 'front', 'depth', 'cap', 
        'cape_shpa', 'latitude', 'longitude', 'pin_1', 'pin_2', 
        'half_cd', 'twp', 'sub', 'blk', 'lot', 'plat_book', 'plat_page'
    )
ORDER BY column_name;

-- Check the CSV import view
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'florida_parcels_csv_import'
    AND column_name IN ('OWN_STATE2', 'LATITUDE', 'LONGITUDE', 'PIN_1')
LIMIT 5;
`;

const verifyPath = path.join(__dirname, 'verify-parcels-columns.sql');
fs.writeFileSync(verifyPath, verifyScript);
console.log(`\n📄 Verification script saved to: ${verifyPath}`);
console.log('   Run this after migration to confirm all columns were added.');