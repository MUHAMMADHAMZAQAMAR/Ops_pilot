'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  XCircle,
  X,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastTone = 'amber' | 'cyan' | 'emerald' | 'rose';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  tone: ToastTone;
  href?: string;
  hrefLabel?: string;
  timestamp: string;
}

interface GlassToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toneStyles: Record<
  ToastTone,
  { border: string; iconBg: string; iconColor: string; Icon: React.ElementType }
> = {
  amber: {
    border: 'border-amber-400/35 shadow-[0_12px_40px_rgba(251,191,36,0.18)]',
    iconBg: 'bg-amber-500/15 border-amber-400/30',
    iconColor: 'text-amber-300',
    Icon: AlertTriangle,
  },
  cyan: {
    border: 'border-cyan-400/35 shadow-[0_12px_40px_rgba(34,211,238,0.18)]',
    iconBg: 'bg-cyan-500/15 border-cyan-400/30',
    iconColor: 'text-cyan-300',
    Icon: Sparkles,
  },
  emerald: {
    border: 'border-emerald-400/35 shadow-[0_12px_40px_rgba(52,211,153,0.18)]',
    iconBg: 'bg-emerald-500/15 border-emerald-400/30',
    iconColor: 'text-[#c8f135]',
    Icon: CheckCircle2,
  },
  rose: {
    border: 'border-rose-400/35 shadow-[0_12px_40px_rgba(244,63,94,0.18)]',
    iconBg: 'bg-rose-500/15 border-rose-400/30',
    iconColor: 'text-rose-300',
    Icon: XCircle,
  },
};

export function GlassToastStack({ toasts, onDismiss }: GlassToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
    >
      {toasts.map((toast) => {
        const style = toneStyles[toast.tone] || toneStyles.cyan;
        const Icon = style.Icon || Bell;

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto glass-panel rounded-2xl p-4 border transition-all duration-300 animate-fade-in-up',
              style.border
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'h-9 w-9 rounded-xl border flex items-center justify-center shrink-0',
                  style.iconBg
                )}
              >
                <Icon className={cn('w-4 h-4', style.iconColor)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white tracking-tight truncate">
                    {toast.title}
                  </h4>
                  <button
                    type="button"
                    onClick={() => onDismiss(toast.id)}
                    className="text-slate-400 hover:text-white transition-colors p-0.5 cursor-pointer"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mt-1 line-clamp-2">
                  {toast.message}
                </p>

                {toast.href && (
                  <div className="mt-2">
                    <Link
                      href={toast.href}
                      onClick={() => onDismiss(toast.id)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#c8f135] hover:underline"
                    >
                      <span>{toast.hrefLabel || 'Inspect'}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
