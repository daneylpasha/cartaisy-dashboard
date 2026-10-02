'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useShopifyStatus, type UseShopifyStatusReturn } from '@/hooks/useShopifyStatus';
import { SHOPIFY_CLAIMED_EVENT } from '@/lib/shopify/installClaim';

const ShopifyStatusContext = createContext<UseShopifyStatusReturn | null>(null);

export function ShopifyStatusProvider({ children }: { children: ReactNode }) {
  const value = useShopifyStatus();
  const { refetch } = value;

  useEffect(() => {
    const onClaimed = () => {
      void refetch();
    };
    window.addEventListener(SHOPIFY_CLAIMED_EVENT, onClaimed);
    return () => window.removeEventListener(SHOPIFY_CLAIMED_EVENT, onClaimed);
  }, [refetch]);

  return <ShopifyStatusContext.Provider value={value}>{children}</ShopifyStatusContext.Provider>;
}

export function useDashboardShopify(): UseShopifyStatusReturn {
  const value = useContext(ShopifyStatusContext);
  if (!value) {
    throw new Error('useDashboardShopify must be used inside ShopifyStatusProvider');
  }
  return value;
}
