'use client';

import { Users, ShoppingBag, UserPlus, Crown, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerStats {
  totalCustomers: number;
  customersWithOrders: number;
  customersWithoutOrders: number;
  highValueCustomers: number;
  newCustomersThisMonth: number;
}

interface CustomerStatsCardsProps {
  stats: CustomerStats | null;
  isLoading?: boolean;
}

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number;
  color: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';
  isLoading?: boolean;
}

function StatCard({ icon: Icon, label, value, color, isLoading }: StatCardProps) {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', icon: 'text-blue-600' },
    emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
    violet: { bg: 'bg-violet-100', icon: 'text-violet-600' },
    amber: { bg: 'bg-amber-100', icon: 'text-amber-600' },
    slate: { bg: 'bg-slate-100', icon: 'text-slate-600' },
  };

  const colors = colorClasses[color];

  if (isLoading) {
    return (
      <div className="p-4 rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg animate-pulse', colors.bg)} />
          <div className="space-y-2">
            <div className="h-6 w-16 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colors.bg)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
        <div>
          <p className="text-2xl font-bold text-slate-900">{value.toLocaleString()}</p>
          <p className="text-sm text-slate-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export function CustomerStatsCards({ stats, isLoading }: CustomerStatsCardsProps) {
  const cards = [
    {
      icon: Users,
      label: 'Total Customers',
      value: stats?.totalCustomers ?? 0,
      color: 'blue' as const,
    },
    {
      icon: ShoppingBag,
      label: 'With Orders',
      value: stats?.customersWithOrders ?? 0,
      color: 'emerald' as const,
    },
    {
      icon: UserX,
      label: 'No Orders Yet',
      value: stats?.customersWithoutOrders ?? 0,
      color: 'slate' as const,
    },
    {
      icon: Crown,
      label: 'High Value',
      value: stats?.highValueCustomers ?? 0,
      color: 'amber' as const,
    },
    {
      icon: UserPlus,
      label: 'New This Month',
      value: stats?.newCustomersThisMonth ?? 0,
      color: 'violet' as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          icon={card.icon}
          label={card.label}
          value={card.value}
          color={card.color}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}
