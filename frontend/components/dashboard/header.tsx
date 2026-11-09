"use client";

import Link from "next/link";
import { TenantSelector } from "./tenant-selector";
import { ShieldCheck, Bell, User, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/90 px-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
            ZT
          </div>
          <span className="font-semibold tracking-tight text-zinc-100 hidden sm:inline-block">
            ZeroTrust<span className="text-emerald-400">.AI</span>
          </span>
        </Link>
        <span className="text-zinc-700">/</span>
        <TenantSelector />
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1 text-xs text-emerald-400">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>Zero-Trust Guard: Active</span>
        </div>

        <button className="relative rounded-lg border border-zinc-800 p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
          <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs text-zinc-300 font-medium">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}

