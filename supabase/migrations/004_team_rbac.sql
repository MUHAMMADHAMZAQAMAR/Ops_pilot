-- Module 17: Multi-Operator Team Management & Role-Based Access Control (RBAC)
CREATE TABLE IF NOT EXISTS public.operator_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator', 'auditor')),
  department TEXT NOT NULL DEFAULT 'Operations',
  approval_limit_cents INTEGER NOT NULL DEFAULT 50000,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.operator_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated operators can read team directory"
  ON public.operator_roles
  FOR SELECT
  TO authenticated
  USING (true);

INSERT INTO public.operator_roles (email, full_name, role, department, approval_limit_cents, is_active)
VALUES
  ('operator@opspilot.com', 'Alex Henderson', 'admin', 'Executive Operations', 1000000, true),
  ('sarah.jenkins@opspilot.com', 'Sarah Jenkins', 'operator', 'Inventory & Supply', 50000, true),
  ('marcus.vance@opspilot.com', 'Marcus Vance', 'auditor', 'Compliance & Risk', 0, true)
ON CONFLICT (email) DO NOTHING;
