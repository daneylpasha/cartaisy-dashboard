import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConnectedHome } from '@/components/dashboard/home/ConnectedHome';
import { HomeSubmitCard } from '@/components/dashboard/home/HomeSubmitCard';
import type { BuildRequest } from '@/lib/build/contract';
import type { ConnectedHomeFacts } from '@/lib/dashboard/loadHome';
import { focusBuildRequest } from '@/lib/dashboard/homeModel';
import {
  SUBMIT_FAILED_FALLBACK_MESSAGE,
  SUBMIT_PROGRESS_ANDROID,
  SUBMIT_REVIEW_ANDROID,
  SUBMIT_REVIEW_IOS,
  homeSubmitNotices,
  type HomeSubmitNotice,
  type StoreSubmitJob,
} from '@/lib/storeSubmit/contract';
import { BUILD_MY_APP_HREF } from '@/lib/storeCredentials/contract';

const here = dirname(fileURLToPath(import.meta.url));
const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const JOB_ID = '66f1c2e0a1b2c3d4e5f60720';
const PEM = '-----BEGIN PRIVATE KEY-----\nAAAA\n-----END PRIVATE KEY-----\n';

function source(relativePath: string): string {
  return readFileSync(join(here, relativePath), 'utf8');
}

const loadHomeSource = source('../dashboard/loadHome.ts');
const cardSource = source('../../components/dashboard/home/HomeSubmitCard.tsx');
const homeSource = source('../../components/dashboard/home/ConnectedHome.tsx');
const stripSource = source('../../components/dashboard/home/GoLiveStrip.tsx');
const controlSource = source('../../components/build/StoreSubmitControl.tsx');

assert.match(loadHomeSource, /listStoreSubmits/);
assert.match(loadHomeSource, /focusBuildRequest/);
assert.match(loadHomeSource, /submitKnown/);
assert.match(homeSource, /GoLiveStrip/);
assert.doesNotMatch(homeSource, /HomeSubmitCard/);
assert.match(stripSource, /HomeSubmitCard/);
assert.match(cardSource, /BUILD_MY_APP_HREF/);
assert.doesNotMatch(cardSource, /startStoreSubmit|EXPO_TOKEN|easBuildId|easSubmissionId|private_key|shpat_/);
assert.doesNotMatch(cardSource, /console\.(log|debug|info|error|warn)/);
assert.doesNotMatch(cardSource, /appstoreconnect\.apple\.com|play\.google\.com/);
assert.doesNotMatch(controlSource, /appstoreconnect\.apple\.com|play\.google\.com/);
assert.doesNotMatch(loadHomeSource, /console\.(log|debug|info|error|warn)/);

function request(id: string, android: BuildRequest['platforms']['android']['status']): BuildRequest {
  return {
    id,
    platforms: {
      android: { status: android, installUrl: null },
      ios: { status: 'not_requested', installUrl: null },
    },
    accessNotes: null,
  };
}

const olderBuilding = request('66f1c2e0a1b2c3d4e5f60719', 'building');
const latestReady = request(REQUEST_ID, 'ready');
assert.equal(focusBuildRequest([latestReady, olderBuilding])?.id, olderBuilding.id);
assert.equal(focusBuildRequest([latestReady])?.id, REQUEST_ID);
assert.equal(focusBuildRequest([]), null);

function job(platform: 'ios' | 'android', status: StoreSubmitJob['status'], message: string | null = null): StoreSubmitJob {
  return {
    id: JOB_ID,
    buildRequestId: REQUEST_ID,
    platform,
    status,
    createdAt: '2026-09-28T20:00:00.000Z',
    updatedAt: '2026-09-28T20:00:00.000Z',
    message,
  };
}

function facts(submitNotices: HomeSubmitNotice[], installs: ConnectedHomeFacts['installs'] = []): ConnectedHomeFacts {
  return {
    syncLabel: 'Synced',
    syncDetail: null,
    buildLabel: 'iOS · Ready',
    buildDetail: null,
    buildState: 'present',
    productCount: null,
    orderCount: null,
    modules: { kind: 'empty' },
    activity: null,
    next: null,
    catalogBlock: null,
    installs,
    previewBuilding: false,
    submitNotices,
    submitKnown: true,
    homeLayout: null,
    syncState: 'succeeded',
    catalogEligible: true,
    brand: { known: true, displayName: 'Northwind', hasIcon: true },
    accounts: { known: true, apple: 'connected', google: 'connected' },
    previewPhase: installs.length > 0 ? 'ready' : 'none',
  };
}

function home(submitNotices: HomeSubmitNotice[], installs: ConnectedHomeFacts['installs'] = []): string {
  return renderToStaticMarkup(
    createElement(ConnectedHome, { storeName: 'Northwind', shop: 'northwind.myshopify.com', facts: facts(submitNotices, installs) })
  );
}

const quiet = home([]);
assert.equal(quiet.includes('data-home-submit'), false);
assert.equal(quiet.includes('Sent for review'), false);

const sent = homeSubmitNotices({ android: null, ios: job('ios', 'submitted') });
const sentHome = home(sent);
assert.equal((sentHome.match(/data-home-submit/g) ?? []).length, 1);
assert.match(sentHome, /Sent for review/);
assert.match(sentHome, /Sent to App Store Connect/);
assert.match(sentHome, new RegExp(SUBMIT_REVIEW_IOS.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(sentHome, new RegExp(`href="${BUILD_MY_APP_HREF.replace('?', '\\?')}"`));
assert.match(sentHome, /Open Build/);
assert.equal(sentHome.includes('Open Build to try again'), false);
assert.equal(sentHome.includes('Submit to App Store'), false);
assert.equal(sentHome.includes('https://'), false);
assert.doesNotMatch(sentHome, /cartaisy/i);
assert.equal(sentHome.includes(JOB_ID), false);

const failed = homeSubmitNotices({
  android: job('android', 'failed', PEM),
  ios: null,
});
assert.equal(failed[0]?.body, SUBMIT_FAILED_FALLBACK_MESSAGE);
const failedHome = home(failed);
assert.match(failedHome, /A submit needs another try/);
assert.match(failedHome, /Open Build to try again/);
assert.equal(failedHome.includes('BEGIN'), false);
assert.equal(failedHome.includes('Play Console'), false);

const sending = home(homeSubmitNotices({ android: job('android', 'submitting'), ios: null }));
assert.match(sending, /Sending to the store/);
assert.match(sending, new RegExp(SUBMIT_PROGRESS_ANDROID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.equal(sending.includes('Sent for review'), false);

const play = renderToStaticMarkup(
  createElement(HomeSubmitCard, {
    notices: homeSubmitNotices({ android: job('android', 'submitted'), ios: null }),
  })
);
assert.match(play, /Sent to Google Play/);
assert.match(play, new RegExp(SUBMIT_REVIEW_ANDROID.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
assert.match(play, /internal testing track/);
assert.equal(play.includes('https://'), false);
assert.doesNotMatch(play, /cartaisy/i);

const alongside = home(sent, [{ platform: 'ios', label: 'iOS', url: 'https://expo.dev/accounts/northwind/builds/ios' }]);
assert.match(alongside, /data-home-install/);
assert.match(alongside, /data-home-submit/);

console.log('store submit home ok');
