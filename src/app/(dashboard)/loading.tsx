import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function DefaultDashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header bar skeleton */}
      <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08]">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <GlassSkeleton className="w-48 h-5" />
            <GlassSkeleton className="w-72 h-3" />
          </div>
          <GlassSkeleton variant="badge" className="w-24" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08]"
          >
            <div className="flex items-center justify-between">
              <GlassSkeleton className="w-28 h-3" />
              <GlassSkeleton variant="avatar" className="h-8 w-8" />
            </div>
            <div className="mt-4 space-y-1">
              <GlassSkeleton className="w-20 h-8 rounded-lg" />
              <GlassSkeleton className="w-28 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Main card skeleton */}
      <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08] h-72">
        <div className="flex items-center justify-between mb-6">
          <GlassSkeleton className="w-40 h-5" />
          <GlassSkeleton variant="badge" className="w-20" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassSkeleton key={i} className="w-full h-8 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

