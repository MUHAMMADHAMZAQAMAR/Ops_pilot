import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function AutomationLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GlassSkeleton className="w-36 h-3" />
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
            <GlassSkeleton className="w-16 h-7 rounded-lg" />
            <GlassSkeleton className="w-28 h-2.5" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-5 bg-white/[0.05] border border-white/[0.14] space-y-4"
          >
            <div className="flex justify-between">
              <GlassSkeleton variant="badge" className="w-24" />
              <GlassSkeleton className="w-28 h-4" />
            </div>
            <GlassSkeleton className="w-48 h-4" />
            <GlassSkeleton className="w-full h-16 rounded-2xl" />
            <div className="flex justify-between pt-2">
              <GlassSkeleton className="w-24 h-3" />
              <div className="flex gap-2">
                <GlassSkeleton className="w-20 h-8 rounded-full" />
                <GlassSkeleton className="w-24 h-8 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
