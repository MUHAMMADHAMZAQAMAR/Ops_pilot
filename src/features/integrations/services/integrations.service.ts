import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export interface IntegrationRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  provider: string;
  endpoint_url: string;
  status: 'active' | 'testing' | 'paused';
  events_count: number;
  last_synced_at: string | null;
  created_at: string;
}

export interface WebhookEventRecord {
  id: string;
  integration_id: string;
  integration_name: string;
  event_type: string;
  direction: 'inbound' | 'outbound';
  status_code: number;
  latency_ms: number;
  payload_summary: string;
  created_at: string;
}

export interface IntegrationsSummary {
  tableReady: boolean;
  integrations: IntegrationRecord[];
  events: WebhookEventRecord[];
  metrics: {
    totalIntegrations: number;
    activeChannels: number;
    events24h: number;
    successRate: number;
    avgLatencyMs: number;
  };
}

const DEFAULT_INTEGRATIONS: IntegrationRecord[] = [
  {
    id: '22222222-2222-4222-8222-222222222201',
    name: 'FedEx Express Freight',
    slug: 'fedex-logistics',
    category: 'Carrier Dispatch',
    provider: 'FedEx Developer API',
    endpoint_url: 'https://api.opspilot.com/v1/webhooks/fedex-tracking',
    status: 'active',
    events_count: 1420,
    last_synced_at: new Date(Date.now() - 8 * 60000).toISOString(),
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222202',
    name: 'Shopify Automotive Storefront',
    slug: 'shopify-store',
    category: 'E-Commerce Channel',
    provider: 'Shopify Admin Webhooks',
    endpoint_url: 'https://api.opspilot.com/v1/webhooks/shopify-orders',
    status: 'active',
    events_count: 4850,
    last_synced_at: new Date(Date.now() - 2 * 60000).toISOString(),
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222203',
    name: 'Stripe Enterprise Payments',
    slug: 'stripe-payments',
    category: 'Billing & Settlement',
    provider: 'Stripe Connect Webhooks',
    endpoint_url: 'https://api.opspilot.com/v1/webhooks/stripe-settlement',
    status: 'active',
    events_count: 3190,
    last_synced_at: new Date(Date.now() - 14 * 60000).toISOString(),
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: '22222222-2222-4222-8222-222222222204',
    name: 'QuickBooks ERP Sync',
    slug: 'quickbooks-erp',
    category: 'Financial Accounting',
    provider: 'Intuit Webhooks v3',
    endpoint_url: 'https://api.opspilot.com/v1/webhooks/quickbooks-ledger',
    status: 'testing',
    events_count: 280,
    last_synced_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
];

const DEFAULT_EVENTS: WebhookEventRecord[] = [
  {
    id: 'ev-1',
    integration_id: '22222222-2222-4222-8222-222222222202',
    integration_name: 'Shopify Automotive Storefront',
    event_type: 'orders/create',
    direction: 'inbound',
    status_code: 200,
    latency_ms: 38,
    payload_summary: 'Order #ORD-9842 verified & staged for allocation',
    created_at: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: 'ev-2',
    integration_id: '22222222-2222-4222-8222-222222222201',
    integration_name: 'FedEx Express Freight',
    event_type: 'tracking/delivery_updated',
    direction: 'inbound',
    status_code: 200,
    latency_ms: 52,
    payload_summary: 'Brembo brake kit shipment arrived at Bay Area hub',
    created_at: new Date(Date.now() - 8 * 60000).toISOString(),
  },
  {
    id: 'ev-3',
    integration_id: '22222222-2222-4222-8222-222222222203',
    integration_name: 'Stripe Enterprise Payments',
    event_type: 'payment_intent.succeeded',
    direction: 'inbound',
    status_code: 200,
    latency_ms: 41,
    payload_summary: 'Processed $2,450.00 settlement for Michelin PS4S tires',
    created_at: new Date(Date.now() - 14 * 60000).toISOString(),
  },
  {
    id: 'ev-4',
    integration_id: '22222222-2222-4222-8222-222222222204',
    integration_name: 'QuickBooks ERP Sync',
    event_type: 'invoice/sync',
    direction: 'outbound',
    status_code: 200,
    latency_ms: 114,
    payload_summary: 'Dispatched automated ledger reconciliation batch',
    created_at: new Date(Date.now() - 42 * 60000).toISOString(),
  },
];

function computeMetrics(
  integrations: IntegrationRecord[],
  events: WebhookEventRecord[],
) {
  const totalIntegrations = integrations.length;
  const activeChannels = integrations.filter((i) => i.status === 'active').length;
  const events24h = integrations.reduce((sum, i) => sum + (Number(i.events_count) || 0), 0);
  const successEvents = events.filter((e) => e.status_code >= 200 && e.status_code < 300).length;
  const successRate = events.length > 0 ? Number(((successEvents / events.length) * 100).toFixed(1)) : 100.0;
  const avgLatencyMs =
    events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + (Number(e.latency_ms) || 0), 0) / events.length)
      : 45;

  return {
    totalIntegrations,
    activeChannels,
    events24h,
    successRate,
    avgLatencyMs,
  };
}

export const getIntegrationsSummary = cache(async (): Promise<IntegrationsSummary> => {
  try {
    const supabase = createAdminClient();

    const [
      { data: intRows, error: intError },
      { data: evRows, error: evError },
    ] = await Promise.all([
      (supabase.from('integrations' as any) as any)
        .select('id, name, slug, category, provider, endpoint_url, status, events_count, last_synced_at, created_at')
        .order('name', { ascending: true }),
      (supabase.from('webhook_events' as any) as any)
        .select('id, integration_id, event_type, direction, status_code, latency_ms, payload_summary, created_at')
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    if (intError || evError) {
      return {
        tableReady: false,
        integrations: DEFAULT_INTEGRATIONS,
        events: DEFAULT_EVENTS,
        metrics: computeMetrics(DEFAULT_INTEGRATIONS, DEFAULT_EVENTS),
      };
    }

    const integrations: IntegrationRecord[] = (intRows ?? []).map((row: any) => ({
      id: String(row.id),
      name: String(row.name),
      slug: String(row.slug),
      category: String(row.category),
      provider: String(row.provider),
      endpoint_url: String(row.endpoint_url),
      status: row.status ?? 'active',
      events_count: Number(row.events_count ?? 0),
      last_synced_at: row.last_synced_at ? String(row.last_synced_at) : null,
      created_at: String(row.created_at),
    }));

    const integrationMap = new Map(integrations.map((i) => [i.id, i.name]));

    const events: WebhookEventRecord[] = (evRows ?? []).map((row: any) => ({
      id: String(row.id),
      integration_id: String(row.integration_id),
      integration_name: integrationMap.get(String(row.integration_id)) ?? 'External Channel',
      event_type: String(row.event_type),
      direction: row.direction ?? 'inbound',
      status_code: Number(row.status_code ?? 200),
      latency_ms: Number(row.latency_ms ?? 45),
      payload_summary: String(row.payload_summary),
      created_at: String(row.created_at),
    }));

    return {
      tableReady: true,
      integrations,
      events,
      metrics: computeMetrics(integrations, events),
    };
  } catch {
    return {
      tableReady: false,
      integrations: DEFAULT_INTEGRATIONS,
      events: DEFAULT_EVENTS,
      metrics: computeMetrics(DEFAULT_INTEGRATIONS, DEFAULT_EVENTS),
    };
  }
});
