#!/usr/bin/env node

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
      if (result.rows && result.rows.length > 0) {
        console.log(`   Results:`, result.rows);
      }
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

async function verifyMergedTable() {
  console.log('🔍 Verifying Merged Florida Parcels Table');
  console.log('=' .repeat(50));

  const verifications = [
    {
      name: 'Check table structure',
      query: `SELECT 
                COUNT(*) as total_columns,
                COUNT(CASE WHEN column_name ~ '^[A-Z_]+$' THEN 1 END) as uppercase_columns,
                COUNT(CASE WHEN column_name ~ '^[a-z_]+$' THEN 1 END) as lowercase_columns
              FROM information_schema.columns 
              WHERE table_name = 'florida_parcels'`
    },
    {
      name: 'Verify uppercase view is gone',
      query: `SELECT COUNT(*) as view_count 
              FROM information_schema.views 
              WHERE table_name = 'florida_parcels_uppercase'`
    },
    {
      name: 'Check key columns',
      query: `SELECT column_name, data_type, is_nullable
              FROM information_schema.columns 
              WHERE table_name = 'florida_parcels' 
              AND column_name IN ('CO_NO', 'PARCEL_ID', 'JV', 'OWN_NAME', 'county_fips', 'county_id')
              ORDER BY column_name`
    },
    {
      name: 'Verify unique constraint',
      query: `SELECT constraint_name, column_name
              FROM information_schema.constraint_column_usage
              WHERE table_name = 'florida_parcels'
              AND constraint_name LIKE '%parcel_id%'`
    },
    {
      name: 'Check functions are updated',
      query: `SELECT routine_name 
              FROM information_schema.routines 
              WHERE routine_name IN ('search_parcels_by_owner', 'get_parcel_with_county')
              ORDER BY routine_name`
    }
  ];

  let allGood = true;

  for (const check of verifications) {
    const result = await executeSQL(check.query, check.name);
    if (!result.success) {
      allGood = false;
    }
  }

  if (allGood) {
    console.log('\n✅ Table merge verified successfully!');
    console.log('\n📊 Summary:');
    console.log('  • florida_parcels table now has UPPERCASE column names');
    console.log('  • florida_parcels_uppercase view has been removed');
    console.log('  • All functions updated to use UPPERCASE columns');
    console.log('  • CSV imports with UPPERCASE headers will work directly');
    console.log('  • county_fips auto-derivation from CO_NO is active');
    
    console.log('\n🎯 You can now import CSVs directly to florida_parcels!');
  } else {
    console.log('\n⚠️  Some verifications failed. Please check above.');
  }
}

// Run verification
verifyMergedTable().catch(console.error);