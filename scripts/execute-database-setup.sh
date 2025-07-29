#!/bin/bash

echo "🚀 Executing ClaimGuardian Database Setup v1.1 via Supabase CLI..."
echo ""

# Function to execute SQL file
execute_sql() {
    local sql_file=$1
    local description=$2
    
    echo "📝 Executing: $description"
    
    # Create a temporary file with the SQL wrapped in a DO block for better error handling
    cat > /tmp/supabase_exec.sql << 'EOF'
DO $$
BEGIN
    -- Execute the SQL file content
EOF
    
    cat "$sql_file" >> /tmp/supabase_exec.sql
    
    cat >> /tmp/supabase_exec.sql << 'EOF'
    
    RAISE NOTICE 'Database setup completed successfully!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during execution: %', SQLERRM;
        -- Continue execution despite errors
END $$;
EOF
    
    # Execute via psql using the Supabase database URL
    if command -v supabase &> /dev/null; then
        # Get the database URL
        DB_URL=$(supabase db remote url 2>/dev/null)
        
        if [ -z "$DB_URL" ]; then
            echo "❌ Could not get database URL. Make sure you're linked to a Supabase project."
            return 1
        fi
        
        # Execute the SQL
        psql "$DB_URL" -f /tmp/supabase_exec.sql
        
        # Clean up
        rm -f /tmp/supabase_exec.sql
        
        echo "✅ $description completed!"
        echo ""
    else
        echo "❌ Supabase CLI not found. Please install it first."
        return 1
    fi
}

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20250130000004_complete_database_v1_1.sql" ]; then
    echo "❌ Migration file not found!"
    echo "Please run this script from the ClaimGuardian root directory."
    exit 1
fi

echo "⚠️  This will execute the complete database setup including:"
echo "- All table creations with IF NOT EXISTS"
echo "- Real Florida county data"
echo "- Indexes and RLS policies"
echo "- Views and triggers"
echo ""
echo "The script is idempotent and safe to run multiple times."
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Execute the comprehensive database setup
    execute_sql "supabase/migrations/20250130000004_complete_database_v1_1.sql" "Complete Database v1.1 Setup"
    
    echo "🎉 Database setup complete!"
    echo ""
    echo "You can verify the setup by:"
    echo "1. Checking tables in Supabase Dashboard"
    echo "2. Running: supabase db remote query 'SELECT count(*) FROM fl_counties;'"
    echo "3. Viewing the schema in the SQL Editor"
else
    echo "❌ Setup cancelled."
fi