-- Module 22: Returns, RMA & Warranty Claims Hub
-- Creates public.rma_claims with RLS and seeded automotive RMA cases.

create table if not exists public.rma_claims (
  id uuid primary key default gen_random_uuid(),
  rma_number text not null unique,
  order_ref text not null,
  customer_name text not null,
  customer_email text not null,
  sku text not null,
  item_name text not null,
  reason text not null,
  claim_type text not null default 'warranty' check (claim_type in ('warranty', 'defective', 'core_return', 'fitment_mismatch')),
  refund_amount numeric(10,2) not null default 0 check (refund_amount >= 0),
  status text not null default 'pending_review' check (status in ('pending_review', 'inspecting', 'approved', 'refunded', 'rejected')),
  notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.rma_claims enable row level security;

create policy "Authenticated users can read rma_claims"
  on public.rma_claims for select
  to authenticated
  using (true);

create policy "Authenticated users can manage rma_claims"
  on public.rma_claims for all
  to authenticated
  using (true)
  with check (true);

insert into public.rma_claims (rma_number, order_ref, customer_name, customer_email, sku, item_name, reason, claim_type, refund_amount, status, notes, created_at, resolved_at)
values
  ('RMA-2026-304', 'ORD-9842', 'Apex Track Motorsport', 'parts@apextrack.example', 'BRM-6P-CAL', 'Brembo GT 6-Piston Front Caliper Kit', 'Piston dust boot seal weeping after 2 track sessions', 'warranty', 1180.00, 'pending_review', 'Photos verified; awaiting operator warranty authorization.', now() - interval '3 hours', null),
  ('RMA-2026-303', 'ORD-9819', 'Marcus Vance', 'mvance@garage.example', 'MCH-PS4S-245', 'Michelin Pilot Sport 4S 245/35ZR19', 'Ordered wrong sidewall profile for staggered rear fitment', 'fitment_mismatch', 490.00, 'inspecting', 'Tires received at Bay Area warehouse; tread depth 100% unused.', now() - interval '1 day', null),
  ('RMA-2026-302', 'ORD-9794', 'Pacific Coast Tuning', 'service@pctuning.example', 'BSH-IGN-COIL', 'Bosch Motorsport High-Output Ignition Coil Pack', '1 of 4 coils misfiring under 22psi boost', 'defective', 62.50, 'approved', 'Replacement unit staged for dispatch.', now() - interval '2 days', null),
  ('RMA-2026-301', 'ORD-9760', 'Elena Rostova', 'elena@trackday.example', 'BRM-6P-CAL', 'Brembo GT 6-Piston Front Caliper Kit', 'Core deposit return for remanufactured caliper housing', 'core_return', 250.00, 'refunded', 'Core inspection passed and $250.00 refunded to original card.', now() - interval '5 days', now() - interval '4 days')
on conflict (rma_number) do nothing;
