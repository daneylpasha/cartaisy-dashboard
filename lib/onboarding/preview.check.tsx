import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandHandoff } from '@/components/onboarding/BrandHandoff';
import { SmartHomePreview } from '@/components/onboarding/SmartHomePreview';
import { mergeStoredBrandAssets } from '@/lib/onboarding/brandAssets';
import { brandingFromPayload } from '@/lib/onboarding/branding';
import type { BrandingDraft, LockedCatalog, SyncGate } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const previewSource = source('../../components/onboarding/SmartHomePreview.tsx');
const brandSource = source('../../components/onboarding/steps/BrandingStep.tsx');
const previewStepSource = source('../../components/onboarding/steps/PreviewStep.tsx');
const wizardSource = source('../../components/onboarding/OnboardingWizard.tsx');

assert.doesNotMatch(previewSource, /cartaisy/i);
assert.doesNotMatch(brandSource, /preview only/i);
assert.doesNotMatch(brandSource, /api key|access token|accessToken/i);
assert.match(wizardSource, /uploadBrandAsset/);
assert.match(wizardSource, /planBrandAssetSave/);
assert.match(wizardSource, /plan\.persist === 'dashboard'/);
assert.match(brandSource, /imageUrl=\{draft\.iconUrl\}/);
assert.match(brandSource, /imageUrl=\{draft\.splashUrl\}/);
assert.doesNotMatch(wizardSource, /uploadOptionalBrandAsset/);
assert.doesNotMatch(previewSource, /from-purple|to-pink|purple-6/);
assert.doesNotMatch(previewSource, /9:41/);
assert.doesNotMatch(previewSource, /Your app/);
assert.match(brandSource, /<SmartHomePreview[\s\S]*draft=\{draft\}/);
assert.match(previewStepSource, /<SmartHomePreview[\s\S]*draft=\{draft\}/);
assert.match(wizardSource, /onDraftChange=\{setDraft\}/);
assert.equal(previewStepSource.match(/<SmartHomePreview/g)?.length, 1);

const draft: BrandingDraft = {
  appName: 'Northwind',
  logoUrl: 'https://cdn.example/logo.png',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: 'https://cdn.example/splash.png',
  primaryColor: '#0F766E',
  secondaryColor: '#F5F5F4',
  splashPersisted: false,
  iconPersisted: false,
};

const catalog: LockedCatalog = {
  productCount: 2,
  orderCount: null,
  collections: ['Outerwear'],
  products: [
    {
      id: 'p1',
      title: 'Linen overshirt',
      imageUrl: 'https://cdn.example/p1.jpg',
      priceLabel: '$128',
    },
    {
      id: 'p2',
      title: 'Wool cap',
      imageUrl: null,
      priceLabel: '$42',
    },
  ],
};

const succeeded: SyncGate = {
  state: 'succeeded',
  detail: null,
  eligibleForBuild: true,
  eligibilityReason: null,
};

function screen(markup: string): string {
  const start = markup.indexOf('data-shopper-screen');
  const end = markup.indexOf('<figcaption');
  assert.ok(start >= 0 && end > start, 'phone screen should sit above the footnote');
  return markup.slice(start, end);
}

function render(overrides: {
  draft?: BrandingDraft;
  catalog?: LockedCatalog;
  sync?: SyncGate;
  pending?: boolean;
  initialScreen?: 'opening' | 'home' | 'product' | 'cart' | 'wishlist' | 'account';
}): string {
  return renderToStaticMarkup(
    createElement(SmartHomePreview, {
      draft,
      catalog,
      sync: succeeded,
      ...overrides,
    })
  );
}

