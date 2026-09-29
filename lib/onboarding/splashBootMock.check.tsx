import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SplashBootMock, splashBootImageUrl } from '@/components/onboarding/SplashBootMock';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { StoreAppBrandView } from '@/components/settings/StoreAppBrandView';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const mockSource = source('../../components/onboarding/SplashBootMock.tsx');
const launcherSource = source('../../components/onboarding/HomeScreenLauncherMock.tsx');
const previewSource = source('../../components/onboarding/SmartHomePreview.tsx');
const brandSource = source('../../components/onboarding/steps/BrandingStep.tsx');
const previewStepSource = source('../../components/onboarding/steps/PreviewStep.tsx');
const settingsViewSource = source('../../components/settings/StoreAppBrandView.tsx');
const buildViewSource = source('../../components/onboarding/BuildMyAppView.tsx');

assert.doesNotMatch(brandSource, /HomeScreenLauncherMock|SplashBootMock|SmartHomePreview/);
assert.match(brandSource, /const trimmedName = draft\.appName\.trim\(\);/);
assert.match(
  brandSource,
  /const nameReady = trimmedName\.length >= 2 && !isPlatformWordmark\(trimmedName\);/
);
assert.match(
  brandSource,
  /const uploadsBusy = logoUploading \|\| iconUploading \|\| splashUploading;\n\s*const blocked =\n\s*Boolean\(loadError\) \|\| !nameReady \|\| !primaryValid \|\| !secondaryValid \|\| uploadsBusy;/
);
assert.doesNotMatch(settingsViewSource, /HomeScreenLauncherMock|SplashBootMock|SmartHomePreview/);
assert.doesNotMatch(previewStepSource, /SplashBootMock/);
assert.doesNotMatch(buildViewSource, /SplashBootMock/);
assert.doesNotMatch(previewSource, /SplashBootMock/);
assert.doesNotMatch(launcherSource, /SplashBootMock/);
assert.doesNotMatch(mockSource, /cartaisy/i);
assert.doesNotMatch(mockSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(mockSource, /shpat_|shpss_|access_token|accessToken/);
assert.doesNotMatch(mockSource, /iconUrl|logoUrl/);

assert.equal(splashBootImageUrl('https://cdn.example/splash.png'), 'https://cdn.example/splash.png');
assert.equal(splashBootImageUrl(' blob:http://localhost/preview '), 'blob:http://localhost/preview');
assert.equal(splashBootImageUrl('http://cdn.example/splash.png'), null);
assert.equal(splashBootImageUrl('https://cdn.example/splash.png?token=shpss_secret'), null);
assert.equal(splashBootImageUrl('https://cdn.example/splash.png?access_token=shpat_secret'), null);
assert.equal(splashBootImageUrl('   '), null);
assert.equal(splashBootImageUrl(null), null);

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

function splashBoot(markup: string): string {
  const start = markup.indexOf('data-splash-boot-mock');
  assert.ok(start >= 0, 'splash boot mock should render');
  const end = markup.indexOf('</figure>', start);
  assert.ok(end > start);
  return markup.slice(start, end);
}

function splashFrame(markup: string): string {
  const block = splashBoot(markup);
  const start = block.indexOf('data-splash-frame');
  const end = block.indexOf('Add a splash');
  return end === -1 ? block.slice(start) : block.slice(start, end);
}

function continueButton(markup: string): string {
  const match = markup.match(/<button[^>]*>Continue<\/button>/);
  assert.ok(match, 'Continue button');
  return match[0];
}

function isDisabled(tag: string): boolean {
  return / disabled(?:=|>|\s)/.test(tag);
}

function renderSplash(next: BrandingDraft): string {
  return renderToStaticMarkup(
    createElement(SplashBootMock, { appName: next.appName, splashUrl: next.splashUrl })
  );
}

function renderBrand(next: BrandingDraft): string {
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

function assertSoftLinks(block: string) {
  assert.match(block, /Add a splash in/);
  assert.match(block, /\/dashboard\/onboarding\?step=brand/);
  assert.match(block, /\/dashboard\/settings#store-branding/);
  assert.match(block, /You can request a build either way\./);
  assert.doesNotMatch(block, /cartaisy/i);
  assert.doesNotMatch(block, /northwind\.myshopify\.com/);
  assert.doesNotMatch(block, /884422/);
  assert.doesNotMatch(block, /Your app/);
  assert.doesNotMatch(block, /logo\.png|icon\.png/);
}

function assertNoSubstitute(block: string) {
  assert.doesNotMatch(block, /cartaisy/i);
  assert.doesNotMatch(block, /northwind\.myshopify\.com/);
  assert.doesNotMatch(block, /884422/);
  assert.doesNotMatch(block, /Your app/);
  assert.doesNotMatch(block, /logo\.png|icon\.png/);
}

const readyPage = renderBrand(draft);
assert.doesNotMatch(readyPage, /data-splash-boot-mock|data-shopper-screen|data-launcher-mock/);
assert.match(readyPage, /data-install-preview="instructions"/);
assert.equal(isDisabled(continueButton(readyPage)), false);

const ready = renderSplash(draft);
const readyMock = splashBoot(ready);
assert.match(splashFrame(ready), /src="https:\/\/cdn\.example\/splash\.png"/);
assert.match(splashFrame(ready), /object-cover/);
assert.match(readyMock, /Northwind/);
assert.equal(readyMock.includes('step=brand'), false);
assert.equal(readyMock.includes('Add a splash'), false);
assertNoSubstitute(readyMock);

const trimmedName = renderSplash({ ...draft, appName: '  Northwind  ' });
assert.match(splashBoot(trimmedName), /Northwind/);
assert.equal(splashBoot(trimmedName).includes('  Northwind  '), false);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '  Northwind  ' }))), false);

