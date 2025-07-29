#!/bin/bash

# Apply migrations to Supabase manually
# This script provides the SQL commands to run in the Supabase SQL editor

echo "========================================"
echo "ClaimGuardian Database Migration Guide"
echo "========================================"
echo ""
echo "Go to: https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql"
echo ""
echo "Run these commands in order:"
echo ""
echo "1. First, check what tables already exist:"
echo "----------------------------------------"
cat << 'EOF'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
EOF

echo ""
echo "2. If you see user_tracking, user_preferences, or policy_documents_extended,"
echo "   run the cleanup script first:"
echo "----------------------------------------"
echo "Copy contents of: supabase/sql/cleanup_existing.sql"
echo ""

echo "3. Apply the complete schema (creates core tables):"
echo "----------------------------------------"
echo "Copy contents of: supabase/migrations/20250130000001_complete_schema_v1.sql"
echo ""

echo "4. Apply user tracking tables:"
echo "----------------------------------------"
echo "Copy contents of: supabase/migrations/20250130000002_user_tracking.sql"
echo ""

echo "5. Apply policy documents tables:"
echo "----------------------------------------"
echo "Copy contents of: supabase/migrations/20250130000003_policy_documents.sql"
echo ""

echo "6. Create storage bucket for policy documents:"
echo "----------------------------------------"
cat << 'EOF'
-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy-documents', 'policy-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for storage
CREATE POLICY "Users can upload their own policy documents" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'policy-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own policy documents" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'policy-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own policy documents" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'policy-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
EOF

echo ""
echo "7. Verify all tables were created:"
echo "----------------------------------------"
cat << 'EOF'
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
ORDER BY table_name;
EOF

echo ""
echo "Expected tables:"
echo "- claims"
echo "- coverage_types" 
echo "- fl_counties (should have 67 rows)"
echo "- personal_property"
echo "- policies"
echo "- policy_documents_extended"
echo "- properties"
echo "- property_systems"
echo "- user_activity_log"
echo "- user_preferences"
echo "- user_tracking"
echo ""
echo "========================================"