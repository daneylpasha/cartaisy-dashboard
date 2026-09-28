'use client';

import { STORE_ACCOUNTS_ANCHOR, type StoreSubmitPresentation } from '@/lib/storeSubmit/contract';

const PRIMARY_BUTTON =
  'inline-flex h-11 items-center justify-center rounded-lg bg-slate-950 px-5 text-sm font-medium text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

const QUIET_BUTTON =
  'text-sm font-medium text-slate-600 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

const LINK =
  'text-sm font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

function pillClass(tone: StoreSubmitPresentation['tone']): string {
  if (tone === 'submitted') return 'bg-emerald-50 text-emerald-800';
  if (tone === 'failed') return 'bg-red-50 text-red-800';
  return 'bg-slate-950 text-white';
}

export function StoreSubmitControl({
  model,
  onSubmit,
  connectHref = STORE_ACCOUNTS_ANCHOR,
}: {
  model: StoreSubmitPresentation;
  onSubmit: () => void;
  connectHref?: string;
}) {
  const detailId = model.detail || model.guidance ? `${model.platform}-submit-detail` : undefined;

  return (
    <div
      className="mt-4 border-t border-slate-100 pt-4"
      data-submit={model.platform}
      data-submit-state={model.state}
      aria-busy={model.tone === 'progress' ? true : undefined}
    >
      {model.detail || model.guidance || model.statusLabel ? (
        <div className="flex items-start justify-between gap-3">
          <div id={detailId} className="min-w-0">
            {model.detail ? (
              <p className="text-sm leading-6 text-slate-600" role="status">
                {model.detail}
              </p>
            ) : null}
            {model.guidance ? <p className="mt-1 text-sm leading-6 text-slate-600">{model.guidance}</p> : null}
          </div>
          {model.statusLabel ? (
            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${pillClass(model.tone)}`}
            >
              {model.tone === 'progress' ? (
                <span aria-hidden className="size-1.5 rounded-full bg-current motion-safe:animate-pulse" />
              ) : null}
              {model.statusLabel}
            </span>
          ) : null}
        </div>
      ) : null}
      {model.alert ? (
        <p className="mt-2 text-sm leading-6 text-red-700" role="alert">
          {model.alert}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={model.disabled}
          aria-describedby={detailId}
          className={model.quiet ? QUIET_BUTTON : PRIMARY_BUTTON}
        >
          {model.label}
        </button>
        {model.showConnect ? (
          <a href={connectHref} className={LINK}>
            Connect account
          </a>
        ) : null}
      </div>
    </div>
  );
}
