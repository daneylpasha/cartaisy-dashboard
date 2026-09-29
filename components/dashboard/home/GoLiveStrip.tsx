'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopifyCatalogBlockPanel } from '@/components/shopify/ShopifyCatalogBlockPanel';
import { HomeInstallCard } from '@/components/dashboard/home/HomeInstallCard';
import { HomeSubmitCard } from '@/components/dashboard/home/HomeSubmitCard';
import type { ReadyInstall } from '@/lib/build/installPreview';
import {
  buildGoLive,
  type GoLiveInput,
  type GoLiveStep,
  type GoLiveTone,
} from '@/lib/dashboard/goLive';
import { BUILD_MY_APP_HREF, BUILD_SETUP_SETTINGS_HREF } from '@/lib/storeCredentials/contract';
import type { ShopifyCatalogBlockKind } from '@/lib/onboarding/types';
import { cn } from '@/lib/utils';

const STORE_BRANDING_HREF = '/dashboard/settings#store-branding';

const QUIET_LINK =
  'font-medium text-slate-950 underline decoration-slate-300 underline-offset-4 transition-colors hover:decoration-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400';

function Mark({ tone }: { tone: GoLiveTone }) {
  if (tone === 'done') {
    return (
      <span aria-hidden className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-slate-300">
        <Check className="size-3.5" strokeWidth={2} />
      </span>
    );
  }
  if (tone === 'current') {
    return (
      <span aria-hidden className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
        <span className="size-2 rounded-full bg-slate-950" />
      </span>
    );
  }
  return (
    <span aria-hidden className="mt-0.5 flex size-5 shrink-0 items-center justify-center">
      <span className="size-2 rounded-full border border-slate-200 bg-white" />
    </span>
  );
}

function StepRow({
  step,
  homeStatus,
  installs,
  showInstallLink,
  notices,
  showSubmitLink,
}: {
  step: GoLiveStep;
  homeStatus: string | null;
  installs: ReadyInstall[];
  showInstallLink: boolean;
  notices: GoLiveInput['submitNotices'];
  showSubmitLink: boolean;
}) {
  const quiet = step.tone === 'done' || step.tone === 'waiting' || step.tone === 'quiet' || step.tone === 'unknown';
  return (
    <li
      data-go-live-step={step.id}
      data-go-live-tone={step.tone}
      {...(step.id === 'home' && homeStatus ? { 'data-home-layout': homeStatus } : {})}
      {...(step.id === 'preview' && step.status === 'Building' ? { 'data-home-preview-building': '' } : {})}
      aria-current={step.tone === 'current' ? 'step' : undefined}
      className={cn('px-5 py-3.5', step.tone === 'current' && 'bg-slate-50/80')}
    >
      <div className="flex items-start gap-3">
        <Mark tone={step.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-4">
            <p className={cn('text-sm', quiet ? 'text-slate-500' : 'font-medium text-slate-950')}>{step.title}</p>
            <p className={cn('text-right text-sm', step.tone === 'current' ? 'font-medium text-slate-950' : 'text-slate-400')}>
              {step.status}
            </p>
          </div>
          {step.detail ? <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{step.detail}</p> : null}
          {step.id === 'brand' && step.tone === 'current' ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              <Link href={STORE_BRANDING_HREF} className={QUIET_LINK}>
                Settings
              </Link>
            </p>
          ) : null}
          {step.id === 'accounts' && step.tone !== 'done' ? (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              <Link href={BUILD_SETUP_SETTINGS_HREF} className={QUIET_LINK}>
                Store accounts
              </Link>
            </p>
          ) : null}
          {step.id === 'preview' && step.status === 'Ready to install' ? (
            <HomeInstallCard installs={installs} folded link={showInstallLink} />
          ) : null}
          {step.id === 'preview' && step.status !== 'Ready to install' && showInstallLink ? (
            <p className="mt-1">
              <Link href={BUILD_MY_APP_HREF} className={QUIET_LINK}>
                Open Build
              </Link>
            </p>
          ) : null}
          {step.id === 'submit' && notices.length > 0 ? (
            <div className="mt-3">
              <HomeSubmitCard notices={notices} link={showSubmitLink} folded />
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/**
 * One readiness strip for a connected store.
 * The safety notice for reconnect or billing stays the action for that block.
 */
export function GoLiveStrip({
  input,
  shop,
  installs,
}: {
  input: GoLiveInput;
  shop: string | null;
  installs: ReadyInstall[];
}) {
  const model = buildGoLive(input);
  const safety: ShopifyCatalogBlockKind | null = input.catalogBlock;
  const buildIsCta = model.cta?.href === BUILD_MY_APP_HREF;

  return (
    <section data-go-live="" aria-labelledby="go-live-heading" className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-4 sm:justify-start sm:gap-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-400">Go live</p>
            <p className="text-[11px] tabular-nums tracking-wide text-slate-400">
              {model.readyCount} of {model.stepCount}
            </p>
          </div>
          <h2 id="go-live-heading" className="mt-1 font-heading text-lg font-semibold tracking-tight text-slate-950">
            {model.headline}
          </h2>
          <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">{model.support}</p>
        </div>
        {model.cta ? (
          <Button asChild data-go-live-cta="" className="h-11 w-full shrink-0 rounded-lg bg-slate-950 px-4 text-white hover:bg-slate-800 sm:w-auto">
            <Link href={model.cta.href}>{model.cta.label}</Link>
          </Button>
        ) : null}
      </div>
      <ol className="divide-y divide-slate-100 border-t border-slate-100">
        {model.steps.map((step) => (
          <StepRow
            key={step.id}
            step={step}
            homeStatus={input.homeLayout?.status ?? null}
            installs={installs}
            showInstallLink={!buildIsCta}
            notices={input.submitNotices}
            showSubmitLink={!buildIsCta && input.preview !== 'ready'}
          />
        ))}
      </ol>
      {safety ? <ShopifyCatalogBlockPanel block={safety} shop={shop} embedded /> : null}
    </section>
  );
}
