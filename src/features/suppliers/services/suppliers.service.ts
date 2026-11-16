import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export interface SupplierRecord {
  id: string;
  name: string;
  category: string;
  contact_email: string;
  lead_time_days: number;
  reliability_score: number;
  status: 'active' | 'review' | 'paused';
}

export interface PurchaseOrderRecord {
  id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  sku: string;
  item_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  status: 'draft' | 'ordered' | 'in_transit' | 'received' | 'cancelled';
  expected_delivery_at: string;
  received_at: string | null;
  created_at: string;
}

export interface SuppliersSummary {
  tableReady: boolean;
  suppliers: SupplierRecord[];
  purchaseOrders: PurchaseOrderRecord[];
  metrics: {
    totalSuppliers: number;
    activeVendors: number;
    openPurchaseOrders: number;
    avgLeadTimeDays: number;
  };
}

const DEFAULT_SUPPLIERS: SupplierRecord[] = [
  {
    id: '11111111-1111-4111-8111-111111111101',
    name: 'Brembo Wholesale Direct',
    category: 'Braking Systems',
    contact_email: 'replenish@brembo-wholesale.example',
    lead_time_days: 4,
    reliability_score: 99.2,
    status: 'active',
  },
  {
    id: '11111111-1111-4111-8111-111111111102',
    name: 'Michelin Motorsport Supply',
    category: 'Performance Tires',
    contact_email: 'orders@michelin-supply.example',
    lead_time_days: 6,
    reliability_score: 97.8,
    status: 'active',
  },
  {
    id: '11111111-1111-4111-8111-111111111103',
    name: 'Bosch Aftermarket Logistics',
    category: 'Electronics & Ignition',
    contact_email: 'b2b@bosch-logistics.example',
    lead_time_days: 3,
    reliability_score: 98.5,
    status: 'active',
  },
  {
    id: '11111111-1111-4111-8111-111111111104',
    name: 'Motul Performance Fluids',
    category: 'Lubricants & Fluids',
    contact_email: 'dispatch@motul-fluids.example',
    lead_time_days: 5,
    reliability_score: 95.4,
    status: 'review',
  },
];

const DEFAULT_PURCHASE_ORDERS: PurchaseOrderRecord[] = [
  {
    id: 'po-preview-1',
    po_number: 'PO-2026-041',
    supplier_id: '11111111-1111-4111-8111-111111111101',
    supplier_name: 'Brembo Wholesale Direct',
    sku: 'BRM-6P-CAL',
    item_name: 'Brembo GT 6-Piston Front Caliper Kit',
    quantity: 12,
    unit_cost: 1180,
    total_cost: 14160,
    status: 'in_transit',
    expected_delivery_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    received_at: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'po-preview-2',
    po_number: 'PO-2026-042',
    supplier_id: '11111111-1111-4111-8111-111111111102',
    supplier_name: 'Michelin Motorsport Supply',
    sku: 'MCH-PS4S-245',
    item_name: 'Michelin Pilot Sport 4S 245/35ZR19',
    quantity: 24,
    unit_cost: 245,
    total_cost: 5880,
    status: 'ordered',
    expected_delivery_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    received_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'po-preview-3',
    po_number: 'PO-2026-043',
    supplier_id: '11111111-1111-4111-8111-111111111103',
    supplier_name: 'Bosch Aftermarket Logistics',
    sku: 'BSH-IGN-COIL',
    item_name: 'Bosch Motorsport High-Output Ignition Coil Pack',
    quantity: 40,
    unit_cost: 62.5,
    total_cost: 2500,
    status: 'received',
    expected_delivery_at: new Date(Date.now() - 86400000).toISOString(),
    received_at: new Date(Date.now() - 12 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
];

function computeMetrics(
  suppliers: SupplierRecord[],
  purchaseOrders: PurchaseOrderRecord[],
) {
  const totalSuppliers = suppliers.length;
  const activeVendors = suppliers.filter((s) => s.status === 'active').length;
  const openPurchaseOrders = purchaseOrders.filter(
    (po) => po.status === 'draft' || po.status === 'ordered' || po.status === 'in_transit',
  ).length;
  const avgLeadTimeDays =
    totalSuppliers > 0
      ? Number(
          (
            suppliers.reduce((sum, s) => sum + Number(s.lead_time_days || 0), 0) /
            totalSuppliers
          ).toFixed(1),
        )
      : 0;

  return {
    totalSuppliers,
    activeVendors,
    openPurchaseOrders,
    avgLeadTimeDays,
  };
}

export const getSuppliersSummary = cache(async (): Promise<SuppliersSummary> => {
  try {
    const supabase = createAdminClient();

    const [{ data: supplierRows, error: supplierError }, { data: poRows, error: poError }] =
      await Promise.all([
        (supabase.from('suppliers' as any) as any)
          .select('id, name, category, contact_email, lead_time_days, reliability_score, status')
          .order('name', { ascending: true }),
        (supabase.from('purchase_orders' as any) as any)
          .select(
            'id, po_number, supplier_id, sku, item_name, quantity, unit_cost, total_cost, status, expected_delivery_at, received_at, created_at',
          )
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

    if (supplierError || poError) {
      return {
        tableReady: false,
        suppliers: DEFAULT_SUPPLIERS,
        purchaseOrders: DEFAULT_PURCHASE_ORDERS,
        metrics: computeMetrics(DEFAULT_SUPPLIERS, DEFAULT_PURCHASE_ORDERS),
      };
    }

    const suppliers: SupplierRecord[] = (supplierRows ?? []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      category: String(row.category),
      contact_email: String(row.contact_email),
      lead_time_days: Number(row.lead_time_days ?? 5),
      reliability_score: Number(row.reliability_score ?? 98),
      status: row.status ?? 'active',
    }));

    const supplierMap = new Map(suppliers.map((s) => [s.id, s.name]));

    const purchaseOrders: PurchaseOrderRecord[] = (poRows ?? []).map((row: any) => {
      const quantity = Number(row.quantity ?? 0);
      const unitCost = Number(row.unit_cost ?? 0);
      return {
        id: String(row.id),
        po_number: String(row.po_number),
        supplier_id: String(row.supplier_id),
        supplier_name: supplierMap.get(String(row.supplier_id)) ?? 'Assigned Vendor',
        sku: String(row.sku),
        item_name: String(row.item_name),
        quantity,
        unit_cost: unitCost,
        total_cost: Number(row.total_cost ?? quantity * unitCost),
        status: row.status ?? 'ordered',
        expected_delivery_at: String(row.expected_delivery_at),
        received_at: row.received_at ? String(row.received_at) : null,
        created_at: String(row.created_at),
      };
    });

    return {
      tableReady: true,
      suppliers,
      purchaseOrders,
      metrics: computeMetrics(suppliers, purchaseOrders),
    };
  } catch {
    return {
      tableReady: false,
      suppliers: DEFAULT_SUPPLIERS,
      purchaseOrders: DEFAULT_PURCHASE_ORDERS,
      metrics: computeMetrics(DEFAULT_SUPPLIERS, DEFAULT_PURCHASE_ORDERS),
    };
  }
});
