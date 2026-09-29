import assert from 'node:assert/strict';
import {
  CONNECT_APPLE_DEVELOPER,
  CONNECT_GOOGLE_PLAY,
  EMPTY_STORE_SUBMITS,
  SUBMIT_ACCOUNTS_UNAVAILABLE_MESSAGE,
  SUBMIT_ATTENTION_APPLE,
  SUBMIT_FAILED_FALLBACK_MESSAGE,
  SUBMIT_FAILED_TITLE,
  SUBMIT_MISSING_GOOGLE,
  SUBMIT_NOT_READY_MESSAGE,
  SUBMIT_QUEUED_COPY,
  SUBMIT_REVIEW_ANDROID,
  SUBMIT_REVIEW_IOS,
  SUBMIT_SENT_ANDROID_TITLE,
  SUBMIT_SENT_IOS_TITLE,
  SUBMIT_SIGN_IN_MESSAGE,
  SUBMIT_START_FAILED_MESSAGE,
  homeSubmitNotices,
  homeSubmitTitle,
  interpretSubmitStart,
  isSafeMerchantText,
  messageForSubmitFailure,
  normalizeStoreSubmit,
  normalizeStoreSubmitList,
  presentStoreSubmit,
  shouldPollStoreSubmit,
} from './contract.ts';

const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const JOB_ID = '66f1c2e0a1b2c3d4e5f60720';
const PEM = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';

function job(overrides: Record<string, unknown> = {}) {
  return {
    id: JOB_ID,
    buildRequestId: REQUEST_ID,
    platform: 'ios',
    status: 'submitting',
    createdAt: '2026-09-28T20:00:00.000Z',
    updatedAt: '2026-09-28T20:00:01.000Z',
    ...overrides,
  };
}

const normalized = normalizeStoreSubmit({
  success: true,
  data: {
    ...job(),
    easBuildId: 'should-not-surface',
    easSubmissionId: 'also-hidden',
    privateKey: PEM,
    message: 'The store did not accept this build. Check the store listing, then try again.',
  },
});
assert.ok(normalized);
assert.equal(normalized?.status, 'submitting');
assert.equal(normalized?.message, null);
assert.equal('easBuildId' in (normalized as object), false);
assert.equal(JSON.stringify(normalized).includes('BEGIN PRIVATE'), false);
assert.equal(JSON.stringify(normalized).includes('should-not-surface'), false);

const failed = normalizeStoreSubmit({
  data: job({
    status: 'failed',
    platform: 'android',
    message: 'The store did not accept this build. Check the store listing, then try again.',
  }),
});
assert.equal(failed?.platform, 'android');
assert.equal(failed?.message, 'The store did not accept this build. Check the store listing, then try again.');

const poisoned = normalizeStoreSubmit({
  data: job({ status: 'failed', message: PEM }),
});
assert.equal(poisoned?.message, null);
assert.equal(JSON.stringify(poisoned).includes('BEGIN'), false);

const submittedWithMessage = normalizeStoreSubmit({
  data: job({ status: 'submitted', message: 'hidden on success' }),
});
assert.equal(submittedWithMessage?.message, null);

assert.equal(normalizeStoreSubmit({ data: job({ id: 'not-an-id' }) }), null);
assert.equal(normalizeStoreSubmit({ data: job({ platform: 'web' }) }), null);
assert.equal(isSafeMerchantText(PEM), false);
assert.equal(isSafeMerchantText('{"private_key":"secret"}'), false);

const list = normalizeStoreSubmitList({
  success: true,
  data: {
    submits: [
      job({ platform: 'ios', updatedAt: '2026-09-28T20:00:00.000Z', status: 'failed', message: 'The store submit took too long. Try again.' }),
      job({
        id: '66f1c2e0a1b2c3d4e5f60721',
        platform: 'ios',
        updatedAt: '2026-09-28T21:00:00.000Z',
        status: 'submitted',
      }),
      job({ platform: 'android', status: 'queued', privateKey: PEM }),
      { platform: 'ios', privateKey: PEM },
    ],
  },
});
assert.equal(list.ios?.status, 'submitted');
assert.equal(list.ios?.id, '66f1c2e0a1b2c3d4e5f60721');
assert.equal(list.android?.status, 'queued');
assert.equal(JSON.stringify(list).includes('BEGIN'), false);
assert.deepEqual(normalizeStoreSubmitList({ data: { submits: [] } }), EMPTY_STORE_SUBMITS);

assert.equal(shouldPollStoreSubmit('queued'), true);
assert.equal(shouldPollStoreSubmit('submitting'), true);
assert.equal(shouldPollStoreSubmit('submitted'), false);
assert.equal(shouldPollStoreSubmit('failed'), false);

const readyConnected = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'ready',
  credential: 'connected',
  accountsUnavailable: false,
  job: null,
  busy: false,
  error: null,
});
assert.equal(readyConnected.label, 'Submit to App Store');
assert.equal(readyConnected.disabled, false);
assert.equal(readyConnected.state, 'idle');
assert.equal(readyConnected.showConnect, false);
assert.equal(readyConnected.connectTitle, null);
assert.equal(readyConnected.connectHref, null);

