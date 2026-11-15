'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ComplianceAuditRecord,
  ComplianceReportSummary,
} from '../services/reports.service';
import {
  formatRecordsToCSV,
  formatRecordsToJSON,
  triggerBrowserDownload,
} from '../utils/export-formatters';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Search,
  Bot,
  ShieldCheck,
  Mail,
  Clock,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface ComplianceReportsViewProps {
  data: ComplianceReportSummary;
}

export function ComplianceReportsView({ data }: ComplianceReportsViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'agent_run' | 'approval_gate' | 'customer_draft'
  >('all');

  const filteredRecords = useMemo(() => {
    return data.records.filter((rec) => {
      if (categoryFilter !== 'all' && rec.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          rec.title.toLowerCase().includes(q) ||
          rec.status.toLowerCase().includes(q) ||
          rec.actor.toLowerCase().includes(q) ||
          rec.details.toLowerCase().includes(q) ||
          rec.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data.records, categoryFilter, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: data.records.length,
      agent_run: data.records.filter((r) => r.category === 'agent_run').length,
      approval_gate: data.records.filter((r) => r.category === 'approval_gate').length,
      customer_draft: data.records.filter((r) => r.category === 'customer_draft').length,
    };
  }, [data.records]);

  const handleExportCSV = () => {
    const csv = formatRecordsToCSV(filteredRecords);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerBrowserDownload(csv, `opspilot-compliance-audit-${stamp}.csv`, 'text/csv;charset=utf-8;');
    pushToast({
      title: 'CSV Audit Report Exported',
      message: `Downloaded ${filteredRecords.length} compliance records.`,
      tone: 'emerald',
    });
  };

  const handleExportJSON = () => {
    const json = formatRecordsToJSON(filteredRecords, data.metrics);
    const stamp = new Date().toISOString().slice(0, 10);
    triggerBrowserDownload(json, `opspilot-compliance-audit-${stamp}.json`, 'application/json');
    pushToast({
      title: 'JSON Audit Report Exported',
      message: `Downloaded ${filteredRecords.length} structured audit entries.`,
      tone: 'cyan',
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Audit Events</span>
            <Activity className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="mt-3 text-2xl font-black text-white">{data.metrics.totalEvents}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Immutable ledger entries</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Completed Runs</span>
            <Bot className="w-4 h-4 text-[#c8f135]" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#c8f135]">
            {data.metrics.completedRuns}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Verified agent workflows</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Authorized Gates</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-400">
            {data.metrics.approvedGates}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {data.metrics.rejectedGates} rejected by operator
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Avg Runtime</span>
            <Clock className="w-4 h-4 text-amber-300" />
          </div>
          <div className="mt-3 text-2xl font-black text-amber-300">
            {data.metrics.avgDurationSeconds}s
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {data.metrics.dispatchedDrafts} customer notices sent
          </p>
        </GlassCard>
      </div>

      {/* Toolbar: Search, Category Filters & Export Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter audit trail by ID, actor, status..."
              className="w-full pl-10 pr-4 py-2 rounded-full glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/30"
            />
          </div>

          <div className="flex items-center gap-1 p-1 rounded-full glass-panel-inset text-xs overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium ${
                categoryFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({counts.all})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('agent_run')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium ${
                categoryFilter === 'agent_run'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Runs ({counts.agent_run})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('approval_gate')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium ${
                categoryFilter === 'approval_gate'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-amber-300'
              }`}
            >
              Approvals ({counts.approval_gate})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('customer_draft')}
              className={`px-3 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium ${
                categoryFilter === 'customer_draft'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Drafts ({counts.customer_draft})
            </button>
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <GlassButton
            variant="primary"
            onClick={handleExportJSON}
            disabled={filteredRecords.length === 0}
          >
            <FileJson className="w-3.5 h-3.5 text-[#22d3ee]" />
            <span>Export JSON</span>
          </GlassButton>

          <GlassButton
            variant="lime"
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export CSV</span>
            <Download className="w-3.5 h-3.5" />
          </GlassButton>
        </div>
      </div>

      {/* Audit Ledger List */}
      <GlassCard className="p-0 overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit entries match the current filter.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.08]">
            {filteredRecords.map((rec) => {
              const CategoryIcon =
                rec.category === 'agent_run'
                  ? Bot
                  : rec.category === 'approval_gate'
                  ? ShieldCheck
                  : Mail;

              const statusVariant =
                rec.status === 'completed' ||
                rec.status === 'approved' ||
                rec.status === 'executed'
                  ? 'emerald'
                  : rec.status === 'waiting_approval' ||
                    rec.status === 'pending' ||
                    rec.status === 'draft'
                  ? 'amber'
                  : rec.status === 'failed' ||
                    rec.status === 'rejected' ||
                    rec.status === 'cancelled'
                  ? 'rose'
                  : 'cyan';

              return (
                <div
                  key={`${rec.category}-${rec.id}`}
                  className="p-4 sm:p-5 hover:bg-white/[0.03] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-xl bg-white/[0.06] border border-white/15 flex items-center justify-center shrink-0 text-slate-200 mt-0.5">
                      <CategoryIcon className="w-4 h-4 text-[#22d3ee]" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <GlassBadge variant={statusVariant}>{rec.status}</GlassBadge>
                        <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
                          {rec.actor}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(rec.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {rec.title}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {rec.details}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 justify-end">
                    {rec.durationSeconds !== null && (
                      <span className="text-[11px] font-mono text-slate-400">
                        {rec.durationSeconds}s
                      </span>
                    )}
                    {rec.runId && (
                      <Link
                        href={`/runs/${rec.runId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#c8f135] hover:underline"
                      >
                        <span>Trace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
