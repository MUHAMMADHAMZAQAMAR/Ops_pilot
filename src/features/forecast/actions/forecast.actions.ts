'use server';

import { revalidatePath } from 'next/cache';
import { getVerifiedOperator } from '@/lib/supabase/auth-fast';
import { createPurchaseOrder } from '@/features/suppliers/actions/suppliers.actions';

export interface AutoDraftPOInput {
  supplierId: string;
  supplierName: string;
  sku: string;
  itemName: string;
  quantity: number;
  unitCost: number;
  leadTimeDays: number;
}

export async function autoDraftRestockPO(input: AutoDraftPOInput) {
  const operator = await getVerifiedOperator();
  if (!operator) {
    return { success: false, error: 'Unauthorized: Please sign in as an operator.' };
  }

  const result = await createPurchaseOrder(input);
  if (result.success) {
    revalidatePath('/forecast');
  }
  return result;
}
