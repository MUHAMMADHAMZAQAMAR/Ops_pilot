import React from 'react';
import { getAutomationSchedules } from '@/features/automation/services/automation.service';
import { AutomationView } from '@/features/automation/components/automation-view';
import { CalendarClock } from 'lucide-react';

export const metadata = {
  title: 'Automated Recurring Schedules | OpsPilot',
  description: 'Configure and trigger recurring autonomous agent workflows.',
};

export default async function AutomationPage() {
  const summary = await getAutomationSchedules();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c8f135]">
          <CalendarClock className="w-4 h-4" />
          <span>Autonomous Scheduler</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Recurring Agent Routines
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Schedule recurring autonomous inventory scans, pending order digests, and risk audits—or trigger any routine on demand.
        </p>
      </div>

      <AutomationView summary={summary} />
    </div>
  );
}
