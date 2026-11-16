'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  ArrowRight,
  LayoutDashboard,
  Sparkles,
  ShieldCheck,
  Play,
  Mail,
  Clock,
  ShoppingCart,
  RotateCcw,
  Boxes,
  TrendingUp,
  Truck,
  Plug,
  Users,
  LineChart,
  FileText,
  Activity,
  UserCog,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchEntry {
  name: string;
  href: string;
  group: string;
  description: string;
  keywords: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SEARCH_ENTRIES: SearchEntry[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    group: 'Core',
    description: 'Operations overview, critical inventory & recent orders',
    keywords: 'home overview kpi metrics summary',
    icon: LayoutDashboard,
  },
  {
    name: 'AI Requests',
    href: '/requests',
    group: 'AI Orchestration',
    description: 'Submit natural-language directives to Gemini planner',
    keywords: 'prompt directive agent task dispatch intake',
    icon: Sparkles,
  },
  {
    name: 'Approvals Gate',
    href: '/approvals',
    group: 'AI Orchestration',
    description: 'Human-in-the-loop authorization checkpoints',
    keywords: 'approve reject checkpoint human review',
    icon: ShieldCheck,
  },
  {
    name: 'Agent Runs',
    href: '/runs',
    group: 'AI Orchestration',
    description: 'Autonomous execution ledger & step timelines',
    keywords: 'executions telemetry timeline logs steps',
    icon: Play,
  },
  {
    name: 'Drafts Hub',
    href: '/drafts',
    group: 'Operations',
    description: 'Agent-prepared customer fulfillment emails',
    keywords: 'email message comms customer send',
    icon: Mail,
  },
  {
    name: 'Automation',
    href: '/automation',
    group: 'Operations',
    description: 'Scheduled recurring workflows & triggers',
    keywords: 'cron schedule recurring rules',
    icon: Clock,
  },
  {
    name: 'Orders',
    href: '/orders',
    group: 'Supply Chain',
    description: 'Customer purchase orders & fulfillment statuses',
    keywords: 'purchases shipments pending fulfilled',
    icon: ShoppingCart,
  },
  {
    name: 'Returns & RMA',
    href: '/returns',
    group: 'Supply Chain',
    description: 'Return merchandise authorizations & refunds',
    keywords: 'rma refund defective exchange',
    icon: RotateCcw,
  },
  {
    name: 'Inventory',
    href: '/inventory',
    group: 'Supply Chain',
    description: 'Live automotive parts stock & reorder thresholds',
    keywords: 'sku stock parts warehouse low depleted',
    icon: Boxes,
  },
  {
    name: 'Demand Forecast',
    href: '/forecast',
    group: 'Intelligence',
    description: 'Stock depletion & demand projections',
    keywords: 'predict projection restock trend',
    icon: TrendingUp,
  },
  {
    name: 'Suppliers',
    href: '/suppliers',
    group: 'Operations',
    description: 'Vendor directory & replenishment coordination',
    keywords: 'vendors manufacturers purchase restock',
    icon: Truck,
  },
  {
    name: 'Integrations',
    href: '/integrations',
    group: 'Intelligence',
    description: 'Webhooks, ERP & external service connectors',
    keywords: 'api webhook connect slack shopify',
    icon: Plug,
  },
  {
    name: 'Customers',
    href: '/customers',
    group: 'Operations',
    description: 'Automotive client directory & order histories',
    keywords: 'clients accounts directory contacts',
    icon: Users,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    group: 'Intelligence',
    description: 'Fulfillment velocity, revenue & stock health KPIs',
    keywords: 'revenue aov metrics charts turnover',
    icon: LineChart,
  },
  {
    name: 'Compliance Reports',
    href: '/analytics/reports',
    group: 'Intelligence',
    description: 'Exportable operational & audit reports',
    keywords: 'export csv pdf audit compliance',
    icon: FileText,
  },
  {
    name: 'System Health',
    href: '/system',
    group: 'Platform',
    description: 'Service telemetry, uptime & incident monitor',
    keywords: 'incidents health status latency',
    icon: Activity,
  },
  {
    name: 'Team & RBAC',
    href: '/team',
    group: 'Platform',
    description: 'Operator roles, permissions & access control',
    keywords: 'members roles permissions rbac',
    icon: UserCog,
  },
  {
    name: 'Operator Settings',
    href: '/settings',
    group: 'Platform',
    description: 'Profile, notifications & workspace preferences',
    keywords: 'preferences config account',
    icon: Settings,
  },
];

interface CommandSearchProps {
  open: boolean;
  onClose: () => void;
}

export function CommandSearch({ open, onClose }: CommandSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredEntries = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SEARCH_ENTRIES;
    return SEARCH_ENTRIES.filter(
      (entry) =>
        entry.name.toLowerCase().includes(q) ||
        entry.description.toLowerCase().includes(q) ||
        entry.group.toLowerCase().includes(q) ||
        entry.keywords.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  function navigateTo(href: string) {
    onClose();
    router.push(href);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredEntries.length === 0 ? 0 : (prev + 1) % filteredEntries.length
      );
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        filteredEntries.length === 0
          ? 0
          : (prev - 1 + filteredEntries.length) % filteredEntries.length
      );
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEntries[selectedIndex]) {
        navigateTo(filteredEntries[selectedIndex].href);
      } else if (query.trim()) {
        navigateTo('/requests');
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Command Search"
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-slate-950/95 backdrop-blur-2xl border border-white/15 shadow-[0_32px_90px_rgba(0,0,0,0.9)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-4 h-4 text-[#c8f135] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, modules, inventory, orders, analytics..."
            className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 bg-white/[0.06] border border-white/10 hover:text-white"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredEntries.length > 0 ? (
            filteredEntries.map((entry, idx) => {
              const Icon = entry.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={entry.href}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => navigateTo(entry.href)}
                  className={cn(
                    'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-2xl text-left transition-colors cursor-pointer',
                    isSelected
                      ? 'bg-white/15 text-white'
                      : 'text-slate-300 hover:bg-white/[0.06]'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border',
                        isSelected
                          ? 'bg-[#c8f135]/15 border-[#c8f135]/40 text-[#c8f135]'
                          : 'bg-white/[0.04] border-white/10 text-slate-400'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">
                        {entry.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {entry.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/10">
                      {entry.group}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                </button>
              );
            })
          ) : (
            <div className="py-8 px-4 text-center space-y-3">
              <p className="text-xs text-slate-400">
                No matching navigation modules for &ldquo;{query}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => navigateTo('/requests')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#c8f135]/15 border border-[#c8f135]/30 text-[#c8f135] text-xs font-semibold hover:bg-[#c8f135]/25 transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Open AI Requests to run &ldquo;{query}&rdquo;</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-500">
          <span>Use ↑ ↓ to navigate · Enter to open</span>
          <span className="font-mono">Ctrl+K / ⌘K</span>
        </div>
      </div>
    </div>
  );
}
