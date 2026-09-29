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
const sectionSource = source('../../components/settings/StoreBrandingSection.tsx');
const loaderSource = source('../../lib/settings/storeBranding.ts');
const pageSource = source('../../app/dashboard/settings/page.tsx');

assert.doesNotMatch(viewSource, /SmartHomePreview|HomeScreenLauncherMock|SplashBootMock/);
assert.match(viewSource, /<BrandInstallPreview model=\{installPreview\} \/>/);
assert.doesNotMatch(viewSource, /cartaisy/i);
assert.doesNotMatch(viewSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(containerSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(containerSource, /shpat_|accessToken|access_token/);
assert.match(containerSource, /uploadBrandAsset/);
assert.match(containerSource, /planBrandAssetSave/);
assert.doesNotMatch(containerSource, /fetchBranding\(/);
assert.match(loaderSource, /mergeStoredBrandAssets/);
assert.match(loaderSource, /fetchStoreProfile/);
assert.match(containerSource, /if \(plan\.persist === 'dashboard'\) \{[\s\S]*saveStoredBrandAsset/);
assert.doesNotMatch(containerSource, /branding\/icon|branding\/splash|images\/signature|images\/register/);

const connected = pageSource.slice(pageSource.indexOf('shopifyStatus?.isConnected && store'));
assert.match(connected, /<StoreBrandingSection/);
assert.equal(pageSource.match(/<StoreBrandingSection/g)?.length, 1);
assert.equal(sectionSource.match(/<StoreAppBrand/g)?.length, 1);
assert.equal(pageSource.match(/<StoreAppBrand/g)?.length ?? 0, 0);

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
assert.equal(renamed.primaryExplicit, '#112233');
assert.equal(renamed.secondaryExplicit, null);

const returnedToDefault = applySettingsBrandProps(
  draft,
  { appName: 'Northwind', logoUrl: draft.logoUrl, primaryColor: '#0F766E', secondaryColor: '#F5F5F4' },
  { appName: 'Northwind', logoUrl: draft.logoUrl, primaryColor: null, secondaryColor: null }
);
assert.equal(returnedToDefault.primaryColor, '#FF6B6B');
assert.equal(returnedToDefault.primaryExplicit, null);
assert.equal(returnedToDefault.secondaryColor, '');
assert.equal(returnedToDefault.secondaryExplicit, null);
assert.notEqual(returnedToDefault.primaryExplicit, '#0F766E');
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
assert.doesNotMatch(localPreview, /Use logo/);
assert.doesNotMatch(markup, /Use logo/);
assert.doesNotMatch(hidden, /Use logo/);

function renderSettings(next: BrandingDraft, flags?: { iconUploading?: boolean; splashUploading?: boolean }) {
  return renderToStaticMarkup(
    createElement(StoreAppBrandView, {
      draft: next,
      catalog: EMPTY_CATALOG,
      sync: quiet,
      loadError: null,
      fieldError: null,
      iconUploading: flags?.iconUploading ?? false,
      splashUploading: flags?.splashUploading ?? false,
      retrying: false,
      onRetry: () => undefined,
      onIconFile: () => undefined,
      onSplashFile: () => undefined,
      onImageError: () => undefined,
    })
  );
}

function fieldBlock(markup: string, id: string): string {
  const token = `data-brand-field="${id}"`;
  const start = markup.indexOf(token);
  assert.ok(start >= 0, id);
  const next = markup.indexOf('data-brand-field=', start + token.length);
  return next === -1 ? markup.slice(start) : markup.slice(start, next);
}

const copyable = renderSettings({ ...draft, iconUrl: null });
assert.match(fieldBlock(copyable, 'settings-brand-icon'), />Use logo</);
assert.doesNotMatch(fieldBlock(copyable, 'settings-brand-splash'), /Use logo/);
assert.match(copyable, /Add App icon/);

const copyableSplash = renderSettings({ ...draft, splashUrl: null });
assert.match(fieldBlock(copyableSplash, 'settings-brand-splash'), />Use logo</);
assert.doesNotMatch(fieldBlock(copyableSplash, 'settings-brand-icon'), /Use logo/);
assert.match(copyableSplash, /Add Splash/);

const bothOpen = renderSettings({ ...draft, iconUrl: null, splashUrl: null });
assert.match(fieldBlock(bothOpen, 'settings-brand-icon'), />Use logo</);
assert.match(fieldBlock(bothOpen, 'settings-brand-splash'), />Use logo</);

assert.doesNotMatch(renderSettings({ ...draft, logoUrl: null, iconUrl: null }), /Use logo/);
assert.doesNotMatch(renderSettings({ ...draft, logoUrl: null, splashUrl: null }), /Use logo/);
assert.doesNotMatch(renderSettings({ ...draft, logoUrl: 'http://cdn.example/logo.png', iconUrl: null }), /Use logo/);
assert.doesNotMatch(renderSettings({ ...draft, logoUrl: 'http://cdn.example/logo.png', splashUrl: null }), /Use logo/);
assert.doesNotMatch(
  renderSettings({ ...draft, logoUrl: 'https://cdn.example/logo.png?access_token=shpat_secret', iconUrl: null }),
  /Use logo/
);
assert.doesNotMatch(
  renderSettings({ ...draft, logoUrl: 'https://cdn.example/logo.png?access_token=shpat_secret', splashUrl: null }),
  /Use logo/
);
assert.match(fieldBlock(renderSettings({ ...draft, logoUrl: 'blob:http://localhost/logo', iconUrl: null }), 'settings-brand-icon'), />Use logo</);
assert.match(fieldBlock(renderSettings({ ...draft, logoUrl: 'blob:http://localhost/logo', splashUrl: null }), 'settings-brand-splash'), />Use logo</);
assert.doesNotMatch(renderSettings({ ...draft, iconUrl: null }, { iconUploading: true }), /Use logo/);
assert.doesNotMatch(renderSettings({ ...draft, iconUrl: null }, { splashUploading: true }), /Use logo/);
assert.doesNotMatch(renderSettings({ ...draft, splashUrl: null }, { iconUploading: true }), /Use logo/);
assert.doesNotMatch(renderSettings({ ...draft, splashUrl: null }, { splashUploading: true }), /Use logo/);

const unsafeSplash = renderSettings({
  ...draft,
  splashUrl: 'https://cdn.example/splash.png?access_token=shpat_secret',
});
assert.match(fieldBlock(unsafeSplash, 'settings-brand-splash'), />Use logo</);
assert.doesNotMatch(unsafeSplash, /access_token=shpat_secret/);

const httpSplash = renderSettings({ ...draft, splashUrl: 'http://cdn.example/splash.png' });
assert.match(fieldBlock(httpSplash, 'settings-brand-splash'), />Use logo</);
assert.doesNotMatch(httpSplash, /http:\/\/cdn\.example\/splash\.png/);

const copyLogoSource = source('../../components/brand/useCopyLogoAsIcon.ts');
assert.match(viewSource, /useCopyLogoAsIcon/);
assert.match(viewSource, /useCopyLogoAsSplash/);
assert.match(viewSource, /onIconFile/);
assert.match(viewSource, /onSplashFile/);
assert.match(
  viewSource,
  /useCopyLogoAsIcon\(draft\?\.logoUrl \?\? null, uploadsBusy, onIconFile, onImageError\)/
);
assert.match(
  viewSource,
  /useCopyLogoAsSplash\(draft\?\.logoUrl \?\? null, uploadsBusy, onSplashFile, onImageError\)/
);
assert.match(copyLogoSource, /fileFromDrawableLogo/);
assert.match(copyLogoSource, /onFile\(file\)/);
assert.match(
  copyLogoSource,
  /return useCopyDrawableLogo\(logoUrl, uploadsBusy, onIconFile, onImageError, USE_LOGO_AS_ICON_ERROR\)/
);
assert.match(
  copyLogoSource,
  /return useCopyDrawableLogo\(logoUrl, uploadsBusy, onSplashFile, onImageError, USE_LOGO_AS_SPLASH_ERROR\)/
);
assert.doesNotMatch(copyLogoSource, /iconUrl|splashUrl/);
assert.doesNotMatch(viewSource, /iconUrl:\s*(shown\.logoUrl|draft\.logoUrl|logoUrl)/);
assert.doesNotMatch(viewSource, /splashUrl:\s*(shown\.logoUrl|draft\.logoUrl|logoUrl)/);

console.log('settings brand check ok');
