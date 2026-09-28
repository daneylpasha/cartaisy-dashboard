import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { BuildMyAppView, type BuildMyAppViewProps } from '../../components/onboarding/BuildMyAppView.tsx';
import { launcherDisplayName, launcherThumbUrl } from '../../components/onboarding/LauncherReadinessStrip.tsx';
import type { BuildRequest } from './contract.ts';

const here = dirname(fileURLToPath(import.meta.url));

const noop = () => {};

const eligible = {
  enabled: true,
  reason: null,
  action: null,
} as const;

const base: BuildMyAppViewProps = {
  phase: 'ready',
  loadError: null,
  availability: eligible,
  mode: 'compose',
  request: null,
  android: true,
  ios: true,
  accessNotes: '',
  submitting: false,
  syncBusy: false,
  noteSaving: false,
  formError: null,
  onAndroidChange: noop,
  onIosChange: noop,
  onNotesChange: noop,
  onNotesBlur: noop,
  onPrimary: noop,
  onRequestAnother: noop,
  onCancelAnother: noop,
  onRetry: noop,
};

function html(overrides: Partial<BuildMyAppViewProps>): string {
  return renderToStaticMarkup(createElement(BuildMyAppView, { ...base, ...overrides }));
}

function request(
  android: BuildRequest['platforms']['android']['status'],
  ios: BuildRequest['platforms']['ios']['status'],
  urls?: { android?: string | null; ios?: string | null }
): BuildRequest {
  return {
    id: '66f1c2e0a1b2c3d4e5f60718',
    platforms: {
      android: { status: android, installUrl: urls?.android ?? null },
      ios: { status: ios, installUrl: urls?.ios ?? null },
    },
    accessNotes: 'Apple developer invite sent.',
  };
}

const forbidden = ['EAS', 'runbook', 'shpat_', 'easBuildId', '66f1c2e0a1b2c3d4e5f60718', 'accessToken'];

function assertCalm(markup: string) {
  for (const word of forbidden) {
    assert.equal(markup.includes(word), false, `screen leaked ${word}`);
  }
}

function buttonTag(markup: string, label: string): string {
  const match = markup.match(new RegExp(`<button[^>]*>${label}</button>`));
  assert.ok(match, `missing button ${label}`);
  return match?.[0] ?? '';
}

function isDisabled(tag: string): boolean {
  return / disabled(?:=|>|\s)/.test(tag);
}

const disconnected = html({
  availability: {
    enabled: false,
    action: 'connect',
    reason: 'Shopify is disconnected. Reconnect before requesting a build.',
  },
  android: false,
  ios: false,
});
assert.ok(disconnected.includes('Reconnect Shopify'));
assert.ok(disconnected.includes('Shopify is disconnected. Reconnect before requesting a build.'));
assert.equal(disconnected.includes('>Build my app<'), false);
assertCalm(disconnected);

const needsSync = html({
  availability: {
    enabled: false,
    action: 'sync',
    reason: 'Your catalog has not synced yet. Use Sync again.',
  },
});
assert.ok(needsSync.includes('>Sync again<'));
assert.equal(needsSync.includes('>Build my app<'), false);
assertCalm(needsSync);

const syncing = html({
  availability: {
    enabled: false,
    action: 'sync',
    reason: 'Syncing your catalog…',
  },
  syncBusy: true,
});
assert.equal(isDisabled(buttonTag(syncing, 'Sync again')), true);
assert.ok(syncing.includes('Syncing your catalog'));
assertCalm(syncing);

const readyToSubmit = html({});
assert.equal(isDisabled(buttonTag(readyToSubmit, 'Build my app')), false);
assertCalm(readyToSubmit);

const neither = html({ android: false, ios: false });
assert.equal(isDisabled(buttonTag(neither, 'Build my app')), true);
assertCalm(neither);

const waiting = html({
  mode: 'status',
  request: request('waiting_on_merchant', 'waiting_on_merchant'),
  accessNotes: 'Apple developer invite sent.',
});
assert.ok(waiting.includes('Waiting on you'));
assert.ok(waiting.includes('Waiting on Apple'));
assert.equal((waiting.match(/checked=""/g) ?? []).length, 2);
assert.equal(waiting.includes('>Build my app<'), false);
assert.ok(waiting.includes('Apple developer invite sent.'));
assertCalm(waiting);

