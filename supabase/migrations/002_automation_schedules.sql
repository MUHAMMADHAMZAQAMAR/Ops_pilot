-- Module 14: Automated Recurring Schedules
CREATE TABLE IF NOT EXISTS public.automation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  prompt TEXT NOT NULL,
  cron_expression TEXT NOT NULL DEFAULT '0 8 * * *',
  schedule_label TEXT NOT NULL DEFAULT 'Daily at 08:00 AM',
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  run_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.automation_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated operators can read schedules"
  ON public.automation_schedules
  FOR SELECT
  TO authenticated
  USING (true);

-- Seed initial recurring automation routines
INSERT INTO public.automation_schedules (name, prompt, cron_expression, schedule_label, priority, is_active, run_count)
VALUES
  (
    'Morning Inventory Depletion Scan',
    'Scan automotive catalog for depleted stock, calculate needed restock units, and prepare supplier replenishment proposal.',
    '0 8 * * *',
    'Daily at 08:00 AM',
    'urgent',
    true,
    4
  ),
  (
    'Pending Order Fulfillment Digest',
    'Query all pending customer orders, match high-value clients, and stage proactive dispatch status emails.',
    '0 */4 * * *',
    'Every 4 hours',
    'normal',
    true,
    12
  ),
  (
    'Weekly Safety-Stock Risk Audit',
    'Evaluate warehouse stock levels against safety reorder thresholds and generate operator risk assessment.',
    '0 9 * * 1',
    'Mondays at 09:00 AM',
    'normal',
    false,
    2
  )
ON CONFLICT DO NOTHING;
