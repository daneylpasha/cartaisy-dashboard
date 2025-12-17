'use client';

import React from 'react';
import { NotificationTemplate } from '@/lib/api/notifications';
import { TemplateCard } from './TemplateCard';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TemplatesListProps {
  templates: NotificationTemplate[];
  onUse: (template: NotificationTemplate) => void;
  onEdit: (template: NotificationTemplate) => void;
  onDuplicate: (template: NotificationTemplate) => void;
  onDelete: (template: NotificationTemplate) => void;
  onCreate: () => void;
  isLoading?: boolean;
}

export function TemplatesList({
  templates,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
  onCreate,
  isLoading
}: TemplatesListProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-900">No templates yet</h3>
        <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
          Create templates for notifications you send frequently to save time.
        </p>
        <Button
          onClick={onCreate}
          className="mt-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create First Template
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-slate-500">
          {templates.length} template{templates.length !== 1 ? 's' : ''}
        </p>
        <Button
          onClick={onCreate}
          size="sm"
          className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onUse={onUse}
            onEdit={onEdit}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}