const mixed = html({
  mode: 'status',
  request: request('ready', 'building'),
});
assert.ok(mixed.includes('Ready'));
assert.ok(mixed.includes('Building'));
assert.equal(mixed.includes('Request another build'), false);
assertCalm(mixed);

const readyWithoutLink = html({
  mode: 'status',
  request: request('ready', 'ready'),
});
assert.ok(readyWithoutLink.includes('Ready'));
assert.equal(readyWithoutLink.includes('Install Android build'), false);
assert.equal(readyWithoutLink.includes('Install iOS build'), false);
assert.equal(readyWithoutLink.includes('href="http'), false);
assert.equal(readyWithoutLink.includes('href="https'), false);
assertCalm(readyWithoutLink);

const ANDROID_INSTALL = 'https://expo.dev/accounts/northwind/builds/android';
const IOS_INSTALL = 'https://u.expo.dev/artifact/ios';
const readyWithLinks = html({
  mode: 'status',
  request: request('ready', 'ready', { android: ANDROID_INSTALL, ios: IOS_INSTALL }),
});
assert.ok(readyWithLinks.includes('Install Android build'));
assert.ok(readyWithLinks.includes('Install iOS build'));
assert.ok(readyWithLinks.includes('Ready'));
assert.ok(readyWithLinks.includes(`href="${ANDROID_INSTALL}"`));
assert.ok(readyWithLinks.includes(`href="${IOS_INSTALL}"`));
assert.equal((readyWithLinks.match(/target="_blank"/g) ?? []).length, 2);
assert.equal((readyWithLinks.match(/rel="noopener noreferrer"/g) ?? []).length, 2);
assert.doesNotMatch(readyWithLinks, /cartaisy/i);
assert.equal(readyWithLinks.includes('EAS'), false);
assertCalm(readyWithLinks);

const readyHttp = html({
  mode: 'status',
  request: request('ready', 'not_requested', { android: 'http://expo.dev/accounts/northwind/builds/android' }),
});
assert.ok(readyHttp.includes('Ready'));
assert.equal(readyHttp.includes('Install Android build'), false);
assert.equal(readyHttp.includes('http://expo.dev'), false);
assertCalm(readyHttp);

const readySecret = html({
  mode: 'status',
  request: request('ready', 'not_requested', {
    android: 'https://expo.dev/accounts/northwind/builds/shpat_secret',
  }),
});
assert.equal(readySecret.includes('Install Android build'), false);
assert.equal(readySecret.includes('shpat_'), false);
assertCalm(readySecret);

const buildingWithLink = html({
  mode: 'status',
  request: request('building', 'not_requested', { android: ANDROID_INSTALL }),
});
assert.ok(buildingWithLink.includes('Building'));
assert.equal(buildingWithLink.includes('Install Android build'), false);
assert.equal(buildingWithLink.includes(ANDROID_INSTALL), false);
assertCalm(buildingWithLink);

const composeIgnoresLink = html({
  mode: 'compose',
  request: request('ready', 'ready', { android: ANDROID_INSTALL, ios: IOS_INSTALL }),
});
assert.equal(composeIgnoresLink.includes('Install Android build'), false);
assert.equal(composeIgnoresLink.includes(ANDROID_INSTALL), false);
assert.ok(composeIgnoresLink.includes('>Build my app<'));
assertCalm(composeIgnoresLink);

const settled = html({
  mode: 'status',
  request: request('ready', 'failed'),
});
assert.ok(settled.includes('One app is ready. The other did not finish.'));
assert.ok(settled.includes('Request another build'));
assert.ok(settled.includes('Failed'));
assertCalm(settled);

const recheck = html({
  availability: {
    enabled: false,
    action: 'retry',
    reason: 'We could not confirm your catalog sync. Try again.',
  },
  rechecking: true,
});
assert.equal(isDisabled(buttonTag(recheck, 'Checking...')), true);
assert.equal(recheck.includes('>Try again<'), false);
assert.ok(recheck.includes('We could not confirm your catalog sync. Try again.'));
assertCalm(recheck);

