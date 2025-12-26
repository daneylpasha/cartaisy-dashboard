'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from '@/lib/auth';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://cartaisy-backend-production.up.railway.app/api/v1';

export interface SyncStatus {
  status: 'healthy' | 'syncing' | 'error' | 'unknown';
  lastSync: {
    completedAt: string | null;
    type: 'full' | 'incremental' | 'webhook' | null;
  };
  nextScheduledSync?: string;
  resources: {
    products: { count: number; lastUpdated: string | null };
    customers: { count: number; lastUpdated: string | null };
    orders: { count: number; lastUpdated: string | null };
    inventory: { count: number; lastUpdated: string | null };
  };
}

export interface UseSyncStatusReturn {
  syncStatus: SyncStatus | null;
  isLoading: boolean;
  isRefetching: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useSyncStatus(autoRefreshInterval = 60000): UseSyncStatusReturn {
  const { data: session } = useSession();
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async (isRefetch = false) => {
    const token = tokenStorage.getToken();
    const user = tokenStorage.getUser<{ storeId?: string }>();

    if (!token || !user?.storeId) {
      setIsLoading(false);
      return;
    }

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await fetch(`${API_URL}/stores/${user.storeId}/admin/sync/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }

      const data = await response.json();
      setSyncStatus(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sync status');
      setSyncStatus(null);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchSyncStatus();
    }
  }, [session?.user?.id, fetchSyncStatus]);

  // Auto-refresh interval
  useEffect(() => {
    if (!session?.user?.id || autoRefreshInterval <= 0) return;

    const intervalId = setInterval(() => {
      fetchSyncStatus(true);
    }, autoRefreshInterval);

    return () => clearInterval(intervalId);
  }, [session?.user?.id, autoRefreshInterval, fetchSyncStatus]);

  const refetch = useCallback(async () => {
    await fetchSyncStatus(true);
  }, [fetchSyncStatus]);

  return {
    syncStatus,
    isLoading,
    isRefetching,
    error,
    refetch,
  };
}
