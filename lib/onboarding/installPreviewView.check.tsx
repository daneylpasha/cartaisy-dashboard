import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandingStep } from '@/components/onboarding/steps/BrandingStep';
import { PreviewStep } from '@/components/onboarding/steps/PreviewStep';
import { StoreAppBrandView } from '@/components/settings/StoreAppBrandView';
import type { InstallPreviewModel, ReadyInstall } from '@/lib/build/installPreview';
import { EMPTY_CATALOG } from '@/lib/onboarding/normalizers';
import type { BrandingDraft, LockedCatalog, ShopifyConnectionSnapshot, SyncGate } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const wizardSource = source('../../components/onboarding/OnboardingWizard.tsx');
const settingsSource = source('../../components/settings/StoreAppBrand.tsx');
const hookSource = source('../../hooks/useReadyInstallPreview.ts');
const qrSource = source('../../lib/build/installQr.ts');
const boardSource = source('../../components/build/InstallQrBoard.tsx');

assert.match(wizardSource, /useReadyInstallPreview\(step === 'brand' \|\| step === 'preview' \? 'brand-preview' : step\)/);
assert.match(wizardSource, /installPreview=\{installPreview\}/);
assert.match(settingsSource, /useReadyInstallPreview\('settings'\)/);
assert.match(settingsSource, /installPreview=\{installPreview\}/);
assert.match(hookSource, /phase: 'loading'/);
assert.match(qrSource, /from 'qrcode'/);
assert.doesNotMatch(qrSource, /api\.qrserver|chart\.googleapis|expo\.dev\/accounts/);
assert.doesNotMatch(boardSource, /EXPO_TOKEN|easBuildId|access_token|shpat_/);
assert.doesNotMatch(`${qrSource}\n${boardSource}`, /console\.(log|debug|info|error|warn)/);

const ANDROID = 'https://expo.dev/accounts/northwind/builds/android';
const IOS = 'https://u.expo.dev/artifact/ios';

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
  shopId: null,
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

const readyInstalls: ReadyInstall[] = [
  { platform: 'android', label: 'Android', url: ANDROID },
  { platform: 'ios', label: 'iOS', url: IOS },
];

const loading: InstallPreviewModel = { phase: 'loading', installs: [] };
const failed: InstallPreviewModel = { phase: 'unavailable', installs: [] };
const installed: InstallPreviewModel = { phase: 'ready', installs: readyInstalls };
const none: InstallPreviewModel = { phase: 'ready', installs: [] };

function renderBrand(model?: InstallPreviewModel): string {
  return renderToStaticMarkup(
    createElement(BrandingStep, {
      draft,
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
      installPreview: model,
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

function renderPreview(model?: InstallPreviewModel): string {
  return renderToStaticMarkup(
    createElement(PreviewStep, {
      draft,
      catalog,
      sync: quiet,
      installPreview: model,
      onBack: () => undefined,
      onContinue: () => undefined,
      onRetry: () => undefined,
    })
  );
}

function renderSettings(model?: InstallPreviewModel): string {
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
      installPreview: model,
      onRetry: () => undefined,
      onIconFile: () => undefined,
      onSplashFile: () => undefined,
      onImageError: () => undefined,
    })
  );
}

function assertMock(markup: string, editors: RegExp) {
  assert.match(markup, /data-install-preview="mock"/);
  assert.match(markup, /data-shopper-screen/);
  assert.match(markup, /Live preview/);
  assert.doesNotMatch(markup, /data-install-qr/);
  assert.doesNotMatch(markup, /Open Build/);
  assert.match(markup, editors);
}

function assertInstall(markup: string, editors: RegExp) {
  assert.match(markup, /data-install-preview="install"/);
  assert.equal((markup.match(/data-install-qr/g) ?? []).length, 2);
  assert.match(markup, /Open Build/);
  assert.match(markup, /href="\/dashboard\/onboarding\?step=ready"/);
  assert.match(markup, new RegExp(`href="${ANDROID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.match(markup, new RegExp(`href="${IOS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`));
  assert.doesNotMatch(markup, /data-shopper-screen/);
  assert.doesNotMatch(markup, /data-launcher-mock/);
  assert.doesNotMatch(markup, /data-splash-frame/);
  assert.doesNotMatch(markup, /Live preview/);
  assert.match(markup, /Scan to install the app on your phone/);
  assert.match(markup, editors);
  assert.doesNotMatch(markup, /cartaisy/i);
  for (const svg of markup.match(/<svg[\s\S]*?<\/svg>/g) ?? []) {
    assert.equal(svg.includes(ANDROID), false);
    assert.equal(svg.includes('shpat_'), false);
  }
}

function assertLoading(markup: string, editors: RegExp) {
  assert.match(markup, /data-install-preview="loading"/);
  assert.match(markup, /Checking your build/);
  assert.doesNotMatch(markup, /data-shopper-screen/);
  assert.doesNotMatch(markup, /data-launcher-mock/);
  assert.doesNotMatch(markup, /data-splash-frame/);
  assert.doesNotMatch(markup, /data-install-qr/);
  assert.match(markup, editors);
}

const brandEditors = /id="app-name"/;
const previewEditors = />Continue</;
const settingsEditors = /Replace App icon/;

assertMock(renderBrand(undefined), brandEditors);
assertMock(renderBrand(failed), brandEditors);
assertMock(renderBrand(none), brandEditors);
assertLoading(renderBrand(loading), brandEditors);
assertInstall(renderBrand(installed), brandEditors);
assert.match(renderBrand(installed), />Continue</);
assert.match(renderBrand(undefined), /The phone uses this draft/);
assert.doesNotMatch(renderBrand(installed), /The phone uses this draft/);

assertMock(renderPreview(failed), previewEditors);
assertLoading(renderPreview(loading), previewEditors);
assertInstall(renderPreview(installed), previewEditors);
assert.match(renderPreview(undefined), /These screens follow the shopper app/);
assert.doesNotMatch(renderPreview(installed), /These screens follow the shopper app/);
assert.doesNotMatch(renderPreview(loading), /data-shopper-screen/);

assertMock(renderSettings(undefined), settingsEditors);
assertMock(renderSettings(failed), settingsEditors);
assertLoading(renderSettings(loading), settingsEditors);
assertInstall(renderSettings(installed), settingsEditors);
assert.match(renderSettings(undefined), /under the phone/);
assert.doesNotMatch(renderSettings(installed), /under the phone/);
assert.match(renderSettings(installed), /Replace Splash/);

assertInstall(
  renderBrand({ phase: 'loading', installs: readyInstalls }),
  brandEditors
);

const poisoned = renderBrand({
  phase: 'ready',
  installs: [{ platform: 'android', label: 'Android', url: 'https://expo.dev/builds/shpat_secret' }],
});
assert.match(poisoned, /data-install-preview="mock"/);
assert.match(poisoned, /data-shopper-screen/);
assert.doesNotMatch(poisoned, /shpat_/);
assert.doesNotMatch(poisoned, /data-install-qr/);

console.log('install preview view ok');
