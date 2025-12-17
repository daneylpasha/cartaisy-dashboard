'use client';

import React, { useState, useEffect } from 'react';
import {
  NotificationTemplate,
  NotificationSegment,
  CreateTemplatePayload
} from '@/lib/api/notifications';
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
import { X, FileText, Type, MessageSquare, Users, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageUploader } from './ImageUploader';

interface TemplateFormModalProps {
  template?: NotificationTemplate | null;
  segments: NotificationSegment[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreateTemplatePayload) => Promise<void>;
}

export function TemplateFormModal({
  template,
  segments,
  isOpen,
  onClose,
  onSave
}: TemplateFormModalProps) {
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [image, setImage] = useState('');
  const [segment, setSegment] = useState('all');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const isEdit = !!template;

  useEffect(() => {
    if (template) {
      setName(template.name);
      setTitle(template.title);
      setBody(template.body);
      setImage(template.image || '');
      setSegment(template.segment);
    } else {
      setName('');
      setTitle('');
      setBody('');
      setImage('');
      setSegment('all');
    }
    setError(null);
    setValidationErrors({});
  }, [template, isOpen]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = 'Template name is required';
    } else if (name.length > 100) {
      errors.name = 'Template name must be 100 characters or less';
    }

    if (!title.trim()) {
      errors.title = 'Notification title is required';
    } else if (title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    if (!body.trim()) {
      errors.body = 'Notification body is required';
    } else if (body.length > 500) {
      errors.body = 'Body must be 500 characters or less';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate()) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        title: title.trim(),
        body: body.trim(),
        image: image.trim() || undefined,
        segment
      });
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save template';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500" />

          <form onSubmit={handleSubmit}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {isEdit ? 'Edit Template' : 'Create Template'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Template Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Weekly Sale, New Arrivals"
                    maxLength={100}
                    className={cn(
                      'h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors',
                      validationErrors.name && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  {validationErrors.name ? (
                    <p className="text-xs text-red-600">{validationErrors.name}</p>
                  ) : (
                    <p className="text-xs text-slate-500">
                      A name to identify this template
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Type className="w-4 h-4 text-slate-500" />
                    Notification Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Flash Sale - 50% Off Today Only!"
                    maxLength={100}
                    className={cn(
                      'h-12 bg-slate-50 border-slate-200 focus:bg-white transition-colors',
                      validationErrors.title && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  <div className="flex justify-between items-center">
                    {validationErrors.title ? (
                      <p className="text-xs text-red-600">{validationErrors.title}</p>
                    ) : (
                      <span />
                    )}
                    <p className={cn('text-xs', title.length > 80 ? 'text-amber-600' : 'text-slate-400')}>
                      {title.length}/100
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <MessageSquare className="w-4 h-4 text-slate-500" />
                    Notification Body <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Write a compelling message that will engage your customers..."
                    maxLength={500}
                    rows={3}
                    className={cn(
                      'bg-slate-50 border-slate-200 focus:bg-white transition-colors resize-none',
                      validationErrors.body && 'border-red-500 focus:ring-red-500'
                    )}
                  />
                  <div className="flex justify-between items-center">
                    {validationErrors.body ? (
                      <p className="text-xs text-red-600">{validationErrors.body}</p>
                    ) : (
                      <span />
                    )}
                    <p className={cn('text-xs', body.length > 400 ? 'text-amber-600' : 'text-slate-400')}>
                      {body.length}/500
                    </p>
                  </div>
                </div>

                <ImageUploader
                  value={image}
                  onChange={setImage}
                  onClear={() => setImage('')}
                />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Users className="w-4 h-4 text-slate-500" />
                    Default Segment
                  </Label>
                  <Select value={segment} onValueChange={setSegment}>
                    <SelectTrigger className="h-12 bg-slate-50 border-slate-200 hover:bg-slate-100 transition-colors">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {segments.map((seg) => (
                        <SelectItem key={seg.id} value={seg.id} className="py-3">
                          <div className="flex items-center justify-between w-full gap-4">
                            <span>{seg.name}</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                              {(seg.count ?? 0).toLocaleString()} customers
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Can be changed when using the template
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : isEdit ? (
                  'Save Changes'
                ) : (
                  'Create Template'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
