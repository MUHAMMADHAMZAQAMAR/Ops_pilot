import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function InventoryLoading() {
  return (
    <div className="space-y-6">
      {/* Metrics Row Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]"
          >
            <div className="flex items-center justify-between">
              <GlassSkeleton className="w-28 h-3" />
              <GlassSkeleton variant="avatar" className="h-8 w-8" />
            </div>
            <div className="mt-4 space-y-1">
              <GlassSkeleton className="w-24 h-8 rounded-lg" />
              <GlassSkeleton className="w-32 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Inventory Glass Table Skeleton */}
      <div className="rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="space-y-1.5">
            <GlassSkeleton className="w-52 h-5" />
            <GlassSkeleton className="w-72 h-3" />
          </div>
          <GlassSkeleton variant="badge" className="w-32" />
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-6 gap-4 pb-3 border-b border-white/[0.08]">
            <GlassSkeleton className="w-24 h-3" />
            <GlassSkeleton className="w-32 h-3" />
            <GlassSkeleton className="w-20 h-3" />
            <GlassSkeleton className="w-20 h-3" />
            <GlassSkeleton className="w-24 h-3" />
            <div className="flex justify-end">
              <GlassSkeleton className="w-16 h-3" />
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="grid grid-cols-6 gap-4 py-4 border-b border-white/[0.04] items-center"
            >
              <GlassSkeleton className="w-24 h-4 font-mono" />
              <div className="space-y-1">
                <GlassSkeleton className="w-36 h-4" />
                <GlassSkeleton className="w-20 h-2.5" />
              </div>
              <GlassSkeleton className="w-16 h-3" />
              <GlassSkeleton className="w-16 h-4" />
              <GlassSkeleton className="w-20 h-3" />
              <div className="flex justify-end">
                <GlassSkeleton variant="badge" className="w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

