'use client';

import { useEffect, useRef, useState } from 'react';
import { InstallQrMark } from '@/components/build/InstallQrMark';
import { readInstallUrl } from '@/lib/build/contract';
import type { ReadyInstall } from '@/lib/build/installPreview';

const COPY_BUTTON =
  'mt-3 text-sm font-medium text-slate-950 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2';

function CopyInstallLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  return (
    <button
      type="button"
      className={COPY_BUTTON}
      onClick={() => {
        const write = navigator.clipboard?.writeText;
        if (!write) return;
        void write.call(navigator.clipboard, url).then(
          () => {
            setCopied(true);
            if (timer.current !== null) window.clearTimeout(timer.current);
            timer.current = window.setTimeout(() => setCopied(false), 2000);
          },
          () => {
            setCopied(false);
          }
        );
      }}
    >
      {copied ? 'Copied' : 'Copy link'}
    </button>
  );
}

function visible(installs: ReadyInstall[]): ReadyInstall[] {
  const next: ReadyInstall[] = [];
  for (const install of installs) {
    const url = readInstallUrl(install.url);
    if (!url) continue;
    next.push({ ...install, url });
  }
  return next;
}

/** Large install codes above the platform cards. Text URL and copy stay with each code. */
export function InstallQrBoard({ installs }: { installs: ReadyInstall[] }) {
  const shown = visible(installs);
  if (shown.length === 0) return null;
  const pixelSize = shown.length > 1 ? 196 : 232;

  return (
    <section aria-label="Install codes" className="mt-8">
      <p className="text-sm leading-6 text-slate-600">Scan to install on your phone.</p>
      <div className={shown.length > 1 ? 'mt-4 grid gap-4 sm:grid-cols-2' : 'mt-4'}>
        {shown.map((install) => (
          <article
            key={install.platform}
            className="rounded-2xl border border-slate-200/80 bg-white px-5 py-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <h3 className="font-heading text-[15px] font-semibold tracking-tight text-slate-950">{install.label}</h3>
            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              <InstallQrMark url={install.url} title={`${install.label} install code`} pixelSize={pixelSize} />
            </div>
            <a
              href={install.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block break-all text-sm leading-6 text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              {install.url}
            </a>
            <CopyInstallLink url={install.url} />
          </article>
        ))}
      </div>
    </section>
  );
}
