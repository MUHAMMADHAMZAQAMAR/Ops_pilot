import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export interface RmaClaimRecord {
  id: string;
  rma_number: string;
  order_ref: string;
  customer_name: string;
  customer_email: string;
  sku: string;
  item_name: string;
  reason: string;
  claim_type: 'warranty' | 'defective' | 'core_return' | 'fitment_mismatch';
  refund_amount: number;
  status: 'pending_review' | 'inspecting' | 'approved' | 'refunded' | 'rejected';
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ReturnsSummary {
  tableReady: boolean;
  claims: RmaClaimRecord[];
  metrics: {
    openClaims: number;
    warrantyClaims: number;
    pendingRefundValue: number;
    avgResolutionHours: number;
  };
}

const DEFAULT_CLAIMS: RmaClaimRecord[] = [
  {
    id: 'rma-preview-1',
    rma_number: 'RMA-2026-304',
    order_ref: 'ORD-9842',
    customer_name: 'Apex Track Motorsport',
    customer_email: 'parts@apextrack.example',
    sku: 'BRM-6P-CAL',
    item_name: 'Brembo GT 6-Piston Front Caliper Kit',
    reason: 'Piston dust boot seal weeping after 2 track sessions',
    claim_type: 'warranty',
    refund_amount: 1180,
    status: 'pending_review',
    notes: 'Photos verified; awaiting operator warranty authorization.',
    created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    resolved_at: null,
  },
  {
    id: 'rma-preview-2',
    rma_number: 'RMA-2026-303',
    order_ref: 'ORD-9819',
    customer_name: 'Marcus Vance',
    customer_email: 'mvance@garage.example',
    sku: 'MCH-PS4S-245',
    item_name: 'Michelin Pilot Sport 4S 245/35ZR19',
    reason: 'Ordered wrong sidewall profile for staggered rear fitment',
    claim_type: 'fitment_mismatch',
    refund_amount: 490,
    status: 'inspecting',
    notes: 'Tires received at Bay Area warehouse; tread depth 100% unused.',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    resolved_at: null,
  },
  {
    id: 'rma-preview-3',
    rma_number: 'RMA-2026-302',
    order_ref: 'ORD-9794',
    customer_name: 'Pacific Coast Tuning',
    customer_email: 'service@pctuning.example',
    sku: 'BSH-IGN-COIL',
    item_name: 'Bosch Motorsport High-Output Ignition Coil Pack',
    reason: '1 of 4 coils misfiring under 22psi boost',
    claim_type: 'defective',
    refund_amount: 62.5,
    status: 'approved',
    notes: 'Replacement unit staged for dispatch.',
    created_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    resolved_at: null,
  },
  {
    id: 'rma-preview-4',
    rma_number: 'RMA-2026-301',
    order_ref: 'ORD-9760',
    customer_name: 'Elena Rostova',
    customer_email: 'elena@trackday.example',
    sku: 'BRM-6P-CAL',
    item_name: 'Brembo GT 6-Piston Front Caliper Kit',
    reason: 'Core deposit return for remanufactured caliper housing',
    claim_type: 'core_return',
    refund_amount: 250,
    status: 'refunded',
    notes: 'Core inspection passed and $250.00 refunded to original card.',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

function computeMetrics(claims: RmaClaimRecord[]) {
  const openClaims = claims.filter(
    (c) => c.status !== 'refunded' && c.status !== 'rejected',
  ).length;
  const warrantyClaims = claims.filter(
    (c) => c.claim_type === 'warranty' || c.claim_type === 'core_return',
  ).length;
  const pendingRefundValue = claims
    .filter((c) => c.status !== 'refunded' && c.status !== 'rejected')
    .reduce((sum, c) => sum + Number(c.refund_amount || 0), 0);

  return {
    openClaims,
    warrantyClaims,
    pendingRefundValue,
    avgResolutionHours: 14.2,
  };
}

export const getReturnsSummary = cache(async (): Promise<ReturnsSummary> => {
  try {
    const supabase = createAdminClient();
    const { data, error } = await (supabase.from('rma_claims' as any) as any)
      .select(
        'id, rma_number, order_ref, customer_name, customer_email, sku, item_name, reason, claim_type, refund_amount, status, notes, created_at, resolved_at',
      )
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return {
        tableReady: false,
        claims: DEFAULT_CLAIMS,
        metrics: computeMetrics(DEFAULT_CLAIMS),
      };
    }

    const claims: RmaClaimRecord[] = (data ?? []).map((row: any) => ({
      id: String(row.id),
      rma_number: String(row.rma_number),
      order_ref: String(row.order_ref),
      customer_name: String(row.customer_name),
      customer_email: String(row.customer_email),
      sku: String(row.sku),
      item_name: String(row.item_name),
      reason: String(row.reason),
      claim_type: row.claim_type ?? 'warranty',
      refund_amount: Number(row.refund_amount ?? 0),
      status: row.status ?? 'pending_review',
      notes: row.notes ? String(row.notes) : null,
      created_at: String(row.created_at),
      resolved_at: row.resolved_at ? String(row.resolved_at) : null,
    }));

    return {
      tableReady: true,
      claims,
      metrics: computeMetrics(claims),
    };
  } catch {
    return {
      tableReady: false,
      claims: DEFAULT_CLAIMS,
      metrics: computeMetrics(DEFAULT_CLAIMS),
    };
  }
});
