import assert from 'node:assert/strict';
import {
  ACCESS_NOTES_MAX,
  BUILD_STATUS_POLL_MS,
  buildCreatePayload,
  isSettledBuildRequest,
  messageForCreateFailure,
  normalizeBuildRequest,
  normalizeBuildRequestList,
  outcomeCopy,
  platformStatusLabel,
  primaryBuildAction,
  shouldPollBuildRequest,
  type BuildRequest,
} from './contract.ts';

const eligible = {
  enabled: true,
  reason: null,
  action: null,
};

function request(partial: {
  android: BuildRequest['platforms']['android']['status'];
  ios: BuildRequest['platforms']['ios']['status'];
  notes?: string | null;
}): BuildRequest {
  return {
    id: '66f1c2e0a1b2c3d4e5f60718',
    platforms: {
      android: { status: partial.android },
      ios: { status: partial.ios },
    },
    accessNotes: partial.notes ?? null,
  };
}

assert.ok(BUILD_STATUS_POLL_MS >= 2000 && BUILD_STATUS_POLL_MS <= 8000);
assert.equal(ACCESS_NOTES_MAX, 280);

assert.equal(platformStatusLabel('ios', 'waiting_on_merchant'), 'Waiting on Apple');
assert.equal(platformStatusLabel('android', 'waiting_on_merchant'), 'Waiting on you');
assert.equal(platformStatusLabel('android', 'ready'), 'Ready');
assert.equal(platformStatusLabel('ios', 'building'), 'Building');
assert.equal(platformStatusLabel('android', 'failed'), 'Failed');
assert.equal(platformStatusLabel('ios', 'queued'), 'Queued');
assert.equal(platformStatusLabel('android', 'not_requested'), 'Not requested');
assert.equal(platformStatusLabel('ios', 'unknown'), 'Updating');

const moving = request({ android: 'ready', ios: 'waiting_on_merchant' });
assert.equal(shouldPollBuildRequest(moving), true);
assert.equal(isSettledBuildRequest(moving), false);

const settled = request({ android: 'ready', ios: 'failed' });
assert.equal(shouldPollBuildRequest(settled), false);
assert.equal(isSettledBuildRequest(settled), true);
assert.equal(outcomeCopy(settled), 'One app is ready. The other did not finish.');

const bothReady = request({ android: 'ready', ios: 'ready' });
assert.equal(shouldPollBuildRequest(bothReady), false);
assert.equal(outcomeCopy(bothReady), 'Android and iOS are ready.');

const androidOnly = request({ android: 'queued', ios: 'not_requested' });
assert.equal(shouldPollBuildRequest(androidOnly), true);
assert.equal(shouldPollBuildRequest(request({ android: 'failed', ios: 'not_requested' })), false);
assert.equal(shouldPollBuildRequest(request({ android: 'building', ios: 'ready' })), true);

const created = normalizeBuildRequest({
  success: true,
  data: {
    id: '66f1c2e0a1b2c3d4e5f60718',
    storeId: '66f1c2e0a1b2c3d4e5f60710',
    requestedBy: '66f1c2e0a1b2c3d4e5f60711',
    easBuildId: 'should-not-surface',
    platforms: {
      android: { status: 'queued', updatedAt: '2026-09-23T20:00:00.000Z' },
      ios: { status: 'not_requested', updatedAt: '2026-09-23T20:00:00.000Z' },
    },
    checklist: { accessNotes: 'Apple developer invite sent.' },
    createdAt: '2026-09-23T20:00:00.000Z',
  },
});
assert.ok(created);
assert.equal(created?.platforms.android.status, 'queued');
assert.equal(created?.platforms.ios.status, 'not_requested');
assert.equal(created?.accessNotes, 'Apple developer invite sent.');
assert.equal('storeId' in (created as object), false);
assert.equal('easBuildId' in (created as object), false);

assert.equal(normalizeBuildRequest({ data: { id: 'not-an-id', platforms: {} } }), null);

const list = normalizeBuildRequestList({
  data: {
    requests: [
      {
        id: '66f1c2e0a1b2c3d4e5f60718',
        platforms: {
          android: { status: 'ready' },
          ios: { status: 'building' },
        },
        checklist: {},
      },
      { id: 'bad' },
    ],
    count: 2,
  },
});
assert.equal(list.length, 1);
assert.equal(list[0]?.platforms.ios.status, 'building');

const payload = buildCreatePayload({
  android: true,
  ios: false,
  accessNotes: '  Play Console access granted.  ',
});
assert.equal(payload.ok, true);
if (payload.ok) {
  assert.deepEqual(payload.body, {
    android: true,
    ios: false,
    checklist: { accessNotes: 'Play Console access granted.' },
  });
  assert.deepEqual(Object.keys(payload.body), ['android', 'ios', 'checklist']);
}

const emptyNote = buildCreatePayload({ android: false, ios: true, accessNotes: '   ' });
assert.equal(emptyNote.ok, true);
if (emptyNote.ok) {
  assert.deepEqual(emptyNote.body, { android: false, ios: true });
  assert.equal('checklist' in emptyNote.body, false);
}

assert.equal(buildCreatePayload({ android: false, ios: false, accessNotes: '' }).ok, false);
assert.equal(
  buildCreatePayload({ android: true, ios: true, accessNotes: 'x'.repeat(281) }).ok,
  false
);

assert.deepEqual(
  messageForCreateFailure(409, {
    success: false,
    error: 'Sync the catalog successfully before requesting a build. Use Sync again.',
    code: 'BUILD_NOT_ELIGIBLE',
    reason: 'catalog_sync_not_succeeded',
  }),
  { kind: 'ineligible', reason: 'catalog_sync_not_succeeded' }
);
assert.deepEqual(
  messageForCreateFailure(409, {
    success: false,
    error: 'Connect Shopify before requesting a build.',
    code: 'BUILD_NOT_ELIGIBLE',
    reason: 'shopify_not_connected',
  }),
  { kind: 'ineligible', reason: 'shopify_not_connected' }
);
const technicalFailure = messageForCreateFailure(500, { error: 'EAS worker exploded', stack: 'secret' });
assert.equal(technicalFailure.kind, 'error');
if (technicalFailure.kind === 'error') {
  assert.equal(technicalFailure.message.includes('EAS'), false);
}

assert.deepEqual(
  primaryBuildAction({
    availability: { enabled: false, action: 'connect', reason: 'Connect Shopify before requesting a build.' },
    mode: 'compose',
    submitting: false,
    syncBusy: false,
    canSubmit: true,
  }),
  { kind: 'connect', label: 'Connect Shopify', disabled: false }
);
assert.deepEqual(
  primaryBuildAction({
    availability: { enabled: false, action: 'sync', reason: 'Your catalog has not synced yet. Use Sync again.' },
    mode: 'compose',
    submitting: false,
    syncBusy: false,
    canSubmit: true,
  }),
  { kind: 'sync', label: 'Sync again', disabled: false }
);
assert.equal(
  primaryBuildAction({
    availability: { enabled: false, action: 'sync', reason: 'Syncing your catalog…' },
    mode: 'compose',
    submitting: false,
    syncBusy: true,
    canSubmit: false,
  }).disabled,
  true
);
assert.equal(
  primaryBuildAction({
    availability: eligible,
    mode: 'compose',
    submitting: false,
    syncBusy: false,
    canSubmit: false,
  }).disabled,
  true
);
assert.equal(
  primaryBuildAction({
    availability: eligible,
    mode: 'status',
    submitting: false,
    syncBusy: false,
    canSubmit: true,
  }).kind,
  'none'
);

console.log('build contract ok');
