'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ConnectStep } from '@/components/onboarding/steps/ConnectStep';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/onboarding/branding';
import type { BrandingDraft, LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';
import { checkoutWording, homePlatform, offerExcludes, offerPaths, offerPositioning } from '@/lib/marketing/offer';

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

export default function ProductTour() {
  const [draft, setDraft] = useState<BrandingDraft>(emptyDraft);
  const [primaryValid, setPrimaryValid] = useState(true);
  const [secondaryValid, setSecondaryValid] = useState(true);
  const [notice, setNotice] = useState('');

  return (
    <div className="space-y-10">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-purple-200">{offerPositioning.eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white">See Cartaisy in action</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
          These are the real merchant dashboard steps, shown here without a store connection. Nothing on this page installs an app, opens Shopify, or plays a video.
        </p>
      </header>

      {notice && (
        <p role="status" className="rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-100">
          {notice}
        </p>
      )}

      <section aria-labelledby="tour-connect" className="space-y-3">
        <h2 id="tour-connect" className="text-lg font-semibold text-white">
          Connect Shopify
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          An invited merchant sees this step after signup. The button on this tour does not start Shopify OAuth.
        </p>
        <div className="overflow-x-auto rounded-2xl bg-[#f6f6f7] p-3 sm:p-6">
          <ConnectStep
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
            onStart={() => setNotice('This tour does not connect Shopify. Request a walkthrough if you want to see a live store.')}
            onContinue={() => setNotice('Continue without connecting is a dashboard step. It does not create an account from this page.')}
            onRefresh={() => setNotice('This tour does not check a live Shopify connection.')}
            onSyncAgain={() => setNotice('This tour does not sync a catalog.')}
          />
        </div>
      </section>

      <section aria-labelledby="tour-brand" className="space-y-3">
        <h2 id="tour-brand" className="text-lg font-semibold text-white">
          Brand
        </h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-300">
          Name, logo, colors, icon, and splash are the supported brand fields. Files you pick here stay in the browser. Launcher icon and native splash still need a new build.
        </p>
        <div className="overflow-x-auto rounded-2xl bg-[#f6f6f7] p-3 sm:p-6">
          <BrandingStep
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
            onLogoFile={() => setNotice('This tour does not upload a logo.')}
            onIconFile={() => setNotice('This tour does not upload an icon.')}
            onSplashFile={() => setNotice('This tour does not upload a splash image.')}
            onImageError={(message) => setNotice(message || 'That image was not accepted.')}
            onBack={() => setNotice('Back returns to Connect Shopify in the invited dashboard.')}
            onContinue={() => setNotice('Brand is saved only after an invite, inside the dashboard.')}
            onRetry={() => undefined}
            installPreview={{ phase: 'unavailable', installs: [] }}
          />
        </div>
      </section>

      <section aria-labelledby="tour-checkout" className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 id="tour-checkout" className="text-lg font-semibold text-white">
          Shopper checkout
        </h2>
        <p className="mt-3 text-base leading-7 text-slate-200">{checkoutWording}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          There is no public shopper install on this page. The shopper path was proven on Cartaisy staging, not as a download you can open from the marketing site.
        </p>
      </section>

      <section aria-labelledby="tour-build" className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 id="tour-build" className="text-lg font-semibold text-white">
          Build my app
        </h2>
        <p className="mt-3 text-base font-normal leading-[1.6] text-slate-200">{homePlatform.android}</p>
        <p className="mt-2 text-base font-normal leading-[1.6] text-slate-200">{homePlatform.ios}</p>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The first-build note inside the brand screen is the real empty state. It does not include a public install link.
        </p>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-200">
          {offerExcludes.slice(0, 4).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={offerPaths.walkthrough}
          className="inline-flex min-h-11 items-center justify-center rounded-[4px] bg-white px-4 text-sm font-semibold text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          {offerPositioning.walkthroughCta}
        </Link>
        <Link
          href={offerPaths.fit}
          className="inline-flex min-h-11 items-center justify-center rounded-[4px] border border-white/20 px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
        >
          {offerPositioning.primaryCta}
        </Link>
      </div>
    </div>
  );
}
