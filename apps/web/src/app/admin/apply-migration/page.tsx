/**
 * @fileMetadata
 * @purpose Admin page to apply database migrations
 * @owner admin-team
 * @dependencies ["react", "lucide-react"]
 * @exports ["default"]
 * @complexity medium
 * @tags ["admin", "migration", "database"]
 * @status active
 */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@claimguardian/ui'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2, Copy, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const migrationSteps = [
  {
    title: 'Create Enum Types',
    description: 'Creates claim status, damage type, and policy type enums',
    sql: `-- Create enum types for claims and policies
CREATE TYPE public.claim_status_enum AS ENUM (
    'draft', 'submitted', 'under_review', 'approved',
    'denied', 'settled', 'closed', 'reopened'
);

CREATE TYPE public.damage_type_enum AS ENUM (
    'hurricane', 'flood', 'wind', 'hail', 'fire',
    'water_damage', 'mold', 'theft', 'vandalism',
    'lightning', 'fallen_tree', 'other'
);

CREATE TYPE public.policy_type_enum AS ENUM (
    'HO3', 'HO5', 'HO6', 'HO8', 'DP1', 'DP3',
    'FLOOD', 'WIND', 'UMBRELLA', 'OTHER'
);

CREATE TYPE public.document_type_enum AS ENUM (
    'policy', 'claim', 'evidence'
);`
  },
  {
    title: 'Create Policies Table',
    description: 'Creates the policies table for insurance policy management',
    sql: `CREATE TABLE public.policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    carrier_name text NOT NULL,
    policy_number text NOT NULL,
    policy_type public.policy_type_enum NOT NULL,
    effective_date date NOT NULL,
    expiration_date date NOT NULL,
    coverage_details jsonb DEFAULT '{}',
    premium_amount numeric(10, 2),
    deductible_amount numeric(10, 2),
    wind_deductible_percentage numeric(5, 2),
    flood_deductible_amount numeric(10, 2),
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    created_by uuid REFERENCES auth.users(id),
    UNIQUE (property_id, policy_number, policy_type)
);`
  },
  {
    title: 'Create Claims Table',
    description: 'Creates the main claims table for tracking insurance claims',
    sql: `CREATE TABLE public.claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number text UNIQUE,
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    policy_id uuid NOT NULL REFERENCES public.policies(id) ON DELETE RESTRICT,
    user_id uuid NOT NULL REFERENCES auth.users(id),
    status public.claim_status_enum NOT NULL DEFAULT 'draft',
    damage_type public.damage_type_enum NOT NULL,
    date_of_loss date NOT NULL,
    date_reported date DEFAULT CURRENT_DATE,
    description text,
    estimated_value numeric(15, 2),
    deductible_applied numeric(15, 2),
    settled_value numeric(15, 2),
    settlement_date date,
    adjuster_name text,
    adjuster_phone text,
    adjuster_email text,
    claim_notes text,
    supporting_documents jsonb DEFAULT '[]',
    metadata jsonb DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);`
  },
  {
    title: 'Add Address Columns',
    description: 'Adds structured address columns to properties table',
    sql: `ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS street_address text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS postal_code text,
ADD COLUMN IF NOT EXISTS county text,
ADD COLUMN IF NOT EXISTS country text DEFAULT 'USA';`
  },
  {
    title: 'Migrate Address Data',
    description: 'Migrates existing JSONB address data to structured columns',
    sql: `UPDATE public.properties
SET 
    street_address = TRIM(CONCAT(
        COALESCE(address->>'street1', ''),
        CASE 
            WHEN address->>'street2' IS NOT NULL AND address->>'street2' != '' 
            THEN ', ' || (address->>'street2')
            ELSE ''
        END
    )),
    city = address->>'city',
    state = address->>'state',
    postal_code = address->>'zip',
    county = address->>'county',
    country = COALESCE(address->>'country', 'USA')
WHERE address IS NOT NULL;`
  },
  {
    title: 'Setup Storage Bucket',
    description: 'Creates storage bucket and RLS policies for policy documents',
    sql: `-- Create storage bucket for policy documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('policy-documents', 'policy-documents', false);

-- Create policy for authenticated users to upload their own files
CREATE POLICY "Users can upload their own policy documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for authenticated users to view their own files
CREATE POLICY "Users can view their own policy documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for authenticated users to delete their own files
CREATE POLICY "Users can delete their own policy documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for authenticated users to update their own files
CREATE POLICY "Users can update their own policy documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'policy-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );`
  },
  {
    title: 'Create Policy Documents Table',
    description: 'Creates table for storing policy document metadata',
    sql: `-- Create policy_documents table
CREATE TABLE public.policy_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    policy_id uuid REFERENCES public.policies(id) ON DELETE SET NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    file_type text NOT NULL,
    document_type public.document_type_enum NOT NULL DEFAULT 'policy',
    description text,
    uploaded_at timestamptz DEFAULT now(),
    uploaded_by uuid NOT NULL REFERENCES auth.users(id),
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size > 0 AND file_size <= 52428800), -- 50MB limit
    CONSTRAINT valid_file_type CHECK (file_type IN (
        'application/pdf',
        'image/png', 
        'image/jpeg',
        'image/jpg'
    ))
);

-- Create indexes for performance
CREATE INDEX idx_policy_documents_property_id ON public.policy_documents(property_id);
CREATE INDEX idx_policy_documents_policy_id ON public.policy_documents(policy_id);
CREATE INDEX idx_policy_documents_uploaded_by ON public.policy_documents(uploaded_by);
CREATE INDEX idx_policy_documents_document_type ON public.policy_documents(document_type);
CREATE INDEX idx_policy_documents_uploaded_at ON public.policy_documents(uploaded_at DESC);

-- Enable Row Level Security
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for policy_documents
CREATE POLICY "Users can view their own documents" ON public.policy_documents
    FOR SELECT USING (uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own documents" ON public.policy_documents
    FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own documents" ON public.policy_documents
    FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents" ON public.policy_documents
    FOR DELETE USING (uploaded_by = auth.uid());`
  }
]

