import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function ApprovalsLoading() {
  return (
    <div className="space-y-6">
      {/* 4 Metric Card Skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08]"
          >
            <div className="flex items-center justify-between">
              <GlassSkeleton className="w-28 h-3" />
              <GlassSkeleton variant="avatar" className="h-8 w-8" />
            </div>
            <div className="mt-4 space-y-1">
              <GlassSkeleton className="w-16 h-8 rounded-lg" />
              <GlassSkeleton className="w-28 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-2">
        <GlassSkeleton className="w-48 h-9 rounded-full" />
        <GlassSkeleton className="w-36 h-9 rounded-full" />
      </div>

      {/* 2 Approval Card Skeletons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08] space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <GlassSkeleton variant="avatar" className="h-10 w-10 rounded-2xl" />
                <div className="space-y-1.5">
                  <GlassSkeleton className="w-36 h-4" />
                  <GlassSkeleton className="w-24 h-2.5" />
                </div>
              </div>
              <GlassSkeleton variant="badge" className="w-20" />
            </div>

            <GlassSkeleton className="w-full h-16 rounded-2xl" />
            <GlassSkeleton className="w-full h-24 rounded-2xl" />

            <div className="flex justify-end gap-3 pt-2">
              <GlassSkeleton className="w-28 h-9 rounded-full" />
              <GlassSkeleton className="w-44 h-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

