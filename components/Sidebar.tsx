"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, useAuth } from "@/lib/auth";
import {
  ChevronLeft,
  ChevronRight,
  House,
  Smartphone,
  FolderOpen,
  Settings,
  Menu,
  Users,
  UserRound,
  ClipboardList,
  BarChart3,
  KeyRound,
  Bell,
  ShoppingBag,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { canManageTeam } from "@/lib/utils/permissions";

// Master admins who can access admin pages
const MASTER_ADMINS = ['sufyanali@gmail.com', 'daniyal@cartaisy.com'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cartaisy-backend-production.up.railway.app/api/v1';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  requiresRole?: 'super_admin' | 'admin';
  requiresMasterAdmin?: boolean;
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggleCollapse?: () => void;
}

function SidebarContent({ collapsed, onToggleCollapse, showSignOut = false }: SidebarContentProps & { showSignOut?: boolean }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { logout, getToken } = useAuth();
  const [storeLogo, setStoreLogo] = useState<string | null>(null);

  const storeId = session?.user?.storeId;
  const storeName = session?.user?.storeName || "Cartaisy";
  const userName = session?.user?.name || "User";
  const storeInitial = storeName.charAt(0).toUpperCase();

  // Fetch store branding (logo) from API
  useEffect(() => {
    const fetchBranding = async () => {
      if (!storeId) return;
      try {
        const token = getToken();
        const response = await fetch(`${API_URL}/admin/stores/${storeId}/branding`, {
          headers: {
            'Authorization': `Bearer ${token}`,
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const baseNavItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: <House className="w-4 h-4" /> },
    {
      href: "/dashboard/app-builder",
      label: "App Builder",
      icon: <Smartphone className="w-4 h-4" />,
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      href: "/dashboard/customers",
      label: "Customers",
      icon: <UserRound className="w-4 h-4" />,
    },
    {
      href: "/dashboard/orders",
      label: "Orders",
      icon: <ShoppingBag className="w-4 h-4" />,
    },
    {
      href: "/dashboard/help-requests",
      label: "Help Requests",
      icon: <HelpCircle className="w-4 h-4" />,
    },
    {
      href: "/dashboard/collections",
      label: "Collections",
      icon: <FolderOpen className="w-4 h-4" />,
    },
    {
      href: "/dashboard/marketing/push-notifications",
      label: "Push Notifications",
      icon: <Bell className="w-4 h-4" />,
    },
    {
      href: "/dashboard/team",
      label: "Team",
      icon: <Users className="w-4 h-4" />,
      requiresRole: 'super_admin',
    },
    {
      href: "/dashboard/activity",
      label: "Activity",
      icon: <ClipboardList className="w-4 h-4" />,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
    {
      href: "/dashboard/admin/onboarding",
      label: "Onboarding",
      icon: <KeyRound className="w-4 h-4" />,
      requiresMasterAdmin: true,
    },
  ];

  // Filter items based on user role
  const navItems = baseNavItems.filter((item) => {
    if (item.requiresMasterAdmin) {
      return session?.user?.email && MASTER_ADMINS.includes(session.user.email);
    }
    if (item.requiresRole === 'super_admin') {
      return canManageTeam(session?.user?.role);
    }
    return true;
  });

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Store Header with User Avatar - matches main header h-14 */}
      <div className="h-14 border-b border-slate-200 flex items-center px-3">
        {collapsed ? (
          /* Collapsed state - just store logo/initial, click to expand */
          <div className="flex items-center justify-center w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-0 h-8 w-8 rounded-full hover:bg-slate-100"
            >
              {storeLogo ? (
                <img src={storeLogo} alt={storeName} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center">
                  <span className="text-xs font-semibold text-white">{storeInitial}</span>
                </div>
              )}
            </Button>
          </div>
        ) : (
          /* Expanded state - store logo/initial, info, collapse button */
          <div className="flex items-center w-full gap-2.5">
            {storeLogo ? (
              <img src={storeLogo} alt={storeName} className="w-7 h-7 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-white">{storeInitial}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-xs font-semibold text-slate-900 truncate">{storeName}</h2>
              <p className="text-xs text-slate-500 truncate">{userName}</p>
            </div>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="p-1 h-7 w-7 text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-0.5", collapsed ? "p-2" : "p-2")}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md transition-colors",
                collapsed
                  ? "justify-center p-2.5"
                  : "gap-2.5 px-2.5 py-2",
                isActive
                  ? "bg-slate-100 text-slate-900 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className={cn(isActive ? "text-slate-900" : "text-slate-500")}>
                {item.icon}
              </span>
              {!collapsed && (
                <span className="text-xs">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sign Out - Only shown on mobile */}
      {showSignOut && (
        <div className="p-2 border-t border-slate-200">
          <button
            onClick={() => logout()}
            className={cn(
              "flex items-center rounded-md transition-colors w-full text-red-600 hover:bg-red-50",
              collapsed ? "justify-center p-2.5" : "gap-2.5 px-2.5 py-2"
            )}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span className="text-xs">Sign out</span>}
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen bg-white border-r border-slate-200 transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between z-40">
        <div />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="text-slate-700"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64 bg-white">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SidebarContent collapsed={false} showSignOut={true} />
        </SheetContent>
      </Sheet>
    </>
  );
}
