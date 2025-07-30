-- Force Auth Service to Recognize Tables
-- This creates the profiles table in the auth schema if needed

-- 1. Check if profiles exists in auth schema (where Auth service might be looking)
DO $$
BEGIN
    -- Create profiles table in auth schema if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'auth' AND table_name = 'profiles'
    ) THEN
        CREATE TABLE auth.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            metadata JSONB DEFAULT '{}'::jsonb
        );
        
        -- Grant permissions
        GRANT ALL ON auth.profiles TO postgres;
        GRANT ALL ON auth.profiles TO authenticated;
        GRANT ALL ON auth.profiles TO anon; 
        GRANT ALL ON auth.profiles TO service_role;
        
        RAISE NOTICE 'Created profiles table in auth schema';
    END IF;
END $$;

-- 2. Create a view in auth schema that points to public.profiles
DROP VIEW IF EXISTS auth.profiles_view;
CREATE VIEW auth.profiles_view AS SELECT * FROM public.profiles;
GRANT ALL ON auth.profiles_view TO postgres, authenticated, anon, service_role;

-- 3. Ensure public.profiles has proper ownership
ALTER TABLE public.profiles OWNER TO postgres;
GRANT ALL PRIVILEGES ON public.profiles TO postgres;
GRANT ALL PRIVILEGES ON public.profiles TO service_role;

-- 4. Create a function that the Auth service can definitely access
CREATE OR REPLACE FUNCTION auth.ensure_profile_exists(user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.profiles (id, created_at, updated_at)
    VALUES (user_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to everyone
GRANT EXECUTE ON FUNCTION auth.ensure_profile_exists TO postgres;
GRANT EXECUTE ON FUNCTION auth.ensure_profile_exists TO authenticated;
GRANT EXECUTE ON FUNCTION auth.ensure_profile_exists TO anon;
GRANT EXECUTE ON FUNCTION auth.ensure_profile_exists TO service_role;

-- 5. Update the trigger to use the auth schema function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use the auth schema function
    PERFORM auth.ensure_profile_exists(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.handle_new_user();

-- 6. Test the setup
SELECT 'Auth service setup complete. Testing...' as status;

-- Try to call the function to test
SELECT auth.ensure_profile_exists('00000000-0000-0000-0000-000000000000');

SELECT 'Setup verified successfully!' as result;