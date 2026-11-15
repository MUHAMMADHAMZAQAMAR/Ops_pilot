import React from 'react';
import Link from 'next/link';
import { getComplianceReportData } from '@/features/reports/services/reports.service';
import { ComplianceReportsView } from '@/features/reports/components/compliance-reports-view';
import { GlassButton } from '@/components/ui/glass-button';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'Audit & Compliance Reports | OpsPilot',
  description: 'Exportable audit logs of autonomous agent runs, human authorization gates, and customer notices.',
};

export default async function ComplianceReportsPage() {
  const reportData = await getComplianceReportData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#c8f135]">
            <ShieldCheck className="w-4 h-4" />
            <span>Governance & Auditability</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
            Compliance & Audit Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Immutable operational ledger of every AI directive, human approval decision, and dispatched customer notice. Export filtered trails in CSV or JSON.
          </p>
        </div>

        <div className="shrink-0">
          <Link href="/analytics">
            <GlassButton variant="secondary">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Analytics</span>
            </GlassButton>
          </Link>
        </div>
      </div>

      <ComplianceReportsView data={reportData} />
    </div>
  );
}
