'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, useAuth } from '@/lib/auth';
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronLeft,
  ClipboardList,
  FileText,
  FolderOpen,
  HelpCircle,
  House,
  KeyRound,
  ListChecks,
  LogOut,
  Settings,
  ShoppingBag,
  Smartphone,
  UserRound,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { canManageTeam } from '@/lib/utils/permissions';
import { useDashboardShopify } from '@/components/dashboard/ShopifyStatusProvider';

const MASTER_ADMINS = ['sufyanali@gmail.com', 'daniyal@cartaisy.com'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

type NavTier = 'primary' | 'later' | 'account';

interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  tier: NavTier;
  group: string;
  requiresRole?: 'super_admin' | 'admin';
  requiresMasterAdmin?: boolean;
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
  showSignOut?: boolean;
  inSheet?: boolean;
  onNavigate?: () => void;
}

function isItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  showSignOut = false,
  inSheet = false,
  onNavigate,
}: SidebarContentProps) {
  const { data: session } = useSession();
  const { logout, getToken } = useAuth();
  const { status, isLoading } = useDashboardShopify();
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  const storeId = session?.user?.storeId;
  const storeName = session?.user?.storeName || 'Your store';
  const userName = session?.user?.name || session?.user?.email || 'Account';
  const storeInitial = storeName.charAt(0).toUpperCase();
  const shopifyKnownDisconnected = !isLoading && status?.isConnected === false;

  useEffect(() => {
    const fetchBranding = async () => {
      if (!storeId) return;
      try {
        const token = getToken();
        const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.data?.logoUrl) {
            setStoreLogo(data.data.logoUrl);
          }
        }
      } catch (err) {
        console.error('Failed to fetch store branding:', err);
      }
    };
    fetchBranding();
    // getToken is stable enough for this mount fetch; including it retriggers on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const baseNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Home', icon: <House className="size-4" />, tier: 'primary', group: 'Primary' },
    {
      href: '/dashboard/onboarding',
      label: 'Set up app',
      icon: <ListChecks className="size-4" />,
      tier: 'primary',
      group: 'Primary',
    },
    {
      href: '/dashboard/app-builder',
      label: 'App builder',
      icon: <Smartphone className="size-4" />,
      tier: 'later',
      group: 'Store',
    },
    {
      href: '/dashboard/orders',
      label: 'Orders',
      icon: <ShoppingBag className="size-4" />,
      tier: 'later',
      group: 'Store',
    },
    {
      href: '/dashboard/customers',
      label: 'Customers',
      icon: <UserRound className="size-4" />,
      tier: 'later',
      group: 'Store',
    },
    {
      href: '/dashboard/collections',
      label: 'Collections',
      icon: <FolderOpen className="size-4" />,
      tier: 'later',
      group: 'Store',
    },
    {
      href: '/dashboard/analytics',
      label: 'Analytics',
      icon: <BarChart3 className="size-4" />,
      tier: 'later',
      group: 'Insights',
    },
    {
      href: '/dashboard/activity',
      label: 'Activity',
      icon: <ClipboardList className="size-4" />,
      tier: 'later',
      group: 'Insights',
    },
    {
      href: '/dashboard/help-requests',
      label: 'Help requests',
      icon: <HelpCircle className="size-4" />,
      tier: 'later',
      group: 'Insights',
    },
    {
      href: '/dashboard/marketing/push-notifications',
      label: 'Push notifications',
      icon: <Bell className="size-4" />,
      tier: 'later',
      group: 'Insights',
    },
    {
      href: '/dashboard/blog',
      label: 'Blog',
      icon: <FileText className="size-4" />,
      tier: 'account',
      group: 'Account',
      requiresRole: 'super_admin',
    },
    {
      href: '/dashboard/team',
      label: 'Team',
      icon: <Users className="size-4" />,
      tier: 'account',
      group: 'Account',
      requiresRole: 'super_admin',
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: <Settings className="size-4" />,
      tier: 'account',
      group: 'Account',
    },
    {
      href: '/dashboard/admin/onboarding',
      label: 'Invites',
      icon: <KeyRound className="size-4" />,
      tier: 'account',
      group: 'Account',
      requiresMasterAdmin: true,
    },
  ];

  const navItems = baseNavItems.filter((item) => {
    if (item.requiresMasterAdmin) {
      return session?.user?.email && MASTER_ADMINS.includes(session.user.email);
    }
    if (item.requiresRole === 'super_admin') {
      return canManageTeam(session?.user?.role);
    }
    return true;
  });

  const groups = visibleGroups(navItems, shopifyKnownDisconnected);

  return (
    <div className="flex h-full flex-col bg-white">
      <div
        className={cn(
          'flex h-14 shrink-0 items-center border-b border-slate-200',
          collapsed ? 'justify-center px-2' : 'gap-2.5 px-3',
          inSheet && 'pr-10'
        )}
      >
        {collapsed ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="size-8 rounded-lg p-0 hover:bg-slate-100"
            aria-label="Expand sidebar"
          >
            <StoreMark logo={storeLogo} initial={storeInitial} />
          </Button>
        ) : (
          <>
            <StoreMark logo={storeLogo} initial={storeInitial} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-slate-950">{storeName}</p>
              <p className="truncate text-xs text-slate-500">{userName}</p>
            </div>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="size-7 shrink-0 p-0 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
                aria-label="Collapse sidebar"
              >
                <ChevronLeft className="size-3.5" />
              </Button>
            )}
          </>
        )}
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3" aria-label="Dashboard">
        {groups.map((group) => (
          <NavGroup key={group.id} group={group} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>

      {showSignOut && (
        <div className="border-t border-slate-200 p-2">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950"
          >
            <LogOut className="size-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </div>
  );
}

function NavGroup({
  group,
  collapsed,
  onNavigate,
}: {
  group: { id: string; label: string | null; items: NavItem[]; muted: boolean };
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const containsActive = group.items.some((item) => isItemActive(pathname, item.href));
  const [opened, setOpened] = useState(containsActive);
  const expanded = !group.muted || collapsed || opened || containsActive;

  return (
    <div>
      {group.label && !collapsed &&
        (group.muted ? (
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setOpened((value) => !value)}
            className="flex min-h-11 w-full items-center justify-between rounded-md px-2.5 text-left text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            {group.label}
            <ChevronDown className={cn('size-3.5 shrink-0 transition-transform', expanded ? '' : '-rotate-90')} />
          </button>
        ) : (
          <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">
            {group.label}
          </p>
        ))}
      {expanded && (
        <ul className="space-y-0.5">
          {group.items.map((item) => {
            const isActive = isItemActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : group.muted ? 'Available after Shopify is connected' : undefined}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center rounded-md text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
                    collapsed ? 'justify-center p-2.5' : 'gap-2.5 px-2.5 py-2',
                    isActive
                      ? 'bg-slate-100 font-medium text-slate-950'
                      : group.muted
                        ? 'text-slate-500 hover:bg-slate-50 hover:text-slate-950'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0',
                      isActive ? 'text-slate-950' : group.muted ? 'text-slate-400' : 'text-slate-500'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function visibleGroups(items: NavItem[], muteLater: boolean) {
  const grouped: { id: string; label: string | null; items: NavItem[]; muted: boolean }[] = [];
  const push = (id: string, label: string | null, item: NavItem, muted: boolean) => {
    const existing = grouped.find((group) => group.id === id);
    if (existing) existing.items.push(item);
    else grouped.push({ id, label, items: [item], muted });
  };

  for (const item of items) {
    if (item.tier === 'later' && muteLater) {
      push('later', 'After you connect', item, true);
      continue;
    }
    if (item.tier === 'primary') {
      push('primary', null, item, false);
      continue;
    }
    push(item.group, item.group, item, false);
  }

  return grouped;
}

function StoreMark({ logo, initial }: { logo: string | null; initial: string }) {
  if (logo) {
    // Store logos are merchant-hosted URLs, not files in this app.
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logo} alt="" className="size-8 shrink-0 rounded-lg object-cover" />;
  }
  return (
    <span
      aria-hidden
      className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white"
    >
      {initial}
    </span>
  );
}

interface SidebarProps {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <aside
        className={cn(
          'hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 md:flex',
          collapsed ? 'w-[72px]' : 'w-60'
        )}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={() => setCollapsed((value) => !value)} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-64 gap-0 bg-white p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <SidebarContent
            collapsed={false}
            showSignOut
            inSheet
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
