'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth';
import {
  notificationApi,
  NotificationSegment,
  NotificationStats,
  NotificationHistoryItem,
  NotificationDetail,
  HistoryFilters,
  ScheduledNotification,
  NotificationTemplate,
  CreateTemplatePayload,
} from '@/lib/api/notifications';
import SendNotificationForm from '@/components/notifications/SendNotificationForm';
import { NotificationHistoryTable } from '@/components/notifications/NotificationHistoryTable';
import { HistoryFilters as HistoryFiltersComponent } from '@/components/notifications/HistoryFilters';
import { HistoryPagination } from '@/components/notifications/HistoryPagination';
import { NotificationDetailModal } from '@/components/notifications/NotificationDetailModal';
import { ScheduledNotificationsList } from '@/components/notifications/ScheduledNotificationsList';
import { EditScheduledModal } from '@/components/notifications/EditScheduledModal';
import { TemplatesList } from '@/components/notifications/TemplatesList';
import { TemplateFormModal } from '@/components/notifications/TemplateFormModal';
import { AbandonedCartSettings } from '@/components/notifications/AbandonedCartSettings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  RefreshCw,
  Bell,
  History,
  Send,
  Smartphone,
  Users,
  CheckCircle2,
  Sparkles,
  Zap,
  BarChart3,
  Apple,
  Calendar,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type TabType = 'send' | 'templates' | 'scheduled' | 'automation' | 'history' | 'stats';

