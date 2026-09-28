import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  StoreCredentialsView,
  emptyAppleForm,
  emptyGoogleForm,
  type StoreCredentialsViewProps,
} from '../../components/build/StoreCredentialsView.tsx';
import {
  APPLE_NEEDS_ATTENTION_MESSAGE,
  CREDENTIALS_HELPER,
  GOOGLE_NEEDS_ATTENTION_MESSAGE,
  type StoreCredentialsStatus,
} from './contract.ts';

const here = dirname(fileURLToPath(import.meta.url));
const noop = () => {};

const base: StoreCredentialsViewProps = {
  surface: 'build',
  phase: 'ready',
  loadError: null,
  credentials: {
    apple: { status: 'missing', keyIdLast4: null, issuerIdLast4: null, updatedAt: null, message: null },
    google: { status: 'missing', clientEmail: null, privateKeyIdLast4: null, updatedAt: null, message: null },
  },
  apple: emptyAppleForm(),
  google: emptyGoogleForm(),
  onRetry: noop,
  onAppleKeyId: noop,
  onAppleIssuerId: noop,
  onAppleFile: noop,
  onAppleSubmit: noop,
  onAppleReplace: noop,
  onAppleCancelReplace: noop,
  onAppleAskDisconnect: noop,
  onAppleConfirmDisconnect: noop,
  onAppleCancelDisconnect: noop,
  onGoogleFile: noop,
  onGoogleSubmit: noop,
  onGoogleReplace: noop,
  onGoogleCancelReplace: noop,
  onGoogleAskDisconnect: noop,
  onGoogleConfirmDisconnect: noop,
  onGoogleCancelDisconnect: noop,
};

function html(overrides: Partial<StoreCredentialsViewProps>): string {
  return renderToStaticMarkup(createElement(StoreCredentialsView, { ...base, ...overrides }));
}

const forbidden = ['Cartaisy', 'EAS', 'shpat_', 'BEGIN PRIVATE KEY', 'private_key', 'EXPO_TOKEN', 'ciphertext'];

function assertCalm(markup: string) {
  for (const word of forbidden) {
    assert.equal(markup.includes(word), false, `screen leaked ${word}`);
  }
}

const missing = html({});
assertCalm(missing);
assert.ok(missing.includes(CREDENTIALS_HELPER));
assert.ok(missing.includes('Preview, Build my app, and install links stay available either way.'));
assert.ok(missing.includes('href="/dashboard/settings#build-setup"'));
assert.ok(missing.includes('Connect Apple'));
assert.ok(missing.includes('Connect Google Play'));
assert.ok(missing.includes('id="apple-private-key"'));
assert.ok(missing.includes('accept=".p8"'));
assert.ok(missing.includes('id="google-service-account"'));
assert.ok(missing.includes('accept=".json,application/json"'));
assert.equal(missing.includes('>Disconnect<'), false);
assert.equal(missing.includes('<form'), false);

const connectedCredentials: StoreCredentialsStatus = {
  apple: {
    status: 'connected',
    keyIdLast4: '34EF',
    issuerIdLast4: '072a',
    updatedAt: '2026-09-28T18:00:00.000Z',
    message: null,
  },
  google: {
    status: 'connected',
    clientEmail: 'play-submit@example-store.iam.gserviceaccount.com',
    privateKeyIdLast4: 'abcd',
    updatedAt: '2026-09-28T18:00:00.000Z',
    message: null,
  },
};

const connected = html({
  surface: 'settings',
  credentials: connectedCredentials,
});
assertCalm(connected);
assert.ok(connected.includes('Key ID ending in 34EF'));
assert.ok(connected.includes('Issuer ID ending in 072a'));
assert.ok(connected.includes('play-submit@example-store.iam.gserviceaccount.com'));
assert.ok(connected.includes('Key ID ending in abcd'));
assert.ok(connected.includes('Saved Sep 28, 2026'));
assert.ok(connected.includes('href="/dashboard/onboarding?step=ready"'));
assert.ok(connected.includes('Replace key'));
assert.ok(connected.includes('Replace JSON'));
assert.ok(connected.includes('>Disconnect<'));
assert.equal(connected.includes('id="apple-private-key"'), false);
assert.equal(connected.includes('id="google-service-account"'), false);
assert.equal(connected.includes('>Connect Apple<'), false);

const attention = html({
  credentials: {
    apple: {
      status: 'needsAttention',
      keyIdLast4: '34EF',
      issuerIdLast4: '072a',
      updatedAt: null,
      message: APPLE_NEEDS_ATTENTION_MESSAGE,
    },
    google: {
      status: 'needsAttention',
      clientEmail: 'play-submit@example-store.iam.gserviceaccount.com',
      privateKeyIdLast4: null,
      updatedAt: null,
      message: GOOGLE_NEEDS_ATTENTION_MESSAGE,
    },
  },
});
assertCalm(attention);
assert.ok(attention.includes(APPLE_NEEDS_ATTENTION_MESSAGE));
assert.ok(attention.includes(GOOGLE_NEEDS_ATTENTION_MESSAGE));
assert.ok(attention.includes('id="apple-private-key"'));
assert.ok(attention.includes('id="google-service-account"'));
assert.ok(attention.includes('Key ID ending in 34EF'));
assert.ok(attention.includes('>Disconnect<'));

const replacing = html({
  credentials: connectedCredentials,
  apple: { ...emptyAppleForm(), open: true, fileName: 'AuthKey_AB12CD34EF.p8' },
});
assertCalm(replacing);
assert.ok(replacing.includes('id="apple-private-key"'));
assert.ok(replacing.includes('AuthKey_AB12CD34EF.p8'));
assert.ok(replacing.includes('>Connect Apple<'));
assert.equal(replacing.includes('id="google-service-account"'), false);

const poisoned = html({
  credentials: connectedCredentials,
  apple: { ...emptyAppleForm(), open: true, fileName: '-----BEGIN PRIVATE KEY-----.p8' },
});
assert.ok(poisoned.includes('Selected file'));
assert.equal(poisoned.includes('BEGIN PRIVATE KEY'), false);

const loadError = html({ phase: 'error', loadError: 'Sign in again to connect your store accounts.', credentials: null });
assertCalm(loadError);
assert.ok(loadError.includes('Sign in again to connect your store accounts.'));
assert.ok(loadError.includes('>Try again<'));
assert.equal(loadError.includes('Connect Apple'), false);

const loading = html({ phase: 'loading', credentials: null });
assert.ok(loading.includes('Loading store accounts...'));
assert.ok(loading.includes('aria-busy="true"'));

const readySource = readFileSync(join(here, '../../components/onboarding/steps/ReadyStep.tsx'), 'utf8');
const settingsSource = readFileSync(join(here, '../../app/dashboard/settings/page.tsx'), 'utf8');
const buildSource = readFileSync(join(here, '../../components/onboarding/BuildMyAppView.tsx'), 'utf8');
assert.ok(readySource.includes('StoreCredentialsPanel'));
assert.ok(readySource.includes('BuildMyAppPanel'));
assert.ok(readySource.indexOf('<BuildMyAppPanel') < readySource.indexOf('<StoreCredentialsPanel'));
assert.ok(settingsSource.includes('id="build-setup"'));
assert.ok(settingsSource.includes('StoreCredentialsPanel'));
assert.equal(buildSource.includes('store-credentials'), false);
assert.equal(buildSource.includes('StoreCredentials'), false);

console.log('store credentials view ok');
