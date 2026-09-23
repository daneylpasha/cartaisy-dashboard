'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/lib/auth';
import Link from 'next/link';
import {
  Smartphone,
  FolderOpen,
  Settings,
  TrendingUp,
  ArrowRight,
  Layers,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  Sparkles,
  Zap,
  LayoutGrid,
  Image as ImageIcon,
  Activity,
  Users,
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalComponents: number;
  activeComponents: number;
  hiddenComponents: number;
  collectionsCount: number;
  lastUpdated: string;
  recentActivity: {
    action: string;
    resourceName: string;
    timeAgo: string;
  }[];
}

interface ComponentBreakdown {
  type: string;
  label: string;
  count: number;
  icon: any;
  color: string;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const userName = session?.user?.name || session?.user?.email?.split('@')[0] || 'there';
  const firstName = userName.split(' ')[0];

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          fetch('/api/store/stats'),
          fetch('/api/activity?limit=3'),
        ]);

        const dashboardStats: DashboardStats = {
          totalComponents: 0,
          activeComponents: 0,
          hiddenComponents: 0,
          collectionsCount: 0,
          lastUpdated: 'Never',
          recentActivity: [],
        };

        if (statsRes.ok) {
          const data = await statsRes.json();
          const s = data.data;
          const total = (s.carouselCount || 0) + (s.promoBannerCount || 0) +
                       (s.calloutBannerCount || 0) + (s.categoryGridCount || 0) +
                       (s.collectionDisplayCount || 0) + (s.collectionShowcaseCount || 0) +
                       (s.categoryCollectionGridCount || 0);
          dashboardStats.totalComponents = total;
          dashboardStats.activeComponents = total; // Assume all active for now
          dashboardStats.collectionsCount = s.collectionDisplayCount || 0;
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          if (activityData.data?.activities) {
            dashboardStats.recentActivity = activityData.data.activities.slice(0, 3).map((a: any) => ({
              action: a.action,
              resourceName: a.resourceName || a.resourceType,
              timeAgo: formatTimeAgo(new Date(a.createdAt)),
            }));
            if (activityData.data.activities.length > 0) {
              dashboardStats.lastUpdated = formatTimeAgo(new Date(activityData.data.activities[0].createdAt));
            }
          }
        }

        setStats(dashboardStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const quickActions = [
    {
      title: 'App Builder',
      description: 'Design your mobile app layout',
      href: '/dashboard/app-builder',
      icon: Smartphone,
      gradient: 'from-blue-500 to-blue-600',
      bgLight: 'bg-blue-50',
    },
    {
      title: 'Collections',
      description: 'Manage Shopify collections',
      href: '/dashboard/collections',
      icon: FolderOpen,
      gradient: 'from-emerald-500 to-emerald-600',
      bgLight: 'bg-emerald-50',
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      href: '/dashboard/analytics',
      icon: TrendingUp,
      gradient: 'from-violet-500 to-violet-600',
      bgLight: 'bg-violet-50',
    },
    {
      title: 'Settings',
      description: 'Configure app preferences',
      href: '/dashboard/settings',
      icon: Settings,
      gradient: 'from-slate-500 to-slate-600',
      bgLight: 'bg-slate-100',
    },
  ];

  const componentTypes: ComponentBreakdown[] = [
    { type: 'carousel', label: 'Carousels', count: 0, icon: ImageIcon, color: 'text-blue-600 bg-blue-100' },
    { type: 'promo', label: 'Promo Banners', count: 0, icon: Zap, color: 'text-amber-600 bg-amber-100' },
    { type: 'category', label: 'Category Grids', count: 0, icon: LayoutGrid, color: 'text-emerald-600 bg-emerald-100' },
    { type: 'collection', label: 'Collections', count: 0, icon: Layers, color: 'text-violet-600 bg-violet-100' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="absolute inset-0 bg-grid-white/[0.02]" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome to Cartaisy</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
            {getGreeting()}, {firstName}!
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl">
            Your mobile commerce dashboard is ready. Build, customize, and launch your app experience.
          </p>

          {/* Quick Stats Row */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <Layers className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">{stats?.totalComponents || 0}</p>
                <p className="text-xs font-medium text-slate-400">Components</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <FolderOpen className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">{stats?.collectionsCount || 0}</p>
                <p className="text-xs font-medium text-slate-400">Collections</p>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-xl font-semibold text-white">Active</p>
                <p className="text-xs font-medium text-slate-400">App Status</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/onboarding"
        className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 transition-colors hover:border-slate-300"
      >
        <div>
          <p className="text-sm font-medium text-slate-950">Set up your app</p>
          <p className="mt-1 text-sm text-slate-600">
            Connect Shopify, confirm your brand, and preview a starting home.
          </p>
        </div>
        <span className="shrink-0 text-sm font-medium text-slate-950">Continue</span>
      </Link>

      {/* Quick Actions Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={action.href}
                className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-lg transition-all duration-300"
              >
                <div className={`w-10 h-10 rounded-lg ${action.bgLight} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 bg-gradient-to-br ${action.gradient} bg-clip-text text-transparent`} style={{ color: action.gradient.includes('blue') ? '#3b82f6' : action.gradient.includes('emerald') ? '#10b981' : action.gradient.includes('violet') ? '#8b5cf6' : '#64748b' }} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-0.5 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-slate-500">{action.description}</p>
                <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* App Status Card */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">App Overview</h2>
                <p className="text-xs text-slate-500 mt-0.5">Your mobile app configuration status</p>
              </div>
              <Link
                href="/dashboard/app-builder"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                Manage <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-5">
            {/* Status Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100">
                <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight text-emerald-700">{stats?.activeComponents || 0}</p>
                  <p className="text-xs font-medium text-emerald-600">Active</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-100">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                  <EyeOff className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xl font-semibold tracking-tight text-slate-700">{stats?.hiddenComponents || 0}</p>
                  <p className="text-xs font-medium text-slate-500">Hidden</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-base font-semibold tracking-tight text-blue-700 truncate">{stats?.lastUpdated || 'Never'}</p>
                  <p className="text-xs font-medium text-blue-600">Last update</p>
                </div>
              </div>
            </div>

            {/* Component Types */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Component Breakdown</p>
              <div className="grid grid-cols-2 gap-2">
                {componentTypes.map((comp) => {
                  const Icon = comp.icon;
                  return (
                    <div
                      key={comp.type}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-md ${comp.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{comp.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500 mt-0.5">Latest changes</p>
              </div>
              <Link
                href="/dashboard/activity"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="p-4">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              <div className="space-y-2">
                {stats.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      activity.action === 'create' ? 'bg-emerald-100 text-emerald-600' :
                      activity.action === 'update' ? 'bg-blue-100 text-blue-600' :
                      activity.action === 'delete' ? 'bg-red-100 text-red-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">
                        {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}d {activity.resourceName}
                      </p>
                      <p className="text-xs text-slate-500">{activity.timeAgo}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-5 h-5 text-slate-400" />
                </div>
                <p className="text-xs font-medium text-slate-600">No recent activity</p>
                <p className="text-xs text-slate-400 mt-0.5">Changes will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-5">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 text-blue-600 text-xs font-medium mb-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Get Started</span>
            </div>
            <h3 className="text-base font-semibold tracking-tight text-slate-900 mb-1">
              Ready to build your mobile experience?
            </h3>
            <p className="text-xs text-slate-500">
              Use the App Builder to create stunning carousels, banners, and collection displays for your customers.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/app-builder"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
            >
              <Smartphone className="w-3.5 h-3.5" />
              Open App Builder
            </Link>
            <Link
              href="/dashboard/app-builder/preview"
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview App
            </Link>
          </div>
        </div>
      </div>

      {/* Team Activity (if super admin) */}
      {session?.user?.role === 'super_admin' && (
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Team Management</h3>
                <p className="text-xs text-slate-500">Manage your team members and permissions</p>
              </div>
            </div>
            <Link
              href="/dashboard/team"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Manage Team <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