export default function PushNotificationsPage() {
  const { data: session, status } = useSession();
  const [segments, setSegments] = useState<NotificationSegment[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('send');

  // History state
  const [historyNotifications, setHistoryNotifications] = useState<NotificationHistoryItem[]>([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [historyFilters, setHistoryFilters] = useState<HistoryFilters>({ page: 1, limit: 20 });
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // Detail modal state
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  const [notificationDetail, setNotificationDetail] = useState<NotificationDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Scheduled notifications state
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [scheduledLoading, setScheduledLoading] = useState(false);
  const [editingScheduled, setEditingScheduled] = useState<ScheduledNotification | null>(null);

  // Templates state
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [selectedTemplateForSend, setSelectedTemplateForSend] = useState<NotificationTemplate | null>(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !hasLoaded) {
      setHasLoaded(true);
      loadData();
    } else if (status === 'unauthenticated') {
      setLoading(false);
      setError('Please log in to view notifications');
    }
  }, [status, session?.user?.id, hasLoaded]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [segmentsData, statsData] = await Promise.all([
        notificationApi.getSegments(),
        notificationApi.getStats(),
      ]);
      setSegments(segmentsData);
      setStats(statsData);
    } catch (err) {
      console.error('[Push Notifications] Load error:', err);
      setError('Failed to load notification data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const data = await notificationApi.getHistory(historyFilters);
      setHistoryNotifications(data.notifications);
      setHistoryPagination(data.pagination);
    } catch (err) {
      console.error('[Push Notifications] History load error:', err);
      setHistoryError('Failed to load notification history.');
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilters]);

  useEffect(() => {
    if (activeTab === 'history' && hasLoaded) {
      loadHistory();
    }
  }, [activeTab, hasLoaded, loadHistory]);

  // Load scheduled notifications
  const loadScheduled = useCallback(async () => {
    setScheduledLoading(true);
    try {
      const data = await notificationApi.getScheduledNotifications();
      setScheduledNotifications(data.notifications.filter(n => n.status === 'scheduled'));
    } catch (err) {
      console.error('[Push Notifications] Scheduled load error:', err);
    } finally {
      setScheduledLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'scheduled' && hasLoaded) {
      loadScheduled();
    }
  }, [activeTab, hasLoaded, loadScheduled]);

  // Load templates
  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const data = await notificationApi.getTemplates();
      setTemplates(data.templates);
    } catch (err) {
      console.error('[Push Notifications] Templates load error:', err);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'templates' && hasLoaded) {
      loadTemplates();
    }
  }, [activeTab, hasLoaded, loadTemplates]);

  const handleViewDetails = async (notificationId: string) => {
    setSelectedNotificationId(notificationId);
    setDetailLoading(true);
    try {
      const detail = await notificationApi.getNotificationDetail(notificationId);
      setNotificationDetail(detail);
    } catch (err) {
      console.error('[Push Notifications] Detail load error:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedNotificationId(null);
    setNotificationDetail(null);
  };

  const handleFilterChange = (newFilters: HistoryFilters) => {
    setHistoryFilters(newFilters);
  };

  const handlePageChange = (page: number) => {
    setHistoryFilters((prev) => ({ ...prev, page }));
  };

  const handleNotificationSent = () => {
    loadData();
    if (activeTab === 'history') {
      loadHistory();
    }
    if (activeTab === 'scheduled') {
      loadScheduled();
    }
  };

  // Scheduled notification handlers
  const handleCancelScheduled = async (id: string) => {
    try {
      await notificationApi.cancelScheduledNotification(id);
      loadScheduled();
    } catch (err) {
      console.error('[Push Notifications] Cancel error:', err);
    }
  };

  const handleSendScheduledNow = async (id: string) => {
    try {
      await notificationApi.sendScheduledNow(id);
      loadScheduled();
      loadHistory();
    } catch (err) {
      console.error('[Push Notifications] Send now error:', err);
    }
  };

  const handleUpdateScheduled = async (id: string, updates: {
    title?: string;
    body?: string;
    segment?: string;
    scheduledFor?: string;
  }) => {
    try {
      await notificationApi.updateScheduledNotification(id, updates);
      loadScheduled();
    } catch (err) {
      console.error('[Push Notifications] Update error:', err);
      throw err;
    }
  };

  // Template handlers
  const handleCreateTemplate = async (data: CreateTemplatePayload) => {
    await notificationApi.createTemplate(data);
    loadTemplates();
  };

  const handleUpdateTemplate = async (data: CreateTemplatePayload) => {
    if (!editingTemplate) return;
    await notificationApi.updateTemplate(editingTemplate.id, data);
    setEditingTemplate(null);
    loadTemplates();
  };

  const handleDeleteTemplate = async (template: NotificationTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return;
    try {
      await notificationApi.deleteTemplate(template.id);
      loadTemplates();
    } catch (err) {
      console.error('[Push Notifications] Delete template error:', err);
    }
  };

  const handleDuplicateTemplate = async (template: NotificationTemplate) => {
    try {
      await notificationApi.duplicateTemplate(template.id);
      loadTemplates();
    } catch (err) {
      console.error('[Push Notifications] Duplicate template error:', err);
    }
  };

  const handleUseTemplate = async (template: NotificationTemplate) => {
    try {
      await notificationApi.recordTemplateUsage(template.id);
    } catch (err) {
      console.error('[Push Notifications] Record template usage error:', err);
    }
    setSelectedTemplateForSend(template);
    setActiveTab('send');
  };

  const tabs = [
    { id: 'send' as TabType, label: 'Send Notification', icon: Send },
    { id: 'templates' as TabType, label: 'Templates', icon: FileText },
    { id: 'scheduled' as TabType, label: 'Scheduled', icon: Calendar, count: scheduledNotifications.length },
    { id: 'automation' as TabType, label: 'Automation', icon: Zap },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'stats' as TabType, label: 'Analytics', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center mx-auto mb-3 animate-pulse">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading push notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <HeroHeader stats={null} />
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={() => {
                setHasLoaded(false);
                setError('');
                loadData();
              }}
              className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-8">
      {/* Hero Header */}
      <HeroHeader stats={stats} />

      {/* Tab Navigation */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = 'count' in tab ? tab.count : undefined;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {count !== undefined && count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-violet-100 text-violet-700">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'send' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Form - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg bg-white overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <Send className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Compose Notification</CardTitle>
                    <CardDescription>Create and send push notifications to your customers</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <SendNotificationForm
                  segments={segments}
                  onSuccess={handleNotificationSent}
                  template={selectedTemplateForSend}
                  onClearTemplate={() => setSelectedTemplateForSend(null)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Sidebar */}
          <div className="space-y-4">
            <QuickStatsCards stats={stats} />
            <SegmentPreview segments={segments} />
          </div>
        </div>
      )}

      {activeTab === 'templates' && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Notification Templates</CardTitle>
                <CardDescription>Create and manage reusable notification templates</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadTemplates} disabled={templatesLoading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', templatesLoading && 'animate-spin')} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <TemplatesList
              templates={templates}
              onUse={handleUseTemplate}
              onEdit={setEditingTemplate}
              onDuplicate={handleDuplicateTemplate}
              onDelete={handleDeleteTemplate}
              onCreate={() => setTemplateModalOpen(true)}
              isLoading={templatesLoading}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'scheduled' && (
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-base">Scheduled Notifications</CardTitle>
                <CardDescription>Manage notifications scheduled for future delivery</CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadScheduled} disabled={scheduledLoading}>
              <RefreshCw className={cn('w-4 h-4 mr-2', scheduledLoading && 'animate-spin')} />
              Refresh
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            <ScheduledNotificationsList
              notifications={scheduledNotifications}
              onCancel={handleCancelScheduled}
              onSendNow={handleSendScheduledNow}
              onEdit={setEditingScheduled}
              isLoading={scheduledLoading}
            />
          </CardContent>
        </Card>
      )}

      {activeTab === 'automation' && (
        <div className="space-y-6">
          <AbandonedCartSettings />

          {/* Future automation features can be added here */}
          <Card className="border-0 shadow-lg overflow-hidden opacity-60">
            <div className="h-1 bg-gradient-to-r from-slate-400 to-slate-500" />
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-700">More Automations Coming Soon</p>
                  <p className="text-sm text-slate-500">Order updates, shipping alerts, and promotional triggers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          <HistoryFiltersComponent filters={historyFilters} onFilterChange={handleFilterChange} />

          {historyError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6 flex items-center justify-between">
                <p className="text-red-800">{historyError}</p>
                <Button variant="outline" size="sm" onClick={loadHistory}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-lg overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                  <History className="w-4 h-4 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">Notification History</CardTitle>
                  <CardDescription>View all past notifications and delivery stats</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={loadHistory} disabled={historyLoading}>
                <RefreshCw className={cn('w-4 h-4 mr-2', historyLoading && 'animate-spin')} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <NotificationHistoryTable
                notifications={historyNotifications}
                onViewDetails={handleViewDetails}
                isLoading={historyLoading}
              />
              {historyPagination.totalPages > 1 && (
                <HistoryPagination
                  currentPage={historyPagination.page}
                  totalPages={historyPagination.totalPages}
                  total={historyPagination.total}
                  limit={historyPagination.limit}
                  onPageChange={handlePageChange}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <StatsOverview stats={stats} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlatformBreakdown stats={stats} />
            <SegmentBreakdown segments={segments} />
          </div>
        </div>
      )}

      <NotificationDetailModal
        notification={notificationDetail}
        isOpen={!!selectedNotificationId}
        onClose={handleCloseDetail}
        isLoading={detailLoading}
      />

      <EditScheduledModal
        notification={editingScheduled}
        segments={segments}
        isOpen={!!editingScheduled}
        onClose={() => setEditingScheduled(null)}
        onSave={handleUpdateScheduled}
      />

      <TemplateFormModal
        template={null}
        segments={segments}
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        onSave={handleCreateTemplate}
      />

      <TemplateFormModal
        template={editingTemplate}
        segments={segments}
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        onSave={handleUpdateTemplate}
      />
    </div>
  );
}

// Hero Header Component
function HeroHeader({ stats }: { stats: NotificationStats | null }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center gap-2 text-blue-400 text-xs font-medium mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Marketing</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-2">Push Notifications</h1>
        <p className="text-slate-400 text-sm max-w-2xl">
          Engage your customers with targeted push notifications. Drive sales, announce promotions, and keep your audience connected.
        </p>

        {stats && (
          <div className="flex flex-wrap gap-5 mt-6">
            <StatBadge
              icon={<Users className="w-4 h-4 text-blue-400" />}
              value={stats.totalCustomersWithDevices.toLocaleString()}
              label="Reachable Customers"
            />
            <div className="w-px h-12 bg-white/10 hidden sm:block" />
            <StatBadge
              icon={<Smartphone className="w-4 h-4 text-emerald-400" />}
              value={stats.totalActiveDevices.toLocaleString()}
              label="Active Devices"
            />
            <div className="w-px h-12 bg-white/10 hidden sm:block" />
            <StatBadge
              icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
              value={stats.firebaseEnabled ? 'Active' : 'Inactive'}
              label="Push Status"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function StatBadge({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">{icon}</div>
      <div>
        <p className="text-xl font-semibold text-white">{value}</p>
        <p className="text-xs font-medium text-slate-400">{label}</p>
      </div>
    </div>
  );
}

// Quick Stats Cards for Send Tab
function QuickStatsCards({ stats }: { stats: NotificationStats | null }) {
  if (!stats) return null;

  const cards = [
    {
      icon: Users,
      label: 'Total Reach',
      value: stats.totalCustomersWithDevices.toLocaleString(),
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Smartphone,
      label: 'Active Devices',
      value: stats.totalActiveDevices.toLocaleString(),
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      icon: Bell,
      label: 'Push Enabled',
      value: stats.pushEnabledCustomers.toLocaleString(),
      gradient: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
    },
  ];

  return (
    <div className="space-y-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={cn(
              'p-3 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-md flex items-center justify-center', card.bg)}>
                <Icon className={cn('w-4 h-4 bg-gradient-to-br bg-clip-text', card.gradient)} style={{ color: card.gradient.includes('blue') ? '#3b82f6' : card.gradient.includes('emerald') ? '#10b981' : '#8b5cf6' }} />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-900">{card.value}</p>
                <p className="text-xs text-slate-500">{card.label}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Segment Preview for Send Tab
function SegmentPreview({ segments }: { segments: NotificationSegment[] }) {
  if (segments.length === 0) return null;

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-700">Available Segments</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {segments.slice(0, 4).map((segment) => (
            <div
              key={segment.id}
              className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0"
            >
              <span className="text-sm text-slate-600">{segment.name}</span>
              <span className="text-sm font-semibold text-slate-900">
                {(segment.count ?? 0).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Stats Overview for Analytics Tab
function StatsOverview({ stats }: { stats: NotificationStats | null }) {
  if (!stats) return null;

  const statCards = [
    {
      icon: Users,
      label: 'Customers with Devices',
      value: stats.totalCustomersWithDevices.toLocaleString(),
      description: 'Can receive push notifications',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Smartphone,
      label: 'Total Active Devices',
      value: stats.totalActiveDevices.toLocaleString(),
      description: 'Registered mobile devices',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      icon: Bell,
      label: 'Push Enabled',
      value: stats.pushEnabledCustomers.toLocaleString(),
      description: 'Opted in for notifications',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      icon: Zap,
      label: 'Delivery Rate',
      value: '94.2%',
      description: 'Average delivery success',
      gradient: 'from-amber-500 to-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="border-0 shadow-lg overflow-hidden group hover:shadow-xl transition-shadow">
            <div className={cn('h-1 bg-gradient-to-r', card.gradient)} />
            <CardContent className="pt-6">
              <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center mb-4', card.gradient)}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-2xl font-semibold tracking-tight text-slate-900 mb-1">{card.value}</p>
              <p className="text-xs font-medium text-slate-700">{card.label}</p>
              <p className="text-xs text-slate-500 mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// Platform Breakdown for Analytics Tab
function PlatformBreakdown({ stats }: { stats: NotificationStats | null }) {
  if (!stats) return null;

  const total = stats.totalActiveDevices || 1;
  const iosPercentage = Math.round((stats.platformBreakdown.ios / total) * 100);
  const androidPercentage = Math.round((stats.platformBreakdown.android / total) * 100);

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-slate-600" />
          Platform Distribution
        </CardTitle>
        <CardDescription>Device breakdown by operating system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* iOS */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <Apple className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-slate-900">iOS</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">{stats.platformBreakdown.ios.toLocaleString()}</span>
              <span className="text-sm text-slate-500 ml-2">({iosPercentage}%)</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-slate-700 to-slate-900 rounded-full transition-all duration-500"
              style={{ width: `${iosPercentage}%` }}
            />
          </div>
        </div>

        {/* Android */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-white" />
              </div>
              <span className="font-medium text-slate-900">Android</span>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-slate-900">{stats.platformBreakdown.android.toLocaleString()}</span>
              <span className="text-sm text-slate-500 ml-2">({androidPercentage}%)</span>
            </div>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
              style={{ width: `${androidPercentage}%` }}
            />
          </div>
        </div>

        {/* Total */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Total Active Devices</span>
            <span className="text-xl font-bold text-slate-900">{stats.totalActiveDevices.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Segment Breakdown for Analytics Tab
function SegmentBreakdown({ segments }: { segments: NotificationSegment[] }) {
  const colors = [
    'bg-blue-500',
    'bg-emerald-500',
    'bg-violet-500',
    'bg-amber-500',
    'bg-rose-500',
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-slate-600" />
          Customer Segments
        </CardTitle>
        <CardDescription>Target audiences for your notifications</CardDescription>
      </CardHeader>
      <CardContent>
        {segments.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No segments available</p>
        ) : (
          <div className="space-y-4">
            {segments.map((segment, idx) => (
              <div
                key={segment.id}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <div className={cn('w-3 h-3 rounded-full', colors[idx % colors.length])} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{segment.name}</p>
                  <p className="text-xs text-slate-500 truncate">{segment.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{(segment.count ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-slate-500">customers</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
