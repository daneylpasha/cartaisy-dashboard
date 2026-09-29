import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandHandoff } from '@/components/onboarding/BrandHandoff';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { wizardHeaderMark } from '@/components/onboarding/WizardChrome';
import { saveAppName } from '@/lib/onboarding/branding';
import {
  APP_NAME_WORDMARK_MESSAGE,
  isPlatformWordmark,
  merchantDisplayName,
} from '@/lib/onboarding/appName';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const rejected = ['Cartaisy', 'cartaisy', 'CARTAISY', '  Cartaisy  ', '\n\tcartaisy\t'];
for (const name of rejected) {
  assert.equal(isPlatformWordmark(name), true, name);
  assert.equal(merchantDisplayName(name), null, name);
  assert.equal(wizardHeaderMark(name), 'Setup', name);
}

const accepted = ['Harbor', '  Northwind  ', 'Harbor & Co', 'N', 'Cartaisy Shop', 'My Cartaisy', 'cartaisy.'];
for (const name of accepted) {
  assert.equal(isPlatformWordmark(name), false, name);
  assert.equal(merchantDisplayName(name), name.trim(), name);
}

assert.equal(merchantDisplayName(''), null);
assert.equal(merchantDisplayName('   '), null);
assert.equal(merchantDisplayName(null), null);
assert.equal(merchantDisplayName(undefined), null);
assert.equal(merchantDisplayName('northwind.myshopify.com'), 'northwind.myshopify.com');
assert.equal(merchantDisplayName('66f1c2e0a1b2c3d4e5f60710'), '66f1c2e0a1b2c3d4e5f60710');
assert.equal(wizardHeaderMark('northwind.myshopify.com', 'Harbor'), 'Harbor');
assert.equal(APP_NAME_WORDMARK_MESSAGE, 'Choose the name shoppers see on the app.');
assert.doesNotMatch(APP_NAME_WORDMARK_MESSAGE, /cartaisy|stack|66f1c2e0/i);

const draft: BrandingDraft = {
  appName: 'Northwind',
  logoUrl: null,
  iconUrl: null,
  splashUrl: null,
  primaryColor: '#0F766E',
  secondaryColor: '',
  splashPersisted: true,
  iconPersisted: true,
};

const connection: ShopifyConnectionSnapshot = {
  statusKnown: true,
  isConnected: true,
  shopDomain: null,
  shopId: null,
  connectedAt: null,
  lastSyncAt: null,
  webhookRegistrationError: null,
};

const quiet: SyncGate = {
  state: 'not_started',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
};

function continueButton(markup: string): string {
  const match = markup.match(/<button[^>]*>Continue<\/button>/);
  assert.ok(match, 'Continue button');
  return match[0];
}

function isDisabled(tag: string): boolean {
  return / disabled(?:=|>|\s)/.test(tag);
}

function renderBrand(appName: string): string {
  return renderToStaticMarkup(
    createElement(BrandingStep, {
      draft: { ...draft, appName },
      connection,
      catalog: EMPTY_CATALOG,
      sync: quiet,
      warning: null,
      loadError: null,
      fieldError: null,
      saving: false,
      logoUploading: false,
      iconUploading: false,
      splashUploading: false,
      primaryValid: true,
      secondaryValid: true,
      onDraftChange: () => undefined,
      onPrimaryValidity: () => undefined,
      onSecondaryValidity: () => undefined,
      onLogoFile: () => undefined,
      onSplashFile: () => undefined,
      onIconFile: () => undefined,
      onImageError: () => undefined,
      onBack: () => undefined,
      onContinue: () => undefined,
      onRetry: () => undefined,
    })
  );
}

for (const name of ['Cartaisy', 'cartaisy', '  Cartaisy  ']) {
  const markup = renderBrand(name);
  assert.equal(isDisabled(continueButton(markup)), true, name);
  assert.match(markup, /Choose the name shoppers see on the app\./);
  assert.doesNotMatch(markup, /Enter at least 2 characters/);
  assert.doesNotMatch(markup, /Error:|stack|66f1c2e0/i);
}

