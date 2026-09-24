'use client';

import { ChevronDown } from 'lucide-react';
import { PLATFORM_STATUSES, type PlatformKind, type PlatformStatus } from '@/lib/build/contract';
import {
  opsPlatformStatusLabel,
  type AdminBuildPagination,
  type AdminBuildRequest,
  type AdminQueueFilter,
} from '@/lib/build/adminContract';

const QUIET_BUTTON =
  'inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

const PRIMARY_BUTTON =
  'inline-flex h-10 items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-medium text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

export type BuildQueuePhase = 'loading' | 'forbidden' | 'error' | 'ready';

export interface BuildRequestsQueueProps {
  phase: BuildQueuePhase;
  filter: AdminQueueFilter;
  requests: AdminBuildRequest[];
  pagination: AdminBuildPagination | null;
  loadError: string | null;
  staleNotice: string | null;
  refreshing: boolean;
  savingId: string | null;
  rowError: { id: string; message: string } | null;
  onFilter: (filter: AdminQueueFilter) => void;
  onRefresh: () => void;
  onRetry: () => void;
  onPage: (page: number) => void;
  onStatus: (id: string, platform: PlatformKind, status: PlatformStatus) => void;
}

function formatWhen(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function storeTitle(request: AdminBuildRequest): string {
  return request.storeName ?? 'Store unavailable';
}

function dotClass(status: PlatformStatus | 'unknown'): string {
  if (status === 'ready') return 'bg-emerald-500';
  if (status === 'failed') return 'bg-red-500';
  if (status === 'waiting_on_merchant') return 'bg-slate-950';
  if (status === 'building' || status === 'queued') return 'bg-amber-500';
  return 'bg-slate-300';
}

function PlatformField({
  request,
  platform,
  label,
  saving,
  onStatus,
}: {
  request: AdminBuildRequest;
  platform: PlatformKind;
  label: string;
  saving: boolean;
  onStatus: BuildRequestsQueueProps['onStatus'];
}) {
  const state = request.platforms[platform];
  const updated = formatWhen(state.updatedAt);
  const selectId = `${request.id}-${platform}`;
  const store = storeTitle(request);

  return (
    <div className="rounded-lg border border-slate-200 px-3 py-3">
      <label htmlFor={selectId} className="flex items-center gap-2 text-sm font-medium text-slate-950">
        <span aria-hidden className={`size-1.5 rounded-full ${dotClass(state.status)}`} />
        {label}
      </label>
      <div className="relative mt-2">
        <select
          id={selectId}
          aria-label={`${store} ${label}`}
          value={state.status === 'unknown' ? '' : state.status}
          disabled={saving}
          onChange={(event) => {
            const next = event.target.value;
            if ((PLATFORM_STATUSES as readonly string[]).includes(next)) {
              onStatus(request.id, platform, next as PlatformStatus);
            }
          }}
          className="h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-950 outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
        >
          {state.status === 'unknown' ? <option value="">Updating</option> : null}
          {PLATFORM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {opsPlatformStatusLabel(platform, status)}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      </div>
      {updated ? <p className="mt-2 text-xs text-slate-500">Updated {updated}</p> : null}
    </div>
  );
}

function RequestRow({
  request,
  saving,
  error,
  onStatus,
}: {
  request: AdminBuildRequest;
  saving: boolean;
  error: string | null;
  onStatus: BuildRequestsQueueProps['onStatus'];
}) {
  const requested = formatWhen(request.createdAt);
  const title = storeTitle(request);

  return (
    <li className="px-4 py-5 sm:px-5" aria-busy={saving}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-slate-950">{title}</h2>
          <p className="truncate text-sm text-slate-500">{request.storeDomain ?? 'No shop domain'}</p>
        </div>
        {requested ? (
          <p className="shrink-0 text-sm text-slate-500 sm:text-right">
            <span className="text-slate-400">Requested </span>
            {requested}
          </p>
        ) : null}
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500">Access note</p>
        <p
          className={`mt-1 whitespace-pre-wrap break-words text-sm leading-6 ${
            request.accessNotes ? 'text-slate-700' : 'text-slate-400'
          }`}
        >
          {request.accessNotes ?? 'No access note'}
        </p>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <PlatformField request={request} platform="android" label="Android" saving={saving} onStatus={onStatus} />
        <PlatformField request={request} platform="ios" label="iOS" saving={saving} onStatus={onStatus} />
      </div>
      {saving ? <p className="mt-3 text-sm text-slate-500">Saving status...</p> : null}
      {error ? (
        <p className="mt-3 text-sm leading-6 text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  );
}

function EmptyCopy({ filter }: { filter: AdminQueueFilter }) {
  if (filter === 'open') {
    return {
      title: 'No open requests',
      body: 'Queued, building, and waiting builds will show up here.',
    };
  }
  return {
    title: 'No build requests yet',
    body: 'When a merchant asks for a build, it will show up here.',
  };
}

export function BuildRequestsQueue({
  phase,
  filter,
  requests,
  pagination,
  loadError,
  staleNotice,
  refreshing,
  savingId,
  rowError,
  onFilter,
  onRefresh,
  onRetry,
  onPage,
  onStatus,
}: BuildRequestsQueueProps) {
  const showQueue = phase === 'ready';
  const total = pagination?.total ?? 0;
  const empty = showQueue && requests.length === 0;
  const emptyCopy = EmptyCopy({ filter });
  const page = pagination?.page ?? 1;
  const pages = pagination?.pages ?? 0;

  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-[1.75rem] font-semibold tracking-tight text-slate-950">Build requests</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Merchant builds across stores. Set Android and iOS as each manual build moves.
          </p>
        </div>
        {showQueue ? (
          <button type="button" onClick={onRefresh} disabled={refreshing} className={QUIET_BUTTON}>
            {refreshing ? 'Refreshing' : 'Refresh'}
          </button>
        ) : null}
      </header>

      {phase === 'loading' ? (
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy="true">
          <p className="sr-only">Loading build requests</p>
          <div className="space-y-4 px-5 py-5" aria-hidden>
            <div className="h-4 w-40 rounded bg-slate-100" />
            <div className="h-16 rounded-lg bg-slate-50" />
            <div className="h-16 rounded-lg bg-slate-50" />
          </div>
        </div>
      ) : null}

      {phase === 'forbidden' ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-14 text-center">
          <h2 className="text-sm font-semibold text-slate-950">Platform ops only</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
            This queue is for Cartaisy operators. A store admin account cannot open it.
          </p>
          <button type="button" onClick={onRetry} className={`${PRIMARY_BUTTON} mt-6`}>
            Check again
          </button>
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-14 text-center">
          <p className="mx-auto max-w-md text-sm leading-6 text-slate-600" role="alert">
            {loadError ?? 'We could not load build requests. Try again.'}
          </p>
          <button type="button" onClick={onRetry} className={`${PRIMARY_BUTTON} mt-6`}>
            Try again
          </button>
        </div>
      ) : null}

      {showQueue ? (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div role="radiogroup" aria-label="Which requests" className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              {(
                [
                  ['open', 'Open'],
                  ['all', 'All'],
                ] as const
              ).map(([value, label]) => {
                const selected = filter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onFilter(value)}
                    className={`h-8 rounded-md px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      selected ? 'bg-slate-950 font-medium text-white' : 'text-slate-600 hover:text-slate-950'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-slate-500">
              {total === 1 ? '1 request' : `${total.toLocaleString()} requests`}
            </p>
          </div>

          {staleNotice ? (
            <p className="mt-4 text-sm leading-6 text-slate-600" role="status">
              {staleNotice}
            </p>
          ) : null}

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white" aria-busy={refreshing}>
            {empty ? (
              <div className="px-5 py-14 text-center">
                <h2 className="text-sm font-semibold text-slate-950">{emptyCopy.title}</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">{emptyCopy.body}</p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-200" aria-live="polite">
                {requests.map((request) => (
                  <RequestRow
                    key={request.id}
                    request={request}
                    saving={savingId === request.id}
                    error={rowError?.id === request.id ? rowError.message : null}
                    onStatus={onStatus}
                  />
                ))}
              </ul>
            )}
          </div>

          {pages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <button type="button" className={QUIET_BUTTON} disabled={page <= 1 || refreshing} onClick={() => onPage(page - 1)}>
                Previous
              </button>
              <p className="text-sm text-slate-500">
                Page {page} of {pages}
              </p>
              <button
                type="button"
                className={QUIET_BUTTON}
                disabled={page >= pages || refreshing}
                onClick={() => onPage(page + 1)}
              >
                Next
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
