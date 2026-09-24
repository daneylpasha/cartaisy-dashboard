import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SmartHomePreview } from '@/components/onboarding/SmartHomePreview';
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
assert.doesNotMatch(previewSource, /from-purple|to-pink|purple-6/);
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
assert.match(populatedScreen, /Northwind/);
assert.match(populatedScreen, /https:\/\/cdn\.example\/logo\.png/);
assert.match(populatedScreen, /https:\/\/cdn\.example\/icon\.png/);
assert.match(populatedScreen, /https:\/\/cdn\.example\/splash\.png/);
assert.match(populatedScreen, /#0f766e/);
assert.match(populatedScreen, /#f5f5f4/);
assert.match(populatedScreen, /Linen overshirt/);
assert.match(populatedScreen, /\$128/);
assert.match(populatedScreen, /Outerwear/);
assert.doesNotMatch(populatedScreen, /cartaisy/i);
assert.doesNotMatch(populated, /cartaisy/i);

const renamed = screen(render({ draft: { ...draft, appName: 'Harbor & Co' } }));
assert.match(renamed, /Harbor &amp; Co|Harbor & Co/);
assert.doesNotMatch(renamed, /Northwind/);

const recolored = screen(render({ draft: { ...draft, primaryColor: '#1D4ED8', secondaryColor: '#9A3412' } }));
assert.match(recolored, /#1d4ed8/);
assert.match(recolored, /#9a3412/);
assert.doesNotMatch(recolored, /#0f766e/);

const unnamed = screen(render({ draft: { ...draft, appName: '  ' } }));
assert.match(unnamed, /Your app/);

const emptyCatalog: LockedCatalog = { ...catalog, collections: [], products: [] };
const empty = screen(render({ catalog: emptyCatalog }));
assert.match(empty, /No products in this catalog yet\./);
assert.match(empty, /Northwind/);
assert.doesNotMatch(empty, /Linen overshirt/);
assert.doesNotMatch(empty, /cartaisy/i);

const loading = screen(render({ pending: true }));
assert.match(loading, /Loading your products/);
assert.match(loading, /Northwind/);
assert.doesNotMatch(loading, /Linen overshirt/);
assert.doesNotMatch(loading, /cartaisy/i);

console.log('preview check ok');
