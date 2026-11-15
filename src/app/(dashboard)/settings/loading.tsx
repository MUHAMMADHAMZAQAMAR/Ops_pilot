import React from 'react';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <GlassSkeleton className="w-36 h-3" />
        <GlassSkeleton className="w-64 h-8 rounded-xl" />
        <GlassSkeleton className="w-96 max-w-full h-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-4 bg-white/[0.05] border border-white/[0.14] space-y-2"
          >
            <GlassSkeleton className="w-24 h-3" />
            <GlassSkeleton variant="badge" className="w-24" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-3xl p-6 bg-white/[0.05] border border-white/[0.14] h-64 space-y-4"
          >
            <GlassSkeleton className="w-48 h-5" />
            <GlassSkeleton className="w-full h-32 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
