import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isOnboardingWizardPath } from '@/lib/cookies';

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

console.log('cookie banner deferral checks passed');
