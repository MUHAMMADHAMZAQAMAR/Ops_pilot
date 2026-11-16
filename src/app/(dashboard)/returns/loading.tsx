import { GlassCard } from '@/components/ui/glass-card';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function ReturnsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <GlassSkeleton className="h-8 w-80" />
          <GlassSkeleton className="h-4 w-96" />
        </div>
        <GlassSkeleton className="h-10 w-40 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-5">
            <GlassSkeleton className="h-4 w-28" />
            <GlassSkeleton className="mt-3 h-7 w-16" />
            <GlassSkeleton className="mt-2 h-3 w-32" />
          </GlassCard>
        ))}
      </div>

      <GlassCard className="p-6">
        <GlassSkeleton className="h-5 w-48" />
        <div className="mt-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassSkeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
