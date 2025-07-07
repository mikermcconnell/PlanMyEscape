-- Migration: Create security_logs table for security monitoring
-- Execute with supabase db push

CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  ip TEXT,
  user_agent TEXT,
  details JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS but allow all authenticated inserts
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow insert for all authenticated users" ON public.security_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Index for queries by user and type
CREATE INDEX IF NOT EXISTS security_logs_user_idx ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS security_logs_type_idx ON public.security_logs(type); 