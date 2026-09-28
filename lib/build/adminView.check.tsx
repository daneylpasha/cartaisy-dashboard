import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { BuildRequestsQueue, type BuildRequestsQueueProps } from '../../components/admin/BuildRequestsQueue.tsx';
import type { AdminBuildRequest } from './adminContract.ts';

const noop = () => {};

const request: AdminBuildRequest = {
  id: '66f1c2e0a1b2c3d4e5f60718',
  storeName: 'Northwind',
  storeDomain: 'northwind.myshopify.com',
  platforms: {
    android: { status: 'queued', updatedAt: '2026-09-23T20:00:00.000Z' },
    ios: { status: 'waiting_on_merchant', updatedAt: '2026-09-23T21:00:00.000Z' },
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
assert.equal(populated.includes('>66f1c2e0a1b2c3d4e5f60718<'), false);
assert.equal(populated.includes('EAS'), false);
assert.equal(populated.includes('SPLASH_IMAGE_URL'), false);
assert.equal(populated.includes('ICON_IMAGE_URL'), false);
assert.equal(populated.includes('<img'), false);
assert.equal(populated.includes('shpat_'), false);
assert.equal(populated.includes('Cartaisy'), false);

const ICON_URL = 'https://cdn.example/icon.png';
const SPLASH_URL = 'https://cdn.example/splash.png';
const branded = html({
  requests: [{ ...request, appName: 'Northwind', iconUrl: ICON_URL, splashUrl: SPLASH_URL }],
});
assert.ok(branded.includes(`src="${ICON_URL}"`));
assert.ok(branded.includes(`src="${SPLASH_URL}"`));
assert.ok(branded.includes('SPLASH_IMAGE_URL=…'));
assert.ok(branded.includes('>EAS<'));
assert.ok(branded.includes(`data-copy="SPLASH_IMAGE_URL=${SPLASH_URL}"`));
assert.ok(branded.includes(`data-copy="ICON_IMAGE_URL=${ICON_URL}"`));
assert.ok(branded.includes('ICON_IMAGE_URL=…'));
assert.equal(branded.includes('No icon'), false);
assert.equal(branded.includes('No splash'), false);
assert.equal(branded.includes('Cartaisy'), false);
assert.equal(branded.includes('shpat_'), false);

const iconOnly = html({
  requests: [{ ...request, iconUrl: ICON_URL }],
});
assert.ok(iconOnly.includes(`data-copy="ICON_IMAGE_URL=${ICON_URL}"`));
assert.ok(iconOnly.includes('ICON_IMAGE_URL=…'));
assert.ok(iconOnly.includes('No splash'));
assert.equal(iconOnly.includes('SPLASH_IMAGE_URL'), false);

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
assert.equal(poisoned.includes('<img'), false);
assert.equal(poisoned.includes('EAS'), false);

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
  requests: [{ ...request, iconUrl: ICON_URL, splashUrl: SPLASH_URL }],
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

const error = html({
  phase: 'error',
  loadError: 'We could not load build requests. Try again.',
  requests: [{ ...request, iconUrl: ICON_URL, splashUrl: SPLASH_URL }],
});
assert.ok(error.includes('We could not load build requests. Try again.'));
assert.ok(error.includes('Try again'));
assert.equal(error.includes('Northwind'), false);
assert.equal(error.includes('Apple developer invite sent.'), false);
assert.equal(error.includes(SPLASH_URL), false);

const loading = html({ phase: 'loading', requests: [{ ...request, splashUrl: SPLASH_URL }] });
assert.ok(loading.includes('Loading build requests'));
assert.equal(loading.includes('Northwind'), false);
assert.equal(loading.includes(SPLASH_URL), false);

const rowError = html({ rowError: { id: request.id, message: 'That status is not allowed.' } });
assert.ok(rowError.includes('That status is not allowed.'));

const saving = html({ savingId: request.id });
assert.ok(saving.includes('Saving status...'));

console.log('admin build view ok');
