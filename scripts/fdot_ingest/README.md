# FDOT Parcel Data Ingestion

High-performance pipeline for fetching and importing Florida Department of Transportation (FDOT) parcel data into Supabase.

## Overview

This system provides a complete ETL pipeline for Florida parcel data:

1. **Fetch** - Async downloader with resume capability
2. **Transform** - Data validation and format conversion
3. **Load** - Bulk import to Supabase with spatial indexing

## Quick Start

### Prerequisites

```bash
# Install Python dependencies
pip install aiohttp aiofiles

# Install system dependencies (Ubuntu/Debian)
sudo apt-get install gdal-bin postgresql-client python3-gdal

# Install system dependencies (macOS)
brew install gdal postgresql
```

### Environment Setup

Create a `.env` file in the scripts directory:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_DB_PASSWORD=your-db-password

# FDOT API Configuration
FDOT_BASE_URL=https://api.fdot.gov/parcels/v1
FDOT_API_KEY=your-api-key-if-required
FDOT_BATCH_SIZE=1000
FDOT_MAX_WORKERS=10

# AI API Configuration (for ClaimGuardian AI features)
OPENAI_API_KEY=your-openai-api-key
GEMINI_API_KEY=your-gemini-api-key

# Processing Configuration
FDOT_OUTPUT_DIR=./data
FDOT_RESUME_FILE=.fdot_resume
BATCH_SIZE=10000
PARALLEL_JOBS=4
```

### Basic Usage

```bash
# 1. Fetch parcel data
python3 fetch_parcels.py

# 2. Import to Supabase
./import_to_supabase.sh
```

## Detailed Usage

### 1. Fetching Data

The `fetch_parcels.py` script downloads parcel data from FDOT's API:

```bash
# Basic fetch
python3 fetch_parcels.py

# With custom configuration
FDOT_BATCH_SIZE=2000 FDOT_MAX_WORKERS=20 python3 fetch_parcels.py

# Resume interrupted fetch
python3 fetch_parcels.py  # Automatically resumes from .fdot_resume
```

**Features:**
- Async/await for high performance
- Automatic resume on interruption
- Configurable concurrency and batch sizes
- Data validation and checksums
- Comprehensive logging

**Output:**
- `data/county_parcels_YYYYMMDD_HHMMSS.json` - Parcel data by county
- `data/county_parcels_YYYYMMDD_HHMMSS.json.md5` - Checksums
- `.fdot_resume` - Resume checkpoint
- `fdot_ingest.log` - Detailed logs

### 2. Importing to Supabase

The `import_to_supabase.sh` script processes and imports the data:

```bash
# Basic import
./import_to_supabase.sh

# With custom options
./import_to_supabase.sh --data-dir /path/to/data --batch-size 5000

# Dry run (show what would be done)
./import_to_supabase.sh --dry-run

# Skip validation for faster import
./import_to_supabase.sh --skip-validation
```

**Features:**
- Automatic data merging from multiple counties
- JSON to GeoJSON conversion
- Spatial data import with PostGIS
- Automatic indexing and constraints
- Comprehensive validation
- Progress tracking and resumption

## Configuration Options

### Fetch Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `FDOT_BASE_URL` | `https://api.fdot.gov/parcels/v1` | FDOT API base URL |
| `FDOT_API_KEY` | None | API key (if required) |
| `FDOT_BATCH_SIZE` | 1000 | Parcels per API request |
| `FDOT_MAX_WORKERS` | 10 | Concurrent API requests |
| `FDOT_OUTPUT_DIR` | `./data` | Output directory |
| `FDOT_RESUME_FILE` | `.fdot_resume` | Resume checkpoint file |

### Import Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | Required | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Required | Service role key |
| `SUPABASE_DB_PASSWORD` | Required | Database password |
| `BATCH_SIZE` | 10000 | Import batch size |
| `PARALLEL_JOBS` | 4 | Parallel processing jobs |

## Data Schema

The imported data follows this schema:

```sql
CREATE TABLE florida_parcels (
    parcel_id TEXT PRIMARY KEY,
    county TEXT NOT NULL,
    owner_name TEXT,
    property_address TEXT,
    assessed_value NUMERIC,
    land_use_code TEXT,
    acreage NUMERIC,
    year_built INTEGER,
    building_area NUMERIC,
    market_value NUMERIC,
    homestead_exempt BOOLEAN,
    zoning TEXT,
    flood_zone TEXT,
    last_sale_date DATE,
    last_sale_price NUMERIC,
    legal_description TEXT,
    tax_district TEXT,
    school_district TEXT,
    fire_district TEXT,
    municipality TEXT,
    subdivision TEXT,
    geom GEOMETRY(POLYGON, 4326),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## Performance Tuning

### Fetch Performance

```bash
# High throughput (use with caution)
FDOT_BATCH_SIZE=2000 FDOT_MAX_WORKERS=20 python3 fetch_parcels.py

