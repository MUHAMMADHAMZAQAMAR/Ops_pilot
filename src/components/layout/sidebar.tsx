'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Boxes,
  Users,
  LineChart,
  LogOut,
  Zap,
} from 'lucide-react';
import { signout } from '@/app/(auth)/login/actions';
import { cn } from '@/lib/utils';
import { GlassBadge } from '@/components/ui/glass-badge';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    icon: Boxes,
  },
  {
    name: 'Customers',
    href: '/customers',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: LineChart,
  },
];

interface SidebarProps {
  userEmail?: string | null;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ userEmail, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop overlay (clicks outside close sidebar) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col justify-between p-5',
          'bg-slate-950/70 backdrop-blur-xl border-r border-white/10 text-slate-200',
          'transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Top: Brand Header */}
        <div>
          <div className="flex items-center justify-between pb-6 mb-6 border-b border-white/10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group"
              onClick={onClose}
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-[0_0_20px_rgba(139,92,246,0.5)] group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block">
                  OpsPilot
                </span>
                <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
                  Automotive Ops
                </span>
              </div>
            </Link>

            <GlassBadge variant="violet" pulseDot>
              Phase 1
            </GlassBadge>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-gradient-to-r from-violet-600/30 to-violet-600/10 text-white border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.25)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'w-4 h-4 transition-colors',
                        isActive
                          ? 'text-violet-400'
                          : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                    <span>{item.name}</span>
                  </div>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Operator Identity & Unmistakable 1-Click Sign Out */}
        <div className="pt-4 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-0.5">
              Active Operator
            </div>
            <div className="text-xs font-semibold text-slate-200 truncate">
              {userEmail || 'operator@opspilot.internal'}
            </div>
          </div>

          <form action={signout}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer active:scale-[0.98]"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

