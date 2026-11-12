import { createAdminClient } from '@/lib/supabase/admin';

export interface CreateDraftParams {
  runId: string;
  customerId: string;
  orderId?: string;
  content: string;
}

export interface CreateApprovalParams {
  runId: string;
  actionType: string;
  payload: Record<string, unknown>;
  requestedBy: string;
}

/**
 * Deterministic tool: writes draft customer notification into message_drafts
 */
export async function createMessageDraftTool(params: CreateDraftParams) {
  const supabase = createAdminClient();

  const { data, error } = await (supabase.from('message_drafts') as any)
    .insert({
      run_id: params.runId,
      customer_id: params.customerId,
      order_id: params.orderId || null,
      content: params.content,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating message draft:', error.message);
    throw new Error(`Failed to create message draft: ${error.message}`);
  }

  return { draftId: data.id, success: true };
}

/**
 * Deterministic tool: posts sensitive proposal to action_approvals gate
 */
export async function createApprovalProposalTool(params: CreateApprovalParams) {
  const supabase = createAdminClient();

  const { data, error } = await (supabase.from('action_approvals') as any)
    .insert({
      run_id: params.runId,
      action_type: params.actionType,
      payload: params.payload,
      status: 'pending',
      requested_by: params.requestedBy,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating approval proposal:', error.message);
    throw new Error(`Failed to post approval gate: ${error.message}`);
  }

  return { approvalId: data.id, success: true };
}

