import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { StoreAppBrandView } from '@/components/settings/StoreAppBrandView';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const brandSource = source('../../components/onboarding/steps/BrandingStep.tsx');
const previewStepSource = source('../../components/onboarding/steps/PreviewStep.tsx');
const settingsViewSource = source('../../components/settings/StoreAppBrandView.tsx');
const settingsContainerSource = source('../../components/settings/StoreAppBrand.tsx');
const settingsPageSource = source('../../app/dashboard/settings/page.tsx');
const buildViewSource = source('../../components/onboarding/BuildMyAppView.tsx');
const copyLogoSource = source('../../components/brand/useCopyLogoAsIcon.ts');

const MOCK = /HomeScreenLauncherMock|SplashBootMock|SmartHomePreview|data-launcher-mock|data-splash-boot-mock|data-splash-frame/;

assert.doesNotMatch(brandSource, MOCK);
assert.match(brandSource, /const trimmedName = draft\.appName\.trim\(\);/);
assert.match(
  brandSource,
  /const nameReady = trimmedName\.length >= 2 && !isPlatformWordmark\(trimmedName\);/
);
assert.match(
  brandSource,
  /const uploadsBusy = logoUploading \|\| iconUploading \|\| splashUploading;\n\s*const blocked =\n\s*Boolean\(loadError\) \|\| !nameReady \|\| !primaryValid \|\| !secondaryValid \|\| uploadsBusy;/
);
assert.match(brandSource, /useCopyLogoAsIcon/);
assert.match(brandSource, /useCopyLogoAsSplash/);
assert.match(brandSource, /onIconFile\(file\)/);
assert.match(brandSource, /onSplashFile\(file\)/);
assert.match(
  brandSource,
  /useCopyLogoAsIcon\(draft\.logoUrl, uploadsBusy, onIconFile, onImageError\)/
);
assert.match(
  brandSource,
  /useCopyLogoAsSplash\(draft\.logoUrl, uploadsBusy, onSplashFile, onImageError\)/
);
assert.doesNotMatch(brandSource, /splashUrl:\s*draft\.logoUrl|iconUrl:\s*draft\.logoUrl/);
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
assert.match(brandSource, /showUseLogo = Boolean\(useLogo\) && !showImage && !busy/);
assert.doesNotMatch(settingsViewSource, MOCK);
assert.doesNotMatch(previewStepSource, MOCK);
assert.doesNotMatch(buildViewSource, MOCK);
assert.doesNotMatch(settingsContainerSource, /\|\| 'Your app'/);
assert.doesNotMatch(settingsPageSource, /storeName \|\| 'Your app'/);

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

const connection: ShopifyConnectionSnapshot = {
  statusKnown: true,
  isConnected: true,
  shopDomain: 'northwind.myshopify.com',
  shopId: 'gid://shopify/Shop/884422',
  connectedAt: null,
  lastSyncAt: null,
  webhookRegistrationError: null,
};

const catalog: LockedCatalog = { ...EMPTY_CATALOG, productCount: 0, collections: [] };
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

function fieldBlock(markup: string, id: string): string {
  const token = `data-brand-field="${id}"`;
  const start = markup.indexOf(token);
  assert.ok(start >= 0, id);
  const next = markup.indexOf('data-brand-field=', start + token.length);
  return next === -1 ? markup.slice(start) : markup.slice(start, next);
}

