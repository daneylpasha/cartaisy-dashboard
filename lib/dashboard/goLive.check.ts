import assert from 'node:assert/strict';
import { buildGoLive, type GoLiveInput } from './goLive';
import { APP_BUILDER_PUBLISH_HREF, homeLayoutOverviewFromPayload } from '@/lib/homeLayout/publish';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

function input(extra?: Partial<GoLiveInput>): GoLiveInput {
  return {
    catalogBlock: null,
    syncState: 'succeeded',
    syncLabel: 'Synced',
    syncDetail: null,
    catalogEligible: true,
    brand: { known: true, displayName: 'Northwind', hasIcon: true },
    homeLayout: {
      status: 'published',
      label: 'Published',
      detail: 'The installed app reads this section order under the home header.',
      needsPublish: false,
    },
    preview: 'ready',
    previewDetail: null,
    accounts: { known: true, apple: 'missing', google: 'missing' },
    submitKnown: true,
    submitNotices: [],
    ...extra,
  };
}

function step(model: ReturnType<typeof buildGoLive>, id: string) {
  const found = model.steps.find((item) => item.id === id);
  if (!found) throw new Error(`missing ${id}`);
  return found;
}

const submitNext = buildGoLive(input());
assert.equal(step(submitNext, 'shopify').tone, 'done');
assert.equal(step(submitNext, 'catalog').tone, 'done');
assert.equal(step(submitNext, 'brand').tone, 'done');
assert.equal(step(submitNext, 'home').tone, 'done');
assert.equal(step(submitNext, 'preview').tone, 'done');
assert.equal(step(submitNext, 'accounts').tone, 'quiet');
assert.equal(step(submitNext, 'submit').tone, 'current');
assert.equal(submitNext.cta?.href, BUILD_MY_APP_HREF);
assert.equal(submitNext.cta?.label, 'Open Build');
assert.equal(submitNext.readyCount, 5);
assert.equal(submitNext.stepCount, submitNext.steps.length);
assert.equal(submitNext.stepCount, 7);
assert.equal(
  submitNext.readyCount,
  submitNext.steps.filter((item) => item.tone === 'done').length
);
assert.equal(submitNext.steps.filter((item) => item.tone === 'current').length, 1);
assert.equal(submitNext.cta?.label.includes('Submit to'), false);

const accountsDoNotBlock = buildGoLive(
  input({
    accounts: { known: true, apple: 'connected', google: 'needsAttention' },
    submitNotices: [
      {
        platform: 'ios',
        label: 'iOS',
        tone: 'submitted',
        headline: 'Sent to App Store Connect',
        body: 'Apple reviews this before it is available.',
      },
    ],
  })
);
assert.equal(accountsDoNotBlock.cta, null);
assert.equal(step(accountsDoNotBlock, 'submit').tone, 'done');
assert.equal(step(accountsDoNotBlock, 'accounts').tone, 'quiet');
assert.equal(accountsDoNotBlock.headline, 'Sent for review.');
assert.equal(accountsDoNotBlock.readyCount, 6);
assert.equal(accountsDoNotBlock.stepCount, 7);

const accountsDone = buildGoLive(
  input({
    accounts: { known: true, apple: 'connected', google: 'connected' },
    submitNotices: [
      {
        platform: 'ios',
        label: 'iOS',
        tone: 'submitted',
        headline: 'Sent to App Store Connect',
        body: 'Apple reviews this before it is available.',
      },
    ],
  })
);
assert.equal(step(accountsDone, 'accounts').tone, 'done');
assert.equal(accountsDone.readyCount, 7);
assert.equal(accountsDone.stepCount, 7);
assert.equal(accountsDone.headline, 'Sent for review.');

const missingIcon = buildGoLive(input({ brand: { known: true, displayName: 'Northwind', hasIcon: false } }));
assert.equal(step(missingIcon, 'brand').tone, 'current');
assert.equal(step(missingIcon, 'brand').status, 'Icon needed');
assert.equal(missingIcon.cta?.href, '/dashboard/onboarding?step=brand');
assert.equal(step(missingIcon, 'catalog').tone, 'done');

const missingName = buildGoLive(input({ brand: { known: true, displayName: null, hasIcon: true } }));
assert.equal(step(missingName, 'brand').status, 'Name needed');
assert.notEqual(step(missingName, 'brand').tone, 'done');

const brandUnknown = buildGoLive(input({ brand: { known: false, displayName: null, hasIcon: false } }));
assert.equal(step(brandUnknown, 'brand').status, 'Could not check');
assert.equal(step(brandUnknown, 'brand').uncertain, true);
assert.notEqual(step(brandUnknown, 'brand').tone, 'done');
assert.equal(brandUnknown.headline, 'Brand could not be checked.');
assert.equal(brandUnknown.cta?.label, 'Open Brand');

const draft = buildGoLive(
  input({
    homeLayout: {
      status: 'draft',
      label: 'Draft',
      detail: 'These edits are not in the section order the installed app reads.',
      needsPublish: true,
    },
  })
);
assert.equal(step(draft, 'home').tone, 'current');
assert.equal(draft.cta?.href, APP_BUILDER_PUBLISH_HREF);
assert.equal(draft.cta?.label, 'Publish home');
assert.equal(step(draft, 'preview').tone, 'done');

const unpublished = buildGoLive(
  input({
    homeLayout: {
      status: 'not_published',
      label: 'Not published yet',
      detail: 'Nothing is saved as the section order yet.',
      needsPublish: true,
    },
  })
);
assert.equal(step(unpublished, 'home').status, 'Not published yet');
assert.notEqual(step(unpublished, 'home').tone, 'done');

