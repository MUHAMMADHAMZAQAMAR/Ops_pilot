import React from 'react';
import Link from 'next/link';
import { getMessageDrafts, calculateDraftMetrics } from '@/features/drafts/services/drafts.service';
import { DraftsStatsCards } from '@/features/drafts/components/drafts-stats-cards';
import { DraftsListView } from '@/features/drafts/components/drafts-list-view';
import { GlassButton } from '@/components/ui/glass-button';
import { Mail, Plus } from 'lucide-react';

export const metadata = {
  title: 'Customer Communications & Drafts | OpsPilot',
  description: 'Review, edit, and authorize agent-generated customer communications and dispatch notifications.',
};

export default async function DraftsPage() {
  const drafts = await getMessageDrafts();
  const metrics = calculateDraftMetrics(drafts);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#22d3ee]">
            <Mail className="w-4 h-4" />
            <span>Communications Dispatch Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Customer Message Drafts
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Human-in-the-loop review and staging desk for autonomous customer fulfillment notifications, order status updates, and logistics alerts.
          </p>
        </div>

        <div className="shrink-0">
          <Link href="/requests">
            <GlassButton variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Draft New Notice</span>
            </GlassButton>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <DraftsStatsCards metrics={metrics} />

      {/* Drafts List & Filter Toolbar */}
      <DraftsListView drafts={drafts} />
    </div>
  );
}

