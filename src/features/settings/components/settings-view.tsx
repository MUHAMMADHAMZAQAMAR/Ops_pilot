'use client';

import React, { useState, useTransition } from 'react';
import { SettingsPageSummary } from '../services/settings.service';
import { saveOperatorSettings } from '../actions/settings.actions';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import {
  ShieldCheck,
  Sparkles,
  Bell,
  Database,
  CheckCircle2,
  AlertTriangle,
  Save,
  KeyRound,
} from 'lucide-react';

interface SettingsViewProps {
  summary: SettingsPageSummary;
}

export function SettingsView({ summary }: SettingsViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [thresholdDollars, setThresholdDollars] = useState(
    Math.round(summary.settings.auto_approve_threshold_cents / 100)
  );
  const [aiModel, setAiModel] = useState(summary.settings.ai_model);
  const [aiFallbackEnabled, setAiFallbackEnabled] = useState(
    summary.settings.ai_fallback_enabled
  );
  const [notifyApprovals, setNotifyApprovals] = useState(summary.settings.notify_approvals);
  const [notifyRuns, setNotifyRuns] = useState(summary.settings.notify_runs);
  const [notifyDrafts, setNotifyDrafts] = useState(summary.settings.notify_drafts);
  const [ambientTheme, setAmbientTheme] = useState(summary.settings.ambient_theme);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const fd = new FormData();
    fd.append('thresholdDollars', String(thresholdDollars));
    fd.append('aiModel', aiModel);
    fd.append('aiFallbackEnabled', String(aiFallbackEnabled));
    fd.append('notifyApprovals', String(notifyApprovals));
    fd.append('notifyRuns', String(notifyRuns));
    fd.append('notifyDrafts', String(notifyDrafts));
    fd.append('ambientTheme', ambientTheme);

    startTransition(async () => {
      const res = await saveOperatorSettings(fd);
      if (res?.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        setFeedback({ message: 'Operator guardrails and preferences saved.', type: 'success' });
        pushToast({
          title: 'Settings Updated',
          message: `Approval threshold set to $${thresholdDollars}.`,
          tone: 'emerald',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* System Health Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Supabase DB</span>
            <Database className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <GlassBadge variant={summary.systemHealth.supabaseConnected ? 'emerald' : 'rose'}>
              {summary.systemHealth.supabaseConnected ? 'Connected' : 'Missing Key'}
            </GlassBadge>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Gemini Neural API</span>
            <Sparkles className="w-4 h-4 text-[#c8f135]" />
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <GlassBadge variant={summary.systemHealth.geminiConfigured ? 'cyan' : 'amber'}>
              {summary.systemHealth.geminiConfigured ? 'API Key Active' : 'Fallback Only'}
            </GlassBadge>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Auth Mode</span>
            <KeyRound className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="mt-2.5">
            <span className="text-xs font-mono text-white">0ms Local JWT</span>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Active Operator</span>
            <CheckCircle2 className="w-4 h-4 text-[#c8f135]" />
          </div>
          <div className="mt-2.5 text-xs font-medium text-white truncate">
            {summary.systemHealth.operatorEmail}
          </div>
        </GlassCard>
      </div>

      {!summary.tableReady && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Preview Mode:</span> Run{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300">
              supabase/migrations/003_operator_settings.sql
            </code>{' '}
            in your Supabase SQL Editor to persist changes across sessions.
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs flex items-center gap-2 ${
            feedback.type === 'error'
              ? 'bg-rose-500/15 border border-rose-500/30 text-rose-200'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-200'
          }`}
        >
          {feedback.type === 'error' ? (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Guardrails */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Human Approval Guardrails</h2>
              <p className="text-xs text-slate-400">
                Set financial ceiling requiring mandatory operator sign-off
              </p>
            </div>
          </div>

          <div className="space-y-3 p-4 rounded-2xl glass-panel-inset">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Mandatory Gate Threshold
              </span>
              <span className="text-lg font-black text-[#c8f135]">
                ${thresholdDollars.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={5000}
              step={50}
              value={thresholdDollars}
              onChange={(e) => setThresholdDollars(Number(e.target.value))}
              className="w-full accent-[#c8f135] cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">
              Supplier restock orders above <strong>${thresholdDollars.toLocaleString()}</strong>{' '}
              automatically pause at Step 4 for human authorization.
            </p>
          </div>
        </GlassCard>

        {/* AI Engine & Telemetry */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-[#22d3ee]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Planner & Telemetry</h2>
              <p className="text-xs text-slate-400">
                Configure Gemini model selection and live notification streams
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Primary Neural Model
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-hybrid-planner'].map(
                  (model) => (
                    <button
                      key={model}
                      type="button"
                      onClick={() => setAiModel(model)}
                      className={`px-3 py-2 rounded-2xl text-[11px] font-mono border transition-all cursor-pointer truncate ${
                        aiModel === model
                          ? 'bg-white/20 text-white border-white/35 font-semibold'
                          : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {model}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              {[
                {
                  label: 'Adaptive Deterministic Fallback (Zero-Crash)',
                  checked: aiFallbackEnabled,
                  onChange: setAiFallbackEnabled,
                },
                {
                  label: 'Live Toast: Approval Gate Alerts',
                  checked: notifyApprovals,
                  onChange: setNotifyApprovals,
                },
                {
                  label: 'Live Toast: Agent Run Completions',
                  checked: notifyRuns,
                  onChange: setNotifyRuns,
                },
                {
                  label: 'Live Toast: Customer Draft Staging',
                  checked: notifyDrafts,
                  onChange: setNotifyDrafts,
                },
              ].map((toggle) => (
                <label
                  key={toggle.label}
                  className="flex items-center justify-between p-3 rounded-2xl glass-panel-inset cursor-pointer"
                >
                  <span className="text-xs text-slate-200 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#22d3ee]" />
                    <span>{toggle.label}</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={toggle.checked}
                    onChange={(e) => toggle.onChange(e.target.checked)}
                    className="h-4 w-4 accent-[#c8f135] cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Crystal Theme Selector + Single Save Button */}
      <GlassCard className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">Clear Crystal Glass Theme</h3>
          <p className="text-xs text-slate-400">
            Zero-blur specular crystal surface active (Port {summary.systemHealth.appPort}).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={ambientTheme}
            onChange={(e) => setAmbientTheme(e.target.value)}
            className="px-4 py-2 rounded-full glass-panel-inset text-xs text-white focus:outline-none"
          >
            <option value="deep-space-crystal" className="bg-slate-900">
              Deep Space Crystal
            </option>
            <option value="cyber-cyan-mesh" className="bg-slate-900">
              Cyber Cyan Mesh
            </option>
            <option value="neon-lime-pulse" className="bg-slate-900">
              Neon Lime Pulse
            </option>
          </select>

          <GlassButton type="submit" variant="lime" disabled={isPending}>
            <Save className="w-3.5 h-3.5" />
            <span>{isPending ? 'Saving...' : 'Save Settings'}</span>
          </GlassButton>
        </div>
      </GlassCard>
    </form>
  );
}
