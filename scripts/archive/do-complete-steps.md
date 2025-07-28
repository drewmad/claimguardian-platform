# Complete Digital Ocean Import Steps

## Step 1: Create Digital Ocean Account (if needed)
1. Go to https://digitalocean.com
2. Sign up (you get $200 free credit for 60 days)
3. Add a payment method

## Step 2: Create Droplet
1. Click "Create" → "Droplets"
2. Choose:
   - **Image**: Ubuntu 22.04 (LTS) x64
   - **Plan**: Basic
   - **CPU**: Regular Intel with SSD
   - **Size**: $48/month (8 GB / 4 CPUs / 160 GB SSD) 
   - **Region**: Choose same region as your Supabase (likely US East or US West)
   - **Authentication**: Password (easier) or SSH Key
   - **Hostname**: florida-import
3. Click "Create Droplet"
4. Wait 1 minute for creation
5. Copy the IP address shown

## Step 3: Connect to Droplet
```bash
# Open Terminal on your Mac
ssh root@YOUR_DROPLET_IP

# Enter password when prompted (if you chose password auth)
```

## Step 4: Install Everything (copy and paste this entire block)
```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL client
apt install -y postgresql-client-14

# Install helpful tools
apt install -y git wget unzip htop screen

# Create working directory
mkdir -p /root/florida-import
cd /root/florida-import

# Verify installations
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

## Step 5: Create package.json
```bash
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

# Install dependencies
npm install
```

## Step 6: Create the Import Script
```bash
cat > import.js << 'EOF'
#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const copyFrom = require('pg-copy-streams').from;

// Database configuration
const DB_CONFIG = {
  host: 'db.tmlrvecuwgppbaynesji.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
};

// Check password
if (!DB_CONFIG.password) {
  console.error('❌ ERROR: Database password not set!');
  console.error('');
  console.error('Please run:');
  console.error('   export DB_PASSWORD="your-supabase-password"');
  console.error('');
  console.error('Get password from Supabase Dashboard → Settings → Database');
  process.exit(1);
}

async function testConnection() {
  console.log('Testing database connection...');
  const client = new Client(DB_CONFIG);
  try {
    await client.connect();
    const result = await client.query('SELECT current_database()');
    console.log('✅ Connected to:', result.rows[0].current_database);
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function importCSV(filePath, index, total) {
  const fileName = path.basename(filePath);
  const fileSize = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
  const client = new Client(DB_CONFIG);
  
  console.log(`\n[${index}/${total}] Processing ${fileName} (${fileSize} MB)`);
  const startTime = Date.now();
  
  try {
    await client.connect();
    
    // Use COPY for ultra-fast import
    const stream = client.query(copyFrom(
      'COPY florida_parcels_csv_import FROM STDIN WITH CSV HEADER'
    ));
    
    const fileStream = fs.createReadStream(filePath);
    let recordCount = 0;
    
    // Count lines for progress
    fileStream.on('data', (chunk) => {
      recordCount += (chunk.toString().match(/\n/g) || []).length;
    });
    
    fileStream.pipe(stream);
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      fileStream.on('error', reject);
    });
    
    // Transfer to main table
    console.log('   Transferring to main table...');
    await client.query('SELECT transfer_florida_parcels_staging()');
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const rate = Math.round(recordCount / duration);
    
    console.log(`   ✅ Success! ~${recordCount} records in ${duration}s (${rate} rec/s)`);
    return true;
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Florida Parcels Direct Import');
  console.log('================================\n');
  
  // Test connection
  if (!await testConnection()) {
    console.error('\nPlease check your database password and try again.');
    process.exit(1);
  }
  
  // Check for CSV files
  if (!fs.existsSync('./CleanedSplit')) {
    console.error('\n❌ CleanedSplit directory not found!');
    console.error('   Please upload your CSV files first.');
    process.exit(1);
  }
  
  const files = fs.readdirSync('./CleanedSplit')
    .filter(f => f.endsWith('.csv'))
    .sort();
  
  console.log(`\nFound ${files.length} CSV files to import`);
  console.log('Starting import...\n');
  
  const startTime = Date.now();
  let successCount = 0;
  
  // Create imported directory
  if (!fs.existsSync('./imported')) {
    fs.mkdirSync('./imported');
  }
  
  // Process each file
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join('./CleanedSplit', files[i]);
    
    if (await importCSV(filePath, i + 1, files.length)) {
      successCount++;
      // Move successful file
      fs.renameSync(filePath, path.join('./imported', files[i]));
    }
    
    // Show progress
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = files.length - i - 1;
    const eta = remaining * (elapsed / (i + 1));
    
    if (remaining > 0) {
      console.log(`   ⏳ ETA: ${Math.ceil(eta / 60)} minutes\n`);
    }
  }
  
  // Summary
  const totalMinutes = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log('\n' + '='.repeat(50));
  console.log('📊 IMPORT COMPLETE');
  console.log('='.repeat(50));
  console.log(`✅ Success: ${successCount}/${files.length} files`);
  console.log(`⏱️  Total time: ${totalMinutes} minutes`);
  console.log(`⚡ Average: ${(totalMinutes * 60 / files.length).toFixed(1)}s per file`);
  
  // Check final count
  const client = new Client(DB_CONFIG);
  await client.connect();
  const result = await client.query('SELECT COUNT(*) FROM florida_parcels');
  console.log(`\n📈 Total records in database: ${result.rows[0].count}`);
  await client.end();
}

