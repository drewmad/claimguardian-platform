'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function FixDatabasePage() {
  const [isApplying, setIsApplying] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const fixUserProfilesTable = `
-- Fix user_profiles table to use user_id as primary key
-- This matches what the application code expects

-- First, check if the table needs fixing
DO $$ 
BEGIN
    -- Check if user_id column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'user_id'
    ) THEN
        -- Rename id to user_id if it exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'user_profiles' 
            AND column_name = 'id'
        ) THEN
            ALTER TABLE public.user_profiles RENAME COLUMN id TO user_id;
        ELSE
            -- Add user_id column if neither exists
            ALTER TABLE public.user_profiles 
            ADD COLUMN user_id uuid PRIMARY KEY DEFAULT gen_random_uuid();
        END IF;
    END IF;

    -- Ensure user_id references auth.users
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public' 
        AND tc.table_name = 'user_profiles'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'user_id'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD CONSTRAINT user_profiles_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'user_profiles' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE public.user_profiles 
        ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;

-- Create RLS policies
CREATE POLICY "Users can view own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.user_profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create or replace the trigger function to auto-create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_profiles (user_id, created_at, updated_at)
    VALUES (new.id, now(), now())
    ON CONFLICT (user_id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_profiles TO service_role;
  `

  const handleApplyFix = async () => {
    setIsApplying(true)
    setStatus('idle')
    
    try {
      // Show instructions since we can't directly execute SQL from the client
      toast.info('Please run this SQL in your Supabase SQL Editor', {
        duration: 10000,
      })
      
      // Copy to clipboard
      await navigator.clipboard.writeText(fixUserProfilesTable)
      toast.success('SQL copied to clipboard!')
      
      setStatus('success')
    } catch (error) {
      console.error('Error:', error)
      toast.error('Failed to copy SQL to clipboard')
      setStatus('error')
    } finally {
      setIsApplying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Fix Database Issues</h1>
        
        <Card className="bg-gray-800 border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Fix user_profiles Table</h2>
          
          <div className="bg-gray-900 p-4 rounded-lg mb-6">
            <p className="text-gray-300 mb-2">This will fix the following issues:</p>
            <ul className="list-disc list-inside text-gray-400 space-y-1">
              <li>Rename 'id' column to 'user_id' to match application code</li>
              <li>Add proper foreign key constraint to auth.users</li>
              <li>Add RLS policies for secure user access</li>
              <li>Create trigger for automatic profile creation</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-yellow-300 font-medium">Manual Application Required</p>
                  <p className="text-yellow-200 text-sm mt-1">
                    Click the button below to copy the SQL to your clipboard, then:
                  </p>
                  <ol className="list-decimal list-inside text-yellow-200 text-sm mt-2 space-y-1">
                    <li>Go to your Supabase Dashboard</li>
                    <li>Navigate to SQL Editor</li>
                    <li>Paste the SQL and click "Run"</li>
                  </ol>
                </div>
              </div>
            </div>

            <Button
              onClick={handleApplyFix}
              disabled={isApplying}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Copying SQL...
                </>
              ) : (
                <>
                  Copy SQL to Clipboard
                </>
              )}
            </Button>

            {status === 'success' && (
              <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <p className="text-green-300">
                    SQL copied! Now paste it in your Supabase SQL Editor and run it.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6">
              <details className="bg-gray-900/50 rounded-lg">
                <summary className="p-4 cursor-pointer text-gray-300 hover:text-white">
                  View SQL Script
                </summary>
                <pre className="p-4 text-xs text-gray-400 overflow-x-auto">
                  <code>{fixUserProfilesTable}</code>
                </pre>
              </details>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}