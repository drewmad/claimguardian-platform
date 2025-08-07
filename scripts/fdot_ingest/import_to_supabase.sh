#!/bin/bash

# FDOT Parcel Data Import to Supabase
# Merges downloaded parcel data and imports to Supabase using ogr2ogr

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DATA_DIR="${DATA_DIR:-$SCRIPT_DIR/data}"
TEMP_DIR="${TEMP_DIR:-/tmp/fdot_import}"
LOG_FILE="${LOG_FILE:-$SCRIPT_DIR/import.log}"

# Supabase configuration
SUPABASE_URL="${SUPABASE_URL:-}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY:-}"
SUPABASE_DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

# Database configuration
DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-$SUPABASE_DB_PASSWORD}"

# Import configuration
BATCH_SIZE="${BATCH_SIZE:-10000}"
PARALLEL_JOBS="${PARALLEL_JOBS:-4}"
SKIP_VALIDATION="${SKIP_VALIDATION:-false}"
DRY_RUN="${DRY_RUN:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}" | tee -a "$LOG_FILE"
}

# Cleanup function
cleanup() {
    if [[ -d "$TEMP_DIR" ]]; then
        log "Cleaning up temporary directory: $TEMP_DIR"
        rm -rf "$TEMP_DIR"
    fi
}

