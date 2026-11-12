import { createAdminClient } from '@/lib/supabase/admin';

export interface PendingOrderReport {
  orderId: string;
  orderNumber: string;
  status: string;
  totalFormatted: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  orderDate: string;
}

/**
 * Deterministic tool: queries pending client purchase orders
 */
export async function scanPendingCustomerOrdersTool(): Promise<{
  pendingCount: number;
  totalValueCents: number;
  orders: PendingOrderReport[];
}> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      status,
      total_cents,
      created_at,
      customer:customers(id, name, email, phone)
    `)
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('Error in scanPendingCustomerOrdersTool:', error?.message);
    return { pendingCount: 0, totalValueCents: 0, orders: [] };
  }

  let totalValueCents = 0;
  const orders: PendingOrderReport[] = [];

  for (const row of data) {
    const cust = row.customer as any;
    if (!cust) continue;

    totalValueCents += row.total_cents;
    orders.push({
      orderId: row.id,
      orderNumber: row.order_number,
      status: row.status,
      totalFormatted: (row.total_cents / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      customer: {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
      },
      orderDate: row.created_at,
    });
  }

  return {
    pendingCount: orders.length,
    totalValueCents,
    orders,
  };
}

