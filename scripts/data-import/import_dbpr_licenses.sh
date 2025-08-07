#!/bin/bash

# DBPR License Import Script
# Imports downloaded CSV files into Supabase with history tracking

# Configuration
DOWNLOAD_DIR="/Users/madengineering/ClaimGuardian/data/florida/dbpr_licenses/"
LOG_FILE="/Users/madengineering/ClaimGuardian/logs/dbpr_import.log"
NODE_SCRIPT="/Users/madengineering/ClaimGuardian/scripts/data-import/process_dbpr_import.cjs"

# Database configuration (use environment variables)
if [ -f "/Users/madengineering/ClaimGuardian/.env.local" ]; then
    export $(grep -v '^#' /Users/madengineering/ClaimGuardian/.env.local | xargs)
fi

# Function to log messages
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_message "Starting DBPR license import..."

# Check if download directory exists and has CSV files
if [ ! -d "$DOWNLOAD_DIR" ]; then
    log_message "Download directory not found: $DOWNLOAD_DIR"
    exit 1
fi

CSV_COUNT=$(ls -1 "$DOWNLOAD_DIR"*.csv 2>/dev/null | wc -l)
if [ "$CSV_COUNT" -eq 0 ]; then
    log_message "No CSV files found in $DOWNLOAD_DIR"
    exit 1
fi

log_message "Found $CSV_COUNT CSV files to import"

# Check if Node.js import script exists
if [ ! -f "$NODE_SCRIPT" ]; then
    log_message "Creating Node.js import script..."
    # The Node.js script will be created next
fi

# Run the Node.js import script
cd /Users/madengineering/ClaimGuardian
node "$NODE_SCRIPT"

IMPORT_EXIT_CODE=$?

if [ $IMPORT_EXIT_CODE -eq 0 ]; then
    log_message "Import completed successfully"
    
    # Clean up old archive files (keep last 12 weeks)
    ARCHIVE_DIR="/Users/madengineering/ClaimGuardian/data/florida/dbpr_licenses/archive/"
    if [ -d "$ARCHIVE_DIR" ]; then
        log_message "Cleaning up old archives..."
        find "$ARCHIVE_DIR" -type d -mtime +84 -exec rm -rf {} \; 2>/dev/null
    fi
else
    log_message "Import failed with exit code $IMPORT_EXIT_CODE"
    exit $IMPORT_EXIT_CODE
fi

log_message "DBPR license import process completed"