main().catch(console.error);
EOF

# Make executable
chmod +x import.js
```

## Step 7: Get Your Supabase Database Password
1. Go to https://supabase.com/dashboard
2. Click on your project (tmlrvecuwgppbaynesji)
3. Go to Settings (gear icon) → Database
4. Find "Connection string" section
5. Click "Reveal" next to the password
6. Copy the password (it's long and random)

## Step 8: Upload Your CSV Files (on your LOCAL Mac)
```bash
# Open a NEW Terminal tab on your Mac
cd /Users/madengineering/ClaimGuardian

# Create compressed file
tar -czf csvs.tar.gz CleanedSplit/

# Upload to droplet (replace with your droplet IP)
scp csvs.tar.gz root@YOUR_DROPLET_IP:/root/florida-import/

# This will take 5-10 minutes to upload
```

## Step 9: Extract Files (back on the droplet)
```bash
# Make sure you're in the right directory
cd /root/florida-import

# Extract the files
tar -xzf csvs.tar.gz

# Verify files are there
ls CleanedSplit/ | wc -l
# Should show: 135
```

## Step 10: Set Database Password and Run Import
```bash
# Set the password (replace with your actual Supabase password)
export DB_PASSWORD="your-actual-password-from-supabase"

# Test the password is set
echo $DB_PASSWORD
# Should show your password

# Run the import
node import.js
```

## Step 11: Monitor Progress (optional)
```bash
# In another Terminal tab, SSH to droplet again
ssh root@YOUR_DROPLET_IP

# Watch the progress
cd /root/florida-import
watch -n 2 'echo "Remaining: $(ls CleanedSplit/*.csv 2>/dev/null | wc -l)"; echo "Completed: $(ls imported/*.csv 2>/dev/null | wc -l)"'
```

## Step 12: Verify Success
```bash
# Check that all files were processed
ls CleanedSplit/
# Should be empty or show only failed files

ls imported/ | wc -l
# Should show 135

# Check database (requires password)
psql "postgresql://postgres:$DB_PASSWORD@db.tmlrvecuwgppbaynesji.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) as total_records FROM florida_parcels;"
```

## Step 13: Clean Up Droplet
```bash
# Remove all files to free space
cd /root
rm -rf florida-import/

# Exit SSH
exit
```

## Step 14: Destroy Droplet (IMPORTANT!)
1. Go back to Digital Ocean dashboard
2. Click on your droplet (florida-import)
3. Click "Destroy" in the left menu
4. Click "Destroy this Droplet"
5. Confirm destruction

**This stops billing immediately!**

## Troubleshooting

### If import fails:
```bash
# Check the error message
# Usually it's one of:
# - Wrong password: Double-check from Supabase dashboard
# - Network timeout: Just run `node import.js` again
# - Table doesn't exist: Make sure you ran the SQL migrations

# Resume import (it will skip already imported files)
node import.js
```

### If upload is slow:
```bash
# You can also split the upload:
# On your Mac:
cd /Users/madengineering/ClaimGuardian/CleanedSplit
tar -czf batch1.tar.gz parcels_part_0000* parcels_part_0001*
tar -czf batch2.tar.gz parcels_part_0002* parcels_part_0003*
# etc...

# Then upload each batch separately
```

### To check what's running:
```bash
# See system resources
htop

# See disk space
df -h

# See network connections
netstat -an | grep 5432
```

## Expected Timeline
- Create droplet: 2 minutes
- Setup software: 3 minutes  
- Upload files: 10-15 minutes (depends on your internet)
- Import files: 15-20 minutes
- Clean up: 2 minutes
- **Total: ~35-45 minutes**

## Cost
- Droplet: $48/month = $0.066/hour
- For 1 hour: ~$0.07
- Bandwidth: Free (same region)
- **Total cost: Less than $0.10**

## Success Indicators
- All 135 files in `imported/` directory
- No files left in `CleanedSplit/`
- Database shows ~20-25 million records
- No error messages in the import output