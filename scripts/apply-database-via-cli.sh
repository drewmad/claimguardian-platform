#!/bin/bash

echo "🚀 Applying ClaimGuardian Database Setup v1.1"
echo ""
echo "Since migrations are already marked as applied, we'll execute the SQL directly."
echo ""

# Check if psql is installed
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    echo ""
    echo "On macOS: brew install postgresql"
    echo "On Ubuntu: sudo apt-get install postgresql-client"
    exit 1
fi

# Get the database URL from Supabase
echo "📡 Getting database connection details..."
DB_URL=$(supabase status --output json 2>/dev/null | grep -o '"db_url":"[^"]*' | cut -d'"' -f4)

if [ -z "$DB_URL" ]; then
    echo "❌ Could not get database URL. Make sure you're linked to a Supabase project."
    echo ""
    echo "Try running: supabase link --project-ref tmlrvecuwgppbaynesji"
    exit 1
fi

echo "✅ Connected to Supabase project"
echo ""

# Create a combined SQL file that handles existing objects
cat > /tmp/apply_database.sql << 'EOF'
-- ClaimGuardian Database Setup v1.1
-- This script safely applies all database objects

\echo 'Starting database setup...'

-- First, let's check what already exists
DO $$
DECLARE
    table_count INTEGER;
    county_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Found % existing tables', table_count;
    
    -- Check if fl_counties exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fl_counties') THEN
        SELECT COUNT(*) INTO county_count FROM public.fl_counties;
        RAISE NOTICE 'Florida counties table has % records', county_count;
    END IF;
END $$;

\echo 'Applying comprehensive database setup...'

EOF

# Append the main migration file
cat supabase/migrations/20250130000004_complete_database_v1_1.sql >> /tmp/apply_database.sql

# Add completion message
cat >> /tmp/apply_database.sql << 'EOF'

\echo 'Database setup completed!'

-- Verify the setup
DO $$
DECLARE
    table_count INTEGER;
    county_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    SELECT COUNT(*) INTO county_count FROM public.fl_counties;
    
    RAISE NOTICE 'Setup complete: % tables created, % Florida counties loaded', table_count, county_count;
END $$;
EOF

echo "📝 Executing database setup..."
echo ""

# Execute the SQL
if psql "$DB_URL" -f /tmp/apply_database.sql; then
    echo ""
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "🔍 You can verify the setup in your Supabase Dashboard:"
    echo "   https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/editor"
    echo ""
    echo "📊 Key tables created:"
    echo "   - user_profiles (with history tracking)"
    echo "   - households & household_members"
    echo "   - properties (with full details)"
    echo "   - policies (insurance tracking)"
    echo "   - claims (with timeline)"
    echo "   - property_damage (with AI assessment)"
    echo "   - fl_counties (67 counties with real data)"
    echo "   - notifications & ai_tasks"
    echo ""
else
    echo ""
    echo "❌ Error during database setup"
    echo ""
    echo "This might be because some objects already exist."
    echo "You can review and run the SQL manually in Supabase Dashboard."
fi

# Clean up
rm -f /tmp/apply_database.sql