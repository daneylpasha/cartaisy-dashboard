'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { BUILD_STATUS_POLL_MS, type PlatformKind, type PlatformStatus } from '@/lib/build/contract';
import {
  ADMIN_BUILD_PAGE_LIMIT,
  applyStatusSnapshot,
  type AdminBuildPagination,
  type AdminBuildRequest,
  type AdminQueueFilter,
} from '@/lib/build/adminContract';
import { listAdminBuildRequests, updateAdminBuildStatus } from '@/lib/build/adminClient';
import { BuildRequestsQueue, type BuildQueuePhase } from '@/components/admin/BuildRequestsQueue';

const STALE = 'The latest refresh failed. This is the last queue we could load.';

export function BuildRequestsPanel() {
  const { getToken } = useAuth();
  const [phase, setPhase] = useState<BuildQueuePhase>('loading');
  const [filter, setFilter] = useState<AdminQueueFilter>('open');
  const [page, setPage] = useState(1);
  const [requests, setRequests] = useState<AdminBuildRequest[]>([]);
  const [pagination, setPagination] = useState<AdminBuildPagination | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [staleNotice, setStaleNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);

  const loadId = useRef(0);
  const savingRef = useRef(false);
  const phaseRef = useRef<BuildQueuePhase>('loading');
  phaseRef.current = phase;

  const applyList = useCallback(
    (
      result: Awaited<ReturnType<typeof listAdminBuildRequests>>,
      mode: 'replace' | 'poll'
    ) => {
      if (result.kind === 'forbidden') {
        setRequests([]);
        setPagination(null);
        setStaleNotice(null);
        setLoadError(null);
        setPhase('forbidden');
        return;
      }
      if (result.kind === 'unauthorized' || result.kind === 'error') {
        if (mode === 'poll' && phaseRef.current === 'ready') {
          setStaleNotice(STALE);
          return;
        }
        setLoadError(result.message);
        setPhase('error');
        return;
      }
      setRequests(result.page.requests);
      setPagination(result.page.pagination);
      setLoadError(null);
      setStaleNotice(null);
      setPhase('ready');
    },
    []
  );

  const load = useCallback(
    async (mode: 'navigate' | 'refresh' | 'poll', nextFilter: AdminQueueFilter, nextPage: number) => {
      const token = getToken();
      if (!token) {
        if (mode === 'poll' && phaseRef.current === 'ready') {
          setStaleNotice(STALE);
          return;
        }
        setLoadError('Sign in again to update build requests.');
        setPhase('error');
        return;
      }

      const ticket = mode === 'poll' ? loadId.current : ++loadId.current;
      if (mode === 'navigate') {
        setRefreshing(false);
        setPhase('loading');
        setRequests([]);
        setPagination(null);
        setStaleNotice(null);
      }
      if (mode === 'refresh') setRefreshing(true);

      const result = await listAdminBuildRequests(token, {
        page: nextPage,
        limit: ADMIN_BUILD_PAGE_LIMIT,
        filter: nextFilter,
      });
      if (ticket !== loadId.current) return;
      if (mode === 'poll' && savingRef.current) return;
      applyList(result, mode === 'poll' ? 'poll' : 'replace');
      if (mode === 'refresh') setRefreshing(false);
    },
    [applyList, getToken]
  );

  useEffect(() => {
    void load('navigate', filter, page);
  }, [filter, page, load]);

  useEffect(() => {
    if (phase !== 'ready') return;
    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      if (savingRef.current) return;
      void load('poll', filter, page);
    };
    const id = window.setInterval(tick, BUILD_STATUS_POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [phase, filter, page, load]);

  const onFilter = (next: AdminQueueFilter) => {
    if (next === filter) return;
    setRowError(null);
    setPage(1);
    setFilter(next);
  };

  const onStatus = async (id: string, platform: PlatformKind, status: PlatformStatus) => {
    const current = requests.find((request) => request.id === id);
    if (!current || current.platforms[platform].status === status || savingRef.current) return;
    const token = getToken();
    if (!token) {
      setLoadError('Sign in again to update build requests.');
      setPhase('error');
      return;
    }

    savingRef.current = true;
    setSavingId(id);
    setRowError(null);
    const result = await updateAdminBuildStatus(token, id, platform, status);
    savingRef.current = false;
    setSavingId(null);

    if (result.kind === 'ok') {
      setRequests((prev) => prev.map((request) => (request.id === id ? applyStatusSnapshot(request, result.snapshot) : request)));
      return;
    }
    if (result.kind === 'forbidden') {
      setRequests([]);
      setPagination(null);
      setPhase('forbidden');
      return;
    }
    if (result.kind === 'unauthorized') {
      setLoadError(result.message);
      setPhase('error');
      return;
    }
    const message =
      result.kind === 'missing'
        ? 'That request is no longer in the queue.'
        : result.kind === 'invalid'
          ? result.message
          : result.message;
    setRowError({ id, message });
  };

  return (
    <BuildRequestsQueue
      phase={phase}
      filter={filter}
      requests={phase === 'ready' ? requests : []}
      pagination={phase === 'ready' ? pagination : null}
      loadError={loadError}
      staleNotice={staleNotice}
      refreshing={refreshing}
      savingId={savingId}
      rowError={rowError}
      onFilter={onFilter}
      onRefresh={() => void load('refresh', filter, page)}
      onRetry={() => void load('navigate', filter, page)}
      onPage={(next) => {
        setRowError(null);
        setPage(next);
      }}
      onStatus={(id, platform, status) => void onStatus(id, platform, status)}
    />
  );
}
