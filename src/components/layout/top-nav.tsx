'use client';

import React, { useEffect, useRef, useState } from 'react';
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
  ChevronDown,
} from 'lucide-react';
import { signout } from '@/app/(auth)/login/actions';
import { cn } from '@/lib/utils';
import { useRealtimeTelemetry } from '@/features/realtime/components/realtime-provider';
import { LiveActivityBell } from '@/features/realtime/components/live-activity-bell';
import { CommandSearch } from '@/components/layout/command-search';

interface NavItem {
  name: string;
  href: string;
  description?: string;
}

const primaryNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Requests', href: '/requests' },
  { name: 'Approvals', href: '/approvals' },
  { name: 'Runs', href: '/runs' },
  { name: 'Orders', href: '/orders' },
  { name: 'Inventory', href: '/inventory' },
];

const operationsGroupItems: NavItem[] = [
  { name: 'Drafts', href: '/drafts', description: 'Customer comms & email staging' },
  { name: 'Automation', href: '/automation', description: 'Scheduled jobs & triggers' },
  { name: 'Returns', href: '/returns', description: 'RMA & refund processing' },
  { name: 'Suppliers', href: '/suppliers', description: 'Vendor & restock directory' },
  { name: 'Customers', href: '/customers', description: 'Client profiles & history' },
];

const intelligenceGroupItems: NavItem[] = [
  { name: 'Analytics', href: '/analytics', description: 'KPIs & compliance reports' },
  { name: 'Forecast', href: '/forecast', description: 'Demand & depletion projections' },
  { name: 'Integrations', href: '/integrations', description: 'Webhooks & external apps' },
];

const allNavItems: NavItem[] = [
  ...primaryNavItems,
  ...operationsGroupItems,
  ...intelligenceGroupItems,
];

interface TopNavProps {
  userEmail?: string | null;
}

export function TopNav({ userEmail }: TopNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'operations' | 'intelligence' | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const { counts } = useRealtimeTelemetry();

  const fallbackName = process.env.NEXT_PUBLIC_DEFAULT_OPERATOR_NAME || 'Operator';
  const displayName = userEmail
    ? userEmail.split('@')[0].replace(/[._]/g, ' ')
    : fallbackName;

  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpenDropdown(null);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpenDropdown(null);
        setSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const isRouteActive = (href: string) =>
    href === '/dashboard'
      ? pathname === '/dashboard' || pathname === '/'
      : pathname.startsWith(href);

  const isOperationsActive = operationsGroupItems.some((item) => isRouteActive(item.href));
  const isIntelligenceActive = intelligenceGroupItems.some((item) => isRouteActive(item.href));

  return (
    <>
      {/* Floating Glass Capsule Navigation Bar */}
      <header ref={navRef} className="sticky top-4 z-40 w-full mb-8">
        <div className="glass-panel rounded-full px-3 py-2 flex items-center justify-between gap-2 max-w-7xl mx-auto shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
          {/* Left: Brand Pod with Search Pill */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 pl-2 pr-3 py-1 rounded-full hover:bg-white/[0.06] transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(200,241,53,0.4)] shrink-0">
                <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white hidden sm:inline-block">
                OpsPilot
              </span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setOpenDropdown(null);
                setSearchOpen(true);
              }}
              className="h-9 px-2.5 xl:px-3 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Search pages & modules (Ctrl+K)"
              aria-label="Open global search"
            >
              <Search className="w-4 h-4 shrink-0" />
              <span className="hidden xl:inline text-[11px] font-mono text-slate-400">
                ⌘K
              </span>
            </button>
          </div>

          {/* Center: Glass Pill Navigation Tabs + Grouped Dropdowns */}
          <nav className="hidden lg:flex items-center gap-1">
            {primaryNavItems.map((item) => {
              const active = isRouteActive(item.href);
              const badgeCount = item.href === '/approvals' ? counts.pendingApprovals : 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 tracking-tight cursor-pointer active:scale-95 flex items-center gap-1.5 whitespace-nowrap',
                    active
                      ? 'glass-pill-active text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.08]'
                  )}
                >
                  <span>{item.name}</span>
                  {badgeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Operations Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown((prev) => (prev === 'operations' ? null : 'operations'))
                }
                aria-expanded={openDropdown === 'operations'}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 tracking-tight cursor-pointer flex items-center gap-1 whitespace-nowrap',
                  isOperationsActive || openDropdown === 'operations'
                    ? 'glass-pill-active text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.08]'
                )}
              >
                <span>Operations</span>
                {counts.pendingDrafts > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold leading-tight bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                    {counts.pendingDrafts}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    openDropdown === 'operations' && 'rotate-180'
                  )}
                />
              </button>

              {openDropdown === 'operations' && (
                <div className="absolute left-0 mt-3 w-64 p-2 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.85)] z-50">
                  {operationsGroupItems.map((item) => {
                    const active = isRouteActive(item.href);
                    const badgeCount = item.href === '/drafts' ? counts.pendingDrafts : 0;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          'flex items-center justify-between px-3 py-2 rounded-xl transition-colors',
                          active
                            ? 'bg-white/15 text-white'
                            : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                        )}
                      >
                        <div>
                          <div className="text-xs font-semibold">{item.name}</div>
                          {item.description && (
                            <div className="text-[11px] text-slate-400">{item.description}</div>
                          )}
                        </div>
                        {badgeCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                            {badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Intelligence Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown((prev) => (prev === 'intelligence' ? null : 'intelligence'))
                }
                aria-expanded={openDropdown === 'intelligence'}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 tracking-tight cursor-pointer flex items-center gap-1 whitespace-nowrap',
                  isIntelligenceActive || openDropdown === 'intelligence'
                    ? 'glass-pill-active text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.08]'
                )}
              >
                <span>Intelligence</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    openDropdown === 'intelligence' && 'rotate-180'
                  )}
                />
              </button>

              {openDropdown === 'intelligence' && (
                <div className="absolute right-0 mt-3 w-64 p-2 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.85)] z-50">
                  {intelligenceGroupItems.map((item) => {
                    const active = isRouteActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className={cn(
                          'block px-3 py-2 rounded-xl transition-colors',
                          active
                            ? 'bg-white/15 text-white'
                            : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                        )}
                      >
                        <div className="text-xs font-semibold">{item.name}</div>
                        {item.description && (
                          <div className="text-[11px] text-slate-400">{item.description}</div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right: Live Telemetry Bell, Operator Profile & Sign-Out */}
          <div className="flex items-center gap-1.5 pr-1 shrink-0">
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

            <div className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-amber-400 to-rose-500 flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-slate-200 hidden xl:inline capitalize">
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
          <div className="lg:hidden mt-2 p-3 rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_24px_60px_rgba(0,0,0,0.85)] grid grid-cols-2 gap-1 animate-in fade-in slide-in-from-top-2">
            {allNavItems.map((item) => {
              const active = isRouteActive(item.href);
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
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-medium transition-all',
                    active
                      ? 'bg-white/10 text-white font-semibold'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  )}
                >
                  <span>{item.name}</span>
                  {badgeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      <CommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
