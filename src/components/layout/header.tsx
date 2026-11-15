'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { GlassBadge } from '@/components/ui/glass-badge';

const routeTitles: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: 'Operations Overview',
    subtitle: 'Real-time metrics, order throughput & inventory threshold status',
  },
  '/orders': {
    title: 'Orders Management',
    subtitle: 'Customer purchase orders, fulfillment statuses & payment records',
  },
  '/inventory': {
    title: 'Inventory & Stock Control',
    subtitle: 'Live stock quantities, reorder points & critical automotive parts',
  },
  '/customers': {
    title: 'Customer Directory',
    subtitle: 'Customer contacts, order histories & automotive client profiles',
  },
  '/analytics': {
    title: 'Performance Analytics',
    subtitle: 'Fulfillment velocity, sales totals & inventory turnover rates',
  },
};

interface HeaderProps {
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

export function Header({ onMenuToggle, isSidebarOpen }: HeaderProps) {
  const pathname = usePathname();
  const currentRoute = routeTitles[pathname] || {
    title: 'Dashboard',
    subtitle: 'Operational control plane',
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-slate-950/60 border-b border-white/10 px-4 sm:px-8 py-4 flex items-center justify-between">
      {/* Left: Mobile Toggle + Section Breadcrumb */}
      <div className="flex items-center gap-3">
        {/* Mobile menu toggle button (single control, changes icon based on state) */}
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white bg-white/5 border border-white/10 transition-colors"
          aria-label={isSidebarOpen ? 'Close navigation' : 'Open navigation'}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
            {currentRoute.title}
          </h1>
          <p className="hidden sm:block text-[11px] text-slate-400">
            {currentRoute.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Live Connection Status Pill */}
      <div className="flex items-center gap-3">
        <GlassBadge variant="emerald" pulseDot>
          Live Database Sync
        </GlassBadge>
      </div>
    </header>
  );
}

