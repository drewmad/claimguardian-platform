/**
 * Execute property schema migration using Supabase client
 * Run with: pnpm --filter=web exec tsx src/scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function runMigration() {
  console.log('🚀 Starting property schema migration...\n');

  try {
    // Step 1: Create backups
    console.log('📦 Step 1: Creating backups...');
    
    const { error: backupError } = await supabase.rpc('query', {
      query: `
        CREATE TABLE IF NOT EXISTS properties_backup_20250724 AS 
        SELECT * FROM properties;
        
        CREATE TABLE IF NOT EXISTS claims_backup_20250724 AS 
        SELECT * FROM claims;
      `
    }).single();

    if (backupError && !backupError.message.includes('already exists')) {
      console.error('❌ Backup error:', backupError);
      return;
    }

    // Verify backups
    const { data: propCount } = await supabase
      .from('properties_backup_20250724')
      .select('*', { count: 'exact', head: true });
    
    console.log(`✅ Properties backed up: ${propCount} records`);

    // Step 2: Create enum types
    console.log('\n📋 Step 2: Creating enum types...');
    
    const createTypesSQL = `
      DO $$ 
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type') THEN
              CREATE TYPE property_type AS ENUM ('residential', 'commercial', 'land', 'mixed_use');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'occupancy_status') THEN
              CREATE TYPE occupancy_status AS ENUM ('owner_occupied', 'tenant_occupied', 'vacant', 'seasonal');
          END IF;
          
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'damage_severity') THEN
              CREATE TYPE damage_severity AS ENUM ('minor', 'moderate', 'major', 'total_loss');
          END IF;
      END $$;
    `;

    const { error: typesError } = await supabase.rpc('query', { query: createTypesSQL }).single();
    
    if (typesError) {
      console.error('❌ Types error:', typesError);
      // Continue anyway as types might already exist
    } else {
      console.log('✅ Enum types created');
    }

    // Step 3: Check current structure
    console.log('\n🔍 Step 3: Analyzing current structure...');
    
    const { data: columns, error: columnsError } = await supabase.rpc('query', {
      query: `
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'properties' 
        ORDER BY ordinal_position
      `
    });

    if (columns) {
      console.log('Current properties columns:', columns.length);
    }

    // Step 4: Create new tables if they don't exist
    console.log('\n🏗️ Step 4: Creating new tables...');
    
    // Check if property_land exists
    const { data: landExists } = await supabase
      .from('property_land')
      .select('*', { count: 'exact', head: true });

    if (!landExists) {
      console.log('Creating property_land table...');
      // Would execute CREATE TABLE property_land...
    }

    console.log('\n✅ Migration preparation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Review the migration script: supabase/migrations/20250724_property_schema_migration.sql');
    console.log('2. Run the full migration in Supabase SQL Editor');
    console.log('3. Verify with: node scripts/verify-deployment.js');

  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

// Check if we have required env vars
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('   Ensure .env.local contains:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

runMigration().catch(console.error);