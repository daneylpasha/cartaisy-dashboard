"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { canManageTeam } from "@/lib/utils/permissions";

// Master admins who can access admin pages
const MASTER_ADMINS = ['sufyanali@gmail.com', 'daniyal@cartaisy.com'];

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

function SidebarContent({ collapsed, onToggleCollapse }: SidebarContentProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const storeName = session?.user?.storeName || "My Store";
  const userName = session?.user?.name || "User";
  const userInitial = userName.charAt(0).toUpperCase();

  const baseNavItems: NavItem[] = [
    { href: "/dashboard", label: "Home", icon: <House className="w-5 h-5" /> },
    {
      href: "/dashboard/app-builder",
      label: "App Builder",
      icon: <Smartphone className="w-5 h-5" />,
    },
    {
      href: "/dashboard/analytics",
      label: "Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
    },
    {
      href: "/dashboard/customers",
      label: "Customers",
      icon: <UserRound className="w-5 h-5" />,
    },
    {
      href: "/dashboard/collections",
      label: "Collections",
      icon: <FolderOpen className="w-5 h-5" />,
    },
    {
      href: "/dashboard/marketing/push-notifications",
      label: "Push Notifications",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      href: "/dashboard/team",
      label: "Team",
      icon: <Users className="w-5 h-5" />,
      requiresRole: 'super_admin',
    },
    {
      href: "/dashboard/activity",
      label: "Activity",
      icon: <ClipboardList className="w-5 h-5" />,
    },
    {
      href: "/dashboard/settings",
      label: "Settings",
      icon: <Settings className="w-5 h-5" />,
    },
    {
      href: "/dashboard/admin/onboarding",
      label: "Onboarding",
      icon: <KeyRound className="w-5 h-5" />,
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
      {/* Store Header with User Avatar - matches main header h-16 */}
      <div className="h-16 border-b border-slate-200 flex items-center px-4">
        {collapsed ? (
          /* Collapsed state - just avatar, click to expand */
          <div className="flex items-center justify-center w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="p-0 h-10 w-10 rounded-full hover:bg-slate-100"
            >
              <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center">
                <span className="text-sm font-semibold text-white">{userInitial}</span>
              </div>
            </Button>
          </div>
        ) : (
          /* Expanded state - avatar, info, collapse button */
          <div className="flex items-center w-full gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
              <span className="text-sm font-semibold text-white">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 truncate">{storeName}</h2>
              <p className="text-xs text-slate-500 truncate">{userName}</p>
            </div>
            {onToggleCollapse && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleCollapse}
                className="p-1 h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100 shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1", collapsed ? "p-2" : "p-3")}>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-lg transition-colors",
                collapsed
                  ? "justify-center p-3"
                  : "gap-3 px-3 py-2.5",
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
                <span className="text-sm">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>
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
          <SidebarContent collapsed={false} />
        </SheetContent>
      </Sheet>
    </>
  );
}
