-- Module 18: Supplier & Vendor Replenishment Hub
-- Creates public.suppliers and public.purchase_orders with RLS and seeded automotive vendors.

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  contact_email text not null,
  lead_time_days integer not null default 5,
  reliability_score numeric(4,1) not null default 98.0,
  status text not null default 'active' check (status in ('active', 'review', 'paused')),
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  po_number text not null unique,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  sku text not null,
  item_name text not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(10,2) not null check (unit_cost >= 0),
  total_cost numeric(12,2) generated always as (quantity * unit_cost) stored,
  status text not null default 'ordered' check (status in ('draft', 'ordered', 'in_transit', 'received', 'cancelled')),
  expected_delivery_at timestamptz not null default (now() + interval '5 days'),
  received_at timestamptz,
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;

create policy "Authenticated users can read suppliers"
  on public.suppliers for select
  to authenticated
  using (true);

create policy "Authenticated users can manage suppliers"
  on public.suppliers for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read purchase_orders"
  on public.purchase_orders for select
  to authenticated
  using (true);

create policy "Authenticated users can manage purchase_orders"
  on public.purchase_orders for all
  to authenticated
  using (true)
  with check (true);

insert into public.suppliers (id, name, category, contact_email, lead_time_days, reliability_score, status)
values
  ('11111111-1111-4111-8111-111111111101', 'Brembo Wholesale Direct', 'Braking Systems', 'replenish@brembo-wholesale.example', 4, 99.2, 'active'),
  ('11111111-1111-4111-8111-111111111102', 'Michelin Motorsport Supply', 'Performance Tires', 'orders@michelin-supply.example', 6, 97.8, 'active'),
  ('11111111-1111-4111-8111-111111111103', 'Bosch Aftermarket Logistics', 'Electronics & Ignition', 'b2b@bosch-logistics.example', 3, 98.5, 'active'),
  ('11111111-1111-4111-8111-111111111104', 'Motul Performance Fluids', 'Lubricants & Fluids', 'dispatch@motul-fluids.example', 5, 95.4, 'review')
on conflict (id) do nothing;

insert into public.purchase_orders (po_number, supplier_id, sku, item_name, quantity, unit_cost, status, expected_delivery_at)
values
  ('PO-2026-041', '11111111-1111-4111-8111-111111111101', 'BRM-6P-CAL', 'Brembo GT 6-Piston Front Caliper Kit', 12, 1180.00, 'in_transit', now() + interval '2 days'),
  ('PO-2026-042', '11111111-1111-4111-8111-111111111102', 'MCH-PS4S-245', 'Michelin Pilot Sport 4S 245/35ZR19', 24, 245.00, 'ordered', now() + interval '5 days'),
  ('PO-2026-043', '11111111-1111-4111-8111-111111111103', 'BSH-IGN-COIL', 'Bosch Motorsport High-Output Ignition Coil Pack', 40, 62.50, 'received', now() - interval '1 day')
on conflict (po_number) do nothing;
