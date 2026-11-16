import { GlassCard } from '@/components/ui/glass-card';
import { GlassSkeleton } from '@/components/ui/glass-skeleton';

export default function SystemLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <GlassSkeleton className="h-8 w-80" />
          <GlassSkeleton className="h-4 w-96" />
        </div>
        <GlassSkeleton className="h-10 w-44 rounded-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-5">
            <GlassSkeleton className="h-4 w-28" />
            <GlassSkeleton className="mt-3 h-7 w-20" />
            <GlassSkeleton className="mt-2 h-3 w-32" />
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <GlassCard key={i} className="p-5">
            <GlassSkeleton className="h-5 w-48" />
            <GlassSkeleton className="mt-2 h-4 w-64" />
            <GlassSkeleton className="mt-4 h-8 w-full" />
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
