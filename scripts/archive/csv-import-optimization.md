# CSV Import Optimization Guide

## Current Situation
You're importing 135 CSV files (~100MB each, ~13GB total) with ~20-25 million records total.

## Why It's Slow

### 1. **Supabase REST API Limitations**
- Max 1,000 records per request
- Connection pool limits (10-20 concurrent)
- Rate limiting on free/pro tiers
- Each request has ~200-500ms overhead

### 2. **Current Approach Issues**
- Processing line-by-line
- Small batches (100-1000 records)
- Network latency (local → Supabase cloud)
- No direct database access

## Immediate Solutions (While It's Running)

### Option 1: Let It Continue
```bash
# Check progress
ps aux | grep node
# See which file it's on

# Estimate time remaining
# If doing 1 file per 30-60 seconds:
# 135 files = 67-135 minutes total
```

### Option 2: Stop and Use Better Method

**Stop current process:**
```bash
# Press Ctrl+C in the terminal running the import
# Or find process: ps aux | grep node
# Kill it: kill -9 [PID]
```

## Fast Import Methods

### Method 1: Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor
2. Click "Import Data" button
3. Select `florida_parcels_csv_import` view
4. Upload CSV files directly
5. Supabase handles everything efficiently

**Pros:** No code needed, built-in optimization
**Cons:** One file at a time, 200MB limit

### Method 2: Direct Database Connection (Fastest)

**Get connection string:**
1. Supabase Dashboard → Settings → Database
2. Copy "Connection string" 
3. Note the password

**Use psql directly:**
```bash
# Install PostgreSQL client
brew install postgresql

# Set connection
export DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.tmlrvecuwgppbaynesji.supabase.co:5432/postgres"

# Import single file
psql $DATABASE_URL -c "\COPY florida_parcels_csv_import FROM 'CleanedSplit/parcels_part_00002.csv' WITH CSV HEADER;"

# Or create a script
for file in CleanedSplit/*.csv; do
  echo "Importing $file..."
  psql $DATABASE_URL -c "\COPY florida_parcels_csv_import FROM '$file' WITH CSV HEADER;"
  psql $DATABASE_URL -c "SELECT transfer_florida_parcels_staging();"
done
```

### Method 3: Parallel Processing (Faster with Current Script)

Create multiple terminal windows and run different file ranges:

**Terminal 1:**
```bash
node import-subset.js 0 45
```

**Terminal 2:**
```bash
node import-subset.js 45 90  
```

**Terminal 3:**
```bash
node import-subset.js 90 135
```

**Create import-subset.js:**
```javascript
const start = parseInt(process.argv[2]);
const end = parseInt(process.argv[3]);
const files = fs.readdirSync('./CleanedSplit')
  .filter(f => f.endsWith('.csv'))
  .sort()
  .slice(start, end);

// Rest of your import code
```

## Performance Comparison

| Method | Speed | Total Time |
|--------|-------|------------|
| Current (API, sequential) | ~30-60s/file | 1-2 hours |
| Dashboard Upload | ~10-20s/file | 30-45 min |
| Direct psql | ~5-10s/file | 15-20 min |
| Digital Ocean + psql | ~3-5s/file | 10-15 min |
| Parallel (3 processes) | ~20s/file | 30-40 min |

## Monitoring Current Progress

```bash
# See how many records in database now
export SUPABASE_URL="https://tmlrvecuwgppbaynesji.supabase.co"
export SUPABASE_KEY="your-anon-key"

# Check via curl
curl "$SUPABASE_URL/rest/v1/florida_parcels?select=count" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY"

# Or check imported files
ls CleanedSplit_imported/ | wc -l
```

## My Recommendation

1. **If < 30% complete**: Stop and use Digital Ocean method
2. **If > 70% complete**: Let it finish
3. **If 30-70% complete**: Stop and use parallel processing

## Quick Digital Ocean Setup (15 min)

```bash
# 1. Create $48/mo droplet at digitalocean.com

# 2. SSH in and paste:
curl -sL https://git.io/JLyPT | bash  # Setup script

# 3. Upload files
scp -r CleanedSplit root@DROPLET_IP:/root/

# 4. Run import
cd /root && ./import-florida.sh

# 5. Destroy droplet
```

Total cost: ~$0.10 for 1 hour usage

## Emergency Recovery

If import partially failed:
```sql
-- Check what imported
SELECT COUNT(*), MIN(created_at), MAX(created_at) 
FROM florida_parcels;

-- See which files processed
SELECT DISTINCT data_source 
FROM florida_parcels 
ORDER BY data_source;

-- Resume from specific file
-- Just move successful files out and restart
```