-- Module 19: Webhooks & External Logistics Integrations Hub
-- Creates public.integrations and public.webhook_events with RLS and seeded connectors.

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  provider text not null,
  endpoint_url text not null,
  status text not null default 'active' check (status in ('active', 'testing', 'paused')),
  events_count integer not null default 0,
  last_synced_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references public.integrations(id) on delete cascade,
  event_type text not null,
  direction text not null default 'inbound' check (direction in ('inbound', 'outbound')),
  status_code integer not null default 200,
  latency_ms integer not null default 45,
  payload_summary text not null,
  created_at timestamptz not null default now()
);

alter table public.integrations enable row level security;
alter table public.webhook_events enable row level security;

create policy "Authenticated users can read integrations"
  on public.integrations for select
  to authenticated
  using (true);

create policy "Authenticated users can manage integrations"
  on public.integrations for all
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can read webhook_events"
  on public.webhook_events for select
  to authenticated
  using (true);

create policy "Authenticated users can manage webhook_events"
  on public.webhook_events for all
  to authenticated
  using (true)
  with check (true);

insert into public.integrations (id, name, slug, category, provider, endpoint_url, status, events_count, last_synced_at)
values
  ('22222222-2222-4222-8222-222222222201', 'FedEx Express Freight', 'fedex-logistics', 'Carrier Dispatch', 'FedEx Developer API', 'https://api.opspilot.com/v1/webhooks/fedex-tracking', 'active', 1420, now() - interval '8 minutes'),
  ('22222222-2222-4222-8222-222222222202', 'Shopify Automotive Storefront', 'shopify-store', 'E-Commerce Channel', 'Shopify Admin Webhooks', 'https://api.opspilot.com/v1/webhooks/shopify-orders', 'active', 4850, now() - interval '2 minutes'),
  ('22222222-2222-4222-8222-222222222203', 'Stripe Enterprise Payments', 'stripe-payments', 'Billing & Settlement', 'Stripe Connect Webhooks', 'https://api.opspilot.com/v1/webhooks/stripe-settlement', 'active', 3190, now() - interval '14 minutes'),
  ('22222222-2222-4222-8222-222222222204', 'QuickBooks ERP Sync', 'quickbooks-erp', 'Financial Accounting', 'Intuit Webhooks v3', 'https://api.opspilot.com/v1/webhooks/quickbooks-ledger', 'testing', 280, now() - interval '3 hours')
on conflict (id) do nothing;

insert into public.webhook_events (integration_id, event_type, direction, status_code, latency_ms, payload_summary, created_at)
values
  ('22222222-2222-4222-8222-222222222202', 'orders/create', 'inbound', 200, 38, 'Order #ORD-9842 verified & staged for allocation', now() - interval '2 minutes'),
  ('22222222-2222-4222-8222-222222222201', 'tracking/delivery_updated', 'inbound', 200, 52, 'Brembo brake kit shipment arrived at Bay Area hub', now() - interval '8 minutes'),
  ('22222222-2222-4222-8222-222222222203', 'payment_intent.succeeded', 'inbound', 200, 41, 'Processed $2,450.00 settlement for Michelin PS4S tires', now() - interval '14 minutes'),
  ('22222222-2222-4222-8222-222222222204', 'invoice/sync', 'outbound', 200, 114, 'Dispatched automated ledger reconciliation batch', now() - interval '42 minutes')
on conflict do nothing;
