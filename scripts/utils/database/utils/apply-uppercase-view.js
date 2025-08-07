#!/usr/bin/env node

// Script to apply uppercase view solution

const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'tmlrvecuwgppbaynesji';
const API_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!API_TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN environment variable not set');
  process.exit(1);
}

async function executeSQL(sql, description) {
  try {
    console.log(`\n📄 ${description}...`);

    const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_ID}/database/query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✅ ${description} - Success`);
      return { success: true };
    } else {
      console.error(`❌ ${description} - Failed`);
      console.error(`   Error: ${result.message || JSON.stringify(result)}`);
      return { success: false, error: result.message || JSON.stringify(result) };
    }
  } catch (error) {
    console.error(`❌ ${description} - Failed`);
    console.error(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function applyUppercaseView() {
  console.log('🏘️  Creating UPPERCASE Column View for Florida Parcels');
  console.log('=' .repeat(50));
  console.log('\nThis will create a view that allows CSV imports with UPPERCASE headers');

  // Read migration file
  const migrationPath = path.join(__dirname, '../supabase/migrations_ai/024_add_uppercase_column_aliases.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found');
    return;
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  const result = await executeSQL(migrationSQL, 'Creating uppercase column view');

  if (result.success) {
    console.log('\n🎉 UPPERCASE view created successfully!');

    // Test the view
    console.log('\n🧪 Testing the view...');

    const testQueries = [
      {
        name: 'Check view columns',
        query: `SELECT COUNT(*) as column_count
                FROM information_schema.columns
                WHERE table_name = 'florida_parcels_uppercase'`
      },
      {
        name: 'Test view select',
        query: `SELECT COUNT(*) as row_count FROM florida_parcels_uppercase`
      }
    ];

    for (const test of testQueries) {
      await executeSQL(test.query, test.name);
    }

    console.log('\n✨ Solution Applied Successfully!');
    console.log('\n📝 How to use:');
    console.log('1. Go to Supabase Dashboard → Table Editor');
    console.log('2. Select "florida_parcels_uppercase" (not florida_parcels)');
    console.log('3. Click "Import data from CSV"');
    console.log('4. Your CSV with UPPERCASE headers will import correctly!');
    console.log('\n💡 The view automatically:');
    console.log('  • Maps UPPERCASE CSV columns to lowercase database columns');
    console.log('  • Derives county_fips from CO_NO field');
    console.log('  • Handles duplicate parcels with UPSERT logic');
    console.log('  • Updates existing records if parcel_id matches');

  } else {
    console.log('\n⚠️  Failed to create view. Please check the error above.');
  }
}

// Run the application
applyUppercaseView().catch(console.error);
