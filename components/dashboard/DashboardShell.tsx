'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const isOnboarding = pathname === '/dashboard/onboarding' || pathname.startsWith('/dashboard/onboarding/');

  if (isOnboarding) {
    return <div className="min-h-screen bg-[#f5f5f6]">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col md:pt-0 pt-16">
        <Header title="Dashboard" />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
