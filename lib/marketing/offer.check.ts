import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveFitOutcome } from '@/lib/marketing/fitCheck';
import { parseFitLead, parseWalkthroughLead } from '@/lib/marketing/leadPayload';
import { leadInboxAccess, leadKindLabel, mergeOperatorLeads } from '@/lib/marketing/leadInbox';
import { checkoutWording, iosReadiness, offerPositioning, publicFaqs } from '@/lib/marketing/offer';
import { consumeRateLimit, resetRateLimitForTests } from '@/lib/marketing/rateLimit';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

function filesUnder(relative: string): string[] {
  const full = join(root, relative);
  const stat = statSync(full);
  if (stat.isFile()) return [full];
  const found: string[] = [];
  for (const entry of readdirSync(full)) {
    const next = join(full, entry);
    if (statSync(next).isDirectory()) found.push(...filesUnder(join(relative, entry)));
    else if (/\.(tsx|ts)$/.test(entry)) found.push(next);
  }
  return found;
}

const scanned = [
  'app/page.tsx',
  'app/pricing',
  'app/features',
  'app/about',
  'app/fit',
  'app/demo',
  'app/product-tour',
  'app/schedule-demo',
  'app/contact',
  'app/docs',
  'app/terms',
  'app/privacy',
  'app/careers',
  'app/newsletter',
  'app/layout.tsx',
  'app/(auth)/login/page.tsx',
  'app/(auth)/signup/page.tsx',
  'components/landing',
  'components/marketing',
  'components/ContactForm.tsx',
  'lib/seo.ts',
  'lib/marketing/offer.ts',
].flatMap(filesUnder);

const banned = [
  /\$49\b/,
  /\$99\b/,
  /\$199\b/,
  /\$499\b/,
  /14-day/i,
  /500\+/,
  /4\.9/,
  /100K/i,
  /calendly\.com/i,
  /YOUR_VIDEO_ID/,
  /aggregateRating/,
  /priceValidUntil/,
  /Start Free Trial/,
  /Get Started Free/,
  /\bVisa\b/,
  /Mastercard/,
];

for (const file of scanned) {
  const text = readFileSync(file, 'utf8');
  for (const pattern of banned) {
    assert.equal(pattern.test(text), false, `${file} matches ${pattern}`);
  }
}

const fitRoute = readFileSync(join(root, 'app/api/fit/route.ts'), 'utf8');
assert.equal(/oauth/i.test(fitRoute), false);
assert.equal(/myshopify/i.test(fitRoute), false);
const walkRoute = readFileSync(join(root, 'app/api/walkthrough/route.ts'), 'utf8');
assert.equal(/calendly/i.test(walkRoute), false);
const leadsRoute = readFileSync(join(root, 'app/api/admin/leads/route.ts'), 'utf8');
assert.match(leadsRoute, /isPlatformOperator/);
assert.match(leadsRoute, /leadInboxAccess/);
assert.match(leadsRoute, /ContactSubmission/);
assert.match(leadsRoute, /mergeOperatorLeads/);
assert.equal(leadsRoute.includes('ipAddress'), false);
const leadsPage = readFileSync(join(root, 'app/dashboard/admin/leads/page.tsx'), 'utf8');
assert.match(leadsPage, /leadKindLabel/);
assert.match(leadsPage, /Subject or outcome/);
assert.match(leadsPage, /contact messages/);
assert.equal(leadKindLabel.fit, 'Fit check');
assert.equal(leadKindLabel.walkthrough, 'Walkthrough');
assert.equal(leadKindLabel.contact, 'Contact');
const contactRoute = readFileSync(join(root, 'app/api/contact/route.ts'), 'utf8');
assert.match(contactRoute, /ContactSubmission\.create/);
assert.match(contactRoute, /resend\.emails\.send/);

const signedOut = leadInboxAccess({ hasSession: false, hasToken: false, operator: false });
const tokenOnly = leadInboxAccess({ hasSession: false, hasToken: true, operator: true });
const merchant = leadInboxAccess({ hasSession: true, hasToken: true, operator: false });
const operator = leadInboxAccess({ hasSession: true, hasToken: true, operator: true });
assert.equal(signedOut.ok, false);
assert.equal(tokenOnly.ok, false);
assert.equal(merchant.ok, false);
assert.equal(operator.ok, true);
if (!signedOut.ok) assert.equal(signedOut.status, 401);
if (!tokenOnly.ok) assert.equal(tokenOnly.status, 401);
if (!merchant.ok) assert.equal(merchant.status, 403);

