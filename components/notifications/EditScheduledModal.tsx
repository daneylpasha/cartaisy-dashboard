'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ScheduledNotification, NotificationSegment } from '@/lib/api/notifications';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Calendar, Clock, Type, MessageSquare, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditScheduledModalProps {
  notification: ScheduledNotification | null;
  segments: NotificationSegment[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: {
    title?: string;
    body?: string;
    segment?: string;
    scheduledFor?: string;
  }) => Promise<void>;
}

export function EditScheduledModal({
  notification,
  segments,
  isOpen,
  onClose,
  onSave,
}: EditScheduledModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState('all');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (notification) {
      setTitle(notification.title);
      setBody(notification.body);
      setSegment(notification.segment);
      const date = new Date(notification.scheduledFor);
      setScheduledDate(format(date, 'yyyy-MM-dd'));
      setScheduledTime(format(date, 'HH:mm'));
      setErrors({});
    }
  }, [notification]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!body.trim()) {
      newErrors.body = 'Message is required';
    } else if (body.length > 500) {
      newErrors.body = 'Message must be 500 characters or less';
    }

    if (!scheduledDate) {
      newErrors.scheduledDate = 'Date is required';
    }

    if (!scheduledTime) {
      newErrors.scheduledTime = 'Time is required';
    }

    if (scheduledDate && scheduledTime) {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`);
      if (scheduledDateTime <= new Date()) {
        newErrors.scheduledDate = 'Scheduled time must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notification || !validate()) return;

    setIsSaving(true);
    try {
      const scheduledFor = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      await onSave(notification.id, {
        title: title.trim(),
        body: body.trim(),
        segment,
        scheduledFor,
      });
      onClose();
    } catch (error) {
      console.error('Failed to update notification:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Scheduled Notification</DialogTitle>
            <DialogDescription>
              Make changes to your scheduled notification below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-6">
            {/* Title */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Type className="w-4 h-4 text-slate-500" />
                Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
                className={cn(
                  'h-11',
                  errors.title && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.title && (
                <p className="text-xs text-red-600">{errors.title}</p>
              )}
              <p className={cn('text-xs text-right', title.length > 80 ? 'text-amber-600' : 'text-slate-400')}>
                {title.length}/100
              </p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                Message
              </Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={500}
                rows={3}
                className={cn(
                  'resize-none',
                  errors.body && 'border-red-500 focus:ring-red-500'
                )}
              />
              {errors.body && (
                <p className="text-xs text-red-600">{errors.body}</p>
              )}
              <p className={cn('text-xs text-right', body.length > 400 ? 'text-amber-600' : 'text-slate-400')}>
                {body.length}/500
              </p>
            </div>

            {/* Segment */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Users className="w-4 h-4 text-slate-500" />
                Target Audience
              </Label>
              <Select value={segment} onValueChange={setSegment}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {segments.map((seg) => (
                    <SelectItem key={seg.id} value={seg.id}>
                      <div className="flex items-center justify-between w-full gap-4">
                        <span>{seg.name}</span>
                        <span className="text-xs text-slate-500">
                          {(seg.count ?? 0).toLocaleString()} customers
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Date
                </Label>
                <Input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                  className={cn(
                    'h-11',
                    errors.scheduledDate && 'border-red-500 focus:ring-red-500'
                  )}
                />
                {errors.scheduledDate && (
                  <p className="text-xs text-red-600">{errors.scheduledDate}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Clock className="w-4 h-4 text-slate-500" />
                  Time
                </Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={cn(
                    'h-11',
                    errors.scheduledTime && 'border-red-500 focus:ring-red-500'
                  )}
                />
                {errors.scheduledTime && (
                  <p className="text-xs text-red-600">{errors.scheduledTime}</p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
