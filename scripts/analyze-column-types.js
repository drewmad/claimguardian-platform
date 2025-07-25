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

async function analyzeColumnTypes() {
  console.log('🔍 Analyzing Florida Parcels Column Types');
  console.log('=' .repeat(50));

  // Get all column information
  const columnsQuery = `
    SELECT 
      column_name,
      data_type,
      character_maximum_length,
      numeric_precision,
      numeric_scale,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = 'florida_parcels'
    ORDER BY ordinal_position
  `;

  const result = await executeSQL(columnsQuery, 'Fetching column information');
  
  if (!result.success || !result.data) {
    console.error('Failed to fetch column information');
    return;
  }

  const columns = result.data.rows || [];
  
  console.log(`\n📊 Total Columns: ${columns.length}`);
  
  // Analyze data types
  const typeAnalysis = {
    'double precision': [],
    'character varying': [],
    'text': [],
    'bigint': [],
    'integer': [],
    'timestamp with time zone': [],
    'uuid': []
  };
  
  columns.forEach(col => {
    const type = col.data_type;
    if (typeAnalysis[type]) {
      typeAnalysis[type].push(col.column_name);
    } else {
      if (!typeAnalysis.other) typeAnalysis.other = [];
      typeAnalysis.other.push({ name: col.column_name, type: type });
    }
  });
  
  console.log('\n📈 Data Type Distribution:');
  Object.entries(typeAnalysis).forEach(([type, cols]) => {
    if (cols.length > 0) {
      console.log(`\n${type.toUpperCase()} (${cols.length}):`);
      if (type === 'character varying') {
        // Show varchar lengths
        const varcharInfo = columns.filter(c => c.data_type === 'character varying');
        const byLength = {};
        varcharInfo.forEach(c => {
          const len = c.character_maximum_length || 'unlimited';
          if (!byLength[len]) byLength[len] = [];
          byLength[len].push(c.column_name);
        });
        Object.entries(byLength).forEach(([len, names]) => {
          console.log(`  • VARCHAR(${len}): ${names.length} columns`);
          if (names.length <= 5) {
            names.forEach(n => console.log(`    - ${n}`));
          }
        });
      } else if (cols.length <= 10) {
        cols.forEach(c => console.log(`  • ${typeof c === 'string' ? c : c.name}`));
      } else {
        console.log(`  • ${cols.slice(0, 5).join(', ')}... (and ${cols.length - 5} more)`);
      }
    }
  });
  
  // Check for potential type improvements
  console.log('\n🔧 Recommended Type Improvements:');
  
  const improvements = [];
  
  // Check FLOAT columns that might be better as INTEGER
  const floatCols = columns.filter(c => c.data_type === 'double precision');
  const integerCandidates = ['CO_NO', 'ASMNT_YR', 'DISTR_YR', 'SALE_YR1', 'SALE_YR2', 
                             'SALE_MO1', 'SALE_MO2', 'ACT_YR_BLT', 'EFF_YR_BLT', 
                             'NO_BULDNG', 'NO_RES_UNT', 'SEC', 'NO_LND_UNT'];
  
  floatCols.forEach(col => {
    if (integerCandidates.some(ic => col.column_name.includes(ic))) {
      improvements.push({
        column: col.column_name,
        current: 'FLOAT',
        suggested: 'INTEGER',
        reason: 'Whole numbers only'
      });
    }
  });
  
  // Check VARCHAR columns that might need different lengths
  const varcharCols = columns.filter(c => c.data_type === 'character varying');
  varcharCols.forEach(col => {
    if (col.column_name.includes('STATE') && col.character_maximum_length !== 2) {
      improvements.push({
        column: col.column_name,
        current: `VARCHAR(${col.character_maximum_length})`,
        suggested: 'VARCHAR(2)',
        reason: 'State codes are 2 characters'
      });
    }
    if (col.column_name.includes('ZIPCD') && col.character_maximum_length < 10) {
      improvements.push({
        column: col.column_name,
        current: `VARCHAR(${col.character_maximum_length})`,
        suggested: 'VARCHAR(10)',
        reason: 'ZIP+4 format needs 10 chars'
      });
    }
  });
  
  if (improvements.length > 0) {
    improvements.forEach(imp => {
      console.log(`\n  ${imp.column}:`);
      console.log(`    Current: ${imp.current}`);
      console.log(`    Suggested: ${imp.suggested}`);
      console.log(`    Reason: ${imp.reason}`);
    });
  } else {
    console.log('  ✅ All column types appear appropriate');
  }
  
  // Check for missing indexes on foreign keys
  console.log('\n🔍 Index Analysis:');
  const indexQuery = `
    SELECT 
      indexname,
      indexdef
    FROM pg_indexes 
    WHERE tablename = 'florida_parcels'
    ORDER BY indexname
  `;
  
  const indexResult = await executeSQL(indexQuery, 'Checking indexes');
  if (indexResult.success && indexResult.data.rows) {
    console.log(`  Total indexes: ${indexResult.data.rows.length}`);
    
    // Check if key columns have indexes
    const keyColumns = ['CO_NO', 'OWN_NAME', 'PHY_CITY', 'ASMNT_YR', 'DOR_UC'];
    keyColumns.forEach(col => {
      const hasIndex = indexResult.data.rows.some(idx => 
        idx.indexdef.toLowerCase().includes(col.toLowerCase())
      );
      console.log(`  ${col}: ${hasIndex ? '✅ Indexed' : '❌ No index'}`);
    });
  }
}

// Run analysis
analyzeColumnTypes().catch(console.error);