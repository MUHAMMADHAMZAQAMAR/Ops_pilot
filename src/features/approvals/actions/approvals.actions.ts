'use server';

import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function resolveApproval(approvalId: string, decision: 'approved' | 'rejected') {
  if (!approvalId) {
    return { error: 'Invalid approval identifier.' };
  }

  // 1. Fast 0ms local JWT verification (already authenticated at login)
  const user = await getVerifiedOperator();

  if (!user) {
    return { error: 'Authentication required to authorize sensitive actions.' };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // 2. Fetch current approval details
  const { data: approval, error: fetchErr } = await adminClient
    .from('action_approvals')
    .select('id, run_id, action_type, payload, status')
    .eq('id', approvalId)
    .single();

  if (fetchErr || !approval) {
    return { error: 'Approval record not found.' };
  }

  if (approval.status !== 'pending') {
    return { error: `This proposal has already been resolved as ${approval.status}.` };
  }

  // 3. Update action_approvals
  const { error: updateErr } = await (adminClient.from('action_approvals') as any)
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: now,
      executed_at: decision === 'approved' ? now : null,
    })
    .eq('id', approvalId);

  if (updateErr) {
    console.error('Error updating approval:', updateErr.message);
    return { error: 'Failed to record decision.' };
  }

  // 4. Propagate state change to agent_runs and agent_steps
  if (approval.run_id) {
    if (decision === 'approved') {
      // Mark parent run as completed
      await (adminClient.from('agent_runs') as any)
        .update({
          status: 'completed',
          completed_at: now,
          result: {
            authorizedAction: approval.action_type,
            status: 'executed',
            executedAt: now,
          },
        })
        .eq('id', approval.run_id);

      // Mark Step 4 (Human Approval Gate) as completed
      await (adminClient.from('agent_steps') as any)
        .update({
          status: 'completed',
          completed_at: now,
          output: {
            approvalDecision: 'approved',
            authorizedBy: user.email,
            timestamp: now,
          },
        })
        .eq('run_id', approval.run_id)
        .eq('sequence_no', 4);

      // Execute domain side-effects (e.g. replenish stock for inventory restock orders, or approve message draft)
      const payload = approval.payload as Record<string, unknown>;
      if (approval.action_type === 'order_inventory_restock' && payload?.product_sku) {
        // Query product id
        const { data: product } = await adminClient
          .from('products')
          .select('id')
          .eq('sku', String(payload.product_sku))
          .single();

        if (product) {
          const qty = Number(payload.quantity) || 10;
          const { data: inv } = await adminClient
            .from('inventory')
            .select('id, stock_quantity')
            .eq('product_id', product.id)
            .single();

          if (inv) {
            await (adminClient.from('inventory') as any)
              .update({
                stock_quantity: inv.stock_quantity + qty,
                updated_at: now,
              })
              .eq('id', inv.id);
          }
        }
      } else if (approval.action_type === 'send_customer_email' && payload?.draft_id) {
        await (adminClient.from('message_drafts') as any)
          .update({ status: 'approved' })
          .eq('id', String(payload.draft_id));
      }
    } else {
      // Operator rejected proposed automated action
      const payload = approval.payload as Record<string, unknown>;
      if (approval.action_type === 'send_customer_email' && payload?.draft_id) {
        await (adminClient.from('message_drafts') as any)
          .update({ status: 'rejected' })
          .eq('id', String(payload.draft_id));
      }

      await (adminClient.from('agent_runs') as any)
        .update({
          status: 'cancelled',
          completed_at: now,
          error_message: 'Operator rejected the proposed autonomous execution.',
        })
        .eq('id', approval.run_id);

      await (adminClient.from('agent_steps') as any)
        .update({
          status: 'failed',
          completed_at: now,
          error_message: 'Action proposal rejected by human operator.',
        })
        .eq('run_id', approval.run_id)
        .eq('sequence_no', 4);
    }
  }

  // 5. Revalidate cache on affected views
  revalidatePath('/approvals');
  revalidatePath('/requests');
  revalidatePath('/runs');
  revalidatePath('/inventory');
  revalidatePath('/dashboard');

  return { success: true, decision };
}

