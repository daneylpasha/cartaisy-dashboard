import assert from 'node:assert/strict';
import {
  ADMIN_BUILD_PAGE_LIMIT,
  OPEN_BUILD_STATUSES,
  adminBuildRequestsPath,
  adminBuildStatusPath,
  applyStatusSnapshot,
  normalizeAdminBuildPage,
  normalizeAdminStatusSnapshot,
  appNameEnvAssignment,
  easEnvAssignments,
  opsAppName,
  opsBrandImageUrl,
  opsPlatformStatusLabel,
  opsStoreId,
  iconEnvAssignment,
  splashEnvAssignment,
  storeIdEnvAssignment,
  statusPatchBody,
  type AdminBuildRequest,
} from './adminContract.ts';

const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const STORE_ID = '66f1c2e0a1b2c3d4e5f60710';

const sample = {
  id: REQUEST_ID,
  storeId: STORE_ID,
  store: {
    id: STORE_ID,
    name: 'Northwind',
    domain: 'northwind.myshopify.com',
  },
  requestedBy: '66f1c2e0a1b2c3d4e5f60711',
  platforms: {
    android: { status: 'queued', updatedAt: '2026-09-23T20:00:00.000Z' },
    ios: { status: 'waiting_on_merchant', updatedAt: '2026-09-23T21:00:00.000Z' },
  },
  checklist: { accessNotes: 'Apple developer invite sent.' },
  createdAt: '2026-09-23T20:00:00.000Z',
  updatedAt: '2026-09-23T21:00:00.000Z',
};

const page = normalizeAdminBuildPage({
  success: true,
  data: {
    requests: [sample],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  },
});

assert.ok(page);
assert.equal(page?.requests.length, 1);
const first = page?.requests[0];
assert.equal(first?.id, REQUEST_ID);
assert.equal(first?.storeName, 'Northwind');
assert.equal(first?.storeDomain, 'northwind.myshopify.com');
assert.equal(first?.appName, null);
assert.equal(first?.storeId, STORE_ID);
assert.equal(first?.id === first?.storeId, false);
assert.equal(first?.iconUrl, null);
assert.equal(first?.splashUrl, null);
assert.equal(first?.accessNotes, 'Apple developer invite sent.');
assert.equal(first?.platforms.android.status, 'queued');
assert.equal(first?.platforms.ios.status, 'waiting_on_merchant');
assert.equal(JSON.stringify(first).includes('requestedBy'), false);

const empty = normalizeAdminBuildPage({
  success: true,
  data: {
    requests: [],
    pagination: { page: 1, limit: 20, total: 0, pages: 0 },
  },
});
assert.deepEqual(empty, {
  requests: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
});

