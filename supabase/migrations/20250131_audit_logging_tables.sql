-- Create audit_logs table for tracking authenticated user actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create security_logs table for tracking security events (auth attempts, API calls)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON public.security_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON public.security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON public.security_logs(ip_address);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs
-- Users can only view their own audit logs
CREATE POLICY "Users can view own audit logs" ON public.audit_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs" ON public.audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_app_meta_data->>'role' = 'admin'
        )
    );

-- RLS Policies for security_logs
-- Users can view their own security logs
CREATE POLICY "Users can view own security logs" ON public.security_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Service role can insert security logs
CREATE POLICY "Service role can insert security logs" ON public.security_logs
    FOR INSERT
    WITH CHECK (true);

-- Admins can view all security logs
CREATE POLICY "Admins can view all security logs" ON public.security_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND raw_app_meta_data->>'role' = 'admin'
        )
    );

-- Create function to automatically log user actions
CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_action TEXT;
    v_metadata JSONB;
BEGIN
    -- Get the current user ID
    v_user_id := auth.uid();
    
    -- Determine the action based on TG_OP
    v_action := TG_TABLE_NAME || '.' || TG_OP;
    
    -- Build metadata
    v_metadata := jsonb_build_object(
        'table_name', TG_TABLE_NAME,
        'operation', TG_OP,
        'timestamp', NOW()
    );
    
    -- Add row data based on operation
    IF TG_OP = 'INSERT' THEN
        v_metadata := v_metadata || jsonb_build_object('new_data', row_to_json(NEW)::jsonb);
    ELSIF TG_OP = 'UPDATE' THEN
        v_metadata := v_metadata || jsonb_build_object(
            'old_data', row_to_json(OLD)::jsonb,
            'new_data', row_to_json(NEW)::jsonb
        );
    ELSIF TG_OP = 'DELETE' THEN
        v_metadata := v_metadata || jsonb_build_object('old_data', row_to_json(OLD)::jsonb);
    END IF;
    
    -- Insert audit log entry
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        v_user_id,
        v_action,
        TG_TABLE_NAME,
        CASE
            WHEN TG_OP = 'DELETE' THEN OLD.id::TEXT
            ELSE NEW.id::TEXT
        END,
        v_metadata
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for important tables
-- Note: Add triggers selectively to avoid performance impact

-- Trigger for properties table
CREATE TRIGGER audit_properties
    AFTER INSERT OR UPDATE OR DELETE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Trigger for claims table
CREATE TRIGGER audit_claims
    AFTER INSERT OR UPDATE OR DELETE ON public.claims
    FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Trigger for policies table
CREATE TRIGGER audit_policies
    AFTER INSERT OR UPDATE OR DELETE ON public.policies
    FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_event_type TEXT,
    p_severity TEXT,
    p_action TEXT,
    p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO public.security_logs (
        event_type,
        severity,
        user_id,
        action,
        metadata
    ) VALUES (
        p_event_type,
        p_severity,
        auth.uid(),
        p_action,
        p_metadata
    ) RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create view for recent security events
CREATE OR REPLACE VIEW public.recent_security_events AS
SELECT 
    sl.*,
    u.email as user_email,
    u.raw_user_meta_data->>'full_name' as user_name
FROM public.security_logs sl
LEFT JOIN auth.users u ON u.id = sl.user_id
WHERE sl.created_at >= NOW() - INTERVAL '7 days'
ORDER BY sl.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.recent_security_events TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.audit_logs IS 'Tracks all user actions for compliance and debugging';
COMMENT ON TABLE public.security_logs IS 'Tracks security-related events like auth attempts and suspicious activities';
COMMENT ON FUNCTION public.log_user_action() IS 'Automatically logs user actions to audit_logs table';
COMMENT ON FUNCTION public.log_security_event(TEXT, TEXT, TEXT, JSONB) IS 'Manually log security events';