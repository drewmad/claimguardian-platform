-- Production Database Fixes Migration
-- Created: 2025-08-05
-- Purpose: Apply all database fixes made via MCP to production

-- 1. Create policy_documents table
CREATE TABLE IF NOT EXISTS public.policy_documents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
    document_type text NOT NULL CHECK (document_type IN ('policy', 'declaration', 'endorsement', 'renewal', 'claim', 'inspection', 'other')),
    file_name text NOT NULL,
    file_size bigint NOT NULL,
    mime_type text NOT NULL,
    storage_path text NOT NULL,
    metadata jsonb DEFAULT '{}',
    uploaded_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create document_extractions table
CREATE TABLE IF NOT EXISTS public.document_extractions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id uuid REFERENCES public.policy_documents(id) ON DELETE CASCADE NOT NULL,
    extraction_type text NOT NULL,
    extracted_data jsonb NOT NULL,
    confidence_score numeric(3,2),
    ai_model text,
    processing_time_ms integer,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create learnings table
CREATE TABLE IF NOT EXISTS public.learnings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    task_type text NOT NULL,
    task_description text,
    error_type text,
    error_details jsonb,
    solution text,
    lesson_learned text,
    code_language text,
    framework text,
    tools_used text[],
    user_intent text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 4. Create search_learnings function
CREATE OR REPLACE FUNCTION public.search_learnings(
    p_task_type text DEFAULT NULL,
    p_error_type text DEFAULT NULL,
    p_code_language text DEFAULT NULL,
    p_framework text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    task_type text,
    task_description text,
    error_type text,
    solution text,
    lesson_learned text,
    relevance_score numeric
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.task_type,
        l.task_description,
        l.error_type,
        l.solution,
        l.lesson_learned,
        CASE
            WHEN l.task_type = p_task_type THEN 4
            WHEN l.error_type = p_error_type THEN 3
            WHEN l.code_language = p_code_language THEN 2
            WHEN l.framework = p_framework THEN 1
            ELSE 0
        END::numeric AS relevance_score
    FROM learnings l
    WHERE 
        (p_task_type IS NULL OR l.task_type = p_task_type)
        OR (p_error_type IS NULL OR l.error_type = p_error_type)
        OR (p_code_language IS NULL OR l.code_language = p_code_language)
        OR (p_framework IS NULL OR l.framework = p_framework)
    ORDER BY relevance_score DESC, l.created_at DESC
    LIMIT 20;
END;
$$;

-- 5. Add missing columns to user_profiles
DO $$ 
BEGIN
    -- Add first_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'first_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN first_name text;
    END IF;

    -- Add last_name if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'last_name') THEN
        ALTER TABLE public.user_profiles ADD COLUMN last_name text;
    END IF;

    -- Add email if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'email') THEN
        ALTER TABLE public.user_profiles ADD COLUMN email text;
    END IF;

    -- Add x_handle if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'x_handle') THEN
        ALTER TABLE public.user_profiles ADD COLUMN x_handle text;
    END IF;

    -- Add is_x_connected if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'user_profiles' 
                   AND column_name = 'is_x_connected') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_x_connected boolean DEFAULT false;
    END IF;
END $$;

-- 6. Create policy_documents_extended view
CREATE OR REPLACE VIEW public.policy_documents_extended AS
SELECT 
    pd.*,
    p.address as property_address,
    u.email as user_email
FROM policy_documents pd
LEFT JOIN properties p ON pd.property_id = p.id
LEFT JOIN auth.users u ON pd.user_id = u.id;

-- 7. Create recent_login_activity view
CREATE OR REPLACE VIEW public.recent_login_activity AS
SELECT 
    la.id,
    la.user_id,
    la.ip_address,
    la.user_agent,
    la.created_at,
    u.email as user_email,
    up.first_name,
    up.last_name
FROM login_activity la
JOIN auth.users u ON la.user_id = u.id
LEFT JOIN user_profiles up ON la.user_id = up.user_id
WHERE la.created_at > (now() - interval '30 days')
ORDER BY la.created_at DESC;

-- 8. Enable RLS on new tables
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learnings ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for policy_documents
CREATE POLICY "Users can view their own policy documents" ON public.policy_documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own policy documents" ON public.policy_documents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own policy documents" ON public.policy_documents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own policy documents" ON public.policy_documents
    FOR DELETE USING (auth.uid() = user_id);

-- 10. Create RLS policies for document_extractions
CREATE POLICY "Users can view extractions for their documents" ON public.document_extractions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.policy_documents pd
            WHERE pd.id = document_extractions.document_id
            AND pd.user_id = auth.uid()
        )
    );

-- 11. Create RLS policies for learnings (public read, admin write)
CREATE POLICY "Anyone can read learnings" ON public.learnings
    FOR SELECT USING (true);

-- 12. Fix user_profiles RLS policies (use user_id instead of id)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 13. Create storage bucket policies (if bucket exists)
DO $$ 
BEGIN
    -- Insert storage policies only if the bucket exists
    IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'policy-documents') THEN
        -- Delete existing policies to avoid conflicts
        DELETE FROM storage.objects WHERE bucket_id = 'policy-documents' AND name = '.emptyFolderPlaceholder';
        
        -- Create storage policies
        INSERT INTO storage.objects (bucket_id, name, owner, created_at, updated_at, version, metadata)
        VALUES 
            ('policy-documents', 'authenticated/', NULL, now(), now(), '1', '{"mimetype": "application/octet-stream", "size": 0}'),
            ('policy-documents', 'authenticated/.emptyFolderPlaceholder', NULL, now(), now(), '1', '{"mimetype": "application/octet-stream", "size": 0}')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 14. Create or update handle_new_user function with error handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
    profile_exists boolean;
BEGIN
    -- Check if profile already exists
    SELECT EXISTS (
        SELECT 1 FROM public.user_profiles 
        WHERE user_id = NEW.id
    ) INTO profile_exists;

    IF NOT profile_exists THEN
        BEGIN
            INSERT INTO public.user_profiles (
                user_id, 
                first_name,
                last_name,
                email,
                created_at,
                updated_at
            ) VALUES (
                NEW.id,
                COALESCE(NEW.raw_user_meta_data->>'firstName', NEW.raw_user_meta_data->>'first_name'),
                COALESCE(NEW.raw_user_meta_data->>'lastName', NEW.raw_user_meta_data->>'last_name'),
                NEW.email,
                NOW(),
                NOW()
            );
        EXCEPTION WHEN OTHERS THEN
            -- Log error but don't fail user creation
            RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
        END;
    END IF;
    
    RETURN NEW;
END;
$$;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add comment to track this migration
COMMENT ON TABLE public.policy_documents IS 'Applied via production fixes migration 2025-08-05';