-- Enhanced logging for user creation debugging
-- Date: 2025-07-16

-- Create a logging table for debugging user creation issues
CREATE TABLE IF NOT EXISTS public.debug_user_creation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    step TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to log debug information
CREATE OR REPLACE FUNCTION public.log_user_creation_debug(
    p_user_id UUID,
    p_step TEXT,
    p_success BOOLEAN,
    p_error_message TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.debug_user_creation_logs (
        user_id, step, success, error_message, metadata, created_at
    ) VALUES (
        p_user_id, p_step, p_success, p_error_message, p_metadata, NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update handle_new_user function with detailed logging
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    error_detail TEXT;
    user_metadata JSONB;
BEGIN
    -- Log start of user creation
    PERFORM public.log_user_creation_debug(
        NEW.id,
        'trigger_start',
        true,
        NULL,
        jsonb_build_object(
            'email', NEW.email,
            'created_at', NEW.created_at,
            'raw_user_meta_data', NEW.raw_user_meta_data
        )
    );

    -- Extract user metadata for easier access
    user_metadata := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);

    -- Try to insert into user_profiles table
    BEGIN
        INSERT INTO public.user_profiles (
            id,
            first_name,
            last_name,
            phone,
            avatar_url,
            x_handle,
            is_x_connected,
            member_since
        )
        VALUES (
            NEW.id,
            COALESCE(user_metadata->>'firstName', ''),
            COALESCE(user_metadata->>'lastName', ''),
            COALESCE(user_metadata->>'phone', ''),
            COALESCE(user_metadata->>'avatarUrl', ''),
            COALESCE(user_metadata->>'xHandle', ''),
            COALESCE((user_metadata->>'isXConnected')::boolean, false),
            NOW()
        );

        -- Log successful profile creation
        PERFORM public.log_user_creation_debug(
            NEW.id,
            'user_profile_created',
            true,
            NULL,
            jsonb_build_object(
                'first_name', COALESCE(user_metadata->>'firstName', ''),
                'last_name', COALESCE(user_metadata->>'lastName', ''),
                'phone', COALESCE(user_metadata->>'phone', '')
            )
        );

    EXCEPTION 
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_detail = PG_EXCEPTION_DETAIL;
            
            -- Log profile creation error
            PERFORM public.log_user_creation_debug(
                NEW.id,
                'user_profile_error',
                false,
                SQLSTATE || ': ' || SQLERRM,
                jsonb_build_object(
                    'error_detail', error_detail,
                    'user_metadata', user_metadata
                )
            );
            
            -- Don't fail the entire user creation for profile errors
            RAISE WARNING 'Failed to create user profile for user %: % (Detail: %)', NEW.id, SQLERRM, error_detail;
    END;

    -- Try to insert default plan if table exists
    BEGIN
        INSERT INTO public.user_plans (user_id)
        VALUES (NEW.id)
        ON CONFLICT (user_id) DO NOTHING;

        -- Log successful plan creation
        PERFORM public.log_user_creation_debug(
            NEW.id,
            'user_plan_created',
            true,
            NULL,
            NULL
        );

    EXCEPTION 
        WHEN undefined_table THEN
            -- user_plans table doesn't exist yet, log but don't fail
            PERFORM public.log_user_creation_debug(
                NEW.id,
                'user_plan_skipped',
                true,
                'user_plans table does not exist',
                NULL
            );
            
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_detail = PG_EXCEPTION_DETAIL;
            
            -- Log plan creation error but don't fail user creation
            PERFORM public.log_user_creation_debug(
                NEW.id,
                'user_plan_error',
                false,
                SQLSTATE || ': ' || SQLERRM,
                jsonb_build_object('error_detail', error_detail)
            );
            
            RAISE WARNING 'Failed to create user plan for user %: % (Detail: %)', NEW.id, SQLERRM, error_detail;
    END;

    -- Log successful completion
    PERFORM public.log_user_creation_debug(
        NEW.id,
        'trigger_complete',
        true,
        NULL,
        NULL
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON public.debug_user_creation_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_creation_debug(UUID, TEXT, BOOLEAN, TEXT, JSONB) TO authenticated;