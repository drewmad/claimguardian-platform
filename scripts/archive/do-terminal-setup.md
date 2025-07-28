# Digital Ocean Terminal Setup - Copy & Paste Commands

## After Creating Your Droplet

SSH into your droplet and run these commands:

### 1. Initial Setup (copy entire block)
```bash
# Update system and install dependencies
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs postgresql-client-14 git wget unzip htop
mkdir -p /root/florida-import
cd /root/florida-import
```

### 2. Create package.json
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

npm install
```

### 3. Create Import Script
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
  console.error('❌ Set DB_PASSWORD first:');
  console.error('   export DB_PASSWORD="your-password"');
  process.exit(1);
}

async function importCSV(filePath) {
  const fileName = path.basename(filePath);
  const client = new Client(DB_CONFIG);
  
  console.log(`\n📄 ${fileName}...`);
  const start = Date.now();
  
  try {
    await client.connect();
    
    // Ultra-fast COPY command
    const stream = client.query(copyFrom(
      'COPY florida_parcels_csv_import FROM STDIN CSV HEADER'
    ));
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(stream);
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    
    // Transfer to main table
    await client.query('SELECT transfer_florida_parcels_staging()');
    
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ Done in ${elapsed}s`);
    return true;
    
  } catch (error) {
    console.error(`❌ ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  const files = fs.readdirSync('./CleanedSplit')
    .filter(f => f.endsWith('.csv'))
    .sort();
  
  console.log(`🚀 Importing ${files.length} files\n`);
  
  const startTime = Date.now();
  let success = 0;
  
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join('./CleanedSplit', files[i]);
    
    if (await importCSV(filePath)) {
      success++;
      fs.renameSync(filePath, `./imported/${files[i]}`);
    }
    
    console.log(`Progress: ${i + 1}/${files.length}`);
  }
  
  const mins = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n✅ Complete: ${success}/${files.length} files in ${mins} minutes`);
}

// Create imported directory
if (!fs.existsSync('./imported')) fs.mkdirSync('./imported');

main().catch(console.error);
EOF

chmod +x import.js
```

### 4. Upload Your Files (from your local machine)
```bash
# On your local machine
cd /Users/madengineering/ClaimGuardian
tar -czf csvs.tar.gz CleanedSplit/
scp csvs.tar.gz root@YOUR_DROPLET_IP:/root/florida-import/

# Back on droplet
tar -xzf csvs.tar.gz
ls CleanedSplit/ | wc -l  # Should show 135 files
```

### 5. Get Database Password
Go to Supabase Dashboard → Settings → Database → Password → Show

### 6. Run Import
```bash
# Set password (replace with your actual password)
export DB_PASSWORD="your-actual-supabase-password"

# Run import
node import.js
```

### 7. Monitor Progress (optional, in another SSH session)
```bash
# Watch file progress
watch -n 1 'ls CleanedSplit/ | wc -l; ls imported/ | wc -l'

# Check database count
psql "postgresql://postgres:$DB_PASSWORD@db.tmlrvecuwgppbaynesji.supabase.co:5432/postgres" \
  -c "SELECT COUNT(*) FROM florida_parcels;"
```

### 8. Clean Up & Destroy
```bash
# After successful import
rm -rf CleanedSplit/ imported/ csvs.tar.gz

# Then destroy droplet from DO dashboard
```

## That's it! 

Expected time: ~15-20 minutes total vs 1-2 hours locally.