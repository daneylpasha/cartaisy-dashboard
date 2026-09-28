import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { BuildRequestsQueue, type BuildRequestsQueueProps } from '../../components/admin/BuildRequestsQueue.tsx';
import type { AdminBuildRequest } from './adminContract.ts';

const noop = () => {};

const REQUEST_ID = '66f1c2e0a1b2c3d4e5f60718';
const STORE_ID = '66f1c2e0a1b2c3d4e5f60710';

function rowHeading(markup: string): string {
  return markup.match(/<h2[^>]*>[^<]*<\/h2>/)?.[0] ?? '';
}

function withoutCopyAttrs(markup: string): string {
  return markup.replace(/ data-copy="[^"]*"/g, '').replace(/ title="[^"]*"/g, '');
}

function decodeAttr(value: string): string {
  return value
    .replace(/&#10;/g, '\n')
    .replace(/&#x0*a;/gi, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function copyValues(markup: string): string[] {
  return [...markup.matchAll(/data-copy="([^"]*)"/g)].map((match) => decodeAttr(match[1] ?? ''));
}

const request: AdminBuildRequest = {
  id: REQUEST_ID,
  storeName: 'Northwind',
  storeDomain: 'northwind.myshopify.com',
  platforms: {
    android: { status: 'queued', updatedAt: '2026-09-23T20:00:00.000Z', installUrl: null },
    ios: { status: 'waiting_on_merchant', updatedAt: '2026-09-23T21:00:00.000Z', installUrl: null },
  },
  accessNotes: 'Apple developer invite sent.',
  createdAt: '2026-09-23T20:00:00.000Z',
  updatedAt: '2026-09-23T21:00:00.000Z',
};

const base: BuildRequestsQueueProps = {
  phase: 'ready',
  filter: 'open',
  requests: [request],
  pagination: { page: 1, limit: 20, total: 1, pages: 1 },
  loadError: null,
  staleNotice: null,
  refreshing: false,
  savingId: null,
  rowError: null,
  onFilter: noop,
  onRefresh: noop,
  onRetry: noop,
  onPage: noop,
  onStatus: noop,
};

function html(overrides: Partial<BuildRequestsQueueProps>): string {
  return renderToStaticMarkup(createElement(BuildRequestsQueue, { ...base, ...overrides }));
}

const populated = html({});
assert.ok(populated.includes('Northwind'));
assert.ok(populated.includes('northwind.myshopify.com'));
assert.ok(populated.includes('Apple developer invite sent.'));
assert.ok(populated.includes('Waiting on merchant'));
assert.ok(populated.includes('Waiting on Apple'));
assert.ok(populated.includes('Queued'));
assert.ok(populated.includes('No icon'));
assert.ok(populated.includes('No splash'));
assert.equal(populated.includes(`>${REQUEST_ID}<`), false);
assert.ok(populated.includes('No app name'));
assert.ok(populated.includes('No store id'));
assert.equal(populated.includes('EAS'), false);
assert.ok(populated.includes('Install link'));
assert.ok(populated.includes('Save link'));
assert.ok(populated.includes('placeholder="https://expo.dev/…"') || populated.includes('placeholder="https://expo.dev/&#x2026;"'));
assert.equal(populated.includes('>Clear<'), false);
assert.equal(populated.includes('value="http'), false);
assert.equal(populated.includes('value="https'), false);
assert.equal(populated.includes('Copy all EAS env'), false);
assert.equal(populated.includes('APP_NAME'), false);
assert.equal(populated.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(populated.includes('data-copy'), false);
assert.equal(populated.includes('SPLASH_IMAGE_URL'), false);
assert.equal(populated.includes('ICON_IMAGE_URL'), false);
assert.equal(populated.includes('<img'), false);
assert.equal(populated.includes('shpat_'), false);
assert.equal(populated.includes('Cartaisy'), false);

const ICON_URL = 'https://cdn.example/icon.png';
const SPLASH_URL = 'https://cdn.example/splash.png';
const branded = html({
  requests: [{ ...request, appName: '  Harbor & Co  ', storeId: `  ${STORE_ID}  `, iconUrl: ICON_URL, splashUrl: SPLASH_URL }],
});
assert.ok(branded.includes(`src="${ICON_URL}"`));
assert.ok(branded.includes(`src="${SPLASH_URL}"`));
assert.ok(branded.includes('SPLASH_IMAGE_URL=…'));
assert.ok(branded.includes('>EAS<'));
assert.ok(branded.includes(`data-copy="SPLASH_IMAGE_URL=${SPLASH_URL}"`));
assert.ok(branded.includes(`data-copy="ICON_IMAGE_URL=${ICON_URL}"`));
assert.ok(branded.includes('ICON_IMAGE_URL=…'));
assert.ok(branded.includes('APP_NAME=…'));
assert.ok(branded.includes('data-copy="APP_NAME=Harbor &amp; Co"'));
assert.ok(branded.includes('EXPO_PUBLIC_STORE_ID=…'));
assert.ok(branded.includes(`data-copy="EXPO_PUBLIC_STORE_ID=${STORE_ID}"`));
assert.equal(branded.includes('APP_NAME="'), false);
assert.equal(branded.includes('APP_NAME=&quot;'), false);
assert.equal(branded.includes(`EXPO_PUBLIC_STORE_ID="${STORE_ID}"`), false);
assert.equal(branded.includes('EXPO_PUBLIC_STORE_ID=&quot;'), false);
assert.equal(branded.includes('APP_NAME=Northwind'), false);
assert.equal(branded.includes('APP_NAME=northwind.myshopify.com'), false);
assert.equal(branded.includes('APP_NAME=Cartaisy'), false);
assert.equal(branded.includes(`EXPO_PUBLIC_STORE_ID=${REQUEST_ID}`), false);
assert.equal(branded.includes('EXPO_PUBLIC_STORE_ID=northwind.myshopify.com'), false);
assert.equal(branded.includes('EXPO_PUBLIC_STORE_ID=Harbor'), false);
assert.equal(branded.includes('No app name'), false);
assert.equal(branded.includes('No store id'), false);
assert.ok(rowHeading(branded).includes('Northwind'));
assert.equal(rowHeading(branded).includes(STORE_ID), false);
assert.equal(withoutCopyAttrs(branded).includes(STORE_ID), false);
assert.equal(branded.includes('No icon'), false);
assert.equal(branded.includes('No splash'), false);
assert.equal(branded.includes('Cartaisy'), false);
assert.equal(branded.includes('shpat_'), false);
assert.ok(branded.includes('Copy all EAS env'));
const brandedBlock = [
  'APP_NAME=Harbor & Co',
  `ICON_IMAGE_URL=${ICON_URL}`,
  `SPLASH_IMAGE_URL=${SPLASH_URL}`,
  `EXPO_PUBLIC_STORE_ID=${STORE_ID}`,
].join('\n');
const brandedCopies = copyValues(branded);
assert.ok(brandedCopies.includes(brandedBlock));
assert.equal(brandedCopies.filter((value) => value.includes('\n')).length, 1);
assert.equal(brandedBlock.includes('\r'), false);
assert.equal(brandedBlock.endsWith('\n'), false);
assert.equal(brandedCopies.includes('APP_NAME=Harbor & Co'), true);
assert.equal(brandedCopies.includes(`ICON_IMAGE_URL=${ICON_URL}`), true);
assert.equal(brandedCopies.includes(`SPLASH_IMAGE_URL=${SPLASH_URL}`), true);
assert.equal(brandedCopies.includes(`EXPO_PUBLIC_STORE_ID=${STORE_ID}`), true);

const namedOnly = html({
  requests: [{ ...request, appName: 'Harbor & Co' }],
});
assert.ok(namedOnly.includes('data-copy="APP_NAME=Harbor &amp; Co"'));
assert.ok(namedOnly.includes('APP_NAME=…'));
assert.ok(namedOnly.includes('>EAS<'));
assert.ok(namedOnly.includes('Copy all EAS env'));
assert.deepEqual(
  copyValues(namedOnly).filter((value) => value.includes('\n')),
  [],
);
assert.equal(copyValues(namedOnly).filter((value) => value === 'APP_NAME=Harbor & Co').length, 2);
assert.ok(namedOnly.includes('No icon'));
assert.ok(namedOnly.includes('No splash'));
assert.ok(namedOnly.includes('No store id'));
assert.equal(namedOnly.includes('No app name'), false);
assert.equal(namedOnly.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(namedOnly.includes('ICON_IMAGE_URL'), false);
assert.equal(namedOnly.includes('SPLASH_IMAGE_URL'), false);
assert.equal(namedOnly.includes('APP_NAME=Northwind'), false);
assert.equal(namedOnly.includes('Cartaisy'), false);

const blankName = html({
  requests: [{ ...request, appName: ' \n\t ' }],
});
assert.ok(blankName.includes('No app name'));
assert.ok(blankName.includes('No store id'));
assert.ok(blankName.includes('Northwind'));
assert.equal(blankName.includes('APP_NAME'), false);
assert.equal(blankName.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(blankName.includes('data-copy'), false);
assert.equal(blankName.includes('EAS'), false);
assert.equal(blankName.includes('Copy all EAS env'), false);
assert.equal(blankName.includes('Cartaisy'), false);

const STORE_ID_UPPER = '66F1C2E0A1B2C3D4E5F60710';
const storeOnly = html({
  requests: [{ ...request, storeId: STORE_ID_UPPER }],
});
assert.ok(storeOnly.includes(`data-copy="EXPO_PUBLIC_STORE_ID=${STORE_ID_UPPER}"`));
assert.ok(storeOnly.includes('EXPO_PUBLIC_STORE_ID=…'));
assert.ok(storeOnly.includes('>EAS<'));
assert.ok(storeOnly.includes('Copy all EAS env'));
assert.equal(copyValues(storeOnly).includes(`EXPO_PUBLIC_STORE_ID=${STORE_ID_UPPER}`), true);
assert.equal(copyValues(storeOnly).some((value) => value.includes('\n')), false);
assert.ok(storeOnly.includes('No app name'));
assert.ok(storeOnly.includes('No icon'));
assert.ok(storeOnly.includes('No splash'));
assert.equal(storeOnly.includes('No store id'), false);
assert.equal(storeOnly.includes('APP_NAME'), false);
assert.equal(storeOnly.includes(`EXPO_PUBLIC_STORE_ID=${REQUEST_ID}`), false);
assert.equal(storeOnly.includes('EXPO_PUBLIC_STORE_ID=northwind.myshopify.com'), false);
assert.ok(rowHeading(storeOnly).includes('Northwind'));
assert.equal(rowHeading(storeOnly).includes(STORE_ID_UPPER), false);
assert.equal(withoutCopyAttrs(storeOnly).includes(STORE_ID_UPPER), false);

const invalidStore = html({
  requests: [{ ...request, storeId: 'northwind.myshopify.com', appName: 'Harbor' }],
});
assert.ok(invalidStore.includes('No store id'));
assert.ok(invalidStore.includes('data-copy="APP_NAME=Harbor"'));
assert.equal(invalidStore.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(invalidStore.includes('data-copy="EXPO_PUBLIC_STORE_ID='), false);

const nameAsStore = html({
  requests: [{ ...request, storeId: 'Harbor', appName: 'Harbor' }],
});
assert.ok(nameAsStore.includes('No store id'));
assert.equal(nameAsStore.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.ok(nameAsStore.includes('data-copy="APP_NAME=Harbor"'));

const requestIdAsStore = html({
  requests: [{ ...request, storeId: `${REQUEST_ID}zz` }],
});
assert.ok(requestIdAsStore.includes('No store id'));
assert.equal(requestIdAsStore.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(requestIdAsStore.includes('data-copy'), false);

const iconOnly = html({
  requests: [{ ...request, iconUrl: ICON_URL }],
});
assert.ok(iconOnly.includes(`data-copy="ICON_IMAGE_URL=${ICON_URL}"`));
assert.ok(iconOnly.includes('ICON_IMAGE_URL=…'));
assert.ok(iconOnly.includes('No splash'));
assert.ok(iconOnly.includes('No app name'));
assert.ok(iconOnly.includes('No store id'));
assert.equal(iconOnly.includes('APP_NAME'), false);
assert.equal(iconOnly.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(iconOnly.includes('SPLASH_IMAGE_URL'), false);
assert.ok(iconOnly.includes('Copy all EAS env'));
assert.equal(copyValues(iconOnly).includes(`ICON_IMAGE_URL=${ICON_URL}`), true);
assert.equal(copyValues(iconOnly).some((value) => value.includes('\n')), false);

const partial = html({
  requests: [{ ...request, iconUrl: ICON_URL, storeId: STORE_ID }],
});
assert.ok(partial.includes('Copy all EAS env'));
assert.ok(partial.includes('No app name'));
assert.ok(partial.includes('No splash'));
assert.equal(
  copyValues(partial).includes([`ICON_IMAGE_URL=${ICON_URL}`, `EXPO_PUBLIC_STORE_ID=${STORE_ID}`].join('\n')),
  true,
);
assert.equal(copyValues(partial).some((value) => value.includes('APP_NAME')), false);
assert.equal(copyValues(partial).some((value) => value.includes('SPLASH_IMAGE_URL')), false);
assert.equal(copyValues(partial).some((value) => value.includes('\n\n')), false);

const poisoned = html({
  requests: [
    {
      ...request,
      iconUrl: 'https://cdn.example/icon.png?access_token=shpat_secret',
      splashUrl: 'https://ops:upload-secret@cdn.example/splash.png',
    },
  ],
});
assert.ok(poisoned.includes('No icon'));
assert.ok(poisoned.includes('No splash'));
assert.equal(poisoned.includes('shpat_'), false);
assert.equal(poisoned.includes('upload-secret'), false);
assert.equal(poisoned.includes('access_token'), false);
assert.equal(poisoned.includes('SPLASH_IMAGE_URL'), false);
assert.equal(poisoned.includes('ICON_IMAGE_URL'), false);
assert.ok(poisoned.includes('No app name'));
assert.ok(poisoned.includes('No store id'));
assert.equal(poisoned.includes('APP_NAME'), false);
assert.equal(poisoned.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(poisoned.includes('<img'), false);
assert.equal(poisoned.includes('EAS'), false);
assert.equal(poisoned.includes('Copy all EAS env'), false);

const empty = html({
  requests: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
});
assert.ok(empty.includes('No open requests'));
assert.equal(empty.includes('Northwind'), false);
assert.equal(empty.includes('Apple developer invite sent.'), false);

const allEmpty = html({
  filter: 'all',
  requests: [],
  pagination: { page: 1, limit: 20, total: 0, pages: 0 },
});
assert.ok(allEmpty.includes('No build requests yet'));

const forbidden = html({
  phase: 'forbidden',
  requests: [{ ...request, appName: 'Harbor', storeId: STORE_ID, iconUrl: ICON_URL, splashUrl: SPLASH_URL }],
});
assert.ok(forbidden.includes('Platform ops only'));
assert.ok(forbidden.includes('store admin'));
assert.ok(forbidden.includes('Check again'));
assert.equal(forbidden.includes('Northwind'), false);
assert.equal(forbidden.includes('Apple developer invite sent.'), false);
assert.equal(forbidden.includes('northwind.myshopify.com'), false);
assert.equal(forbidden.includes(ICON_URL), false);
assert.equal(forbidden.includes(SPLASH_URL), false);
assert.equal(forbidden.includes('SPLASH_IMAGE_URL'), false);
assert.equal(forbidden.includes('ICON_IMAGE_URL'), false);
assert.equal(forbidden.includes('Copy all EAS env'), false);
assert.equal(forbidden.includes('APP_NAME'), false);
assert.equal(forbidden.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(forbidden.includes(STORE_ID), false);
assert.equal(forbidden.includes('Harbor'), false);

const error = html({
  phase: 'error',
  loadError: 'We could not load build requests. Try again.',
  requests: [{ ...request, appName: 'Harbor', storeId: STORE_ID, iconUrl: ICON_URL, splashUrl: SPLASH_URL }],
});
assert.ok(error.includes('We could not load build requests. Try again.'));
assert.ok(error.includes('Try again'));
assert.equal(error.includes('Northwind'), false);
assert.equal(error.includes('Apple developer invite sent.'), false);
assert.equal(error.includes(SPLASH_URL), false);
assert.equal(error.includes('Copy all EAS env'), false);
assert.equal(error.includes('APP_NAME'), false);
assert.equal(error.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(error.includes(STORE_ID), false);
assert.equal(error.includes('Harbor'), false);

const loading = html({
  phase: 'loading',
  requests: [{ ...request, appName: 'Harbor', storeId: STORE_ID, splashUrl: SPLASH_URL }],
});
assert.ok(loading.includes('Loading build requests'));
assert.equal(loading.includes('Northwind'), false);
assert.equal(loading.includes(SPLASH_URL), false);
assert.equal(loading.includes('Copy all EAS env'), false);
assert.equal(loading.includes('APP_NAME'), false);
assert.equal(loading.includes('EXPO_PUBLIC_STORE_ID'), false);
assert.equal(loading.includes(STORE_ID), false);
assert.equal(loading.includes('Harbor'), false);

const ANDROID_INSTALL = 'https://expo.dev/accounts/northwind/builds/android';
const withInstall = html({
  requests: [
    {
      ...request,
      platforms: {
        android: { status: 'ready', updatedAt: '2026-09-23T22:00:00.000Z', installUrl: ANDROID_INSTALL },
        ios: { status: 'queued', updatedAt: '2026-09-23T20:00:00.000Z', installUrl: 'http://expo.dev/should-not-show' },
      },
    },
  ],
});
assert.ok(withInstall.includes(`value="${ANDROID_INSTALL}"`));
assert.ok(withInstall.includes('>Clear<'));
assert.equal((withInstall.match(/>Clear</g) ?? []).length, 1);
assert.equal(withInstall.includes('http://expo.dev/should-not-show'), false);
assert.equal(withInstall.includes('shpat_'), false);
assert.ok(withInstall.includes('Save link'));

const rowError = html({ rowError: { id: request.id, message: 'That status is not allowed.' } });
assert.ok(rowError.includes('That status is not allowed.'));

const saving = html({ savingId: request.id });
assert.ok(saving.includes('Saving status...'));

console.log('admin build view ok');
