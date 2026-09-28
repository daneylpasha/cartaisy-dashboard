'use client';

import { useEffect, useState } from 'react';
import { tokenStorage } from '@/lib/api/mutator/custom-instance';
import {
  connectAppleCredentials,
  connectGoogleCredentials,
  disconnectAppleCredentials,
  disconnectGoogleCredentials,
  fetchStoreCredentials,
} from '@/lib/storeCredentials/client';
import {
  CREDENTIAL_SIGN_IN_MESSAGE,
  type StoreCredentialsStatus,
} from '@/lib/storeCredentials/contract';
import {
  emptyAppleForm,
  emptyGoogleForm,
  StoreCredentialsView,
  type AppleFormState,
  type PlatformFormState,
} from '@/components/build/StoreCredentialsView';
import { StoreSubmitSettings } from '@/components/build/StoreSubmitSettings';

export interface StoreAccountSnapshot {
  phase: 'loading' | 'error' | 'ready';
  credentials: StoreCredentialsStatus | null;
  loadError: string | null;
}

interface StoreCredentialsPanelProps {
  surface: 'build' | 'settings';
  onStatus?: (snapshot: StoreAccountSnapshot) => void;
}

export function StoreCredentialsPanel({ surface, onStatus }: StoreCredentialsPanelProps) {
  const [phase, setPhase] = useState<'loading' | 'error' | 'ready'>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadKey, setLoadKey] = useState(0);
  const [credentials, setCredentials] = useState<StoreCredentialsStatus | null>(null);
  const [apple, setApple] = useState<AppleFormState>(emptyAppleForm);
  const [google, setGoogle] = useState<PlatformFormState>(emptyGoogleForm);
  const [appleFile, setAppleFile] = useState<File | null>(null);
  const [googleFile, setGoogleFile] = useState<File | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const token = tokenStorage.getToken();
      if (!token) {
        if (!cancelled) {
          setPhase('error');
          setLoadError(CREDENTIAL_SIGN_IN_MESSAGE);
        }
        return;
      }
      const result = await fetchStoreCredentials(token);
      if (cancelled) return;
      if (!result.ok) {
        setPhase('error');
        setLoadError(result.message);
        return;
      }
      setCredentials(result.credentials);
      setLoadError(null);
      setPhase('ready');
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [loadKey]);

  useEffect(() => {
    onStatus?.({ phase, credentials, loadError });
  }, [onStatus, phase, credentials, loadError]);

  async function submitApple() {
    const token = tokenStorage.getToken();
    if (!token) {
      setApple((current) => ({ ...current, error: CREDENTIAL_SIGN_IN_MESSAGE }));
      return;
    }
    if (!appleFile) {
      setApple((current) => ({
        ...current,
        error: 'Add the Key ID, the Issuer ID, and the App Store Connect API key (.p8).',
      }));
      return;
    }
    setApple((current) => ({ ...current, submitting: true, error: null }));
    const result = await connectAppleCredentials(token, {
      keyId: apple.keyId,
      issuerId: apple.issuerId,
      privateKey: appleFile,
    });
    if (!result.ok) {
      setApple((current) => ({ ...current, submitting: false, error: result.message }));
      return;
    }
    setCredentials(result.credentials);
    setAppleFile(null);
    setApple((current) => ({
      ...emptyAppleForm(),
      fileKey: current.fileKey + 1,
    }));
  }

  async function submitGoogle() {
    const token = tokenStorage.getToken();
    if (!token) {
      setGoogle((current) => ({ ...current, error: CREDENTIAL_SIGN_IN_MESSAGE }));
      return;
    }
    if (!googleFile) {
      setGoogle((current) => ({ ...current, error: 'Upload the Google Play service account JSON file.' }));
      return;
    }
    setGoogle((current) => ({ ...current, submitting: true, error: null }));
    const result = await connectGoogleCredentials(token, { serviceAccount: googleFile });
    if (!result.ok) {
      setGoogle((current) => ({ ...current, submitting: false, error: result.message }));
      return;
    }
    setCredentials(result.credentials);
    setGoogleFile(null);
    setGoogle((current) => ({
      ...emptyGoogleForm(),
      fileKey: current.fileKey + 1,
    }));
  }

  async function removeApple() {
    const token = tokenStorage.getToken();
    if (!token) {
      setApple((current) => ({ ...current, error: CREDENTIAL_SIGN_IN_MESSAGE, confirmingDisconnect: false }));
      return;
    }
    setApple((current) => ({ ...current, submitting: true, error: null }));
    const result = await disconnectAppleCredentials(token);
    if (!result.ok) {
      setApple((current) => ({ ...current, submitting: false, error: result.message }));
      return;
    }
    setCredentials(result.credentials);
    clearAppleDraft(result.credentials);
  }

  function clearAppleDraft(next: StoreCredentialsStatus) {
    setAppleFile(null);
    setApple((current) => ({
      ...emptyAppleForm(),
      fileKey: current.fileKey + 1,
      open: next.apple.status === 'connected' ? false : current.open,
    }));
  }

  async function removeGoogle() {
    const token = tokenStorage.getToken();
    if (!token) {
      setGoogle((current) => ({ ...current, error: CREDENTIAL_SIGN_IN_MESSAGE, confirmingDisconnect: false }));
      return;
    }
    setGoogle((current) => ({ ...current, submitting: true, error: null }));
    const result = await disconnectGoogleCredentials(token);
    if (!result.ok) {
      setGoogle((current) => ({ ...current, submitting: false, error: result.message }));
      return;
    }
    setCredentials(result.credentials);
    setGoogleFile(null);
    setGoogle((current) => ({
      ...emptyGoogleForm(),
      fileKey: current.fileKey + 1,
    }));
  }

  return (
    <>
    <StoreCredentialsView
      surface={surface}
      phase={phase}
      loadError={loadError}
      credentials={credentials}
      apple={apple}
      google={google}
      onRetry={() => {
        setPhase('loading');
        setLoadKey((value) => value + 1);
      }}
      onAppleKeyId={(value) => setApple((current) => ({ ...current, keyId: value }))}
      onAppleIssuerId={(value) => setApple((current) => ({ ...current, issuerId: value }))}
      onAppleFile={(file) => {
        setAppleFile(file);
        setApple((current) => ({ ...current, fileName: file?.name ?? null }));
      }}
      onAppleSubmit={() => void submitApple()}
      onAppleReplace={() =>
        setApple((current) => ({ ...current, open: true, confirmingDisconnect: false, error: null }))
      }
      onAppleCancelReplace={() => {
        setAppleFile(null);
        setApple((current) => ({
          ...current,
          open: false,
          error: null,
          keyId: '',
          issuerId: '',
          fileName: null,
          fileKey: current.fileKey + 1,
        }));
      }}
      onAppleAskDisconnect={() => setApple((current) => ({ ...current, confirmingDisconnect: true, error: null }))}
      onAppleConfirmDisconnect={() => void removeApple()}
      onAppleCancelDisconnect={() => setApple((current) => ({ ...current, confirmingDisconnect: false }))}
      onGoogleFile={(file) => {
        setGoogleFile(file);
        setGoogle((current) => ({ ...current, fileName: file?.name ?? null }));
      }}
      onGoogleSubmit={() => void submitGoogle()}
      onGoogleReplace={() =>
        setGoogle((current) => ({ ...current, open: true, confirmingDisconnect: false, error: null }))
      }
      onGoogleCancelReplace={() => {
        setGoogleFile(null);
        setGoogle((current) => ({
          ...current,
          open: false,
          error: null,
          fileName: null,
          fileKey: current.fileKey + 1,
        }));
      }}
      onGoogleAskDisconnect={() => setGoogle((current) => ({ ...current, confirmingDisconnect: true, error: null }))}
      onGoogleConfirmDisconnect={() => void removeGoogle()}
      onGoogleCancelDisconnect={() => setGoogle((current) => ({ ...current, confirmingDisconnect: false }))}
    />
    {surface === 'settings' ? (
      <StoreSubmitSettings credentialPhase={phase} credentials={credentials} />
    ) : null}
    </>
  );
}
