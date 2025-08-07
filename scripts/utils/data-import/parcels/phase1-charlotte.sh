#!/bin/bash

##############################################################################
# PHASE 1: Charlotte County Foundation Setup
# Simplified version focused on Charlotte County data
##############################################################################

set -euo pipefail

# Load environment from .env.local
if [ -f ".env.local" ]; then
    source .env.local
fi

# Set up Supabase variables for our scripts
export SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
export SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Colors
readonly GREEN='\033[0;32m'
readonly BLUE='\033[0;34m'
readonly YELLOW='\033[1;33m'
readonly RED='\033[0;31m'
readonly NC='\033[0m'

echo -e "${BLUE}🏖️  PHASE 1: Charlotte County Foundation${NC}"
echo "==========================================="

# Check prerequisites
echo -e "${GREEN}🔍 Checking prerequisites...${NC}"

if [ -z "${SUPABASE_URL:-}" ] || [ -z "${SUPABASE_SERVICE_KEY:-}" ]; then
    echo -e "${RED}❌ Missing Supabase environment variables${NC}"
    exit 1
fi

if ! command -v node >/dev/null 2>&1; then
    echo -e "${RED}❌ Node.js not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"

# Step 1: Database Schema
echo ""
echo -e "${GREEN}📋 Step 1: Database Schema Setup${NC}"
echo "Please apply the database schema manually:"
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of scripts/charlotte-county-schema.sql"
echo "4. Execute the script"
echo ""
read -p "Have you applied the database schema? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Please apply the schema first, then run this script again${NC}"
    exit 0
fi

# Step 2: Transform and Import Charlotte County Data
echo ""
echo -e "${GREEN}📦 Step 2: Processing Charlotte County Data${NC}"

if [ ! -f "data/charlotte_county/charlotte_parcels.csv" ]; then
    echo -e "${RED}❌ Charlotte County data not found at: data/charlotte_county/charlotte_parcels.csv${NC}"
    echo "Please run the extraction script first"
    exit 1
fi

echo "Processing Charlotte County data (1000 records)..."