const missingStore = normalizeAdminBuildPage({
  data: {
    requests: [
      {
        ...sample,
        store: { id: STORE_ID, name: null, domain: null },
        checklist: { accessNotes: '   ' },
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  },
});
assert.equal(missingStore?.requests[0]?.storeName, null);
assert.equal(missingStore?.requests[0]?.storeDomain, null);
assert.equal(missingStore?.requests[0]?.appName, null);
assert.equal(missingStore?.requests[0]?.storeId, STORE_ID);
assert.equal(missingStore?.requests[0]?.iconUrl, null);
assert.equal(missingStore?.requests[0]?.splashUrl, null);
assert.equal(missingStore?.requests[0]?.accessNotes, null);

const ICON_URL = 'https://cdn.example/icon.png';
const SPLASH_URL = 'https://cdn.example/splash.png';
const branded = normalizeAdminBuildPage({
  data: {
    requests: [
      {
        ...sample,
        store: {
          id: STORE_ID,
          name: 'Northwind',
          domain: 'northwind.myshopify.com',
          appName: '  Northwind  ',
          iconUrl: `  ${ICON_URL}  `,
          splashUrl: SPLASH_URL,
        },
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  },
});
assert.equal(branded?.requests[0]?.appName, 'Northwind');
assert.equal(branded?.requests[0]?.storeId, STORE_ID);
assert.equal(branded?.requests[0]?.storeName, 'Northwind');
assert.equal(branded?.requests[0]?.iconUrl, ICON_URL);
assert.equal(branded?.requests[0]?.splashUrl, SPLASH_URL);
assert.equal(iconEnvAssignment(ICON_URL), `ICON_IMAGE_URL=${ICON_URL}`);
assert.equal(splashEnvAssignment(SPLASH_URL), `SPLASH_IMAGE_URL=${SPLASH_URL}`);
assert.equal(appNameEnvAssignment('Harbor & Co'), 'APP_NAME=Harbor & Co');
assert.equal(appNameEnvAssignment('Harbor & Co').includes('"'), false);
assert.equal(appNameEnvAssignment('Harbor & Co').includes("'"), false);
assert.equal(storeIdEnvAssignment(STORE_ID), `EXPO_PUBLIC_STORE_ID=${STORE_ID}`);
assert.equal(storeIdEnvAssignment(STORE_ID).includes('"'), false);
assert.equal(storeIdEnvAssignment(STORE_ID).includes("'"), false);
const fullEasEnv = [
  'APP_NAME=Harbor & Co',
  `ICON_IMAGE_URL=${ICON_URL}`,
  `SPLASH_IMAGE_URL=${SPLASH_URL}`,
  `EXPO_PUBLIC_STORE_ID=${STORE_ID}`,
].join('\n');
assert.equal(
  easEnvAssignments({
    appName: '  Harbor & Co  ',
    iconUrl: `  ${ICON_URL}  `,
    splashUrl: SPLASH_URL,
    storeId: `  ${STORE_ID}  `,
  }),
  fullEasEnv,
);
assert.equal(fullEasEnv.includes('\r'), false);
assert.equal(fullEasEnv.includes('"'), false);
assert.equal(fullEasEnv.includes("'"), false);
assert.equal(fullEasEnv.endsWith('\n'), false);
const STORE_ID_UPPER = '66F1C2E0A1B2C3D4E5F60710';
assert.equal(
  easEnvAssignments({
    appName: 'Harbor',
    splashUrl: SPLASH_URL,
    storeId: STORE_ID_UPPER,
  }),
  ['APP_NAME=Harbor', `SPLASH_IMAGE_URL=${SPLASH_URL}`, `EXPO_PUBLIC_STORE_ID=${STORE_ID_UPPER}`].join('\n'),
);
assert.equal(easEnvAssignments({ iconUrl: ICON_URL }), `ICON_IMAGE_URL=${ICON_URL}`);
const iconOnlyEnv = easEnvAssignments({
  appName: '  ',
  iconUrl: ICON_URL,
  splashUrl: 'http://cdn.example/splash.png',
  storeId: 'northwind.myshopify.com',
});
assert.equal(iconOnlyEnv, `ICON_IMAGE_URL=${ICON_URL}`);
assert.equal(iconOnlyEnv?.includes('Cartaisy'), false);
assert.equal(iconOnlyEnv?.includes(REQUEST_ID), false);
assert.equal(iconOnlyEnv?.includes('northwind'), false);
assert.equal(
  easEnvAssignments({
    appName: ' \n\t ',
    iconUrl: 'https://cdn.example/icon.png?access_token=shpat_secret',
    splashUrl: 'https://ops:upload-secret@cdn.example/splash.png',
    storeId: 'northwind.myshopify.com',
  }),
  null,
);
assert.equal(easEnvAssignments({ appName: '', iconUrl: '', splashUrl: '', storeId: '' }), null);
assert.equal(easEnvAssignments({ storeId: REQUEST_ID.slice(0, 23), appName: '   ' }), null);
assert.equal(easEnvAssignments({ storeId: `${REQUEST_ID}zz`, iconUrl: 'blob:http://localhost/preview' }), null);
assert.equal(opsAppName('  Harbor & Co  '), 'Harbor & Co');
assert.equal(opsAppName('   '), null);
assert.equal(opsAppName(''), null);
assert.equal(opsAppName(null), null);
assert.equal(opsAppName(undefined), null);
assert.equal(opsStoreId(`  ${STORE_ID}  `), STORE_ID);
assert.equal(opsStoreId(STORE_ID_UPPER), STORE_ID_UPPER);
assert.equal(opsStoreId(''), null);
assert.equal(opsStoreId('   '), null);
assert.equal(opsStoreId(null), null);
assert.equal(opsStoreId(undefined), null);
assert.equal(opsStoreId('northwind.myshopify.com'), null);
assert.equal(opsStoreId('Harbor & Co'), null);
assert.equal(opsStoreId(REQUEST_ID.slice(0, 23)), null);
assert.equal(opsStoreId(`${STORE_ID}a`), null);

const blankAppName = normalizeAdminBuildPage({
  data: {
    requests: [
      {
        ...sample,
        store: {
          id: STORE_ID,
          name: 'Northwind',
          domain: 'northwind.myshopify.com',
          appName: ' \n\t ',
        },
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  },
});
assert.equal(blankAppName?.requests[0]?.appName, null);
assert.equal(blankAppName?.requests[0]?.storeId, STORE_ID);
assert.equal(blankAppName?.requests[0]?.storeName, 'Northwind');
assert.equal(blankAppName?.requests[0]?.storeDomain, 'northwind.myshopify.com');
const blankBody = JSON.stringify(blankAppName);
assert.equal(blankBody.includes('Cartaisy'), false);
assert.equal(blankBody.includes('APP_NAME'), false);

function pageForStore(store: unknown, id = REQUEST_ID) {
  return normalizeAdminBuildPage({
    data: {
      requests: [{ ...sample, id, store }],
      pagination: { page: 1, limit: 20, total: 1, pages: 1 },
    },
  });
}

const paddedStoreId = pageForStore({
  id: `  ${STORE_ID}\n`,
  name: 'Northwind',
  domain: 'northwind.myshopify.com',
});
assert.equal(paddedStoreId?.requests[0]?.storeId, STORE_ID);

const upperStoreId = pageForStore({
  id: STORE_ID_UPPER,
  name: 'Northwind',
  domain: 'northwind.myshopify.com',
});
assert.equal(upperStoreId?.requests[0]?.storeId, STORE_ID_UPPER);
assert.equal(storeIdEnvAssignment(upperStoreId?.requests[0]?.storeId ?? ''), `EXPO_PUBLIC_STORE_ID=${STORE_ID_UPPER}`);

const missingStoreId = pageForStore({
  name: 'Northwind',
  domain: 'northwind.myshopify.com',
  appName: 'Harbor',
});
assert.equal(missingStoreId?.requests[0]?.storeId, null);
assert.equal(missingStoreId?.requests[0]?.id, REQUEST_ID);
assert.equal(missingStoreId?.requests[0]?.appName, 'Harbor');
assert.equal(missingStoreId?.requests[0]?.storeDomain, 'northwind.myshopify.com');
assert.equal(JSON.stringify(missingStoreId?.requests[0]).includes(STORE_ID), false);
assert.notEqual(missingStoreId?.requests[0]?.storeId, REQUEST_ID);

const domainAsId = pageForStore({
  id: 'northwind.myshopify.com',
  name: 'Northwind',
  domain: 'northwind.myshopify.com',
  appName: 'Harbor',
});
assert.equal(domainAsId?.requests[0]?.storeId, null);
assert.equal(domainAsId?.requests[0]?.storeDomain, 'northwind.myshopify.com');
assert.equal(domainAsId?.requests[0]?.appName, 'Harbor');
assert.equal(domainAsId?.requests[0]?.id, REQUEST_ID);

const nameAsId = pageForStore({
  id: 'Harbor & Co',
  name: 'Northwind',
  domain: 'northwind.myshopify.com',
  appName: 'Harbor & Co',
});
assert.equal(nameAsId?.requests[0]?.storeId, null);
assert.equal(nameAsId?.requests[0]?.appName, 'Harbor & Co');
assert.equal(nameAsId?.requests[0]?.storeName, 'Northwind');

const requestIdAsFallback = pageForStore({
  name: 'Northwind',
  domain: 'northwind.myshopify.com',
});
assert.equal(requestIdAsFallback?.requests[0]?.storeId, null);
assert.notEqual(requestIdAsFallback?.requests[0]?.storeId, REQUEST_ID);

const leakedQuery = 'https://cdn.example/icon.png?access_token=shpat_secret';
const httpSplash = 'http://cdn.example/splash.png';
const userinfoIcon = 'https://ops:upload-secret@cdn.example/icon.png';
const signedSplash = 'https://cdn.example/splash.png?api_key=123&api_secret=signedsecret';
const unsafe = normalizeAdminBuildPage({
  data: {
    requests: [
      {
        ...sample,
        store: {
          name: 'Northwind',
          domain: 'northwind.myshopify.com',
          appName: 'Northwind',
          iconUrl: leakedQuery,
          splashUrl: httpSplash,
        },
      },
      {
        ...sample,
        id: '66f1c2e0a1b2c3d4e5f60719',
        store: {
          name: 'Harbor',
          domain: 'harbor.myshopify.com',
          iconUrl: userinfoIcon,
          splashUrl: signedSplash,
        },
      },
    ],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
  },
});
assert.equal(unsafe?.requests[0]?.iconUrl, null);
assert.equal(unsafe?.requests[0]?.splashUrl, null);
assert.equal(unsafe?.requests[0]?.storeId, null);
assert.equal(unsafe?.requests[1]?.iconUrl, null);
assert.equal(unsafe?.requests[1]?.splashUrl, null);
assert.equal(unsafe?.requests[1]?.appName, null);
assert.equal(unsafe?.requests[1]?.storeId, null);
const unsafeBody = JSON.stringify(unsafe);
assert.equal(unsafeBody.includes(STORE_ID), false);
assert.equal(unsafeBody.includes('shpat_'), false);
assert.equal(unsafeBody.includes('access_token'), false);
assert.equal(unsafeBody.includes(httpSplash), false);
assert.equal(unsafeBody.includes('upload-secret'), false);
assert.equal(unsafeBody.includes('api_secret'), false);
assert.equal(unsafeBody.includes('api_key'), false);
assert.equal(opsBrandImageUrl('blob:http://localhost/1'), null);
assert.equal(opsBrandImageUrl(null), null);
assert.equal(opsBrandImageUrl(undefined), null);

const skipped = normalizeAdminBuildPage({
  data: {
    requests: [{ id: 'not-an-id' }, sample],
    pagination: { page: 1, limit: 20, total: 2, pages: 1 },
  },
});
assert.equal(skipped?.requests.length, 1);

assert.equal(normalizeAdminBuildPage({ data: { requests: [] } }), null);
assert.equal(normalizeAdminBuildPage({ success: false, error: 'Platform admin access required' }), null);

const openPath = adminBuildRequestsPath({ page: 1, limit: ADMIN_BUILD_PAGE_LIMIT, filter: 'open' });
assert.equal(openPath.startsWith('/admin/build-requests?'), true);
const openQuery = new URLSearchParams(openPath.split('?')[1]);
assert.equal(openQuery.get('page'), '1');
assert.equal(openQuery.get('limit'), '20');
assert.equal(openQuery.get('status'), OPEN_BUILD_STATUSES.join(','));
assert.equal(openQuery.has('storeId'), false);
assert.equal(openQuery.has('platform'), false);

const allPath = adminBuildRequestsPath({ page: 2, limit: 1, filter: 'all' });
const allQuery = new URLSearchParams(allPath.split('?')[1]);
assert.equal(allQuery.get('page'), '2');
assert.equal(allQuery.get('limit'), '1');
assert.equal(allQuery.has('status'), false);

assert.equal(adminBuildStatusPath(REQUEST_ID), `/admin/build-requests/${REQUEST_ID}/status`);
assert.deepEqual(statusPatchBody('android', 'ready'), { android: { status: 'ready' } });
assert.equal(JSON.stringify(statusPatchBody('ios', 'failed')).includes('android'), false);

assert.equal(opsPlatformStatusLabel('android', 'waiting_on_merchant'), 'Waiting on merchant');
assert.equal(opsPlatformStatusLabel('ios', 'waiting_on_merchant'), 'Waiting on Apple');
assert.equal(opsPlatformStatusLabel('android', 'ready'), 'Ready');
assert.equal(opsPlatformStatusLabel('ios', 'building'), 'Building');
assert.equal(opsPlatformStatusLabel('android', 'queued'), 'Queued');
assert.equal(opsPlatformStatusLabel('ios', 'failed'), 'Failed');

const snapshot = normalizeAdminStatusSnapshot({
  success: true,
  data: {
    ...sample,
    store: undefined,
    platforms: {
      android: { status: 'ready', updatedAt: '2026-09-23T22:00:00.000Z' },
      ios: sample.platforms.ios,
    },
    updatedAt: '2026-09-23T22:00:00.000Z',
  },
});
assert.ok(snapshot);
assert.ok(first);
const brandedFirst = branded?.requests[0];
assert.ok(brandedFirst);
const merged = applyStatusSnapshot(brandedFirst as AdminBuildRequest, snapshot!);
assert.equal(merged.storeName, 'Northwind');
assert.equal(merged.storeDomain, 'northwind.myshopify.com');
assert.equal(merged.appName, 'Northwind');
assert.equal(merged.storeId, STORE_ID);
assert.equal(merged.iconUrl, ICON_URL);
assert.equal(merged.splashUrl, SPLASH_URL);
assert.equal(merged.platforms.android.status, 'ready');
assert.equal(merged.platforms.ios.status, 'waiting_on_merchant');
assert.equal(merged.accessNotes, 'Apple developer invite sent.');

console.log('admin build contract ok');
