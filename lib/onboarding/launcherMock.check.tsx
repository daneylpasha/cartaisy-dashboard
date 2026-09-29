import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HomeScreenLauncherMock, launcherMockIconUrl } from '@/components/onboarding/HomeScreenLauncherMock';
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

assert.doesNotMatch(brandSource, /HomeScreenLauncherMock|SmartHomePreview|SplashBootMock/);
assert.match(brandSource, /const nameReady = draft\.appName\.trim\(\)\.length >= 2;/);
assert.match(
  brandSource,
  /const uploadsBusy = logoUploading \|\| iconUploading \|\| splashUploading;\n\s*const blocked =\n\s*Boolean\(loadError\) \|\| !nameReady \|\| !primaryValid \|\| !secondaryValid \|\| uploadsBusy;/
);
const copyLogoSource = source('../../components/brand/useCopyLogoAsIcon.ts');
assert.match(brandSource, /useCopyLogoAsIcon/);
assert.match(brandSource, /onIconFile\(file\)/);
assert.match(copyLogoSource, /fileFromDrawableLogo/);
assert.match(copyLogoSource, /onIconFile\(file\)/);
assert.doesNotMatch(copyLogoSource, /iconUrl/);
assert.match(brandSource, /showUseLogo = Boolean\(useLogo\) && !showImage && !busy/);
assert.doesNotMatch(settingsViewSource, /HomeScreenLauncherMock|SmartHomePreview|SplashBootMock/);
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

function renderLauncher(next: BrandingDraft): string {
  return renderToStaticMarkup(
    createElement(HomeScreenLauncherMock, { appName: next.appName, iconUrl: next.iconUrl })
  );
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

function assertSoftLinks(block: string) {
  assert.match(block, /\/dashboard\/onboarding\?step=brand/);
  assert.match(block, /\/dashboard\/settings#store-branding/);
  assert.match(block, /You can request a build either way\./);
  assert.doesNotMatch(block, /cartaisy/i);
  assert.doesNotMatch(block, /northwind\.myshopify\.com/);
  assert.doesNotMatch(block, /884422/);
  assert.doesNotMatch(block, /Your app/);
}

const readyPage = renderBrand(draft);
assert.doesNotMatch(readyPage, /data-launcher-mock|data-shopper-screen|data-splash-boot-mock/);
assert.match(readyPage, /data-install-preview="instructions"/);
assert.equal(isDisabled(continueButton(readyPage)), false);

const ready = renderLauncher(draft);
const readyMock = launcher(ready);
assert.match(homeScreen(ready), /src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(homeScreen(ready), /Northwind/);
assert.equal(readyMock.includes('step=brand'), false);
assert.equal(readyMock.includes('Add an app'), false);
assert.doesNotMatch(readyMock, /cartaisy/i);
assert.doesNotMatch(readyMock, /northwind\.myshopify\.com/);
assert.doesNotMatch(readyMock, /884422/);

const blobDraft = renderLauncher({
  ...draft,
  iconUrl: 'blob:http://localhost/preview',
  iconPersisted: false,
});
assert.match(homeScreen(blobDraft), /src="blob:http:\/\/localhost\/preview"/);
assert.match(homeScreen(blobDraft), /Northwind/);
assert.equal(launcher(blobDraft).includes('Add an app'), false);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, iconUrl: 'blob:http://localhost/preview', iconPersisted: false }))), false);

const missingIcon = renderLauncher({ ...draft, iconUrl: null });
const missingIconMock = launcher(missingIcon);
assert.equal(homeScreen(missingIcon).includes('<img'), false);
assert.match(homeScreen(missingIcon), /Northwind/);
assert.match(missingIconMock, /Add an app icon in/);
assertSoftLinks(missingIconMock);
const emptyIcon = renderBrand({ ...draft, iconUrl: null });
assert.match(emptyIcon, />Use logo</);
assert.equal(isDisabled(continueButton(emptyIcon)), false);
assert.doesNotMatch(emptyIcon, /data-launcher-mock|data-shopper-screen|data-splash-boot-mock/);

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

const blankName = renderLauncher({ ...draft, appName: '   ' });
const blankMock = launcher(blankName);
assert.match(homeScreen(blankName), /src="https:\/\/cdn\.example\/icon\.png"/);
assert.equal(homeScreen(blankName).includes('Northwind'), false);
assert.match(blankMock, /Add an app name in/);
assert.equal(blankMock.includes('Add an app icon'), false);
assertSoftLinks(blankMock);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '   ' }))), true);

const shortName = renderLauncher({ ...draft, appName: 'N' });
assert.match(homeScreen(shortName), />N</);
assert.equal(launcher(shortName).includes('Add an app'), false);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: 'N' }))), true);

const bothMissing = renderLauncher({ ...draft, appName: '', iconUrl: null });
const bothMock = launcher(bothMissing);
assert.equal(homeScreen(bothMissing).includes('<img'), false);
assert.match(bothMock, /Add an app name and an app icon in/);
assertSoftLinks(bothMock);
assert.equal(isDisabled(continueButton(renderBrand({ ...draft, appName: '', iconUrl: null }))), true);

const poisoned = renderLauncher({
  ...draft,
  iconUrl: 'https://cdn.example/icon.png?access_token=shpat_secret',
});
const poisonedMock = launcher(poisoned);
assert.equal(poisonedMock.includes('<img'), false);
assert.equal(poisonedMock.includes('shpat_'), false);
assert.match(poisonedMock, /Northwind/);
assert.match(poisonedMock, /Add an app icon in/);
assertSoftLinks(poisonedMock);

const httpIcon = renderLauncher({ ...draft, iconUrl: 'http://cdn.example/icon.png' });
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
assert.doesNotMatch(settingsReady, /data-launcher-mock|data-shopper-screen|data-splash-boot-mock/);
assert.match(settingsReady, /data-install-preview="instructions"/);
const settingsLauncher = renderLauncher(draft);
assert.match(homeScreen(settingsLauncher), /src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(homeScreen(settingsLauncher), /Northwind/);
assert.equal(launcher(settingsLauncher).includes('Add an app'), false);

const settingsBlank = renderLauncher({ ...draft, appName: '' });
assert.doesNotMatch(renderSettings({ ...draft, appName: '' }), /data-shopper-screen/);
assert.doesNotMatch(launcher(settingsBlank), /Your app/);
assert.match(launcher(settingsBlank), /Add an app name in/);

const settingsBlob = renderLauncher({
  ...draft,
  iconUrl: 'blob:http://localhost/settings-preview',
  iconPersisted: false,
});
assert.match(homeScreen(settingsBlob), /src="blob:http:\/\/localhost\/settings-preview"/);

console.log('launcher mock check ok');
