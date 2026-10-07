'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { offerPaths } from '@/lib/marketing/offer';
import { inkFieldClass, inkPanelClass, inkPrimaryClass, inkSecondaryClass } from '@/lib/marketing/publicInk';

const fieldClass = `mt-2 ${inkFieldClass}`;

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WalkthroughForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [preferredWindow, setPreferredWindow] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const successRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'success') successRef.current?.focus();
  }, [status]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('submitting');
    setError('');
    try {
      const response = await fetch('/api/walkthrough', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, storeUrl, preferredWindow, note }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        setStatus('error');
        setError(data.error || 'We could not save this request.');
        return;
      }
      setStatus('success');
    } catch {
      setStatus('error');
      setError('We could not save this request.');
    }
  }

  if (status === 'success') {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        className={`${inkPanelClass} p-6 sm:p-8`}
      >
        <h2 className="text-2xl font-semibold text-[#f6f3ee]">Request received</h2>
        <p className="mt-4 text-base leading-7 text-[#c5c7c1]">
          A person will follow up by email. This form did not reserve a calendar time, and it did not connect Shopify.
        </p>
        <Link
          href={offerPaths.fit}
          className={`mt-6 ${inkSecondaryClass}`}
        >
          Check fit
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {status === 'error' && error && (
        <p role="alert" className="rounded-[4px] border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="walk-name" className="text-sm font-medium text-[#c5c7c1]">
          Name
        </label>
        <input id="walk-name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="walk-email" className="text-sm font-medium text-[#c5c7c1]">
          Email
        </label>
        <input id="walk-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="walk-store" className="text-sm font-medium text-[#c5c7c1]">
          Store URL <span className="font-normal text-[#a3a69f]">(optional)</span>
        </label>
        <input
          id="walk-store"
          name="storeUrl"
          inputMode="url"
          value={storeUrl}
          onChange={(event) => setStoreUrl(event.target.value)}
          placeholder="Leave blank if the store is not live"
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="walk-window" className="text-sm font-medium text-[#c5c7c1]">
          Times that work for you <span className="font-normal text-[#a3a69f]">(optional)</span>
        </label>
        <input
          id="walk-window"
          name="preferredWindow"
          value={preferredWindow}
          onChange={(event) => setPreferredWindow(event.target.value)}
          aria-describedby="walk-window-help"
          className={fieldClass}
        />
        <p id="walk-window-help" className="mt-2 text-sm leading-6 text-[#c5c7c1]">
          This is a note for our team. It does not confirm a meeting.
        </p>
      </div>
      <div>
        <label htmlFor="walk-note" className="text-sm font-medium text-[#c5c7c1]">
          What you want to see <span className="font-normal text-[#a3a69f]">(optional)</span>
        </label>
        <textarea id="walk-note" name="note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className={`${inkPrimaryClass} w-full sm:w-auto`}
      >
        {status === 'submitting' ? 'Saving…' : 'Request a walkthrough'}
      </button>
    </form>
  );
}
