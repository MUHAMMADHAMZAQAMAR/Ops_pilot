import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function RequestsLoading() {
  return (
    <div className="space-y-6">
      {/* 4 Metrics Skeletons */}
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

      {/* Form Skeleton */}
      <div className="rounded-3xl p-6 sm:p-8 bg-white/[0.04] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <GlassSkeleton variant="avatar" className="h-10 w-10 rounded-2xl" />
            <div className="space-y-1.5">
              <GlassSkeleton className="w-48 h-5" />
              <GlassSkeleton className="w-72 h-3" />
            </div>
          </div>
          <GlassSkeleton variant="badge" className="w-32" />
        </div>
        <GlassSkeleton className="w-full h-24 rounded-2xl" />
        <div className="flex justify-between items-center pt-2">
          <GlassSkeleton className="w-40 h-8 rounded-full" />
          <GlassSkeleton className="w-44 h-10 rounded-full" />
        </div>
      </div>

      {/* Ledger Skeleton */}
      <div className="rounded-3xl p-6 bg-white/[0.04] border border-white/[0.08]">
        <div className="flex justify-between items-center mb-6">
          <GlassSkeleton className="w-44 h-5" />
          <GlassSkeleton variant="badge" className="w-28" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((r) => (
            <div key={r} className="py-4 border-b border-white/[0.04] flex justify-between items-center">
              <div className="space-y-1.5">
                <GlassSkeleton className="w-64 h-4" />
                <GlassSkeleton className="w-36 h-3" />
              </div>
              <GlassSkeleton variant="badge" className="w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

