#!/usr/bin/env node

// Script to apply CSV import solution to Supabase

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
      return { success: true, data: result };
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

async function applyImportSolution() {
  console.log('🏘️  Applying Florida Parcels CSV Import Solution');
  console.log('=' .repeat(50));
  console.log('\nThis will create:');
  console.log('  • Temporary import table with UPPERCASE columns');
  console.log('  • County FIPS derivation function');
  console.log('  • Batch import function');
  console.log('  • Import summary view');

  // Read and apply the SQL
  const sqlPath = path.join(__dirname, 'prepare-csv-import.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ SQL file not found');
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split into individual statements
  const statements = sql
    .split(/;\s*$/m)
    .filter(stmt => stmt.trim().length > 0)
    .map(stmt => stmt.trim() + ';');

  let successCount = 0;
  const results = [];

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];

    // Skip comments
    if (statement.trim().startsWith('--') || statement.trim().length === 0) {
      continue;
    }

    // Extract description from comment or first line
    let description = `Statement ${i + 1}`;
    if (statement.includes('CREATE TABLE florida_parcels_import_temp')) {
      description = 'Creating temporary import table';
    } else if (statement.includes('FUNCTION derive_county_fips')) {
      description = 'Creating county FIPS derivation function';
    } else if (statement.includes('FUNCTION import_parcels_from_temp')) {
      description = 'Creating batch import function';
    } else if (statement.includes('VIEW florida_parcels_import_summary')) {
      description = 'Creating import summary view';
    }

    const result = await executeSQL(statement, description);
    results.push({ description, ...result });

    if (result.success) {
      successCount++;
    }
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 Import Solution Summary:');
  console.log(`✅ Successful: ${successCount}/${results.filter(r => r.description !== 'Statement').length}`);

  if (successCount > 0) {
    console.log('\n🎉 CSV Import Solution Applied Successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Go to Supabase Dashboard → Table Editor');
    console.log('2. Select "florida_parcels_import_temp" table');
    console.log('3. Click "Import data from CSV"');
    console.log('4. Upload your CSV file with UPPERCASE headers');
    console.log('5. After import, run: SELECT * FROM import_parcels_from_temp(1000);');
    console.log('6. Check results: SELECT * FROM florida_parcels_import_summary;');
    console.log('7. Clean up: DROP TABLE florida_parcels_import_temp;');

    console.log('\n💡 Quick Import SQL:');
    console.log('```sql');
    console.log('-- After CSV upload to temp table:');
    console.log('SELECT * FROM import_parcels_from_temp(1000);');
    console.log('```');

  } else {
    console.log('\n⚠️  Some steps failed. Please check the errors above.');
  }
}

// Run the application
applyImportSolution().catch(console.error);
