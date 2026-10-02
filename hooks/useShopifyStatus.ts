'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from '@/lib/auth';
import { ShopifyStatus } from '@/types';
import * as shopifyService from '@/lib/services/shopify';

export interface UseShopifyStatusReturn {
  status: ShopifyStatus | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useShopifyStatus(): UseShopifyStatusReturn {
  const { status: sessionStatus } = useSession();
  const [status, setStatus] = useState<ShopifyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const requestSeq = useRef(0);

  const fetchStatus = useCallback(async (quiet = false) => {
    const requestId = ++requestSeq.current;
    try {
      if (!quiet) setIsLoading(true);
      setError(null);
      const data = await shopifyService.getConnectionStatus();
      if (requestId !== requestSeq.current) return;
      setStatus(data);
    } catch (err) {
      if (requestId !== requestSeq.current) return;
      setError(err instanceof Error ? err.message : "We couldn't check your Shopify connection. Refresh and try again.");
      setStatus(null);
    } finally {
      if (requestId !== requestSeq.current) return;
      if (!quiet) setIsLoading(false);
    }
  }, []);

  const refetch = useCallback(() => fetchStatus(true), [fetchStatus]);

  useEffect(() => {
    // Only fetch once when session is authenticated
    if (sessionStatus === 'authenticated' && !hasFetched.current) {
      hasFetched.current = true;
      fetchStatus();
    } else if (sessionStatus === 'unauthenticated') {
      setIsLoading(false);
    }
  }, [sessionStatus, fetchStatus]);

  return {
    status,
    isLoading,
    error,
    refetch,
  };
}
