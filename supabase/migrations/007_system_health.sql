-- Module 20: Autonomous System Health & Incident Response Hub
-- Creates public.system_incidents and public.system_controls with RLS and seeded telemetry.

create table if not exists public.system_incidents (
  id uuid primary key default gen_random_uuid(),
  incident_code text not null unique,
  title text not null,
  component text not null,
  severity text not null default 'p3' check (severity in ('p1', 'p2', 'p3')),
  status text not null default 'open' check (status in ('open', 'mitigating', 'resolved')),
  notes text,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.system_controls (
  id uuid primary key default gen_random_uuid(),
  control_key text not null unique,
  enabled boolean not null default false,
  updated_by text,
  updated_at timestamptz not null default now()
);

alter table public.system_incidents enable row level security;
alter table public.system_controls enable row level security;

create policy "Authenticated users can read system_incidents"
  on public.system_incidents for select
  to authenticated
  using (true);

create policy "Authenticated users can manage system_incidents"
  on public.system_incidents for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read system_controls"
  on public.system_controls for select
  to authenticated
  using (true);

create policy "Authenticated users can manage system_controls"
  on public.system_controls for all
  to authenticated
  using (true)
  with check (true);

insert into public.system_controls (control_key, enabled, updated_by)
values ('autonomous_safe_mode', false, 'system@opspilot.com')
on conflict (control_key) do nothing;

insert into public.system_incidents (incident_code, title, component, severity, status, notes, detected_at, resolved_at)
values
  ('INC-2026-019', 'Elevated Gemini Planner p95 latency spike', 'Google Gemini Neural Planner', 'p2', 'open', 'Auto-routed 3 complex order splits to deterministic fallback planner.', now() - interval '18 minutes', null),
  ('INC-2026-018', 'QuickBooks ERP webhook retry burst', 'Webhook Ingestion Gateway', 'p3', 'mitigating', 'Exponential backoff active; 2/2 batches queued cleanly.', now() - interval '45 minutes', null),
  ('INC-2026-017', 'Brembo supplier API transient 502', 'Supplier Replenishment Hub', 'p2', 'resolved', 'Resolved automatically after 1 retry; PO-2026-041 confirmed.', now() - interval '4 hours', now() - interval '3 hours 40 minutes')
on conflict (incident_code) do nothing;
