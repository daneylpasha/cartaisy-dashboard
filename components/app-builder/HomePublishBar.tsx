'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  HOME_PUBLISH_COPY,
  publishStatusCopy,
  type HomePublishStatus,
} from '@/lib/homeLayout/publish';

interface HomePublishBarProps {
  status: HomePublishStatus;
  sections: readonly { isVisible: boolean }[];
  successMessage: string | null;
  isPublishing: boolean;
  canPublish: boolean;
  onPublish: () => void;
}

const PILL: Record<HomePublishStatus, string> = {
  not_published: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-50 text-emerald-800',
  draft: 'bg-amber-50 text-amber-800',
};

export function HomePublishBar({
  status,
  sections,
  successMessage,
  isPublishing,
  canPublish,
  onPublish,
}: HomePublishBarProps) {
  const copy = publishStatusCopy(status, sections);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PILL[status]}`}>
            {copy.label}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">{successMessage ?? copy.detail}</p>
      </div>
      <Button
        type="button"
        onClick={onPublish}
        disabled={!canPublish || isPublishing}
        className="h-10 shrink-0 gap-2 bg-slate-900 px-4 text-sm text-white hover:bg-slate-800"
      >
        {isPublishing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {HOME_PUBLISH_COPY.publishing}
          </>
        ) : status === 'published' && !canPublish ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            {HOME_PUBLISH_COPY.published.label}
          </>
        ) : (
          HOME_PUBLISH_COPY.action
        )}
      </Button>
    </div>
  );
}
