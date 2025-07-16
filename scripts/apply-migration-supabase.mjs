#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
});

// Read migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250716051556_add_claims_and_policies_tables.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split migration into logical sections
const sections = [
  {
    name: 'Create enum types',
    sql: `
      -- Create enum types if they don't exist
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'claim_status_enum') THEN
          CREATE TYPE public.claim_status_enum AS ENUM (
            'draft', 'submitted', 'under_review', 'approved',
            'denied', 'settled', 'closed', 'reopened'
          );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'damage_type_enum') THEN
          CREATE TYPE public.damage_type_enum AS ENUM (
            'hurricane', 'flood', 'wind', 'hail', 'fire',
            'water_damage', 'mold', 'theft', 'vandalism',
            'lightning', 'fallen_tree', 'other'
          );
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'policy_type_enum') THEN
          CREATE TYPE public.policy_type_enum AS ENUM (
            'HO3', 'HO5', 'HO6', 'HO8', 'DP1', 'DP3',
            'FLOOD', 'WIND', 'UMBRELLA', 'OTHER'
          );
        END IF;
      END $$;
    `
  },
  {
    name: 'Create policies table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.policies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        carrier_name text NOT NULL,
        policy_number text NOT NULL,
        policy_type public.policy_type_enum NOT NULL,
        effective_date date NOT NULL,
        expiration_date date NOT NULL,
        coverage_details jsonb DEFAULT '{}',
        premium_amount numeric(10, 2),
        deductible_amount numeric(10, 2),
        wind_deductible_percentage numeric(5, 2),
        flood_deductible_amount numeric(10, 2),
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        created_by uuid REFERENCES auth.users(id),
        UNIQUE (property_id, policy_number, policy_type)
      );
    `
  },
  {
    name: 'Create claims table',
    sql: `
      CREATE TABLE IF NOT EXISTS public.claims (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        claim_number text UNIQUE,
        property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
        policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE RESTRICT,
        user_id uuid NOT NULL REFERENCES auth.users(id),
        status public.claim_status_enum NOT NULL DEFAULT 'draft',
        damage_type public.damage_type_enum NOT NULL,
        date_of_loss date NOT NULL,
        date_reported date DEFAULT CURRENT_DATE,
        description text,
        estimated_value numeric(15, 2),
        deductible_applied numeric(15, 2),
        settled_value numeric(15, 2),
        settlement_date date,
        adjuster_name text,
        adjuster_phone text,
        adjuster_email text,
        claim_notes text,
        supporting_documents jsonb DEFAULT '[]',
        metadata jsonb DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `
  },
  {
    name: 'Add structured address columns',
    sql: `
      ALTER TABLE public.properties
      ADD COLUMN IF NOT EXISTS street_address text,
      ADD COLUMN IF NOT EXISTS city text,
      ADD COLUMN IF NOT EXISTS state text,
      ADD COLUMN IF NOT EXISTS postal_code text,
      ADD COLUMN IF NOT EXISTS county text,
      ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA';
    `
  },
  {
    name: 'Migrate address data',
    sql: `
      UPDATE public.properties
      SET 
        street_address = TRIM(CONCAT(
          COALESCE(address->>'street1', ''),
          CASE 
            WHEN address->>'street2' IS NOT NULL AND address->>'street2' != '' 
            THEN ', ' || (address->>'street2')
            ELSE ''
          END
        )),
        city = address->>'city',
        state = address->>'state',
        postal_code = address->>'zip',
        county = address->>'county',
        country = COALESCE(address->>'country', 'USA')
      WHERE address IS NOT NULL;
    `
  }
];

async function applyMigration() {
  console.log('🚀 Starting database migration...\n');

  for (const section of sections) {
    try {
      console.log(`📝 ${section.name}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: section.sql
      });

      if (error) {
        // Try direct execution as fallback
        const { error: directError } = await supabase.from('_sql').insert({ query: section.sql });
        
        if (directError) {
          console.log(`  ❌ Failed: ${directError.message}`);
          console.log(`  ℹ️  This section may need to be run manually in the dashboard`);
        } else {
          console.log(`  ✅ Success!`);
        }
      } else {
        console.log(`  ✅ Success!`);
      }
    } catch (err) {
      console.log(`  ⚠️  Error: ${err.message}`);
    }
  }

  console.log('\n📋 Migration Summary:');
  console.log('- Some sections may have failed due to RLS restrictions');
  console.log('- Please check the Supabase dashboard to verify tables were created');
  console.log('- If needed, run the full migration manually at:');
  console.log(`  https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new`);
  console.log('\nMigration file location:');
  console.log(`  ${migrationPath}`);
}

// Run migration
applyMigration().catch(console.error);