-- OpsPilot — Phase 1 Initial Schema Migration
-- Enables pgcrypto extension for UUID generation
create extension if not exists pgcrypto;

-- Enums
create type public.order_status as enum (
  'pending', 'processing', 'fulfilled', 'cancelled'
);

create type public.payment_status as enum (
  'pending', 'paid', 'failed', 'refunded'
);

create type public.agent_run_status as enum (
  'queued', 'running', 'waiting_approval',
  'completed', 'failed', 'cancelled'
);

create type public.agent_step_status as enum (
  'pending', 'running', 'completed', 'failed'
);

create type public.approval_status as enum (
  'pending', 'approved', 'rejected', 'executed'
);

create type public.draft_status as enum (
  'draft', 'approved', 'rejected'
);

-- Core Business Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default 'Operator',
  created_at timestamptz not null default now()
);

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  brand text not null,
  category text not null,
  price_cents integer not null check (price_cents >= 0),
  created_at timestamptz not null default now()
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null unique
    references public.products(id) on delete cascade,
  stock_quantity integer not null default 0
    check (stock_quantity >= 0),
  reorder_level integer not null default 10
    check (reorder_level >= 0),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers(id),
  status public.order_status not null default 'pending',
  total_cents integer not null check (total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null
    references public.orders(id) on delete cascade,
  status public.payment_status not null default 'pending',
  amount_cents integer not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);

-- Agent Reserve Tables (for future phases)
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id),
  task text not null,
  status public.agent_run_status not null default 'queued',
  result jsonb,
  error_message text,
  thread_id text not null unique,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.agent_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null
    references public.agent_runs(id) on delete cascade,
  sequence_no integer not null,
  step_name text not null,
  tool_name text,
  input jsonb,
  output jsonb,
  status public.agent_step_status not null default 'pending',
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  unique (run_id, sequence_no)
);

create table public.action_approvals (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null
    references public.agent_runs(id) on delete cascade,
  action_type text not null,
  payload jsonb not null,
  status public.approval_status not null default 'pending',
  requested_by uuid not null references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.message_drafts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null
    references public.agent_runs(id) on delete cascade,
  customer_id uuid not null references public.customers(id),
  order_id uuid references public.orders(id),
  content text not null,
  status public.draft_status not null default 'draft',
  created_at timestamptz not null default now()
);

-- Indexes for performance
create index idx_orders_customer
  on public.orders(customer_id);

create index idx_orders_status_created
  on public.orders(status, created_at);

create index idx_order_items_order
  on public.order_items(order_id);

create index idx_payments_order
  on public.payments(order_id);

create index idx_inventory_stock
  on public.inventory(stock_quantity);

create index idx_agent_runs_user_created
  on public.agent_runs(user_id, created_at desc);

create index idx_agent_steps_run_sequence
  on public.agent_steps(run_id, sequence_no);

create index idx_approvals_run
  on public.action_approvals(run_id);

create index idx_drafts_customer
  on public.message_drafts(customer_id);

-- Automatic Profile Creation Trigger on Auth Sign-Up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', 'Operator')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_steps enable row level security;
alter table public.action_approvals enable row level security;
alter table public.message_drafts enable row level security;

-- Policies for Authenticated Operators
create policy "Users read own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "Authenticated users read customers"
on public.customers for select
to authenticated using (true);

create policy "Authenticated users read products"
on public.products for select
to authenticated using (true);

create policy "Authenticated users read inventory"
on public.inventory for select
to authenticated using (true);

create policy "Authenticated users read orders"
on public.orders for select
to authenticated using (true);

create policy "Authenticated users read order items"
on public.order_items for select
to authenticated using (true);

create policy "Authenticated users read payments"
on public.payments for select
to authenticated using (true);

