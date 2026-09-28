'use client';

import { useCallback, useEffect, useState } from 'react';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import { getStoreSubmit, listStoreSubmits, startStoreSubmit } from '@/lib/storeSubmit/client';
import {
  EMPTY_STORE_SUBMITS,
  SUBMIT_SIGN_IN_MESSAGE,
  SUBMIT_STATUS_POLL_MS,
  shouldPollStoreSubmit,
  type StoreSubmitJobs,
  type SubmitPlatform,
} from '@/lib/storeSubmit/contract';

const PLATFORMS: SubmitPlatform[] = ['android', 'ios'];

/**
 * Latest submit per platform for one build request. Polls while a platform
 * is queued or submitting, and refreshes those platforms when the tab is
 * visible again. Response bodies are not logged.
 */
export function useStoreSubmits(buildRequestId: string | null) {
  const [jobs, setJobs] = useState<StoreSubmitJobs>(EMPTY_STORE_SUBMITS);
  const [busy, setBusy] = useState<{ android: boolean; ios: boolean }>({ android: false, ios: false });
  const [errors, setErrors] = useState<{ android: string | null; ios: string | null }>({
    android: null,
    ios: null,
  });

  useEffect(() => {
    setJobs(EMPTY_STORE_SUBMITS);
    setErrors({ android: null, ios: null });
    if (!buildRequestId) return;
    let cancelled = false;

    async function load() {
      const token = tokenStorage.getToken();
      if (!token || !buildRequestId) return;
      const result = await listStoreSubmits(token, buildRequestId);
      if (cancelled || !result.ok) return;
      setJobs((current) => {
        const next = { ...result.jobs };
        for (const platform of PLATFORMS) {
          const local = current[platform];
          const remote = next[platform];
          if (local && (!remote || local.updatedAt > remote.updatedAt)) next[platform] = local;
        }
        return next;
      });
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [buildRequestId]);

  const inFlightKey = PLATFORMS.filter((platform) => shouldPollStoreSubmit(jobs[platform]?.status)).join(',');

  useEffect(() => {
    if (!buildRequestId || !inFlightKey) return;
    let cancelled = false;
    let timer = 0;
    let inFlight = false;
    const platforms = inFlightKey.split(',') as SubmitPlatform[];

    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void run();
      }, SUBMIT_STATUS_POLL_MS);
    };

    const run = async () => {
      if (cancelled || inFlight) return;
      const token = tokenStorage.getToken();
      if (!token) return;
      inFlight = true;
      const updates = await Promise.all(
        platforms.map(async (platform) => ({ platform, result: await getStoreSubmit(token, buildRequestId, platform) }))
      );
      inFlight = false;
      if (cancelled) return;

      let signIn: string | null = null;
      let still = false;
      setJobs((current) => {
        const next = { ...current };
        for (const update of updates) {
          if (update.result.ok) next[update.platform] = update.result.job;
          else if ('missing' in update.result && update.result.missing) next[update.platform] = null;
        }
        return next;
      });
      for (const update of updates) {
        if (update.result.ok) {
          if (shouldPollStoreSubmit(update.result.job.status)) still = true;
          continue;
        }
        if ('missing' in update.result && update.result.missing) continue;
        if ('message' in update.result && update.result.message === SUBMIT_SIGN_IN_MESSAGE) {
          signIn = update.result.message;
        } else still = true;
      }
      if (signIn) {
        setErrors({ android: signIn, ios: signIn });
        return;
      }
      if (still) schedule();
    };

    const onVisible = () => {
      if (document.visibilityState !== 'visible' || cancelled || inFlight) return;
      window.clearTimeout(timer);
      void run();
    };

    schedule();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [buildRequestId, inFlightKey]);

  const start = useCallback(
    async (platform: SubmitPlatform) => {
      if (!buildRequestId) return;
      const token = tokenStorage.getToken();
      if (!token) {
        setErrors((current) => ({ ...current, [platform]: SUBMIT_SIGN_IN_MESSAGE }));
        return;
      }
      setBusy((current) => ({ ...current, [platform]: true }));
      setErrors((current) => ({ ...current, [platform]: null }));
      const result = await startStoreSubmit(token, buildRequestId, platform);
      setBusy((current) => ({ ...current, [platform]: false }));
      if (result.ok) {
        setJobs((current) => ({ ...current, [platform]: result.job }));
        return;
      }
      setErrors((current) => ({ ...current, [platform]: result.message }));
    },
    [buildRequestId]
  );

  return { jobs, busy, errors, start };
}
