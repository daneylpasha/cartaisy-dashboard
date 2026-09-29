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
  BRAND_IMAGE_SIZE_GUIDE,
  DEFAULT_PRIMARY_COLOR,
  PLATFORM_DEFAULT_COLOR_LABEL,
  acceptBrandImageFile,
  brandColorPatch,
  brandColorSelection,
  brandColorUsesPlatformDefault,
  brandingAssetRouteMissing,
  brandingFromPayload,
  emptyBrandingDraft,
  planBrandAssetSave,
  readBrandImageSize,
  validateBrandImage,
  validateBrandImageDimensions,
  validateBrandImageFile,
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

function pixels(width: number, height: number) {
  return { width, height };
}

function expectReject(kind: 'logo' | 'icon' | 'splash', width: number, height: number, message: string) {
  const result = validateBrandImageDimensions(kind, pixels(width, height));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.message, message);
}

function expectAllow(kind: 'logo' | 'icon' | 'splash', width: number, height: number) {
  assert.deepEqual(validateBrandImageDimensions(kind, pixels(width, height)), { ok: true, message: null });
}

expectReject('icon', 1200, 800, 'App icon must be square. Yours is 1200×800. Use 1024×1024.');
expectReject(
  'icon',
  256,
  256,
  'App icon must be a square from 512×512 to 1024×1024. Yours is 256×256. Use 1024×1024.'
);
expectReject(
  'icon',
  2048,
  2048,
  'App icon must be a square from 512×512 to 1024×1024. Yours is 2048×2048. Use 1024×1024.'
);
expectAllow('icon', 512, 512);
expectAllow('icon', 1024, 1024);
expectAllow('icon', 800, 800);

expectAllow('splash', 1284, 2778);
expectAllow('splash', 1080, 1920);
expectAllow('splash', 1290, 2796);
expectAllow('splash', 256, 256);
expectAllow('splash', 1024, 1024);
expectAllow('splash', 2048, 2048);
expectReject('splash', 2000, 1000, 'Splash must be portrait or square. Yours is 2000×1000. Use 1284×2778, or a square from 256×256 to 2048×2048.');
expectReject(
  'splash',
  800,
  1600,
  'Splash must be 1080–1290 wide and 1920–2796 tall, or a square from 256×256 to 2048×2048. Yours is 800×1600. Use 1284×2778.'
);
expectReject('splash', 1079, 1920, 'Splash must be 1080–1290 wide and 1920–2796 tall, or a square from 256×256 to 2048×2048. Yours is 1079×1920. Use 1284×2778.');
expectReject('splash', 1080, 1919, 'Splash must be 1080–1290 wide and 1920–2796 tall, or a square from 256×256 to 2048×2048. Yours is 1080×1919. Use 1284×2778.');
expectReject('splash', 1291, 2778, 'Splash must be 1080–1290 wide and 1920–2796 tall, or a square from 256×256 to 2048×2048. Yours is 1291×2778. Use 1284×2778.');
expectReject('splash', 1284, 2797, 'Splash must be 1080–1290 wide and 1920–2796 tall, or a square from 256×256 to 2048×2048. Yours is 1284×2797. Use 1284×2778.');
expectReject(
  'splash',
  128,
  128,
  'A square splash must be from 256×256 to 2048×2048. Yours is 128×128. Use 1284×2778, or a square from 256×256 to 2048×2048.'
);
expectReject(
  'splash',
  2049,
  2049,
  'A square splash must be from 256×256 to 2048×2048. Yours is 2049×2049. Use 1284×2778, or a square from 256×256 to 2048×2048.'
);

expectAllow('logo', 1024, 1024);
expectAllow('logo', 2048, 1024);
expectAllow('logo', 256, 256);
expectAllow('logo', 2048, 2048);
expectAllow('logo', 256, 768);
expectAllow('logo', 768, 256);
expectReject(
  'logo',
  100,
  100,
  'Logo must be between 256 and 2048 pixels on each side. Yours is 100×100. Use 1024×1024, or a wide wordmark up to 2048×1024.'
);
expectReject(
  'logo',
  2049,
  1024,
  'Logo must be between 256 and 2048 pixels on each side. Yours is 2049×1024. Use 1024×1024, or a wide wordmark up to 2048×1024.'
);
expectReject(
  'logo',
  2048,
  400,
  'Logo must be between 1:3 and 3:1. Yours is 2048×400. Use 1024×1024, or a wide wordmark up to 2048×1024.'
);
expectReject(
  'logo',
  400,
  2048,
  'Logo must be between 1:3 and 3:1. Yours is 400×2048. Use 1024×1024, or a wide wordmark up to 2048×1024.'
);
expectReject(
  'logo',
  100,
  4000,
  'Logo must be between 256 and 2048 pixels on each side, and between 1:3 and 3:1. Yours is 100×4000. Use 1024×1024, or a wide wordmark up to 2048×1024.'
);
expectReject('logo', 256, 769, 'Logo must be between 1:3 and 3:1. Yours is 256×769. Use 1024×1024, or a wide wordmark up to 2048×1024.');
expectReject('logo', 769, 256, 'Logo must be between 1:3 and 3:1. Yours is 769×256. Use 1024×1024, or a wide wordmark up to 2048×1024.');
assert.equal(
  validateBrandImageDimensions('icon', pixels(1024.5, 1024.5)).message,
  'We could not read that image. Try another JPG, PNG, or WebP.'
);
assert.equal(validateBrandImageDimensions('logo', pixels(0, 1024)).ok, false);

