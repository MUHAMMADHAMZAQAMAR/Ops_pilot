import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Top 3-Column Glass Skeleton Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1 Skeleton */}
        <div className="lg:col-span-4 rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col justify-between h-[360px]">
          <div>
            <GlassSkeleton className="w-36 h-4 mb-4" />
            <div className="flex items-baseline gap-3 my-4">
              <GlassSkeleton className="w-20 h-10 rounded-xl" />
              <GlassSkeleton className="w-24 h-6" />
            </div>
            <GlassSkeleton className="w-full h-2 rounded-full mb-6" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-3 bg-white/[0.03] border border-white/[0.05] flex flex-col items-center justify-center gap-2"
              >
                <GlassSkeleton variant="avatar" className="h-8 w-8" />
                <GlassSkeleton className="w-8 h-4" />
                <GlassSkeleton className="w-12 h-3" />
              </div>
            ))}
          </div>
        </div>

        {/* Card 2 Skeleton */}
        <div className="lg:col-span-4 rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GlassSkeleton variant="badge" className="w-24" />
              <GlassSkeleton variant="badge" className="w-20" />
            </div>
            <GlassSkeleton className="w-48 h-6 mb-3" />
            <GlassSkeleton className="w-full h-3 mb-2" />
            <GlassSkeleton className="w-3/4 h-3" />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl p-3 bg-white/[0.03] border border-white/[0.05] flex items-center gap-2">
                <GlassSkeleton variant="avatar" className="h-7 w-7" />
                <GlassSkeleton className="w-16 h-3" />
              </div>
              <div className="rounded-2xl p-3 bg-white/[0.03] border border-white/[0.05] flex flex-col justify-center">
                <GlassSkeleton className="w-16 h-3 mb-1" />
                <GlassSkeleton className="w-full h-2" />
              </div>
            </div>
            <GlassSkeleton className="w-full h-11 rounded-full" />
          </div>
        </div>

        {/* Card 3 Skeleton */}
        <div className="lg:col-span-4 rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <GlassSkeleton className="w-28 h-4" />
              <GlassSkeleton variant="badge" className="w-20" />
            </div>
            <div className="flex items-baseline gap-2 mb-6">
              <GlassSkeleton className="w-24 h-10 rounded-xl" />
              <GlassSkeleton className="w-20 h-4" />
            </div>
          </div>

          {/* Bar Chart Skeletons */}
          <div className="flex items-end justify-between gap-2 h-32 pt-4 border-t border-white/[0.06]">
            {[40, 65, 30, 85, 100, 50, 70].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  style={{ height: `${h}%` }}
                  className="w-full rounded-full bg-white/[0.06] animate-pulse"
                />
                <GlassSkeleton className="w-4 h-2" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] h-64">
          <div className="flex items-center justify-between mb-6">
            <GlassSkeleton className="w-40 h-5" />
            <GlassSkeleton className="w-24 h-8 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.05] space-y-3">
                <GlassSkeleton className="w-24 h-3" />
                <GlassSkeleton className="w-32 h-4" />
                <GlassSkeleton className="w-16 h-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-3xl p-6 bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] h-64">
          <div className="flex items-center justify-between mb-6">
            <GlassSkeleton className="w-32 h-5" />
            <GlassSkeleton variant="badge" className="w-16" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <GlassSkeleton variant="avatar" className="h-8 w-8" />
                  <div className="space-y-1">
                    <GlassSkeleton className="w-24 h-3" />
                    <GlassSkeleton className="w-16 h-2" />
                  </div>
                </div>
                <GlassSkeleton className="w-12 h-3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

