import React from 'react';
import { getTeamDirectory } from '@/features/team/services/team.service';
import { TeamView } from '@/features/team/components/team-view';
import { Users } from 'lucide-react';

export const metadata = {
  title: 'Team & RBAC Access | OpsPilot',
  description: 'Manage operator roles, financial approval limits, and compliance auditor access.',
};

export default async function TeamPage() {
  const summary = await getTeamDirectory();

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c8f135]">
          <Users className="w-4 h-4" />
          <span>Role-Based Access Control</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
          Team & Operator Permissions
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
          Assign Admin, Operator, or Auditor roles and enforce financial authorization limits across your autonomous operations team.
        </p>
      </div>

      <TeamView summary={summary} />
    </div>
  );
}
