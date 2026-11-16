'use client';

import { useState, useTransition } from 'react';
import {
  Webhook,
  Activity,
  CheckCircle2,
  Clock,
  Send,
  Zap,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge, type BadgeVariant } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import {
  toggleIntegrationStatus,
  sendTestWebhookPing,
} from '../actions/integrations.actions';
import type {
  IntegrationsSummary,
  IntegrationRecord,
  WebhookEventRecord,
} from '../services/integrations.service';

interface IntegrationsViewProps {
  initialData: IntegrationsSummary;
}

const STATUS_BADGE: Record<
  IntegrationRecord['status'],
  { label: string; variant: BadgeVariant }
> = {
  active: { label: 'Live Active', variant: 'emerald' },
  testing: { label: 'Sandbox / Test', variant: 'amber' },
  paused: { label: 'Paused', variant: 'glass' },
};

export function IntegrationsView({ initialData }: IntegrationsViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>(initialData.integrations);
  const [events, setEvents] = useState<WebhookEventRecord[]>(initialData.events);
  const [activePings, setActivePings] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  const activeCount = integrations.filter((i) => i.status === 'active').length;

  const handleToggleStatus = (integration: IntegrationRecord) => {
    const nextStatus: IntegrationRecord['status'] =
      integration.status === 'active' ? 'paused' : 'active';

    startTransition(async () => {
      const res = await toggleIntegrationStatus(integration.id, nextStatus);
      if (!res.success) {
        pushToast({
          title: 'Update Failed',
          message: res.error ?? 'Could not update integration status.',
          tone: 'rose',
        });
        return;
      }

      setIntegrations((prev) =>
        prev.map((item) =>
          item.id === integration.id ? { ...item, status: nextStatus } : item,
        ),
      );

      pushToast({
        title: `${integration.name} Status Changed`,
        message: `Integration transitioned to ${nextStatus.toUpperCase()}.${res.previewOnly ? ' (Preview Mode)' : ''}`,
        tone: nextStatus === 'active' ? 'emerald' : 'amber',
      });
    });
  };

  const handleTestPing = (integration: IntegrationRecord) => {
    setActivePings((prev) => ({ ...prev, [integration.id]: true }));

    startTransition(async () => {
      const res = await sendTestWebhookPing(integration.id, integration.name);
      setActivePings((prev) => ({ ...prev, [integration.id]: false }));

      if (!res.success || !res.event) {
        pushToast({
          title: 'Ping Failed',
          message: res.error ?? 'Test ping timed out.',
          tone: 'rose',
        });
        return;
      }

      setEvents((prev) => [res.event!, ...prev]);
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integration.id
            ? {
                ...i,
                events_count: i.events_count + 1,
                last_synced_at: res.event!.created_at,
              }
            : i,
        ),
      );

      pushToast({
        title: `${integration.name} Ping 200 OK`,
        message: `Echo payload received in ${res.event.latency_ms}ms.${res.previewOnly ? ' (Preview Mode)' : ''}`,
        tone: 'emerald',
      });
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Webhooks & Logistics Integrations Hub
            </h1>
            {!initialData.tableReady && (
              <GlassBadge variant="cyan">Preview Mode</GlassBadge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Monitor real-time carrier webhooks, e-commerce storefront syncs, and payment gateway settlement signals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassBadge variant="emerald" pulseDot>
            Live Ingestion Engine
          </GlassBadge>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Integrations
            </span>
            <Webhook className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">{activeCount}</p>
          <p className="mt-1 text-xs text-slate-500">
            {integrations.length} total external connectors
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              24h Events Ingested
            </span>
            <Activity className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.events24h.toLocaleString()}
          </p>
          <p className="mt-1 text-xs text-slate-500">Across all connected webhooks</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fulfillment SLA
            </span>
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.successRate}%
          </p>
          <p className="mt-1 text-xs text-slate-500">Payload delivery success rate</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Avg Ingestion Latency
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.avgLatencyMs}ms
          </p>
          <p className="mt-1 text-xs text-slate-500">Sub-second webhook gateway</p>
        </GlassCard>
      </div>

      {/* Integration Partner Cards */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Connected Logistics & Payment Rails
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {integrations.map((item) => {
            const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.active;
            const isPinging = Boolean(activePings[item.id]);

            return (
              <GlassCard key={item.id} className="p-5" hoverEffect>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-slate-900">
                        {item.name}
                      </h3>
                      <Radio
                        className={`h-3 w-3 ${
                          item.status === 'active'
                            ? 'text-emerald-500 animate-pulse'
                            : 'text-slate-400'
                        }`}
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-500">
                      {item.category} • {item.provider}
                    </p>
                  </div>
                  <GlassBadge variant={badge.variant}>{badge.label}</GlassBadge>
                </div>

                <div className="mt-3 rounded-lg border border-slate-200/50 bg-slate-50/50 p-2.5 font-mono text-xs text-slate-700 flex items-center justify-between gap-2">
                  <span className="truncate">{item.endpoint_url}</span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-slate-400" />
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-200/60 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500">Lifetime Events: </span>
                    <span className="font-semibold text-slate-800">
                      {item.events_count.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <GlassButton
                      variant="ghost"
                      disabled={isPending || isPinging}
                      onClick={() => handleToggleStatus(item)}
                    >
                      {item.status === 'active' ? 'Pause' : 'Activate'}
                    </GlassButton>

                    <GlassButton
                      variant="secondary"
                      disabled={isPending || isPinging}
                      onClick={() => handleTestPing(item)}
                    >
                      <Send className="h-3.5 w-3.5 text-sky-600" />
                      {isPinging ? 'Pinging...' : 'Test Ping'}
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Webhook Events Stream Ledger */}
      <GlassCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-slate-200/70 px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Live Webhook Ingestion Ledger
            </h2>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Last {events.length} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Event Type</th>
                <th className="px-6 py-3">Integration</th>
                <th className="px-6 py-3">Direction</th>
                <th className="px-6 py-3">Payload Summary</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {events.map((ev) => (
                <tr key={ev.id} className="hover:bg-white/30">
                  <td className="px-6 py-3.5 font-mono text-xs font-semibold text-slate-900">
                    {ev.event_type}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700">
                    {ev.integration_name}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium uppercase tracking-wider ${
                        ev.direction === 'inbound'
                          ? 'bg-sky-50 text-sky-700'
                          : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {ev.direction}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-700 text-xs">
                    {ev.payload_summary}
                  </td>
                  <td className="px-6 py-3.5">
                    <GlassBadge variant={ev.status_code === 200 ? 'emerald' : 'rose'}>
                      {ev.status_code} OK
                    </GlassBadge>
                  </td>
                  <td className="px-6 py-3.5 text-right font-mono text-xs font-semibold text-slate-700">
                    {ev.latency_ms}ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
