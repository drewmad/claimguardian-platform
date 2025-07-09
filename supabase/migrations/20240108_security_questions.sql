-- Create security questions table
CREATE TABLE IF NOT EXISTS public.security_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user security answers table
CREATE TABLE IF NOT EXISTS public.user_security_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.security_questions(id),
  answer_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, question_id)
);

-- Insert default security questions
INSERT INTO public.security_questions (question) VALUES
  ('What was the name of your first pet?'),
  ('In what city were you born?'),
  ('What is your mother''s maiden name?'),
  ('What was the name of your elementary school?'),
  ('What was the make of your first car?'),
  ('What is your favorite book?'),
  ('What was your childhood nickname?'),
  ('In what city did you meet your spouse/significant other?'),
  ('What is the name of your favorite childhood friend?'),
  ('What street did you live on in third grade?');

-- Create RLS policies
ALTER TABLE public.security_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_answers ENABLE ROW LEVEL SECURITY;

-- Security questions are readable by everyone
CREATE POLICY "Security questions are viewable by everyone" ON public.security_questions
  FOR SELECT USING (true);

-- Users can only manage their own security answers
CREATE POLICY "Users can view own security answers" ON public.user_security_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own security answers" ON public.user_security_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own security answers" ON public.user_security_answers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own security answers" ON public.user_security_answers
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_security_answers_user_id ON public.user_security_answers(user_id);
CREATE INDEX idx_user_security_answers_question_id ON public.user_security_answers(question_id);