'use client';

import React, { useState, useTransition } from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassButton } from '@/components/ui/glass-button';
import { GlassBadge } from '@/components/ui/glass-badge';
import { Sparkles, Send, Flame, AlertCircle, CheckCircle2, Bot } from 'lucide-react';
import { createBusinessRequest } from '../actions/requests.actions';

const PRESET_PROMPTS = [
  {
    title: 'Restock Depleted SKUs',
    prompt: 'Scan automotive catalog for depleted stock, calculate needed restock units, and draft supplier replenishment order.',
    priority: 'urgent',
  },
  {
    title: 'Customer Fulfillment Notice',
    prompt: 'Query all pending customer orders, match high-value clients, and draft proactive dispatch notice emails.',
    priority: 'normal',
  },
  {
    title: 'Inventory Risk Analysis',
    prompt: 'Evaluate warehouse stock levels against safety reorder thresholds and generate operator risk report.',
    priority: 'normal',
  },
];

export function RequestInputForm() {
  const [promptText, setPromptText] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSelectPreset(preset: typeof PRESET_PROMPTS[number]) {
    setPromptText(preset.prompt);
    setPriority(preset.priority as 'normal' | 'urgent' | 'critical');
    setFeedback(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!promptText.trim()) return;

    setFeedback(null);
    const formData = new FormData();
    formData.append('task', promptText);
    formData.append('priority', priority);

    startTransition(async () => {
      const res = await createBusinessRequest(formData);
      if (res.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        setFeedback({
          message: 'Agent task queued successfully! Autonomous planning initiated.',
          type: 'success',
        });
        setPromptText('');
      }
    });
  }

  return (
    <GlassCard className="p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(200,241,53,0.35)]">
            <Bot className="w-5 h-5 fill-slate-950 text-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Command AI Business Agent
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit natural-language operations requests for autonomous multi-step planning
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GlassBadge variant="cyan" pulseDot className="flex items-center gap-1.5 font-semibold text-[11px]">
            <Sparkles className="w-3 h-3 text-[#c8f135]" />
            <span>Gemini Neural Core</span>
          </GlassBadge>
        </div>
      </div>

      {/* Preset Prompts Pills */}
      <div className="mb-4">
        <span className="text-[11px] font-semibold text-slate-400 block mb-2 uppercase tracking-wider">
          Suggested Operator Prompts:
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(p)}
              className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-3 h-3 text-[#c8f135]" />
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Natural Language Textarea */}
        <div className="relative">
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={3}
            placeholder="e.g., Scan inventory for out-of-stock items, identify affected customer orders, and prepare draft restock proposals for review..."
            required
            className="w-full p-4 text-xs sm:text-sm text-white placeholder-slate-400 glass-panel-inset rounded-2xl focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition-all resize-none"
          />
        </div>

        {/* Controls Row: Priority Pills + Submit Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          {/* Priority Pill Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium mr-1">Urgency:</span>
            {(['normal', 'urgent', 'critical'] as const).map((level) => {
              const isSelected = priority === level;
              const colorClasses = {
                normal: isSelected
                  ? 'bg-white/20 text-white border-white/30'
                  : 'text-slate-400 hover:text-slate-200 border-white/10',
                urgent: isSelected
                  ? 'bg-[#fbbf24]/20 text-[#fbbf24] border-[#fbbf24]/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 border-white/10',
                critical: isSelected
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 border-white/10',
              };

              return (
                <button
                  key={level}
                  type="button"
                  onClick={() => setPriority(level)}
                  className={`text-xs px-3 py-1 rounded-full border transition-all capitalize font-medium cursor-pointer ${colorClasses[level]}`}
                >
                  {level === 'critical' && <Flame className="w-3 h-3 inline-block mr-1" />}
                  {level}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          <GlassButton
            type="submit"
            variant="lime"
            disabled={isPending || !promptText.trim()}
            className="py-2.5 px-6 self-end sm:self-auto cursor-pointer"
          >
            {isPending ? (
              <span className="inline-flex items-center gap-2">
                <span className="animate-spin h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent rounded-full" />
                Dispatching Agent...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <span>Dispatch Autonomous Agent</span>
                <Send className="w-3.5 h-3.5" />
              </span>
            )}
          </GlassButton>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 animate-fade-in-up ${
              feedback.type === 'success'
                ? 'bg-[#c8f135]/10 border border-[#c8f135]/20 text-[#c8f135]'
                : 'bg-rose-500/10 border border-rose-500/20 text-rose-300'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}
      </form>
    </GlassCard>
  );
}

