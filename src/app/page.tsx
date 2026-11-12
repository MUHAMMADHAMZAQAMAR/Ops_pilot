import Link from 'next/link';
import {
  ShieldCheck,
  Database,
  ArrowRight,
  Zap,
  Cpu,
  Layers,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { GlassButton } from '@/components/ui/glass-button';

export default function HomePage() {
  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col justify-between p-6 sm:p-12 overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto w-full flex-1 flex flex-col justify-between">
        {/* Header Bar */}
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 shadow-[0_0_20px_rgba(200,241,53,0.4)]">
              <Zap className="w-5 h-5 fill-slate-950 text-slate-950" />
            </div>
            <div>
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white block">
                OpsPilot
              </span>
              <span className="text-[11px] font-medium text-slate-400 block -mt-0.5">
                Automotive Operations Assistant
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <Link href="/api/health" target="_blank">
              <GlassBadge variant="lime" pulseDot>
                API Healthy
              </GlassBadge>
            </Link>
            <Link href="/login">
              <GlassButton variant="lime">
                Operator Sign In <ArrowRight className="w-3.5 h-3.5" />
              </GlassButton>
            </Link>
          </nav>
        </header>

        {/* Hero Area */}
        <main className="py-16 sm:py-20">
          <div className="inline-flex mb-6">
            <GlassBadge variant="cyan" pulseDot>
              Pure Frosted Glass UI Active
            </GlassBadge>
          </div>

          <h1 className="text-3xl sm:text-6xl font-black tracking-tight text-white max-w-3xl leading-[1.1]">
            Next-Gen Automotive E-Commerce Control Center
          </h1>
          <p className="mt-5 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            Real-time fulfillment tracking, inventory reorder alerts, and customer
            directory management powered by Supabase PostgreSQL and Next.js 15.
          </p>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-12">
            <GlassCard hoverEffect>
              <div className="flex items-center gap-2.5 text-[#c8f135] font-semibold text-xs mb-2">
                <Layers className="w-4 h-4" /> Frosted Smoked Glass
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hyper-realistic translucent glass panels with ambient background light refraction.
              </p>
            </GlassCard>

            <GlassCard hoverEffect>
              <div className="flex items-center gap-2.5 text-[#22d3ee] font-semibold text-xs mb-2">
                <Database className="w-4 h-4" /> Live Supabase Synced
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                PostgreSQL schema, automotive seed catalog, and Row Level Security active.
              </p>
            </GlassCard>

            <GlassCard hoverEffect>
              <div className="flex items-center gap-2.5 text-[#fbbf24] font-semibold text-xs mb-2">
                <ShieldCheck className="w-4 h-4" /> Operator Authentication
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Session cookies managed via Next.js SSR middleware and Supabase Auth.
              </p>
            </GlassCard>
          </div>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link href="/login">
              <GlassButton variant="lime" className="py-3 px-6 text-sm">
                Enter Operator Portal <ArrowRight className="w-4 h-4" />
              </GlassButton>
            </Link>
            <Link href="/dashboard">
              <GlassButton variant="primary" className="py-3 px-5 text-sm">
                Direct to Dashboard
              </GlassButton>
            </Link>
          </div>
        </main>

        {/* Footer */}
        <footer className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>OpsPilot Phase 1 Implementation</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#c8f135]">
              <Cpu className="w-3.5 h-3.5" /> Next.js 15 App Router
            </span>
            <span className="text-slate-300">Supabase Auth Verified</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
