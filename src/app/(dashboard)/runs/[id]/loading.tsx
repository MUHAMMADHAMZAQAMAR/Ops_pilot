import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function RunDetailsLoading() {
  return (
    <div className="space-y-6">
      {/* Back button skeleton */}
      <GlassSkeleton className="w-32 h-4" />

      {/* Header Banner Skeleton */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white/[0.04] border border-white/[0.08] space-y-4">
        <div className="flex items-start gap-4">
          <GlassSkeleton variant="avatar" className="h-12 w-12 rounded-2xl shrink-0" />
          <div className="space-y-2 w-full">
            <div className="flex gap-2">
              <GlassSkeleton variant="badge" className="w-24" />
              <GlassSkeleton className="w-32 h-4" />
            </div>
            <GlassSkeleton className="w-3/4 h-6" />
            <GlassSkeleton className="w-48 h-3" />
          </div>
        </div>
      </div>

      {/* Two-Column Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08] space-y-4">
          <div className="flex justify-between items-center mb-6">
            <GlassSkeleton className="w-48 h-5" />
            <GlassSkeleton variant="badge" className="w-28" />
          </div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-2xl p-4 bg-white/[0.03] space-y-2">
              <GlassSkeleton className="w-40 h-4" />
              <GlassSkeleton className="w-full h-12" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08] h-48 space-y-3">
            <GlassSkeleton className="w-36 h-4" />
            <GlassSkeleton className="w-full h-20 rounded-xl" />
          </div>
          <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08] h-48 space-y-3">
            <GlassSkeleton className="w-36 h-4" />
            <GlassSkeleton className="w-full h-20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