const harbor = renderBrand('Harbor & Co');
assert.equal(isDisabled(continueButton(harbor)), false);
assert.match(harbor, /This is the name shoppers see on the app\./);
assert.match(harbor, /value="Harbor &amp; Co"/);

const short = renderBrand('N');
assert.equal(isDisabled(continueButton(short)), true);
assert.match(short, /Enter at least 2 characters\. This is the name shoppers see\./);
assert.doesNotMatch(short, /Choose the name shoppers see/);

const handoff = renderToStaticMarkup(createElement(BrandHandoff, { draft: { ...draft, appName: '  Cartaisy  ' } }));
assert.doesNotMatch(handoff, /cartaisy/i);
assert.match(handoff, /Your app/);
const kept = renderToStaticMarkup(createElement(BrandHandoff, { draft: { ...draft, appName: '  Harbor  ' } }));
assert.match(kept, /Harbor/);

const route = source('../../app/api/store/route.ts');
const routeGate = route.indexOf('isPlatformWordmark(record.name)');
const routeAssets = route.indexOf('await saveStoreBrandAssets');
const routeUpdate = route.indexOf('storeService.updateStore');
assert.ok(routeGate > 0 && routeAssets > routeGate && routeUpdate > routeGate);
assert.match(route, /error: APP_NAME_WORDMARK_MESSAGE \}, \{ status: 400 \}/);

const wizard = source('../../components/onboarding/OnboardingWizard.tsx');
const wizardGate = wizard.indexOf('isPlatformWordmark(name)');
const wizardSave = wizard.indexOf('saveAppName(name)');
assert.ok(wizardGate > 0 && wizardGate < wizardSave);

const branding = source('../../lib/onboarding/branding.ts');
const saveStart = branding.indexOf('export async function saveAppName');
const saveEnd = branding.indexOf('export async function saveBrandColors');
const saveBody = branding.slice(saveStart, saveEnd);
assert.ok(saveBody.indexOf('isPlatformWordmark(name)') >= 0);
assert.ok(saveBody.indexOf('isPlatformWordmark(name)') < saveBody.indexOf('fetch('));

const settings = source('../../components/settings/StoreInfoCard.tsx');
const settingsSave = settings.indexOf('const handleSave');
const settingsFetch = settings.indexOf("fetch('/api/store'", settingsSave);
const settingsGate = settings.indexOf('isPlatformWordmark(editName)', settingsSave);
assert.ok(settingsGate > settingsSave && settingsGate < settingsFetch);
assert.match(settings, /disabled=\{isSaving \|\| editName === store\.name \|\| wordmarkName\}/);

assert.match(source('../../lib/dashboard/loadHome.ts'), /merchantDisplayName\(draft\.appName\)/);
assert.match(source('../../components/onboarding/LauncherReadinessStrip.tsx'), /return merchantDisplayName\(value\)/);
assert.match(source('../../lib/build/adminContract.ts'), /return merchantDisplayName\(value\)/);
assert.match(source('../../components/onboarding/WizardChrome.tsx'), /merchantDisplayName\(value\)/);

const originalFetch = globalThis.fetch;
let fetchCalls = 0;
globalThis.fetch = (async () => {
  fetchCalls += 1;
  return new Response(JSON.stringify({ success: true, data: { name: 'Harbor' } }), { status: 200 });
}) as typeof fetch;

void (async () => {
  try {
    fetchCalls = 0;
    const blocked = await saveAppName('  Cartaisy  ');
    assert.equal(blocked.ok, false);
    assert.equal(blocked.error, APP_NAME_WORDMARK_MESSAGE);
    assert.equal(fetchCalls, 0);

    const saved = await saveAppName('Harbor');
    assert.equal(saved.ok, true);
    assert.equal(saved.error, null);
    assert.equal(fetchCalls, 1);
    console.log('app name wordmark checks passed');
  } finally {
    globalThis.fetch = originalFetch;
  }
})().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
