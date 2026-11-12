import React from 'react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'lime' | 'amber' | 'secondary' | 'danger' | 'ghost';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  className?: string;
}

export function GlassButton({
  children,
  variant = 'primary',
  className,
  ...props
}: GlassButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-white/[0.1] hover:bg-white/[0.16] text-white border border-white/20 shadow-[0_4px_16px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]',
    lime:
      'bg-[#c8f135] hover:bg-[#b8e228] text-slate-950 font-bold shadow-[0_0_20px_rgba(200,241,53,0.35)] border-transparent',
    amber:
      'bg-[#fbbf24] hover:bg-[#f59e0b] text-slate-950 font-bold shadow-[0_0_20px_rgba(251,191,36,0.35)] border-transparent',
    secondary:
      'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
    danger:
      'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30',
    ghost:
      'bg-transparent hover:bg-white/[0.06] text-slate-400 hover:text-white border-transparent',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
