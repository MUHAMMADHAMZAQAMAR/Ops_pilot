import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';

export interface AutomationSchedule {
  id: string;
  name: string;
  prompt: string;
  cron_expression: string;
  schedule_label: string;
  priority: 'normal' | 'urgent' | 'critical';
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  run_count: number;
  created_at: string;
}

export interface AutomationSummary {
  schedules: AutomationSchedule[];
  tableReady: boolean;
  metrics: {
    totalSchedules: number;
    activeSchedules: number;
    pausedSchedules: number;
    totalExecutions: number;
  };
}

const DEFAULT_SCHEDULES: AutomationSchedule[] = [
  {
    id: 'sched-default-1',
    name: 'Morning Inventory Depletion Scan',
    prompt:
      'Scan automotive catalog for depleted stock, calculate needed restock units, and prepare supplier replenishment proposal.',
    cron_expression: '0 8 * * *',
    schedule_label: 'Daily at 08:00 AM',
    priority: 'urgent',
    is_active: true,
    last_run_at: null,
    next_run_at: null,
    run_count: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sched-default-2',
    name: 'Pending Order Fulfillment Digest',
    prompt:
      'Query all pending customer orders, match high-value clients, and stage proactive dispatch status emails.',
    cron_expression: '0 */4 * * *',
    schedule_label: 'Every 4 hours',
    priority: 'normal',
    is_active: true,
    last_run_at: null,
    next_run_at: null,
    run_count: 12,
    created_at: new Date().toISOString(),
  },
  {
    id: 'sched-default-3',
    name: 'Weekly Safety-Stock Risk Audit',
    prompt:
      'Evaluate warehouse stock levels against safety reorder thresholds and generate operator risk assessment.',
    cron_expression: '0 9 * * 1',
    schedule_label: 'Mondays at 09:00 AM',
    priority: 'normal',
    is_active: false,
    last_run_at: null,
    next_run_at: null,
    run_count: 2,
    created_at: new Date().toISOString(),
  },
];

export const getAutomationSchedules = cache(async (): Promise<AutomationSummary> => {
  const supabase = createAdminClient();

  const { data, error } = await (supabase.from('automation_schedules' as any) as any)
    .select('*')
    .order('created_at', { ascending: false });

  const tableReady = !error;
  const schedules: AutomationSchedule[] =
    !error && Array.isArray(data) ? (data as AutomationSchedule[]) : DEFAULT_SCHEDULES;

  const activeSchedules = schedules.filter((s) => s.is_active).length;
  const totalExecutions = schedules.reduce((sum, s) => sum + (s.run_count || 0), 0);

  return {
    schedules,
    tableReady,
    metrics: {
      totalSchedules: schedules.length,
      activeSchedules,
      pausedSchedules: schedules.length - activeSchedules,
      totalExecutions,
    },
  };
});
