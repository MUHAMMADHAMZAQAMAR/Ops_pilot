import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { Order, Customer } from '@/types/database';

export interface OrderWithCustomer extends Order {
  customer: Customer | null;
}

// React cache() guarantees this network query runs at most ONCE per page request
export const getOrders = cache(async (): Promise<OrderWithCustomer[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      customer_id,
      status,
      total_cents,
      created_at,
      updated_at,
      customer:customers(id, name, email, phone)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error.message);
    return [];
  }

  return (data as unknown as OrderWithCustomer[]) || [];
});

// Compute metrics in-memory from orders without making ANY extra database queries
export function calculateOrderMetrics(orders: OrderWithCustomer[]) {
  const totalOrders = orders.length;
  let pendingOrders = 0;
  let processingOrders = 0;
  let fulfilledOrders = 0;
  let cancelledOrders = 0;
  let totalRevenueCents = 0;

  for (let i = 0; i < orders.length; i++) {
    const o = orders[i];
    if (o.status === 'pending') pendingOrders++;
    else if (o.status === 'processing') processingOrders++;
    else if (o.status === 'fulfilled') fulfilledOrders++;
    else if (o.status === 'cancelled') cancelledOrders++;

    if (o.status !== 'cancelled') {
      totalRevenueCents += o.total_cents;
    }
  }

  return {
    totalOrders,
    pendingOrders,
    processingOrders,
    fulfilledOrders,
    cancelledOrders,
    totalRevenueCents,
    totalRevenueFormatted: (totalRevenueCents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    }),
  };
}
