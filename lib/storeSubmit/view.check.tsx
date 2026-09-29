import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BuildMyAppView, type BuildMyAppViewProps, type StoreSubmitBindings } from '../../components/onboarding/BuildMyAppView.tsx';
import {
  StoreSubmitSettingsView,
  type StoreSubmitSettingsViewProps,
} from '../../components/build/StoreSubmitSettingsView.tsx';
import type { BuildRequest } from '../build/contract.ts';
import { EMPTY_STORE_SUBMITS, type StoreSubmitJob } from './contract.ts';
import type { StoreCredentialsStatus } from '../storeCredentials/contract.ts';

const here = dirname(fileURLToPath(import.meta.url));
const noop = () => {};
const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const JOB_ID = '66f1c2e0a1b2c3d4e5f60720';
const INSTALL = 'https://expo.dev/accounts/northwind/builds/android';

const eligible = { enabled: true, reason: null, action: null } as const;

const base: BuildMyAppViewProps = {
  phase: 'ready',
  loadError: null,
  availability: eligible,
  mode: 'status',
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

const connected: StoreCredentialsStatus = {
  apple: {
    status: 'connected',
    keyIdLast4: '34EF',
    issuerIdLast4: '072a',
    updatedAt: '2026-09-28T18:00:00.000Z',
    message: null,
  },
  google: {
    status: 'connected',
    clientEmail: 'play@example.iam.gserviceaccount.com',
    privateKeyIdLast4: 'abcd',
    updatedAt: '2026-09-28T18:00:00.000Z',
    message: null,
  },
};

function request(
  android: BuildRequest['platforms']['android']['status'],
  ios: BuildRequest['platforms']['ios']['status'],
  urls?: { android?: string | null; ios?: string | null }
): BuildRequest {
  return {
    id: REQUEST_ID,
    platforms: {
      android: { status: android, installUrl: urls?.android ?? null },
      ios: { status: ios, installUrl: urls?.ios ?? null },
    },
    accessNotes: null,
  };
}

function submitJob(platform: 'ios' | 'android', status: StoreSubmitJob['status'], message: string | null = null): StoreSubmitJob {
  return {
    id: JOB_ID,
    buildRequestId: REQUEST_ID,
    platform,
    status,
    createdAt: '2026-09-28T20:00:00.000Z',
    updatedAt: '2026-09-28T20:00:00.000Z',
    message,
  };
}

function bindings(overrides: Partial<StoreSubmitBindings> = {}): StoreSubmitBindings {
  return {
    credentialPhase: 'ready',
    credentials: connected,
    jobs: EMPTY_STORE_SUBMITS,
    busy: { android: false, ios: false },
    errors: { android: null, ios: null },
    onSubmit: noop,
    ...overrides,
  };
}

function html(overrides: Partial<BuildMyAppViewProps> = {}): string {
  return renderToStaticMarkup(createElement(BuildMyAppView, { ...base, ...overrides }));
}

function buttonTag(markup: string, label: string): string {
  const match = markup.match(new RegExp(`<button[^>]*>${label}</button>`));
  assert.ok(match, `missing button ${label}`);
  return match?.[0] ?? '';
}

function isDisabled(tag: string): boolean {
  return / disabled(?:=|>|\s)/.test(tag);
}

const forbidden = ['EAS', 'BEGIN PRIVATE', 'private_key', 'shpat_', REQUEST_ID, JOB_ID, 'easBuildId', 'accessToken'];

function assertCalm(markup: string) {
  for (const word of forbidden) {
    assert.equal(markup.includes(word), false, `screen leaked ${word}`);
  }
  assert.doesNotMatch(markup, /cartaisy/i);
}

const readyBoth = html({
  request: request('ready', 'ready', { android: INSTALL, ios: 'https://u.expo.dev/artifact/ios' }),
  storeSubmit: bindings(),
});
assert.equal(isDisabled(buttonTag(readyBoth, 'Submit to Play')), false);
assert.equal(isDisabled(buttonTag(readyBoth, 'Submit to App Store')), false);
assert.ok(readyBoth.includes('Install Android build'));
assert.ok(readyBoth.includes('Install iOS build'));
assert.ok(readyBoth.includes(`href="${INSTALL}"`));
assert.equal((readyBoth.match(/target="_blank"/g) ?? []).length, 4);
assert.ok(readyBoth.includes('data-submit="android"'));
assert.ok(readyBoth.includes('data-submit-state="idle"'));
assertCalm(readyBoth);

const missingAccounts = html({
  request: request('ready', 'ready', { android: INSTALL }),
  storeSubmit: bindings({
    credentials: {
      apple: { ...connected.apple, status: 'missing', keyIdLast4: null, issuerIdLast4: null },
      google: { ...connected.google, status: 'needsAttention' },
    },
  }),
});
assert.equal(missingAccounts.includes('>Submit to Play<'), false);
assert.equal(missingAccounts.includes('>Submit to App Store<'), false);
assert.equal(missingAccounts.includes('Connect account'), false);
assert.ok(missingAccounts.includes('Connect Apple Developer'));
assert.ok(missingAccounts.includes('Connect Google Play'));
assert.ok(missingAccounts.includes('href="#apple-store-account"'));
assert.ok(missingAccounts.includes('href="#google-store-account"'));
assert.ok(missingAccounts.includes('Upload the Google Play service account JSON again before submitting.'));
assert.ok(missingAccounts.includes('Connect an App Store Connect API key before submitting to the App Store.'));
assert.ok(missingAccounts.includes('Install Android build'));
assert.ok(missingAccounts.includes(`href="${INSTALL}"`));
assert.equal(missingAccounts.includes('>Build my app<'), false);
assertCalm(missingAccounts);

const composeStillBuilds = html({
  mode: 'compose',
  request: request('ready', 'ready', { android: INSTALL }),
  storeSubmit: bindings({
    credentials: {
      apple: { ...connected.apple, status: 'missing' },
      google: { ...connected.google, status: 'missing' },
    },
  }),
});
assert.equal(isDisabled(buttonTag(composeStillBuilds, 'Build my app')), false);
assert.equal(composeStillBuilds.includes('Submit to App Store'), false);
assert.equal(composeStillBuilds.includes('Submit to Play'), false);
assert.equal(composeStillBuilds.includes('Connect Apple Developer'), false);
assert.equal(composeStillBuilds.includes('Connect Google Play'), false);
assert.equal(composeStillBuilds.includes('Install Android build'), false);
assertCalm(composeStillBuilds);

const building = html({
  request: request('building', 'not_requested'),
  storeSubmit: bindings(),
});
assert.equal(isDisabled(buttonTag(building, 'Submit to Play')), true);
assert.ok(building.includes('This build needs to finish before it can be submitted.'));
assert.equal(building.includes('Submit to App Store'), false);
assert.equal(building.includes('Install Android build'), false);
assert.equal(building.includes('data-submit="ios"'), false);
assertCalm(building);

const submitted = html({
  request: request('not_requested', 'ready'),
  storeSubmit: bindings({ jobs: { android: null, ios: submitJob('ios', 'submitted') } }),
});
assert.ok(submitted.includes('Sent to App Store Connect'));
assert.ok(submitted.includes('Check App Store Connect for the review.'));
assert.ok(submitted.includes('day or two'));
assert.ok(submitted.includes('data-submit-outcome="submitted"'));
assert.equal(submitted.includes('https://'), false);
assert.equal(isDisabled(buttonTag(submitted, 'Submit again')), false);
assert.equal(submitted.includes('Connect Apple Developer'), false);
assert.ok(submitted.includes('data-submit-state="submitted"'));
assert.equal(submitted.includes('Submit to Play'), false);
assertCalm(submitted);

const failed = html({
  request: request('ready', 'not_requested'),
  storeSubmit: bindings({
    jobs: {
      android: submitJob('android', 'failed', 'The store did not accept this build. Check the store listing, then try again.'),
      ios: null,
    },
  }),
});
assert.ok(failed.includes('This submit did not finish'));
assert.ok(failed.includes('The store did not accept this build. Check the store listing, then try again.'));
assert.ok(failed.includes('data-submit-outcome="failed"'));
assert.equal(isDisabled(buttonTag(failed, 'Submit again')), false);
assert.ok(failed.includes('Play Console') === false);
assert.ok(failed.includes('data-submit-state="failed"'));
assertCalm(failed);

const poisonedMessage = html({
  request: request('ready', 'not_requested'),
  storeSubmit: bindings({
    errors: { android: '-----BEGIN PRIVATE KEY-----', ios: null },
  }),
});
assert.equal(poisonedMessage.includes('BEGIN PRIVATE'), false);
assert.ok(poisonedMessage.includes('Submit to Play'));
assertCalm(poisonedMessage);

const submitting = html({
  request: request('ready', 'not_requested'),
  storeSubmit: bindings({ jobs: { android: submitJob('android', 'submitting'), ios: null } }),
});
assert.ok(submitting.includes('Sending this build to Google Play.'));
assert.ok(submitting.includes('data-submit-outcome="progress"'));
assert.equal(submitting.includes('data-submit-outcome="submitted"'), false);
assert.ok(submitting.includes('This page updates on its own.'));
assert.equal(isDisabled(buttonTag(submitting, 'Submitting...')), true);
assert.ok(submitting.includes('aria-busy="true"'));
assert.ok(submitting.includes('Install Android build') === false);
assert.equal(submitting.includes('Connect Google Play'), false);
assertCalm(submitting);

const submittingMissing = html({
  request: request('ready', 'not_requested'),
  storeSubmit: bindings({
    credentials: {
      ...connected,
      google: { ...connected.google, status: 'missing' },
    },
    jobs: { android: submitJob('android', 'submitting'), ios: null },
  }),
});
assert.equal(isDisabled(buttonTag(submittingMissing, 'Submitting...')), true);
assert.ok(submittingMissing.includes('data-submit-outcome="progress"'));
assert.equal(submittingMissing.includes('Connect Google Play'), false);
assertCalm(submittingMissing);

const failedNeedsAccount = html({
  request: request('ready', 'not_requested'),
  storeSubmit: bindings({
    credentials: {
      ...connected,
      google: { ...connected.google, status: 'needsAttention' },
    },
    jobs: {
      android: submitJob('android', 'failed', 'The store did not accept this build. Check the store listing, then try again.'),
      ios: null,
    },
  }),
});
assert.ok(failedNeedsAccount.includes('This submit did not finish'));
assert.ok(failedNeedsAccount.includes('The store did not accept this build. Check the store listing, then try again.'));
assert.ok(failedNeedsAccount.includes('data-submit-outcome="failed"'));
assert.equal(failedNeedsAccount.includes('>Submit again<'), false);
assert.ok(failedNeedsAccount.includes('Connect Google Play'));
assert.ok(failedNeedsAccount.includes('href="#google-store-account"'));
assert.ok(failedNeedsAccount.includes('Upload the Google Play service account JSON again before submitting.'));
assertCalm(failedNeedsAccount);

const settingsBase: StoreSubmitSettingsViewProps = {
  phase: 'ready',
  request: null,
  credentialPhase: 'ready',
  credentials: connected,
  jobs: EMPTY_STORE_SUBMITS,
  busy: { android: false, ios: false },
  errors: { android: null, ios: null },
  onSubmit: noop,
  onRetry: noop,
};

function settings(overrides: Partial<StoreSubmitSettingsViewProps> = {}): string {
  return renderToStaticMarkup(createElement(StoreSubmitSettingsView, { ...settingsBase, ...overrides }));
}

const settingsEmpty = settings();
assert.ok(settingsEmpty.includes('When a build is ready, you can submit it here.'));
assert.equal(settingsEmpty.includes('Submit to App Store'), false);
assert.ok(settingsEmpty.includes('Preview and install links stay available either way.'));
assertCalm(settingsEmpty);

const settingsReady = settings({
  request: request('ready', 'building'),
  credentials: {
    ...connected,
    google: { ...connected.google, status: 'missing' },
  },
});
assert.equal(settingsReady.includes('>Submit to Play<'), false);
assert.equal(isDisabled(buttonTag(settingsReady, 'Submit to App Store')), true);
assert.ok(settingsReady.includes('Connect Google Play'));
assert.ok(settingsReady.includes('href="#google-store-account"'));
assert.equal(settingsReady.includes('Connect Apple Developer'), false);
assert.ok(settingsReady.includes('Connect a Google Play service account before submitting to Play.'));
assert.ok(settingsReady.includes('This build needs to finish before it can be submitted.'));
assert.ok(settingsReady.includes('data-store-submit="settings"'));
assertCalm(settingsReady);

const settingsSubmitted = settings({
  request: request('ready', 'not_requested'),
  jobs: { android: submitJob('android', 'submitted'), ios: null },
});
assert.ok(settingsSubmitted.includes('Sent to Google Play'));
assert.ok(settingsSubmitted.includes('Check Play Console for the review'));
assert.ok(settingsSubmitted.includes('internal testing track'));
assert.ok(settingsSubmitted.includes('data-submit-outcome="submitted"'));
assert.equal(settingsSubmitted.includes('https://'), false);
assert.equal(isDisabled(buttonTag(settingsSubmitted, 'Submit again')), false);
assert.equal(settingsSubmitted.includes('Connect Google Play'), false);
assertCalm(settingsSubmitted);

const viewSource = readFileSync(join(here, '../../components/onboarding/BuildMyAppView.tsx'), 'utf8');
const panelSource = readFileSync(join(here, '../../components/onboarding/BuildMyAppPanel.tsx'), 'utf8');
const readySource = readFileSync(join(here, '../../components/onboarding/steps/ReadyStep.tsx'), 'utf8');
const credentialsSource = readFileSync(join(here, '../../components/build/StoreCredentialsPanel.tsx'), 'utf8');
const settingsPage = readFileSync(join(here, '../../app/dashboard/settings/page.tsx'), 'utf8');

assert.match(panelSource, /useStoreSubmits/);
assert.match(panelSource, /storeSubmit=/);
assert.match(viewSource, /StoreSubmitControl/);
assert.doesNotMatch(viewSource, /easBuildId|privateKey|private_key|EXPO_TOKEN/);
assert.doesNotMatch(panelSource, /console\.(log|debug|info|error|warn)/);
assert.ok(readySource.indexOf('<BuildMyAppPanel') < readySource.indexOf('<StoreCredentialsPanel'));
assert.match(credentialsSource, /surface === 'settings'/);
assert.match(credentialsSource, /StoreSubmitSettings/);
assert.match(settingsPage, /id="build-setup"/);
assert.match(settingsPage, /StoreCredentialsPanel/);
assert.equal(viewSource.includes('storeId'), false);

console.log('store submit view ok');
