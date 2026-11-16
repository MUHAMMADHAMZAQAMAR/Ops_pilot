'use client';

import React, { useState, useTransition } from 'react';
import {
  OperatorRoleType,
  TeamDirectorySummary,
  TeamMember,
} from '../services/team.service';
import {
  inviteTeamMember,
  toggleMemberStatus,
  updateMemberRole,
} from '../actions/team.actions';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import {
  Users,
  ShieldCheck,
  UserCog,
  Eye,
  Plus,
  AlertTriangle,
  CheckCircle2,
  UserCheck,
  UserX,
} from 'lucide-react';

interface TeamViewProps {
  summary: TeamDirectorySummary;
}

const ROLE_META: Record<
  OperatorRoleType,
  { label: string; variant: 'lime' | 'cyan' | 'amber'; limitText: string; permissions: string }
> = {
  admin: {
    label: 'Admin',
    variant: 'lime',
    limitText: '$10,000+ Limit',
    permissions: 'Full control: financial approvals, AI thresholds, schedules, and RBAC.',
  },
  operator: {
    label: 'Operator',
    variant: 'cyan',
    limitText: '$500 Limit',
    permissions: 'Dispatch agent requests, edit/send customer drafts, standard approvals.',
  },
  auditor: {
    label: 'Auditor',
    variant: 'amber',
    limitText: 'Read-Only',
    permissions: 'Inspect execution graphs, audit logs, and export compliance reports.',
  },
};

export function TeamView({ summary }: TeamViewProps) {
  const { pushToast } = useRealtimeTelemetry();
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<OperatorRoleType>('operator');
  const [department, setDepartment] = useState('Operations');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    const fd = new FormData();
    fd.append('fullName', fullName);
    fd.append('email', email);
    fd.append('role', role);
    fd.append('department', department);

    startTransition(async () => {
      const res = await inviteTeamMember(fd);
      if (res?.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        setFullName('');
        setEmail('');
        setShowInviteForm(false);
        pushToast({
          title: 'Team Member Added',
          message: `${fullName} assigned role: ${role.toUpperCase()}.`,
          tone: 'emerald',
        });
      }
    });
  };

  const handleRoleChange = (member: TeamMember, nextRole: OperatorRoleType) => {
    setActiveId(member.id);
    setFeedback(null);
    startTransition(async () => {
      const res = await updateMemberRole(member.id, nextRole);
      setActiveId(null);
      if (res?.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        pushToast({
          title: 'Role Updated',
          message: `${member.full_name} is now ${nextRole.toUpperCase()}.`,
          tone: 'cyan',
        });
      }
    });
  };

  const handleToggleActive = (member: TeamMember) => {
    setActiveId(member.id);
    setFeedback(null);
    startTransition(async () => {
      const res = await toggleMemberStatus(member.id, !member.is_active);
      setActiveId(null);
      if (res?.error) {
        setFeedback({ message: res.error, type: 'error' });
      } else {
        pushToast({
          title: !member.is_active ? 'Operator Reactivated' : 'Operator Suspended',
          message: member.full_name,
          tone: !member.is_active ? 'emerald' : 'amber',
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
            <span>Team Members</span>
            <Users className="w-4 h-4 text-[#22d3ee]" />
          </div>
          <div className="mt-3 text-2xl font-black text-white">
            {summary.metrics.totalMembers}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Registered identities</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Admins</span>
            <ShieldCheck className="w-4 h-4 text-[#c8f135]" />
          </div>
          <div className="mt-3 text-2xl font-black text-[#c8f135]">
            {summary.metrics.adminsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Full cryptographic clearance</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Operators</span>
            <UserCog className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="mt-3 text-2xl font-black text-cyan-300">
            {summary.metrics.operatorsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Standard triage & drafts</p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
            <span>Auditors</span>
            <Eye className="w-4 h-4 text-amber-300" />
          </div>
          <div className="mt-3 text-2xl font-black text-amber-300">
            {summary.metrics.auditorsCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Read-only compliance access</p>
        </GlassCard>
      </div>

      {/* Role Permission Tiers Reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['admin', 'operator', 'auditor'] as const).map((tier) => {
          const meta = ROLE_META[tier];
          return (
            <GlassCard key={tier} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <GlassBadge variant={meta.variant}>{meta.label}</GlassBadge>
                <span className="text-[11px] font-mono text-slate-400">{meta.limitText}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{meta.permissions}</p>
            </GlassCard>
          );
        })}
      </div>

      {!summary.tableReady && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-xs text-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-white">Preview Mode:</span> Run{' '}
            <code className="px-1.5 py-0.5 rounded bg-black/40 text-amber-300">
              supabase/migrations/004_team_rbac.sql
            </code>{' '}
            in your Supabase SQL Editor to persist role changes and new team invitations.
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
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-white tracking-tight">Operator Roster</h2>
        <GlassButton
          variant={showInviteForm ? 'secondary' : 'lime'}
          onClick={() => setShowInviteForm((prev) => !prev)}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{showInviteForm ? 'Hide Form' : 'Add Operator'}</span>
        </GlassButton>
      </div>

      {/* Add Member Form */}
      {showInviteForm && (
        <GlassCard className="p-6 animate-fade-in-up">
          <form onSubmit={handleInvite} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="elena@opspilot.com"
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl glass-panel-inset text-xs text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Role Tier
                </label>
                <div className="flex gap-2">
                  {(['admin', 'operator', 'auditor'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex-1 py-2 rounded-2xl text-xs font-semibold capitalize border transition-all cursor-pointer ${
                        role === r
                          ? 'bg-white/20 text-white border-white/35'
                          : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <GlassButton type="submit" variant="lime" disabled={isPending}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isPending ? 'Adding...' : 'Assign Role & Add'}</span>
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Team Members List */}
      <div className="space-y-3">
        {summary.members.map((member) => {
          const meta = ROLE_META[member.role] || ROLE_META.operator;
          const isBusy = isPending && activeId === member.id;
          const isSelf = member.email === summary.currentOperatorEmail;
          const initials = member.full_name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase();

          return (
            <GlassCard
              key={member.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xs shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {member.full_name}
                    </span>
                    <GlassBadge variant={meta.variant}>{meta.label}</GlassBadge>
                    {isSelf && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.08] border border-white/15 text-[#c8f135]">
                        You
                      </span>
                    )}
                    {!member.is_active && <GlassBadge variant="rose">Suspended</GlassBadge>}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 truncate">
                    {member.email} • {member.department} • Limit:{' '}
                    {member.approval_limit_cents > 0
                      ? `$${(member.approval_limit_cents / 100).toLocaleString()}`
                      : 'Read-Only'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 justify-end">
                <select
                  value={member.role}
                  disabled={isBusy}
                  onChange={(e) => handleRoleChange(member, e.target.value as OperatorRoleType)}
                  className="px-3.5 py-2 rounded-full glass-panel-inset text-xs text-white focus:outline-none cursor-pointer"
                  aria-label={`Role for ${member.full_name}`}
                >
                  <option value="admin" className="bg-slate-900">
                    Admin
                  </option>
                  <option value="operator" className="bg-slate-900">
                    Operator
                  </option>
                  <option value="auditor" className="bg-slate-900">
                    Auditor
                  </option>
                </select>

                <GlassButton
                  variant={member.is_active ? 'secondary' : 'lime'}
                  disabled={isBusy || isSelf}
                  onClick={() => handleToggleActive(member)}
                >
                  {member.is_active ? (
                    <>
                      <UserX className="w-3.5 h-3.5" />
                      <span>Suspend</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Activate</span>
                    </>
                  )}
                </GlassButton>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
