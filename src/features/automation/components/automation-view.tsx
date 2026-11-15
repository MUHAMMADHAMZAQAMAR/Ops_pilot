'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { AutomationSchedule, AutomationSummary } from '../services/automation.service';
import {
  createSchedule,
  toggleScheduleStatus,
  triggerScheduleNow,
} from '../actions/automation.actions';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import {
  CalendarClock,
  Play,
  Pause,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Zap,
} from 'lucide-react';

interface AutomationViewProps {
  summary: AutomationSummary;
}

const CADENCE_PRESETS = [
  { label: 'Every Hour', cron: '0 * * * *' },
  { label: 'Every 4 hours', cron: '0 */4 * * *' },
  { label: 'Daily at 08:00 AM', cron: '0 8 * * *' },
  { label: 'Mondays at 09:00 AM', cron: '0 9 * * 1' },
];

export function AutomationView({ summary }: AutomationViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(CADENCE_PRESETS[2]);
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData();
    fd.append('name', name);
    fd.append('prompt', prompt);
    fd.append('cron_expression', selectedPreset.cron);
    fd.append('schedule_label', selectedPreset.label);
    fd.append('priority', priority);

    startTransition(async () => {
      const res = await createSchedule(fd);
      if (res?.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        setName('');
        setPrompt('');
        setShowCreateForm(false);
        pushToast({
          title: 'Recurring Routine Saved',
          message: `${name} scheduled (${selectedPreset.label}).`,
          tone: 'emerald',
        });
      }
    });
  };

  const handleToggle = (sched: AutomationSchedule) => {
    setActiveId(sched.id);
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleScheduleStatus(sched.id, !sched.is_active);
      setActiveId(null);
      if (res?.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        pushToast({
          title: !sched.is_active ? 'Schedule Activated' : 'Schedule Paused',
          message: sched.name,
          tone: !sched.is_active ? 'emerald' : 'amber',
        });
      }
    });
  };

  const handleRunNow = (sched: AutomationSchedule) => {
    setActiveId(sched.id);
    setFeedback(null);
    startTransition(async () => {
      const res = await triggerScheduleNow(sched.id, sched.prompt, sched.priority);
      setActiveId(null);
      if (res?.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else if (res?.runId) {
        setLastRunId(res.runId);
        pushToast({
          title: 'Scheduled Routine Triggered',
          message: `${sched.name} dispatched to autonomous agent.`,
          tone: 'cyan',
          href: `/runs/${res.runId}`,
          hrefLabel: 'Inspect Run',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Total Routines</span>
            <CalendarClock className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {summary.metrics.totalSchedules}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Configured cron directives</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Active Schedules</span>
            <Zap className="w-4 h-4 text-[#c8f135]" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#c8f135]">
            {summary.metrics.activeSchedules}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Running autonomously</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Paused</span>
            <Pause className="w-4 h-4 text-amber-300" />
          </div>
          <div className="mt-3 text-2xl font-black text-amber-300">
            {summary.metrics.pausedSchedules}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting reactivation</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Total Triggers</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-400">
            {summary.metrics.totalExecutions}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Completed routine runs</p>
        </GlassCard>
      </div>

      {/* Migration Notice Banner if table not yet created in Supabase */}
      {!summary.tableReady && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Preview Mode Active:</span> Run{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300">
              supabase/migrations/002_automation_schedules.sql
            </code>{' '}
            in your Supabase SQL Editor to persist custom schedules. You can already test{' '}
            <strong>Run Now</strong> below against live agent runs.
          </div>
        </div>
      )}

      {/* Feedback / Latest Dispatched Run Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            feedback.type === 'error'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-200'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {lastRunId && (
        <div className="p-3.5 rounded-2xl bg-[#c8f135]/10 border border-[#c8f135]/30 text-xs text-[#c8f135] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Scheduled routine dispatched to live agent execution pipeline.</span>
          </div>
          <Link
            href={`/runs/${lastRunId}`}
            className="inline-flex items-center gap-1 font-bold underline shrink-0"
          >
            <span>Inspect Run</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Action Bar + New Schedule Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-tight">
          Configured Autonomous Routines
        </h2>
        <GlassButton
          variant={showCreateForm ? 'secondary' : 'lime'}
          onClick={() => setShowCreateForm((prev) => !prev)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showCreateForm ? 'Hide Form' : 'New Schedule'}</span>
        </GlassButton>
      </div>

      {/* Create Schedule Form */}
      {showCreateForm && (
        <GlassCard className="p-6 animate-fade-in-up">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Routine Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Evening Low-Stock Audit"
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['normal', 'urgent', 'critical'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`flex-1 py-2 rounded-2xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        priority === p
                          ? 'bg-white/20 text-white border-white/35'
                          : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Cadence Preset
              </label>
              <div className="flex flex-wrap gap-2">
                {CADENCE_PRESETS.map((preset) => (
                  <button
                    key={preset.cron}
                    type="button"
                    onClick={() => setSelectedPreset(preset)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer flex items-center gap-1.5 ${
                      selectedPreset.cron === preset.cron
                        ? 'bg-[#22d3ee]/20 text-[#22d3ee] border-[#22d3ee]/40'
                        : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08]'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                Agent Directive Prompt
              </label>
              <textarea
                rows={3}
                required
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what the AI agent should inspect and propose on this schedule..."
                className="w-full p-3.5 rounded-2xl glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>

            <div className="flex justify-end">
              <GlassButton type="submit" variant="lime" disabled={isPending}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isPending ? 'Saving...' : 'Save Recurring Schedule'}</span>
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Schedules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {summary.schedules.map((sched) => {
          const isBusy = isPending && activeId === sched.id;

          return (
            <GlassCard key={sched.id} className="p-5 flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GlassBadge
                      variant={sched.is_active ? 'lime' : 'glass'}
                      pulseDot={sched.is_active}
                    >
                      {sched.is_active ? 'Active' : 'Paused'}
                    </GlassBadge>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10 text-[#22d3ee]">
                      {sched.cron_expression}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-400 font-medium">
                    {sched.schedule_label}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white tracking-tight">{sched.name}</h3>

                <p className="text-xs text-slate-300 leading-relaxed p-3 rounded-2xl glass-panel-inset">
                  {sched.prompt}
                </p>
              </div>

              <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400">
                  Runs: <strong className="text-white">{sched.run_count}</strong>
                  {sched.last_run_at && (
                    <span className="ml-2">
                      • Last: {new Date(sched.last_run_at).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <GlassButton
                    variant="secondary"
                    onClick={() => handleToggle(sched)}
                    disabled={isBusy}
                  >
                    {sched.is_active ? (
                      <>
                        <Pause className="w-3.5 h-3.5" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Activate</span>
                      </>
                    )}
                  </GlassButton>

                  <GlassButton
                    variant="lime"
                    onClick={() => handleRunNow(sched)}
                    disabled={isBusy}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isBusy ? 'Running...' : 'Run Now'}</span>
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
