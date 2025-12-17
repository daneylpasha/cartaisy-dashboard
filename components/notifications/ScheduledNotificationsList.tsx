'use client';

import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ScheduledNotification } from '@/lib/api/notifications';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Clock,
  Calendar,
  Send,
  X,
  Edit3,
  Users,
  MoreHorizontal,
  AlertCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ScheduledNotificationsListProps {
  notifications: ScheduledNotification[];
  onCancel: (id: string) => Promise<void>;
  onSendNow: (id: string) => Promise<void>;
  onEdit: (notification: ScheduledNotification) => void;
  isLoading?: boolean;
}

export function ScheduledNotificationsList({
  notifications,
  onCancel,
  onSendNow,
  onEdit,
  isLoading,
}: ScheduledNotificationsListProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this scheduled notification?')) return;

    setActionLoading(id);
    try {
      await onCancel(id);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendNow = async (id: string) => {
    if (!confirm('Send this notification immediately?')) return;

    setActionLoading(id);
    try {
      await onSendNow(id);
    } finally {
      setActionLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-32 bg-slate-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-xl border border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-1">No scheduled notifications</h3>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Schedule a notification to send later from the Send tab by enabling &quot;Schedule for later&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {notifications.map((notification) => {
        const scheduledDate = new Date(notification.scheduledFor);
        const isPast = scheduledDate < new Date();
        const isCancelled = notification.status === 'cancelled';
        const isActionLoading = actionLoading === notification.id;

        return (
          <div
            key={notification.id}
            className={cn(
              'bg-white border rounded-xl p-5 transition-all hover:shadow-md',
              isCancelled ? 'border-slate-200 bg-slate-50 opacity-60' : 'border-slate-200'
            )}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-slate-900 truncate">
                    {notification.title}
                  </h3>
                  <StatusBadge status={notification.status} />
                </div>

                {/* Body */}
                <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                  {notification.body}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(scheduledDate, 'MMM d, yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {format(scheduledDate, 'h:mm a')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    {isPast && !isCancelled ? (
                      <span className="text-amber-600 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Processing...
                      </span>
                    ) : !isCancelled ? (
                      <span className="text-violet-600">
                        in {formatDistanceToNow(scheduledDate)}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-1.5 capitalize">
                    <Users className="w-3.5 h-3.5" />
                    {notification.segment} customers
                  </span>
                </div>
              </div>

              {/* Actions */}
              {!isCancelled && (
                <div className="flex items-center gap-2">
                  {/* Desktop actions */}
                  <div className="hidden sm:flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(notification)}
                      disabled={isActionLoading}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      <Edit3 className="w-4 h-4 mr-1.5" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSendNow(notification.id)}
                      disabled={isActionLoading}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Send className="w-4 h-4 mr-1.5" />
                      {isActionLoading ? 'Sending...' : 'Send Now'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCancel(notification.id)}
                      disabled={isActionLoading}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Cancel
                    </Button>
                  </div>

                  {/* Mobile dropdown */}
                  <div className="sm:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" disabled={isActionLoading}>
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(notification)}>
                          <Edit3 className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSendNow(notification.id)}>
                          <Send className="w-4 h-4 mr-2" />
                          Send Now
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleCancel(notification.id)}
                          className="text-red-600"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusBadge({ status }: { status: 'scheduled' | 'cancelled' }) {
  if (status === 'cancelled') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
        Cancelled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
      <Clock className="w-3 h-3 mr-1" />
      Scheduled
    </span>
  );
}
