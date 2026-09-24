import assert from 'node:assert/strict';
import {
  displayBrandImageUrl,
  mergeStoredBrandAssets,
  persistedBrandImageUrl,
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

console.log('branding check ok');
