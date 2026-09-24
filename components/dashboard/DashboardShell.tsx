'use client';

import { useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ShopifyStatusProvider } from '@/components/dashboard/ShopifyStatusProvider';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isOnboarding =
    pathname === '/dashboard/onboarding' || pathname.startsWith('/dashboard/onboarding/');

  if (isOnboarding) {
    return <div className="min-h-screen bg-[#f5f5f6]">{children}</div>;
  }

  return (
    <ShopifyStatusProvider>
      <DashboardFrame>{children}</DashboardFrame>
    </ShopifyStatusProvider>
  );
}

function DashboardFrame({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#f6f6f7] text-slate-950">
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-auto px-4 py-5 sm:px-6 sm:py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
