'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectStep } from '@/components/onboarding/steps/ConnectStep';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/onboarding/branding';
import type { BrandingDraft, LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';
import { checkoutWording, homePlatform, offerExcludes, offerPaths, offerPositioning } from '@/lib/marketing/offer';
import { inkPanelClass, inkPrimaryClass, inkSecondaryClass } from '@/lib/marketing/publicInk';

const connection: ShopifyConnectionSnapshot = {
  statusKnown: true,
  isConnected: false,
  shopDomain: null,
  shopId: null,
  connectedAt: null,
  lastSyncAt: null,
  webhookRegistrationError: null,
};

const sync: SyncGate = {
  state: 'not_started',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: 'shopify_not_connected',
};

const catalog: LockedCatalog = {
  productCount: null,
  orderCount: null,
  collections: [],
};

const emptyDraft: BrandingDraft = {
  appName: '',
  logoUrl: null,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  secondaryColor: '',
  primaryExplicit: null,
  secondaryExplicit: null,
  splashUrl: null,
  iconUrl: null,
  splashPersisted: true,
  iconPersisted: true,
};

const sectionTitle =
  'font-heading text-[1.75rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#f6f3ee] sm:text-[2rem]';
const body = 'max-w-[62ch] text-base font-normal leading-[1.6] text-[#c5c7c1]';

export default function ProductTour() {
  const [draft, setDraft] = useState<BrandingDraft>(emptyDraft);
  const [primaryValid, setPrimaryValid] = useState(true);
  const [secondaryValid, setSecondaryValid] = useState(true);
  const [notice, setNotice] = useState('');

  const keepLocalFile = (kind: 'logoUrl' | 'iconUrl' | 'splashUrl', file: File) => {
    const url = URL.createObjectURL(file);
    setDraft((current) => {
      const previous = current[kind];
      if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous);
      return { ...current, [kind]: url };
    });
    setNotice('That file stays in this browser. This tour does not upload it.');
  };

  return (
    <div className="space-y-14" data-product-tour="">
      <header>
        <p className="text-sm font-medium uppercase tracking-normal text-[#B6C4A1]">{offerPositioning.eyebrow}</p>
        <h1 className="font-heading mt-4 text-[2rem] font-semibold leading-[1.1] tracking-[-0.025em] text-[#f6f3ee] sm:text-[2.75rem]">
          Explore your store-to-app setup.
        </h1>
        <p className={`mt-5 ${body} sm:text-lg`}>Try the setup steps with sample data. Changes stay in this tour.</p>
      </header>

      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={
          notice
            ? `${inkPanelClass} px-4 py-3 text-sm leading-6 text-[#c5c7c1]`
            : 'sr-only'
        }
      >
        {notice}
      </p>

      <section aria-labelledby="tour-connect" className="space-y-4">
        <div>
          <h2 id="tour-connect" className={sectionTitle}>
            Connect
          </h2>
          <p className={`mt-3 ${body}`}>Enter a store address to see the step. This tour does not open Shopify.</p>
        </div>
        <div className="min-w-0">
          <ConnectStep
            tourMode
            connection={connection}
            sync={sync}
            catalog={catalog}
            warning={null}
            checking={false}
            startError={null}
            starting={false}
            returnNotice={null}
            suggestedShop={null}
            syncing={false}
            onStart={() => setNotice('This tour does not open Shopify. The store stays disconnected.')}
            onContinue={() =>
              setNotice('Continue without connecting stays in this tour. It does not open the dashboard.')
            }
            onRefresh={() => setNotice('This tour does not check a live Shopify connection.')}
            onSyncAgain={() => setNotice('This tour does not sync a catalog.')}
          />
        </div>
      </section>

      <section aria-labelledby="tour-brand" className="space-y-4">
        <div>
          <h2 id="tour-brand" className={sectionTitle}>
            Brand
          </h2>
          <p className={`mt-3 ${body}`}>Set the name, colors, and images. Files you pick stay in this browser.</p>
        </div>
        <div className="min-w-0">
          <BrandingStep
            tourMode
            draft={draft}
            connection={connection}
            catalog={catalog}
            sync={sync}
            warning={null}
            loadError={null}
            fieldError={null}
            saving={false}
            logoUploading={false}
            iconUploading={false}
            splashUploading={false}
            primaryValid={primaryValid}
            secondaryValid={secondaryValid}
            onDraftChange={setDraft}
            onPrimaryValidity={setPrimaryValid}
            onSecondaryValidity={setSecondaryValid}
            onLogoFile={(file) => keepLocalFile('logoUrl', file)}
            onIconFile={(file) => keepLocalFile('iconUrl', file)}
            onSplashFile={(file) => keepLocalFile('splashUrl', file)}
            onImageError={(message) => setNotice(message || 'That image was not accepted.')}
            onBack={() => setNotice('Back stays on this tour. It does not open the dashboard.')}
            onContinue={() => setNotice('Continue stays on this tour. Nothing is saved.')}
            onRetry={() => setNotice('This tour does not reload a store.')}
            onPublishHome={() => setNotice('Publish home stays in this tour. It does not open the dashboard.')}
            onGoLive={() => setNotice('Go live stays in this tour. It does not open the dashboard.')}
            onBuildMyApp={() => setNotice('Build my app stays in this tour. It does not start a build.')}
            installPreview={{ phase: 'unavailable', installs: [] }}
          />
        </div>
      </section>

      <section aria-labelledby="tour-checkout" className="space-y-3">
        <h2 id="tour-checkout" className={sectionTitle}>
          Checkout and build
        </h2>
        <p className={body}>{checkoutWording}</p>
        <p className={body}>Build my app records a request. This page does not start a build or offer a download.</p>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={offerPaths.walkthrough}
          className={inkPrimaryClass}
        >
          {offerPositioning.walkthroughCta}
        </Link>
        <Link
          href={offerPaths.fit}
          className={inkSecondaryClass}
        >
          {offerPositioning.primaryCta}
        </Link>
      </div>

      <details className={`${inkPanelClass} px-5 py-4`}>
        <summary className="flex min-h-12 cursor-pointer items-center rounded-[4px] text-base font-semibold text-[#f6f3ee] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B6C4A1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210]">
          Offer limits
        </summary>
        <div className="mt-4 space-y-3 text-base font-normal leading-[1.6] text-[#c5c7c1]">
          <p>{homePlatform.android}</p>
          <p>{homePlatform.ios}</p>
          <ul className="list-disc space-y-2 pl-5">
            {offerExcludes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </details>
    </div>
  );
}