export default function ApplyMigrationPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const copyToClipboard = async (sql: string, index: number) => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopiedIndex(index)
      toast.success('SQL copied to clipboard!')
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const openSupabaseSQL = () => {
    window.open('https://supabase.com/dashboard/project/tmlrvecuwgppbaynesji/sql/new', '_blank')
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Apply Database Migration</h1>
          <p className="text-gray-400">
            Follow these steps to apply the claims and policies database enhancements
          </p>
        </div>

        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Migration Steps
              <Button
                onClick={openSupabaseSQL}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Supabase SQL Editor
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {migrationSteps.map((step, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Step {index + 1}: {step.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        {step.description}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(step.sql, index)}
                      className="text-gray-400 hover:text-white"
                    >
                      {copiedIndex === index ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="relative">
                    <pre className="bg-gray-800 p-3 rounded text-xs text-gray-300 overflow-x-auto">
                      <code>{step.sql}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-300 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-200">
                <li>Click "Open Supabase SQL Editor" above</li>
                <li>Copy each SQL block using the copy button</li>
                <li>Paste into the SQL editor and click "Run"</li>
                <li>Run each step in order</li>
                <li>If a step fails with "already exists", that's okay - continue to the next</li>
              </ol>
            </div>

            <div className="mt-6 p-4 bg-green-900/20 border border-green-600/30 rounded-lg">
              <h3 className="text-lg font-semibold text-green-300 mb-2">What This Migration Does:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-green-200">
                <li>Creates dedicated tables for insurance claims and policies</li>
                <li>Adds proper tracking for claim lifecycle and communications</li>
                <li>Normalizes address data into structured columns</li>
                <li>Sets up Supabase Storage bucket for policy documents</li>
                <li>Creates policy_documents table for file metadata</li>
                <li>Implements Row Level Security for data protection</li>
                <li>Creates indexes for optimal query performance</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Full Migration File</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400 mb-4">
              For the complete migration including all tables, indexes, and RLS policies:
            </p>
            <div className="bg-gray-700 p-4 rounded-lg">
              <code className="text-sm text-gray-300">
                supabase/migrations/20250716051556_add_claims_and_policies_tables.sql
              </code>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}