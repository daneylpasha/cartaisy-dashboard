import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APPLE_INVALID_MESSAGE,
  APPLE_NEEDS_ATTENTION_MESSAGE,
  CREDENTIAL_FILE_TOO_LARGE_MESSAGE,
  CREDENTIAL_SAVE_FAILED_MESSAGE,
  CREDENTIAL_SIGN_IN_MESSAGE,
  GOOGLE_INVALID_MESSAGE,
  GOOGLE_NEEDS_ATTENTION_MESSAGE,
  appleSubmissionError,
  canDisconnectCredential,
  containsCredentialSecret,
  credentialFormOpen,
  formatCredentialUpdatedAt,
  googleSubmissionError,
  messageForCredentialFailure,
  normalizeStoreCredentials,
  safeCredentialFileName,
} from './contract.ts';

const here = dirname(fileURLToPath(import.meta.url));
const pem = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';

const connected = normalizeStoreCredentials({
  success: true,
  data: {
    apple: {
      status: 'connected',
      keyIdLast4: '34EF',
      issuerIdLast4: '072a',
      updatedAt: '2026-09-28T18:00:00.000Z',
      privateKey: pem,
    },
    google: {
      status: 'connected',
      clientEmail: 'play-submit@example-store.iam.gserviceaccount.com',
      privateKeyIdLast4: 'abcd',
      updatedAt: '2026-09-28T18:00:00.000Z',
      serviceAccount: { private_key: pem },
    },
  },
});

assert.ok(connected);
assert.equal(connected.apple.status, 'connected');
assert.equal(connected.apple.keyIdLast4, '34EF');
assert.equal(connected.apple.issuerIdLast4, '072a');
assert.equal(connected.apple.message, null);
assert.equal(connected.google.clientEmail, 'play-submit@example-store.iam.gserviceaccount.com');
assert.equal(connected.google.privateKeyIdLast4, 'abcd');
assert.equal(JSON.stringify(connected).includes('PRIVATE KEY'), false);
assert.equal(JSON.stringify(connected).includes('private_key'), false);
assert.equal(formatCredentialUpdatedAt(connected.apple.updatedAt), 'Saved Sep 28, 2026');

const missing = normalizeStoreCredentials({
  success: true,
  data: { apple: { status: 'missing' }, google: { status: 'missing' } },
});
assert.deepEqual(missing?.apple.status, 'missing');
assert.equal(missing?.apple.keyIdLast4, null);
assert.equal(credentialFormOpen('missing', false), true);
assert.equal(canDisconnectCredential('missing'), false);

const attention = normalizeStoreCredentials({
  apple: {
    status: 'needsAttention',
    keyIdLast4: '34EF',
    message: `${APPLE_NEEDS_ATTENTION_MESSAGE} ${pem}`,
  },
  google: {
    status: 'needsAttention',
    clientEmail: `play@example.com ${pem}`,
    message: 'echoed secret',
  },
});
assert.equal(attention?.apple.status, 'needsAttention');
assert.equal(attention?.apple.message, APPLE_NEEDS_ATTENTION_MESSAGE);
assert.equal(attention?.apple.keyIdLast4, '34EF');
assert.equal(attention?.google.message, GOOGLE_NEEDS_ATTENTION_MESSAGE);
assert.equal(attention?.google.clientEmail, null);
assert.equal(credentialFormOpen('needsAttention', false), true);
assert.equal(canDisconnectCredential('needsAttention'), true);
assert.equal(credentialFormOpen('connected', false), false);
assert.equal(credentialFormOpen('connected', true), true);

assert.equal(normalizeStoreCredentials({ apple: { status: 'weird' }, google: {} })?.apple.status, 'missing');
assert.equal(normalizeStoreCredentials({ ok: true }), null);

assert.equal(
  appleSubmissionError({ keyId: '', issuerId: '', file: null }),
  'Add the Key ID, the Issuer ID, and the App Store Connect API key (.p8).'
);
assert.equal(
  appleSubmissionError({
    keyId: 'short',
    issuerId: 'not-a-uuid',
    file: { name: 'AuthKey.p8', size: 120 },
  }),
  APPLE_INVALID_MESSAGE
);
assert.equal(
  appleSubmissionError({
    keyId: 'AB12CD34EF',
    issuerId: '12345678-1234-1234-1234-12345678072a',
    file: { name: 'key.txt', size: 120 },
  }),
  APPLE_INVALID_MESSAGE
);
assert.equal(
  appleSubmissionError({
    keyId: 'AB12CD34EF',
    issuerId: '12345678-1234-1234-1234-12345678072a',
    file: { name: 'AuthKey.p8', size: 70_000 },
  }),
  CREDENTIAL_FILE_TOO_LARGE_MESSAGE
);
assert.equal(
  appleSubmissionError({
    keyId: 'AB12CD34EF',
    issuerId: '12345678-1234-1234-1234-12345678072a',
    file: { name: 'AuthKey.P8', size: 200 },
  }),
  null
);
assert.equal(googleSubmissionError(null), 'Upload the Google Play service account JSON file.');
assert.equal(googleSubmissionError({ name: 'play.json', size: 400 }), null);
assert.equal(googleSubmissionError({ name: 'play.p8', size: 400 }), GOOGLE_INVALID_MESSAGE);

assert.equal(messageForCredentialFailure(401, { error: pem }, 'save', 'apple'), CREDENTIAL_SIGN_IN_MESSAGE);
assert.equal(
  messageForCredentialFailure(400, { error: pem, code: 'STORE_CREDENTIALS_INVALID' }, 'save', 'apple'),
  APPLE_INVALID_MESSAGE
);
assert.equal(
  messageForCredentialFailure(400, { error: APPLE_INVALID_MESSAGE, code: 'STORE_CREDENTIALS_INVALID' }, 'save', 'apple'),
  APPLE_INVALID_MESSAGE
);
assert.equal(messageForCredentialFailure(500, { error: pem }, 'save', 'google'), CREDENTIAL_SAVE_FAILED_MESSAGE);
assert.equal(containsCredentialSecret(pem), true);
assert.equal(safeCredentialFileName(`Auth${pem}.p8`), 'Selected file');
assert.equal(safeCredentialFileName('folder/AuthKey_AB12CD34EF.p8'), 'AuthKey_AB12CD34EF.p8');

const clientSource = readFileSync(join(here, 'client.ts'), 'utf8');
const viewSource = readFileSync(join(here, '../../components/build/StoreCredentialsView.tsx'), 'utf8');
const panelSource = readFileSync(join(here, '../../components/build/StoreCredentialsPanel.tsx'), 'utf8');
for (const source of [clientSource, viewSource, panelSource]) {
  assert.equal(source.includes('console.'), false);
  assert.equal(source.includes('FileReader'), false);
  assert.equal(source.includes('captureException'), false);
  assert.equal(source.includes('sonner'), false);
  assert.equal(source.includes('/admin/store-credentials'), false);
}
assert.equal(clientSource.includes('.text()'), false);
assert.equal(clientSource.includes('JSON.parse'), false);
assert.equal(viewSource.includes('eligibleForBuild'), false);
assert.equal(panelSource.includes('eligibleForBuild'), false);

console.log('store credentials contract ok');
