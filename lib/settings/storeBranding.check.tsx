import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StoreAppBrandView } from '@/components/settings/StoreAppBrandView';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import { DEFAULT_PRIMARY_COLOR } from '@/lib/onboarding/branding';
import type { BrandingDraft, SyncGate } from '@/lib/onboarding/types';
import { fetchBranding } from '@/lib/onboarding/branding';
import { applySettingsColors, applySettingsLogo, loadSettingsBrandingDraft } from '@/lib/settings/storeBranding';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const logoSource = source('../../components/settings/StoreLogoUpload.tsx');
const colorsSource = source('../../components/settings/StoreBrandingColors.tsx');
const appBrandSource = source('../../components/settings/StoreAppBrand.tsx');
const sectionSource = source('../../components/settings/StoreBrandingSection.tsx');
const pageSource = source('../../app/dashboard/settings/page.tsx');
const hookSource = source('../../hooks/useSettingsStoreBranding.ts');
const loaderSource = source('./storeBranding.ts');
const sidebarSource = source('../../components/Sidebar.tsx');
const brandingHelperSource = source('../onboarding/branding.ts');

for (const file of [logoSource, colorsSource, appBrandSource, pageSource]) {
  assert.doesNotMatch(file, /fetchBranding/);
}
assert.doesNotMatch(hookSource, /fetchBranding/);
assert.equal(hookSource.match(/loadSettingsBrandingDraft\(/g)?.length, 1);
assert.match(hookSource, /\[status, storeId, refreshKey\]/);
assert.equal(loaderSource.match(/loadBranding\(/g)?.length, 1);
assert.match(loaderSource, /loadBranding \?\? fetchBranding/);
assert.match(loaderSource, /loadProfile \?\? fetchStoreProfile/);
assert.equal(sectionSource.match(/useSettingsStoreBranding\(/g)?.length, 1);
assert.match(sectionSource, /applySettingsLogo/);
assert.match(sectionSource, /applySettingsColors/);
assert.doesNotMatch(sectionSource, /iconUrl/);
assert.doesNotMatch(logoSource, /iconUrl|splashUrl/);
assert.match(logoSource, /uploadLogo/);
assert.match(logoSource, /clearLogo/);
assert.match(colorsSource, /saveBrandColors/);
assert.match(colorsSource, /primaryColor: null/);
assert.match(colorsSource, /secondaryColor: null/);
assert.match(colorsSource, /onColorsChange/);
assert.match(appBrandSource, /uploadBrandAsset/);
assert.doesNotMatch(appBrandSource, /iconUrl:\s*logoUrl|splashUrl:\s*logoUrl/);
assert.doesNotMatch(`${logoSource}\n${colorsSource}\n${appBrandSource}\n${sectionSource}\n${hookSource}`, /shpat_|accessToken|access_token/);
assert.doesNotMatch(pageSource, /fetchBranding|\/admin\/stores\/\$\{storeId\}\/branding/);
assert.match(sidebarSource, /fetchBranding\(storeId, token\)/);
assert.doesNotMatch(sidebarSource, /\/admin\/stores\/\$\{storeId\}\/branding/);
assert.doesNotMatch(sidebarSource, /console\.(log|debug|info|error|warn)/);
assert.match(brandingHelperSource, /inflightBranding/);
assert.match(brandingHelperSource, /if \(pending\) return pending/);

const quiet: SyncGate = {
  state: 'not_started',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
};

const saved: BrandingDraft = {
  appName: 'Northwind',
  logoUrl: 'https://cdn.example/logo.png',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: 'https://cdn.example/splash.png',
  primaryColor: '#0F766E',
  secondaryColor: '#F5F5F4',
  primaryExplicit: '#0F766E',
  secondaryExplicit: '#F5F5F4',
  splashPersisted: true,
  iconPersisted: true,
};

function renderIcon(draft: BrandingDraft): string {
  return renderToStaticMarkup(
    createElement(StoreAppBrandView, {
      draft,
      catalog: EMPTY_CATALOG,
      sync: quiet,
      loadError: null,
      fieldError: null,
      iconUploading: false,
      splashUploading: false,
      retrying: false,
      onRetry: () => undefined,
      onIconFile: () => undefined,
      onSplashFile: () => undefined,
      onImageError: () => undefined,
    })
  );
}

const emptyIcon: BrandingDraft = { ...saved, logoUrl: null, iconUrl: null };
assert.doesNotMatch(renderIcon(emptyIcon), /Use logo/);

const withLogo = applySettingsLogo(emptyIcon, 'https://cdn.example/logo.png');
assert.equal(withLogo.logoUrl, 'https://cdn.example/logo.png');
assert.equal(withLogo.iconUrl, null);
assert.equal(withLogo.splashUrl, emptyIcon.splashUrl);
assert.match(renderIcon(withLogo), />Use logo</);

const clearedLogo = applySettingsLogo(withLogo, null);
assert.equal(clearedLogo.logoUrl, null);
assert.equal(clearedLogo.iconUrl, null);
assert.doesNotMatch(renderIcon(clearedLogo), /Use logo/);

const unsafeLogo = applySettingsLogo(emptyIcon, 'https://cdn.example/logo.png?access_token=shpat_secret');
assert.equal(unsafeLogo.logoUrl, null);
assert.equal(unsafeLogo.iconUrl, null);
assert.doesNotMatch(renderIcon(unsafeLogo), /Use logo/);

const clearedPrimary = applySettingsColors(saved, {
  primaryColor: null,
  secondaryColor: saved.secondaryExplicit ?? null,
});
assert.equal(clearedPrimary.primaryExplicit, null);
assert.equal(clearedPrimary.primaryColor, DEFAULT_PRIMARY_COLOR);
assert.equal(clearedPrimary.secondaryExplicit, '#F5F5F4');
assert.equal(clearedPrimary.secondaryColor, '#F5F5F4');
assert.equal(clearedPrimary.logoUrl, saved.logoUrl);
assert.equal(clearedPrimary.iconUrl, saved.iconUrl);
assert.equal(clearedPrimary.splashUrl, saved.splashUrl);
assert.notEqual(clearedPrimary.primaryExplicit, '#0F766E');

const clearedSecondary = applySettingsColors(saved, {
  primaryColor: saved.primaryExplicit ?? null,
  secondaryColor: null,
});
assert.equal(clearedSecondary.secondaryExplicit, null);
assert.equal(clearedSecondary.secondaryColor, '');
assert.equal(clearedSecondary.primaryExplicit, '#0F766E');
assert.equal(clearedSecondary.iconUrl, saved.iconUrl);

async function checkSingleLoad() {
  let brandingGets = 0;
  const draft = await loadSettingsBrandingDraft({
    storeId: 'store-1',
    token: 'session-token',
    appName: 'Harbor',
    fallbackLogo: 'http://cdn.example/fallback.png',
    loadBranding: async () => {
      brandingGets += 1;
      return {
        ...saved,
        appName: 'Northwind',
        logoUrl: null,
        iconUrl: null,
        splashUrl: 'https://cdn.example/splash.png',
        primaryExplicit: '#0F766E',
        secondaryExplicit: null,
        primaryColor: '#0F766E',
        secondaryColor: '',
      };
    },
    loadProfile: async () => ({
      name: 'Harbor',
      brandAssets: {
        iconUrl: 'https://cdn.example/stored-icon.png',
        splashUrl: 'https://cdn.example/stored-splash.png',
      },
    }),
  });

  assert.equal(brandingGets, 1);
  assert.ok(draft);
  assert.equal(draft.appName, 'Northwind');
  assert.equal(draft.logoUrl, null);
  assert.equal(draft.iconUrl, 'https://cdn.example/stored-icon.png');
  assert.equal(draft.splashUrl, 'https://cdn.example/splash.png');
  assert.equal(draft.primaryExplicit, '#0F766E');
  assert.equal(draft.secondaryExplicit, null);

  const afterClear = applySettingsColors(draft, { primaryColor: null, secondaryColor: null });
  assert.equal(brandingGets, 1);
  assert.equal(afterClear.primaryExplicit, null);
  assert.equal(afterClear.primaryColor, DEFAULT_PRIMARY_COLOR);
  assert.equal(afterClear.iconUrl, draft.iconUrl);

  const brandedLogo = await loadSettingsBrandingDraft({
    storeId: 'store-1',
    token: 'session-token',
    appName: '',
    fallbackLogo: 'https://cdn.example/fallback-logo.png',
    loadBranding: async () => {
      brandingGets += 1;
      return { ...saved, logoUrl: 'https://cdn.example/brand-logo.png', appName: '' };
    },
    loadProfile: async () => ({ name: null, brandAssets: { iconUrl: null, splashUrl: null } }),
  });
  assert.equal(brandingGets, 2);
  assert.equal(brandedLogo?.logoUrl, 'https://cdn.example/brand-logo.png');
  assert.equal(brandedLogo?.appName, '');

  const fallbackLogo = await loadSettingsBrandingDraft({
    storeId: 'store-1',
    token: 'session-token',
    appName: 'Harbor',
    fallbackLogo: 'https://cdn.example/fallback-logo.png',
    loadBranding: async () => {
      brandingGets += 1;
      return { ...saved, logoUrl: null, appName: '' };
    },
    loadProfile: async () => ({ name: null, brandAssets: { iconUrl: null, splashUrl: null } }),
  });
  assert.equal(brandingGets, 3);
  assert.equal(fallbackLogo?.logoUrl, 'https://cdn.example/fallback-logo.png');
  assert.equal(fallbackLogo?.appName, 'Harbor');
  assert.equal(fallbackLogo?.iconUrl, saved.iconUrl);

  const missing = await loadSettingsBrandingDraft({
    storeId: 'store-1',
    token: 'session-token',
    appName: 'Harbor',
    fallbackLogo: null,
    loadBranding: async () => {
      brandingGets += 1;
      return null;
    },
    loadProfile: async () => ({ name: null, brandAssets: { iconUrl: null, splashUrl: null } }),
  });
  assert.equal(missing, null);
  assert.equal(brandingGets, 4);
}

async function checkSharedNetworkGet() {
  const realFetch = globalThis.fetch;
  let brandingGets = 0;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith('/branding')) {
      brandingGets += 1;
      await new Promise((resolve) => setTimeout(resolve, 15));
      return new Response(
        JSON.stringify({
          data: {
            appName: 'Northwind',
            logoUrl: 'https://cdn.example/logo.png',
            primaryColor: '#0F766E',
            secondaryColor: null,
            iconUrl: 'https://cdn.example/icon.png',
            splashUrl: null,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    if (url.endsWith('/api/store')) {
      return new Response(JSON.stringify({ data: { name: 'Northwind', brandAssets: {} } }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    throw new Error(`unexpected fetch ${url}`);
  };

  try {
    const [section, sidebar, secondMount] = await Promise.all([
      loadSettingsBrandingDraft({
        storeId: 'store-1',
        token: 'session-token',
        appName: 'Harbor',
        fallbackLogo: null,
      }),
      fetchBranding('store-1', 'session-token'),
      loadSettingsBrandingDraft({
        storeId: 'store-1',
        token: 'session-token',
        appName: 'Harbor',
        fallbackLogo: null,
      }),
    ]);
    assert.equal(brandingGets, 1);
    assert.equal(section?.logoUrl, 'https://cdn.example/logo.png');
    assert.equal(section?.iconUrl, 'https://cdn.example/icon.png');
    assert.equal(sidebar?.logoUrl, section?.logoUrl);
    assert.equal(secondMount?.splashUrl, null);
    assert.equal(secondMount?.primaryExplicit, '#0F766E');

    const settled = await fetchBranding('store-1', 'session-token');
    assert.equal(brandingGets, 2);
    assert.equal(settled?.logoUrl, 'https://cdn.example/logo.png');

    await Promise.all([fetchBranding('store-2', 'session-token'), fetchBranding('store-1', 'other-token')]);
    assert.equal(brandingGets, 4);
  } finally {
    globalThis.fetch = realFetch;
  }
}

checkSingleLoad()
  .then(() => checkSharedNetworkGet())
  .then(() => {
    console.log('settings branding check ok');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
