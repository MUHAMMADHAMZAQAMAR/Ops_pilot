import React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'inset';
  hoverEffect?: boolean;
  animate?: boolean;
}

export function GlassCard({
  children,
  className,
  variant = 'default',
  hoverEffect = false,
  animate = true,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        variant === 'default'
          ? 'glass-panel rounded-[26px] p-6 text-slate-100'
          : 'glass-panel-inset rounded-[20px] p-4 text-slate-100',
        animate && 'animate-fade-in-up',
        hoverEffect && 'glass-panel-interactive',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
