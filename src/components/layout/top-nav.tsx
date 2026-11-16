'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Search,
  LogOut,
  Menu,
  X,
  Zap,
  Settings,
  Users,
  Activity,
} from 'lucide-react';
import { signout } from '@/app/(auth)/login/actions';
import { cn } from '@/lib/utils';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import { LiveActivityBell } from '@/features/realtime/components/live-activity-bell';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Requests', href: '/requests' },
  { name: 'Approvals', href: '/approvals' },
  { name: 'Runs', href: '/runs' },
  { name: 'Drafts', href: '/drafts' },
  { name: 'Automation', href: '/automation' },
  { name: 'Orders', href: '/orders' },
  { name: 'Returns', href: '/returns' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Forecast', href: '/forecast' },
  { name: 'Suppliers', href: '/suppliers' },
  { name: 'Integrations', href: '/integrations' },
  { name: 'Customers', href: '/customers' },
  { name: 'Analytics', href: '/analytics' },
];

interface TopNavProps {
  userEmail?: string | null;
}

export function TopNav({ userEmail }: TopNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { counts } = useRealtimeTelemetry();

  // Extract display name or fallback from env
  const fallbackName = process.env.NEXT_PUBLIC_DEFAULT_OPERATOR_NAME || 'Operator';
  const displayName = userEmail
    ? userEmail.split('@')[0].replace(/[._]/g, ' ')
    : fallbackName;

  return (
    <>
      {/* Floating Glass Capsule Navigation Bar (as seen in the reference image) */}
      <header className="sticky top-4 z-40 w-full mb-8">
        <div className="glass-panel rounded-full px-3 py-2.5 flex items-center justify-between gap-2 max-w-7xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
          {/* Left: Brand Pod with Search Pill */}
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full hover:bg-white/[0.06] transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(200,241,53,0.4)]">
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline-block">
                OpsPilot
              </span>
            </Link>

            <div className="h-9 w-9 rounded-full bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:flex">
              <Search className="w-4 h-4" />
            </div>
          </div>

          {/* Center: Glass Pill Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard' || pathname === '/'
                  : pathname.startsWith(item.href);

              const badgeCount =
                item.href === '/approvals'
                  ? counts.pendingApprovals
                  : item.href === '/drafts'
                    ? counts.pendingDrafts
                    : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300 tracking-tight cursor-pointer active:scale-95 flex items-center gap-1.5',
                    isActive
                      ? 'glass-pill-active text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] hover:scale-105'
                  )}
                >
                  <span>{item.name}</span>
                  {badgeCount > 0 && (
                    <span
                      className={cn(
                        'px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight',
                        item.href === '/approvals'
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          : 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                      )}
                    >
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right: Live Telemetry Bell, Operator Profile & Sign-Out */}
          <div className="flex items-center gap-2 pr-1">
            <LiveActivityBell />

            <Link
              href="/system"
              className={cn(
                'h-8 w-8 rounded-full border flex items-center justify-center transition-all cursor-pointer',
                pathname.startsWith('/system')
                  ? 'bg-white/20 border-white/35 text-white'
                  : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-slate-400 hover:text-white'
              )}
              title="System Health & Incidents"
              aria-label="System Health & Incidents"
            >
              <Activity className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/team"
              className={cn(
                'h-8 w-8 rounded-full border flex items-center justify-center transition-all cursor-pointer',
                pathname.startsWith('/team')
                  ? 'bg-white/20 border-white/35 text-white'
                  : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-slate-400 hover:text-white'
              )}
              title="Team & RBAC"
              aria-label="Team & RBAC"
            >
              <Users className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/settings"
              className={cn(
                'h-8 w-8 rounded-full border flex items-center justify-center transition-all cursor-pointer',
                pathname.startsWith('/settings')
                  ? 'bg-white/20 border-white/35 text-white'
                  : 'bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-slate-400 hover:text-white'
              )}
              title="Operator Settings"
              aria-label="Operator Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden sm:inline capitalize">
                {displayName}
              </span>
            </div>

            <form action={signout}>
              <button
                type="submit"
                className="h-8 w-8 rounded-full bg-white/[0.04] hover:bg-rose-500/20 border border-white/10 hover:border-rose-500/30 flex items-center justify-center text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                title="Log Out"
                aria-label="Log Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Mobile Hamburger Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-full text-slate-300 hover:text-white bg-white/[0.05] border border-white/10"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-2 p-3 rounded-3xl glass-panel space-y-1 animate-in fade-in slide-in-from-top-2">
            {navItems.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard' || pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'block px-4 py-2.5 rounded-2xl text-xs font-medium transition-all',
                    isActive
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>
    </>
  );
}

