import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'card' | 'text' | 'badge' | 'avatar' | 'button';
}

export function GlassSkeleton({
  className,
  variant = 'text',
  ...props
}: GlassSkeletonProps) {
  const baseClasses = 'animate-pulse bg-white/[0.05] border border-white/[0.08]';

  const variantClasses = {
    text: 'h-4 w-full rounded-md',
    badge: 'h-6 w-20 rounded-full',
    avatar: 'h-10 w-10 rounded-full',
    button: 'h-10 w-28 rounded-full',
    card: 'rounded-2xl sm:rounded-3xl p-6 bg-white/[0.04] shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]',
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
    />
  );
}

