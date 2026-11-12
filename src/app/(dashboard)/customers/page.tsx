import React from 'react';
import { GlassCard } from '@/components/ui/glass-card';
import { GlassBadge } from '@/components/ui/glass-badge';
import { Users, Mail, Phone, Calendar } from 'lucide-react';
import { getCustomers } from '@/features/customers/services/customers.service';

export default async function CustomersPage() {
  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      {/* Metric Header Card */}
      <GlassCard>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-2xl bg-white/[0.08] border border-white/10 flex items-center justify-center text-white">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Automotive Client Accounts
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Active customer profiles & communication channels
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GlassBadge variant="cyan" pulseDot>
              {customers.length} Verified Accounts
            </GlassBadge>
          </div>
        </div>
      </GlassCard>

      {/* Customer Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {customers.map((c) => (
          <GlassCard key={c.id} hoverEffect className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#c8f135] to-[#22d3ee] flex items-center justify-center text-slate-950 font-bold text-xs shadow-sm">
                  {c.name.charAt(0)}
                </div>
                <GlassBadge variant="glass">Active Client</GlassBadge>
              </div>

              <h3 className="text-sm font-bold text-white tracking-tight">{c.name}</h3>

              <div className="space-y-2 mt-4 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span className="truncate">{c.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{c.phone || '+1 555-0100'}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-slate-500" />
                Joined {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <span className="font-semibold text-[#c8f135]">Verified</span>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
