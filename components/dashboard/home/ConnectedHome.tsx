'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { ConnectedHomeFacts } from '@/lib/dashboard/loadHome';

export function ConnectedHome({
  storeName,
  shop,
  facts,
}: {
  storeName: string;
  shop: string | null;
  facts: ConnectedHomeFacts;
}) {
  const productCount = facts.productCount;
  const orderCount = facts.orderCount;
  const showProducts = productCount != null && productCount > 0;
  const showOrders = orderCount != null && orderCount > 0;
  const builderIsPrimary = facts.modules.kind === 'empty' && !facts.next;

  return (
    <div className="mx-auto w-full max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-300">
      <h1 className="font-heading text-[1.75rem] font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
        {storeName}
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {shop ? `Connected to ${shop}.` : 'Shopify is connected.'}
      </p>

      {facts.next && (
        <section className="mt-8 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-950">{facts.next.title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">{facts.next.body}</p>
          </div>
          <Button asChild className="h-11 w-full shrink-0 rounded-lg px-4 sm:w-auto">
            <Link href={facts.next.href}>{facts.next.action}</Link>
          </Button>
        </section>
      )}

      <div className="mt-6 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <StatusRow label="Shopify" value={shop || 'Connected'} />
        <StatusRow label="Catalog" value={facts.syncLabel} detail={facts.syncDetail} />
        <StatusRow
          label="App build"
          value={facts.buildLabel}
          detail={facts.buildDetail}
          href={facts.buildState === 'unknown' ? null : '/dashboard/onboarding?step=ready'}
          hrefLabel={facts.buildState === 'none' ? 'Request' : 'View'}
        />
        {showProducts && productCount != null && (
          <StatusRow label="Products" value={productCount.toLocaleString()} />
        )}
        {showOrders && orderCount != null && <StatusRow label="Orders" value={orderCount.toLocaleString()} />}
        {facts.modules.kind === 'counts' && (
          <StatusRow label="Home sections" value={facts.modules.total.toLocaleString()} />
        )}
      </div>

      {facts.modules.kind === 'counts' && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {facts.modules.rows.map((row) => (
            <li
              key={row.label}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] text-slate-600"
            >
              <span className="tabular-nums font-medium text-slate-950">{row.count}</span> {row.label}
            </li>
          ))}
        </ul>
      )}

      {facts.modules.kind === 'empty' && (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white px-5 py-5">
          <h2 className="text-sm font-semibold text-slate-950">No home sections yet</h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-600">
            Carousels, banners, and collections show up here after you add them in the app builder.
          </p>
          {builderIsPrimary ? (
            <Button asChild className="mt-4 h-11 rounded-lg px-4">
              <Link href="/dashboard/app-builder">Open app builder</Link>
            </Button>
          ) : (
            <Link
              href="/dashboard/app-builder"
              className="mt-3 inline-flex text-sm font-medium text-slate-950 underline-offset-4 hover:underline"
            >
              Open app builder
            </Link>
          )}
        </section>
      )}

      {facts.modules.kind === 'unknown' && (
        <p className="mt-4 text-sm text-slate-500">Home sections could not be loaded.</p>
      )}

      {facts.activity && facts.activity.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">Recent</h2>
          <ul className="mt-2 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
            {facts.activity.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
                <p className="min-w-0 truncate text-sm text-slate-950">{item.label}</p>
                <p className="shrink-0 text-xs text-slate-500">{item.time}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatusRow({
  label,
  value,
  detail,
  href,
  hrefLabel,
}: {
  label: string;
  value: string;
  detail?: string | null;
  href?: string | null;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-1 px-5 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-8">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="min-w-0 sm:text-right">
        <p className="text-sm font-medium break-words text-slate-950">{value}</p>
        {detail && <p className="mt-0.5 text-xs leading-5 text-slate-500">{detail}</p>}
        {href && hrefLabel && (
          <Link
            href={href}
            className="mt-1 inline-flex text-xs font-medium text-slate-950 underline-offset-4 hover:underline"
          >
            {hrefLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
