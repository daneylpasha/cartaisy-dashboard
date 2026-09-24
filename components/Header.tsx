'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, useAuth } from '@/lib/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, Menu, Settings } from 'lucide-react';
import { useDashboardShopify } from '@/components/dashboard/ShopifyStatusProvider';
import { pageTitle } from '@/lib/dashboard/pageTitle';

interface HeaderProps {
  onOpenMenu: () => void;
}

export function Header({ onOpenMenu }: HeaderProps) {
  const pathname = usePathname();
  const title = pageTitle(pathname);
  const { data: session } = useSession();
  const { logout } = useAuth();
  const { status, isLoading, error, refetch } = useDashboardShopify();

  const name = session?.user?.name || session?.user?.email || 'Account';
  const initials = initialsFrom(name);
  const shop = status?.shop?.replace('.myshopify.com', '') || status?.shop;

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 sm:gap-3 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenMenu}
        className="size-9 shrink-0 text-slate-700 md:hidden"
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <p className="min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight text-slate-950">{title}</p>

      <div className="flex shrink-0 items-center gap-2">
        <ConnectionStatus
          isLoading={isLoading}
          unknown={!isLoading && !status && !!error}
          connected={status?.isConnected === true}
          shop={shop ?? null}
          onRetry={() => {
            void refetch();
          }}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-9 rounded-full p-0" aria-label="Account menu">
              <Avatar className="size-8">
                <AvatarFallback className="bg-slate-950 text-xs font-semibold text-white">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="space-y-0.5">
              <span className="block truncate text-sm font-medium text-slate-950">{name}</span>
              {session?.user?.email && (
                <span className="block truncate text-xs font-normal text-slate-500">{session.user.email}</span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="text-sm">
              <Link href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="size-3.5" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex items-center gap-2 text-sm text-slate-700"
            >
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function ConnectionStatus({
  isLoading,
  unknown,
  connected,
  shop,
  onRetry,
}: {
  isLoading: boolean;
  unknown: boolean;
  connected: boolean;
  shop: string | null;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <span className="h-8 w-24 animate-pulse rounded-full bg-slate-100 motion-reduce:animate-none" aria-hidden />;
  }

  if (unknown) {
    return (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-8 items-center rounded-full px-2 text-[13px] text-slate-500 transition-colors hover:text-slate-950"
      >
        Retry status
      </button>
    );
  }

  if (connected) {
    return (
      <Link
        href="/dashboard/settings"
        className="inline-flex h-8 max-w-[9.5rem] items-center gap-2 rounded-full bg-slate-50 px-2.5 text-[13px] text-slate-700 transition-colors hover:bg-slate-100 sm:max-w-[16rem] sm:px-3"
      >
        <span className="size-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden />
        <span className="truncate">{shop || 'Shopify connected'}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/dashboard/onboarding?step=connect"
      className="inline-flex h-8 items-center rounded-full border border-slate-300 bg-white px-3 text-[13px] font-medium text-slate-950 transition-colors hover:bg-slate-50"
    >
      <span className="sm:hidden">Connect</span>
      <span className="hidden sm:inline">Connect Shopify</span>
    </Link>
  );
}

function initialsFrom(name: string): string {
  const parts = name
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}
