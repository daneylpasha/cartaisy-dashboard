import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { NextRequest } from 'next/server';
import { SignupAccessHandoff, signupAccessCopy, signupTokenFailure } from '@/components/auth/SignupAccessHandoff';
import ProductTour from '@/components/marketing/ProductTour';
import { GET as getLeadInbox, setLeadInboxAdaptersForTests } from '@/app/api/admin/leads/route';
import { POST as postContact, setContactCreateForTests } from '@/app/api/contact/route';
import { POST as postFit, setFitRouteAdaptersForTests } from '@/app/api/fit/route';
import { POST as postWalkthrough, setWalkthroughSaveForTests } from '@/app/api/walkthrough/route';
import { resolveFitOutcome } from '@/lib/marketing/fitCheck';
import { parseFitLead, parseWalkthroughLead } from '@/lib/marketing/leadPayload';
import { leadInboxAccess, leadKindLabel, mergeOperatorLeads } from '@/lib/marketing/leadInbox';
import {
  checkoutWording,
  eligibility,
  homeAudiences,
  homeFaqs,
  homeIncludes,
  homeManaged,
  homePlatform,
  homeSteps,
  iosReadiness,
  offerExcludes,
  offerPositioning,
  publicFaqs,
} from '@/lib/marketing/offer';
import { consumeRateLimit, resetRateLimitForTests } from '@/lib/marketing/rateLimit';
import { generateMetadata } from '@/lib/seo';

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
  'components/auth/SignupAccessHandoff.tsx',
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
assert.equal(/Railway|SHOPIFY_SCOPES|do not link/i.test(shopifyDocs), false);
const scopesNote = readFileSync(join(root, 'docs/SHOPIFY_ACCESS.md'), 'utf8');
assert.match(scopesNote, /SHOPIFY_SCOPES/);
assert.match(scopesNote, /Railway/);
assert.match(scopesNote, /Do not link a Shopify App Store listing/);
assert.match(readFileSync(join(root, 'lib/marketing/offer.ts'), 'utf8'), /not confirmed on this site/);
const pricingTitle = generateMetadata({ title: 'Pricing', description: 'One managed offer.' });
const homeTitle = generateMetadata({ title: 'Home', description: 'Home.' });
assert.deepEqual(pricingTitle.title, { absolute: 'Pricing | Cartaisy' });
assert.deepEqual(homeTitle.title, { absolute: 'Cartaisy — Managed mobile apps for Shopify' });
assert.equal(JSON.stringify(pricingTitle.title).includes('Cartaisy | Cartaisy'), false);
const signup = readFileSync(join(root, 'app/(auth)/signup/page.tsx'), 'utf8');
const signupHandoff = readFileSync(join(root, 'components/auth/SignupAccessHandoff.tsx'), 'utf8');
assert.match(signup, /SignupAccessHandoff/);
assert.match(signup, /signupTokenFailure/);
assert.match(signup, /href="\/login"/);
assert.match(signupHandoff, /href="\/fit"/);
assert.match(signupHandoff, /href="\/schedule-demo"/);
assert.match(signupHandoff, /href="\/login"/);
assert.match(signupHandoff, /invite-only/);
const demo = readFileSync(join(root, 'components/marketing/ProductTour.tsx'), 'utf8');
assert.equal(/youtube|testflight|play\.google/i.test(demo), false);
assert.match(demo, /ConnectStep/);
assert.match(demo, /BrandingStep/);
assert.match(demo, /tourMode/);
assert.equal(/staging|invited merchant/i.test(demo), false);
assert.equal(/href=["']\/dashboard|href=["']\/login|oauth/i.test(demo), false);
const demoMarkup = renderToStaticMarkup(createElement(ProductTour));
assert.equal((demoMarkup.match(/<h1[\s>]/g) ?? []).length, 1);
assert.match(demoMarkup, /Explore your store-to-app setup\./);
assert.match(demoMarkup, /Try the setup steps with sample data\. Changes stay in this tour\./);
assert.match(demoMarkup, /<h2[^>]*>Connect<\/h2>/);
assert.match(demoMarkup, /<h2[^>]*>Brand<\/h2>/);
assert.match(demoMarkup, /<h3[^>]*>Connect Shopify<\/h3>/);
assert.match(demoMarkup, /<h3[^>]*>Confirm your brand<\/h3>/);
assert.match(demoMarkup, />Continue without connecting</);
assert.match(demoMarkup, />Back</);
assert.match(demoMarkup, />Continue</);
assert.match(demoMarkup, />Publish home</);
assert.match(demoMarkup, />Go live</);
assert.match(demoMarkup, />Build my app</);
assert.match(demoMarkup, /role="status"/);
assert.match(demoMarkup, /aria-live="polite"/);
assert.match(demoMarkup, /Offer limits/);
assert.equal(/href="\/dashboard|href="\/login|oauth/i.test(demoMarkup), false);
assert.equal(/<button[^>]*>Publish home<\/button>/.test(demoMarkup), true);
assert.equal(/<button[^>]*>Go live<\/button>/.test(demoMarkup), true);
assert.equal(/<button[^>]*>Build my app<\/button>/.test(demoMarkup), true);

assert.equal(offerPositioning.eyebrow, 'Managed mobile apps for Shopify');
assert.equal(offerPositioning.headline, 'Your Shopify store, made mobile.');
assert.equal(offerPositioning.primaryCta, 'Check if Cartaisy fits your store');
assert.equal(offerPositioning.secondaryCta, 'See Cartaisy in action');
assert.equal(/free trial|operator|binary|staging store/i.test(offerPositioning.subhead), false);
const home = readFileSync(join(root, 'components/marketing/HomeProspect.tsx'), 'utf8');
assert.match(home, /offerPositioning\.primaryCta/);
assert.match(home, /offerPositioning\.secondaryCta/);
assert.match(home, /offerPaths\.fit/);
assert.match(home, /offerPaths\.demo/);
assert.match(home, /offerExcludes/);
assert.match(home, /homeAudiences/);
assert.match(home, /Wherever you are in your Shopify journey/);
assert.equal(/Who it suits/.test(home), false);
assert.deepEqual(
  homeAudiences.map((item) => item.title),
  ['Already selling on Shopify', 'Planning your Shopify store', 'Exploring your next step']
);
assert.equal(/guarantee/i.test(homeAudiences.map((item) => `${item.title} ${item.body}`).join('\n')), false);
assert.match(home, /Offer limits/);
assert.match(home, /aria-label=\{`\$\{headlineLead\}, \$\{headlineRest\}`\}/);
assert.match(home, /<span>\{headlineLead\},<\/span>\s*\n\s*<span>\{' '\}<\/span>\s*\n\s*<br className="hidden lg:block" aria-hidden="true" \/>/);
assert.match(home, /h-12 items-center justify-center rounded-\[4px\]/);
assert.equal(/h-12[^"\n]*rounded-xl/.test(home), false);
const nav = readFileSync(join(root, 'components/landing/LandingNavbar.tsx'), 'utf8');
assert.match(nav, /rounded-\[4px\]/);
assert.match(nav, /bg-\[#111210\]/);
assert.match(nav, /border-\[#2D302B\]/);
assert.match(nav, /#B6C4A1/);
assert.match(nav, /aria-current/);
assert.equal(/backdrop-blur|rounded-2xl|rounded-xl/.test(nav), false);
assert.ok(home.indexOf('offerPaths.pricing') < home.indexOf('<details'));
assert.equal(/homePlatform|Availability|Illustrative/.test(home), false);
const fitPage = readFileSync(join(root, 'app/fit/page.tsx'), 'utf8');
assert.match(fitPage, /You do not need an account to check fit\. Tell us about your business and your Shopify plans\. You can explore fit before your store is live\./);
assert.ok(fitPage.indexOf('<FitCheckForm') < fitPage.indexOf('<details'));
assert.match(fitPage, />\s*Offer details\s*</);
assert.match(fitPage, /homePlatform\.android/);
assert.match(fitPage, /homePlatform\.ios/);
assert.equal(/Platform limits|does not connect|OAuth/i.test(fitPage), false);
const fitForm = readFileSync(join(root, 'components/marketing/FitCheckForm.tsx'), 'utf8');
assert.match(fitForm, /You can leave this blank if your store is still in planning\./);
assert.match(fitForm, /label="Another goal"/);
assert.match(fitForm, /value="other"/);
assert.equal(/OAuth|does not connect Shopify/i.test(fitForm), false);
assert.match(fitForm, /role="status"/);
assert.match(fitForm, /role="alert"/);
assert.match(fitForm, /tabIndex=\{-1\}/);
assert.match(fitForm, /successRef\.current\?\.focus\(\)/);
const walkForm = readFileSync(join(root, 'components/marketing/WalkthroughForm.tsx'), 'utf8');
assert.match(walkForm, /role="status"/);
assert.match(walkForm, /role="alert"/);
assert.match(walkForm, /tabIndex=\{-1\}/);
assert.match(walkForm, /successRef\.current\?\.focus\(\)/);
const contactForm = readFileSync(join(root, 'components/ContactForm.tsx'), 'utf8');
assert.match(contactForm, /role="status"/);
assert.match(contactForm, /role="alert"/);
assert.match(contactForm, /tabIndex=\{-1\}/);
assert.match(contactForm, /successRef\.current\?\.focus\(\)/);
assert.match(demo, /homePlatform\.android/);
assert.match(demo, /homePlatform\.ios/);
assert.equal(/operator|allowed store|staging store|\bbinary\b/i.test(home), false);
const homeCopy = [
  offerPositioning.subhead,
  homeManaged,
  homePlatform.android,
  homePlatform.ios,
  ...homeAudiences.flatMap((item) => [item.title, item.body]),
  ...homeIncludes.flatMap((item) => [item.title, item.body]),
  ...homeSteps.flatMap((item) => [item.title, item.body]),
  ...homeFaqs.flatMap((item) => [item.question, item.answer]),
  ...offerExcludes,
  eligibility.operating,
  eligibility.prelaunch,
  eligibility.websiteFirst,
].join('\n');
assert.equal(/operator|allowed store|staging store|\bbinary\b/i.test(homeCopy), false);
assert.match(homePlatform.ios, /not ready/);
assert.match(homePlatform.android, /not yet generally available/);
assert.equal(/in progress|merchant builds/i.test(homePlatform.android), false);
assert.equal(/download/.test(homePlatform.android), true);
const costFaq = homeFaqs.find((item) => item.question === 'How much does it cost?');
assert.match(costFaq?.answer ?? '', /no free trial/);
assert.ok(homeFaqs.length >= 6);
const footer = readFileSync(join(root, 'components/landing/LandingFooter.tsx'), 'utf8');
assert.equal(footer.includes('No public price'), false);
assert.match(footer, /bg-\[#111210\]/);
assert.match(footer, /CookieSettingsButton/);
assert.match(footer, /supportEmail/);
assert.equal(/backdrop-blur|blur-lg|from-purple-500/.test(footer), false);
assert.equal(/href=["']#["']/.test(footer), false);
assert.match(footer, /offerPaths\.fit/);
assert.match(footer, /offerPaths\.walkthrough/);
assert.match(checkoutWording, /Shopify hosted checkout/);
assert.match(checkoutWording, /not Cartaisy features/);
assert.match(iosReadiness, /not ready for a merchant app/);
assert.equal(/August 2026|sample branded build|sample build|not a production offer/i.test(iosReadiness), false);
const offerSource = readFileSync(join(root, 'lib/marketing/offer.ts'), 'utf8');
assert.equal(/August 2026|sample branded build|sample build|not a production offer/i.test(offerSource), false);
const prospectFiles = [
  'lib/marketing/offer.ts',
  'lib/marketing/fitCheck.ts',
  'app/docs/shopify/page.tsx',
  'app/docs/quickstart/page.tsx',
  'app/docs/faq/page.tsx',
  'app/schedule-demo/page.tsx',
  'app/(auth)/signup/page.tsx',
  'app/terms/page.tsx',
  'app/privacy/page.tsx',
  'app/contact/page.tsx',
  'components/ContactForm.tsx',
  'components/marketing/WalkthroughForm.tsx',
].map((rel) => readFileSync(join(root, rel), 'utf8')).join('\n');
assert.equal(/\boperator\b|allowed store|\bstaging\b|\bbinary\b|August test|billing line was removed|Schedule a personalized demo|within 24 hours/i.test(prospectFiles), false);
assert.match(readFileSync(join(root, 'components/ContactForm.tsx'), 'utf8'), /Request a walkthrough/);
assert.match(readFileSync(join(root, 'app/privacy/page.tsx'), 'utf8'), /We do not collect card numbers/);
const cookiesPage = readFileSync(join(root, 'app/cookies/page.tsx'), 'utf8');
assert.equal(/Stripe/i.test(cookiesPage), false);
assert.equal(cookiesPage.includes('session_token'), false);
assert.match(cookiesPage, /cartaisy_token/);
assert.match(cookiesPage, /Last updated: October 2026/);
assert.equal(offerExcludes.length, 9);
for (const rel of ['app/about/page.tsx', 'app/features/page.tsx', 'app/docs/quickstart/page.tsx', 'app/fit/page.tsx']) {
  const page = readFileSync(join(root, rel), 'utf8');
  assert.equal(/August 2026|sample branded build|sample build/i.test(page), false, rel);
  assert.match(page, /homePlatform/, rel);
}
assert.match(readFileSync(join(root, 'lib/fonts/manrope.ts'), 'utf8'), /next\/font\/local/);
assert.match(readFileSync(join(root, 'lib/fonts/manrope.ts'), 'utf8'), /Manrope-Variable\.woff2/);
assert.equal(readFileSync(join(root, 'app/layout.tsx'), 'utf8').includes('manrope'), false);
assert.equal(readFileSync(join(root, 'app/dashboard/layout.tsx'), 'utf8').includes('marketingTypeClass'), false);
assert.match(readFileSync(join(root, 'app/page.tsx'), 'utf8'), /marketingTypeClass/);
assert.match(readFileSync(join(root, 'components/landing/PageLayout.tsx'), 'utf8'), /marketingTypeClass/);
assert.match(readFileSync(join(root, 'app/(auth)/layout.tsx'), 'utf8'), /marketingTypeClass/);
assert.ok(publicFaqs.length >= 12);

const operating = resolveFitOutcome({ stage: 'operating', goal: 'branded_app' });
const prelaunch = resolveFitOutcome({ stage: 'prelaunch', goal: 'branded_app' });
const other = resolveFitOutcome({ stage: 'operating', goal: 'other' });
const notShopify = resolveFitOutcome({ stage: 'not_shopify', goal: 'branded_app' });
assert.equal(operating.outcome, 'operating_fit');
assert.equal(prelaunch.outcome, 'prelaunch_fit');
assert.equal(other.outcome, 'website_first');
assert.equal(notShopify.outcome, 'website_first');
assert.equal(notShopify.title, 'Start with your Shopify store');
assert.match(notShopify.summary, /establish your Shopify store/);
assert.equal(/non-Shopify|not the next step|another product/i.test(notShopify.summary), false);
assert.match(eligibility.websiteFirst, /does not acquire customers/);
assert.match(eligibility.websiteFirst, /does not guarantee sales/);

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

const inviteSecret = 'qa-invite-token-do-not-render';

function handoffMarkup(tokenError: string) {
  const copy = signupAccessCopy(tokenError);
  assert.equal(copy.showsSignupForm, false);
  const markup = renderToStaticMarkup(createElement(SignupAccessHandoff, { tokenError }));
  assert.equal(markup.includes(inviteSecret), false);
  assert.equal(markup.includes(tokenError), false);
  assert.match(markup, /href="\/fit"/);
  assert.match(markup, /href="\/schedule-demo"/);
  assert.match(markup, /href="\/login"/);
  assert.match(markup, /Check if Cartaisy fits your store/);
  assert.match(markup, /Request a walkthrough/);
  assert.match(markup, /Go to login/);
  assert.equal(/<form[\s>]/.test(markup), false);
  assert.equal(markup.includes('Create account'), false);
  assert.equal(markup.includes('Valid onboarding link'), false);
  assert.equal(markup.includes('/api/auth/signup'), false);
  return markup;
}

const missingInvite = signupTokenFailure({ token: null, validation: null });
assert.equal(missingInvite.ok, false);
if (!missingInvite.ok) {
  assert.equal(missingInvite.tokenError, 'no_token');
  assert.match(handoffMarkup(missingInvite.tokenError), /Access required/);
  assert.match(handoffMarkup(missingInvite.tokenError), /invite-only/);
}

const invalidInvite = signupTokenFailure({
  token: inviteSecret,
  validation: { valid: false, error: `Invalid token ${inviteSecret}` },
});
assert.equal(invalidInvite.ok, false);
if (!invalidInvite.ok) {
  assert.match(handoffMarkup(invalidInvite.tokenError), /Invalid link/);
  assert.match(handoffMarkup(invalidInvite.tokenError), /invalid or has been revoked/);
}

const expiredInvite = signupTokenFailure({
  token: inviteSecret,
  validation: { valid: false, error: `Token has expired ${inviteSecret}` },
});
assert.equal(expiredInvite.ok, false);
if (!expiredInvite.ok) {
  assert.match(handoffMarkup(expiredInvite.tokenError), /Link expired/);
  assert.match(handoffMarkup(expiredInvite.tokenError), /signup link has expired/);
}

const usedInvite = signupTokenFailure({
  token: inviteSecret,
  validation: { valid: false, error: 'Token has already been used' },
});
assert.equal(usedInvite.ok, false);
if (!usedInvite.ok) {
  assert.match(handoffMarkup(usedInvite.tokenError), /already been used/);
  assert.match(handoffMarkup(usedInvite.tokenError), /Sign in if this is your account/);
}

const validInvite = signupTokenFailure({
  token: inviteSecret,
  validation: { valid: true },
});
assert.equal(validInvite.ok, true);
assert.match(signup, /Already have an account/);

function jsonPost(path: string, body: unknown, ip: string) {
  return new NextRequest(`http://localhost${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  });
}

function assertNoSuccessOutcome(body: Record<string, unknown>) {
  assert.equal(Object.hasOwn(body, 'success'), false);
  assert.equal(Object.hasOwn(body, 'outcome'), false);
  assert.equal(Object.hasOwn(body, 'title'), false);
  assert.equal(Object.hasOwn(body, 'summary'), false);
  const encoded = JSON.stringify(body);
  assert.equal(encoded.includes('operating_fit'), false);
  assert.equal(encoded.includes('prelaunch_fit'), false);
  assert.equal(encoded.includes('website_first'), false);
  assert.equal(encoded.includes('Message sent successfully'), false);
  assert.equal(encoded.includes('Request received'), false);
  assert.equal(encoded.includes('Cartaisy may fit your store'), false);
}

const qaProspects = [
  {
    _id: 'fit-operating',
    kind: 'fit' as const,
    name: 'Amina Operating',
    email: 'operating@example.com',
    storeUrl: 'https://operating.example',
    stage: 'operating',
    goal: 'branded_app',
    outcome: 'operating_fit',
    outcomeTitle: 'Cartaisy may fit your store',
    note: 'Selling now',
    createdAt: new Date('2026-10-05T00:00:00.000Z'),
  },
  {
    _id: 'fit-prelaunch',
    kind: 'fit' as const,
    name: 'Noor Prelaunch',
    email: 'prelaunch@example.com',
    stage: 'prelaunch',
    goal: 'branded_app',
    outcome: 'prelaunch_fit',
    outcomeTitle: 'Start with the Shopify store',
    createdAt: new Date('2026-10-05T01:00:00.000Z'),
  },
  {
    _id: 'fit-website',
    kind: 'fit' as const,
    name: 'Sam Website',
    email: 'website@example.com',
    stage: 'not_shopify',
    goal: 'other',
    outcome: 'website_first',
    outcomeTitle: 'Start with your Shopify store',
    createdAt: new Date('2026-10-05T02:00:00.000Z'),
  },
  {
    _id: 'walk-qa',
    kind: 'walkthrough' as const,
    name: 'Walk Person',
    email: 'walk@example.com',
    preferredWindow: 'Tuesday morning',
    note: 'Please walk through Connect.',
    createdAt: new Date('2026-10-05T03:00:00.000Z'),
  },
];

const qaContacts = [
  {
    _id: 'contact-qa',
    name: 'Contact Person',
    email: 'contact@example.com',
    subject: 'Sales',
    message: 'Can you tell me about setup?',
    createdAt: new Date('2026-10-05T04:00:00.000Z'),
  },
];

async function leadInboxCase(input: {
  session: unknown;
  token: string | null;
  operator: boolean;
}) {
  let operatorCalls = 0;
  let prospectCalls = 0;
  let contactCalls = 0;
  setLeadInboxAdaptersForTests({
    getSession: async () => input.session,
    getToken: async () => input.token,
    isPlatformOperator: async () => {
      operatorCalls += 1;
      return input.operator;
    },
    findProspects: async () => {
      prospectCalls += 1;
      return qaProspects;
    },
    findContacts: async () => {
      contactCalls += 1;
      return qaContacts;
    },
  });
  const response = await getLeadInbox(new NextRequest('http://localhost/api/admin/leads'));
  const body = (await response.json()) as { error?: string; leads?: Array<Record<string, unknown>> };
  return { response, body, operatorCalls, prospectCalls, contactCalls };
}

async function runRouteFixtures() {
const unsignedInbox = await leadInboxCase({ session: null, token: null, operator: false });
assert.equal(unsignedInbox.response.status, 401);
assert.equal(unsignedInbox.body.error, 'Sign in required.');
assert.equal(unsignedInbox.operatorCalls, 0);
assert.equal(unsignedInbox.prospectCalls, 0);
assert.equal(unsignedInbox.contactCalls, 0);
assert.equal(Object.hasOwn(unsignedInbox.body, 'leads'), false);

const tokenOnlyInbox = await leadInboxCase({
  session: null,
  token: 'fixture-token-without-session',
  operator: true,
});
assert.equal(tokenOnlyInbox.response.status, 401);
assert.equal(tokenOnlyInbox.body.error, 'Sign in required.');
assert.equal(tokenOnlyInbox.operatorCalls, 0);
assert.equal(tokenOnlyInbox.prospectCalls, 0);
assert.equal(tokenOnlyInbox.contactCalls, 0);

const merchantInbox = await leadInboxCase({
  session: { user: { id: 'merchant-1', email: 'merchant@example.com' } },
  token: 'fixture-merchant-token',
  operator: false,
});
assert.equal(merchantInbox.response.status, 403);
assert.equal(merchantInbox.body.error, 'Operators only.');
assert.equal(merchantInbox.operatorCalls, 1);
assert.equal(merchantInbox.prospectCalls, 0);
assert.equal(merchantInbox.contactCalls, 0);
assert.equal(Object.hasOwn(merchantInbox.body, 'leads'), false);

const operatorInbox = await leadInboxCase({
  session: { user: { id: 'operator-1', email: 'operator@example.com' } },
  token: 'fixture-operator-token',
  operator: true,
});
assert.equal(operatorInbox.response.status, 200);
assert.equal(operatorInbox.operatorCalls, 1);
assert.equal(operatorInbox.prospectCalls, 1);
assert.equal(operatorInbox.contactCalls, 1);
const operatorLeads = operatorInbox.body.leads;
assert.ok(operatorLeads);
assert.equal(operatorLeads.length, 5);
assert.deepEqual(
  operatorLeads.map((lead) => lead.kind),
  ['contact', 'walkthrough', 'fit', 'fit', 'fit']
);
assert.deepEqual(
  operatorLeads.map((lead) => lead.outcome ?? null),
  [null, null, 'website_first', 'prelaunch_fit', 'operating_fit']
);
assert.deepEqual(
  operatorLeads.map((lead) => lead.createdAt),
  [
    '2026-10-05T04:00:00.000Z',
    '2026-10-05T03:00:00.000Z',
    '2026-10-05T02:00:00.000Z',
    '2026-10-05T01:00:00.000Z',
    '2026-10-05T00:00:00.000Z',
  ]
);
for (const lead of operatorLeads) {
  assert.equal(typeof lead.id, 'string');
  assert.ok(lead.id);
  assert.equal(typeof lead.email, 'string');
  assert.match(String(lead.email), /@example\.com$/);
  assert.equal(typeof lead.createdAt, 'string');
  assert.equal(typeof lead.name, 'string');
  const kind = lead.kind;
  assert.ok(kind === 'fit' || kind === 'walkthrough' || kind === 'contact');
  assert.equal(typeof leadKindLabel[kind], 'string');
  if (kind === 'fit') {
    assert.ok(lead.outcome === 'operating_fit' || lead.outcome === 'prelaunch_fit' || lead.outcome === 'website_first');
    assert.equal(typeof lead.outcomeTitle, 'string');
  }
}
assert.equal(operatorLeads[0]?.subject, 'Sales');
assert.equal(operatorLeads[0]?.message, 'Can you tell me about setup?');
assert.equal(leadKindLabel.contact, 'Contact');
assert.equal(operatorLeads[1]?.preferredWindow, 'Tuesday morning');
assert.equal(leadKindLabel.walkthrough, 'Walkthrough');
assert.equal(JSON.stringify(operatorLeads).includes('ipAddress'), false);
setLeadInboxAdaptersForTests(null);

resetRateLimitForTests();
const fitOrder: string[] = [];
try {
  setFitRouteAdaptersForTests({
    saveProspectLead: async (lead) => {
      fitOrder.push('save');
      assert.equal(lead.kind, 'fit');
      assert.equal(lead.outcome, 'operating_fit');
    },
    resolveOutcome: (answers) => {
      fitOrder.push('outcome');
      return resolveFitOutcome(answers);
    },
  });
  const saved = await postFit(
    jsonPost(
      '/api/fit',
      {
        name: 'Amina',
        email: 'amina@example.com',
        stage: 'operating',
        goal: 'branded_app',
        storeUrl: 'https://example.com',
      },
      '203.0.113.21'
    )
  );
  assert.equal(saved.status, 200);
  const savedBody = (await saved.json()) as { success?: boolean; outcome?: string };
  assert.equal(savedBody.success, true);
  assert.equal(savedBody.outcome, 'operating_fit');
  assert.deepEqual(fitOrder, ['save', 'outcome']);

  fitOrder.length = 0;
  setFitRouteAdaptersForTests({
    saveProspectLead: async () => {
      fitOrder.push('save');
      throw new Error('fixture-save-failed');
    },
    resolveOutcome: (answers) => {
      fitOrder.push('outcome');
      return resolveFitOutcome(answers);
    },
  });
  const failedFit = await postFit(
    jsonPost(
      '/api/fit',
      {
        name: 'Amina',
        email: 'amina@example.com',
        stage: 'operating',
        goal: 'branded_app',
        storeUrl: 'https://example.com',
      },
      '203.0.113.22'
    )
  );
  assert.equal(failedFit.status, 503);
  const failedFitBody = (await failedFit.json()) as Record<string, unknown>;
  assertNoSuccessOutcome(failedFitBody);
  assert.equal(typeof failedFitBody.error, 'string');
  assert.deepEqual(fitOrder, ['save']);
} finally {
  setFitRouteAdaptersForTests(null);
}

try {
  setWalkthroughSaveForTests(async () => {
    throw new Error('fixture-save-failed');
  });
  const failedWalk = await postWalkthrough(
    jsonPost(
      '/api/walkthrough',
      {
        name: 'Noor',
        email: 'noor@example.com',
        storeUrl: '',
        preferredWindow: 'Tuesday morning',
      },
      '203.0.113.23'
    )
  );
  assert.equal(failedWalk.status, 503);
  const failedWalkBody = (await failedWalk.json()) as Record<string, unknown>;
  assertNoSuccessOutcome(failedWalkBody);
  assert.equal(typeof failedWalkBody.error, 'string');
} finally {
  setWalkthroughSaveForTests(null);
}

try {
  setContactCreateForTests(async () => {
    throw new Error('fixture-save-failed');
  });
  const failedContact = await postContact(
    jsonPost(
      '/api/contact',
      {
        name: 'Sam',
        email: 'sam@example.com',
        subject: 'Sales',
        message: 'Can you tell me about setup?',
      },
      '203.0.113.24'
    )
  );
  assert.equal(failedContact.status, 503);
  const failedContactBody = (await failedContact.json()) as Record<string, unknown>;
  assertNoSuccessOutcome(failedContactBody);
  assert.equal(typeof failedContactBody.error, 'string');
  assert.equal(failedContactBody.error, 'Failed to send message. Please try again.');
} finally {
  setContactCreateForTests(null);
}
}

runRouteFixtures()
  .then(() => {
    console.log('c01 commercial checks passed');
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