assert.match(BRAND_IMAGE_SIZE_GUIDE.icon, /1024×1024/);
assert.match(BRAND_IMAGE_SIZE_GUIDE.icon, /App Store and Play/);
assert.match(BRAND_IMAGE_SIZE_GUIDE.splash, /1284×2778/);
assert.match(BRAND_IMAGE_SIZE_GUIDE.splash, /Android and iOS/);
assert.match(BRAND_IMAGE_SIZE_GUIDE.logo, /1024×1024/);
assert.match(BRAND_IMAGE_SIZE_GUIDE.logo, /2048×1024/);
assert.match(BRAND_IMAGE_SIZE_GUIDE.logo, /Android and iOS/);
assert.doesNotMatch(`${BRAND_IMAGE_SIZE_GUIDE.logo} ${BRAND_IMAGE_SIZE_GUIDE.icon} ${BRAND_IMAGE_SIZE_GUIDE.splash}`, /expo|EXPO_|eas token/i);

const brandingSource = readFileSync(join(here, 'branding.ts'), 'utf8');
const acceptStart = brandingSource.indexOf('export function acceptBrandImageFile');
const acceptBody = brandingSource.slice(acceptStart, brandingSource.indexOf('function authHeaders'));
assert.ok(acceptStart >= 0);
assert.ok(acceptBody.indexOf('validateBrandImageFile') < acceptBody.indexOf('onFile(file)'));
assert.ok(acceptBody.indexOf('if (!check.ok)') < acceptBody.indexOf('onFile(file)'));

const logoUploadSource = readFileSync(join(here, '../../components/settings/StoreLogoUpload.tsx'), 'utf8');
const logoCheckAt = logoUploadSource.indexOf("validateBrandImageFile(file, 'logo')");
const logoUploadAt = logoUploadSource.indexOf('uploadLogo(');
assert.ok(logoCheckAt >= 0 && logoUploadAt > logoCheckAt);
assert.match(logoUploadSource, /BRAND_IMAGE_SIZE_GUIDE\.logo/);
assert.doesNotMatch(logoUploadSource, /200x200|at least 200/);

async function checkBrandImageFileGate() {
  const png = new File([Uint8Array.from([1, 2, 3, 4])], 'icon.png', { type: 'image/png' });
  let reads = 0;
  const gif = new File([Uint8Array.from([1])], 'icon.gif', { type: 'image/gif' });
  const typed = await validateBrandImageFile(gif, 'icon', async () => {
    reads += 1;
    return pixels(1024, 1024);
  });
  assert.equal(typed.ok, false);
  if (!typed.ok) assert.equal(typed.message, 'Use a JPG, PNG, or WebP image.');
  assert.equal(reads, 0);
  assert.equal(validateBrandImage(gif).ok, false);

  const heavy = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' });
  const sized = await validateBrandImageFile(heavy, 'logo', async () => {
    reads += 1;
    return pixels(1024, 1024);
  });
  assert.equal(sized.ok, false);
  if (!sized.ok) assert.equal(sized.message, 'Image must be under 2MB.');
  assert.equal(reads, 0);

  const unread = await validateBrandImageFile(png, 'splash', async () => null);
  assert.equal(unread.ok, false);
  if (!unread.ok) assert.equal(unread.message, 'We could not read that image. Try another JPG, PNG, or WebP.');

  const thrown = await validateBrandImageFile(png, 'logo', async () => {
    throw new Error('decode');
  });
  assert.equal(thrown.ok, false);

  let uploads = 0;
  await acceptBrandImageFile(
    png,
    'icon',
    (message) => {
      assert.equal(message, 'App icon must be square. Yours is 1200×800. Use 1024×1024.');
    },
    () => {
      uploads += 1;
    },
    () => true,
    async () => pixels(1200, 800)
  );
  assert.equal(uploads, 0);

  await acceptBrandImageFile(
    png,
    'icon',
    () => {
      throw new Error('a stale pick must not set an error');
    },
    () => {
      throw new Error('a stale pick must not upload');
    },
    () => false,
    async () => pixels(1200, 800)
  );

  await acceptBrandImageFile(
    png,
    'splash',
    (message) => {
      if (message) throw new Error(`a square logo must pass splash: ${message}`);
    },
    (file) => {
      assert.equal(file, png);
      uploads += 1;
    },
    () => true,
    async () => pixels(1024, 1024)
  );
  assert.equal(uploads, 1);

  await acceptBrandImageFile(
    png,
    'icon',
    (message) => {
      if (message) throw new Error(`1024 icon must upload: ${message}`);
    },
    () => {
      uploads += 1;
    },
    () => true,
    async () => pixels(1024, 1024)
  );
  assert.equal(uploads, 2);

  await acceptBrandImageFile(
    png,
    'logo',
    (message) => {
      if (message) throw new Error(`wide wordmark must upload: ${message}`);
    },
    () => {
      uploads += 1;
    },
    () => true,
    async () => pixels(2048, 1024)
  );
  assert.equal(uploads, 3);

  const dot = new File(
    [Uint8Array.from(Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64'))],
    'dot.png',
    { type: 'image/png' }
  );
  const decoded = await readBrandImageSize(dot);
  let decodedUploads = 0;
  let decodedError: string | null = null;
  await acceptBrandImageFile(
    dot,
    'icon',
    (message) => {
      decodedError = message;
    },
    () => {
      decodedUploads += 1;
    }
  );
  assert.equal(decodedUploads, 0);
  if (decoded?.width === 1 && decoded.height === 1) {
    assert.equal(
      decodedError,
      'App icon must be a square from 512×512 to 1024×1024. Yours is 1×1. Use 1024×1024.'
    );
  } else {
    assert.equal(decodedError, 'We could not read that image. Try another JPG, PNG, or WebP.');
  }
}

checkLogoFile()
  .then(() => checkBrandImageFileGate())
  .then(() => {
    console.log('branding check ok');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
