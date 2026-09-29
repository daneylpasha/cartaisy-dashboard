import assert from 'node:assert/strict';
import {
  brandStepLead,
  installPreviewFromList,
  installPreviewMode,
  installPreviewWhileLoading,
  previewStepLead,
  readyInstallsFromList,
  readyInstallsFromRequest,
  settingsBrandLead,
  showsBrandMock,
  type InstallPreviewModel,
} from '@/lib/build/installPreview';
import type { BuildRequest, PlatformStatus } from '@/lib/build/contract';

const ANDROID = 'https://expo.dev/accounts/northwind/builds/android';
const IOS = 'https://u.expo.dev/artifact/ios';

function request(
  id: string,
  android: PlatformStatus,
  ios: PlatformStatus,
  urls?: { android?: string | null; ios?: string | null }
): BuildRequest {
  return {
    id,
    platforms: {
      android: { status: android, installUrl: urls?.android ?? null },
      ios: { status: ios, installUrl: urls?.ios ?? null },
    },
    accessNotes: null,
  };
}

const both = readyInstallsFromRequest(
  request('66f1c2e0a1b2c3d4e5f60718', 'ready', 'ready', { android: ANDROID, ios: IOS })
);
assert.deepEqual(
  both.map((install) => install.platform),
  ['android', 'ios']
);
assert.equal(both[0]?.url, ANDROID);
assert.equal(both[1]?.url, IOS);

const androidOnly = readyInstallsFromRequest(
  request('66f1c2e0a1b2c3d4e5f60719', 'ready', 'building', { android: ANDROID, ios: IOS })
);
assert.deepEqual(androidOnly.map((install) => install.url), [ANDROID]);

const unsafe = readyInstallsFromRequest(
  request('66f1c2e0a1b2c3d4e5f6071a', 'ready', 'ready', {
    android: 'http://expo.dev/accounts/northwind/builds/android',
    ios: 'https://user:pass@expo.dev/artifact',
  })
);
assert.deepEqual(unsafe, []);

const secret = readyInstallsFromRequest(
  request('66f1c2e0a1b2c3d4e5f6071b', 'ready', 'not_requested', {
    android: 'https://expo.dev/accounts/northwind/builds/shpat_secret',
  })
);
assert.deepEqual(secret, []);

const missing = readyInstallsFromRequest(request('66f1c2e0a1b2c3d4e5f6071c', 'ready', 'ready'));
assert.deepEqual(missing, []);

const newerFirst = readyInstallsFromList([
  request('66f1c2e0a1b2c3d4e5f6071d', 'building', 'ready', { ios: IOS }),
  request('66f1c2e0a1b2c3d4e5f6071e', 'ready', 'ready', {
    android: ANDROID,
    ios: 'https://expo.dev/accounts/northwind/builds/older-ios',
  }),
]);
assert.equal(newerFirst.find((install) => install.platform === 'android')?.url, ANDROID);
assert.equal(newerFirst.find((install) => install.platform === 'ios')?.url, IOS);

assert.equal(showsBrandMock(undefined), true);
assert.equal(showsBrandMock({ phase: 'loading', installs: [] }), false);
assert.equal(showsBrandMock({ phase: 'unavailable', installs: [] }), true);
assert.equal(showsBrandMock({ phase: 'ready', installs: [] }), true);
assert.equal(showsBrandMock({ phase: 'ready', installs: both }), false);
assert.equal(installPreviewMode({ phase: 'loading', installs: [] }), 'loading');
assert.equal(installPreviewMode({ phase: 'unavailable', installs: [] }), 'mock');
assert.equal(installPreviewMode({ phase: 'ready', installs: both }), 'install');

const empty: InstallPreviewModel = { phase: 'ready', installs: [] };
assert.deepEqual(installPreviewWhileLoading(empty), { phase: 'loading', installs: [] });
const known: InstallPreviewModel = { phase: 'ready', installs: both };
assert.deepEqual(installPreviewWhileLoading(known), known);

const failed = installPreviewFromList(empty, { kind: 'error' });
assert.deepEqual(failed, { phase: 'unavailable', installs: [] });
assert.equal(showsBrandMock(failed), true);

const kept = installPreviewFromList(known, { kind: 'error' });
assert.deepEqual(kept, known);
assert.equal(showsBrandMock(kept), false);

const loaded = installPreviewFromList(empty, {
  kind: 'ok',
  requests: [request('66f1c2e0a1b2c3d4e5f6071f', 'ready', 'not_requested', { android: ANDROID })],
});
assert.equal(loaded.phase, 'ready');
assert.equal(loaded.installs.length, 1);
assert.equal(showsBrandMock(loaded), false);

assert.match(brandStepLead(undefined), /The phone uses this draft/);
assert.doesNotMatch(brandStepLead({ phase: 'loading', installs: [] }), /The phone uses this draft/);
assert.match(brandStepLead(known), /Scan the code/);
assert.match(settingsBrandLead(undefined), /under the phone/);
assert.doesNotMatch(settingsBrandLead(known), /under the phone/);
assert.match(previewStepLead(undefined), /These screens follow the shopper app/);
assert.match(previewStepLead({ phase: 'loading', installs: [] }), /Checking whether an installable build is ready/);
assert.match(previewStepLead(known), /open Build/);
assert.doesNotMatch(previewStepLead(known), /These screens follow the shopper app/);

console.log('install preview ok');
