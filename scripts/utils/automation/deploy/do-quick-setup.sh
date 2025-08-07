#!/bin/bash
# Quick setup script to run on Digital Ocean droplet

echo "🚀 Florida Parcels Import - Quick Setup"
echo "======================================"
echo ""

# Update and install dependencies
echo "📦 Installing required packages..."
apt update
apt install -y nodejs npm postgresql-client-14 git wget unzip

# Create working directory
mkdir -p /root/florida-import
cd /root/florida-import

# Create package.json
cat > package.json << 'EOF'
{
  "name": "florida-import",
  "version": "1.0.0",
  "dependencies": {
    "pg": "^8.11.3",
    "pg-copy-streams": "^6.0.6"
  }
}
EOF

# Install Node dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Create the import script
cat > direct-import.js << 'EOF'
#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const copyFrom = require('pg-copy-streams').from;

// Get DB password from environment or prompt
const DB_PASSWORD = process.env.DB_PASSWORD;
if (!DB_PASSWORD) {
  console.error('❌ Please set DB_PASSWORD environment variable');
  console.error('   export DB_PASSWORD="your-supabase-db-password"');
  process.exit(1);
}

const DB_CONFIG = {
  host: 'db.tmlrvecuwgppbaynesji.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

async function importCSV(filePath) {
  const fileName = path.basename(filePath);
  const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
  const client = new Client(DB_CONFIG);

  try {
    console.log(`\n📄 Processing ${fileName} (${fileSize} MB)...`);
    const startTime = Date.now();

    await client.connect();

    // Direct COPY for maximum speed
    const stream = client.query(copyFrom(`
      COPY florida_parcels_csv_import FROM STDIN
      WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"')
    `));

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(stream);

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      fileStream.on('error', reject);
    });

    // Get count of imported records
    const countResult = await client.query(
      'SELECT COUNT(*) FROM florida_parcels_staging'
    );
    const recordCount = parseInt(countResult.rows[0].count);

    // Transfer to main table
    console.log(`🔄 Transferring ${recordCount.toLocaleString()} records...`);
    await client.query('SELECT transfer_florida_parcels_staging()');

    const duration = (Date.now() - startTime) / 1000;
    const rate = (recordCount / duration).toFixed(0);

    console.log(`✅ Success! ${recordCount.toLocaleString()} records in ${duration.toFixed(1)}s (${rate} rec/s)`);
    return true;

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function testConnection() {
  console.log('🔍 Testing database connection...');
  const client = new Client(DB_CONFIG);

  try {
    await client.connect();
    const result = await client.query('SELECT COUNT(*) FROM florida_parcels');
    console.log(`✅ Connected! Current records: ${result.rows[0].count}`);
    await client.end();
    return true;
  } catch (error) {
    console.error(`❌ Connection failed: ${error.message}`);
    await client.end();
    return false;
  }
}

async function main() {
  console.log('🚀 Direct PostgreSQL Import (Optimized)\n');

  // Test connection first
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }

  const csvDir = './CleanedSplit';
  if (!fs.existsSync(csvDir)) {
    console.error(`❌ Directory not found: ${csvDir}`);
    console.error('   Upload your CSV files first!');
    process.exit(1);
  }

  const files = fs.readdirSync(csvDir)
    .filter(f => f.endsWith('.csv'))
    .sort();

  console.log(`\n📊 Found ${files.length} CSV files to import\n`);

  const startTime = Date.now();
  let successCount = 0;

  for (let i = 0; i < files.length; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`[${i + 1}/${files.length}] ${files[i]}`);
    console.log('='.repeat(60));

    const filePath = path.join(csvDir, files[i]);
    const success = await importCSV(filePath);

    if (success) {
      successCount++;

      // Move to imported folder
      const importedDir = './CleanedSplit_imported';
      if (!fs.existsSync(importedDir)) {
        fs.mkdirSync(importedDir);
      }
      fs.renameSync(filePath, path.join(importedDir, files[i]));
      console.log('📦 Moved to imported folder');
    }

    // Progress summary
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = files.length - i - 1;
    const avgTime = elapsed / (i + 1);
    const eta = remaining * avgTime;

    if (remaining > 0) {
      console.log(`\n⏳ ETA: ${Math.ceil(eta / 60)} minutes for ${remaining} remaining files`);
    }
  }

  // Final summary
  const totalDuration = (Date.now() - startTime) / 1000;
  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT COMPLETE');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}/${files.length} files`);
  console.log(`⏱️  Total time: ${Math.floor(totalDuration / 60)}m ${Math.floor(totalDuration % 60)}s`);
  console.log(`⚡ Average: ${(totalDuration / files.length).toFixed(1)}s per file`);

  // Final record count
  const client = new Client(DB_CONFIG);
  await client.connect();
  const result = await client.query('SELECT COUNT(*) FROM florida_parcels');
  console.log(`\n📈 Total records in database: ${parseInt(result.rows[0].count).toLocaleString()}`);
  await client.end();
}

main().catch(console.error);
EOF

chmod +x direct-import.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Upload your CSV files:"
echo "   scp -r CleanedSplit root@$(hostname -I | awk '{print $1}'):/root/florida-import/"
echo ""
echo "2. Set your database password:"
echo "   export DB_PASSWORD='your-supabase-password'"
echo ""
echo "3. Run the import:"
echo "   node direct-import.js"
echo ""