const merged = mergeOperatorLeads(
  [
    {
      _id: 'fit-1',
      kind: 'fit',
      name: 'Amina',
      email: 'amina@example.com',
      createdAt: new Date('2026-10-01T00:00:00.000Z'),
      outcome: 'prelaunch_fit',
      outcomeTitle: 'Start with the Shopify store',
      stage: 'prelaunch',
    },
    {
      _id: 'walk-1',
      kind: 'walkthrough',
      name: 'Noor',
      email: 'noor@example.com',
      createdAt: new Date('2026-10-03T00:00:00.000Z'),
      preferredWindow: 'Tuesday morning',
      note: 'Please walk through Connect.',
    },
  ],
  [
    {
      _id: 'contact-1',
      name: 'Sam',
      email: 'sam@example.com',
      subject: 'Sales',
      message: 'Can you tell me about setup?',
      createdAt: new Date('2026-10-05T00:00:00.000Z'),
    },
  ]
);
assert.deepEqual(
  merged.map((row) => row.kind),
  ['contact', 'walkthrough', 'fit']
);
assert.equal(merged[0]?.subject, 'Sales');
assert.equal(merged[0]?.message, 'Can you tell me about setup?');
assert.equal(merged[1]?.preferredWindow, 'Tuesday morning');
assert.equal(merged[2]?.outcome, 'prelaunch_fit');
assert.equal(JSON.stringify(merged).includes('ipAddress'), false);
const shopifyDocs = readFileSync(join(root, 'app/docs/shopify/page.tsx'), 'utf8');
assert.equal(shopifyDocs.includes('read_products'), false);
assert.match(shopifyDocs, /shopifyScopesDisclosure/);
assert.match(readFileSync(join(root, 'lib/marketing/offer.ts'), 'utf8'), /does not publish that list/);
const signup = readFileSync(join(root, 'app/(auth)/signup/page.tsx'), 'utf8');
assert.match(signup, /href="\/fit"/);
assert.match(signup, /invite-only/);
const demo = readFileSync(join(root, 'components/marketing/ProductTour.tsx'), 'utf8');
assert.equal(/youtube|testflight|play\.google/i.test(demo), false);
assert.match(demo, /ConnectStep/);
assert.match(demo, /BrandingStep/);

assert.equal(offerPositioning.eyebrow, 'Managed mobile apps for Shopify');
assert.equal(offerPositioning.headline, 'Give your Shopify customers a branded mobile shopping experience.');
assert.equal(offerPositioning.primaryCta, 'Check if Cartaisy fits your store');
assert.equal(offerPositioning.secondaryCta, 'See Cartaisy in action');
assert.match(checkoutWording, /Shopify hosted checkout/);
assert.match(checkoutWording, /not Cartaisy features/);
assert.match(iosReadiness, /not a production offer/);
assert.ok(publicFaqs.length >= 12);

const operating = resolveFitOutcome({ stage: 'operating', goal: 'branded_app' });
const prelaunch = resolveFitOutcome({ stage: 'prelaunch', goal: 'branded_app' });
const other = resolveFitOutcome({ stage: 'operating', goal: 'other' });
const notShopify = resolveFitOutcome({ stage: 'not_shopify', goal: 'branded_app' });
assert.equal(operating.outcome, 'operating_fit');
assert.equal(prelaunch.outcome, 'prelaunch_fit');
assert.equal(other.outcome, 'website_first');
assert.equal(notShopify.outcome, 'website_first');

const withUrl = parseFitLead({
  name: 'Amina',
  email: 'amina@example.com',
  stage: 'prelaunch',
  goal: 'branded_app',
  storeUrl: '',
});
const withoutChangingOutcome = parseFitLead({
  name: 'Amina',
  email: 'amina@example.com',
  stage: 'prelaunch',
  goal: 'branded_app',
  storeUrl: 'https://example.com',
});
assert.equal(withUrl.ok && withoutChangingOutcome.ok, true);
if (withUrl.ok && withoutChangingOutcome.ok) {
  assert.equal(withUrl.value.storeUrl, null);
  assert.equal(withUrl.value.outcome, 'prelaunch_fit');
  assert.equal(withoutChangingOutcome.value.outcome, 'prelaunch_fit');
  assert.equal(withoutChangingOutcome.value.storeUrl, 'https://example.com');
}

const badUrl = parseFitLead({
  name: 'Amina',
  email: 'amina@example.com',
  stage: 'operating',
  goal: 'branded_app',
  storeUrl: 'javascript:alert(1)',
});
assert.equal(badUrl.ok, false);

const walk = parseWalkthroughLead({ name: 'Sam', email: 'sam@example.com', storeUrl: '' });
assert.equal(walk.ok, true);
if (walk.ok) assert.equal(walk.value.storeUrl, null);

resetRateLimitForTests();
assert.equal(consumeRateLimit('fit:test', 2, 60_000, 1_000), true);
assert.equal(consumeRateLimit('fit:test', 2, 60_000, 1_100), true);
assert.equal(consumeRateLimit('fit:test', 2, 60_000, 1_200), false);
assert.equal(consumeRateLimit('fit:test', 2, 60_000, 70_000), true);

console.log('c01 commercial checks passed');
