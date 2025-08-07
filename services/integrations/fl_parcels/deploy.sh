#!/bin/bash

# Deploy Florida Parcels ETL Edge Functions
# This script deploys all the edge functions for the parcels ETL pipeline

set -e

echo "🚀 Deploying Florida Parcels ETL Edge Functions..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first."
    exit 1
fi

# Deploy FGIO sync function
echo "📦 Deploying FGIO quarterly sync function..."
supabase functions deploy fgio-sync \
  --no-verify-jwt \
  --import-file ./fgio_sync.ts

# Deploy FDOT delta sync function
echo "📦 Deploying FDOT weekly delta sync function..."
supabase functions deploy fdot-delta \
  --no-verify-jwt \
  --import-file ./fdot_delta.ts

# Deploy ZIP ingest function
echo "📦 Deploying ZIP shapefile ingest function..."
supabase functions deploy zip-ingest \
  --no-verify-jwt \
  --import-file ./zip_ingest.ts

# Set up cron schedules
echo "⏰ Setting up cron schedules..."
supabase functions deploy \
  --schedule ./../../supabase/functions/cron.yaml

echo "✅ All edge functions deployed successfully!"
echo ""
echo "📝 Next steps:"
echo "1. Run database migrations: pnpm db:migrate"
echo "2. Test functions manually:"
echo "   - FGIO: supabase functions invoke fgio-sync"
echo "   - FDOT: supabase functions invoke fdot-delta"
echo "   - ZIP: supabase functions invoke zip-ingest --body '{\"url\":\"<ZIP_URL>\",\"source\":\"fgdl\"}'"
echo "3. Monitor logs: supabase functions logs --tail"
echo ""
echo "🔗 Useful links:"
echo "   - FGIO: https://www.arcgis.com/home/item.html?id=efa909d6b1c841d298b0a649e7f71cf2"
echo "   - FDOT: https://gis.fdot.gov/arcgis/rest/services/Parcels/FeatureServer"
echo "   - FGDL: https://fgdl.org/explore-data/"
echo "   - DOR: https://floridarevenue.com/property/Pages/DataPortal_RequestAssessmentRollGISData.aspx"