const offlineDraft = homeLayoutOverviewFromPayload({
  data: {
    status: 'draft',
    sections: [{ type: 'carousel', isVisible: true, position: 0 }],
    publishedSections: [],
    publishedAt: null,
  },
});
assert.ok(offlineDraft);
const offlineHome = buildGoLive(input({ homeLayout: offlineDraft }));
assert.equal(step(offlineHome, 'home').status, 'Draft');
assert.match(step(offlineHome, 'home').detail ?? '', /smart default/);
assert.equal(step(offlineHome, 'home').tone, 'current');
assert.equal(offlineHome.cta?.label, 'Publish home');
assert.equal(offlineHome.cta?.href, APP_BUILDER_PUBLISH_HREF);

const homeUnknown = buildGoLive(input({ homeLayout: null }));
assert.equal(step(homeUnknown, 'home').status, 'Could not check');
assert.equal(step(homeUnknown, 'home').tone, 'current');
assert.equal(homeUnknown.cta?.label, 'Open app builder');
assert.equal(homeUnknown.cta?.href.includes('publish-home'), false);
assert.equal(step(homeUnknown, 'preview').tone, 'done');

const notEligible = buildGoLive(
  input({ catalogEligible: false, syncState: 'succeeded', syncLabel: 'Synced' })
);
assert.notEqual(step(notEligible, 'catalog').tone, 'done');
assert.equal(step(notEligible, 'catalog').status, 'Not ready for a build');
assert.equal(notEligible.cta?.href, '/dashboard/settings#shopify-connection');

const syncing = buildGoLive(
  input({ catalogEligible: false, syncState: 'in_progress', syncLabel: 'Syncing' })
);
assert.equal(step(syncing, 'catalog').status, 'Syncing');
assert.equal(step(syncing, 'catalog').tone, 'current');

const unread = buildGoLive(
  input({ catalogEligible: null, syncState: 'unavailable', syncLabel: 'Could not check' })
);
assert.equal(step(unread, 'catalog').status, 'Could not check');
assert.equal(step(unread, 'catalog').uncertain, true);
assert.notEqual(step(unread, 'catalog').tone, 'done');

const billing = buildGoLive(
  input({ catalogBlock: 'billing', catalogEligible: false, syncState: 'failed', syncLabel: 'Billing needs attention' })
);
assert.equal(step(billing, 'shopify').tone, 'current');
assert.equal(step(billing, 'catalog').status, 'Blocked');
assert.notEqual(step(billing, 'catalog').tone, 'done');
assert.equal(billing.cta, null);
assert.equal(billing.headline, 'Shopify billing needs attention.');
assert.equal(billing.readyCount, billing.steps.filter((item) => item.tone === 'done').length);
assert.equal(billing.stepCount, billing.steps.length);

const publishedBilling = buildGoLive(
  input({
    catalogBlock: 'billing',
    catalogEligible: false,
    syncState: 'failed',
    syncLabel: 'Billing needs attention',
    brand: { known: true, displayName: null, hasIcon: false },
    preview: 'none',
  })
);
assert.equal(step(publishedBilling, 'shopify').tone, 'current');
assert.equal(step(publishedBilling, 'home').tone, 'done');
assert.equal(step(publishedBilling, 'accounts').tone, 'quiet');
assert.equal(step(publishedBilling, 'submit').tone, 'waiting');
assert.equal(publishedBilling.readyCount, 1);
assert.equal(publishedBilling.stepCount, 7);

const reconnect = buildGoLive(input({ catalogBlock: 'reconnect', catalogEligible: false }));
assert.equal(reconnect.cta, null);
assert.equal(step(reconnect, 'shopify').status, 'Reconnect needed');

const building = buildGoLive(input({ preview: 'building', previewDetail: null }));
assert.equal(step(building, 'preview').tone, 'current');
assert.equal(step(building, 'preview').status, 'Building');
assert.match(step(building, 'preview').detail ?? '', /Your preview is building/);
assert.equal(building.cta?.href, BUILD_MY_APP_HREF);

const previewUnknown = buildGoLive(input({ preview: 'unknown' }));
assert.equal(step(previewUnknown, 'preview').status, 'Could not check');
assert.notEqual(step(previewUnknown, 'preview').tone, 'done');

const failedSubmit = buildGoLive(
  input({
    submitNotices: [
      {
        platform: 'android',
        label: 'Android',
        tone: 'failed',
        headline: 'This submit did not finish',
        body: 'This submit did not finish. You can try again.',
      },
    ],
  })
);
assert.equal(step(failedSubmit, 'submit').tone, 'current');
assert.equal(failedSubmit.cta?.label, 'Open Build to try again');
assert.notEqual(step(failedSubmit, 'submit').tone, 'done');

const submitUnknown = buildGoLive(input({ submitKnown: false, submitNotices: [] }));
assert.equal(step(submitUnknown, 'submit').status, 'Could not check');
assert.equal(step(submitUnknown, 'submit').uncertain, true);
assert.notEqual(step(submitUnknown, 'submit').status, 'Not submitted');
assert.equal(submitUnknown.headline, 'Submit status could not be checked.');

const accountsUnknown = buildGoLive(
  input({ accounts: { known: false, apple: null, google: null } })
);
assert.equal(step(accountsUnknown, 'accounts').tone, 'unknown');
assert.equal(step(accountsUnknown, 'submit').tone, 'current');
assert.notEqual(step(accountsUnknown, 'accounts').tone, 'current');

const succeededFlagOnly = buildGoLive(
  input({ catalogEligible: true, syncState: 'failed', syncLabel: 'Sync did not finish' })
);
assert.notEqual(step(succeededFlagOnly, 'catalog').tone, 'done');

console.log('go live checks passed');