const play = presentStoreSubmit({
  platform: 'android',
  buildStatus: 'ready',
  credential: 'connected',
  accountsUnavailable: false,
  job: null,
  busy: false,
  error: null,
});
assert.equal(play.label, 'Submit to Play');
assert.equal(play.disabled, false);

const missing = presentStoreSubmit({
  platform: 'android',
  buildStatus: 'ready',
  credential: 'missing',
  accountsUnavailable: false,
  job: null,
  busy: false,
  error: null,
});
assert.equal(missing.disabled, true);
assert.equal(missing.detail, SUBMIT_MISSING_GOOGLE);
assert.equal(missing.showConnect, true);
assert.equal(missing.state, 'blocked');
assert.equal(missing.connectTitle, CONNECT_GOOGLE_PLAY);
assert.equal(missing.connectLabel, CONNECT_GOOGLE_PLAY);
assert.equal(missing.connectHref, '#google-store-account');

const attention = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'ready',
  credential: 'needsAttention',
  accountsUnavailable: false,
  job: null,
  busy: false,
  error: null,
});
assert.equal(attention.disabled, true);
assert.equal(attention.detail, SUBMIT_ATTENTION_APPLE);
assert.equal(attention.showConnect, true);
assert.equal(attention.connectTitle, CONNECT_APPLE_DEVELOPER);
assert.equal(attention.connectHref, '#apple-store-account');

const unfinished = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'building',
  credential: 'connected',
  accountsUnavailable: false,
  job: null,
  busy: false,
  error: null,
});
assert.equal(unfinished.disabled, true);
assert.equal(unfinished.detail, SUBMIT_NOT_READY_MESSAGE);
assert.equal(unfinished.showConnect, false);
assert.equal(unfinished.connectHref, null);

const accountsDown = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'ready',
  credential: 'unknown',
  accountsUnavailable: true,
  job: null,
  busy: false,
  error: null,
});
assert.equal(accountsDown.disabled, true);
assert.equal(accountsDown.detail, SUBMIT_ACCOUNTS_UNAVAILABLE_MESSAGE);
assert.equal(accountsDown.showConnect, false);
assert.equal(accountsDown.connectTitle, null);

const reviewing = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'ready',
  credential: 'connected',
  accountsUnavailable: false,
  job: normalizeStoreSubmit({ data: job({ status: 'submitted' }) }),
  busy: false,
  error: null,
});
assert.equal(reviewing.detail, SUBMIT_REVIEW_IOS);
assert.equal(reviewing.headline, SUBMIT_SENT_IOS_TITLE);
assert.equal(reviewing.nextStep, SUBMIT_REVIEW_IOS);
assert.match(SUBMIT_REVIEW_IOS, /App Store Connect/);
assert.match(SUBMIT_REVIEW_IOS, /day or two/);
assert.doesNotMatch(SUBMIT_REVIEW_IOS, /https?:\/\//);
assert.equal(reviewing.label, 'Submit again');
assert.equal(reviewing.disabled, false);
assert.equal(reviewing.quiet, true);
assert.equal(reviewing.statusLabel, 'Submitted');
assert.equal(reviewing.showConnect, false);
assert.equal(reviewing.connectLabel, null);

const playReview = presentStoreSubmit({
  platform: 'android',
  buildStatus: 'ready',
  credential: 'connected',
  accountsUnavailable: false,
  job: normalizeStoreSubmit({ data: job({ platform: 'android', status: 'submitted' }) }),
  busy: false,
  error: null,
});
assert.equal(playReview.detail, SUBMIT_REVIEW_ANDROID);
assert.equal(playReview.headline, SUBMIT_SENT_ANDROID_TITLE);
assert.match(playReview.detail ?? '', /Play Console/);
assert.match(playReview.detail ?? '', /internal testing track/);
assert.match(playReview.detail ?? '', /same day/);
assert.doesNotMatch(SUBMIT_REVIEW_ANDROID, /https?:\/\//);

const failedView = presentStoreSubmit({
  platform: 'android',
  buildStatus: 'ready',
  credential: 'connected',
  accountsUnavailable: false,
  job: poisoned,
  busy: false,
  error: null,
});
assert.equal(failedView.alert, SUBMIT_FAILED_FALLBACK_MESSAGE);
assert.equal(failedView.headline, SUBMIT_FAILED_TITLE);
assert.equal(failedView.nextStep, null);
assert.equal(failedView.label, 'Submit again');
assert.equal(failedView.disabled, false);
assert.equal((failedView.alert ?? '').includes('BEGIN'), false);

const sending = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'ready',
  credential: 'connected',
  accountsUnavailable: false,
  job: normalized,
  busy: false,
  error: null,
});
assert.equal(sending.state, 'submitting');
assert.equal(sending.disabled, true);
assert.equal(sending.statusLabel, 'Submitting');
assert.equal(sending.headline, null);
assert.equal(sending.showConnect, false);

