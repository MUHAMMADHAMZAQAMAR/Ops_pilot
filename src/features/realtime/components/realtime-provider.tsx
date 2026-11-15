'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GlassToastStack, ToastItem, ToastTone } from '@/components/ui/glass-toast';
import { LiveTelemetryCounts } from '../services/telemetry.service';

export type RealtimeStatus = 'connecting' | 'connected' | 'offline';

interface RealtimeContextValue {
  counts: LiveTelemetryCounts;
  status: RealtimeStatus;
  events: ToastItem[];
  unreadCount: number;
  markAllRead: () => void;
  clearEvents: () => void;
  pushToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

export function useRealtimeTelemetry() {
  const ctx = useContext(RealtimeContext);
  if (!ctx) {
    throw new Error('useRealtimeTelemetry must be used within RealtimeProvider');
  }
  return ctx;
}

interface RealtimeProviderProps {
  initialCounts: LiveTelemetryCounts;
  children: React.ReactNode;
}

export function RealtimeProvider({ initialCounts, children }: RealtimeProviderProps) {
  const router = useRouter();
  const [counts, setCounts] = useState<LiveTelemetryCounts>(initialCounts);
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [events, setEvents] = useState<ToastItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync SSR counts when server props update after router.refresh()
  useEffect(() => {
    setCounts(initialCounts);
  }, [initialCounts]);

  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      router.refresh();
    }, 350);
  }, [router]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushToast = useCallback(
    (input: Omit<ToastItem, 'id' | 'timestamp'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = {
        ...input,
        id,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setToasts((prev) => [item, ...prev].slice(0, 4));
      setEvents((prev) => [item, ...prev].slice(0, 12));
      setUnreadCount((c) => c + 1);

      setTimeout(() => {
        dismissToast(id);
      }, 6500);
    },
    [dismissToast]
  );

  const markAllRead = useCallback(() => setUnreadCount(0), []);
  const clearEvents = useCallback(() => {
    setEvents([]);
    setUnreadCount(0);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const channel = supabase
      .channel('opspilot-live-telemetry')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agent_runs' },
        (payload) => {
          if (!isMounted) return;
          const record = (payload.new || {}) as Record<string, any>;
          const runId = record.id as string | undefined;
          const runStatus = record.status as string | undefined;
          const task = (record.task as string | undefined) || 'Autonomous Task';

          if (payload.eventType === 'INSERT') {
            setCounts((c) => ({ ...c, activeRuns: c.activeRuns + 1 }));
            pushToast({
              title: 'Agent Directive Dispatched',
              message: task.slice(0, 90),
              tone: 'cyan',
              href: runId ? `/runs/${runId}` : '/runs',
              hrefLabel: 'Watch Execution',
            });
          } else if (payload.eventType === 'UPDATE') {
            let tone: ToastTone = 'cyan';
            let title = 'Agent Status Updated';

            if (runStatus === 'waiting_approval') {
              tone = 'amber';
              title = 'Paused at Human Gate';
            } else if (runStatus === 'completed') {
              tone = 'emerald';
              title = 'Orchestration Completed';
            } else if (runStatus === 'failed' || runStatus === 'cancelled') {
              tone = 'rose';
              title = runStatus === 'cancelled' ? 'Run Cancelled' : 'Execution Failed';
            }

            pushToast({
              title,
              message: task.slice(0, 90),
              tone,
              href: runId ? `/runs/${runId}` : '/runs',
              hrefLabel: 'Inspect Timeline',
            });
          }

          scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'action_approvals' },
        (payload) => {
          if (!isMounted) return;
          const record = (payload.new || {}) as Record<string, any>;
          const actionType = String(record.action_type || 'sensitive_action').replace(/_/g, ' ');

          if (payload.eventType === 'INSERT' && record.status === 'pending') {
            setCounts((c) => ({ ...c, pendingApprovals: c.pendingApprovals + 1 }));
            pushToast({
              title: 'Approval Gate Triggered',
              message: `Operator sign-off required for ${actionType}.`,
              tone: 'amber',
              href: '/approvals',
              hrefLabel: 'Review Gate',
            });
          } else if (payload.eventType === 'UPDATE') {
            if (record.status === 'approved') {
              setCounts((c) => ({
                ...c,
                pendingApprovals: Math.max(0, c.pendingApprovals - 1),
              }));
              pushToast({
                title: 'Action Authorized & Executed',
                message: `Approved ${actionType} completed successfully.`,
                tone: 'emerald',
                href: '/approvals',
                hrefLabel: 'View Audit',
              });
            } else if (record.status === 'rejected') {
              setCounts((c) => ({
                ...c,
                pendingApprovals: Math.max(0, c.pendingApprovals - 1),
              }));
              pushToast({
                title: 'Proposal Rejected',
                message: `Rejected ${actionType}.`,
                tone: 'rose',
                href: '/approvals',
                hrefLabel: 'View Audit',
              });
            }
          }

          scheduleRefresh();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_drafts' },
        (payload) => {
          if (!isMounted) return;
          const record = (payload.new || {}) as Record<string, any>;

          if (payload.eventType === 'INSERT' && record.status === 'draft') {
            setCounts((c) => ({ ...c, pendingDrafts: c.pendingDrafts + 1 }));
            pushToast({
              title: 'Customer Draft Staged',
              message: 'A new automated customer email is ready for review.',
              tone: 'cyan',
              href: '/drafts',
              hrefLabel: 'Review Draft',
            });
          } else if (payload.eventType === 'UPDATE' && record.status === 'approved') {
            setCounts((c) => ({
              ...c,
              pendingDrafts: Math.max(0, c.pendingDrafts - 1),
            }));
            pushToast({
              title: 'Customer Email Dispatched',
              message: 'Notification approved and marked for delivery.',
              tone: 'emerald',
              href: '/drafts',
              hrefLabel: 'View Sent',
            });
          }

          scheduleRefresh();
        }
      )
      .subscribe((subStatus) => {
        if (!isMounted) return;
        if (subStatus === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (subStatus === 'CHANNEL_ERROR' || subStatus === 'TIMED_OUT') {
          setStatus('offline');
        } else {
          setStatus('connecting');
        }
      });

    return () => {
      isMounted = false;
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [pushToast, scheduleRefresh]);

  return (
    <RealtimeContext.Provider
      value={{
        counts,
        status,
        events,
        unreadCount,
        markAllRead,
        clearEvents,
        pushToast,
      }}
    >
      {children}
      <GlassToastStack toasts={toasts} onDismiss={dismissToast} />
    </RealtimeContext.Provider>
  );
}
