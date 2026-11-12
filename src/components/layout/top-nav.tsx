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
} from 'lucide-react';
import { signout } from '@/app/(auth)/login/actions';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Requests', href: '/requests' },
  { name: 'Approvals', href: '/approvals' },
  { name: 'Runs', href: '/runs' },
  { name: 'Drafts', href: '/drafts' },
  { name: 'Orders', href: '/orders' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Customers', href: '/customers' },
  { name: 'Analytics', href: '/analytics' },
];

interface TopNavProps {
  userEmail?: string | null;
}

export function TopNav({ userEmail }: TopNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 tracking-tight cursor-pointer active:scale-95',
                    isActive
                      ? 'glass-pill-active text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] hover:scale-105'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Right: Operator Profile & Sign-Out */}
          <div className="flex items-center gap-2 pr-1">
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

