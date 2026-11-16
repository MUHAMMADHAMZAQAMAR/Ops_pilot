'use server';

import { revalidatePath } from 'next/cache';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createAdminClient } from '@/lib/supabase/admin';
import type { RmaClaimRecord } from '../services/returns.service';

export interface CreateRmaClaimInput {
  orderRef: string;
  customerName: string;
  customerEmail: string;
  sku: string;
  itemName: string;
  reason: string;
  claimType: RmaClaimRecord['claim_type'];
  refundAmount: number;
}

export async function createRmaClaim(
  input: CreateRmaClaimInput,
): Promise<{
  success: boolean;
  error?: string;
  claim?: RmaClaimRecord;
  previewOnly?: boolean;
}> {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { success: false, error: 'Unauthorized: Please sign in as an operator.' };
  }

  const orderRef = input.orderRef.trim().toUpperCase();
  const sku = input.sku.trim().toUpperCase();
  const customerName = input.customerName.trim();
  const customerEmail = input.customerEmail.trim();
  const itemName = input.itemName.trim();
  const reason = input.reason.trim();
  const refundAmount = Math.max(0, Number(input.refundAmount) || 0);

  if (!orderRef || !customerName || !sku || !itemName || !reason) {
    return { success: false, error: 'All RMA claim fields are required.' };
  }

  const rmaNumber = `RMA-${new Date().getFullYear()}-${Math.floor(400 + Math.random() * 599)}`;
  const now = new Date().toISOString();

  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase.from('rma_claims' as any) as any)
      .insert({
        rma_number: rmaNumber,
        order_ref: orderRef,
        customer_name: customerName,
        customer_email: customerEmail || 'customer@opspilot.example',
        sku,
        item_name: itemName,
        reason,
        claim_type: input.claimType,
        refund_amount: refundAmount,
        status: 'pending_review',
        notes: `Logged by ${operator.email}.`,
      })
      .select(
        'id, rma_number, order_ref, customer_name, customer_email, sku, item_name, reason, claim_type, refund_amount, status, notes, created_at, resolved_at',
      )
      .single();

    if (error || !data) {
      return {
        success: true,
        previewOnly: true,
        claim: {
          id: `rma-local-${Date.now()}`,
          rma_number: rmaNumber,
          order_ref: orderRef,
          customer_name: customerName,
          customer_email: customerEmail || 'customer@opspilot.example',
          sku,
          item_name: itemName,
          reason,
          claim_type: input.claimType,
          refund_amount: refundAmount,
          status: 'pending_review',
          notes: `Logged by ${operator.email}.`,
          created_at: now,
          resolved_at: null,
        },
      };
    }

    revalidatePath('/returns');
    return {
      success: true,
      claim: {
        id: String(data.id),
        rma_number: String(data.rma_number),
        order_ref: String(data.order_ref),
        customer_name: String(data.customer_name),
        customer_email: String(data.customer_email),
        sku: String(data.sku),
        item_name: String(data.item_name),
        reason: String(data.reason),
        claim_type: data.claim_type,
        refund_amount: Number(data.refund_amount),
        status: data.status,
        notes: data.notes ? String(data.notes) : null,
        created_at: String(data.created_at),
        resolved_at: data.resolved_at ? String(data.resolved_at) : null,
      },
    };
  } catch {
    return {
      success: true,
      previewOnly: true,
      claim: {
        id: `rma-local-${Date.now()}`,
        rma_number: rmaNumber,
        order_ref: orderRef,
        customer_name: customerName,
        customer_email: customerEmail || 'customer@opspilot.example',
        sku,
        item_name: itemName,
        reason,
        claim_type: input.claimType,
        refund_amount: refundAmount,
        status: 'pending_review',
        notes: `Logged by ${operator.email}.`,
        created_at: now,
        resolved_at: null,
      },
    };
  }
}

export async function updateRmaStatus(
  claimId: string,
  nextStatus: 'approved' | 'refunded' | 'rejected',
): Promise<{ success: boolean; error?: string; previewOnly?: boolean }> {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { success: false, error: 'Unauthorized: Please sign in as an operator.' };
  }

  const isTerminal = nextStatus === 'refunded' || nextStatus === 'rejected';

  try {
    const supabase = createAdminClient();
    const { error } = await (supabase.from('rma_claims' as any) as any)
      .update({
        status: nextStatus,
        resolved_at: isTerminal ? new Date().toISOString() : null,
        notes: `Updated to ${nextStatus} by ${operator.email}.`,
      })
      .eq('id', claimId);

    if (error) {
      return { success: true, previewOnly: true };
    }

    revalidatePath('/returns');
    return { success: true };
  } catch {
    return { success: true, previewOnly: true };
  }
}