const populated = render({});
const populatedScreen = screen(populated);
assert.match(populatedScreen, /data-preview-screen="home"/);
assert.match(populatedScreen, /Northwind/);
assert.match(populatedScreen, /Search Northwind/);
assert.match(populatedScreen, /Add delivery address/);
assert.match(populatedScreen, /Selected from the shop/);
assert.match(populatedScreen, /Featured/);
assert.match(populatedScreen, /Browse/);
assert.match(populatedScreen, />Home</);
assert.match(populatedScreen, />Cart</);
assert.match(populatedScreen, />Wishlist</);
assert.match(populatedScreen, />Account</);
assert.doesNotMatch(populatedScreen, />Bag</);
assert.doesNotMatch(populatedScreen, /9:41/);
assert.match(populatedScreen, /https:\/\/cdn\.example\/logo\.png/);
assert.doesNotMatch(populatedScreen, /https:\/\/cdn\.example\/icon\.png/);
assert.doesNotMatch(populatedScreen, /https:\/\/cdn\.example\/splash\.png/);
assert.match(populatedScreen, /#0f766e/);
assert.match(populatedScreen, /#f5f5f4/);
assert.match(populatedScreen, /Linen overshirt/);
assert.match(populatedScreen, /\$128/);
assert.match(populatedScreen, /Outerwear/);
assert.match(populated, /data-shopper-limits/);
assert.match(populated, /installable app shows the published home/);
assert.match(populated, /smart default until you publish/);
assert.match(populated, /Module-stack edits stay off the device until Publish/);
assert.match(populated, /published home/);
assert.doesNotMatch(populatedScreen, /cartaisy/i);
assert.doesNotMatch(populated, /cartaisy/i);

const iconOnly = screen(render({ draft: { ...draft, logoUrl: null } }));
assert.match(iconOnly, /https:\/\/cdn\.example\/icon\.png/);
assert.doesNotMatch(iconOnly, /https:\/\/cdn\.example\/logo\.png/);

const opening = screen(render({ initialScreen: 'opening' }));
assert.match(opening, /data-preview-screen="opening"/);
assert.match(opening, /https:\/\/cdn\.example\/splash\.png/);
assert.doesNotMatch(opening, /Search Northwind/);
assert.doesNotMatch(opening, /9:41/);

const productScreen = screen(render({ initialScreen: 'product' }));
assert.match(productScreen, /Linen overshirt/);
assert.match(productScreen, /\$128/);
assert.match(productScreen, /Add to Cart/);
assert.match(productScreen, /Buy Now/);
assert.match(productScreen, /Secure checkout continues on the store&#x27;s page\.|Secure checkout continues on the store's page\./);

const cartScreen = screen(render({ initialScreen: 'cart' }));
assert.match(cartScreen, /Linen overshirt/);
assert.match(cartScreen, /Proceed to Checkout \(1\)/);
assert.match(cartScreen, /Subtotal \(1 Item\)/);
assert.match(cartScreen, />Cart</);

const renamed = screen(render({ draft: { ...draft, appName: 'Harbor & Co' } }));
assert.match(renamed, /Harbor &amp; Co|Harbor & Co/);
assert.doesNotMatch(renamed, /Northwind/);

const recolored = screen(render({ draft: { ...draft, primaryColor: '#1D4ED8', secondaryColor: '#9A3412' } }));
assert.match(recolored, /#1d4ed8/);
assert.match(recolored, /#9a3412/);
assert.doesNotMatch(recolored, /#0f766e/);

const unnamed = screen(render({ draft: { ...draft, appName: '  ' } }));
assert.match(unnamed, /Welcome/);
assert.match(unnamed, />Search</);
assert.doesNotMatch(unnamed, /Your app/);

const emptyCatalog: LockedCatalog = { ...catalog, collections: [], products: [] };
const empty = screen(render({ catalog: emptyCatalog }));
assert.match(empty, /Nothing to show yet/);
assert.match(empty, /Products will show up here once they&#x27;re available\.|Products will show up here once they're available\./);
assert.match(empty, /Northwind/);
assert.doesNotMatch(empty, /Linen overshirt/);
assert.doesNotMatch(empty, /cartaisy/i);

const loading = screen(render({ pending: true }));
assert.match(loading, /Loading your products/);
assert.match(loading, /Northwind/);
assert.doesNotMatch(loading, /Linen overshirt/);
assert.doesNotMatch(loading, /cartaisy/i);

const handoff = renderToStaticMarkup(createElement(BrandHandoff, { draft }));
assert.match(handoff, /Northwind/);
assert.match(handoff, /https:\/\/cdn\.example\/icon\.png/);
assert.doesNotMatch(handoff, /splash\.png/);
assert.doesNotMatch(handoff, /cartaisy/i);
assert.doesNotMatch(handoff, /api key|access token/i);

const missingIcon = renderToStaticMarkup(
  createElement(BrandHandoff, { draft: { ...draft, appName: 'Harbor', iconUrl: null } })
);
assert.match(missingIcon, /Harbor/);
assert.match(missingIcon, />H</);
assert.doesNotMatch(missingIcon, /cdn\.example\/icon/);

const fromBranding = mergeStoredBrandAssets(
  brandingFromPayload(
    {
      data: {
        appName: 'Northwind',
        logoUrl: 'https://cdn.example/logo.png',
        primaryColor: '#0F766E',
        secondaryColor: '#F5F5F4',
        appIconUrl: 'https://cdn.example/api-icon.png',
        splashImageUrl: 'https://cdn.example/api-splash.png',
      },
    },
    'Stored name'
  ),
  {
    iconUrl: 'https://cdn.example/stored-icon.png',
    splashUrl: 'https://cdn.example/stored-splash.png',
  }
);
const brandingOpening = screen(render({ draft: fromBranding, initialScreen: 'opening' }));
assert.match(brandingOpening, /https:\/\/cdn\.example\/api-splash\.png/);
assert.doesNotMatch(brandingOpening, /stored-splash/);
const brandingIcon = screen(render({ draft: { ...fromBranding, logoUrl: null, splashUrl: null } }));
assert.match(brandingIcon, /https:\/\/cdn\.example\/api-icon\.png/);
assert.doesNotMatch(brandingIcon, /stored-icon/);
const brandingHandoff = renderToStaticMarkup(createElement(BrandHandoff, { draft: fromBranding }));
assert.match(brandingHandoff, /https:\/\/cdn\.example\/api-icon\.png/);
assert.doesNotMatch(brandingHandoff, /stored-icon/);
assert.doesNotMatch(brandingHandoff, /api-splash/);

console.log('preview check ok');
