import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StoreAppBrandView, applySettingsBrandProps, presentSettingsBrand, settingsBrandImageUrl } from '@/components/settings/StoreAppBrandView';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, SyncGate } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const viewSource = source('../../components/settings/StoreAppBrandView.tsx');
const containerSource = source('../../components/settings/StoreAppBrand.tsx');
const pageSource = source('../../app/dashboard/settings/page.tsx');

assert.doesNotMatch(viewSource, /SmartHomePreview|HomeScreenLauncherMock|SplashBootMock/);
assert.match(viewSource, /<BrandInstallPreview model=\{installPreview\} \/>/);
assert.doesNotMatch(viewSource, /cartaisy/i);
assert.doesNotMatch(viewSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(containerSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(containerSource, /shpat_|accessToken|access_token/);
assert.match(containerSource, /uploadBrandAsset/);
assert.match(containerSource, /planBrandAssetSave/);
assert.match(containerSource, /mergeStoredBrandAssets/);
assert.match(containerSource, /fetchBranding/);
assert.match(containerSource, /fetchStoreProfile/);
assert.match(containerSource, /if \(plan\.persist === 'dashboard'\) \{[\s\S]*saveStoredBrandAsset/);
assert.doesNotMatch(containerSource, /branding\/icon|branding\/splash|images\/signature|images\/register/);

const connected = pageSource.slice(pageSource.indexOf('shopifyStatus?.isConnected && store'));
assert.match(connected, /<StoreAppBrand/);
assert.equal(pageSource.match(/<StoreAppBrand/g)?.length, 1);

assert.equal(settingsBrandImageUrl('https://cdn.example/icon.png'), 'https://cdn.example/icon.png');
assert.equal(settingsBrandImageUrl('blob:http://localhost/1'), 'blob:http://localhost/1');
assert.equal(settingsBrandImageUrl('http://cdn.example/icon.png'), null);
assert.equal(settingsBrandImageUrl('https://cdn.example/icon.png?access_token=shpat_secret'), null);

const draft: BrandingDraft = {
  appName: 'Northwind',
  logoUrl: 'https://cdn.example/logo.png',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: 'https://cdn.example/splash.png',
  primaryColor: '#0F766E',
  secondaryColor: '#F5F5F4',
  splashPersisted: true,
  iconPersisted: true,
};

const renamed = applySettingsBrandProps(
  draft,
  { appName: 'Northwind', logoUrl: null, primaryColor: null, secondaryColor: null },
  { appName: 'Harbor', logoUrl: 'http://cdn.example/logo.png', primaryColor: '#112233', secondaryColor: 'nope' }
);
assert.equal(renamed.appName, 'Harbor');
assert.equal(renamed.logoUrl, null);
assert.equal(renamed.primaryColor, '#112233');
assert.equal(renamed.secondaryColor, '');
assert.equal(renamed.iconUrl, draft.iconUrl);
assert.equal(renamed.splashUrl, draft.splashUrl);

const poisoned = presentSettingsBrand({
  ...draft,
  iconUrl: 'https://cdn.example/icon.png?token=shpss_secret',
  splashUrl: 'http://cdn.example/splash.png',
  logoUrl: 'https://cdn.example/shpat_logo',
});
assert.equal(poisoned.iconUrl, null);
assert.equal(poisoned.splashUrl, null);
assert.equal(poisoned.logoUrl, null);

const quiet: SyncGate = {
  state: 'not_started',
  detail: null,
  eligibleForBuild: false,
  eligibilityReason: null,
};

const markup = renderToStaticMarkup(
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
assert.match(markup, /data-install-preview="instructions"/);
assert.match(markup, /See it on your phone/);
assert.match(markup, /src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(markup, /src="https:\/\/cdn\.example\/splash\.png"/);
assert.doesNotMatch(markup, /data-shopper-screen|data-launcher-mock|data-splash-frame|Live preview/);
assert.doesNotMatch(markup, /cartaisy/i);
assert.match(markup, /Replace App icon/);
assert.match(markup, /Replace Splash/);
assert.equal(markup.match(/class="sr-only top-0 left-0"/g)?.length, 2);

const hidden = renderToStaticMarkup(
  createElement(StoreAppBrandView, {
    draft: poisoned,
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
assert.doesNotMatch(hidden, /shpat_|shpss_|access_token|http:\/\/cdn\.example\/splash/);
assert.match(hidden, /Add App icon/);
assert.match(hidden, /Add Splash/);
assert.doesNotMatch(hidden, /data-shopper-screen/);
assert.doesNotMatch(hidden, /cartaisy/i);

const localPreview = renderToStaticMarkup(
  createElement(StoreAppBrandView, {
    draft: { ...draft, iconUrl: 'blob:http://localhost/preview', iconPersisted: false },
    catalog: EMPTY_CATALOG,
    sync: quiet,
    loadError: null,
    fieldError: null,
    iconUploading: true,
    splashUploading: false,
    retrying: false,
    onRetry: () => undefined,
    onIconFile: () => undefined,
    onSplashFile: () => undefined,
    onImageError: () => undefined,
  })
);
assert.match(localPreview, /src="blob:http:\/\/localhost\/preview"/);
assert.doesNotMatch(localPreview, /data-shopper-screen|data-home-screen/);
assert.match(localPreview, /Uploading/);

console.log('settings brand check ok');
