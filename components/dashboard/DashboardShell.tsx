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

const DASHBOARD_SURFACE = '#f6f6f7';

function DashboardFrame({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[#f6f6f7] text-slate-950">
      {/* Marketing pages paint html #0A0A0A. This frame is the only dashboard
          scrollport, on the same light surface, so a leaked descendant cannot
          open a black gap under the sidebar. */}
      <style>{`html, body { background-color: ${DASHBOARD_SURFACE} !important; }`}</style>
      <Sidebar mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
