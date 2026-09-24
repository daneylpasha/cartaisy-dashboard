'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { setupChecklist, type BrandingSaved } from '@/lib/dashboard/homeModel';

export function SetupHome({ storeName, brandingSaved }: { storeName: string; brandingSaved: BrandingSaved }) {
  const steps = setupChecklist(brandingSaved);

  return (
    <div className="mx-auto w-full max-w-xl motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-300">
      <p className="text-[13px] font-medium text-slate-500">Setup</p>
      <h1 className="mt-2 font-heading text-[1.75rem] font-semibold tracking-tight text-slate-950 sm:text-[2rem]">
        Set up {storeName}
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
        Connect Shopify first. Branding, a home preview, and the app build stay in the same guide.
      </p>
      <p className="mt-6 text-[13px] text-slate-500">Step 1 of 4 · Connect Shopify</p>

      <ol className="mt-3 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {steps.map((step, index) => (
          <li key={step.id} className="px-4 py-4 sm:px-5" aria-current={step.state === 'current' ? 'step' : undefined}>
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={cn(
                  'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium',
                  step.state === 'current' && 'bg-slate-950 text-white',
                  step.state === 'done' && 'bg-slate-950 text-white',
                  step.state === 'upcoming' && 'border border-slate-200 bg-white text-slate-400'
                )}
              >
                {step.state === 'done' ? <Check className="size-3.5" /> : index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <p
                    className={cn(
                      'text-sm font-medium',
                      step.state === 'upcoming' ? 'text-slate-700' : 'text-slate-950'
                    )}
                  >
                    {step.title}
                  </p>
                  {step.state !== 'current' && (
                    <Link
                      href={step.href}
                      className="shrink-0 text-sm text-slate-500 underline-offset-4 transition-colors hover:text-slate-950 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    >
                      Open
                    </Link>
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-5 text-slate-500">{step.detail}</p>
                {step.action && (
                  <Button asChild className="mt-3 h-11 w-full rounded-lg px-4 sm:w-auto">
                    <Link href={step.href}>{step.action}</Link>
                  </Button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
