import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { consentAfterPreferencesDismiss, gtagStorageConsent, isOnboardingWizardPath, optionalAnalyticsAllowed } from '@/lib/cookies';

const here = dirname(fileURLToPath(import.meta.url));
const bannerSource = readFileSync(join(here, '../components/cookies/CookieBanner.tsx'), 'utf8');

assert.equal(isOnboardingWizardPath('/dashboard/onboarding'), true);
assert.equal(isOnboardingWizardPath('/dashboard/onboarding/'), true);
assert.equal(isOnboardingWizardPath('/dashboard/onboarding?step=brand'), true);
assert.equal(isOnboardingWizardPath('/dashboard/onboarding#brand'), true);
assert.equal(isOnboardingWizardPath('/dashboard/onboarding/extra'), true);
assert.equal(isOnboardingWizardPath('/dashboard'), false);
assert.equal(isOnboardingWizardPath('/dashboard/settings'), false);
assert.equal(isOnboardingWizardPath('/dashboard/onboarding-tokens'), false);
assert.equal(isOnboardingWizardPath('/'), false);
assert.equal(isOnboardingWizardPath('/cookies'), false);
assert.equal(isOnboardingWizardPath(null), false);
assert.equal(isOnboardingWizardPath(undefined), false);

assert.match(bannerSource, /isOnboardingWizardPath\(pathname\)/);
assert.match(bannerSource, /if \(!showBanner \|\| isOnboardingWizardPath\(pathname\)\) return null/);
assert.match(bannerSource, /Your privacy choices/);
assert.match(bannerSource, /Essential cookies keep this site working\. Optional analytics and marketing cookies stay off unless you allow them\./);
assert.match(bannerSource, /href="\/cookies"/);
assert.match(bannerSource, /Customize[\s\S]*Reject All[\s\S]*Accept All/);
assert.match(bannerSource, /Save preferences/);
assert.match(bannerSource, /role="switch"/);
assert.match(bannerSource, /role=\{showDetails \? 'dialog' : 'region'\}/);
assert.match(bannerSource, /consentAfterPreferencesDismiss\(consent\)/);
assert.match(bannerSource, /dismissRef\.current\(\)/);
assert.equal(bannerSource.includes('Cookies run this site'), false);

const storedOff = { necessary: true, analytics: false, marketing: false };
const dismissed = consentAfterPreferencesDismiss(storedOff);
assert.equal(dismissed.necessary, true);
assert.equal(dismissed.analytics, false);
assert.equal(dismissed.marketing, false);
const storedOn = consentAfterPreferencesDismiss({ necessary: true, analytics: true, marketing: false });
assert.equal(storedOn.analytics, true);
assert.equal(storedOn.marketing, false);
assert.equal(optionalAnalyticsAllowed(null), false);
assert.equal(optionalAnalyticsAllowed(storedOff), false);
assert.equal(optionalAnalyticsAllowed({ analytics: false, marketing: true }), false);
assert.equal(optionalAnalyticsAllowed(storedOn), true);
assert.deepEqual(gtagStorageConsent(storedOn), { analytics_storage: 'granted', ad_storage: 'denied' });
assert.deepEqual(gtagStorageConsent({ analytics: false, marketing: true }), {
  analytics_storage: 'denied',
  ad_storage: 'granted',
});
assert.deepEqual(gtagStorageConsent(null), { analytics_storage: 'denied', ad_storage: 'denied' });

console.log('cookie banner deferral checks passed');
