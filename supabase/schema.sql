
--
-- Name: error_log_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.error_log_status AS ENUM (
    'new',
    'acknowledged',
    'resolved',
    'ignored'
);

ALTER TABLE public.error_logs
ADD COLUMN status public.error_log_status DEFAULT 'new',
ADD COLUMN notes text;

--
-- Name: log_error(character varying, character varying, text, text, jsonb, character varying, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE OR REPLACE FUNCTION public.log_error(p_error_type character varying, p_error_code character varying, p_error_message text, p_error_stack text DEFAULT NULL::text, p_context jsonb DEFAULT '{}'::jsonb, p_severity character varying DEFAULT 'error'::character varying, p_url text DEFAULT NULL::text, p_user_agent text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO public.error_logs (
    user_id,
    error_type,
    error_code,
    error_message,
    error_stack,
    context,
    severity,
    url,
    user_agent,
    status
  ) VALUES (
    auth.uid(),
    p_error_type,
    p_error_code,
    p_error_message,
    p_error_stack,
    p_context,
    p_severity,
    p_url,
    p_user_agent,
    'new'
  ) RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$function$;

--
-- Name: workflow_test; Type: TABLE; Schema: public; Owner: -
-- This is a test table to demonstrate the database CI/CD workflow
--

CREATE TABLE IF NOT EXISTS public.workflow_test (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    created_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.workflow_test ENABLE ROW LEVEL SECURITY;

-- Add RLS policy
CREATE POLICY "Users can manage own test data" ON public.workflow_test
    FOR ALL USING (auth.uid() = created_by);

-- Add index for performance
CREATE INDEX idx_workflow_test_created_by ON public.workflow_test(created_by);
