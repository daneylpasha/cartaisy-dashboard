'use client';

import { useState, useEffect } from 'react';
import { CustomerActivity, customersApi } from '@/lib/api/customers';
import { formatDistanceToNow } from 'date-fns';
import {
  Eye,
  Search,
  ShoppingCart,
  CreditCard,
  Package,
  Bell,
  Loader2,
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomerActivityFeedProps {
  customerId: string;
}

function getActivityIcon(type: CustomerActivity['type']) {
  switch (type) {
    case 'product_view':
      return Eye;
    case 'search':
      return Search;
    case 'add_to_cart':
      return ShoppingCart;
    case 'checkout':
      return CreditCard;
    case 'order':
      return Package;
    case 'notification':
      return Bell;
    default:
      return Activity;
  }
}

function getActivityColor(type: CustomerActivity['type']) {
  switch (type) {
    case 'product_view':
      return 'bg-blue-100 text-blue-600';
    case 'search':
      return 'bg-violet-100 text-violet-600';
    case 'add_to_cart':
      return 'bg-amber-100 text-amber-600';
    case 'checkout':
      return 'bg-cyan-100 text-cyan-600';
    case 'order':
      return 'bg-emerald-100 text-emerald-600';
    case 'notification':
      return 'bg-rose-100 text-rose-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function CustomerActivityFeed({ customerId }: CustomerActivityFeedProps) {
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await customersApi.getCustomerActivity(customerId, 20);
        setActivities(data.activities);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load activity');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [customerId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Activity className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No activity yet</h3>
        <p className="text-slate-500">Activity will appear here as the customer interacts with your app.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getActivityIcon(activity.type);
        const colorClass = getActivityColor(activity.type);
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="relative flex gap-4">
            {/* Timeline line */}
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-0 w-px bg-slate-200" />
            )}

            {/* Icon */}
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10', colorClass)}>
              <Icon className="w-5 h-5" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pb-4">
              <p className="text-slate-900">{activity.description}</p>
              <p className="text-sm text-slate-500 mt-1">
                {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
              </p>
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2">
                  {Object.entries(activity.metadata).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-slate-500">{key}:</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