# Conservative (more reliable)
FDOT_BATCH_SIZE=500 FDOT_MAX_WORKERS=5 python3 fetch_parcels.py
```

### Import Performance

```bash
# High performance import
./import_to_supabase.sh --batch-size 20000 --jobs 8

# Memory-constrained import
./import_to_supabase.sh --batch-size 5000 --jobs 2
```

## Error Handling

### Common Issues

1. **Rate Limiting**
   - Reduce `FDOT_MAX_WORKERS` and `FDOT_BATCH_SIZE`
   - The fetcher automatically retries with exponential backoff

2. **Memory Issues**
   - Reduce import `BATCH_SIZE`
   - Reduce `PARALLEL_JOBS`

3. **Database Connection**
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure database has sufficient resources

4. **Data Validation Errors**
   - Use `--skip-validation` for faster import
   - Check source data integrity
   - Review logs for specific errors

### Resume Capability

Both scripts support resuming interrupted operations:

```bash
# Fetch resumes automatically from .fdot_resume
python3 fetch_parcels.py

# Import can be re-run safely (uses UPSERT)
./import_to_supabase.sh
```

## Monitoring

### Logs

- `fdot_ingest.log` - Fetch operation logs
- `import.log` - Import operation logs

### Progress Tracking

```bash
# Monitor fetch progress
tail -f fdot_ingest.log

# Monitor import progress
tail -f import.log

# Check resume status
cat .fdot_resume
```

### Database Monitoring

```sql
-- Check import progress
SELECT 
    COUNT(*) as total_parcels,
    COUNT(DISTINCT county) as counties,
    MAX(created_at) as latest_import
FROM florida_parcels;

-- Check county distribution
SELECT 
    county,
    COUNT(*) as parcel_count
FROM florida_parcels 
GROUP BY county 
ORDER BY parcel_count DESC;
```

## Automation

### Cron Job Example

```bash
# Daily incremental update at 2 AM
0 2 * * * cd /path/to/scripts/fdot_ingest && python3 fetch_parcels.py && ./import_to_supabase.sh
```

### Systemd Service

```ini
[Unit]
Description=FDOT Parcel Data Sync
After=network.target

[Service]
Type=oneshot
User=your-user
WorkingDirectory=/path/to/scripts/fdot_ingest
Environment=SUPABASE_URL=https://your-project.supabase.co
Environment=SUPABASE_SERVICE_KEY=your-service-key
Environment=SUPABASE_DB_PASSWORD=your-db-password
ExecStart=/bin/bash -c "python3 fetch_parcels.py && ./import_to_supabase.sh"

[Install]
WantedBy=multi-user.target
```

## Development

### Testing

```bash
# Test fetch with small batch
FDOT_BATCH_SIZE=10 FDOT_MAX_WORKERS=1 python3 fetch_parcels.py

# Test import with dry run
./import_to_supabase.sh --dry-run

# Test specific county
# (modify fetch_parcels.py to filter by county)
```

### Debugging

```bash
# Enable debug logging
export FDOT_DEBUG=1
python3 fetch_parcels.py

# Verbose import
./import_to_supabase.sh --verbose
```

## Security

### API Keys

- Store API keys in environment variables
- Use service role keys for Supabase
- Rotate keys regularly

### Database Access

- Use connection pooling for high-throughput imports
- Monitor database resource usage
- Implement row-level security (RLS) on imported data

### Data Privacy

- Parcel data may contain PII (owner names, addresses)
- Implement appropriate access controls
- Consider data anonymization for development

## Troubleshooting

### Common Solutions

1. **ImportError: No module named 'aiohttp'**
   ```bash
   pip install aiohttp aiofiles
   ```

2. **ogr2ogr: command not found**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install gdal-bin
   
   # macOS
   brew install gdal
   ```

3. **Database connection refused**
   - Check Supabase database URL and credentials
   - Verify network connectivity
   - Ensure database is not paused

4. **Out of memory during import**
   - Reduce `BATCH_SIZE`
   - Increase available memory
   - Process counties individually

### Getting Help

- Check logs for detailed error messages
- Review this documentation
- Open an issue in the project repository
- Contact the development team

## License

This project is licensed under the MIT License. See the main project LICENSE file for details.