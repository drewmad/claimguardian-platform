#!/bin/bash

# Test script for DBPR license import
# Downloads a sample and tests the import process

echo "DBPR License Import Test"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Directories
SCRIPT_DIR="/Users/madengineering/ClaimGuardian/scripts/data-import"
DATA_DIR="/Users/madengineering/ClaimGuardian/data/florida/dbpr_licenses"
LOG_DIR="/Users/madengineering/ClaimGuardian/logs"

# Create necessary directories
mkdir -p "$DATA_DIR"
mkdir -p "$LOG_DIR"

echo "Step 1: Testing download of one file..."
echo "----------------------------------------"

# Test downloading just one file first
TEST_URL="https://www2.myfloridalicense.com/sto/file_download/extracts/cilb_certified.csv"
TEST_FILE="$DATA_DIR/test_cilb_certified.csv"

echo "Downloading sample file..."
if curl -s -f -o "$TEST_FILE" "$TEST_URL"; then
    FILE_SIZE=$(du -h "$TEST_FILE" | cut -f1)
    LINE_COUNT=$(wc -l < "$TEST_FILE")
    echo -e "${GREEN}✓${NC} Successfully downloaded test file"
    echo "  Size: $FILE_SIZE"
    echo "  Lines: $LINE_COUNT"
    
    # Show first few lines
    echo ""
    echo "First 3 lines of CSV:"
    head -n 3 "$TEST_FILE" | cut -c1-120
    echo ""
else
    echo -e "${RED}✗${NC} Failed to download test file"
    echo "Please check your internet connection"
    exit 1
fi

echo ""
echo "Step 2: Testing full download script..."
echo "----------------------------------------"

read -p "Download all DBPR license files? (y/n): " download_all

if [ "$download_all" = "y" ]; then
    if [ -f "$SCRIPT_DIR/download_dbpr_licenses.sh" ]; then
        echo "Running download script..."
        bash "$SCRIPT_DIR/download_dbpr_licenses.sh"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Download completed successfully"
            
            # List downloaded files
            echo ""
            echo "Downloaded files:"
            ls -lh "$DATA_DIR"*.csv 2>/dev/null | awk '{print "  " $9 ": " $5}'
        else
            echo -e "${RED}✗${NC} Download failed"
            exit 1
        fi
    else
        echo -e "${RED}✗${NC} Download script not found"
        exit 1
    fi
fi

echo ""
echo "Step 3: Testing database connection..."
echo "----------------------------------------"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗${NC} Node.js is not installed"
    echo "Please install Node.js first"
    exit 1
fi

# Check if csv-parser is installed
if [ ! -d "/Users/madengineering/ClaimGuardian/node_modules/csv-parser" ]; then
    echo -e "${YELLOW}⚠${NC} csv-parser not installed. Installing..."
    cd /Users/madengineering/ClaimGuardian
    npm install csv-parser
fi

# Test database connection
echo "Testing Supabase connection..."
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

supabase
  .from('dbpr_licenses')
  .select('count')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('⚠ Table does not exist yet. Run migration first.');
        console.log('  Apply migration: supabase/migrations/20250108_dbpr_licenses.sql');
      } else {
        console.log('✗ Database connection failed:', error.message);
      }
      process.exit(1);
    } else {
      console.log('✓ Database connection successful');
      process.exit(0);
    }
  });
" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Database connection successful"
else
    echo -e "${YELLOW}⚠${NC} Database table may not exist. Apply migration first:"
    echo "  supabase db push --file supabase/migrations/20250108_dbpr_licenses.sql"
fi

echo ""
echo "Step 4: Test import (dry run)..."
echo "----------------------------------------"

read -p "Run a test import? (y/n): " run_import

if [ "$run_import" = "y" ]; then
    echo "Running import script..."
    
    if [ -f "$SCRIPT_DIR/import_dbpr_licenses.sh" ]; then
        bash "$SCRIPT_DIR/import_dbpr_licenses.sh"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓${NC} Import completed successfully"
            
            # Check import results
            echo ""
            echo "Checking import results..."
            node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

Promise.all([
  supabase.from('dbpr_licenses').select('*', { count: 'exact', head: true }),
  supabase.from('dbpr_import_batches').select('*').order('created_at', { ascending: false }).limit(1)
]).then(([licenses, batches]) => {
  if (licenses.error) {
    console.log('Could not get license count:', licenses.error.message);
  } else {
    console.log('Total licenses in database:', licenses.count || 0);
  }
  
  if (batches.data && batches.data[0]) {
    const batch = batches.data[0];
    console.log('Last import batch:');
    console.log('  Date:', batch.import_date);
    console.log('  Total records:', batch.total_records);
    console.log('  New records:', batch.new_records);
    console.log('  Updated records:', batch.updated_records);
    console.log('  Deactivated:', batch.deactivated_records);
    console.log('  Status:', batch.status);
  }
});
            " 2>/dev/null
        else
            echo -e "${RED}✗${NC} Import failed"
        fi
    else
        echo -e "${RED}✗${NC} Import script not found"
    fi
fi

echo ""
echo "Step 5: Setup cron job..."
echo "-------------------------"

read -p "Set up weekly automated import? (y/n): " setup_cron

if [ "$setup_cron" = "y" ]; then
    if [ -f "$SCRIPT_DIR/setup_dbpr_cron.sh" ]; then
        bash "$SCRIPT_DIR/setup_dbpr_cron.sh"
    else
        echo -e "${RED}✗${NC} Cron setup script not found"
    fi
fi

echo ""
echo "Test complete!"
echo ""
echo "Summary:"
echo "--------"
echo "✓ Download script: $SCRIPT_DIR/download_dbpr_licenses.sh"
echo "✓ Import script: $SCRIPT_DIR/import_dbpr_licenses.sh"
echo "✓ Data directory: $DATA_DIR"
echo "✓ Log directory: $LOG_DIR"
echo ""
echo "To manually run the import:"
echo "  bash $SCRIPT_DIR/download_dbpr_licenses.sh"
echo ""
echo "To view logs:"
echo "  tail -f $LOG_DIR/dbpr_download.log"
echo "  tail -f $LOG_DIR/dbpr_import.log"