const noteLimit = html({ accessNotes: 'Hello' });
assert.ok(noteLimit.includes('maxLength="280"') || noteLimit.includes('maxlength="280"'));
assertCalm(noteLimit);

const missingAssets = html({ appName: 'Northwind', iconUrl: null, splashUrl: null });
assert.equal(isDisabled(buttonTag(missingAssets, 'Build my app')), false);
assert.ok(missingAssets.includes('Northwind'));
assert.equal((missingAssets.match(/Not added/g) ?? []).length, 2);
assert.ok(missingAssets.includes('Add an app icon and a splash in'));
assert.ok(missingAssets.includes('/dashboard/onboarding?step=brand'));
assert.ok(missingAssets.includes('/dashboard/settings#store-branding'));
assert.ok(missingAssets.includes('You can request a build either way.'));
assert.equal(missingAssets.includes('<img'), false);
assertCalm(missingAssets);

const bothReady = html({
  appName: '  Northwind  ',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: 'https://cdn.example/splash.png',
});
assert.equal(isDisabled(buttonTag(bothReady, 'Build my app')), false);
assert.ok(bothReady.includes('Northwind'));
assert.equal(bothReady.includes('  Northwind'), false);
assert.match(bothReady, /src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(bothReady, /src="https:\/\/cdn\.example\/splash\.png"/);
assert.equal((bothReady.match(/Ready/g) ?? []).length, 2);
assert.equal(bothReady.includes('Not added'), false);
assert.equal(bothReady.includes('step=brand'), false);
assert.doesNotMatch(bothReady, /cartaisy/i);
assertCalm(bothReady);

const missingName = html({
  appName: '   ',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: 'https://cdn.example/splash.png',
});
assert.equal(isDisabled(buttonTag(missingName, 'Build my app')), false);
assert.ok(missingName.includes('Add an app name in'));
assert.ok(missingName.includes('Not added'));
assert.equal((missingName.match(/Not added/g) ?? []).length, 1);
assert.ok(missingName.includes('/dashboard/onboarding?step=brand'));
assert.ok(missingName.includes('/dashboard/settings#store-branding'));
assert.ok(missingName.includes('You can request a build either way.'));
assert.doesNotMatch(missingName, /cartaisy/i);
assert.doesNotMatch(missingName, /myshopify/i);
assert.equal(missingName.includes('APP_NAME'), false);
assertCalm(missingName);

const blankName = html({
  appName: '',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: null,
});
assert.equal(isDisabled(buttonTag(blankName, 'Build my app')), false);
assert.ok(blankName.includes('Add an app name and a splash in'));
assert.ok(blankName.includes('/dashboard/onboarding?step=brand'));
assert.doesNotMatch(blankName, /cartaisy/i);
assertCalm(blankName);

const allMissing = html({ appName: null, iconUrl: null, splashUrl: null });
assert.equal(isDisabled(buttonTag(allMissing, 'Build my app')), false);
assert.equal((allMissing.match(/Not added/g) ?? []).length, 3);
assert.ok(allMissing.includes('Add an app name, an app icon, and a splash in'));
assert.ok(allMissing.includes('/dashboard/settings#store-branding'));
assert.doesNotMatch(allMissing, /cartaisy/i);
assertCalm(allMissing);

const splashMissing = html({
  appName: 'Northwind',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: null,
});
assert.equal(isDisabled(buttonTag(splashMissing, 'Build my app')), false);
assert.match(splashMissing, /src="https:\/\/cdn\.example\/icon\.png"/);
assert.equal(splashMissing.includes('splash.png'), false);
assert.ok(splashMissing.includes('Add a splash in'));
assert.ok(splashMissing.includes('Not added'));
assert.ok(splashMissing.includes('/dashboard/onboarding?step=brand'));
assertCalm(splashMissing);

const poisoned = html({
  appName: 'Northwind',
  iconUrl: 'https://cdn.example/icon.png?access_token=shpat_secret',
  splashUrl: 'http://cdn.example/splash.png',
});
assert.equal(isDisabled(buttonTag(poisoned, 'Build my app')), false);
assert.equal(poisoned.includes('shpat_'), false);
assert.equal(poisoned.includes('http://cdn.example'), false);
assert.equal(poisoned.includes('<img'), false);
assert.ok(poisoned.includes('Add an app icon and a splash in'));
assertCalm(poisoned);

const blobPreview = html({
  appName: 'Northwind',
  iconUrl: 'blob:http://localhost/preview',
  splashUrl: 'https://cdn.example/splash.png',
});
assert.equal(blobPreview.includes('blob:'), false);
assert.match(blobPreview, /src="https:\/\/cdn\.example\/splash\.png"/);
assert.ok(blobPreview.includes('Add an app icon in'));
assert.equal(isDisabled(buttonTag(blobPreview, 'Build my app')), false);
assertCalm(blobPreview);

const pendingLauncher = html({
  launcherPending: true,
  appName: 'Northwind',
  iconUrl: 'https://cdn.example/icon.png',
});
assert.ok(pendingLauncher.includes('Checking your app name, icon, and splash'));
assert.equal(pendingLauncher.includes('Northwind'), false);
assert.equal(pendingLauncher.includes('Not added'), false);
assert.equal(pendingLauncher.includes('<img'), false);
assert.equal(isDisabled(buttonTag(pendingLauncher, 'Build my app')), false);
assertCalm(pendingLauncher);

const statusWithAssets = html({
  mode: 'status',
  request: request('building', 'queued'),
  appName: 'Northwind',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: 'https://cdn.example/splash.png',
});
assert.equal(statusWithAssets.includes('>Build my app<'), false);
assert.ok(statusWithAssets.includes('Northwind'));
assert.match(statusWithAssets, /src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(statusWithAssets, /src="https:\/\/cdn\.example\/splash\.png"/);
assertCalm(statusWithAssets);

assert.equal(launcherThumbUrl('https://cdn.example/icon.png'), 'https://cdn.example/icon.png');
assert.equal(launcherThumbUrl('http://cdn.example/icon.png'), null);
assert.equal(launcherThumbUrl('blob:http://localhost/1'), null);
assert.equal(launcherThumbUrl('https://cdn.example/icon.png?token=shpss_secret'), null);
assert.equal(launcherThumbUrl(null), null);
assert.equal(launcherDisplayName('  Northwind  '), 'Northwind');
assert.equal(launcherDisplayName('   '), null);
assert.equal(launcherDisplayName(''), null);
assert.equal(launcherDisplayName(null), null);
assert.equal(launcherDisplayName(undefined), null);

const viewSource = readFileSync(join(here, '../../components/onboarding/BuildMyAppView.tsx'), 'utf8');
const panelSource = readFileSync(join(here, '../../components/onboarding/BuildMyAppPanel.tsx'), 'utf8');
const readySource = readFileSync(join(here, '../../components/onboarding/steps/ReadyStep.tsx'), 'utf8');
const stripSource = readFileSync(join(here, '../../components/onboarding/LauncherReadinessStrip.tsx'), 'utf8');
const settingsSource = readFileSync(join(here, '../../app/dashboard/settings/page.tsx'), 'utf8');

assert.match(viewSource, /canSubmit: android \|\| ios/);
assert.doesNotMatch(viewSource, /canSubmit:[\s\S]{0,120}iconUrl/);
assert.match(readySource, /appName: draft\.appName/);
assert.match(readySource, /iconUrl: draft\.iconUrl/);
assert.match(readySource, /splashUrl: draft\.splashUrl/);
assert.match(panelSource, /buildRequestAvailability/);
assert.match(panelSource, /launcherDisplayName\(branding\?\.appName\)/);
assert.match(panelSource, /launcherDisplayName\(profile\.name\)/);
assert.match(panelSource, /launcherDisplayName\(session\?\.user\?\.storeName\)/);
assert.doesNotMatch(panelSource, /shopDomain|myshopify/);
assert.match(settingsSource, /id="store-branding"/);
assert.doesNotMatch(stripSource, /cartaisy/i);
assert.doesNotMatch(stripSource, /Your app|clipboard|APP_NAME/);
assert.doesNotMatch(viewSource, /canSubmit:[\s\S]{0,120}appName/);
assert.doesNotMatch(stripSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(panelSource, /console\.(log|debug|info|error|warn)/);

console.log('build view ok');
