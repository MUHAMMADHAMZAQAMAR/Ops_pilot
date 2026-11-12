import React from 'react';
import { headers } from 'next/headers';
import { TopNav } from '@/components/layout/top-nav';

export const dynamic = 'force-dynamic';

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
    <div className="relative min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Container */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        <TopNav userEmail={userEmail} />
        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}
