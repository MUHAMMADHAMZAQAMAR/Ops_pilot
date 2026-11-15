'use server';

import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

export async function updateDraftContent(draftId: string, content: string) {
  if (!draftId || !content.trim()) {
    return { error: 'Draft content cannot be empty.' };
  }

  const user = await getVerifiedOperator();

  if (!user) {
    return { error: 'Authentication required.' };
  }

  const adminClient = createAdminClient();
  const { error } = await (adminClient.from('message_drafts') as any)
    .update({ content: content.trim() })
    .eq('id', draftId);

  if (error) {
    console.error('Error updating draft content:', error.message);
    return { error: 'Failed to update draft.' };
  }

  revalidatePath('/drafts');
  revalidatePath('/approvals');
  revalidatePath('/runs');
  return { success: true };
}

export async function approveAndSendDraft(draftId: string) {
  if (!draftId) {
    return { error: 'Invalid draft identifier.' };
  }

  const user = await getVerifiedOperator();

  if (!user) {
    return { error: 'Authentication required.' };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // 1. Update message draft status to approved
  const { data: updatedDraft, error: draftErr } = await (adminClient.from('message_drafts') as any)
    .update({ status: 'approved' })
    .eq('id', draftId)
    .select('id, run_id')
    .single();

  if (draftErr) {
    console.error('Error approving draft:', draftErr.message);
    return { error: 'Failed to approve draft.' };
  }

  // 2. Check if linked action_approval exists
  const { data: approvals } = await adminClient
    .from('action_approvals')
    .select('id, run_id, payload, status')
    .eq('action_type', 'send_customer_email');

  const matchingApproval = approvals?.find((a: any) => a.payload?.draft_id === draftId);

  if (matchingApproval && matchingApproval.status === 'pending') {
    await (adminClient.from('action_approvals') as any)
      .update({
        status: 'approved',
        reviewed_by: user.id,
        reviewed_at: now,
        executed_at: now,
      })
      .eq('id', matchingApproval.id);

    if (matchingApproval.run_id) {
      await (adminClient.from('agent_runs') as any)
        .update({
          status: 'completed',
          completed_at: now,
          result: {
            messageDispatched: true,
            recipientApproval: matchingApproval.id,
            executedAt: now,
          },
        })
        .eq('id', matchingApproval.run_id);

      await (adminClient.from('agent_steps') as any)
        .update({
          status: 'completed',
          completed_at: now,
          output: {
            action: 'send_customer_email',
            authorizedBy: user.email,
            status: 'transmitted',
          },
        })
        .eq('run_id', matchingApproval.run_id)
        .eq('sequence_no', 4);
    }
  }

  revalidatePath('/drafts');
  revalidatePath('/approvals');
  revalidatePath('/runs');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function rejectDraft(draftId: string) {
  if (!draftId) {
    return { error: 'Invalid draft identifier.' };
  }

  const user = await getVerifiedOperator();

  if (!user) {
    return { error: 'Authentication required.' };
  }

  const adminClient = createAdminClient();
  const now = new Date().toISOString();

  // 1. Update message draft status to rejected
  const { error: draftErr } = await (adminClient.from('message_drafts') as any)
    .update({ status: 'rejected' })
    .eq('id', draftId);

  if (draftErr) {
    console.error('Error rejecting draft:', draftErr.message);
    return { error: 'Failed to reject draft.' };
  }

  // 2. Reject matching action_approvals
  const { data: approvals } = await adminClient
    .from('action_approvals')
    .select('id, run_id, payload, status')
    .eq('action_type', 'send_customer_email');

  const matchingApproval = approvals?.find((a: any) => a.payload?.draft_id === draftId);

  if (matchingApproval && matchingApproval.status === 'pending') {
    await (adminClient.from('action_approvals') as any)
      .update({
        status: 'rejected',
        reviewed_by: user.id,
        reviewed_at: now,
      })
      .eq('id', matchingApproval.id);

    if (matchingApproval.run_id) {
      await (adminClient.from('agent_runs') as any)
        .update({
          status: 'cancelled',
          completed_at: now,
          error_message: 'Customer message draft rejected by operator.',
        })
        .eq('id', matchingApproval.run_id);

      await (adminClient.from('agent_steps') as any)
        .update({
          status: 'failed',
          completed_at: now,
          error_message: 'Draft rejected by human operator.',
        })
        .eq('run_id', matchingApproval.run_id)
        .eq('sequence_no', 4);
    }
  }

  revalidatePath('/drafts');
  revalidatePath('/approvals');
  revalidatePath('/runs');
  revalidatePath('/dashboard');
  return { success: true };
}

