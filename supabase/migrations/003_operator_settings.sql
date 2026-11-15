-- Module 15: Operator Control Settings & Guardrail Configuration
CREATE TABLE IF NOT EXISTS public.operator_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  auto_approve_threshold_cents INTEGER NOT NULL DEFAULT 50000,
  ai_model TEXT NOT NULL DEFAULT 'gemini-3.8-flash',
  ai_fallback_enabled BOOLEAN NOT NULL DEFAULT true,
  notify_approvals BOOLEAN NOT NULL DEFAULT true,
  notify_runs BOOLEAN NOT NULL DEFAULT true,
  notify_drafts BOOLEAN NOT NULL DEFAULT true,
  ambient_theme TEXT NOT NULL DEFAULT 'deep-space-crystal',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can read own settings"
  ON public.operator_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Operators can upsert own settings"
  ON public.operator_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
