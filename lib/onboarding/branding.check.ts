import assert from 'node:assert/strict';
import {
  displayBrandImageUrl,
  IMAGE_LIMIT_MESSAGE,
  mergeStoredBrandAssets,
  persistedBrandImageUrl,
  readSignedUploadSignature,
  registerPayloadFromCloudinary,
} from '@/lib/onboarding/brandAssets';
import { brandingFromPayload, emptyBrandingDraft } from '@/lib/onboarding/branding';

const parsed = brandingFromPayload(
  {
    data: {
      logoUrl: 'https://cdn.example/logo.png',
      primaryColor: '#112233',
      appIconUrl: 'https://cdn.example/icon.png',
      splashImageUrl: 'https://cdn.example/splash.png',
    },
  },
  'Northwind'
);
assert.equal(parsed.appName, 'Northwind');
assert.equal(parsed.iconUrl, 'https://cdn.example/icon.png');
assert.equal(parsed.splashUrl, 'https://cdn.example/splash.png');
assert.equal(parsed.iconPersisted, true);
assert.equal(parsed.splashPersisted, true);

const aliases = brandingFromPayload(
  { iconUrl: 'https://cdn.example/icon-alias.png', splashUrl: 'https://cdn.example/splash-alias.png' },
  ''
);
assert.equal(aliases.iconUrl, 'https://cdn.example/icon-alias.png');
assert.equal(aliases.splashUrl, 'https://cdn.example/splash-alias.png');

const poisoned = brandingFromPayload(
  {
    data: {
      iconUrl: 'https://cdn.example/icon.png?access_token=shpat_secret',
      splashUrl: 'https://cdn.example/splash.png?token=shpss_secret',
      logoUrl: 'https://cdn.example/logo.png?shpca_secret',
    },
  },
  'Northwind'
);
assert.equal(poisoned.iconUrl, null);
assert.equal(poisoned.splashUrl, null);
assert.equal(poisoned.logoUrl, null);

assert.equal(persistedBrandImageUrl('https://cdn.example/icon.png'), 'https://cdn.example/icon.png');
assert.equal(persistedBrandImageUrl('http://cdn.example/icon.png'), null);
assert.equal(persistedBrandImageUrl('blob:http://localhost/1'), null);
assert.equal(persistedBrandImageUrl('https://cdn.example/shpat_abc'), null);
assert.equal(displayBrandImageUrl('blob:http://localhost/1'), 'blob:http://localhost/1');

const storedOnly = mergeStoredBrandAssets(emptyBrandingDraft('Harbor'), {
  iconUrl: 'https://cdn.example/stored-icon.png',
  splashUrl: 'https://cdn.example/stored-splash.png',
});
assert.equal(storedOnly.iconUrl, 'https://cdn.example/stored-icon.png');
assert.equal(storedOnly.splashUrl, 'https://cdn.example/stored-splash.png');
assert.equal(storedOnly.iconPersisted, true);

const apiWins = mergeStoredBrandAssets(parsed, {
  iconUrl: 'https://cdn.example/stored-icon.png',
  splashUrl: null,
});
assert.equal(apiWins.iconUrl, 'https://cdn.example/icon.png');
assert.equal(apiWins.splashUrl, 'https://cdn.example/splash.png');

const quota = readSignedUploadSignature({
  canUpload: false,
  signature: 'sig',
  timestamp: 10,
  cloudName: 'cloud',
  apiKey: 'public-key',
  folder: 'stores/1/notifications',
});
assert.equal(quota.ok, false);
if (!quota.ok) assert.equal(quota.reason, 'quota');

const missingFlag = readSignedUploadSignature({
  signature: 'sig',
  timestamp: 10,
  cloudName: 'cloud',
  apiKey: 'public-key',
  folder: 'stores/1/notifications',
});
assert.equal(missingFlag.ok, false);
if (!missingFlag.ok) assert.equal(missingFlag.reason, 'invalid');

const allowed = readSignedUploadSignature({
  canUpload: true,
  signature: 'sig',
  timestamp: 10,
  cloudName: 'cloud',
  apiKey: 'public-key',
  folder: 'stores/1/notifications',
});
assert.equal(allowed.ok, true);

const stringTimestamp = readSignedUploadSignature({
  canUpload: true,
  signature: 'sig',
  timestamp: '10',
  cloudName: 'cloud',
  apiKey: 'public-key',
  folder: 'stores/1/notifications',
});
assert.equal(stringTimestamp.ok, true);
if (stringTimestamp.ok) assert.equal(stringTimestamp.credentials.timestamp, 10);

const registration = registerPayloadFromCloudinary({
  public_id: 'stores/1/notifications/icon',
  url: 'http://res.cloudinary.com/cloud/image/upload/icon.png',
  secure_url: 'https://res.cloudinary.com/cloud/image/upload/icon.png',
  bytes: 1200,
  width: 64,
  height: 64,
  format: 'png',
});
assert.equal(registration?.publicId, 'stores/1/notifications/icon');
assert.equal(registration?.secureUrl, 'https://res.cloudinary.com/cloud/image/upload/icon.png');
assert.equal(registration?.size, 1200);
assert.ok(IMAGE_LIMIT_MESSAGE.length > 0);

assert.equal(
  registerPayloadFromCloudinary({
    public_id: 'stores/1/notifications/icon',
    url: 'http://cdn.example/icon.png?access_token=shpat_secret',
    secure_url: 'https://cdn.example/icon.png',
    bytes: 10,
  }),
  null
);
assert.equal(
  registerPayloadFromCloudinary({
    public_id: 'stores/1/notifications/icon',
    url: 'http://cdn.example/icon.png',
    secure_url: 'http://cdn.example/icon.png',
    bytes: 10,
  }),
  null
);

console.log('branding check ok');
