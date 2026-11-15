import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function ComplianceReportsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <GlassSkeleton className="w-40 h-3" />
          <GlassSkeleton className="w-72 h-8 rounded-xl" />
          <GlassSkeleton className="w-96 max-w-full h-3" />
        </div>
        <GlassSkeleton className="w-36 h-9 rounded-full" />
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

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <GlassSkeleton className="w-full sm:w-80 h-9 rounded-full" />
        <div className="flex gap-2">
          <GlassSkeleton className="w-28 h-9 rounded-full" />
          <GlassSkeleton className="w-28 h-9 rounded-full" />
        </div>
      </div>

      <div className="rounded-3xl p-5 bg-white/[0.05] border border-white/[0.14] space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3 flex-1">
              <GlassSkeleton variant="avatar" className="h-9 w-9 rounded-xl" />
              <div className="space-y-1.5 flex-1">
                <GlassSkeleton className="w-40 h-3" />
                <GlassSkeleton className="w-2/3 h-4" />
              </div>
            </div>
            <GlassSkeleton className="w-16 h-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
