'use client';

import { Lock } from 'lucide-react';
import { formatLockedCount } from '@/lib/onboarding/normalizers';
import type { LockedCatalog, ShopifyConnectionSnapshot } from '@/lib/onboarding/types';

interface LockedShopifyDetailsProps {
  connection: ShopifyConnectionSnapshot;
  catalog: LockedCatalog;
}

export function LockedShopifyDetails({ connection, catalog }: LockedShopifyDetailsProps) {
  const visibleCollections = catalog.collections.slice(0, 8);
  const hiddenCount = Math.max(catalog.collections.length - visibleCollections.length, 0);

  const rows: { label: string; value: string }[] = [
    { label: 'Shop domain', value: connection.shopDomain ?? 'Not available yet' },
    { label: 'Shop ID', value: connection.shopId ?? 'Not available yet' },
    { label: 'Products', value: formatLockedCount(catalog.productCount, 'product', 'products') },
    { label: 'Orders', value: formatLockedCount(catalog.orderCount, 'order', 'orders') },
  ];

  return (
    <section aria-label="Shopify details, read only" className="mt-8">
      <div className="mb-3 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-slate-500" aria-hidden />
        <h3 className="text-sm font-medium text-slate-900">From Shopify</h3>
        <span className="text-xs text-slate-500">Read only</span>
      </div>
      <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70">
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr] sm:items-center">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{row.label}</p>
            <p className="text-sm text-slate-900">{row.value}</p>
          </div>
        ))}
        <div className="grid gap-1 px-4 py-3 sm:grid-cols-[160px_1fr]">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Collections</p>
          {visibleCollections.length === 0 ? (
            <p className="text-sm text-slate-900">Not available yet</p>
          ) : (
            <ul className="space-y-1">
              {visibleCollections.map((name) => (
                <li key={name} className="text-sm text-slate-900">
                  {name}
                </li>
              ))}
              {hiddenCount > 0 && (
                <li className="text-sm text-slate-500">
                  {hiddenCount} more stay in Shopify
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Shop domain, shop ID, products, orders, and collection contents stay in Shopify. They cannot be edited here.
      </p>
    </section>
  );
}
