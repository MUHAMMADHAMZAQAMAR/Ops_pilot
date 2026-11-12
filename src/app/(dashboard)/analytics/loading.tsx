import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      {/* Top Banner Skeleton */}
      <div className="rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <GlassSkeleton variant="avatar" className="h-10 w-10 rounded-2xl" />
            <div className="space-y-1.5">
              <GlassSkeleton className="w-60 h-5" />
              <GlassSkeleton className="w-80 h-3" />
            </div>
          </div>
          <GlassSkeleton variant="badge" className="w-32" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]"
          >
            <div className="flex items-center justify-between">
              <GlassSkeleton className="w-24 h-3" />
              <GlassSkeleton variant="avatar" className="h-8 w-8" />
            </div>
            <div className="mt-4 space-y-1">
              <GlassSkeleton className="w-20 h-8 rounded-lg" />
              <GlassSkeleton className="w-32 h-2.5" />
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Chart & Breakdown Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] h-80">
          <div className="flex items-center justify-between mb-6">
            <GlassSkeleton className="w-48 h-5" />
            <GlassSkeleton variant="badge" className="w-24" />
          </div>
          <div className="flex items-end justify-between gap-3 h-52 pt-6">
            {[35, 60, 45, 80, 95, 65, 85].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full rounded-2xl bg-white/[0.06] animate-pulse"
                />
                <GlassSkeleton className="w-6 h-2.5" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] h-80 flex flex-col justify-between">
          <div className="space-y-4">
            <GlassSkeleton className="w-36 h-5" />
            <div className="space-y-3 pt-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl p-3 bg-white/[0.03] border border-white/[0.05] space-y-2">
                  <div className="flex justify-between">
                    <GlassSkeleton className="w-24 h-3" />
                    <GlassSkeleton className="w-12 h-3" />
                  </div>
                  <GlassSkeleton className="w-full h-2 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

