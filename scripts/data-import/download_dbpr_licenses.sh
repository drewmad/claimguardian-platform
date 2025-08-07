#!/bin/bash

# DBPR License Download Script
# Downloads Florida contractor license data from DBPR website
# Runs weekly to keep data current

# Set the directory where you want to save the files
DOWNLOAD_DIR="/Users/madengineering/ClaimGuardian/data/florida/dbpr_licenses/"
ARCHIVE_DIR="/Users/madengineering/ClaimGuardian/data/florida/dbpr_licenses/archive/"
LOG_FILE="/Users/madengineering/ClaimGuardian/logs/dbpr_download.log"

# Create necessary directories
mkdir -p "$DOWNLOAD_DIR"
mkdir -p "$ARCHIVE_DIR"
mkdir -p "$(dirname "$LOG_FILE")"

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting DBPR license download..."

# Archive existing files with timestamp
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
if ls "$DOWNLOAD_DIR"*.csv 1> /dev/null 2>&1; then
    log_message "Archiving existing files to ${ARCHIVE_DIR}${TIMESTAMP}/"
    mkdir -p "${ARCHIVE_DIR}${TIMESTAMP}/"
    cp "$DOWNLOAD_DIR"*.csv "${ARCHIVE_DIR}${TIMESTAMP}/"
fi

# URLs for the DBPR license files
declare -A LICENSE_FILES=(
    ["cilb_certified.csv"]="https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_certified.csv"
    ["cilb_registered.csv"]="https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_registered.csv"
    ["elc.csv"]="https://www2.myfloridalicense.com/sto/file_download/extracts/elc.csv"
    ["plc.csv"]="https://www2.myfloridalicense.com/sto/file_download/extracts/plc.csv"
    ["cilb_roofing.csv"]="https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_roofing.csv"
)

# Track download results
DOWNLOAD_SUCCESS=0
DOWNLOAD_FAILED=0

# Loop through the URLs and download each file
for FILENAME in "${!LICENSE_FILES[@]}"; do
    URL="${LICENSE_FILES[$FILENAME]}"
    OUTPUT_FILE="$DOWNLOAD_DIR$FILENAME"
    
    log_message "Downloading $FILENAME..."
    
    # Download with error handling
    if curl -s -f -o "$OUTPUT_FILE" "$URL"; then
        # Check if file has content
        if [ -s "$OUTPUT_FILE" ]; then
            FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
            LINE_COUNT=$(wc -l < "$OUTPUT_FILE")
            log_message "✓ Successfully downloaded $FILENAME (Size: $FILE_SIZE, Lines: $LINE_COUNT)"
            ((DOWNLOAD_SUCCESS++))
        else
            log_message "✗ Downloaded $FILENAME but file is empty"
            rm "$OUTPUT_FILE"
            ((DOWNLOAD_FAILED++))
        fi
    else
        log_message "✗ Failed to download $FILENAME"
        ((DOWNLOAD_FAILED++))
    fi
done

log_message "Download complete: $DOWNLOAD_SUCCESS successful, $DOWNLOAD_FAILED failed"

# If all downloads successful, trigger import
if [ $DOWNLOAD_SUCCESS -eq ${#LICENSE_FILES[@]} ]; then
    log_message "All files downloaded successfully. Triggering import..."
    
    # Call the import script
    IMPORT_SCRIPT="/Users/madengineering/ClaimGuardian/scripts/data-import/import_dbpr_licenses.sh"
    if [ -f "$IMPORT_SCRIPT" ]; then
        bash "$IMPORT_SCRIPT"
    else
        log_message "Import script not found at $IMPORT_SCRIPT"
    fi
else
    log_message "Some downloads failed. Skipping import."
    exit 1
fi

log_message "DBPR license download process completed"