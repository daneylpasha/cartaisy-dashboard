import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { BuildMyAppView, type BuildMyAppViewProps } from '../../components/onboarding/BuildMyAppView.tsx';
import type { BuildRequest } from './contract.ts';

const noop = () => {};

const eligible = {
  enabled: true,
  reason: null,
  action: null,
} as const;

const base: BuildMyAppViewProps = {
  phase: 'ready',
  loadError: null,
  availability: eligible,
  mode: 'compose',
  request: null,
  android: true,
  ios: true,
  accessNotes: '',
  submitting: false,
  syncBusy: false,
  noteSaving: false,
  formError: null,
  onAndroidChange: noop,
  onIosChange: noop,
  onNotesChange: noop,
  onNotesBlur: noop,
  onPrimary: noop,
  onRequestAnother: noop,
  onCancelAnother: noop,
  onRetry: noop,
};

function html(overrides: Partial<BuildMyAppViewProps>): string {
  return renderToStaticMarkup(createElement(BuildMyAppView, { ...base, ...overrides }));
}

function request(android: BuildRequest['platforms']['android']['status'], ios: BuildRequest['platforms']['ios']['status']): BuildRequest {
  return {
    id: '66f1c2e0a1b2c3d4e5f60718',
    platforms: {
      android: { status: android },
      ios: { status: ios },
    },
    accessNotes: 'Apple developer invite sent.',
  };
}

const forbidden = ['EAS', 'runbook', 'shpat_', 'easBuildId', '66f1c2e0a1b2c3d4e5f60718', 'accessToken'];

function assertCalm(markup: string) {
  for (const word of forbidden) {
    assert.equal(markup.includes(word), false, `screen leaked ${word}`);
  }
}

function buttonTag(markup: string, label: string): string {
  const match = markup.match(new RegExp(`<button[^>]*>${label}</button>`));
  assert.ok(match, `missing button ${label}`);
  return match?.[0] ?? '';
}

function isDisabled(tag: string): boolean {
  return / disabled(?:=|>|\s)/.test(tag);
}

const disconnected = html({
  availability: {
    enabled: false,
    action: 'connect',
    reason: 'Connect Shopify before requesting a build.',
  },
  android: false,
  ios: false,
});
assert.ok(disconnected.includes('Connect Shopify'));
assert.ok(disconnected.includes('Connect Shopify before requesting a build.'));
assert.equal(disconnected.includes('>Build my app<'), false);
assertCalm(disconnected);

const needsSync = html({
  availability: {
    enabled: false,
    action: 'sync',
    reason: 'Your catalog has not synced yet. Use Sync again.',
  },
});
assert.ok(needsSync.includes('>Sync again<'));
assert.equal(needsSync.includes('>Build my app<'), false);
assertCalm(needsSync);

const syncing = html({
  availability: {
    enabled: false,
    action: 'sync',
    reason: 'Syncing your catalog…',
  },
  syncBusy: true,
});
assert.equal(isDisabled(buttonTag(syncing, 'Sync again')), true);
assert.ok(syncing.includes('Syncing your catalog'));
assertCalm(syncing);

const readyToSubmit = html({});
assert.equal(isDisabled(buttonTag(readyToSubmit, 'Build my app')), false);
assertCalm(readyToSubmit);

const neither = html({ android: false, ios: false });
assert.equal(isDisabled(buttonTag(neither, 'Build my app')), true);
assertCalm(neither);

const waiting = html({
  mode: 'status',
  request: request('waiting_on_merchant', 'waiting_on_merchant'),
  accessNotes: 'Apple developer invite sent.',
});
assert.ok(waiting.includes('Waiting on you'));
assert.ok(waiting.includes('Waiting on Apple'));
assert.equal((waiting.match(/checked=""/g) ?? []).length, 2);
assert.equal(waiting.includes('>Build my app<'), false);
assert.ok(waiting.includes('Apple developer invite sent.'));
assertCalm(waiting);

const mixed = html({
  mode: 'status',
  request: request('ready', 'building'),
});
assert.ok(mixed.includes('Ready'));
assert.ok(mixed.includes('Building'));
assert.equal(mixed.includes('Request another build'), false);
assertCalm(mixed);

const settled = html({
  mode: 'status',
  request: request('ready', 'failed'),
});
assert.ok(settled.includes('One app is ready. The other did not finish.'));
assert.ok(settled.includes('Request another build'));
assert.ok(settled.includes('Failed'));
assertCalm(settled);

const recheck = html({
  availability: {
    enabled: false,
    action: 'retry',
    reason: 'We could not confirm your catalog sync. Try again.',
  },
  rechecking: true,
});
assert.equal(isDisabled(buttonTag(recheck, 'Checking...')), true);
assert.equal(recheck.includes('>Try again<'), false);
assert.ok(recheck.includes('We could not confirm your catalog sync. Try again.'));
assertCalm(recheck);

const noteLimit = html({ accessNotes: 'Hello' });
assert.ok(noteLimit.includes('maxLength="280"') || noteLimit.includes('maxlength="280"'));
assertCalm(noteLimit);

console.log('build view ok');
