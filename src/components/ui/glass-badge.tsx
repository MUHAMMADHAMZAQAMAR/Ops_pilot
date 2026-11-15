import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'lime'
  | 'cyan'
  | 'amber'
  | 'glass'
  | 'rose'
  | 'emerald'
  | 'violet';

interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulseDot?: boolean;
  className?: string;
}

export function GlassBadge({
  children,
  variant = 'glass',
  pulseDot = false,
  className,
  ...props
}: GlassBadgeProps) {
  const variantStyles: Record<BadgeVariant, { badge: string; dot: string }> = {
    lime: {
      badge: 'bg-[#c8f135] text-slate-950 font-bold shadow-[0_0_16px_rgba(200,241,53,0.35)] border-transparent',
      dot: 'bg-slate-950',
    },
    emerald: {
      badge: 'bg-[#c8f135] text-slate-950 font-bold shadow-[0_0_16px_rgba(200,241,53,0.35)] border-transparent',
      dot: 'bg-slate-950',
    },
    cyan: {
      badge: 'bg-[#22d3ee] text-slate-950 font-bold shadow-[0_0_16px_rgba(34,211,238,0.35)] border-transparent',
      dot: 'bg-slate-950',
    },
    amber: {
      badge: 'bg-[#fbbf24] text-slate-950 font-bold shadow-[0_0_16px_rgba(251,191,36,0.35)] border-transparent',
      dot: 'bg-slate-950',
    },
    violet: {
      badge: 'bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.25)]',
      dot: 'bg-violet-400',
    },
    glass: {
      badge: 'bg-white/[0.08] text-slate-200 border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]',
      dot: 'bg-[#c8f135]',
    },
    rose: {
      badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
      dot: 'bg-rose-400',
    },
  };

  const current = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-transform tracking-tight',
        current.badge,
        className
      )}
      {...props}
    >
      {pulseDot && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              current.dot
            )}
          />
          <span
            className={cn(
              'relative inline-flex rounded-full h-1.5 w-1.5',
              current.dot
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
