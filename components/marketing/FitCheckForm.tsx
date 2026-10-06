'use client';

import { useState } from 'react';
import Link from 'next/link';
import { offerPaths, offerPositioning } from '@/lib/marketing/offer';
import { type FitGoal, type FitResult, type FitStage } from '@/lib/marketing/fitCheck';

const fieldClass =
  'mt-2 w-full min-h-11 rounded-lg border border-white/15 bg-white/5 px-3 text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function FitCheckForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<FitStage | ''>('');
  const [goal, setGoal] = useState<FitGoal | ''>('');
  const [storeUrl, setStoreUrl] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [result, setResult] = useState<FitResult | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    if (!stage || !goal) {
      setStatus('error');
      setError('Choose a Shopify stage and what you want from Cartaisy.');
      return;
    }
    setStatus('submitting');
    try {
      const response = await fetch('/api/fit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, stage, goal, storeUrl, note }),
      });
      const data = (await response.json()) as { error?: string; title?: string; summary?: string; outcome?: FitResult['outcome'] };
      if (!response.ok || !data.outcome || !data.title || !data.summary) {
        setStatus('error');
        setError(data.error || 'We could not save this fit check.');
        setResult(null);
        return;
      }
      setResult({ outcome: data.outcome, title: data.title, summary: data.summary });
      setStatus('success');
    } catch {
      setStatus('error');
      setError('We could not save this fit check.');
      setResult(null);
    }
  }

  if (status === 'success' && result) {
    return (
      <div role="status" className="rounded-2xl border border-white/15 bg-white/5 p-6 sm:p-8">
        <p className="text-sm font-medium uppercase tracking-wide text-purple-200">Fit check result</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">{result.title}</h2>
        <p className="mt-4 text-base leading-7 text-slate-200">{result.summary}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={offerPaths.walkthrough}
            className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            {offerPositioning.walkthroughCta}
          </Link>
          <Link
            href={offerPaths.demo}
            className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-white/20 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
          >
            {offerPositioning.secondaryCta}
          </Link>
        </div>
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
        <label htmlFor="fit-name" className="text-sm font-medium text-white">
          Name
        </label>
        <input id="fit-name" name="name" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
      </div>
      <div>
        <label htmlFor="fit-email" className="text-sm font-medium text-white">
          Email
        </label>
        <input id="fit-email" name="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-white">Where are you with Shopify?</legend>
        <StageOption id="stage-operating" value="operating" current={stage} onChange={setStage} label="I already run a Shopify store" />
        <StageOption id="stage-prelaunch" value="prelaunch" current={stage} onChange={setStage} label="I am planning a Shopify store" />
        <StageOption id="stage-not" value="not_shopify" current={stage} onChange={setStage} label="I am not planning to use Shopify" />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium text-white">What do you want?</legend>
        <StageOption
          id="goal-app"
          value="branded_app"
          current={goal}
          onChange={setGoal}
          label="A branded shopping app that uses my Shopify catalog and Shopify checkout"
        />
        <StageOption
          id="goal-other"
          value="other"
          current={goal}
          onChange={setGoal}
          label="Another goal"
        />
      </fieldset>

      <div>
        <label htmlFor="fit-store" className="text-sm font-medium text-white">
          Store URL <span className="font-normal text-slate-300">(optional)</span>
        </label>
        <input
          id="fit-store"
          name="storeUrl"
          inputMode="url"
          autoComplete="url"
          value={storeUrl}
          onChange={(event) => setStoreUrl(event.target.value)}
          placeholder="Leave blank if you do not have a store yet"
          aria-describedby="fit-store-help"
          className={fieldClass}
        />
        <p id="fit-store-help" className="mt-2 text-sm leading-6 text-slate-300">
          You can leave this blank if your store is still in planning.
        </p>
      </div>

      <div>
        <label htmlFor="fit-note" className="text-sm font-medium text-white">
          Anything we should know <span className="font-normal text-slate-300">(optional)</span>
        </label>
        <textarea id="fit-note" name="note" rows={4} value={note} onChange={(event) => setNote(event.target.value)} className={fieldClass} />
      </div>

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 disabled:opacity-60 sm:w-auto"
      >
        {status === 'submitting' ? 'Saving…' : 'See if Cartaisy fits'}
      </button>
    </form>
  );
}

function StageOption<T extends string>({
  id,
  value,
  current,
  onChange,
  label,
}: {
  id: string;
  value: T;
  current: T | '';
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-white/10 px-3 py-3 text-sm leading-6 text-slate-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-purple-300">
      <input
        id={id}
        type="radio"
        name={id.startsWith('stage') ? 'stage' : 'goal'}
        value={value}
        checked={current === value}
        onChange={() => onChange(value)}
        className="mt-1 size-4"
      />
      <span>{label}</span>
    </label>
  );
}