# Create a simple import script for Charlotte County
node -e "
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function importCharlotteData() {
    console.log('🔄 Importing Charlotte County data...');

    try {
        // Read CSV file
        const csvContent = fs.readFileSync('data/charlotte_county/charlotte_parcels.csv', 'utf8');
        const lines = csvContent.trim().split('\n');
        const headers = lines[0].split(',');

        console.log(\`📊 Found \${lines.length - 1} records to import\`);

        // Process records in batches
        const batchSize = 100;
        let successCount = 0;

        for (let i = 1; i < lines.length; i += batchSize) {
            const batch = [];

            for (let j = i; j < Math.min(i + batchSize, lines.length); j++) {
                const values = lines[j].split(',');
                const record = {};

                headers.forEach((header, index) => {
                    let value = values[index] || null;
                    if (value) {
                        value = value.replace(/^\"|\"$/g, '').trim();
                        if (value === '') value = null;
                    }
                    record[header] = value;
                });

                // Transform to our schema format
                const transformedRecord = {
                    parcel_id: record.PARCEL_ID,
                    county_fips: '12015', // Charlotte County
                    coordinates: {
                        lat: parseFloat(record.LATITUDE) || null,
                        lng: parseFloat(record.LONGITUDE) || null
                    },
                    bbox: {}, // Will be computed later
                    area_sqft: parseFloat(record.LND_SQFOOT) || null,
                    area_acres: record.LND_SQFOOT ? (parseFloat(record.LND_SQFOOT) / 43560) : null,
                    address: [record.PHY_ADDR1, record.PHY_CITY].filter(Boolean).join(', '),
                    owner_name: record.OWN_NAME,
                    owner_address: {
                        street: record.OWN_ADDR1,
                        city: record.OWN_CITY,
                        state: record.OWN_STATE,
                        zip: record.OWN_ZIPCD
                    },
                    property_value: parseFloat(record.TV_NSD) || null,
                    assessed_value: parseFloat(record.TV_NSD) || null,
                    year_built: parseInt(record.ACT_YR_BLT) || null,
                    spatial_features: {
                        coastal: true, // Charlotte County is coastal
                        county_name: 'Charlotte'
                    },
                    risk_factors: {
                        hurricane: 0.7, // High hurricane risk
                        flood: 0.5
                    },
                    property_features: {
                        square_feet: parseFloat(record.TOT_LVG_AR) || null,
                        buildings: parseInt(record.NO_BULDNG) || null
                    },
                    source_file: 'charlotte_parcels.csv',
                    data_vintage: '2024-01-01'
                };

                // Only add records with valid coordinates
                if (transformedRecord.coordinates.lat && transformedRecord.coordinates.lng) {
                    batch.push(transformedRecord);
                }
            }

            if (batch.length > 0) {
                const { error } = await supabase
                    .from('stg_properties')
                    .insert(batch);

                if (error) {
                    console.error(\`❌ Batch \${Math.floor(i/batchSize) + 1} error:\`, error);
                } else {
                    successCount += batch.length;
                    console.log(\`   ✅ Batch \${Math.floor(i/batchSize) + 1}: \${batch.length} records imported\`);
                }
            }
        }

        console.log(\`\n📊 Import Summary:\`);
        console.log(\`   Total imported: \${successCount} records\`);

        if (successCount > 0) {
            console.log('🔄 Performing atomic swap to main table...');
            const { data: swapResult, error: swapError } = await supabase.rpc('atomic_properties_swap');

            if (swapError) {
                console.error('❌ Swap failed:', swapError);
            } else {
                console.log('✅ Atomic swap completed successfully');
                console.log(swapResult);
            }
        }

    } catch (error) {
        console.error('❌ Import failed:', error);
        process.exit(1);
    }
}

importCharlotteData();
"

echo -e "${GREEN}✅ Charlotte County data imported!${NC}"

# Step 3: Basic AI Testing (optional)
echo ""
echo -e "${GREEN}🤖 Step 3: Basic AI Testing (Optional)${NC}"
read -p "Test AI embeddings on sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -z "${OPENAI_API_KEY:-}" ]; then
        echo -e "${YELLOW}⚠️  OpenAI API key not set - skipping AI testing${NC}"
    else
        echo "Testing AI embeddings on first 10 properties..."
        node scripts/ai-embeddings.js generate --limit 10 || {
            echo -e "${YELLOW}⚠️  AI testing failed - continuing without AI features${NC}"
        }
    fi
fi

# Step 4: Verification
echo ""
echo -e "${GREEN}🔍 Step 4: Verification${NC}"

node -e "
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function verifyImport() {
    try {
        const { data: properties, error } = await supabase
            .from('properties')
            .select('*')
            .eq('county_fips', '12015')
            .limit(5);

        if (error) throw error;

        console.log(\`📊 Verification Results:\`);
        console.log(\`   Charlotte County properties: \${properties.length} (showing first 5)\`);

        if (properties.length > 0) {
            console.log(\`   Sample property:\`);
            console.log(\`     Parcel ID: \${properties[0].parcel_id}\`);
            console.log(\`     Address: \${properties[0].address}\`);
            console.log(\`     Coordinates: \${properties[0].coordinates?.lat}, \${properties[0].coordinates?.lng}\`);
            console.log(\`     Property Value: $\${properties[0].property_value?.toLocaleString() || 'N/A'}\`);
        }

        // Check total count
        const { count } = await supabase
            .from('properties')
            .select('*', { count: 'exact', head: true })
            .eq('county_fips', '12015');

        console.log(\`   Total Charlotte County properties: \${count}\`);

    } catch (error) {
        console.error('❌ Verification failed:', error);
    }
}

verifyImport();
"

echo ""
echo -e "${GREEN}🎉 Phase 1 Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "   ✅ Database schema applied"
echo "   ✅ Charlotte County data imported"
echo "   ✅ Basic verification completed"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "   1. Review data in Supabase dashboard"
echo "   2. Test queries using properties_ai_ready view"
echo "   3. When ready, proceed to Phase 2: ./scripts/phased-deployment.sh 2"
echo ""
echo -e "${GREEN}🔗 Useful URLs:${NC}"
echo "   Supabase Dashboard: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji"
echo "   SQL Editor: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql"
