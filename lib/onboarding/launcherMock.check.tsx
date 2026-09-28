import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { launcherMockIconUrl } from '@/components/onboarding/HomeScreenLauncherMock';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { StoreAppBrandView } from '@/components/settings/StoreAppBrandView';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const mockSource = source('../../components/onboarding/HomeScreenLauncherMock.tsx');
const brandSource = source('../../components/onboarding/steps/BrandingStep.tsx');
const previewStepSource = source('../../components/onboarding/steps/PreviewStep.tsx');
const settingsViewSource = source('../../components/settings/StoreAppBrandView.tsx');
const settingsContainerSource = source('../../components/settings/StoreAppBrand.tsx');
const settingsPageSource = source('../../app/dashboard/settings/page.tsx');
const buildViewSource = source('../../components/onboarding/BuildMyAppView.tsx');

assert.match(brandSource, /<HomeScreenLauncherMock appName=\{draft\.appName\} iconUrl=\{draft\.iconUrl\} \/>/);
assert.match(brandSource, /const nameReady = draft\.appName\.trim\(\)\.length >= 2;/);
assert.match(
  brandSource,
  /const blocked =\n\s*Boolean\(loadError\) \|\| !nameReady \|\| !primaryValid \|\| !secondaryValid \|\| logoUploading \|\| iconUploading \|\| splashUploading;/
);
assert.match(settingsViewSource, /<HomeScreenLauncherMock appName=\{shown\.appName\} iconUrl=\{shown\.iconUrl\} \/>/);
assert.doesNotMatch(previewStepSource, /HomeScreenLauncherMock/);
assert.doesNotMatch(buildViewSource, /HomeScreenLauncherMock/);
assert.doesNotMatch(mockSource, /cartaisy/i);
assert.doesNotMatch(mockSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(mockSource, /shpat_|shpss_|access_token|accessToken/);
assert.doesNotMatch(settingsContainerSource, /\|\| 'Your app'/);
assert.doesNotMatch(settingsPageSource, /storeName \|\| 'Your app'/);

assert.equal(launcherMockIconUrl('https://cdn.example/icon.png'), 'https://cdn.example/icon.png');
assert.equal(launcherMockIconUrl(' blob:http://localhost/preview '), 'blob:http://localhost/preview');
assert.equal(launcherMockIconUrl('http://cdn.example/icon.png'), null);
assert.equal(launcherMockIconUrl('https://cdn.example/icon.png?token=shpss_secret'), null);
assert.equal(launcherMockIconUrl('https://cdn.example/icon.png?access_token=shpat_secret'), null);
assert.equal(launcherMockIconUrl('   '), null);
assert.equal(launcherMockIconUrl(null), null);

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

function launcher(markup: string): string {
  const start = markup.indexOf('data-launcher-mock');
  assert.ok(start >= 0, 'launcher mock should render');
  const end = markup.indexOf('</figure>', start);
  assert.ok(end > start);
  return markup.slice(start, end);
}

function homeScreen(markup: string): string {
  const block = launcher(markup);
  const start = block.indexOf('data-home-screen');
  const end = block.indexOf('Add an app');
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
  assert.match(block, /\/dashboard\/onboarding\?step=brand/);
  assert.match(block, /\/dashboard\/settings#store-branding/);
  assert.match(block, /You can request a build either way\./);
  assert.doesNotMatch(block, /cartaisy/i);
  assert.doesNotMatch(block, /northwind\.myshopify\.com/);
  assert.doesNotMatch(block, /884422/);
  assert.doesNotMatch(block, /Your app/);
}

const ready = renderBrand(draft);
const readyMock = launcher(ready);
assert.match(homeScreen(ready), /src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(homeScreen(ready), /Northwind/);
assert.equal(readyMock.includes('step=brand'), false);
assert.equal(readyMock.includes('Add an app'), false);
assert.doesNotMatch(readyMock, /cartaisy/i);
assert.doesNotMatch(readyMock, /northwind\.myshopify\.com/);
assert.doesNotMatch(readyMock, /884422/);
assert.equal(isDisabled(continueButton(ready)), false);

const blobDraft = renderBrand({
  ...draft,
  iconUrl: 'blob:http://localhost/preview',
  iconPersisted: false,
});
assert.match(homeScreen(blobDraft), /src="blob:http:\/\/localhost\/preview"/);
assert.match(homeScreen(blobDraft), /Northwind/);
assert.equal(launcher(blobDraft).includes('Add an app'), false);
assert.equal(isDisabled(continueButton(blobDraft)), false);

const missingIcon = renderBrand({ ...draft, iconUrl: null });
const missingIconMock = launcher(missingIcon);
assert.equal(homeScreen(missingIcon).includes('<img'), false);
assert.match(homeScreen(missingIcon), /Northwind/);
assert.match(missingIconMock, /Add an app icon in/);
assertSoftLinks(missingIconMock);
assert.equal(isDisabled(continueButton(missingIcon)), false);

const blankName = renderBrand({ ...draft, appName: '   ' });
const blankMock = launcher(blankName);
assert.match(homeScreen(blankName), /src="https:\/\/cdn\.example\/icon\.png"/);
assert.equal(homeScreen(blankName).includes('Northwind'), false);
assert.match(blankMock, /Add an app name in/);
assert.equal(blankMock.includes('Add an app icon'), false);
assertSoftLinks(blankMock);
assert.equal(isDisabled(continueButton(blankName)), true);

const shortName = renderBrand({ ...draft, appName: 'N' });
assert.match(homeScreen(shortName), />N</);
assert.equal(launcher(shortName).includes('Add an app'), false);
assert.equal(isDisabled(continueButton(shortName)), true);

const bothMissing = renderBrand({ ...draft, appName: '', iconUrl: null });
const bothMock = launcher(bothMissing);
assert.equal(homeScreen(bothMissing).includes('<img'), false);
assert.match(bothMock, /Add an app name and an app icon in/);
assertSoftLinks(bothMock);
assert.equal(isDisabled(continueButton(bothMissing)), true);

const poisoned = renderBrand({
  ...draft,
  iconUrl: 'https://cdn.example/icon.png?access_token=shpat_secret',
});
const poisonedMock = launcher(poisoned);
assert.equal(poisonedMock.includes('<img'), false);
assert.equal(poisonedMock.includes('shpat_'), false);
assert.match(poisonedMock, /Northwind/);
assert.match(poisonedMock, /Add an app icon in/);
assertSoftLinks(poisonedMock);
assert.equal(isDisabled(continueButton(poisoned)), false);

const httpIcon = renderBrand({ ...draft, iconUrl: 'http://cdn.example/icon.png' });
assert.equal(launcher(httpIcon).includes('http://cdn.example'), false);
assert.match(launcher(httpIcon), /Add an app icon in/);

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
assert.match(homeScreen(settingsReady), /src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(homeScreen(settingsReady), /Northwind/);
assert.equal(launcher(settingsReady).includes('Add an app'), false);

const settingsBlank = renderSettings({ ...draft, appName: '' });
assert.match(settingsBlank, /data-shopper-screen[\s\S]*Your app/);
assert.doesNotMatch(launcher(settingsBlank), /Your app/);
assert.match(launcher(settingsBlank), /Add an app name in/);

const settingsBlob = renderSettings({
  ...draft,
  iconUrl: 'blob:http://localhost/settings-preview',
  iconPersisted: false,
});
assert.match(homeScreen(settingsBlob), /src="blob:http:\/\/localhost\/settings-preview"/);

console.log('launcher mock check ok');
