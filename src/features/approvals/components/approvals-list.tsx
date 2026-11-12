'use client';

import React, { useState } from 'react';
import { ActionApprovalWithRelations } from '../services/approvals.service';
import { ApprovalCard } from './approval-card';
import { ShieldCheck, Clock, CheckCircle2 } from 'lucide-react';

interface ApprovalsListProps {
  approvals: ActionApprovalWithRelations[];
}

export function ApprovalsList({ approvals }: ApprovalsListProps) {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const pending = approvals.filter((a) => a.status === 'pending');
  const displayed = filter === 'pending' ? pending : approvals;

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2 p-1 rounded-full glass-panel-inset text-xs font-semibold">
          <button
            type="button"
            onClick={() => setFilter('pending')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'pending'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Authorization ({pending.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit History ({approvals.length})</span>
          </button>
        </div>
      </div>

      {/* Approvals Grid */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 glass-panel-inset rounded-3xl p-6">
          <CheckCircle2 className="w-8 h-8 text-[#c8f135] mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">
            {filter === 'pending' ? 'All Clear — No Pending Approvals' : 'No Action History'}
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {filter === 'pending'
              ? 'Every autonomous proposal has been reviewed. Autonomous operations will appear here whenever approval gates are reached.'
              : 'Completed agent approvals will be permanently logged here for compliance and auditing.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {displayed.map((approval) => (
            <ApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  );
}

