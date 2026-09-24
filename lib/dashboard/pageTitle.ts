const PAGE_TITLES: { prefix: string; title: string; exact?: boolean }[] = [
  { prefix: '/dashboard/marketing/push-notifications', title: 'Push notifications' },
  { prefix: '/dashboard/admin/onboarding', title: 'Onboarding' },
  { prefix: '/dashboard/notifications-test', title: 'Notifications' },
  { prefix: '/dashboard/settings/compliance', title: 'Compliance' },
  { prefix: '/dashboard/app-builder', title: 'App builder' },
  { prefix: '/dashboard/help-requests', title: 'Help requests' },
  { prefix: '/dashboard/collections', title: 'Collections' },
  { prefix: '/dashboard/customers', title: 'Customers' },
  { prefix: '/dashboard/analytics', title: 'Analytics' },
  { prefix: '/dashboard/settings', title: 'Settings' },
  { prefix: '/dashboard/activity', title: 'Activity' },
  { prefix: '/dashboard/orders', title: 'Orders' },
  { prefix: '/dashboard/team', title: 'Team' },
  { prefix: '/dashboard/blog', title: 'Blog' },
  { prefix: '/dashboard', title: 'Home', exact: true },
];

/** Chrome title for the current dashboard path. Longest prefix wins. */
export function pageTitle(pathname: string): string {
  const rules = [...PAGE_TITLES].sort((a, b) => b.prefix.length - a.prefix.length);
  for (const rule of rules) {
    if (rule.exact) {
      if (pathname === rule.prefix) return rule.title;
      continue;
    }
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) return rule.title;
  }
  return 'Dashboard';
}
