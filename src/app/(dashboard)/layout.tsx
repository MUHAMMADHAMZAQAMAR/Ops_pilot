import React from 'react';
import { headers } from 'next/headers';
import { TopNav } from '@/components/layout/top-nav';
import { RealtimeProvider } from '@/features/realtime/components/realtime-provider';
import { CopilotDrawer } from '@/features/copilot/components/copilot-drawer';

const EMPTY_COUNTS = {
  pendingApprovals: 0,
  pendingDrafts: 0,
  activeRuns: 0,
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();

  const userEmail =
    headerList.get('x-user-email') ||
    process.env.NEXT_PUBLIC_DEMO_OPERATOR_EMAIL ||
    '';

  return (
    <RealtimeProvider initialCounts={EMPTY_COUNTS}>
      <div className="relative min-h-screen p-4 sm:p-6 lg:p-8">
        {/* Container */}
        <div className="relative z-10 max-w-7xl mx-auto w-full">
          <TopNav userEmail={userEmail} />
          <main className="w-full">{children}</main>
        </div>
        <CopilotDrawer />
      </div>
    </RealtimeProvider>
  );
}
