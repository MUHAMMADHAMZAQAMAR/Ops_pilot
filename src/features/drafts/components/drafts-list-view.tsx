'use client';

import React, { useState, useMemo } from 'react';
import { MessageDraftWithRelations } from '../services/drafts.service';
import { DraftCard } from './draft-card';
import { GlassCard } from '@/components/ui/glass-card';
import { Search, Mail, Clock, Send, ShieldX, MessageSquare } from 'lucide-react';

interface DraftsListViewProps {
  drafts: MessageDraftWithRelations[];
}

export function DraftsListView({ drafts }: DraftsListViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

  const filteredDrafts = useMemo(() => {
    return drafts.filter((draft) => {
      // Status filter
      if (statusFilter === 'pending' && draft.status !== 'draft') return false;
      if (statusFilter === 'approved' && draft.status !== 'approved') return false;
      if (statusFilter === 'rejected' && draft.status !== 'rejected') return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const customerMatch = draft.customer?.name.toLowerCase().includes(query) || draft.customer?.email.toLowerCase().includes(query);
        const orderMatch = draft.order?.order_number.toLowerCase().includes(query);
        const contentMatch = draft.content.toLowerCase().includes(query);
        return customerMatch || orderMatch || contentMatch;
      }

      return true;
    });
  }, [drafts, searchQuery, statusFilter]);

  const counts = useMemo(() => {
    return {
      all: drafts.length,
      pending: drafts.filter((d) => d.status === 'draft').length,
      approved: drafts.filter((d) => d.status === 'approved').length,
      rejected: drafts.filter((d) => d.status === 'rejected').length,
    };
  }, [drafts]);

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search drafts by customer, order #, or content..."
            className="w-full pl-10 pr-4 py-2 rounded-full glass-panel-inset text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-white/30 transition-all"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-full glass-panel-inset text-xs overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Pending Review ({counts.pending})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <Send className="w-3 h-3 text-emerald-400" />
            <span>Dispatched ({counts.approved})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium flex items-center gap-1.5 ${
              statusFilter === 'rejected'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <ShieldX className="w-3 h-3 text-rose-400" />
            <span>Rejected ({counts.rejected})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap font-medium ${
              statusFilter === 'all'
                ? 'bg-white/20 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({counts.all})
          </button>
        </div>
      </div>

      {/* Drafts Grid */}
      {filteredDrafts.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <MessageSquare className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No message drafts found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No communications match "${searchQuery}". Clear your search query.`
              : statusFilter === 'pending'
              ? 'All customer notifications have been reviewed and dispatched.'
              : 'Communications drafted by autonomous agent workflows will appear here.'}
          </p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDrafts.map((draft) => (
            <DraftCard key={draft.id} draft={draft} />
          ))}
        </div>
      )}
    </div>
  );
}

