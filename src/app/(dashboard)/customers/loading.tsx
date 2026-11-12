import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function CustomersLoading() {
  return (
    <div className="space-y-6">
      {/* Metric Header Card Skeleton */}
      <div className="rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <GlassSkeleton variant="avatar" className="h-10 w-10 rounded-2xl" />
            <div className="space-y-1.5">
              <GlassSkeleton className="w-56 h-5" />
              <GlassSkeleton className="w-72 h-3" />
            </div>
          </div>
          <GlassSkeleton variant="badge" className="w-36" />
        </div>
      </div>

      {/* Customer Accounts Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-5 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] flex flex-col justify-between h-48"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <GlassSkeleton variant="avatar" className="h-9 w-9" />
                <GlassSkeleton variant="badge" className="w-20" />
              </div>
              <GlassSkeleton className="w-36 h-4 mb-3" />
              <div className="space-y-2 mt-4">
                <GlassSkeleton className="w-44 h-3" />
                <GlassSkeleton className="w-32 h-3" />
              </div>
            </div>
            <GlassSkeleton className="w-28 h-2.5 pt-3 border-t border-white/[0.05]" />
          </div>
        ))}
      </div>
    </div>
  );
}

