'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Radio, ArrowRight, Trash2 } from 'lucide-react';
import { useRealtimeTelemetry } from './realtime-provider';
import { cn } from '@/lib/utils';

export function LiveActivityBell() {
  const { status, events, unreadCount, markAllRead, clearEvents, counts } =
    useRealtimeTelemetry();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      markAllRead();
    }
  };

  const totalAttention = unreadCount || counts.pendingApprovals + counts.pendingDrafts;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative h-8 px-2.5 rounded-full bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 flex items-center gap-1.5 text-slate-300 hover:text-white transition-all cursor-pointer"
        title={`Live Telemetry: ${status}`}
        aria-label="Live Telemetry & Notifications"
      >
        {/* Live WebSocket Status Dot */}
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={cn(
              'relative inline-flex rounded-full h-2 w-2',
              status === 'connected'
                ? 'bg-emerald-400'
                : status === 'connecting'
                ? 'bg-amber-400 animate-pulse'
                : 'bg-slate-500'
            )}
          />
        </span>

        <Bell className="w-3.5 h-3.5" />

        {totalAttention > 0 && (
          <span className="px-1.5 py-0.2 rounded-full bg-[#c8f135] text-slate-950 text-[10px] font-black leading-tight">
            {totalAttention}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-slate-950/95 backdrop-blur-2xl p-4 shadow-[0_24px_60px_rgba(0,0,0,0.85)] border border-white/15 z-50 animate-fade-in-up">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Radio
                className={cn(
                  'w-3.5 h-3.5',
                  status === 'connected' ? 'text-emerald-400' : 'text-amber-400'
                )}
              />
              <span className="text-xs font-bold text-white tracking-tight">
                Live Telemetry Feed
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 capitalize">
                {status}
              </span>
            </div>

            {events.length > 0 && (
              <button
                type="button"
                onClick={clearEvents}
                className="text-[11px] text-slate-400 hover:text-rose-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>

          {/* Pending Gate Summary Pills */}
          <div className="grid grid-cols-3 gap-2 py-3 border-b border-white/[0.06] text-center">
            <Link
              href="/approvals"
              onClick={() => setOpen(false)}
              className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <div className="text-sm font-black text-amber-300">
                {counts.pendingApprovals}
              </div>
              <div className="text-[10px] text-slate-300">Approvals</div>
            </Link>
            <Link
              href="/drafts"
              onClick={() => setOpen(false)}
              className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
            >
              <div className="text-sm font-black text-cyan-300">
                {counts.pendingDrafts}
              </div>
              <div className="text-[10px] text-slate-300">Drafts</div>
            </Link>
            <Link
              href="/runs"
              onClick={() => setOpen(false)}
              className="p-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
            >
              <div className="text-sm font-black text-[#c8f135]">
                {counts.activeRuns}
              </div>
              <div className="text-[10px] text-slate-300">Active Runs</div>
            </Link>
          </div>

          {/* Streamed Events List */}
          <div className="mt-3 max-h-64 overflow-y-auto space-y-2 pr-1">
            {events.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Listening for live agent runs, approval gates, and draft updates...
              </div>
            ) : (
              events.map((ev) => (
                <div
                  key={ev.id}
                  className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] hover:border-white/15 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-white truncate">
                      {ev.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">
                      {ev.timestamp}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5 line-clamp-2">
                    {ev.message}
                  </p>
                  {ev.href && (
                    <Link
                      href={ev.href}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#c8f135] hover:underline mt-1"
                    >
                      <span>{ev.hrefLabel || 'Open'}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
