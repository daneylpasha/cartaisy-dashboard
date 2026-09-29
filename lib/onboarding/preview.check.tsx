import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BrandHandoff } from '@/components/onboarding/BrandHandoff';
import { mergeStoredBrandAssets } from '@/lib/onboarding/brandAssets';
import { brandingFromPayload } from '@/lib/onboarding/branding';
import type { BrandingDraft } from '@/lib/onboarding/types';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '../..');

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

function sourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...sourceFiles(full));
      continue;
    }
    if (/\.(tsx|ts|jsx|js)$/.test(name)) files.push(full);
  }
  return files;
}

const brandSource = source('../../components/onboarding/steps/BrandingStep.tsx');
const previewStepSource = source('../../components/onboarding/steps/PreviewStep.tsx');
const wizardSource = source('../../components/onboarding/OnboardingWizard.tsx');
const settingsSource = source('../../components/settings/StoreAppBrandView.tsx');

assert.doesNotMatch(brandSource, /preview only/i);
assert.doesNotMatch(brandSource, /api key|access token|accessToken/i);
assert.match(wizardSource, /uploadBrandAsset/);
assert.match(wizardSource, /planBrandAssetSave/);
assert.match(wizardSource, /plan\.persist === 'dashboard'/);
assert.match(brandSource, /imageUrl=\{draft\.iconUrl\}/);
assert.match(brandSource, /imageUrl=\{draft\.splashUrl\}/);
assert.doesNotMatch(wizardSource, /uploadOptionalBrandAsset/);
assert.doesNotMatch(brandSource, /SmartHomePreview|HomeScreenLauncherMock|SplashBootMock|data-shopper-screen/);
assert.doesNotMatch(previewStepSource, /SmartHomePreview|data-shopper-screen/);
assert.doesNotMatch(settingsSource, /SmartHomePreview|data-shopper-screen/);
assert.match(brandSource, /<BrandInstallPreview model=\{installPreview\} \/>/);
assert.match(previewStepSource, /<BrandInstallPreview model=\{installPreview\} \/>/);
assert.match(settingsSource, /<BrandInstallPreview model=\{installPreview\} \/>/);
assert.match(wizardSource, /onDraftChange=\{setDraft\}/);
assert.equal(previewStepSource.match(/<SmartHomePreview/g)?.length ?? 0, 0);

for (const file of [...sourceFiles(join(repoRoot, 'app')), ...sourceFiles(join(repoRoot, 'components'))]) {
  const text = readFileSync(file, 'utf8');
  assert.doesNotMatch(text, /SmartHomePreview|data-shopper-screen|shopperChrome/);
}

const draft: BrandingDraft = {
  appName: 'Northwind',
  logoUrl: 'https://cdn.example/logo.png',
  iconUrl: 'https://cdn.example/icon.png',
  splashUrl: 'https://cdn.example/splash.png',
  primaryColor: '#0F766E',
  secondaryColor: '#F5F5F4',
  splashPersisted: false,
  iconPersisted: false,
};

const handoff = renderToStaticMarkup(createElement(BrandHandoff, { draft }));
assert.match(handoff, /Northwind/);
assert.match(handoff, /https:\/\/cdn\.example\/icon\.png/);
assert.doesNotMatch(handoff, /splash\.png/);
assert.doesNotMatch(handoff, /cartaisy/i);
assert.doesNotMatch(handoff, /api key|access token/i);
assert.doesNotMatch(handoff, /data-shopper-screen/);

const missingIcon = renderToStaticMarkup(
  createElement(BrandHandoff, { draft: { ...draft, appName: 'Harbor', iconUrl: null } })
);
assert.match(missingIcon, /Harbor/);
assert.match(missingIcon, />H</);
assert.doesNotMatch(missingIcon, /cdn\.example\/icon/);

const fromBranding = mergeStoredBrandAssets(
  brandingFromPayload(
    {
      data: {
        appName: 'Northwind',
        logoUrl: 'https://cdn.example/logo.png',
        primaryColor: '#0F766E',
        secondaryColor: '#F5F5F4',
        appIconUrl: 'https://cdn.example/api-icon.png',
        splashImageUrl: 'https://cdn.example/api-splash.png',
      },
    },
    'Stored name'
  ),
  {
    iconUrl: 'https://cdn.example/stored-icon.png',
    splashUrl: 'https://cdn.example/stored-splash.png',
  }
);
assert.equal(fromBranding.iconUrl, 'https://cdn.example/api-icon.png');
assert.equal(fromBranding.splashUrl, 'https://cdn.example/api-splash.png');
assert.notEqual(fromBranding.iconUrl, 'https://cdn.example/stored-icon.png');
assert.notEqual(fromBranding.splashUrl, 'https://cdn.example/stored-splash.png');

const brandingHandoff = renderToStaticMarkup(createElement(BrandHandoff, { draft: fromBranding }));
assert.match(brandingHandoff, /https:\/\/cdn\.example\/api-icon\.png/);
assert.doesNotMatch(brandingHandoff, /stored-icon/);
assert.doesNotMatch(brandingHandoff, /api-splash/);
assert.doesNotMatch(brandingHandoff, /data-shopper-screen/);

console.log('preview check ok');
