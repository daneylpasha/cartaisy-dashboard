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
import {
  ensureShellBrandingSession,
  readShellBranding,
  resetShellBrandingSessions,
  shellBrandingSession,
  type ShellBrandingSession,
} from '@/lib/dashboard/shellBranding';
import { loadBrandRead } from '@/lib/dashboard/loadHome';
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
const shellSource = source('../../components/dashboard/DashboardShell.tsx');
const providerSource = source('../../components/dashboard/DashboardBrandingProvider.tsx');
const shellLoadSource = source('../dashboard/shellBranding.ts');
const loadHomeSource = source('../dashboard/loadHome.ts');
const wizardSource = source('../../components/onboarding/OnboardingWizard.tsx');
const buildPanelSource = source('../../components/onboarding/BuildMyAppPanel.tsx');

for (const file of [logoSource, colorsSource, appBrandSource, pageSource]) {
  assert.doesNotMatch(file, /fetchBranding/);
}
assert.doesNotMatch(hookSource, /fetchBranding/);
assert.equal(hookSource.match(/loadSettingsBrandingDraft\(/g)?.length, 1);
assert.match(hookSource, /loadBranding: \(\) => shellRequest/);
assert.match(hookSource, /if \(!shellRequest \|\| shellStoreId !== storeId\) return/);
assert.match(hookSource, /\[status, storeId, shellStoreId, shellRequest\]/);
assert.match(hookSource, /reload\(\)/);
assert.match(hookSource, /setRefreshKey/);
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
assert.doesNotMatch(sidebarSource, /fetchBranding/);
assert.doesNotMatch(sidebarSource, /\/admin\/stores\/\$\{storeId\}\/branding/);
assert.doesNotMatch(sidebarSource, /console\.(log|debug|info|error|warn)/);
assert.match(sidebarSource, /useDashboardBranding/);
assert.equal(sidebarSource.match(/<SidebarContent/g)?.length, 2);
assert.match(sidebarSource, /\{mobileOpen \? \([\s\S]*<SidebarContent/);
assert.match(shellSource, /if \(isOnboarding\) \{[\s\S]*<DashboardBrandingProvider>/);
assert.match(shellSource, /<DashboardBrandingProvider>/);
assert.match(providerSource, /ensureShellBrandingSession\([\s\S]*fetchBranding\)/);
assert.equal(providerSource.match(/fetchBranding\(/g)?.length ?? 0, 0);
assert.doesNotMatch(providerSource, /useEffect\(\(\) => \{[\s\S]*ensureShellBrandingSession/);
assert.match(shellLoadSource, /reloadKey <= current\.reloadKey\) return current/);
assert.match(shellLoadSource, /promise: load\(storeId, token\)/);
assert.match(shellLoadSource, /session\.draft = draft/);
assert.match(shellLoadSource, /session\.settled = true/);
assert.match(shellLoadSource, /__cartaisyShellBranding/);
assert.match(shellLoadSource, /globalThis/);
assert.match(shellLoadSource, /if \(current\) return current\.promise/);
assert.match(loadHomeSource, /readShellBranding\(storeId, token, fetchBranding\)/);
assert.doesNotMatch(loadHomeSource, /await fetchBranding\(/);
assert.match(loadHomeSource, /merchantDisplayName\(draft\.appName\)/);
assert.match(loadHomeSource, /persistedBrandImageUrl\(draft\.iconUrl\)/);
assert.match(wizardSource, /fetchBranding\(storeId, token\)/);
assert.doesNotMatch(wizardSource, /readShellBranding|DashboardBrandingProvider/);
assert.match(buildPanelSource, /fetchBranding\(storeId, token\)/);
assert.doesNotMatch(buildPanelSource, /readShellBranding|DashboardBrandingProvider/);
assert.match(brandingHelperSource, /inflightBranding/);
assert.match(brandingHelperSource, /if \(pending\) return pending/);
assert.match(brandingHelperSource, /globalThis/);
assert.match(brandingHelperSource, /__cartaisyInflightBranding/);
assert.match(brandingHelperSource, /inflightBranding\.get\(storeId\)/);
assert.doesNotMatch(brandingHelperSource, /\$\{storeId\}\\n\$\{token\}/);

const sharedBrandingRegistry = (
  globalThis as { __cartaisyInflightBranding?: Map<string, Promise<unknown>> }
).__cartaisyInflightBranding;
assert.ok(sharedBrandingRegistry instanceof Map);

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

    const registry = (
      globalThis as { __cartaisyInflightBranding?: Map<string, Promise<BrandingDraft | null>> }
    ).__cartaisyInflightBranding;
    assert.ok(registry instanceof Map);
    assert.equal(registry, sharedBrandingRegistry);

    const beforeSplit = brandingGets;
    const sidebarCall = fetchBranding('store-split', 'sidebar-getToken');
    assert.equal(brandingGets, beforeSplit + 1);
    assert.equal(registry.has('store-split'), true);
    assert.equal(registry.has('store-split\nsidebar-getToken'), false);
    const settingsCall = fetchBranding('store-split', 'settings-tokenStorage');
    assert.equal(brandingGets, beforeSplit + 1);
    const [sidebarDraft, settingsDraft] = await Promise.all([sidebarCall, settingsCall]);
    assert.equal(settingsDraft?.logoUrl, sidebarDraft?.logoUrl);
    assert.equal(settingsDraft?.iconUrl, 'https://cdn.example/icon.png');
    assert.equal(settingsDraft?.splashUrl, null);
    assert.equal(settingsDraft?.primaryExplicit, '#0F766E');
    assert.equal(registry.has('store-split'), false);

    const otherChunk = Promise.resolve<BrandingDraft | null>(null);
    registry.set('store-from-other-chunk', otherChunk);
    const beforeOtherChunk = brandingGets;
    const shared = fetchBranding('store-from-other-chunk', 'settings-tokenStorage');
    assert.equal(shared, otherChunk);
    assert.equal(brandingGets, beforeOtherChunk);
    registry.delete('store-from-other-chunk');
  } finally {
    globalThis.fetch = realFetch;
  }
}

async function checkShellKeepsSettledLoad() {
  resetShellBrandingSessions();
  const realFetch = globalThis.fetch;
  let brandingGets = 0;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!url.endsWith('/branding')) throw new Error(`unexpected fetch ${url}`);
    brandingGets += 1;
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
  };

  try {
    const first = ensureShellBrandingSession('store-live', 'sidebar-token', 0, fetchBranding);
    assert.ok(first);
    const settledDraft = await first.promise;
    assert.equal(first.settled, true);
    assert.equal(first.draft?.logoUrl, 'https://cdn.example/logo.png');
    assert.equal(settledDraft?.logoUrl, first.draft?.logoUrl);

    const registry = (
      globalThis as { __cartaisyInflightBranding?: Map<string, Promise<unknown>> }
    ).__cartaisyInflightBranding;
    assert.ok(registry instanceof Map);
    assert.equal(registry.has('store-live'), false);

    const second = ensureShellBrandingSession('store-live', 'settings-token', 0, fetchBranding);
    assert.equal(second, first);
    assert.equal(brandingGets, 1);

    const drafted = await loadSettingsBrandingDraft({
      storeId: 'store-live',
      token: 'settings-token',
      appName: 'Harbor',
      fallbackLogo: null,
      loadBranding: () => second.promise,
      loadProfile: async () => ({
        name: 'Harbor',
        brandAssets: { iconUrl: null, splashUrl: 'https://cdn.example/stored-splash.png' },
      }),
    });
    assert.equal(brandingGets, 1);
    assert.equal(drafted?.logoUrl, 'https://cdn.example/logo.png');
    assert.equal(drafted?.splashUrl, 'https://cdn.example/stored-splash.png');
    assert.equal(drafted?.iconUrl, 'https://cdn.example/icon.png');

    const retried = ensureShellBrandingSession('store-live', 'settings-token', 1, fetchBranding);
    assert.notEqual(retried, first);
    await retried?.promise;
    assert.equal(brandingGets, 2);
    assert.equal(retried?.settled, true);

    assert.equal(ensureShellBrandingSession(null, 'settings-token', 2, fetchBranding), null);
    assert.equal(brandingGets, 2);
    assert.equal(shellBrandingSession('store-live'), retried);
  } finally {
    globalThis.fetch = realFetch;
    resetShellBrandingSessions();
  }
}

async function withHomeToken<T>(token: string | null, run: () => Promise<T>): Promise<T> {
  const host = globalThis as { window?: unknown; localStorage?: unknown };
  const previousWindow = host.window;
  const previousStorage = host.localStorage;
  const jar = new Map<string, string>();
  if (token) jar.set('cartaisy_token', token);
  host.window = globalThis;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => jar.get(key) ?? null,
      setItem: (key: string, value: string) => {
        jar.set(key, value);
      },
      removeItem: (key: string) => {
        jar.delete(key);
      },
    },
  });
  try {
    return await run();
  } finally {
    host.window = previousWindow;
    if (previousStorage) {
      Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previousStorage });
    } else {
      delete host.localStorage;
    }
  }
}

