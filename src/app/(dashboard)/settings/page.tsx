import React from 'react';
import { getOperatorSettings } from '@/features/settings/services/settings.service';
import { SettingsView } from '@/features/settings/components/settings-view';
import { Settings } from 'lucide-react';

export const metadata = {
  title: 'Operator Control Settings | OpsPilot',
  description: 'Configure financial approval guardrails, AI planner models, and notification preferences.',
};

export default async function SettingsPage() {
  const summary = await getOperatorSettings();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22d3ee]">
          <Settings className="w-4 h-4" />
          <span>System Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Operator Control Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Manage autonomous financial approval thresholds, Gemini neural engine parameters, and live telemetry preferences.
        </p>
      </div>

      <SettingsView summary={summary} />
    </div>
  );
}