const blobDraft = renderSplash({
  ...draft,
  splashUrl: 'blob:http://localhost/preview',
  splashPersisted: false,
});
assert.match(splashFrame(blobDraft), /src="blob:http:\/\/localhost\/preview"/);
assert.match(splashBoot(blobDraft), /Northwind/);
assert.equal(splashBoot(blobDraft).includes('Add a splash'), false);
assertNoSubstitute(splashBoot(blobDraft));
assert.equal(
  isDisabled(continueButton(renderBrand({ ...draft, splashUrl: 'blob:http://localhost/preview', splashPersisted: false }))),
  false
);

const missingSplash = renderSplash({ ...draft, splashUrl: null });
const missingMock = splashBoot(missingSplash);
assert.equal(splashFrame(missingSplash).includes('<img'), false);
assert.match(missingMock, /Northwind/);
assertSoftLinks(missingMock);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, splashUrl: null }))), false);

const blankName = renderSplash({ ...draft, appName: '   ' });
const blankMock = splashBoot(blankName);
assert.match(splashFrame(blankName), /src="https:\/\/cdn\.example\/splash\.png"/);
assert.equal(blankMock.includes('Northwind'), false);
assert.equal(blankMock.includes('Add a splash'), false);
assertNoSubstitute(blankMock);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '   ' }))), true);

const shortName = renderSplash({ ...draft, appName: 'N' });
assert.match(splashBoot(shortName), />N</);
assert.equal(splashBoot(shortName).includes('Add a splash'), false);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: 'N' }))), true);

const bothMissing = renderSplash({ ...draft, appName: '', splashUrl: null });
const bothMock = splashBoot(bothMissing);
assert.equal(splashFrame(bothMissing).includes('<img'), false);
assert.equal(bothMock.includes('Northwind'), false);
assertSoftLinks(bothMock);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '', splashUrl: null }))), true);

const poisoned = renderSplash({
  ...draft,
  splashUrl: 'https://cdn.example/splash.png?access_token=shpat_secret',
});
const poisonedMock = splashBoot(poisoned);
assert.equal(poisonedMock.includes('<img'), false);
assert.equal(poisonedMock.includes('shpat_'), false);
assert.match(poisonedMock, /Northwind/);
assertSoftLinks(poisonedMock);

const httpSplash = renderSplash({ ...draft, splashUrl: 'http://cdn.example/splash.png' });
assert.equal(splashBoot(httpSplash).includes('http://cdn.example'), false);
assert.match(splashBoot(httpSplash), /Add a splash in/);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, splashUrl: 'http://cdn.example/splash.png' }))), false);

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
assert.doesNotMatch(settingsReady, /data-splash-boot-mock|data-shopper-screen|data-launcher-mock/);
assert.match(settingsReady, /data-install-preview="instructions"/);
const settingsSplash = renderSplash(draft);
assert.match(splashFrame(settingsSplash), /src="https:\/\/cdn\.example\/splash\.png"/);
assert.match(splashBoot(settingsSplash), /Northwind/);
assert.equal(splashBoot(settingsSplash).includes('Add a splash'), false);
assertNoSubstitute(splashBoot(settingsSplash));

const settingsBlank = renderSplash({ ...draft, appName: '' });
assert.doesNotMatch(renderSettings({ ...draft, appName: '' }), /data-shopper-screen/);
assert.doesNotMatch(splashBoot(settingsBlank), /Your app/);
assert.equal(splashBoot(settingsBlank).includes('Add a splash'), false);

const settingsMissing = renderSplash({ ...draft, splashUrl: null });
assert.equal(splashFrame(settingsMissing).includes('<img'), false);
assert.match(splashBoot(settingsMissing), /Northwind/);
assertSoftLinks(splashBoot(settingsMissing));

const settingsBlob = renderSplash({
  ...draft,
  splashUrl: 'blob:http://localhost/settings-preview',
  splashPersisted: false,
});
assert.match(splashFrame(settingsBlob), /src="blob:http:\/\/localhost\/settings-preview"/);
assert.equal(splashBoot(settingsBlob).includes('Add a splash'), false);

console.log('splash boot mock check ok');