async function checkHomeReusesShellBranding() {
  resetShellBrandingSessions();
  const realFetch = globalThis.fetch;
  let brandingGets = 0;
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = String(input);
    if (!url.endsWith('/branding')) throw new Error(`unexpected fetch ${url}`);
    brandingGets += 1;
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
  };

  try {
    const shell = ensureShellBrandingSession('store-home', 'sidebar-token', 0, fetchBranding);
    assert.ok(shell);
    await shell.promise;
    assert.equal(shell.settled, true);
    assert.equal(brandingGets, 1);
    const registry = (
      globalThis as { __cartaisyInflightBranding?: Map<string, Promise<unknown>> }
    ).__cartaisyInflightBranding;
    assert.equal(registry?.has('store-home'), false);

    const settled = await withHomeToken('home-token', () => loadBrandRead('store-home'));
    assert.equal(brandingGets, 1);
    assert.equal(settled.known, true);
    assert.equal(settled.displayName, 'Northwind');
    assert.equal(settled.hasIcon, true);
    assert.equal(settled.saved, true);

    const unsigned = await withHomeToken(null, () => loadBrandRead('store-home'));
    assert.equal(brandingGets, 1);
    assert.equal(unsigned.known, false);
    assert.equal(unsigned.saved, null);
    assert.equal(unsigned.displayName, null);
    assert.equal(unsigned.hasIcon, false);

    let release: (draft: BrandingDraft | null) => void = () => {};
    const gate = new Promise<BrandingDraft | null>((resolve) => {
      release = resolve;
    });
    const inflight = ensureShellBrandingSession('store-flight', 'sidebar-token', 0, () => gate);
    assert.ok(inflight);
    assert.equal(inflight.settled, false);
    const joined = readShellBranding('store-flight', 'home-token', fetchBranding);
    assert.equal(joined, inflight.promise);
    const pending = withHomeToken('home-token', () => loadBrandRead('store-flight'));
    assert.equal(brandingGets, 1);
    release(saved);
    const flown = await pending;
    assert.equal(brandingGets, 1);
    assert.equal(flown.displayName, 'Northwind');
    assert.equal(flown.hasIcon, true);
    assert.equal(flown.saved, true);
    assert.equal(inflight.settled, true);

    const failed = ensureShellBrandingSession('store-miss', 'sidebar-token', 0, async () => null);
    await failed?.promise;
    const missed = await withHomeToken('home-token', () => loadBrandRead('store-miss'));
    assert.equal(brandingGets, 1);
    assert.equal(missed.known, false);
    assert.equal(missed.saved, null);
    assert.equal(missed.displayName, null);
    assert.equal(missed.hasIcon, false);

    const beforeCold = brandingGets;
    const cold = await withHomeToken('home-token', () => loadBrandRead('store-cold'));
    assert.equal(brandingGets, beforeCold + 1);
    assert.equal(cold.displayName, 'Northwind');
    assert.equal(cold.hasIcon, true);
    const again = await withHomeToken('home-token', () => loadBrandRead('store-cold'));
    assert.equal(brandingGets, beforeCold + 1);
    assert.equal(again.displayName, cold.displayName);
    assert.equal(again.hasIcon, true);
    assert.equal(shellBrandingSession('store-cold')?.settled, true);

    const harbor: BrandingDraft = { ...saved, appName: 'Harbor', iconUrl: null };
    const planted: ShellBrandingSession = {
      storeId: 'store-other-chunk',
      reloadKey: 0,
      promise: Promise.resolve(harbor),
      draft: harbor,
      settled: true,
    };
    const host = globalThis as { __cartaisyShellBranding?: Map<string, ShellBrandingSession> };
    assert.ok(host.__cartaisyShellBranding instanceof Map);
    host.__cartaisyShellBranding.set('store-other-chunk', planted);
    const beforePlanted = brandingGets;
    const otherChunk = await withHomeToken('home-token', () => loadBrandRead('store-other-chunk'));
    assert.equal(brandingGets, beforePlanted);
    assert.equal(otherChunk.displayName, 'Harbor');
    assert.equal(otherChunk.hasIcon, false);
    assert.equal(otherChunk.saved, true);
    assert.equal(otherChunk.known, true);
  } finally {
    globalThis.fetch = realFetch;
    resetShellBrandingSessions();
  }
}

checkSingleLoad()
  .then(() => checkSharedNetworkGet())
  .then(() => checkShellKeepsSettledLoad())
  .then(() => checkHomeReusesShellBranding())
  .then(() => {
    console.log('settings branding check ok');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
