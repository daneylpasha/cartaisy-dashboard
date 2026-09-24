'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useShopifyStatus, type UseShopifyStatusReturn } from '@/hooks/useShopifyStatus';

const ShopifyStatusContext = createContext<UseShopifyStatusReturn | null>(null);

export function ShopifyStatusProvider({ children }: { children: ReactNode }) {
  const value = useShopifyStatus();
  return <ShopifyStatusContext.Provider value={value}>{children}</ShopifyStatusContext.Provider>;
}

export function useDashboardShopify(): UseShopifyStatusReturn {
  const value = useContext(ShopifyStatusContext);
  if (!value) {
    throw new Error('useDashboardShopify must be used inside ShopifyStatusProvider');
  }
  return value;
}
