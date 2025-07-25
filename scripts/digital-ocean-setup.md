# Digital Ocean Setup for Fast Florida Parcels Import

## Step 1: Create a Digital Ocean Droplet

1. **Go to Digital Ocean** and create a new droplet:
   - **Image**: Ubuntu 22.04 LTS
   - **Size**: At least 4GB RAM (8GB recommended) - $40-80/month
   - **Region**: Same as your Supabase region (check your Supabase URL)
   - **Additional options**: 
     - ✅ Monitoring
     - ✅ IPv6

2. **SSH into your droplet**:
   ```bash
   ssh root@your-droplet-ip
   ```

## Step 2: Install Required Software

Run these commands on your droplet:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# Install PostgreSQL client tools
apt install -y postgresql-client-14

# Install essential tools
apt install -y git wget unzip htop ncdu

# Create working directory
mkdir -p /root/florida-import
cd /root/florida-import
```

## Step 3: Get Your Supabase Database Credentials

1. Go to your Supabase dashboard
2. Settings → Database
3. Copy these values:
   - Host: `db.tmlrvecuwgppbaynesji.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - User: `postgres`
   - Password: (click reveal)

## Step 4: Transfer Your CSV Files

On your local machine:
```bash
# Zip the files first
cd /Users/madengineering/ClaimGuardian
tar -czf cleaned-split.tar.gz CleanedSplit/

# Transfer to droplet
scp cleaned-split.tar.gz root@your-droplet-ip:/root/florida-import/
```

On the droplet:
```bash
# Extract files
cd /root/florida-import
tar -xzf cleaned-split.tar.gz
ls CleanedSplit/  # Verify files are there
```

## Step 5: Create Direct Database Import Script

Create `/root/florida-import/direct-import.js`:

