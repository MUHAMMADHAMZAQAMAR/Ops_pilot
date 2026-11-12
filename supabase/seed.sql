-- OpsPilot — Phase 1 Fictional Seed Data
-- Fictional Customers
insert into public.customers (name, email, phone) values
('James Wilson', 'james@example.test', '+15550000001'),
('Robert Miller', 'robert@example.test', '+15550000002'),
('Michael Davis', 'michael@example.test', '+15550000003'),
('David Anderson', 'david@example.test', '+15550000004'),
('Chris Taylor', 'chris@example.test', '+15550000005');

-- Product Catalog (Automotive Parts)
insert into public.products
(sku, name, brand, category, price_cents) values
('TIR-MIC-001', 'Michelin Defender LTX', 'Michelin', 'Tires', 18999),
('TIR-BFG-002', 'BFGoodrich KO2', 'BFGoodrich', 'Tires', 21999),
('WHL-VOS-001', 'Vossen HF-5 Wheel', 'Vossen', 'Wheels', 39900),
('SUS-RC-001', 'Rough Country Lift Kit', 'Rough Country', 'Suspension', 54900),
('TIR-CON-001', 'Continental TerrainContact', 'Continental', 'Tires', 17999);

-- Inventory Levels & Reorder Thresholds
insert into public.inventory (product_id, stock_quantity, reorder_level)
select id,
  case sku
    when 'TIR-MIC-001' then 3
    when 'TIR-BFG-002' then 25
    when 'WHL-VOS-001' then 0
    when 'SUS-RC-001' then 5
    else 18
  end,
  10
from public.products;

-- Orders Across Multiple Lifecycle States
insert into public.orders
(order_number, customer_id, status, total_cents, created_at)
select
  'OP-' || lpad(n::text, 5, '0'),
  c.id,
  case n
    when 1 then 'pending'::public.order_status
    when 2 then 'pending'::public.order_status
    when 3 then 'processing'::public.order_status
    when 4 then 'fulfilled'::public.order_status
    else 'cancelled'::public.order_status
  end,
  case n
    when 1 then 75996
    when 2 then 39900
    when 3 then 54900
    when 4 then 18999
    else 21999
  end,
  case
    when n = 1 then now() - interval '6 days'
    when n = 2 then now() - interval '4 days'
    when n = 3 then now() - interval '2 days'
    else now() - interval '1 day'
  end
from generate_series(1, 5) as n
join public.customers c
  on c.email = case n
    when 1 then 'james@example.test'
    when 2 then 'robert@example.test'
    when 3 then 'michael@example.test'
    when 4 then 'david@example.test'
    else 'chris@example.test'
  end;

-- Order Payments
insert into public.payments (order_id, status, amount_cents)
select
  id,
  case order_number
    when 'OP-00001' then 'paid'::public.payment_status
    when 'OP-00002' then 'pending'::public.payment_status
    when 'OP-00003' then 'paid'::public.payment_status
    when 'OP-00004' then 'paid'::public.payment_status
    else 'refunded'::public.payment_status
  end,
  total_cents
from public.orders
where order_number like 'OP-%';

