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
assert.equal(populated.includes('>66f1c2e0a1b2c3d4e5f60718<'), false);
assert.equal(populated.includes('EAS'), false);
assert.equal(populated.includes('shpat_'), false);

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

const forbidden = html({ phase: 'forbidden', requests: [request] });
assert.ok(forbidden.includes('Platform ops only'));
assert.ok(forbidden.includes('store admin'));
assert.ok(forbidden.includes('Check again'));
assert.equal(forbidden.includes('Northwind'), false);
assert.equal(forbidden.includes('Apple developer invite sent.'), false);
assert.equal(forbidden.includes('northwind.myshopify.com'), false);

const error = html({ phase: 'error', loadError: 'We could not load build requests. Try again.', requests: [request] });
assert.ok(error.includes('We could not load build requests. Try again.'));
assert.ok(error.includes('Try again'));
assert.equal(error.includes('Northwind'), false);
assert.equal(error.includes('Apple developer invite sent.'), false);

const loading = html({ phase: 'loading', requests: [request] });
assert.ok(loading.includes('Loading build requests'));
assert.equal(loading.includes('Northwind'), false);

const rowError = html({ rowError: { id: request.id, message: 'That status is not allowed.' } });
assert.ok(rowError.includes('That status is not allowed.'));

const saving = html({ savingId: request.id });
assert.ok(saving.includes('Saving status...'));

console.log('admin build view ok');
