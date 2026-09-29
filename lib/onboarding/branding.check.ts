import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandColorControl } from '@/components/brand/BrandColorControl';
import {
  displayBrandImageUrl,
  drawableBrandImageUrl,
  fileFromDrawableLogo,
  USE_LOGO_AS_ICON_ERROR,
  USE_LOGO_AS_SPLASH_ERROR,
  IMAGE_LIMIT_MESSAGE,
  mergeStoredBrandAssets,
  persistedBrandImageUrl,
  readSignedUploadSignature,
  registerPayloadFromCloudinary,
} from '@/lib/onboarding/brandAssets';
import {
  DEFAULT_PRIMARY_COLOR,
  PLATFORM_DEFAULT_COLOR_LABEL,
  brandColorPatch,
  brandColorSelection,
  brandColorUsesPlatformDefault,
  brandingAssetRouteMissing,
  brandingFromPayload,
  emptyBrandingDraft,
  planBrandAssetSave,
} from '@/lib/onboarding/branding';

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

const brandingSave = planBrandAssetSave({
  ok: true,
  url: 'https://cdn.example/branding-icon.png',
  storedByBrandingApi: true,
  error: null,
});
assert.equal(brandingSave.persist, 'branding');
if (brandingSave.persist === 'branding') {
  assert.equal(brandingSave.url, 'https://cdn.example/branding-icon.png');
}

const aliasSave = planBrandAssetSave({
  ok: true,
  url: 'https://cdn.example/from-app-icon.png',
  storedByBrandingApi: true,
  error: null,
});
assert.equal(aliasSave.persist, 'branding');

const signedSave = planBrandAssetSave({
  ok: true,
  url: 'https://cdn.example/signed-icon.png',
  storedByBrandingApi: false,
  error: null,
});
assert.equal(signedSave.persist, 'dashboard');
if (signedSave.persist === 'dashboard') {
  assert.equal(signedSave.url, 'https://cdn.example/signed-icon.png');
}

const rejectedSave = planBrandAssetSave({
  ok: true,
  url: 'https://cdn.example/icon.png?access_token=shpat_secret',
  storedByBrandingApi: true,
  error: null,
});
assert.equal(rejectedSave.persist, 'none');

const failedSave = planBrandAssetSave({
  ok: false,
  url: null,
  storedByBrandingApi: false,
  error: 'We could not upload the app icon.',
});
assert.equal(failedSave.persist, 'none');
if (failedSave.persist === 'none') {
  assert.equal(failedSave.error, 'We could not upload the app icon.');
}

assert.equal(brandingAssetRouteMissing(404), true);
assert.equal(brandingAssetRouteMissing(405), true);
assert.equal(brandingAssetRouteMissing(501), true);
assert.equal(brandingAssetRouteMissing(400), false);
assert.equal(brandingAssetRouteMissing(200), false);
assert.equal(brandingAssetRouteMissing(500), false);

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

const cleared = brandingFromPayload(
  { data: { primaryColor: null, secondaryColor: null, appName: 'Harbor' } },
  'Fallback'
);
assert.equal(cleared.primaryExplicit, null);
assert.equal(cleared.secondaryExplicit, null);
assert.equal(cleared.primaryColor, DEFAULT_PRIMARY_COLOR);
assert.equal(cleared.secondaryColor, '');
assert.equal(brandColorSelection(cleared).primary, null);
assert.equal(brandColorSelection(cleared).secondary, null);
assert.equal(brandColorUsesPlatformDefault(cleared.primaryExplicit, cleared.primaryColor, 'primary'), true);

const missingColors = brandingFromPayload({ data: { appName: 'Harbor' } }, '');
assert.equal(missingColors.primaryExplicit, null);
assert.equal(missingColors.secondaryExplicit, null);
assert.equal(brandColorSelection(missingColors).primary, null);

const explicitDefault = brandingFromPayload(
  { data: { primaryColor: '#FF6B6B', secondaryColor: '#FFFFFF' } },
  ''
);
assert.equal(explicitDefault.primaryExplicit, '#FF6B6B');
assert.equal(explicitDefault.secondaryExplicit, '#FFFFFF');
assert.equal(
  brandColorUsesPlatformDefault(explicitDefault.primaryExplicit, explicitDefault.primaryColor, 'primary'),
  false
);
assert.notEqual(brandColorSelection(explicitDefault).primary, null);

const clearPrimary = brandColorPatch(
  { primary: null, secondary: '#112233' },
  { primary: '#0F766E', secondary: '#112233' }
);
assert.deepEqual(clearPrimary, { primaryColor: null });

const clearBoth = brandColorPatch(
  { primary: null, secondary: null },
  { primary: '#111111', secondary: '#222222' }
);
assert.deepEqual(clearBoth, { primaryColor: null, secondaryColor: null });
assert.equal(JSON.stringify(clearBoth), '{"primaryColor":null,"secondaryColor":null}');

assert.deepEqual(
  brandColorPatch({ primary: null, secondary: null }, { primary: null, secondary: null }),
  {}
);

assert.deepEqual(
  brandColorPatch({ primary: '#FF6B6B', secondary: null }, { primary: null, secondary: null }),
  { primaryColor: '#FF6B6B' }
);

const untouchedDefault = brandColorPatch(brandColorSelection(cleared), brandColorSelection(cleared));
assert.deepEqual(untouchedDefault, {});

