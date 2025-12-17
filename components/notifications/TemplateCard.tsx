'use client';

import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { NotificationTemplate } from '@/lib/api/notifications';
import { MoreVertical, Pencil, Copy, Trash2 } from 'lucide-react';

interface TemplateCardProps {
  template: NotificationTemplate;
  onUse: (template: NotificationTemplate) => void;
  onEdit: (template: NotificationTemplate) => void;
  onDuplicate: (template: NotificationTemplate) => void;
  onDelete: (template: NotificationTemplate) => void;
}

export function TemplateCard({
  template,
  onUse,
  onEdit,
  onDuplicate,
  onDelete
}: TemplateCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{template.name}</h3>
          <p className="text-sm text-slate-600 mt-1 line-clamp-1">{template.title}</p>
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{template.body}</p>

          <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
            <span className="capitalize px-2 py-0.5 bg-slate-100 rounded-full">
              {template.segment}
            </span>
            <span>Used {template.usageCount} times</span>
            {template.lastUsedAt && (
              <>
                <span className="hidden sm:inline">
                  Last used {formatDistanceToNow(new Date(template.lastUsedAt))} ago
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={() => onUse(template)}
            className="px-3 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg hover:from-blue-700 hover:to-violet-700 transition-colors shadow-sm"
          >
            Use
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      onEdit(template);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDuplicate(template);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={() => {
                      onDelete(template);
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
