'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';

interface DashboardClientShellProps {
  children: React.ReactNode;
  userEmail?: string | null;
}

export function DashboardClientShell({
  children,
  userEmail,
}: DashboardClientShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-[#080B12] text-slate-100 flex overflow-hidden">
      {/* Background Ambient Atmospheric Light Orbs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Violet upper glow */}
        <div className="absolute -top-40 -left-20 w-[550px] h-[550px] bg-violet-600/15 rounded-full blur-[140px]" />
        {/* Cyber Mint/Teal lower glow */}
        <div className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[160px]" />
        {/* Deep Indigo center glow */}
        <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[150px]" />
      </div>

      {/* Smoked Glass Sidebar */}
      <Sidebar
        userEmail={userEmail}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col lg:pl-72 w-full min-w-0">
        <Header
          isSidebarOpen={isSidebarOpen}
          onMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

