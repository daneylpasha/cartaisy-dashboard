'use client';

import { useEffect, useRef, useState } from 'react';
import { InstallQrMark } from '@/components/build/InstallQrMark';
import { readInstallUrl } from '@/lib/build/contract';
import { INSTALL_QR_WAIT_COPY, type InstallQrSlot } from '@/lib/build/installPreview';

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

function QuietInstallWell({ pixelSize, caption }: { pixelSize: number; caption: boolean }) {
  return (
    <div
      data-install-wait=""
      aria-hidden
      className="flex flex-col items-center justify-center gap-4 bg-white px-5 text-center"
      style={{ width: pixelSize, height: pixelSize }}
    >
      <span className="size-1.5 rounded-full bg-slate-950 motion-safe:animate-pulse" />
      {caption ? <p className="text-sm leading-6 text-slate-500">When the preview is ready.</p> : null}
    </div>
  );
}

function shownSlots(slots: InstallQrSlot[]): InstallQrSlot[] {
  const next: InstallQrSlot[] = [];
  for (const slot of slots) {
    if (!slot.url) {
      next.push(slot);
      continue;
    }
    const url = readInstallUrl(slot.url);
    if (url) next.push({ ...slot, url });
    else next.push({ ...slot, url: null });
  }
  return next;
}

/** Large install codes above the platform cards. A waiting slot keeps the same frame. */
export function InstallQrBoard({ slots }: { slots: InstallQrSlot[] }) {
  const shown = shownSlots(slots);
  if (shown.length === 0) return null;
  const pixelSize = shown.length > 1 ? 196 : 232;
  const hasCode = shown.some((slot) => slot.url);

  return (
    <section aria-label="Install codes" className="mt-8">
      <p className="min-h-12 text-sm leading-6 text-slate-600">
        {hasCode ? 'Scan to install on your phone.' : INSTALL_QR_WAIT_COPY}
      </p>
      <div className={shown.length > 1 ? 'mt-4 grid gap-4 sm:grid-cols-2' : 'mt-4'}>
        {shown.map((slot) => (
          <article
            key={slot.platform}
            className="rounded-2xl border border-slate-200/80 bg-white px-5 py-6 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <h3 className="font-heading text-[15px] font-semibold tracking-tight text-slate-950">{slot.label}</h3>
            <div className="mx-auto mt-4 w-fit rounded-2xl bg-white p-3 ring-1 ring-slate-200">
              {slot.url ? (
                <InstallQrMark url={slot.url} title={`${slot.label} install code`} pixelSize={pixelSize} />
              ) : (
                <QuietInstallWell pixelSize={pixelSize} caption={!hasCode} />
              )}
            </div>
            {slot.url ? (
              <>
                <a
                  href={slot.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block break-all text-sm leading-6 text-slate-600 underline-offset-4 hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                  {slot.url}
                </a>
                <CopyInstallLink url={slot.url} />
              </>
            ) : hasCode ? (
              <p className="mt-4 text-sm leading-6 text-slate-500">{INSTALL_QR_WAIT_COPY}</p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
