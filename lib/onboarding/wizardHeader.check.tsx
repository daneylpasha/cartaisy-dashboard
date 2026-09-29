import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderToStaticMarkup } from 'react-dom/server';
import { WizardChrome, wizardHeaderMark } from '@/components/onboarding/WizardChrome';

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

function header(appName?: string | null, storeName?: string | null): string {
  return renderToStaticMarkup(
    <WizardChrome step="brand" wide appName={appName} storeName={storeName}>
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
assert.doesNotMatch(wizardSource, /shopDomain=\{connection|appName=\{connection|storeName=\{storeId/);
assert.doesNotMatch(chromeSource, />\s*Cartaisy\s*</);
assert.doesNotMatch(chromeSource, /SmartHomePreview/);

console.log('wizard header checks passed');
