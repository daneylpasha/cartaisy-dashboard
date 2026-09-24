'use client';

import { useEffect, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCookieConsent } from '@/components/cookies';

const SURFACE = '#f5f5f6';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { showBanner } = useCookieConsent();

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtml = html.style.backgroundColor;
    const previousBody = body.style.backgroundColor;
    html.style.backgroundColor = SURFACE;
    body.style.backgroundColor = SURFACE;
    return () => {
      html.style.backgroundColor = previousHtml;
      body.style.backgroundColor = previousBody;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col bg-[#f5f5f6] text-slate-950">
      <div className="flex flex-1 flex-col">
        <div className="flex-1" aria-hidden />
        <div className="mx-auto w-full max-w-[440px] px-4 py-10 sm:px-0">
          <Link
            href="/"
            className="mb-8 flex justify-center rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
          >
            <Image
              src="/cartaisy-black-logo.png"
              alt="Cartaisy"
              width={422}
              height={100}
              priority
              className="h-7 w-auto"
            />
          </Link>
          {children}
        </div>
        <div className="flex-1" aria-hidden />
      </div>
      {showBanner ? <div className="h-56 shrink-0" aria-hidden /> : null}
    </div>
  );
}
