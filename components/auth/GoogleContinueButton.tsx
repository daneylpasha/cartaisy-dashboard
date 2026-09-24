'use client';

import { useEffect, useRef } from 'react';
import { isGoogleSignInEnabled } from '@/lib/auth/googleSession';

type CredentialCallback = (idToken: string) => void;

type GoogleId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    auto_select?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type: 'standard';
      theme: 'outline';
      size: 'large';
      text: 'continue_with';
      shape: 'rectangular';
      width: number;
      logo_alignment: 'center';
    },
  ) => void;
};

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let gisPromise: Promise<void> | null = null;

function loadGoogleIdentity(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-cartaisy-gis="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Google script failed')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.dataset.cartaisyGis = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google script failed'));
    document.head.appendChild(script);
  });
  return gisPromise;
}

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"
      />
    </svg>
  );
}

export function AuthOrDivider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center" aria-hidden>
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-card px-3 text-xs font-medium text-slate-500">or</span>
      </div>
    </div>
  );
}

/**
 * Continue with Google. The visible control follows Google's light branded button.
 * The official Identity Services button is rendered on top, transparent, so the
 * click still comes from Google and returns an ID token credential.
 * Renders nothing when NEXT_PUBLIC_GOOGLE_CLIENT_ID is unset.
 */
export function GoogleContinueButton({
  onCredential,
  disabled = false,
}: {
  onCredential: CredentialCallback;
  disabled?: boolean;
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim();
  const hostRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    const host = hostRef.current;
    if (!clientId || !host) return;
    let cancelled = false;

    loadGoogleIdentity()
      .then(() => {
        if (cancelled || !host || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          callback: (response) => {
            if (response.credential) onCredentialRef.current(response.credential);
          },
        });
        const width = Math.min(400, Math.max(200, Math.floor(host.getBoundingClientRect().width)));
        host.replaceChildren();
        window.google.accounts.id.renderButton(host, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'center',
          width,
        });
      })
      .catch(() => {
        // The branded button stays visible. A failed script leaves it non-interactive.
      });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  if (!isGoogleSignInEnabled() || !clientId) return null;

  return (
    <div className={`relative h-10 w-full ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
      <div
        aria-hidden
        className="flex h-10 w-full items-center justify-center gap-3 rounded-md border border-[#747775] bg-white text-sm font-medium text-[#1f1f1f]"
      >
        <GoogleMark />
        Continue with Google
      </div>
      <div ref={hostRef} className="absolute inset-0 overflow-hidden opacity-0" />
    </div>
  );
}
