#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Securely load environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

// Parse specific environment variables securely
const SUPABASE_URL = envContent.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m)?.[1]?.replace(/["\s]/g, '');
// The anon key appears to be on one line ending with \n literal
const keyMatch = envContent.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+?)$/m);
const SUPABASE_ANON_KEY = keyMatch ? keyMatch[1].split('\\n')[0].replace(/["\s]/g, '') : null;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Could not securely load environment variables');
  process.exit(1);
}

console.log('Environment variables loaded securely');
console.log('Key length:', SUPABASE_ANON_KEY.length);
console.log('First 50 chars:', SUPABASE_ANON_KEY.substring(0, 50));
console.log('Last 50 chars:', SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 50));
console.log('Testing FDOT parcel loading with detailed diagnostics...\n');

async function testParcelLoad() {
  try {
    // First, fetch a single parcel from FDOT
    const fdotUrl = 'https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer/44/query';
    const params = new URLSearchParams({
      where: '1=1',
      outFields: '*',
      f: 'json',
      resultOffset: '10',
      resultRecordCount: '1',
      returnGeometry: 'true',
      outSR: '4326'
    });

    console.log('1. Fetching sample parcel from FDOT...');
    const fdotResponse = await fetch(`${fdotUrl}?${params}`);
    const fdotData = await fdotResponse.json();

    if (!fdotData.features || fdotData.features.length === 0) {
      console.error('No features returned from FDOT');
      return;
    }

    const feature = fdotData.features[0];
    console.log('✓ Successfully fetched parcel:', feature.attributes.PARCEL_ID || feature.attributes.PARCELNO);

    // Now try to load it via our Edge Function
    console.log('\n2. Testing Edge Function with single parcel...');
    const edgeResponse = await fetch(`${SUPABASE_URL}/functions/v1/load-florida-parcels-fdot`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        county: 'Monroe',
        offset: 10,
        limit: 1
      })
    });

    const result = await edgeResponse.json();
    console.log('\nEdge Function Response:', JSON.stringify(result, null, 2));

    // Now test direct database insert
    console.log('\n3. Testing direct database insert...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Check existing parcels
    const { data: existing, error: selectError } = await supabase
      .from('parcels')
      .select('parcel_id')
      .order('created_at', { ascending: false })
      .limit(5);

    if (selectError) {
      console.error('Error selecting parcels:', selectError);
    } else {
      console.log('\nExisting parcels in database:');
      existing.forEach(p => console.log(`  - ${p.parcel_id}`));
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

testParcelLoad();
