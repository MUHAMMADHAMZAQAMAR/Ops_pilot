'use client';

import { useState, useTransition } from 'react';
import {
  Activity,
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Database,
  Server,
  Webhook,
  CheckCircle2,
  Play,
  AlertTriangle,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge, type BadgeVariant } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import {
  toggleAutonomousSafeMode,
  resolveSystemIncident,
  runSystemDiagnostic,
} from '../actions/system.actions';
import type {
  SystemHealthSummary,
  SystemIncidentRecord,
  SubsystemHealth,
} from '../services/system.service';

interface SystemViewProps {
  initialData: SystemHealthSummary;
}

const SUBSYSTEM_ICON: Record<string, React.ElementType> = {
  gemini_planner: Cpu,
  supabase_db: Database,
  agent_pipeline: Server,
  webhook_gateway: Webhook,
};

const SUBSYSTEM_BADGE: Record<
  SubsystemHealth['status'],
  { label: string; variant: BadgeVariant }
> = {
  healthy: { label: 'Healthy', variant: 'emerald' },
  degraded: { label: 'Degraded', variant: 'amber' },
  offline: { label: 'Offline', variant: 'rose' },
};

const SEVERITY_BADGE: Record<
  SystemIncidentRecord['severity'],
  { label: string; variant: BadgeVariant }
> = {
  p1: { label: 'P1 Critical', variant: 'rose' },
  p2: { label: 'P2 Degraded', variant: 'amber' },
  p3: { label: 'P3 Advisory', variant: 'cyan' },
};

const INCIDENT_STATUS_BADGE: Record<
  SystemIncidentRecord['status'],
  { label: string; variant: BadgeVariant }
> = {
  open: { label: 'Open', variant: 'rose' },
  mitigating: { label: 'Mitigating', variant: 'amber' },
  resolved: { label: 'Resolved', variant: 'emerald' },
};

