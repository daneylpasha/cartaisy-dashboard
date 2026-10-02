'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { safeReturnedShop } from '@/lib/onboarding/normalizers';
import {
  ensurePendingShopifyClaim,
  returnPathAfterClaim,
  SHOPIFY_CLAIMED_EVENT,
  stripClaimTokenFromBrowserUrl,
} from '@/lib/shopify/installClaim';
import type { ShopifyReturnCopy } from '@/lib/shopify/merchantCopy';

export interface PendingShopifyClaim {
  /** True while `claim=pending` is still being posted. */
  claiming: boolean;
  /** Set after a pending install is handled. Null on a normal visit. */
  notice: ShopifyReturnCopy | null;
}

/**
 * When this visit is an App Store install return, claim it once and then
 * show the same success or error copy as a dashboard Connect callback.
 * The fragment is removed before the request returns. The query params are
 * removed after the claim is handled so a refresh does not repeat it.
 */
export function usePendingShopifyClaim(): PendingShopifyClaim {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const claimPending = searchParams.get('claim') === 'pending';
  const [claiming, setClaiming] = useState(claimPending);
  const [notice, setNotice] = useState<ShopifyReturnCopy | null>(null);

  useEffect(() => {
    if (!claimPending) return;
    const shop = safeReturnedShop(searchParams.get('shop'));
    const search = searchParams.toString();
    let cancelled = false;
    setClaiming(true);
    void ensurePendingShopifyClaim(shop).then((result) => {
      if (cancelled) return;
      setNotice(result.notice);
      setClaiming(false);
      stripClaimTokenFromBrowserUrl();
      if (result.connected) {
        window.dispatchEvent(new Event(SHOPIFY_CLAIMED_EVENT));
      }
      router.replace(returnPathAfterClaim(pathname, search));
    });
    return () => {
      cancelled = true;
    };
  }, [claimPending, pathname, router, searchParams]);

  return { claiming: claimPending && claiming, notice };
}