# Set up trap for cleanup
trap cleanup EXIT

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."

    local missing_deps=()

    # Check for required commands
    for cmd in jq ogr2ogr psql python3; do
        if ! command -v "$cmd" &> /dev/null; then
            missing_deps+=("$cmd")
        fi
    done

    if [[ ${#missing_deps[@]} -ne 0 ]]; then
        error "Missing required dependencies: ${missing_deps[*]}"
        error "Please install the missing dependencies and try again."
        exit 1
    fi

    # Check for GDAL/OGR with PostgreSQL support
    if ! ogr2ogr --formats | grep -q "PostgreSQL"; then
        error "ogr2ogr does not have PostgreSQL support. Please install GDAL with PostgreSQL support."
        exit 1
    fi

    log "All dependencies satisfied"
}

# Validate configuration
validate_config() {
    log "Validating configuration..."

    if [[ -z "$SUPABASE_URL" ]]; then
        error "SUPABASE_URL is required"
        exit 1
    fi

    if [[ -z "$SUPABASE_SERVICE_KEY" ]]; then
        error "SUPABASE_SERVICE_KEY is required"
        exit 1
    fi

    if [[ -z "$DB_PASSWORD" ]]; then
        error "Database password is required (SUPABASE_DB_PASSWORD or DB_PASSWORD)"
        exit 1
    fi

    # Extract database connection details from Supabase URL if not provided
    if [[ -z "$DB_HOST" ]]; then
        DB_HOST=$(echo "$SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')
        if [[ -n "$DB_HOST" ]]; then
            DB_HOST="db.${DB_HOST}.supabase.co"
        else
            error "Could not extract database host from SUPABASE_URL"
            exit 1
        fi
    fi

    log "Configuration validated"
    info "Database host: $DB_HOST"
    info "Database port: $DB_PORT"
    info "Database name: $DB_NAME"
    info "Database user: $DB_USER"
}

# Test database connection
test_db_connection() {
    log "Testing database connection..."

    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" > /dev/null 2>&1; then
        error "Failed to connect to database"
        error "Please check your database credentials and network connectivity"
        exit 1
    fi

    log "Database connection successful"
}

# Create temporary directory
setup_temp_dir() {
    log "Setting up temporary directory..."

    if [[ -d "$TEMP_DIR" ]]; then
        rm -rf "$TEMP_DIR"
    fi

    mkdir -p "$TEMP_DIR"
    log "Temporary directory created: $TEMP_DIR"
}

# Find and validate data files
find_data_files() {
    log "Finding parcel data files..."

    if [[ ! -d "$DATA_DIR" ]]; then
        error "Data directory not found: $DATA_DIR"
        exit 1
    fi

    local data_files=()
    while IFS= read -r -d '' file; do
        data_files+=("$file")
    done < <(find "$DATA_DIR" -name "*_parcels_*.json" -print0)

    if [[ ${#data_files[@]} -eq 0 ]]; then
        error "No parcel data files found in $DATA_DIR"
        error "Please run fetch_parcels.py first to download the data"
        exit 1
    fi

    log "Found ${#data_files[@]} parcel data files"

    # Validate file integrity
    if [[ "$SKIP_VALIDATION" != "true" ]]; then
        log "Validating data files..."

        for file in "${data_files[@]}"; do
            local md5_file="${file%.*}.md5"

            if [[ -f "$md5_file" ]]; then
                if ! (cd "$(dirname "$file")" && md5sum -c "$(basename "$md5_file")" > /dev/null 2>&1); then
                    error "Checksum validation failed for: $file"
                    exit 1
                fi
            else
                warn "No checksum file found for: $file"
            fi

            # Validate JSON structure
            if ! jq -e '.metadata.county and .parcels' "$file" > /dev/null 2>&1; then
                error "Invalid JSON structure in: $file"
                exit 1
            fi
        done

        log "All data files validated"
    fi

    echo "${data_files[@]}"
}

# Merge parcel data files
merge_data_files() {
    local data_files=("$@")
    local merged_file="$TEMP_DIR/merged_parcels.json"

    log "Merging ${#data_files[@]} data files..."

    # Create merged JSON structure
    cat > "$merged_file" << 'EOF'
{
    "metadata": {
        "merge_date": "",
        "total_parcels": 0,
        "counties": [],
        "source_files": []
    },
    "parcels": []
}
EOF

    # Python script to merge files
    python3 << EOF
import json
import sys
from datetime import datetime
from pathlib import Path

merged_file = "$merged_file"
data_files = ${data_files[@]@Q}

# Load merged structure
with open(merged_file) as f:
    merged_data = json.load(f)

merged_data['metadata']['merge_date'] = datetime.now().isoformat()
total_parcels = 0
counties = []
source_files = []

# Process each data file
for file_path in data_files:
    print(f"Processing: {file_path}")

    try:
        with open(file_path) as f:
            data = json.load(f)

        # Extract parcels
        parcels = data.get('parcels', [])
        merged_data['parcels'].extend(parcels)

        # Update metadata
        county = data.get('metadata', {}).get('county')
        if county and county not in counties:
            counties.append(county)

        source_files.append(str(Path(file_path).name))
        total_parcels += len(parcels)

        print(f"  Added {len(parcels)} parcels from {county}")

    except Exception as e:
        print(f"  Error processing {file_path}: {e}")
        sys.exit(1)

# Update merged metadata
merged_data['metadata']['total_parcels'] = total_parcels
merged_data['metadata']['counties'] = sorted(counties)
merged_data['metadata']['source_files'] = source_files

# Save merged file
with open(merged_file, 'w') as f:
    json.dump(merged_data, f, indent=2)

print(f"Merged {total_parcels} parcels from {len(counties)} counties")
EOF

    log "Data files merged successfully"
    echo "$merged_file"
}

# Convert JSON to GeoJSON format
convert_to_geojson() {
    local input_file="$1"
    local output_file="$TEMP_DIR/parcels.geojson"

    log "Converting to GeoJSON format..."

    # Python script to convert JSON to GeoJSON
    python3 << EOF
import json
import sys

input_file = "$input_file"
output_file = "$output_file"

try:
    with open(input_file) as f:
        data = json.load(f)

    # Create GeoJSON structure
    geojson = {
        "type": "FeatureCollection",
        "features": []
    }

    # Convert each parcel to GeoJSON feature
    for parcel in data['parcels']:
        feature = {
            "type": "Feature",
            "properties": {
                "parcel_id": parcel.get('parcel_id'),
                "county": parcel.get('county'),
                "owner_name": parcel.get('owner_name'),
                "property_address": parcel.get('property_address'),
                "assessed_value": parcel.get('assessed_value'),
                "land_use_code": parcel.get('land_use_code'),
                "acreage": parcel.get('acreage'),
                "year_built": parcel.get('year_built'),
                "building_area": parcel.get('building_area'),
                "market_value": parcel.get('market_value'),
                "homestead_exempt": parcel.get('homestead_exempt'),
                "zoning": parcel.get('zoning'),
                "flood_zone": parcel.get('flood_zone'),
                "last_sale_date": parcel.get('last_sale_date'),
                "last_sale_price": parcel.get('last_sale_price'),
                "legal_description": parcel.get('legal_description'),
                "tax_district": parcel.get('tax_district'),
                "school_district": parcel.get('school_district'),
                "fire_district": parcel.get('fire_district'),
                "municipality": parcel.get('municipality'),
                "subdivision": parcel.get('subdivision'),
                "created_at": parcel.get('created_at'),
                "updated_at": parcel.get('updated_at')
            },
            "geometry": parcel.get('geometry')
        }

        geojson["features"].append(feature)

    # Save GeoJSON
    with open(output_file, 'w') as f:
        json.dump(geojson, f, indent=2)

    print(f"Converted {len(data['parcels'])} parcels to GeoJSON format")

except Exception as e:
    print(f"Error converting to GeoJSON: {e}")
    sys.exit(1)
EOF

    log "Conversion to GeoJSON completed"
    echo "$output_file"
}

# Import data using ogr2ogr
import_with_ogr2ogr() {
    local geojson_file="$1"

    log "Importing data to Supabase using ogr2ogr..."

    # Connection string
    local conn_string="PG:host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASSWORD"

    # Build ogr2ogr command
    local ogr_cmd=(
        ogr2ogr
        -f "PostgreSQL"
        "$conn_string"
        "$geojson_file"
        -nln "florida_parcels"
        -overwrite
        -lco "GEOMETRY_NAME=geom"
        -lco "SPATIAL_INDEX=YES"
        -lco "LAUNDER=YES"
        -lco "PRECISION=NO"
        -gt "$BATCH_SIZE"
        -skipfailures
        -progress
    )

    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would execute: ${ogr_cmd[*]}"
        return 0
    fi

    # Execute ogr2ogr
    if "${ogr_cmd[@]}" 2>&1 | tee -a "$LOG_FILE"; then
        log "Data import completed successfully"
    else
        error "Data import failed"
        exit 1
    fi
}

# Create indexes and constraints
create_indexes() {
    log "Creating indexes and constraints..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would create indexes and constraints"
        return 0
    fi

    # SQL script for indexes and constraints
    local sql_script="$TEMP_DIR/create_indexes.sql"

    cat > "$sql_script" << 'EOF'
-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_county ON florida_parcels(county);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_parcel_id ON florida_parcels(parcel_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_owner_name ON florida_parcels(owner_name);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_property_address ON florida_parcels(property_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_assessed_value ON florida_parcels(assessed_value);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_land_use_code ON florida_parcels(land_use_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_flood_zone ON florida_parcels(flood_zone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_municipality ON florida_parcels(municipality);

-- Create spatial index (if not already created by ogr2ogr)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_florida_parcels_geom ON florida_parcels USING GIST(geom);

-- Add comments
COMMENT ON TABLE florida_parcels IS 'Florida parcel data from FDOT';
COMMENT ON COLUMN florida_parcels.parcel_id IS 'Unique parcel identifier';
COMMENT ON COLUMN florida_parcels.county IS 'County name';
COMMENT ON COLUMN florida_parcels.geom IS 'Parcel geometry (polygon)';

-- Update table statistics
ANALYZE florida_parcels;
EOF

    # Execute SQL script
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$sql_script" > /dev/null 2>&1; then
        log "Indexes and constraints created successfully"
    else
        warn "Some indexes may have failed to create (this is usually not critical)"
    fi
}

# Generate import summary
generate_summary() {
    log "Generating import summary..."

    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would generate import summary"
        return 0
    fi

    # Query database for summary statistics
    local summary_sql="
        SELECT
            COUNT(*) as total_parcels,
            COUNT(DISTINCT county) as total_counties,
            MIN(assessed_value) as min_assessed_value,
            MAX(assessed_value) as max_assessed_value,
            AVG(assessed_value) as avg_assessed_value,
            COUNT(*) FILTER (WHERE homestead_exempt = true) as homestead_parcels,
            COUNT(*) FILTER (WHERE flood_zone IS NOT NULL) as flood_zone_parcels
        FROM florida_parcels;
    "

    local county_summary_sql="
        SELECT
            county,
            COUNT(*) as parcel_count,
            AVG(assessed_value) as avg_assessed_value
        FROM florida_parcels
        GROUP BY county
        ORDER BY parcel_count DESC;
    "

    log "Import Summary:"
    log "==============="

    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$summary_sql" | tee -a "$LOG_FILE"

    log ""
    log "County Summary:"
    log "==============="

    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$county_summary_sql" | tee -a "$LOG_FILE"
}

# Main function
main() {
    log "Starting FDOT parcel data import to Supabase"
    log "=============================================="

    # Check dependencies
    check_dependencies

    # Validate configuration
    validate_config

    # Test database connection
    test_db_connection

    # Setup temporary directory
    setup_temp_dir

    # Find and validate data files
    local data_files
    IFS=' ' read -r -a data_files <<< "$(find_data_files)"

    # Merge data files
    local merged_file
    merged_file=$(merge_data_files "${data_files[@]}")

    # Convert to GeoJSON
    local geojson_file
    geojson_file=$(convert_to_geojson "$merged_file")

    # Import with ogr2ogr
    import_with_ogr2ogr "$geojson_file"

    # Create indexes
    create_indexes

    # Generate summary
    generate_summary

    log "Import process completed successfully!"
    log "Log file: $LOG_FILE"
}

# Help function
show_help() {
    cat << EOF
FDOT Parcel Data Import Script

Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -d, --data-dir DIR      Directory containing parcel data files (default: ./data)
    -t, --temp-dir DIR      Temporary directory for processing (default: /tmp/fdot_import)
    -l, --log-file FILE     Log file path (default: ./import.log)
    -b, --batch-size SIZE   Batch size for ogr2ogr (default: 10000)
    -j, --jobs JOBS         Number of parallel jobs (default: 4)
    -s, --skip-validation   Skip data file validation
    -n, --dry-run           Show what would be done without executing

Environment Variables:
    SUPABASE_URL           Supabase project URL (required)
    SUPABASE_SERVICE_KEY   Supabase service key (required)
    SUPABASE_DB_PASSWORD   Supabase database password (required)
    DB_HOST                Database host (auto-detected from SUPABASE_URL)
    DB_PORT                Database port (default: 5432)
    DB_NAME                Database name (default: postgres)
    DB_USER                Database user (default: postgres)

Examples:
    # Basic import
    SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=xxx SUPABASE_DB_PASSWORD=xxx $0

    # Import with custom data directory
    $0 --data-dir /path/to/data

    # Dry run to see what would be done
    $0 --dry-run

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -d|--data-dir)
            DATA_DIR="$2"
            shift 2
            ;;
        -t|--temp-dir)
            TEMP_DIR="$2"
            shift 2
            ;;
        -l|--log-file)
            LOG_FILE="$2"
            shift 2
            ;;
        -b|--batch-size)
            BATCH_SIZE="$2"
            shift 2
            ;;
        -j|--jobs)
            PARALLEL_JOBS="$2"
            shift 2
            ;;
        -s|--skip-validation)
            SKIP_VALIDATION="true"
            shift
            ;;
        -n|--dry-run)
            DRY_RUN="true"
            shift
            ;;
        *)
            error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main "$@"
