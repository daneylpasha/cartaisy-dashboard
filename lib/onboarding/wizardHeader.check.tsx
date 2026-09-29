import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { WizardChrome, wizardHeaderImageUrl, wizardHeaderMark } from '@/components/onboarding/WizardChrome';

const here = dirname(fileURLToPath(import.meta.url));
const chromeSource = readFileSync(join(here, '../../components/onboarding/WizardChrome.tsx'), 'utf8');
const wizardSource = readFileSync(join(here, '../../components/onboarding/OnboardingWizard.tsx'), 'utf8');

assert.equal(wizardHeaderMark(), 'Setup');
assert.equal(wizardHeaderMark('  ', null), 'Setup');
assert.equal(wizardHeaderMark('Northwind'), 'Northwind');
assert.equal(wizardHeaderMark('  Harbor & Co  '), 'Harbor & Co');
assert.equal(wizardHeaderMark('northwind.myshopify.com', 'Harbor'), 'Harbor');
assert.equal(wizardHeaderMark('https://northwind.myshopify.com', 'Harbor'), 'Harbor');
assert.equal(wizardHeaderMark('66f1c2e0a1b2c3d4e5f60710', 'Harbor'), 'Harbor');
assert.equal(wizardHeaderMark('Cartaisy', 'Harbor'), 'Harbor');
assert.equal(wizardHeaderMark('cartaisy'), 'Setup');
assert.equal(wizardHeaderMark('northwind.myshopify.com', '66f1c2e0a1b2c3d4e5f60710'), 'Setup');
assert.equal(wizardHeaderMark('', 'Northwind'), 'Northwind');

function header(
  appName?: string | null,
  storeName?: string | null,
  iconUrl?: string | null,
  logoUrl?: string | null
): string {
  return renderToStaticMarkup(
    <WizardChrome
      step="brand"
      wide
      appName={appName}
      storeName={storeName}
      iconUrl={iconUrl}
      logoUrl={logoUrl}
    >
      Body
    </WizardChrome>
  );
}

function markText(markup: string): string {
  const match = markup.match(/<header[\s\S]*?<p[^>]*>([^<]*)<\/p>/);
  if (!match) throw new Error('header mark missing');
  return match[1] ?? '';
}

const unnamed = header();
assert.equal(markText(unnamed), 'Setup');
assert.equal(unnamed.includes('Cartaisy'), false);
assert.match(unnamed, /Exit setup/);
assert.match(unnamed, /href="\/dashboard"/);
assert.match(unnamed, /aria-label="Setup steps"/);
assert.match(unnamed, />Connect</);
assert.match(unnamed, />Brand</);
assert.match(unnamed, />Preview</);
assert.match(unnamed, />Ready</);
assert.doesNotMatch(unnamed, /SmartHomePreview|data-shopper-screen/);

const named = header('Northwind', 'northwind.myshopify.com');
assert.equal(markText(named), 'Northwind');
assert.equal(named.includes('northwind.myshopify.com'), false);
assert.equal(named.includes('Cartaisy'), false);

const domainOnly = header('northwind.myshopify.com', '66f1c2e0a1b2c3d4e5f60710');
assert.equal(markText(domainOnly), 'Setup');
assert.equal(domainOnly.includes('northwind.myshopify.com'), false);
assert.equal(domainOnly.includes('66f1c2e0a1b2c3d4e5f60710'), false);
assert.equal(domainOnly.includes('Cartaisy'), false);

const wordmark = header('Cartaisy', 'Harbor');
assert.equal(markText(wordmark), 'Harbor');
assert.equal(wordmark.includes('Cartaisy'), false);

assert.match(wizardSource, /appName=\{draft\.appName\}/);
assert.match(wizardSource, /storeName=\{session\?\.user\?\.storeName\}/);
assert.match(wizardSource, /iconUrl=\{draft\.iconUrl\}/);
assert.match(wizardSource, /logoUrl=\{draft\.logoUrl\}/);
assert.doesNotMatch(wizardSource, /shopDomain=\{connection|appName=\{connection|storeName=\{storeId/);
assert.doesNotMatch(chromeSource, />\s*Cartaisy\s*</);
assert.doesNotMatch(chromeSource, /SmartHomePreview/);
assert.match(chromeSource, /safeImageUrl/);
assert.match(chromeSource, /onError=\{\(\) => markBroken\(imageUrl\)\}/);
assert.match(chromeSource, /node\?\.complete && node\.naturalWidth === 0/);
assert.match(chromeSource, /brokenFor !== imageUrl/);

const ICON = 'https://cdn.example/icon.png';
const LOGO = 'https://cdn.example/logo.png';
const BLOB = 'blob:http://localhost/preview';

assert.equal(wizardHeaderImageUrl(null, null), null);
assert.equal(wizardHeaderImageUrl('  ', LOGO), LOGO);
assert.equal(wizardHeaderImageUrl(`  ${ICON}  `, LOGO), ICON);
assert.equal(wizardHeaderImageUrl(ICON, LOGO), ICON);
assert.equal(wizardHeaderImageUrl(null, LOGO), LOGO);
assert.equal(wizardHeaderImageUrl(BLOB, LOGO), BLOB);
assert.equal(wizardHeaderImageUrl('http://cdn.example/icon.png', LOGO), LOGO);
assert.equal(wizardHeaderImageUrl('http://cdn.example/icon.png', null), null);
assert.equal(wizardHeaderImageUrl(`${ICON}?access_token=shpat_secret`, LOGO), LOGO);
assert.equal(wizardHeaderImageUrl(`${ICON}?token=shpss_secret`, null), null);
assert.equal(wizardHeaderImageUrl('javascript:alert(1)', LOGO), LOGO);
assert.equal(wizardHeaderImageUrl('/icon.png', null), null);

function headerImage(
  iconUrl?: string | null,
  logoUrl?: string | null,
  appName: string | null = 'Northwind',
  storeName: string | null = 'northwind.myshopify.com'
): string {
  return header(appName, storeName, iconUrl, logoUrl);
}

const withIcon = headerImage(ICON, LOGO);
assert.equal(markText(withIcon), 'Northwind');
assert.match(withIcon, /<img[^>]*src="https:\/\/cdn\.example\/icon\.png"/);
assert.match(withIcon, /class="[^"]*size-8[^"]*rounded-lg/);
assert.match(withIcon, /alt=""/);
assert.doesNotMatch(withIcon, /src="https:\/\/cdn\.example\/logo\.png"/);
assert.equal(withIcon.includes('northwind.myshopify.com'), false);
assert.equal(withIcon.includes('Cartaisy'), false);
assert.doesNotMatch(withIcon, /SmartHomePreview|data-shopper-screen/);

const logoOnly = headerImage(null, LOGO);
assert.equal(markText(logoOnly), 'Northwind');
assert.match(logoOnly, /src="https:\/\/cdn\.example\/logo\.png"/);

const blobIcon = headerImage(BLOB, null);
assert.match(blobIcon, /src="blob:http:\/\/localhost\/preview"/);

const unsafe = headerImage('http://cdn.example/icon.png', `${LOGO}?access_token=shpat_secret`);
assert.equal(markText(unsafe), 'Northwind');
assert.doesNotMatch(unsafe, /<img/);
assert.equal(unsafe.includes('shpat_secret'), false);
assert.equal(unsafe.includes('Cartaisy'), false);

const textOnly = header();
assert.doesNotMatch(textOnly, /<img/);

console.log('wizard header checks passed');
