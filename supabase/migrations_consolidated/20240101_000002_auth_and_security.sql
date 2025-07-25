-- Authentication and security related tables
-- Handles login tracking, audit logs, and security features

-- Security audit logs table (partitioned by month)
CREATE TABLE IF NOT EXISTS security.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
) PARTITION BY RANGE (created_at);

-- Create initial partition
CREATE TABLE IF NOT EXISTS security.audit_logs_2024_01 
  PARTITION OF security.audit_logs 
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Login activity table
CREATE TABLE IF NOT EXISTS security.login_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  login_timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  ip_address INET,
  user_agent TEXT,
  login_method TEXT,
  success BOOLEAN DEFAULT true NOT NULL,
  failure_reason TEXT,
  session_id UUID,
  device_fingerprint TEXT,
  location_data JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Security questions table
CREATE TABLE IF NOT EXISTS public.security_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_number INTEGER NOT NULL CHECK (question_number BETWEEN 1 AND 3),
  question TEXT NOT NULL,
  answer_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  UNIQUE(user_id, question_number)
);

-- Function to log login activity
CREATE OR REPLACE FUNCTION security.log_login_activity(
  p_user_id UUID,
  p_email TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_failure_reason TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO security.login_activity (
    user_id,
    ip_address,
    user_agent,
    success,
    failure_reason
  ) VALUES (
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_success,
    p_failure_reason
  ) RETURNING id INTO v_activity_id;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify security answers
CREATE OR REPLACE FUNCTION public.verify_security_answers(
  p_user_id UUID,
  p_answers JSONB
)
RETURNS BOOLEAN AS $$
DECLARE
  v_question RECORD;
  v_answer TEXT;
  v_matches INTEGER := 0;
BEGIN
  FOR v_question IN 
    SELECT question_number, answer_hash 
    FROM public.security_questions 
    WHERE user_id = p_user_id
  LOOP
    v_answer := p_answers->>(v_question.question_number::TEXT);
    IF v_answer IS NOT NULL AND crypt(v_answer, v_question.answer_hash) = v_question.answer_hash THEN
      v_matches := v_matches + 1;
    END IF;
  END LOOP;
  
  -- Require at least 2 correct answers
  RETURN v_matches >= 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policies
ALTER TABLE security.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role only" ON security.audit_logs
  USING (auth.role() = 'service_role');

-- Users can view own login activity
CREATE POLICY "Users view own login activity" ON security.login_activity
  FOR SELECT USING (auth.uid() = user_id);

-- Service role full access to login activity
CREATE POLICY "Service role full access" ON security.login_activity
  USING (auth.role() = 'service_role');

-- Security questions policies
CREATE POLICY "Users manage own security questions" ON public.security_questions
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_audit_logs_created_at ON security.audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_id ON security.audit_logs(user_id);
CREATE INDEX idx_login_activity_user_id ON security.login_activity(user_id);
CREATE INDEX idx_login_activity_timestamp ON security.login_activity(login_timestamp);

-- Trigger for security questions
CREATE TRIGGER set_updated_at_security_questions
  BEFORE UPDATE ON public.security_questions
  FOR EACH ROW
  EXECUTE FUNCTION core.set_updated_at();