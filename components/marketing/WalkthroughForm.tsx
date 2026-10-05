'use client';

import { useState } from 'react';
import Link from 'next/link';
import { offerPaths } from '@/lib/marketing/offer';

const fieldClass =
  'mt-2 w-full min-h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WalkthroughForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [preferredWindow, setPreferredWindow] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');

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
      <div role="status" className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">Request received</h2>
        <p className="mt-4 text-base leading-7 text-slate-200">
          A person will follow up by email. This form did not reserve a calendar time, and it did not connect Shopify.
        </p>
        <Link
          href={offerPaths.fit}
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          Check fit
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {status === 'error' && error && (
        <p role="alert" className="rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="walk-name" className="text-sm font-medium text-white">
          Name
        </label>
        <input id="walk-name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="walk-email" className="text-sm font-medium text-white">
          Email
        </label>
        <input id="walk-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="walk-store" className="text-sm font-medium text-white">
          Store URL <span className="font-normal text-slate-300">(optional)</span>
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
        <label htmlFor="walk-window" className="text-sm font-medium text-white">
          Times that work for you <span className="font-normal text-slate-300">(optional)</span>
        </label>
        <input
          id="walk-window"
          name="preferredWindow"
          value={preferredWindow}
          onChange={(event) => setPreferredWindow(event.target.value)}
          aria-describedby="walk-window-help"
          className={fieldClass}
        />
        <p id="walk-window-help" className="mt-2 text-sm leading-6 text-slate-300">
          This is a note for the operator. It does not confirm a meeting.
        </p>
      </div>
      <div>
        <label htmlFor="walk-note" className="text-sm font-medium text-white">
          What you want to see <span className="font-normal text-slate-300">(optional)</span>
        </label>
        <textarea id="walk-note" name="note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} />
      </div>
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Saving…' : 'Request a walkthrough'}
      </button>
    </form>
  );
}