export function SystemView({ initialData }: SystemViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [safeMode, setSafeMode] = useState(initialData.safeModeEnabled);
  const [incidents, setIncidents] = useState<SystemIncidentRecord[]>(initialData.incidents);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const openCount = incidents.filter((i) => i.status !== 'resolved').length;

  const handleToggleSafeMode = () => {
    const nextState = !safeMode;
    startTransition(async () => {
      const res = await toggleAutonomousSafeMode(nextState);
      if (!res.success) {
        pushToast({
          title: 'Circuit Breaker Error',
          message: res.error ?? 'Failed to update safe-mode.',
          tone: 'rose',
        });
        return;
      }

      setSafeMode(nextState);
      pushToast({
        title: nextState ? 'Autonomous Safe-Mode Enabled' : 'Autonomous Pipeline Armed',
        message: nextState
          ? 'All AI executions now pause at Human-in-the-Loop approvals.'
          : 'Normal autonomous execution thresholds restored.',
        tone: nextState ? 'amber' : 'emerald',
      });
    });
  };

  const handleResolveIncident = (incident: SystemIncidentRecord) => {
    startTransition(async () => {
      const res = await resolveSystemIncident(incident.id);
      if (!res.success) {
        pushToast({
          title: 'Action Failed',
          message: res.error ?? 'Could not resolve incident.',
          tone: 'rose',
        });
        return;
      }

      setIncidents((prev) =>
        prev.map((item) =>
          item.id === incident.id
            ? {
                ...item,
                status: 'resolved',
                resolved_at: new Date().toISOString(),
              }
            : item,
        ),
      );

      pushToast({
        title: `${incident.incident_code} Resolved`,
        message: `${incident.component} marked healthy.${res.previewOnly ? ' (Preview Mode)' : ''}`,
        tone: 'emerald',
      });
    });
  };

  const handleRunDiagnostic = (
    key: 'gemini_ping' | 'db_pool' | 'rls_audit',
    label: string,
  ) => {
    startTransition(async () => {
      const res = await runSystemDiagnostic(key);
      if (!res.success) {
        pushToast({
          title: `${label} Failed`,
          message: res.error ?? 'Diagnostic check failed.',
          tone: 'rose',
        });
        return;
      }

      setDiagnosticResult(res.summary);
      pushToast({
        title: `${label} Passed`,
        message: res.summary,
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
              System Health & Incident Response Hub
            </h1>
            {!initialData.tableReady && (
              <GlassBadge variant="cyan">Preview Mode</GlassBadge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Monitor AI planner latency, database pool health, active incidents, and the global autonomous circuit breaker.
          </p>
        </div>

        <GlassButton
          variant={safeMode ? 'amber' : 'danger'}
          disabled={isPending}
          onClick={handleToggleSafeMode}
        >
          {safeMode ? (
            <>
              <ShieldCheck className="h-4 w-4" />
              Restore Autonomous Mode
            </>
          ) : (
            <>
              <ShieldAlert className="h-4 w-4" />
              Engage Safe-Mode
            </>
          )}
        </GlassButton>
      </div>

      {/* Circuit Breaker Banner */}
      <GlassCard className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {safeMode ? (
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            ) : (
              <Activity className="h-5 w-5 text-emerald-600 shrink-0" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Global Circuit Breaker:{' '}
                <span className={safeMode ? 'text-amber-700' : 'text-emerald-700'}>
                  {safeMode ? 'SAFE-MODE ENGAGED' : 'ARMED & NOMINAL'}
                </span>
              </p>
              <p className="text-xs text-slate-600">
                {safeMode
                  ? 'Autonomous actions are paused. All tool calls require manual operator approval.'
                  : 'Autonomous workflows are executing within configured SLA guardrails.'}
              </p>
            </div>
          </div>

          <GlassBadge variant={safeMode ? 'amber' : 'emerald'} pulseDot>
            {safeMode ? 'Safe-Mode' : 'Armed'}
          </GlassBadge>
        </div>
      </GlassCard>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Platform SLA
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.overallSla}
          </p>
          <p className="mt-1 text-xs text-slate-500">Rolling 30-day availability</p>
        </GlassCard>

        <GlassCard className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Open Incidents
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">{openCount}</p>
          <p className="mt-1 text-xs text-slate-500">Active P1-P3 alerts</p>
        </GlassCard>

        <GlassCard className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Gateway p95 Latency
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {initialData.metrics.p95LatencyMs}ms
          </p>
          <p className="mt-1 text-xs text-slate-500">Across API & DB queries</p>
        </GlassCard>

        <GlassCard className="p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Circuit State
          </span>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {safeMode ? 'Safe-Mode' : 'Armed'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Execution guardrail status</p>
        </GlassCard>
      </div>

      {/* Subsystems Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
          Subsystem Telemetry
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {initialData.subsystems.map((sub) => {
            const Icon = SUBSYSTEM_ICON[sub.key] ?? Server;
            const badge = SUBSYSTEM_BADGE[sub.status];
            return (
              <GlassCard key={sub.key} className="p-5" hoverEffect>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Icon className="h-5 w-5 text-sky-600" />
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        {sub.name}
                      </h3>
                      <p className="text-xs text-slate-500">{sub.detail}</p>
                    </div>
                  </div>
                  <GlassBadge variant={badge.variant}>{badge.label}</GlassBadge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-200/60 pt-3 text-xs">
                  <div>
                    <span className="text-slate-500">Latency</span>
                    <p className="font-mono font-semibold text-slate-900">
                      {sub.latencyMs}ms
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Uptime</span>
                    <p className="font-semibold text-emerald-700">{sub.uptimePct}</p>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {/* Self-Healing Diagnostics */}
      <GlassCard className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Self-Healing Diagnostics
            </h2>
            <p className="text-xs text-slate-600">
              Run instant health probes against Gemini, Supabase PostgreSQL, and JWKS RLS policies.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GlassButton
              variant="secondary"
              disabled={isPending}
              onClick={() => handleRunDiagnostic('gemini_ping', 'AI Planner Ping')}
            >
              <Play className="h-3.5 w-3.5 text-sky-600" />
              Test AI Ping
            </GlassButton>
            <GlassButton
              variant="secondary"
              disabled={isPending}
              onClick={() => handleRunDiagnostic('db_pool', 'DB Pool Probe')}
            >
              <Play className="h-3.5 w-3.5 text-emerald-600" />
              Verify DB Pool
            </GlassButton>
            <GlassButton
              variant="secondary"
              disabled={isPending}
              onClick={() => handleRunDiagnostic('rls_audit', 'RLS Integrity Check')}
            >
              <Play className="h-3.5 w-3.5 text-indigo-600" />
              Audit RLS
            </GlassButton>
          </div>
        </div>
        {diagnosticResult && (
          <div className="mt-3 rounded-xl border border-emerald-300/60 bg-emerald-50/60 px-3.5 py-2 text-xs font-medium text-emerald-900">
            {diagnosticResult}
          </div>
        )}
      </GlassCard>

      {/* Incident Ledger */}
      <GlassCard className="overflow-hidden p-0">
        <div className="border-b border-slate-200/70 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">
            Incident Response Ledger
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200/70 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Incident</th>
                <th className="px-6 py-3">Component</th>
                <th className="px-6 py-3">Severity</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60">
              {incidents.map((inc) => {
                const sev = SEVERITY_BADGE[inc.severity];
                const stat = INCIDENT_STATUS_BADGE[inc.status];
                return (
                  <tr key={inc.id} className="hover:bg-white/30">
                    <td className="px-6 py-3.5">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {inc.incident_code}
                      </div>
                      <div className="text-sm font-medium text-slate-800">
                        {inc.title}
                      </div>
                      {inc.notes && (
                        <div className="text-xs text-slate-500">{inc.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-xs font-medium text-slate-700">
                      {inc.component}
                    </td>
                    <td className="px-6 py-3.5">
                      <GlassBadge variant={sev.variant}>{sev.label}</GlassBadge>
                    </td>
                    <td className="px-6 py-3.5">
                      <GlassBadge variant={stat.variant}>{stat.label}</GlassBadge>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {inc.status !== 'resolved' ? (
                        <GlassButton
                          variant="secondary"
                          disabled={isPending}
                          onClick={() => handleResolveIncident(inc)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          Resolve
                        </GlassButton>
                      ) : (
                        <span className="text-xs text-slate-400">Mitigated</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