const sendingMissing = presentStoreSubmit({
  platform: 'android',
  buildStatus: 'ready',
  credential: 'missing',
  accountsUnavailable: false,
  job: normalizeStoreSubmit({ data: job({ platform: 'android', status: 'submitting' }) }),
  busy: false,
  error: null,
});
assert.equal(sendingMissing.state, 'submitting');
assert.equal(sendingMissing.showConnect, false);
assert.equal(sendingMissing.connectHref, null);

const submittedMissing = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'ready',
  credential: 'missing',
  accountsUnavailable: false,
  job: normalizeStoreSubmit({ data: job({ status: 'submitted' }) }),
  busy: false,
  error: null,
});
assert.equal(submittedMissing.state, 'submitted');
assert.equal(submittedMissing.headline, SUBMIT_SENT_IOS_TITLE);
assert.equal(submittedMissing.nextStep, SUBMIT_REVIEW_IOS);
assert.equal(submittedMissing.showConnect, true);
assert.equal(submittedMissing.connectLabel, CONNECT_APPLE_DEVELOPER);
assert.equal(submittedMissing.connectHref, '#apple-store-account');

const waiting = presentStoreSubmit({
  platform: 'ios',
  buildStatus: 'ready',
  credential: 'connected',
  accountsUnavailable: false,
  job: normalizeStoreSubmit({ data: job({ status: 'queued' }) }),
  busy: false,
  error: null,
});
assert.equal(waiting.headline, null);
assert.equal(waiting.detail, SUBMIT_QUEUED_COPY);
assert.equal(waiting.statusLabel, 'Queued');

const iosSent = homeSubmitNotices({
  android: null,
  ios: normalizeStoreSubmit({ data: job({ status: 'submitted' }) }),
});
assert.equal(homeSubmitTitle(iosSent), 'Sent for review');
assert.equal(iosSent[0]?.headline, SUBMIT_SENT_IOS_TITLE);
assert.equal(iosSent[0]?.body, SUBMIT_REVIEW_IOS);
assert.equal(JSON.stringify(iosSent).includes('http'), false);

const poisonedHome = homeSubmitNotices({
  android: normalizeStoreSubmit({ data: job({ platform: 'android', status: 'failed', message: PEM }) }),
  ios: null,
});
assert.equal(homeSubmitTitle(poisonedHome), 'A submit needs another try');
assert.equal(poisonedHome[0]?.body, SUBMIT_FAILED_FALLBACK_MESSAGE);
assert.equal(JSON.stringify(poisonedHome).includes('BEGIN'), false);

const movingHome = homeSubmitNotices({
  android: normalizeStoreSubmit({ data: job({ platform: 'android', status: 'submitting' }) }),
  ios: normalizeStoreSubmit({ data: job({ status: 'queued' }) }),
});
assert.equal(homeSubmitTitle(movingHome), 'Sending to the store');
assert.equal(movingHome.length, 2);
assert.equal(homeSubmitTitle([]), null);

const started = interpretSubmitStart(201, {
  success: true,
  data: job({ status: 'failed', message: PEM, easBuildId: 'hidden' }),
});
assert.equal(started.kind, 'job');
if (started.kind === 'job') {
  assert.equal(started.job.status, 'failed');
  assert.equal(started.job.message, null);
  assert.equal(JSON.stringify(started.job).includes('hidden'), false);
}

const inProgress = interpretSubmitStart(409, {
  success: false,
  error: 'A submit is already in progress for this platform.',
  code: 'SUBMIT_ALREADY_IN_PROGRESS',
  data: job({ status: 'queued' }),
});
assert.equal(inProgress.kind, 'job');
if (inProgress.kind === 'job') assert.equal(inProgress.job.status, 'queued');

const leaked = interpretSubmitStart(503, {
  success: false,
  error: PEM,
  code: 'SUBMIT_UNAVAILABLE',
});
assert.equal(leaked.kind, 'error');
if (leaked.kind === 'error') {
  assert.equal(leaked.message, SUBMIT_START_FAILED_MESSAGE);
  assert.equal(leaked.message.includes('BEGIN'), false);
}

const shown = interpretSubmitStart(409, {
  success: false,
  error: 'This platform does not have a finished build to submit yet.',
  code: 'SUBMIT_ARTIFACT_MISSING',
});
assert.equal(shown.kind, 'error');
if (shown.kind === 'error') {
  assert.equal(shown.message, 'This platform does not have a finished build to submit yet.');
  assert.equal(shown.code, 'SUBMIT_ARTIFACT_MISSING');
}

assert.equal(messageForSubmitFailure(401, { error: PEM }, 'start'), SUBMIT_SIGN_IN_MESSAGE);
assert.equal(messageForSubmitFailure(403, null, 'load'), 'You need to be a store admin to submit this build.');

console.log('store submit contract ok');
