import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function RunsLoading() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <GlassSkeleton className="w-40 h-3" />
          <GlassSkeleton className="w-72 h-8 rounded-xl" />
          <GlassSkeleton className="w-96 max-w-full h-3" />
        </div>
        <GlassSkeleton className="w-44 h-10 rounded-full" />
      </div>

      {/* 4 Metric Card Skeletons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-5 bg-white/[0.04] border border-white/[0.08] space-y-3"
          >
            <div className="flex items-center justify-between">
              <GlassSkeleton className="w-24 h-3" />
              <GlassSkeleton variant="avatar" className="h-8 w-8 rounded-xl" />
            </div>
            <div className="space-y-1">
              <GlassSkeleton className="w-16 h-7 rounded-lg" />
              <GlassSkeleton className="w-28 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <GlassSkeleton className="w-full sm:w-80 h-9 rounded-full" />
        <div className="flex gap-2">
          <GlassSkeleton className="w-20 h-9 rounded-full" />
          <GlassSkeleton className="w-36 h-9 rounded-full" />
          <GlassSkeleton className="w-24 h-9 rounded-full" />
        </div>
      </div>

      {/* Run Items Skeletons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-5 bg-white/[0.04] border border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <GlassSkeleton variant="badge" className="w-28" />
                <GlassSkeleton className="w-20 h-5 rounded-full" />
                <GlassSkeleton className="w-24 h-3" />
              </div>
              <GlassSkeleton className="w-3/4 h-4 rounded" />
            </div>
            <div className="flex items-center gap-4">
              <GlassSkeleton className="w-28 h-6 rounded" />
              <GlassSkeleton className="w-32 h-9 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

