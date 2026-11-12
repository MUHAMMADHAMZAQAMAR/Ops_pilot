import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import { MessageDraft, Customer, Order, AgentRun } from '@/types/database';

export interface MessageDraftWithRelations extends MessageDraft {
  customer: Customer | null;
  order: Order | null;
  run: AgentRun | null;
}

export interface DraftMetrics {
  totalDrafts: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  deliveryRate: number;
}

export const getMessageDrafts = cache(async (): Promise<MessageDraftWithRelations[]> => {
  const supabase = createAdminClient();

  const { data: rawDrafts, error } = await supabase
    .from('message_drafts')
    .select(`
      id,
      run_id,
      customer_id,
      order_id,
      content,
      status,
      created_at,
      customer:customers(id, name, email, phone, created_at),
      order:orders(id, order_number, total_cents, status, created_at, updated_at),
      run:agent_runs(id, task, status, created_at)
    `)
    .order('created_at', { ascending: false });

  if (error || !rawDrafts) {
    console.error('Error fetching message drafts:', error?.message);
    return [];
  }

  return rawDrafts.map((d: any) => ({
    id: d.id,
    run_id: d.run_id,
    customer_id: d.customer_id,
    order_id: d.order_id,
    content: d.content,
    status: d.status,
    created_at: d.created_at,
    customer: d.customer as Customer | null,
    order: d.order as Order | null,
    run: d.run as AgentRun | null,
  }));
});

export function calculateDraftMetrics(drafts: MessageDraftWithRelations[]): DraftMetrics {
  let pendingReview = 0;
  let approved = 0;
  let rejected = 0;

  for (const d of drafts) {
    if (d.status === 'draft') pendingReview++;
    else if (d.status === 'approved') approved++;
    else if (d.status === 'rejected') rejected++;
  }

  const resolved = approved + rejected;
  const deliveryRate = resolved > 0 ? Math.round((approved / resolved) * 100) : 100;

  return {
    totalDrafts: drafts.length,
    pendingReview,
    approved,
    rejected,
    deliveryRate,
  };
}