const here = dirname(fileURLToPath(import.meta.url));
const settingsSource = readFileSync(join(here, '../../components/settings/StoreBrandingColors.tsx'), 'utf8');
const brandStepSource = readFileSync(join(here, '../../components/onboarding/steps/BrandingStep.tsx'), 'utf8');
const controlSource = readFileSync(join(here, '../../components/brand/BrandColorControl.tsx'), 'utf8');
const wizardSource = readFileSync(join(here, '../../components/onboarding/OnboardingWizard.tsx'), 'utf8');

assert.match(settingsSource, /primaryColor: null/);
assert.match(settingsSource, /secondaryColor: null/);
assert.match(settingsSource, /brandColorPatch/);
assert.match(brandStepSource, /primaryExplicit: null/);
assert.match(brandStepSource, /secondaryExplicit: null/);
assert.match(wizardSource, /brandColorPatch\(brandColorSelection\(draft\)/);
assert.equal(PLATFORM_DEFAULT_COLOR_LABEL, 'Using the platform default');
assert.match(controlSource, /PLATFORM_DEFAULT_COLOR_LABEL/);

const defaultSwatch = renderToStaticMarkup(
  createElement(BrandColorControl, {
    label: 'Primary color',
    value: DEFAULT_PRIMARY_COLOR,
    usingDefault: true,
    onChange: () => undefined,
    onClear: () => undefined,
  })
);
assert.match(defaultSwatch, /Using the platform default/);
assert.match(defaultSwatch, /Clear primary color/);
assert.match(defaultSwatch, /<button[^>]*\sdisabled(?:=|\s|>)/);
assert.match(defaultSwatch, /#FF6B6B/);
assert.doesNotMatch(defaultSwatch, /saved/i);

const customSwatch = renderToStaticMarkup(
  createElement(BrandColorControl, {
    label: 'Secondary color',
    value: '#112233',
    usingDefault: false,
    onChange: () => undefined,
    onClear: () => undefined,
  })
);
assert.doesNotMatch(customSwatch, /Using the platform default/);
assert.doesNotMatch(customSwatch, /<button[^>]*\sdisabled(?:=|\s|>)/);
assert.match(customSwatch, /#112233/);
assert.match(customSwatch, /Clear secondary color/);
assert.match(controlSource, />\s*Clear\s*</);
assert.doesNotMatch(settingsSource, /cartaisy/i);
assert.doesNotMatch(brandStepSource, /cartaisy/i);
assert.doesNotMatch(controlSource, /cartaisy/i);

assert.equal(drawableBrandImageUrl('https://cdn.example/logo.png'), 'https://cdn.example/logo.png');
assert.equal(drawableBrandImageUrl(' blob:http://localhost/logo '), 'blob:http://localhost/logo');
assert.equal(drawableBrandImageUrl('http://cdn.example/logo.png'), null);
assert.equal(drawableBrandImageUrl('https://cdn.example/logo.png?access_token=shpat_secret'), null);
assert.equal(drawableBrandImageUrl('https://cdn.example/shpat_logo.png'), null);
assert.equal(drawableBrandImageUrl('   '), null);
assert.equal(drawableBrandImageUrl(null), null);
assert.match(USE_LOGO_AS_ICON_ERROR, /Add an image for the app icon/);
assert.match(USE_LOGO_AS_SPLASH_ERROR, /Add an image for the splash/);
assert.notEqual(USE_LOGO_AS_ICON_ERROR, USE_LOGO_AS_SPLASH_ERROR);
assert.doesNotMatch(USE_LOGO_AS_SPLASH_ERROR, /https?:|splashUrl|iconUrl/);

const png = new Blob([Uint8Array.from([1, 2, 3, 4])], { type: 'image/png' });

async function checkLogoFile() {
  const copied = await fileFromDrawableLogo('https://cdn.example/logo.png', async () => new Response(png, { status: 200 }));
  assert.equal(copied?.type, 'image/png');
  assert.equal(copied?.name, 'logo.png');
  assert.equal(copied?.size, 4);

  const fromPath = await fileFromDrawableLogo(
    'https://cdn.example/logo.webp',
    async () => new Response(Uint8Array.from([9]), { status: 200, headers: { 'Content-Type': 'application/octet-stream' } })
  );
  assert.equal(fromPath?.type, 'image/webp');
  assert.equal(fromPath?.name, 'logo.webp');

  assert.equal(
    await fileFromDrawableLogo('https://cdn.example/logo.png', async () => new Response(png, { status: 404 })),
    null
  );
  assert.equal(
    await fileFromDrawableLogo('https://cdn.example/logo.png', async () => {
      throw new Error('cors');
    }),
    null
  );
  assert.equal(
    await fileFromDrawableLogo(
      'https://cdn.example/logo.png',
      async () => new Response('<html></html>', { status: 200, headers: { 'Content-Type': 'text/html' } })
    ),
    null
  );

  let fetchedIneligible = false;
  assert.equal(
    await fileFromDrawableLogo('http://cdn.example/logo.png', async () => {
      fetchedIneligible = true;
      return new Response(png, { status: 200 });
    }),
    null
  );
  assert.equal(fetchedIneligible, false);
  assert.equal(
    await fileFromDrawableLogo('https://cdn.example/logo.png?access_token=shpat_secret', async () => new Response(png)),
    null
  );
}

checkLogoFile()
  .then(() => {
    console.log('branding check ok');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