```javascript
#!/usr/bin/env node

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
const copyFrom = require('pg-copy-streams').from;

// Database connection
const DB_CONFIG = {
  host: 'db.tmlrvecuwgppbaynesji.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'YOUR_DB_PASSWORD_HERE', // Replace with actual password
  ssl: { rejectUnauthorized: false }
};

async function importCSV(filePath) {
  const fileName = path.basename(filePath);
  const client = new Client(DB_CONFIG);
  
  try {
    console.log(`\nProcessing ${fileName}...`);
    await client.connect();
    
    // Use COPY command for ultra-fast import
    const stream = client.query(copyFrom(`
      COPY florida_parcels_staging (
        objectid, parcel_id, co_no, asmnt_yr, jv, av_sd, av_nsd, 
        tv_sd, tv_nsd, dor_uc, pa_uc, land_val, bldg_val, tot_val,
        act_yr_blt, eff_yr_blt, tot_lvg_ar, land_sqfoot, no_buldng,
        no_res_unt, own_name, own_addr1, own_addr2, own_city,
        own_state, own_zipcd, phy_addr1, phy_addr2, phy_city,
        phy_zipcd, s_legal, twn, rng, sec, sale_prc1, sale_yr1,
        sale_mo1, sale_prc2, sale_yr2, sale_mo2, nbrhd_cd,
        census_bk, mkt_ar, app_stat, county_fips, file_t,
        bas_strt, atv_strt, grp_no, spass_cd, distr_cd, distr_yr,
        lnd_val, imp_qual, const_clas, spec_feat_, m_par_sal1,
        qual_cd1, vi_cd1, or_book1, or_page1, clerk_no1,
        s_chng_cd1, m_par_sal2, qual_cd2, vi_cd2, or_book2,
        or_page2, clerk_no2, s_chng_cd2, fidu_name, fidu_addr1,
        fidu_addr2, fidu_city, fidu_state, fidu_zipcd, fidu_cd,
        co_app_sta, public_lnd, tax_auth_c, alt_key, parcel_id_,
        yr_val_trn, seq_no, rs_id, mp_id, state_par_, spc_cir_cd,
        spc_cir_yr, spc_cir_tx, geometry_wkt, own_state2,
        own_zipcda, nbrhd_cd1, nbrhd_cd2, nbrhd_cd3, nbrhd_cd4,
        dor_cd1, dor_cd2, dor_cd3, dor_cd4, ag_val, qual_cd2_,
        vi_cd2_, sale_prc2_, sale_yr2_, sale_mo2_, or_book2_,
        or_page2_, clerk_n_2, imp_val, const_val, distr_no,
        front, depth, cap, cape_shpa, latitude, longitude,
        pin_1, pin_2, half_cd, twp, sub, blk, lot, plat_book,
        plat_page
      ) FROM STDIN WITH (FORMAT csv, HEADER true, DELIMITER ',')
    `));
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(stream);
    
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
      fileStream.on('error', reject);
    });
    
    // Transfer to main table
    console.log('Transferring to main table...');
    await client.query('SELECT transfer_florida_parcels_staging()');
    
    console.log(`✅ ${fileName} imported successfully!`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('🚀 Direct Database Import\n');
  
  const files = fs.readdirSync('./CleanedSplit')
    .filter(f => f.endsWith('.csv'))
    .sort();
  
  console.log(`Found ${files.length} CSV files\n`);
  
  const startTime = Date.now();
  let successCount = 0;
  
  for (let i = 0; i < files.length; i++) {
    const filePath = path.join('./CleanedSplit', files[i]);
    const success = await importCSV(filePath);
    
    if (success) {
      successCount++;
      // Move to imported folder
      const importedDir = './CleanedSplit_imported';
      if (!fs.existsSync(importedDir)) {
        fs.mkdirSync(importedDir);
      }
      fs.renameSync(filePath, path.join(importedDir, files[i]));
    }
    
    const elapsed = (Date.now() - startTime) / 1000;
    const eta = (files.length - i - 1) * (elapsed / (i + 1));
    console.log(`Progress: ${i + 1}/${files.length} | ETA: ${Math.ceil(eta / 60)}m\n`);
  }
  
  const duration = (Date.now() - startTime) / 1000;
  console.log('='.repeat(50));
  console.log(`✅ Complete! ${successCount}/${files.length} files`);
  console.log(`⏱️  Total time: ${Math.floor(duration / 60)}m ${Math.floor(duration % 60)}s`);
  console.log(`⚡ Average: ${(duration / files.length).toFixed(1)}s per file`);
}

main().catch(console.error);
```

## Step 6: Install Dependencies and Run

```bash
# Install dependencies
npm init -y
npm install pg pg-copy-streams

# Make executable
chmod +x direct-import.js

# Run the import
node direct-import.js
```

## Step 7: Monitor Progress

In another terminal:
```bash
# Watch disk usage
watch -n 1 df -h

# Monitor database connections
psql "postgresql://postgres:YOUR_PASSWORD@db.tmlrvecuwgppbaynesji.supabase.co:5432/postgres" \
  -c "SELECT count(*) FROM florida_parcels;"

# Monitor system resources
htop
```

## Step 8: Clean Up

After successful import:
```bash
# Remove CSV files to free space
rm -rf CleanedSplit_imported/
rm cleaned-split.tar.gz

# Or download the imported files as backup
tar -czf imported-files.tar.gz CleanedSplit_imported/
# Then from local: scp root@your-droplet-ip:/root/florida-import/imported-files.tar.gz .
```

## Performance Expectations

- **Local Supabase API**: ~30-60 seconds per file
- **Direct DB from DO**: ~5-10 seconds per file
- **Total time**: ~10-20 minutes vs 1-2 hours

## Cost

- Droplet: ~$0.06/hour ($40/month if kept running)
- Just create, import, destroy: ~$0.50 total
- Bandwidth: Free within same region

## Destroy Droplet After Import

```bash
# From Digital Ocean dashboard: Destroy droplet
# Or via CLI: doctl compute droplet delete your-droplet-id
```