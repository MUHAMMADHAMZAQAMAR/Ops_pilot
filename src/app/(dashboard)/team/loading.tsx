import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function TeamLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GlassSkeleton className="w-40 h-3" />
        <GlassSkeleton className="w-72 h-8 rounded-xl" />
        <GlassSkeleton className="w-96 max-w-full h-3" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-5 bg-white/[0.05] border border-white/[0.14] space-y-3"
          >
            <GlassSkeleton className="w-24 h-3" />
            <GlassSkeleton className="w-14 h-7 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-5 bg-white/[0.05] border border-white/[0.14] flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <GlassSkeleton variant="avatar" className="h-10 w-10 rounded-2xl" />
              <div className="space-y-1.5">
                <GlassSkeleton className="w-36 h-4" />
                <GlassSkeleton className="w-56 h-3" />
              </div>
            </div>
            <div className="flex gap-2">
              <GlassSkeleton className="w-24 h-8 rounded-full" />
              <GlassSkeleton className="w-24 h-8 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