function renderBrand(
  next: BrandingDraft,
  flags?: { logoUploading?: boolean; iconUploading?: boolean; splashUploading?: boolean }
): string {
  return renderToStaticMarkup(
    createElement(BrandingStep, {
      draft: next,
      connection,
      catalog,
      sync: quiet,
      warning: null,
      loadError: null,
      fieldError: null,
      saving: false,
      logoUploading: flags?.logoUploading ?? false,
      iconUploading: flags?.iconUploading ?? false,
      splashUploading: flags?.splashUploading ?? false,
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

const readyPage = renderBrand(draft);
assert.doesNotMatch(readyPage, MOCK);
assert.match(readyPage, /data-install-preview="instructions"/);
assert.equal(isDisabled(continueButton(readyPage)), false);
assert.equal(
  isDisabled(continueButton(renderBrand({ ...draft, iconUrl: 'blob:http://localhost/preview', iconPersisted: false }))),
  false
);
assert.equal(
  isDisabled(
    continueButton(renderBrand({ ...draft, splashUrl: 'blob:http://localhost/preview', splashPersisted: false }))
  ),
  false
);

const emptyIcon = renderBrand({ ...draft, iconUrl: null });
assert.match(fieldBlock(emptyIcon, 'brand-icon'), />Use logo</);
assert.doesNotMatch(fieldBlock(emptyIcon, 'brand-splash'), /Use logo/);
assert.equal(isDisabled(continueButton(emptyIcon)), false);
assert.doesNotMatch(emptyIcon, MOCK);

const emptySplash = renderBrand({ ...draft, splashUrl: null });
assert.match(fieldBlock(emptySplash, 'brand-splash'), />Use logo</);
assert.doesNotMatch(fieldBlock(emptySplash, 'brand-icon'), /Use logo/);
assert.equal(isDisabled(continueButton(emptySplash)), false);
assert.doesNotMatch(emptySplash, MOCK);

const bothEmpty = renderBrand({ ...draft, iconUrl: null, splashUrl: null });
assert.match(fieldBlock(bothEmpty, 'brand-icon'), />Use logo</);
assert.match(fieldBlock(bothEmpty, 'brand-splash'), />Use logo</);
assert.equal(isDisabled(continueButton(bothEmpty)), false);

const noLogo = renderBrand({ ...draft, logoUrl: null, iconUrl: null });
assert.doesNotMatch(noLogo, /Use logo/);
assert.equal(isDisabled(continueButton(noLogo)), false);

assert.doesNotMatch(renderBrand(draft), /Use logo/);

const httpLogo = renderBrand({ ...draft, logoUrl: 'http://cdn.example/logo.png', iconUrl: null });
assert.doesNotMatch(httpLogo, /Use logo/);

const tokenLogo = renderBrand({
  ...draft,
  logoUrl: 'https://cdn.example/logo.png?access_token=shpat_secret',
  iconUrl: null,
});
assert.doesNotMatch(tokenLogo, /Use logo/);

const blobLogo = renderBrand({ ...draft, logoUrl: 'blob:http://localhost/logo', iconUrl: null });
assert.match(blobLogo, />Use logo</);

const unsafeIcon = renderBrand({
  ...draft,
  iconUrl: 'https://cdn.example/icon.png?access_token=shpat_secret',
});
assert.match(unsafeIcon, />Use logo</);
assert.doesNotMatch(unsafeIcon, /access_token=shpat_secret/);

const httpIconField = renderBrand({ ...draft, iconUrl: 'http://cdn.example/icon.png' });
assert.match(httpIconField, />Use logo</);
assert.doesNotMatch(httpIconField, /http:\/\/cdn\.example\/icon\.png/);

assert.doesNotMatch(renderBrand({ ...draft, iconUrl: null }, { logoUploading: true }), /Use logo/);
assert.doesNotMatch(renderBrand({ ...draft, iconUrl: null }, { iconUploading: true }), /Use logo/);
assert.doesNotMatch(renderBrand({ ...draft, iconUrl: null }, { splashUploading: true }), /Use logo/);

assert.doesNotMatch(renderBrand({ ...draft, logoUrl: null, splashUrl: null }), /Use logo/);
assert.doesNotMatch(
  renderBrand({ ...draft, logoUrl: 'http://cdn.example/logo.png', splashUrl: null }),
  /Use logo/
);
assert.doesNotMatch(
  renderBrand({
    ...draft,
    logoUrl: 'https://cdn.example/logo.png?access_token=shpat_secret',
    splashUrl: null,
  }),
  /Use logo/
);
const blobSplash = renderBrand({ ...draft, logoUrl: 'blob:http://localhost/logo', splashUrl: null });
assert.match(fieldBlock(blobSplash, 'brand-splash'), />Use logo</);
assert.doesNotMatch(fieldBlock(blobSplash, 'brand-icon'), /Use logo/);

const unsafeSplash = renderBrand({
  ...draft,
  splashUrl: 'https://cdn.example/splash.png?access_token=shpat_secret',
});
assert.match(fieldBlock(unsafeSplash, 'brand-splash'), />Use logo</);
assert.doesNotMatch(unsafeSplash, /access_token=shpat_secret/);

const httpSplashField = renderBrand({ ...draft, splashUrl: 'http://cdn.example/splash.png' });
assert.match(fieldBlock(httpSplashField, 'brand-splash'), />Use logo</);
assert.doesNotMatch(httpSplashField, /http:\/\/cdn\.example\/splash\.png/);
assert.equal(isDisabled(continueButton(httpSplashField)), false);

assert.doesNotMatch(renderBrand({ ...draft, splashUrl: null }, { logoUploading: true }), /Use logo/);
assert.doesNotMatch(renderBrand({ ...draft, splashUrl: null }, { iconUploading: true }), /Use logo/);
assert.doesNotMatch(renderBrand({ ...draft, splashUrl: null }, { splashUploading: true }), /Use logo/);

assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '   ' }))), true);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: 'N' }))), true);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '', iconUrl: null }))), true);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '', splashUrl: null }))), true);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '  Northwind  ' }))), false);

function renderSettings(next: BrandingDraft): string {
  return renderToStaticMarkup(
    createElement(StoreAppBrandView, {
      draft: next,
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

const settingsReady = renderSettings(draft);
assert.doesNotMatch(settingsReady, MOCK);
assert.match(settingsReady, /data-install-preview="instructions"/);
assert.doesNotMatch(renderSettings({ ...draft, appName: '' }), /data-shopper-screen|Your app/);

console.log('launcher mock check ok');
