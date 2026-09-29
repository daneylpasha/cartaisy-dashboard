'use client';

import {
  APP_BUILDER_PUBLISH_HREF,
  HOME_PUBLISH_COPY,
  type HomeLayoutOverview,
  type HomePublishStatus,
} from '@/lib/homeLayout/publish';

const LINK =
  'font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

const PILL: Record<HomePublishStatus, string> = {
  not_published: 'bg-slate-100 text-slate-700',
  published: 'bg-emerald-50 text-emerald-800',
  draft: 'bg-amber-50 text-amber-800',
};

/**
 * Quiet status on Build my app when the installable home is not the editor layout.
 * Published, and a missing read, stay off this strip. It does not gate a build.
 */
export function HomePublishNudge({ layout }: { layout: HomeLayoutOverview | null }) {
  if (!layout?.needsPublish) return null;

  return (
    <div
      className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white"
      role="status"
      data-home-publish={layout.status}
    >
      <div className="flex min-w-0 items-center gap-2 px-3 py-2.5">
        <p className="text-sm font-medium text-slate-950">Home layout</p>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${PILL[layout.status]}`}
        >
          {layout.label}
        </span>
      </div>
      <p className="border-t border-slate-100 px-3 py-2.5 text-sm leading-6 text-slate-600">
        {layout.detail}{' '}
        <a href={APP_BUILDER_PUBLISH_HREF} className={LINK}>
          {HOME_PUBLISH_COPY.action}
        </a>
        . You can request a build, install, and submit either way.
      </p>
    </div>
  );
}
