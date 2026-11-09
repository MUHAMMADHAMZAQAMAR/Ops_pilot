"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FilePlus2,
  Workflow,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  Settings,
  Shield,
} from "lucide-react";

const navigationItems = [
  { name: "Executive Overview", href: "/", icon: LayoutDashboard },
  { name: "Business Requests", href: "/requests", icon: FilePlus2 },
  { name: "Agent Runs", href: "/runs", icon: Workflow },
  { name: "Approvals (HITL)", href: "/approvals", icon: CheckCircle2, badge: "Pending" },
  { name: "Tools Registry", href: "/tools", icon: Wrench },
  { name: "Tamper-Evident Audit", href: "/audit", icon: ShieldAlert },
  { name: "Organization & RBAC", href: "/settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div className="space-y-1">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Platform Modules
          </p>
          <nav className="mt-2 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-400 border border-amber-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Security Status Box */}
      <div className="p-4 border-t border-zinc-800">
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <Shield className="h-4 w-4" />
            <span>Dual-Boundary Guard</span>
          </div>
          <p className="text-zinc-400 text-[11px] leading-relaxed">
            All LLM outputs treated as inert data. High-risk mutations require cryptographic sign-off.
          </p>
        </div>
      </div>
    </aside>
  );
}

